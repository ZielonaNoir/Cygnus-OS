/**
 * Supabase 数据同步
 * 将项目数据同步到 Supabase 数据库
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "../logger.js";
import type { SIPEJSON } from "../agent/types.js";
import type { ProjectInfo } from "../scanner/project-scanner.js";
import { retryWithBackoff } from "../utils/retry-utils.js";
import type { RecoveryState } from "../recovery/recovery-types.js";
import {
  addCompletedProject,
  addFailedItem,
  saveRecoveryState,
} from "../recovery/recovery-manager.js";
import { ProgressBar } from "../utils/progress-bar.js";
import { PerformanceMonitor } from "../performance/performance-monitor.js";

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

export interface SyncResult {
  success: boolean;
  projectId?: string;
  error?: string;
  rollbackPerformed?: boolean;
}

/**
 * 创建 Supabase 客户端（使用 Service Role Key，绕过 RLS）
 */
export function createSupabaseClient(config: SupabaseConfig) {
  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Supabase URL and Service Role Key are required");
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 同步项目到 Supabase（带重试和回滚）
 */
export async function syncProject(
  projectInfo: ProjectInfo,
  sipeJson: SIPEJSON,
  config: SupabaseConfig,
  enableRetry = true,
  ownerId?: string
): Promise<SyncResult> {
  const supabase = createSupabaseClient(config);
  let createdProjectId: string | null = null;
  let wasNewProject = false;

  try {
    logger.info(`Syncing project: ${projectInfo.name}`);

    // 1. 查找或创建项目记录（带重试）
    const findOrCreateProject = async () => {
      const { data: existingProject } = await supabase
        .from("projects")
        .select("id")
        .eq("path", projectInfo.path)
        .single();

      return existingProject;
    };

    const projectResult = enableRetry
      ? await retryWithBackoff(findOrCreateProject)
      : { success: true, result: await findOrCreateProject(), attempts: 1, totalDelay: 0 };

    if (!projectResult.success) {
      throw projectResult.error || new Error("Failed to find project");
    }

    const existingProject = projectResult.result;

    let projectId: string;

    if (existingProject) {
      projectId = existingProject.id;
      logger.debug(`Found existing project: ${projectId}`);
    } else {
      // 创建新项目（带重试）
      const createProject = async () => {
        const { data: newProject, error: createError } = await supabase
          .from("projects")
          .insert({
            name: sipeJson.project_name,
            description: null,
            path: projectInfo.path,
            progress: sipeJson.progress,
            status: getStatusFromProgress(sipeJson.progress),
            health_score: sipeJson.health_score,
            last_sync: new Date().toISOString(),
            owner_id: ownerId || null, // 如果提供了 ownerId，则设置；否则为 null
          })
          .select("id")
          .single();

        if (createError) {
          throw createError;
        }

        return newProject;
      };

      const createResult = enableRetry
        ? await retryWithBackoff(createProject)
        : { success: true, result: await createProject(), attempts: 1, totalDelay: 0 };

      if (!createResult.success) {
        throw createResult.error || new Error("Failed to create project");
      }

      const newProject = createResult.result;
      if (!newProject) {
        throw new Error("Failed to create project: no project returned");
      }
      projectId = newProject.id;
      createdProjectId = projectId;
      wasNewProject = true;
      logger.debug(`Created new project: ${projectId}`);
    }

    // 2. 更新项目信息（带重试）
    const updateProject = async () => {
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          name: sipeJson.project_name,
          progress: sipeJson.progress,
          status: getStatusFromProgress(sipeJson.progress),
          health_score: sipeJson.health_score,
          last_sync: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (updateError) {
        throw updateError;
      }
    };

    const updateResult = enableRetry
      ? await retryWithBackoff(updateProject)
      : { success: true, result: await updateProject(), attempts: 1, totalDelay: 0 };

    if (!updateResult.success) {
      // Rollback if we created a new project
      if (wasNewProject && createdProjectId) {
        await rollbackProject(supabase, createdProjectId);
      }
      throw updateResult.error || new Error("Failed to update project");
    }

    // 3. 同步任务列表（带重试）
    const syncTasksResult = enableRetry
      ? await retryWithBackoff(() => syncTasks(projectId, sipeJson, supabase))
      : { success: true, result: await syncTasks(projectId, sipeJson, supabase), attempts: 1, totalDelay: 0 };

    if (!syncTasksResult.success) {
      // Rollback if we created a new project
      if (wasNewProject && createdProjectId) {
        await rollbackProject(supabase, createdProjectId);
      }
      throw syncTasksResult.error || new Error("Failed to sync tasks");
    }

    // 4. 保存 SIPE JSON 快照（失败不回滚，只记录）
    await saveSIPESnapshot(projectId, sipeJson, supabase);

    logger.success(`Project synced successfully: ${projectInfo.name}`);

    return {
      success: true,
      projectId,
    };
  } catch (error) {
    logger.error(`Failed to sync project: ${projectInfo.name}`, error);

    // Attempt rollback if we created a new project
    let rollbackPerformed = false;
    if (wasNewProject && createdProjectId) {
      logger.recovery(`Attempting rollback for project: ${createdProjectId}`);
      rollbackPerformed = await rollbackProject(supabase, createdProjectId);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      rollbackPerformed,
    };
  }
}

/**
 * 回滚项目创建（删除项目及其关联数据）
 */
async function rollbackProject(
  supabase: ReturnType<typeof createSupabaseClient>,
  projectId: string
): Promise<boolean> {
  try {
    // 删除任务
    await supabase.from("tasks").delete().eq("project_id", projectId);

    // 删除 SIPE 快照
    await supabase.from("project_sync_v1").delete().eq("project_id", projectId);

    // 删除项目
    await supabase.from("projects").delete().eq("id", projectId);

    logger.recovery(`Rollback completed for project: ${projectId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to rollback project: ${projectId}`, error);
    return false;
  }
}

/**
 * 同步任务列表
 */
async function syncTasks(
  projectId: string,
  sipeJson: SIPEJSON,
  supabase: ReturnType<typeof createSupabaseClient>
) {
  // 删除旧任务
  const { error: deleteError } = await supabase
    .from("tasks")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) {
    logger.warn("Failed to delete old tasks:", deleteError);
  }

  // 插入新任务
  if (sipeJson.tasks.length > 0) {
    const tasksToInsert = sipeJson.tasks.map((task) => {
      // 尝试从任务文本中提取文件路径（如果有）
      const filePath = extractFilePath(task.text) || "unknown";

      return {
        project_id: projectId,
        task_text: task.text,
        status: task.status,
        priority: task.priority,
        line_number: null, // 可以从原始 Markdown 中提取
        file_path: filePath,
      };
    });

    const { error: insertError } = await supabase
      .from("tasks")
      .insert(tasksToInsert);

    if (insertError) {
      throw insertError;
    }

    logger.debug(`Synced ${tasksToInsert.length} tasks`);
  }
}

/**
 * 保存 SIPE JSON 快照
 */
async function saveSIPESnapshot(
  projectId: string,
  sipeJson: SIPEJSON,
  supabase: ReturnType<typeof createSupabaseClient>
) {
  const { error } = await supabase.from("project_sync_v1").insert({
    project_id: projectId,
    sipe_json: sipeJson as unknown as Record<string, unknown>, // JSONB
    sync_timestamp: new Date().toISOString(),
  });

  if (error) {
    logger.warn("Failed to save SIPE snapshot:", error);
    // 不抛出错误，因为快照是辅助数据
  } else {
    logger.debug("SIPE snapshot saved");
  }
}

/**
 * 根据进度获取状态
 */
function getStatusFromProgress(progress: number): string {
  if (progress === 0) {
    return "pending";
  } else if (progress === 100) {
    return "completed";
  } else {
    return "in_progress";
  }
}

/**
 * 从任务文本中提取文件路径（简单实现）
 */
function extractFilePath(taskText: string): string | null {
  // 尝试匹配常见的文件路径模式
  const pathPatterns = [
    /`([^`]+\.(ts|tsx|js|jsx|md|yaml|yml|json))`/g,
    /([a-zA-Z0-9_\-/]+\.(ts|tsx|js|jsx|md|yaml|yml|json))/g,
  ];

  for (const pattern of pathPatterns) {
    const match = taskText.match(pattern);
    if (match) {
      return match[0].replace(/`/g, "");
    }
  }

  return null;
}

/**
 * 批量同步多个项目（带恢复支持）
 */
/**
 * 同步所有项目
 */
export async function syncAllProjects(
  projects: ProjectInfo[],
  sipeData: Map<string, SIPEJSON>,
  config: SupabaseConfig,
  recoveryState?: RecoveryState | null,
  enableRetry = true,
  progressBar?: ProgressBar,
  perfMonitor?: PerformanceMonitor,
  ownerId?: string
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;

  logger.info(`Starting sync for ${projects.length} project(s)...`);

  for (const project of projects) {
    const sipeJson = sipeData.get(project.path);
    if (!sipeJson) {
      logger.warn(`No SIPE data for project: ${project.name}`);
      failedCount++;
      continue;
    }

    const result = await syncProject(project, sipeJson, config, enableRetry, ownerId);
    if (result.success) {
      successCount++;
      // Update recovery state
      if (recoveryState) {
        const updated = addCompletedProject(recoveryState, project.path);
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
          'project',
          project.path,
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
