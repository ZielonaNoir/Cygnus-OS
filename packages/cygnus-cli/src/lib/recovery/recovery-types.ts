/**
 * 错误恢复系统类型定义
 */

export type OperationType = 'sync' | 'classify' | 'index-gen';
export type ItemType = 'project' | 'prompt-repo';

/**
 * 恢复配置
 */
export interface RecoveryConfig {
    maxRetries: number;
    retryDelayMs: number;
    autoResume: boolean;
}

/**
 * 失败项目信息
 */
export interface FailedItem {
    type: ItemType;
    path: string;
    error: string;
    timestamp: string;
    retryCount: number;
}

/**
 * 恢复状态
 */
export interface RecoveryState {
    operation: OperationType;
    startedAt: string;
    lastCheckpoint: string;
    completedProjects: string[];
    completedPromptRepos: string[];
    failedItems: FailedItem[];
    retryCount: number;
    config: RecoveryConfig;
}

/**
 * 重试结果
 */
export interface RetryResult<T> {
    success: boolean;
    result?: T;
    error?: Error;
    attempts: number;
    totalDelay: number;
}

/**
 * 回滚操作
 */
export interface RollbackOperation {
    type: 'delete_project' | 'delete_prompt_repo' | 'revert_update';
    targetId: string;
    metadata?: Record<string, unknown>;
}
