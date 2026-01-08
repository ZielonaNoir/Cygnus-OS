/**
 * 性能监控类型定义
 */

export type OperationType = 'sync' | 'classify' | 'index-gen' | 'scan';

/**
 * 性能指标
 */
export interface PerformanceMetrics {
    operationType: OperationType;
    startTime: number;
    endTime?: number;
    duration?: number;
    itemsProcessed: number;
    itemsTotal: number;
    memoryUsage: MemorySnapshot[];
    errors: number;
    timeline: TimelineEvent[];
}

/**
 * 内存快照
 */
export interface MemorySnapshot {
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
}

/**
 * 进度报告
 */
export interface ProgressReport {
    current: number;
    total: number;
    percentage: number;
    eta: number; // milliseconds
    avgTimePerItem: number;
}

/**
 * 时间线事件
 */
export interface TimelineEvent {
    timestamp: number;
    event: string;
    data?: Record<string, unknown>;
}

/**
 * 性能报告
 */
export interface PerformanceReport {
    operation: string;
    startTime: string;
    endTime: string;
    duration: number;
    metrics: {
        itemsProcessed: number;
        avgItemTime: number;
        errors: number;
    };
    memory: {
        initial: MemorySnapshot;
        peak: MemorySnapshot;
        final: MemorySnapshot;
        snapshots: MemorySnapshot[];
    };
    timeline: TimelineEvent[];
}
