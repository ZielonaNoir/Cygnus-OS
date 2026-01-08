/**
 * 恢复管理器 - 处理操作状态持久化和恢复
 */

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { logger } from '../logger.js';
import type {
    RecoveryState,
    OperationType,
    FailedItem,
    RecoveryConfig,
    ItemType,
} from './recovery-types.js';

const RECOVERY_DIR = join(homedir(), '.cygnus');
const RECOVERY_FILE = join(RECOVERY_DIR, 'recovery.json');

/**
 * 确保恢复目录存在
 */
function ensureRecoveryDir(): void {
    if (!existsSync(RECOVERY_DIR)) {
        mkdirSync(RECOVERY_DIR, { recursive: true });
    }
}

/**
 * 保存恢复状态
 */
export function saveRecoveryState(state: RecoveryState): void {
    try {
        ensureRecoveryDir();
        writeFileSync(RECOVERY_FILE, JSON.stringify(state, null, 2), 'utf-8');
        logger.debug(`Recovery state saved to: ${RECOVERY_FILE}`);
    } catch (error) {
        logger.warn('Failed to save recovery state:', error);
    }
}

/**
 * 加载恢复状态
 */
export function loadRecoveryState(): RecoveryState | null {
    try {
        if (!existsSync(RECOVERY_FILE)) {
            return null;
        }

        const content = readFileSync(RECOVERY_FILE, 'utf-8');
        const state = JSON.parse(content) as RecoveryState;

        logger.debug(`Recovery state loaded from: ${RECOVERY_FILE}`);
        return state;
    } catch (error) {
        logger.warn('Failed to load recovery state:', error);
        return null;
    }
}

/**
 * 清除恢复状态
 */
export function clearRecoveryState(): void {
    try {
        if (existsSync(RECOVERY_FILE)) {
            unlinkSync(RECOVERY_FILE);
            logger.debug('Recovery state cleared');
        }
    } catch (error) {
        logger.warn('Failed to clear recovery state:', error);
    }
}

/**
 * 检查是否有正在进行的恢复
 */
export function hasRecoveryState(): boolean {
    return existsSync(RECOVERY_FILE);
}

/**
 * 创建新的恢复状态
 */
export function createRecoveryState(
    operation: OperationType,
    config: RecoveryConfig
): RecoveryState {
    return {
        operation,
        startedAt: new Date().toISOString(),
        lastCheckpoint: new Date().toISOString(),
        completedProjects: [],
        completedPromptRepos: [],
        failedItems: [],
        retryCount: 0,
        config,
    };
}

/**
 * 添加完成的项目
 */
export function addCompletedProject(
    state: RecoveryState,
    projectPath: string
): RecoveryState {
    return {
        ...state,
        completedProjects: [...state.completedProjects, projectPath],
        lastCheckpoint: new Date().toISOString(),
    };
}

/**
 * 添加完成的 Prompt Repo
 */
export function addCompletedPromptRepo(
    state: RecoveryState,
    repoPath: string
): RecoveryState {
    return {
        ...state,
        completedPromptRepos: [...state.completedPromptRepos, repoPath],
        lastCheckpoint: new Date().toISOString(),
    };
}

/**
 * 添加失败的项目
 */
export function addFailedItem(
    state: RecoveryState,
    type: ItemType,
    path: string,
    error: string
): RecoveryState {
    const failedItem: FailedItem = {
        type,
        path,
        error,
        timestamp: new Date().toISOString(),
        retryCount: 0,
    };

    return {
        ...state,
        failedItems: [...state.failedItems, failedItem],
        lastCheckpoint: new Date().toISOString(),
    };
}

/**
 * 增加重试计数
 */
export function incrementRetryCount(state: RecoveryState): RecoveryState {
    return {
        ...state,
        retryCount: state.retryCount + 1,
    };
}

/**
 * 获取失败的项目路径
 */
export function getFailedItems(state: RecoveryState): FailedItem[] {
    return state.failedItems;
}

/**
 * 检查项目是否已完成
 */
export function isProjectCompleted(
    state: RecoveryState,
    projectPath: string
): boolean {
    return state.completedProjects.includes(projectPath);
}

/**
 * 检查 Prompt Repo 是否已完成
 */
export function isPromptRepoCompleted(
    state: RecoveryState,
    repoPath: string
): boolean {
    return state.completedPromptRepos.includes(repoPath);
}

/**
 * 获取恢复状态摘要
 */
export function getRecoverySummary(state: RecoveryState): string {
    const duration = Date.now() - new Date(state.startedAt).getTime();
    const durationMin = Math.floor(duration / 60000);

    return `
Recovery Status for ${state.operation}:
- Started: ${state.startedAt}
- Duration: ${durationMin} minutes
- Completed Projects: ${state.completedProjects.length}
- Completed Prompt Repos: ${state.completedPromptRepos.length}
- Failed Items: ${state.failedItems.length}
- Retry Count: ${state.retryCount}
`.trim();
}
