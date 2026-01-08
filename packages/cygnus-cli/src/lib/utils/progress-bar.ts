/**
 * 进度条工具 - 带 ETA 的交互式进度显示
 */

export class ProgressBar {
    private current: number = 0;
    private total: number;
    private startTime: number;
    private lastUpdate: number = 0;
    private barLength: number = 30;
    private updateInterval: number = 100; // ms

    constructor(total: number, barLength: number = 30) {
        this.total = total;
        this.startTime = Date.now();
        this.barLength = barLength;
    }

    /**
     * 启动进度条
     */
    start() {
        this.render();
    }

    /**
     * 更新进度
     */
    update(current: number) {
        this.current = Math.min(current, this.total);

        // 限制更新频率
        const now = Date.now();
        if (now - this.lastUpdate < this.updateInterval && current < this.total) {
            return;
        }

        this.lastUpdate = now;
        this.render();
    }

    /**
     * 增加进度
     */
    increment() {
        this.update(this.current + 1);
    }

    /**
     * 完成进度条
     */
    finish() {
        this.current = this.total;
        this.render();
        process.stdout.write('\n');
    }

    /**
     * 渲染进度条
     */
    private render() {
        const percentage = this.total > 0 ? (this.current / this.total) * 100 : 0;
        const filled = Math.floor((this.barLength * this.current) / this.total);
        const empty = this.barLength - filled;

        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const percent = percentage.toFixed(0).padStart(3);
        const count = `${this.current}/${this.total}`;

        let eta = '';
        if (this.current > 0 && this.current < this.total) {
            const elapsed = Date.now() - this.startTime;
            const avgTimePerItem = elapsed / this.current;
            const remaining = this.total - this.current;
            const etaMs = avgTimePerItem * remaining;
            eta = ` | ETA: ${this.formatTime(etaMs)}`;
        }

        const line = `[${bar}] ${percent}% | ${count}${eta}`;

        // 清除当前行并输出
        process.stdout.write(`\r${line}`);
    }

    /**
     * 格式化时间
     */
    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);

        if (seconds < 60) {
            return `${seconds}s`;
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes < 60) {
            return `${minutes}m ${remainingSeconds}s`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }

    /**
     * 清除进度条
     */
    clear() {
        process.stdout.write('\r\x1b[K');
    }
}
