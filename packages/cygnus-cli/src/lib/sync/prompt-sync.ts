
/**
 * Prompt 文件系统同步
 * 将 Prompt 数据同步到 Supabase
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../logger.js";
import type { PromptRepoInfo } from "../scanner/prompt-scanner.js";
import { readPromptFiles } from "../scanner/prompt-scanner.js";
import type { ClassificationResult } from "../agent/classifier.js";
import { retryWithBackoff } from "../utils/retry-utils.js";
import type { RecoveryState } from "../recovery/recovery-types.js";
import {
  addCompletedPromptRepo,
  addFailedItem,
  saveRecoveryState,
  isPromptRepoCompleted,
} from "../recovery/recovery-manager.js";
import { ProgressBar } from "../utils/progress-bar.js";
import { PerformanceMonitor } from "../performance/performance-monitor.js";

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  force?: boolean;
}

/**
 * 将 LTree 路径转换为字符串
 */
export function pathToLTree(path: string): string {
  // LTree 格式：使用点号分隔
  // 例如：Coding.Frontend.Nuxt4-Expert
  return path.replace(/\//g, ".");
}

/**
 * 同步 Prompt Repo 到 Supabase（带重试和回滚）
 */
export async function syncPromptRepo(
  repoInfo: PromptRepoInfo,
  classification: ClassificationResult | null,
  config: SupabaseConfig,
  ownerId?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _enableRetry = true
): Promise<{ success: boolean; repoId?: string; error?: string; rollbackPerformed?: boolean }> {
  const supabase = createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let createdRepoId: string | null = null;
  let wasNewRepo = false;

  try {
    logger.info(`Syncing prompt repo: ${repoInfo.name}`);

    const files = readPromptFiles(repoInfo);

    // 1. 查找或创建 Prompt Repo
    const ltreePath = pathToLTree(repoInfo.ltreePath);

    // 查找现有 Repo（LTree 路径直接查询）
    const { data: existingRepo } = await supabase
      .from("prompt_repos")
      .select("id")
      .eq("path", ltreePath)
      .maybeSingle();

    let repoId: string;

    if (existingRepo) {
      repoId = existingRepo.id;
      logger.debug(`Found existing repo: ${repoId}`);

      // 更新 Repo
      const { error: updateError } = await supabase
        .from("prompt_repos")
        .update({
          name: repoInfo.name,
          description:
            classification?.summary || repoInfo.config?.summary || null,
          domain: classification?.domain || repoInfo.domain,
          scenario: classification?.scenario || repoInfo.scenario,
          visibility: "private", // 默认私有
          updated_at: new Date().toISOString(),
        })
        .eq("id", repoId);

      if (updateError) {
        throw updateError;
      }
    } else {
      // 创建新 Repo
      const { data: newRepo, error: createError } = await supabase
        .from("prompt_repos")
        .insert({
          name: repoInfo.name,
          description:
            classification?.summary || repoInfo.config?.summary || null,
          path: ltreePath as unknown as string, // LTree 类型
          domain: classification?.domain || repoInfo.domain,
          scenario: classification?.scenario || repoInfo.scenario,
          visibility: "private",
          owner_id: ownerId || null,
        })
        .select("id")
        .single();

      if (createError) {
        throw createError;
      }

      repoId = newRepo.id;
      createdRepoId = repoId;
      wasNewRepo = true;
      logger.debug(`Created new repo: ${repoId}`);
    }

    // 2. 同步 Prompt 内容
    if (files.mainPrompt) {
      const { data: existingPrompt } = await supabase
        .from("prompts")
        .select("id, content, updated_at")
        .eq("repo_id", repoId)
        .maybeSingle();

      const promptData = {
        repo_id: repoId,
        title: repoInfo.name,
        content: files.mainPrompt,
        main_prompt_path: repoInfo.mainPromptPath || "",
        context_md_path: repoInfo.contextMdPath,
        config_yaml_path: repoInfo.configYamlPath,
        summary: classification?.summary || null,
        tags: classification?.tags || repoInfo.config?.tags || [],
        version: repoInfo.config?.version || "1.0.0",
        updated_at: new Date().toISOString(),
      };

      if (existingPrompt) {
        // Conflict Detection
        // If content differs and force is NOT true, we block logic
        // Note: For string comparison we can do direct equality check as supabase returns text
        if (existingPrompt.content !== files.mainPrompt && !config.force) {
          // In dry-run or similar scenarios we might want to just skip
          const msg = `Conflict detected for ${repoInfo.name}: Remote content differs from local. Use --force to overwrite.`;
          logger.warn(msg);
          return { success: false, error: msg };
        }

        // 更新 Prompt
        const { error: updateError } = await supabase
          .from("prompts")
          .update(promptData)
          .eq("id", existingPrompt.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // 创建 Prompt
        const { error: insertError } = await supabase
          .from("prompts")
          .insert(promptData);

        if (insertError) {
          throw insertError;
        }
      }
    }

    // 2.5. 版本控制快照 (Version Snapshot)
    // 无论是更新还是新建，我们都检查当前版本是否存在，不存在则创建快照
    if (files.mainPrompt) {
      // 获取 Prompt ID
      const { data: currentPrompt } = await supabase
        .from("prompts")
        .select("id")
        .eq("repo_id", repoId)
        .single();

      if (currentPrompt) {
        const currentVersion = repoInfo.config?.version || "1.0.0";

        // 检查版本是否存在
        const { data: existingVersions } = await supabase
          .from("prompt_versions")
          .select("id")
          .eq("prompt_id", currentPrompt.id)
          .eq("version", currentVersion);

        if (!existingVersions || existingVersions.length === 0) {
          logger.info(`Creating version snapshot: ${currentVersion}`);

          const { error: versionError } = await supabase
            .from("prompt_versions")
            .insert({
              prompt_id: currentPrompt.id,
              version: currentVersion,
              content: files.mainPrompt,
              summary: classification?.summary || repoInfo.config?.summary || "Initial Sync",
              created_by: ownerId || null
            });

          if (versionError) {
            logger.warn(`Failed to create version snapshot: ${versionError.message}`);
          }
        }
      }
    }

    // 3. 同步元数据
    if (classification) {
      const { data: existingPrompt } = await supabase
        .from("prompts")
        .select("id")
        .eq("repo_id", repoId)
        .single();

      if (existingPrompt) {
        const { data: existingMetadata } = await supabase
          .from("prompt_metadata")
          .select("id")
          .eq("prompt_id", existingPrompt.id)
          .single();

        const metadataData = {
          prompt_id: existingPrompt.id,
          frontmatter: (classification.frontmatter as unknown) as Record<
            string,
            unknown
          >,
          ai_summary: classification.summary,
          classification_suggestions: classification.tags,
        };

        if (existingMetadata) {
          // 更新元数据
          const { error: updateError } = await supabase
            .from("prompt_metadata")
            .update(metadataData)
            .eq("id", existingMetadata.id);

          if (updateError) {
            logger.warn("Failed to update metadata:", updateError);
          }
        } else {
          // 创建元数据
          const { error: insertError } = await supabase
            .from("prompt_metadata")
            .insert(metadataData);

          if (insertError) {
            logger.warn("Failed to insert metadata:", insertError);
          }
        }
      }
    }

    logger.success(`Prompt repo synced successfully: ${repoInfo.name}`);

    return {
      success: true,
      repoId,
    };
  } catch (error) {
    logger.error(`Failed to sync prompt repo: ${repoInfo.name}`, error);

    // Attempt rollback if we created a new repo
    let rollbackPerformed = false;
    if (wasNewRepo && createdRepoId) {
      logger.recovery(`Attempting rollback for prompt repo: ${createdRepoId}`);
      rollbackPerformed = await rollbackPromptRepo(supabase, createdRepoId);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      rollbackPerformed,
    };
  }
}

/**
 * 回滚 Prompt Repo 创建（删除 repo 及其关联数据）
 */
async function rollbackPromptRepo(
  supabase: SupabaseClient,
  repoId: string
): Promise<boolean> {
  try {
    // 删除元数据
    await supabase.from("prompt_metadata").delete().eq("prompt_id", repoId);

    // 删除版本
    const { data: prompts } = await supabase
      .from("prompts")
      .select("id")
      .eq("repo_id", repoId);

    if (prompts && Array.isArray(prompts)) {
      for (const prompt of prompts) {
        if (prompt && prompt.id) {
          await supabase.from("prompt_versions").delete().eq("prompt_id", prompt.id);
        }
      }
    }

    // 删除 prompts
    await supabase.from("prompts").delete().eq("repo_id", repoId);

    // 删除 repo
    await supabase.from("prompt_repos").delete().eq("id", repoId);

    logger.recovery(`Rollback completed for prompt repo: ${repoId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to rollback prompt repo: ${repoId}`, error);
    return false;
  }
}

/**
 * 批量同步 Prompt Repos（带恢复支持）
 */
export async function syncAllPromptRepos(
  repos: PromptRepoInfo[],
  classifications: Map<string, ClassificationResult>,
  config: SupabaseConfig,
  recoveryState?: RecoveryState | null,
  enableRetry = true,
  progressBar?: ProgressBar,
  perfMonitor?: PerformanceMonitor,
  ownerId?: string
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;

  logger.info(`Starting sync for ${repos.length} prompt repo(s)...`);

  for (const repo of repos) {
    // Skip if already completed in recovery
    if (recoveryState && isPromptRepoCompleted(recoveryState, repo.path)) {
      logger.recovery(`Skipping completed prompt repo: ${repo.name}`);
      continue;
    }

    const classification = classifications.get(repo.path) || null;
    const result = await syncPromptRepo(repo, classification, config, ownerId, enableRetry);

    if (result.success) {
      successCount++;
      // Update recovery state
      if (recoveryState) {
        const updated = addCompletedPromptRepo(recoveryState, repo.path);
        Object.assign(recoveryState, updated);
        saveRecoveryState(recoveryState);
      }
      // Update progress bar
      if (progressBar) {
        progressBar.increment();
      }
      // Track performance
      if (perfMonitor) {
        perfMonitor.recordItem();
      }
    } else {
      failedCount++;
      // Log failure to recovery state
      if (recoveryState) {
        const updated = addFailedItem(
          recoveryState,
          'prompt-repo',
          repo.path,
          result.error || 'Unknown error'
        );
        Object.assign(recoveryState, updated);
        saveRecoveryState(recoveryState);
      }
    }

    // 添加小延迟，避免 API 限流
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  logger.info(`Sync completed: ${successCount} success, ${failedCount} failed`);

  return {
    success: successCount,
    failed: failedCount,
  };
}

/**
 * 在数据库中重命名 Prompt Repo（当文件移动时调用）
 */
export async function renamePromptRepoInDb(
  oldLtreePath: string,
  newLtreePath: string,
  config: SupabaseConfig,
  enableRetry = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const oldPathLtree = pathToLTree(oldLtreePath);
    const newPathLtree = pathToLTree(newLtreePath);

    logger.debug(`Renaming repo in DB: ${oldPathLtree} -> ${newPathLtree}`);

    // Parse new domain/scenario from path
    // Assumption: path format is Domain.Scenario.AttrName
    const parts = newPathLtree.split(".");
    let domain = "Unsorted";
    let scenario = "General";

    if (parts.length >= 1) domain = parts[0];
    if (parts.length >= 2) scenario = parts[1];

    const renameOp = async () => {
      // Find the repo by OLD path
      const { data: existingRepo } = await supabase
        .from("prompt_repos")
        .select("id")
        .eq("path", oldPathLtree)
        .maybeSingle();

      if (!existingRepo) {
        // If repo doesn't exist in DB, that's fine, the next sync will create it at new location
        logger.debug("Repo not found in DB, skipping rename");
        return { success: true };
      }

      // Update the record
      const { error } = await supabase
        .from("prompt_repos")
        .update({
          path: newPathLtree,
          domain,
          scenario,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRepo.id);

      if (error) {
        throw error;
      }

      return { success: true };
    };

    const result = enableRetry
      ? await retryWithBackoff(renameOp)
      : { success: true, result: await renameOp(), attempts: 1, totalDelay: 0, error: undefined };

    if (!result.success && result.error) {
      throw result.error;
    }

    logger.success(`Renamed repo in DB: ${oldPathLtree} -> ${newPathLtree}`);
    return { success: true };

  } catch (error) {
    logger.error(`Failed to rename repo in DB`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
