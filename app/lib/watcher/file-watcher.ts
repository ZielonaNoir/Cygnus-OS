/**
 * Chokidar 文件监听服务
 * 监听 /data 目录变更，自动触发同步
 * 
 * 注意：此模块只能在 Node.js 环境中运行（API Routes 或独立进程）
 */

import chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';

/** 文件变更事件类型 */
export type FileChangeEvent = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';

/** 文件变更信息 */
export interface FileChange {
    event: FileChangeEvent;
    path: string;
    timestamp: Date;
}

/** 监听器状态 */
export type WatcherStatus = 'idle' | 'watching' | 'error';

/** 监听器配置 */
export interface WatcherConfig {
    /** 监听目录 */
    dataDir: string;
    /** 忽略的文件模式 */
    ignored?: string[];
    /** 防抖延迟（毫秒） */
    debounceMs?: number;
    /** 变更回调 */
    onChange?: (changes: FileChange[]) => void | Promise<void>;
    /** 错误回调 */
    onError?: (error: Error) => void;
}

/** 监听器实例 */
export interface WatcherInstance {
    watcher: FSWatcher;
    status: WatcherStatus;
    start: () => void;
    stop: () => Promise<void>;
    getStatus: () => WatcherStatus;
}

// 默认忽略的文件模式
const DEFAULT_IGNORED = [
    '**/node_modules/**',
    '**/.git/**',
    '**/.cygnus/**',
    '**/.*',
    '**/*.log',
];

/**
 * 创建文件监听器
 */
export function createWatcher(config: WatcherConfig): WatcherInstance {
    const {
        dataDir,
        ignored = DEFAULT_IGNORED,
        debounceMs = 500,
        onChange,
        onError,
    } = config;

    let status: WatcherStatus = 'idle';
    let pendingChanges: FileChange[] = [];
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // 处理防抖后的变更
    const flushChanges = async () => {
        if (pendingChanges.length === 0) return;

        const changes = [...pendingChanges];
        pendingChanges = [];

        if (onChange) {
            try {
                await onChange(changes);
            } catch (error) {
                if (onError && error instanceof Error) {
                    onError(error);
                }
            }
        }
    };

    // 记录变更并触发防抖
    const recordChange = (event: FileChangeEvent, path: string) => {
        pendingChanges.push({
            event,
            path,
            timestamp: new Date(),
        });

        // 清除之前的定时器
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // 设置新的防抖定时器
        debounceTimer = setTimeout(flushChanges, debounceMs);
    };

    // 创建 chokidar 监听器
    const watcher = chokidar.watch(dataDir, {
        ignored,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 200,
            pollInterval: 100,
        },
    });

    // 绑定事件
    watcher
        .on('add', (path) => recordChange('add', path))
        .on('change', (path) => recordChange('change', path))
        .on('unlink', (path) => recordChange('unlink', path))
        .on('addDir', (path) => recordChange('addDir', path))
        .on('unlinkDir', (path) => recordChange('unlinkDir', path))
        .on('error', (error) => {
            status = 'error';
            if (onError && error instanceof Error) {
                onError(error);
            }
        })
        .on('ready', () => {
            status = 'watching';
        });

    return {
        watcher,
        status,
        start: () => {
            // Chokidar 自动开始监听
            status = 'watching';
        },
        stop: async () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            await flushChanges();
            await watcher.close();
            status = 'idle';
        },
        getStatus: () => status,
    };
}

// 全局监听器实例（单例模式）
let globalWatcher: WatcherInstance | null = null;

/**
 * 获取或创建全局监听器
 */
export function getGlobalWatcher(config?: WatcherConfig): WatcherInstance | null {
    if (!globalWatcher && config) {
        globalWatcher = createWatcher(config);
    }
    return globalWatcher;
}

/**
 * 停止全局监听器
 */
export async function stopGlobalWatcher(): Promise<void> {
    if (globalWatcher) {
        await globalWatcher.stop();
        globalWatcher = null;
    }
}

/**
 * 检查监听器是否运行中
 */
export function isWatcherRunning(): boolean {
    return globalWatcher?.getStatus() === 'watching';
}
