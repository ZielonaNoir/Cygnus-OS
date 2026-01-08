/**
 * 性能监控管理器
 */

import { logger } from '../logger.js';
import type {
    PerformanceMetrics,
    MemorySnapshot,
    ProgressReport,
    PerformanceReport,
    OperationType,
} from './performance-types.js';
import fs from 'fs-extra';
import path from 'path';
import { homedir } from 'os';

export class PerformanceMonitor {
    private metrics: PerformanceMetrics;
    private snapshotInterval?: NodeJS.Timeout;

    constructor(operationType: OperationType, total: number = 0) {
        this.metrics = {
            operationType,
            startTime: Date.now(),
            itemsProcessed: 0,
            itemsTotal: total,
            memoryUsage: [],
            errors: 0,
            timeline: [],
        };

        // Capture initial memory
        this.captureMemorySnapshot();
        this.addTimelineEvent('operation_start');
    }

    /**
     * 开始自动内存快照
     */
    startMemoryMonitoring(intervalMs: number = 5000) {
        this.snapshotInterval = setInterval(() => {
            this.captureMemorySnapshot();
        }, intervalMs);
    }

    /**
     * 停止内存监控
     */
    stopMemoryMonitoring() {
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
            this.snapshotInterval = undefined;
        }
    }

    /**
     * 捕获内存快照
     */
    captureMemorySnapshot(): MemorySnapshot {
        const mem = process.memoryUsage();
        const snapshot: MemorySnapshot = {
            timestamp: Date.now(),
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal,
            external: mem.external,
            rss: mem.rss,
        };

        this.metrics.memoryUsage.push(snapshot);
        return snapshot;
    }

    /**
     * 记录处理的项目
     */
    recordItem() {
        this.metrics.itemsProcessed++;
    }

    /**
     * 设置总项目数
     */
    setTotal(total: number) {
        this.metrics.itemsTotal = total;
    }

    /**
     * 记录错误
     */
    recordError() {
        this.metrics.errors++;
    }

    /**
     * 添加时间线事件
     */
    addTimelineEvent(event: string, data?: Record<string, unknown>) {
        this.metrics.timeline.push({
            timestamp: Date.now(),
            event,
            data,
        });
    }

    /**
     * 结束操作
     */
    end() {
        this.stopMemoryMonitoring();
        this.metrics.endTime = Date.now();
        this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
        this.captureMemorySnapshot();
        this.addTimelineEvent('operation_end');
    }

    /**
     * 获取进度报告
     */
    getProgress(): ProgressReport {
        const current = this.metrics.itemsProcessed;
        const total = this.metrics.itemsTotal;
        const percentage = total > 0 ? (current / total) * 100 : 0;

        const elapsed = Date.now() - this.metrics.startTime;
        const avgTimePerItem = current > 0 ? elapsed / current : 0;
        const remaining = total - current;
        const eta = remaining > 0 ? avgTimePerItem * remaining : 0;

        return {
            current,
            total,
            percentage,
            eta,
            avgTimePerItem,
        };
    }

    /**
     * 获取格式化的内存使用
     */
    getMemoryUsage(): string {
        if (this.metrics.memoryUsage.length === 0) {
            return 'N/A';
        }

        const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        const mb = latest.heapUsed / 1024 / 1024;
        return `${mb.toFixed(2)} MB`;
    }

    /**
     * 获取峰值内存
     */
    getPeakMemory(): MemorySnapshot {
        if (this.metrics.memoryUsage.length === 0) {
            return {
                timestamp: Date.now(),
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
                rss: 0,
            };
        }

        return this.metrics.memoryUsage.reduce((peak, snapshot) =>
            snapshot.heapUsed > peak.heapUsed ? snapshot : peak
        );
    }

    /**
     * 生成性能报告
     */
    generateReport(): PerformanceReport {
        const initial = this.metrics.memoryUsage[0] || {
            timestamp: this.metrics.startTime,
            heapUsed: 0,
            heapTotal: 0,
            external: 0,
            rss: 0,
        };

        const final = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] || initial;
        const peak = this.getPeakMemory();

        return {
            operation: this.metrics.operationType,
            startTime: new Date(this.metrics.startTime).toISOString(),
            endTime: new Date(this.metrics.endTime || Date.now()).toISOString(),
            duration: this.metrics.duration || 0,
            metrics: {
                itemsProcessed: this.metrics.itemsProcessed,
                avgItemTime: this.metrics.itemsProcessed > 0
                    ? (this.metrics.duration || 0) / this.metrics.itemsProcessed
                    : 0,
                errors: this.metrics.errors,
            },
            memory: {
                initial,
                peak,
                final,
                snapshots: this.metrics.memoryUsage,
            },
            timeline: this.metrics.timeline,
        };
    }

    /**
     * 保存性能报告到文件
     */
    async saveReport(): Promise<string> {
        const reportDir = path.join(homedir(), '.cygnus', 'performance');
        await fs.ensureDir(reportDir);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${this.metrics.operationType}-${timestamp}.json`;
        const filepath = path.join(reportDir, filename);

        const report = this.generateReport();
        await fs.writeJSON(filepath, report, { spaces: 2 });

        logger.debug(`Performance report saved to: ${filepath}`);
        return filepath;
    }

    /**
     * 显示性能摘要
     */
    displaySummary() {
        const duration = this.metrics.duration || 0;
        const durationSec = (duration / 1000).toFixed(1);
        const avgTime = this.metrics.itemsProcessed > 0
            ? (duration / this.metrics.itemsProcessed / 1000).toFixed(2)
            : '0';

        const peak = this.getPeakMemory();
        const peakMB = (peak.heapUsed / 1024 / 1024).toFixed(2);

        logger.info('');
        logger.info('📊 Performance Summary:');
        logger.info(`- Total Duration: ${durationSec}s`);
        logger.info(`- Items Processed: ${this.metrics.itemsProcessed}`);
        logger.info(`- Average Time/Item: ${avgTime}s`);
        logger.info(`- Memory Usage: ${peakMB} MB (peak)`);
        logger.info(`- Errors: ${this.metrics.errors}`);
        logger.info('');
    }

    /**
     * 检查内存使用是否超过阈值
     */
    checkMemoryThreshold(thresholdMB: number): boolean {
        const peak = this.getPeakMemory();
        const peakMB = peak.heapUsed / 1024 / 1024;

        if (peakMB > thresholdMB) {
            logger.warn(
                `⚠️  Memory usage (${peakMB.toFixed(2)} MB) exceeds threshold (${thresholdMB} MB)`
            );
            return true;
        }

        return false;
    }
}
