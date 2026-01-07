/**
 * SIPE JSON 验证工具
 */

import { SIPEJSON, validateSIPEJSON } from '@/types/sipe';

/**
 * 验证并解析 SIPE JSON
 */
export function parseSIPEJSON(data: unknown): SIPEJSON {
  if (!validateSIPEJSON(data)) {
    throw new Error('Invalid SIPE JSON format');
  }
  return data;
}

/**
 * 验证 SIPE JSON 并返回错误信息
 */
export function validateSIPEJSONWithErrors(data: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    errors.push('SIPE JSON must be an object');
    return { valid: false, errors };
  }

  const obj = data as Record<string, unknown>;

  // 检查必需字段
  if (typeof obj.project_name !== 'string') {
    errors.push('project_name must be a string');
  }
  if (typeof obj.last_sync !== 'string') {
    errors.push('last_sync must be a string (ISO 8601)');
  }
  if (typeof obj.progress !== 'number') {
    errors.push('progress must be a number');
  } else if (obj.progress < 0 || obj.progress > 100) {
    errors.push('progress must be between 0 and 100');
  }
  if (typeof obj.health_score !== 'number') {
    errors.push('health_score must be a number');
  } else if (obj.health_score < 0 || obj.health_score > 100) {
    errors.push('health_score must be between 0 and 100');
  }
  if (!Array.isArray(obj.tasks)) {
    errors.push('tasks must be an array');
  }
  if (!Array.isArray(obj.requirements)) {
    errors.push('requirements must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

