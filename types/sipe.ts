/**
 * SIPE (Super Individual Project Engineering) JSON 标准
 * 用于统一项目进度数据的格式
 */

export interface SIPEJSON {
  /** 项目名称 */
  project_name: string;
  /** 最后同步时间 (ISO 8601) */
  last_sync: string;
  /** 进度百分比 (0-100) */
  progress: number;
  /** 任务列表 */
  tasks: SIPETask[];
  /** 需求列表 */
  requirements: string[];
  /** 健康度评分 (0-100) */
  health_score: number;
}

export interface SIPETask {
  /** 任务 ID */
  id: number;
  /** 任务文本 */
  text: string;
  /** 任务状态 */
  status: 'completed' | 'pending';
  /** 优先级 */
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * SIPE JSON 验证函数
 */
export function validateSIPEJSON(data: unknown): data is SIPEJSON {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // 检查必需字段
  if (
    typeof obj.project_name !== 'string' ||
    typeof obj.last_sync !== 'string' ||
    typeof obj.progress !== 'number' ||
    typeof obj.health_score !== 'number' ||
    !Array.isArray(obj.tasks) ||
    !Array.isArray(obj.requirements)
  ) {
    return false;
  }

  // 验证进度和健康度范围
  if (obj.progress < 0 || obj.progress > 100 || obj.health_score < 0 || obj.health_score > 100) {
    return false;
  }

  // 验证任务格式
  for (const task of obj.tasks) {
    if (
      typeof task !== 'object' ||
      task === null ||
      typeof (task as Record<string, unknown>).id !== 'number' ||
      typeof (task as Record<string, unknown>).text !== 'string' ||
      !['completed', 'pending'].includes((task as Record<string, unknown>).status as string) ||
      !['low', 'medium', 'high', 'urgent'].includes((task as Record<string, unknown>).priority as string)
    ) {
      return false;
    }
  }

  return true;
}

