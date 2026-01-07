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
  };
  llm?: {
    provider: "openai" | "qwen" | "kimi";
    apiKey?: string;
    apiUrl?: string;
    model?: string;
  };
}

const CONFIG_FILES = [".cygnusrc", "cygnus.config.json", ".cygnus/config.json"];

/**
 * 查找并读取配置文件
 */
export function loadConfig(workingDir: string = process.cwd()): CygnusConfig {
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
      url: process.env.SUPABASE_URL || "",
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    },
  };
}

/**
 * 获取数据目录路径
 */
export function getDataDir(config?: CygnusConfig): string {
  return config?.dataDir || process.env.CYGNUS_DATA_DIR || "./data";
}
