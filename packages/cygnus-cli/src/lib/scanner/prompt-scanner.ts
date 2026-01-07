/**
 * Prompt 文件系统扫描器
 * 扫描 /data/prompts 目录，识别 Prompt Repo 结构
 */

import { readdirSync, statSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { logger } from "../logger.js";
import * as yaml from "js-yaml";

export interface PromptRepoInfo {
  name: string;
  path: string;
  domain: string;
  scenario: string;
  asset: string;
  ltreePath: string; // LTree 格式路径
  mainPromptPath: string | null;
  contextMdPath: string | null;
  configYamlPath: string | null;
  config?: PromptConfig;
}

export interface PromptConfig {
  version?: string;
  tags?: string[];
  domain?: string;
  scenario?: string;
  summary?: string;
  [key: string]: unknown;
}

/**
 * 扫描 Prompt 目录
 */
export function scanPromptRepos(promptsDir: string): PromptRepoInfo[] {
  const repos: PromptRepoInfo[] = [];

  if (!existsSync(promptsDir)) {
    logger.warn(`Prompts directory does not exist: ${promptsDir}`);
    return repos;
  }

  logger.info(`Scanning prompts in: ${promptsDir}`);

  // 扫描 Domain 目录（一级分类）
  const domains = scanDirectory(promptsDir, 1);
  for (const domain of domains) {
    const domainPath = join(promptsDir, domain);
    if (!statSync(domainPath).isDirectory()) {
      continue;
    }

    // 扫描 Scenario 目录（二级分类）
    const scenarios = scanDirectory(domainPath, 1);
    for (const scenario of scenarios) {
      const scenarioPath = join(domainPath, scenario);
      if (!statSync(scenarioPath).isDirectory()) {
        continue;
      }

      // 扫描 Asset 目录（Prompt Repo）
      const assets = scanDirectory(scenarioPath, 1);
      for (const asset of assets) {
        const assetPath = join(scenarioPath, asset);
        if (!statSync(assetPath).isDirectory()) {
          continue;
        }

        const repoInfo = scanPromptRepo(assetPath, domain, scenario, asset);
        if (repoInfo) {
          repos.push(repoInfo);
        }
      }
    }
  }

  logger.success(`Found ${repos.length} prompt repo(s)`);
  return repos;
}

/**
 * 扫描单个 Prompt Repo
 */
function scanPromptRepo(
  repoPath: string,
  domain: string,
  scenario: string,
  asset: string
): PromptRepoInfo | null {
  const mainPromptPath = join(repoPath, "main.prompt");
  const contextMdPath = join(repoPath, "context.md");
  const configYamlPath = join(repoPath, "config.yaml");

  // 至少需要 main.prompt 文件
  if (!existsSync(mainPromptPath)) {
    logger.debug(`Skipping ${asset}: no main.prompt found`);
    return null;
  }

  // 读取 config.yaml（如果存在）
  let config: PromptConfig | undefined;
  if (existsSync(configYamlPath)) {
    try {
      const configContent = readFileSync(configYamlPath, "utf-8");
      config = yaml.load(configContent) as PromptConfig;
    } catch (error) {
      logger.warn(`Failed to parse config.yaml for ${asset}:`, error);
    }
  }

  // 构建 LTree 路径
  const ltreePath = `${domain}.${scenario}.${asset}`;

  return {
    name: asset,
    path: repoPath,
    domain,
    scenario,
    asset,
    ltreePath,
    mainPromptPath: existsSync(mainPromptPath) ? mainPromptPath : null,
    contextMdPath: existsSync(contextMdPath) ? contextMdPath : null,
    configYamlPath: existsSync(configYamlPath) ? configYamlPath : null,
    config,
  };
}

/**
 * 扫描目录，返回子目录和文件列表
 */
function scanDirectory(dirPath: string, maxDepth: number = 1): string[] {
  const items: string[] = [];

  if (maxDepth <= 0) {
    return items;
  }

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      // 跳过隐藏文件和系统目录
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }

      items.push(entry.name);
    }
  } catch (error) {
    logger.warn(`Failed to read directory: ${dirPath}`, error);
  }

  return items;
}

/**
 * 读取 Prompt 文件内容
 */
export function readPromptFiles(repoInfo: PromptRepoInfo): {
  mainPrompt: string | null;
  contextMd: string | null;
  config: PromptConfig | null;
} {
  let mainPrompt: string | null = null;
  let contextMd: string | null = null;
  let config: PromptConfig | null = null;

  if (repoInfo.mainPromptPath) {
    try {
      mainPrompt = readFileSync(repoInfo.mainPromptPath, "utf-8");
    } catch (error) {
      logger.warn(
        `Failed to read main.prompt: ${repoInfo.mainPromptPath}`,
        error
      );
    }
  }

  if (repoInfo.contextMdPath) {
    try {
      contextMd = readFileSync(repoInfo.contextMdPath, "utf-8");
    } catch (error) {
      logger.warn(
        `Failed to read context.md: ${repoInfo.contextMdPath}`,
        error
      );
    }
  }

  if (repoInfo.configYamlPath) {
    try {
      const configContent = readFileSync(repoInfo.configYamlPath, "utf-8");
      config = yaml.load(configContent) as PromptConfig;
    } catch (error) {
      logger.warn(
        `Failed to read config.yaml: ${repoInfo.configYamlPath}`,
        error
      );
    }
  }

  return {
    mainPrompt,
    contextMd,
    config: config || repoInfo.config || null,
  };
}

/**
 * 生成 Prompt 清单 JSON
 */
export function generatePromptManifest(repos: PromptRepoInfo[]): {
  timestamp: string;
  total: number;
  repos: PromptRepoInfo[];
} {
  return {
    timestamp: new Date().toISOString(),
    total: repos.length,
    repos,
  };
}
