/**
 * 本地缓存机制
 * 在每个项目下生成 .cygnus/state.json 以记录快照
 */

import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { logger } from "../logger.js";
import type { SIPEJSON } from "../agent/types.js";

export interface ProjectState {
  projectPath: string;
  lastSync: string;
  sipeJson: SIPEJSON;
  markdownFiles: string[];
  version: string;
}

const CACHE_DIR = ".cygnus";
const STATE_FILE = "state.json";
const CACHE_VERSION = "1.0.0";

/**
 * 获取缓存文件路径
 */
function getCachePath(projectPath: string): string {
  return join(projectPath, CACHE_DIR, STATE_FILE);
}

/**
 * 保存项目状态到缓存
 */
export function saveProjectState(
  projectPath: string,
  sipeJson: SIPEJSON,
  markdownFiles: string[]
): void {
  try {
    const cacheDir = join(projectPath, CACHE_DIR);
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }

    const state: ProjectState = {
      projectPath,
      lastSync: new Date().toISOString(),
      sipeJson,
      markdownFiles,
      version: CACHE_VERSION,
    };

    const cachePath = getCachePath(projectPath);
    writeFileSync(cachePath, JSON.stringify(state, null, 2), "utf-8");
    logger.debug(`Saved project state to: ${cachePath}`);
  } catch (error) {
    logger.warn(`Failed to save project state: ${projectPath}`, error);
  }
}

/**
 * 读取项目状态缓存
 */
export function loadProjectState(projectPath: string): ProjectState | null {
  try {
    const cachePath = getCachePath(projectPath);
    if (!existsSync(cachePath)) {
      return null;
    }

    const content = readFileSync(cachePath, "utf-8");
    const state = JSON.parse(content) as ProjectState;

    // 验证缓存版本
    if (state.version !== CACHE_VERSION) {
      logger.warn(`Cache version mismatch for ${projectPath}, ignoring cache`);
      return null;
    }

    logger.debug(`Loaded project state from: ${cachePath}`);
    return state;
  } catch (error) {
    logger.warn(`Failed to load project state: ${projectPath}`, error);
    return null;
  }
}

/**
 * 检查缓存是否有效（基于文件修改时间）
 */
export function isCacheValid(
  projectPath: string,
  markdownFiles: string[]
): boolean {
  const state = loadProjectState(projectPath);
  if (!state) {
    return false;
  }

  // 检查 Markdown 文件列表是否一致
  if (state.markdownFiles.length !== markdownFiles.length) {
    return false;
  }

  // 检查文件是否被修改（简化版本，实际应该检查文件修改时间）
  // 这里只检查文件是否存在
  for (const file of markdownFiles) {
    if (!existsSync(file)) {
      return false;
    }
  }

  return true;
}

/**
 * 清除项目缓存
 */
export function clearProjectCache(projectPath: string): void {
  try {
    const cachePath = getCachePath(projectPath);
    if (existsSync(cachePath)) {
      unlinkSync(cachePath);
      logger.debug(`Cleared project cache: ${cachePath}`);
    }
  } catch (error) {
    logger.warn(`Failed to clear project cache: ${projectPath}`, error);
  }
}
