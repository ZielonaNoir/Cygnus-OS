/**
 * CLI 日志工具 - 增强版
 * 支持彩色输出、时间戳、日志文件
 */

import fs from "fs-extra";
import path from "path";
import { homedir } from "os";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// ANSI 颜色代码
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // 前景色
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  // 背景色
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
};

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private logFile?: string;
  private recoveryLogFile?: string;
  private enableColors: boolean = true;

  constructor() {
    // 默认日志文件位置
    const logDir = path.join(homedir(), ".cygnus", "logs");
    this.initLogFile(logDir);
  }

  /**
   * 初始化日志文件
   */
  private initLogFile(logDir: string) {
    try {
      fs.ensureDirSync(logDir);
      const today = new Date().toISOString().split("T")[0];
      this.logFile = path.join(logDir, `cygnus-${today}.log`);
      this.recoveryLogFile = path.join(logDir, `recovery.log`);
    } catch {
      // 如果无法创建日志文件，静默失败
      this.logFile = undefined;
      this.recoveryLogFile = undefined;
    }
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel) {
    this.level = level;
  }

  /**
   * 启用/禁用彩色输出
   */
  setColors(enabled: boolean) {
    this.enableColors = enabled;
  }

  /**
   * 设置自定义日志文件路径
   */
  setLogFile(filepath: string) {
    try {
      fs.ensureDirSync(path.dirname(filepath));
      this.logFile = filepath;
    } catch {
      this.warn(`Failed to set log file: ${filepath}`);
    }
  }

  /**
   * 格式化时间戳
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * 应用颜色
   */
  private colorize(text: string, color: string): string {
    if (!this.enableColors) return text;
    return `${color}${text}${colors.reset}`;
  }

  /**
   * 写入日志文件
   */
  private writeToFile(level: string, message: string, args: unknown[], toRecoveryLog = false) {
    const targetFile = toRecoveryLog ? this.recoveryLogFile : this.logFile;
    if (!targetFile) return;

    try {
      const timestamp = this.getTimestamp();
      const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : "";
      const logLine = `[${timestamp}] [${level}] ${message}${argsStr}\n`;

      fs.appendFileSync(targetFile, logLine, "utf-8");
    } catch {
      // 静默失败
    }
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      const prefix = this.colorize("🔍 [DEBUG]", colors.gray);
      const msg = this.colorize(message, colors.gray);
      console.log(`${prefix} ${msg}`, ...args);
      this.writeToFile("DEBUG", message, args);
    }
  }

  /**
   * INFO 级别日志
   */
  info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      const prefix = this.colorize("ℹ️  [INFO]", colors.blue);
      console.log(`${prefix} ${message}`, ...args);
      this.writeToFile("INFO", message, args);
    }
  }

  /**
   * WARN 级别日志
   */
  warn(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      const prefix = this.colorize("⚠️  [WARN]", colors.yellow);
      console.warn(`${prefix} ${message}`, ...args);
      this.writeToFile("WARN", message, args);
    }
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.ERROR) {
      const prefix = this.colorize("❌ [ERROR]", colors.red);
      const msg = this.colorize(message, colors.red);
      console.error(`${prefix} ${msg}`, ...args);
      this.writeToFile("ERROR", message, args);
    }
  }

  /**
   * SUCCESS 成功日志
   */
  success(message: string, ...args: unknown[]) {
    const prefix = this.colorize("✅", colors.green);
    const msg = this.colorize(message, colors.green);
    console.log(`${prefix} ${msg}`, ...args);
    this.writeToFile("SUCCESS", message, args);
  }

  /**
   * RECOVERY 恢复操作日志
   */
  recovery(message: string, ...args: unknown[]) {
    const prefix = this.colorize("♻️  [RECOVERY]", colors.magenta);
    const msg = this.colorize(message, colors.magenta);
    console.log(`${prefix} ${msg}`, ...args);
    // Write to both regular log and recovery log
    this.writeToFile("RECOVERY", message, args, false);
    this.writeToFile("RECOVERY", message, args, true);
  }

  /**
   * 进度日志（带动画）
   */
  progress(message: string) {
    const spinner = this.colorize("⏳", colors.cyan);
    process.stdout.write(`${spinner} ${message}...\r`);
  }

  /**
   * 清除进度行
   */
  clearProgress() {
    process.stdout.write("\r\x1b[K");
  }

  /**
   * 分隔线
   */
  divider(char: string = "─", length: number = 60) {
    const line = char.repeat(length);
    console.log(this.colorize(line, colors.dim));
  }

  /**
   * 表格式输出（用于数据展示）
   */
  table(headers: string[], rows: string[][]) {
    const colWidths = headers.map((h, i) => {
      const colValues = [h, ...rows.map(r => r[i] || "")];
      return Math.max(...colValues.map(v => v.length)) + 2;
    });

    // 打印表头
    const headerRow = headers
      .map((h, i) => h.padEnd(colWidths[i]))
      .join(" | ");
    console.log(this.colorize(headerRow, `${colors.bright}${colors.cyan}`));

    // 打印分隔线
    const separator = colWidths.map(w => "─".repeat(w)).join("─┼─");
    console.log(this.colorize(separator, colors.dim));

    // 打印数据行
    rows.forEach(row => {
      const rowStr = row
        .map((cell, i) => (cell || "").padEnd(colWidths[i]))
        .join(" │ ");
      console.log(rowStr);
    });
  }
}

export const logger = new Logger();
