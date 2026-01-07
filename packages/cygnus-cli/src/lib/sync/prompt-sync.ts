/**
 * Prompt 文件系统同步
 * 将 Prompt 数据同步到 Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "../logger.js";
import type { PromptRepoInfo } from "../scanner/prompt-scanner.js";
import { readPromptFiles } from "../scanner/prompt-scanner.js";
import type { ClassificationResult } from "../agent/classifier.js";

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
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
 * 同步 Prompt Repo 到 Supabase
 */
export async function syncPromptRepo(
  repoInfo: PromptRepoInfo,
  classification: ClassificationResult | null,
  config: SupabaseConfig,
  ownerId?: string
): Promise<{ success: boolean; repoId?: string; error?: string }> {
  const supabase = createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

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
      logger.debug(`Created new repo: ${repoId}`);
    }

    // 2. 同步 Prompt 内容
    if (files.mainPrompt) {
      const { data: existingPrompt } = await supabase
        .from("prompts")
        .select("id")
        .eq("repo_id", repoId)
        .single();

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
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 批量同步 Prompt Repos
 */
export async function syncAllPromptRepos(
  repos: PromptRepoInfo[],
  classifications: Map<string, ClassificationResult>,
  config: SupabaseConfig,
  ownerId?: string
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;

  logger.info(`Starting sync for ${repos.length} prompt repo(s)...`);

  for (const repo of repos) {
    const classification = classifications.get(repo.path) || null;
    const result = await syncPromptRepo(repo, classification, config, ownerId);

    if (result.success) {
      successCount++;
    } else {
      failedCount++;
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
