/**
 * CLI 配置文件管理
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface CygnusConfig {
  dataDir?: string;
  supabase?: {
    url: string;
    serviceRoleKey: string;
    ownerId?: string; // 可选：指定项目所有者 ID（UUID）
  };
  llm?: {
    provider: "openai" | "qwen" | "kimi";
    apiKey?: string;
    apiUrl?: string;
    model?: string;
  };
  recovery?: {
    enabled?: boolean;
    maxRetries?: number;
    retryDelayMs?: number;
    autoResume?: boolean;
  };
  performance?: {
    enabled?: boolean;
    memoryWarningThreshold?: number; // MB
    saveReports?: boolean;
    snapshotInterval?: number; // ms
  };
}

const CONFIG_FILES = [".cygnusrc", "cygnus.config.json", ".cygnus/config.json"];

// Simple .env parser since we don't have dotenv dependence and want zero-config
function loadEnvFile(filePath: string) {
  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath, "utf-8");
      content.split("\n").forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^['"](.*)['"]$/, "$1"); // remove quotes
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    } catch {
      // ignore
    }
  }
}

// Load .env.local from typical Next.js roots (up to 3 levels up)
function loadEnvFromRoots() {
  let current = process.cwd();
  for (let i = 0; i < 3; i++) {
    loadEnvFile(join(current, ".env.local"));
    loadEnvFile(join(current, ".env"));
    current = join(current, "..");
  }
}

/**
 * 查找并读取配置文件
 */
export function loadConfig(workingDir: string = process.cwd()): CygnusConfig {
  loadEnvFromRoots();

  // 首先检查工作目录
  for (const configFile of CONFIG_FILES) {
    const configPath = join(workingDir, configFile);
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, "utf-8");
        return JSON.parse(content) as CygnusConfig;
      } catch (error) {
        console.warn(`Failed to parse config file: ${configPath}`, error);
      }
    }
  }

  // 检查用户主目录
  const homeConfigPath = join(homedir(), ".cygnusrc");
  if (existsSync(homeConfigPath)) {
    try {
      const content = readFileSync(homeConfigPath, "utf-8");
      return JSON.parse(content) as CygnusConfig;
    } catch (error) {
      console.warn(
        `Failed to parse home config file: ${homeConfigPath}`,
        error
      );
    }
  }

  // 返回默认配置（从环境变量读取）
  return {
    dataDir: process.env.CYGNUS_DATA_DIR || "./data",
    llm: {
      provider:
        (process.env.LLM_PROVIDER as "openai" | "qwen" | "kimi") || "kimi",
      apiKey:
        process.env.KIMI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.QWEN_API_KEY,
      apiUrl: process.env.KIMI_API_URL || process.env.QWEN_API_URL,
      model: process.env.LLM_MODEL,
    },
    supabase: {
      url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      ownerId: process.env.SUPABASE_OWNER_ID,
    },
    recovery: {
      enabled: process.env.RECOVERY_ENABLED !== "false",
      maxRetries: parseInt(process.env.MAX_RETRIES || "3", 10),
      retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || "1000", 10),
      autoResume: process.env.AUTO_RESUME === "true",
    },
    performance: {
      enabled: process.env.PERFORMANCE_ENABLED !== "false",
      memoryWarningThreshold: parseInt(process.env.MEMORY_WARNING_THRESHOLD || "500", 10),
      saveReports: process.env.SAVE_PERFORMANCE_REPORTS === "true",
      snapshotInterval: parseInt(process.env.SNAPSHOT_INTERVAL || "5000", 10),
    },
  };
}

/**
 * 获取数据目录路径
 */
export function getDataDir(config?: CygnusConfig): string {
  return config?.dataDir || process.env.CYGNUS_DATA_DIR || "./data";
}
