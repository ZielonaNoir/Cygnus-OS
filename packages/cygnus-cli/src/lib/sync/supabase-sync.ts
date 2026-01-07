/**
 * Supabase 数据同步
 * 将项目数据同步到 Supabase 数据库
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "../logger.js";
import type { SIPEJSON } from "../agent/types.js";
import type { ProjectInfo } from "../scanner/project-scanner.js";

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

export interface SyncResult {
  success: boolean;
  projectId?: string;
  error?: string;
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
 * 同步项目到 Supabase
 */
export async function syncProject(
  projectInfo: ProjectInfo,
  sipeJson: SIPEJSON,
  config: SupabaseConfig
): Promise<SyncResult> {
  const supabase = createSupabaseClient(config);

  try {
    logger.info(`Syncing project: ${projectInfo.name}`);

    // 1. 查找或创建项目记录
    const { data: existingProject } = await supabase
      .from("projects")
      .select("id")
      .eq("path", projectInfo.path)
      .single();

    let projectId: string;

    if (existingProject) {
      projectId = existingProject.id;
      logger.debug(`Found existing project: ${projectId}`);
    } else {
      // 创建新项目
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
        })
        .select("id")
        .single();

      if (createError) {
        throw createError;
      }

      projectId = newProject.id;
      logger.debug(`Created new project: ${projectId}`);
    }

    // 2. 更新项目信息
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

    // 3. 同步任务列表
    await syncTasks(projectId, sipeJson, supabase);

    // 4. 保存 SIPE JSON 快照
    await saveSIPESnapshot(projectId, sipeJson, supabase);

    logger.success(`Project synced successfully: ${projectInfo.name}`);

    return {
      success: true,
      projectId,
    };
  } catch (error) {
    logger.error(`Failed to sync project: ${projectInfo.name}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
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
 * 批量同步多个项目
 */
export async function syncAllProjects(
  projects: ProjectInfo[],
  sipeData: Map<string, SIPEJSON>,
  config: SupabaseConfig
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

    const result = await syncProject(project, sipeJson, config);
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
