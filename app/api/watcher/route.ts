/**
 * 文件监听器 API
 * 控制 Chokidar 监听器的启动和停止
 * 
 * 端点：
 * - GET /api/watcher/status - 获取监听状态
 * - POST /api/watcher/start - 启动监听
 * - POST /api/watcher/stop - 停止监听
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    getGlobalWatcher,
    stopGlobalWatcher,
    isWatcherRunning,
} from '@lib/watcher/file-watcher';
import type { FileChange } from '@lib/watcher/file-watcher';

// 存储最近的变更记录
let recentChanges: FileChange[] = [];
const MAX_RECENT_CHANGES = 100;

/**
 * GET /api/watcher - 获取监听状态
 */
export async function GET() {
    try {
        const isRunning = isWatcherRunning();
        return NextResponse.json({
            success: true,
            data: {
                status: isRunning ? 'watching' : 'idle',
                recentChanges: recentChanges.slice(0, 20),
            },
        });
    } catch (error) {
        console.error('Watcher status error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get watcher status' } },
            { status: 500 }
        );
    }
}

/**
 * POST /api/watcher - 控制监听器
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const action = body.action as 'start' | 'stop';

        if (action === 'start') {
            const dataDir = body.dataDir || process.cwd() + '/data';

            const watcher = getGlobalWatcher({
                dataDir,
                onChange: async (changes) => {
                    // 存储最近的变更
                    recentChanges = [...changes, ...recentChanges].slice(0, MAX_RECENT_CHANGES);
                    console.log(`[Watcher] ${changes.length} file changes detected`);
                },
                onError: (error) => {
                    console.error('[Watcher] Error:', error);
                },
            });

            if (watcher) {
                watcher.start();
                return NextResponse.json({
                    success: true,
                    message: 'Watcher started',
                    data: { status: 'watching', dataDir },
                });
            }

            return NextResponse.json(
                { success: false, error: { code: 'WATCHER_FAILED', message: 'Failed to start watcher' } },
                { status: 500 }
            );
        }

        if (action === 'stop') {
            await stopGlobalWatcher();
            return NextResponse.json({
                success: true,
                message: 'Watcher stopped',
                data: { status: 'idle' },
            });
        }

        return NextResponse.json(
            { success: false, error: { code: 'INVALID_ACTION', message: 'Action must be "start" or "stop"' } },
            { status: 400 }
        );
    } catch (error) {
        console.error('Watcher control error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to control watcher' } },
            { status: 500 }
        );
    }
}
