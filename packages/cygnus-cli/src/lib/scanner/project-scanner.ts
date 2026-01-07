/**
 * 项目扫描器
 * 递归扫描数据目录，识别项目根目录
 */

import { readdirSync, statSync, existsSync } from "fs";
import { join, resolve } from "path";
import { logger } from "../logger.js";

export interface ProjectInfo {
  name: string;
  path: string;
  rootPath: string;
  docsPath: string | null;
  markdownFiles: string[];
}

/**
 * 检查是否为项目根目录
 */
function isProjectRoot(dirPath: string): boolean {
  const packageJsonPath = join(dirPath, "package.json");
  const gitPath = join(dirPath, ".git");
  return existsSync(packageJsonPath) || existsSync(gitPath);
}

/**
 * 查找项目中的 Markdown 文件
 */
function findMarkdownFiles(dirPath: string): string[] {
  const markdownFiles: string[] = [];
  const docsPath = join(dirPath, "docs");

  if (!existsSync(docsPath)) {
    return markdownFiles;
  }

  try {
    const entries = readdirSync(docsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        markdownFiles.push(join(docsPath, entry.name));
      }
    }
  } catch (error) {
    logger.warn(`Failed to read docs directory: ${docsPath}`, error);
  }

  return markdownFiles;
}

/**
 * 递归扫描目录，查找所有项目
 */
export function scanProjects(dataDir: string): ProjectInfo[] {
  const projects: ProjectInfo[] = [];
  const visited = new Set<string>();

  function scanDirectory(currentPath: string, depth: number = 0) {
    // 限制扫描深度，避免无限递归
    if (depth > 10) {
      return;
    }

    const normalizedPath = resolve(currentPath);
    if (visited.has(normalizedPath)) {
      return;
    }
    visited.add(normalizedPath);

    try {
      const stats = statSync(normalizedPath);
      if (!stats.isDirectory()) {
        return;
      }

      // 检查是否为项目根目录
      if (isProjectRoot(normalizedPath)) {
        const markdownFiles = findMarkdownFiles(normalizedPath);
        const projectName = normalizedPath.split(/[/\\]/).pop() || "unknown";

        projects.push({
          name: projectName,
          path: normalizedPath,
          rootPath: normalizedPath,
          docsPath: existsSync(join(normalizedPath, "docs"))
            ? join(normalizedPath, "docs")
            : null,
          markdownFiles,
        });

        logger.debug(`Found project: ${projectName} at ${normalizedPath}`);
        return; // 找到项目根目录后不再深入
      }

      // 继续扫描子目录
      const entries = readdirSync(normalizedPath, { withFileTypes: true });
      for (const entry of entries) {
        // 跳过隐藏目录和 node_modules
        if (
          entry.name.startsWith(".") ||
          entry.name === "node_modules" ||
          entry.name === ".git"
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          scanDirectory(join(normalizedPath, entry.name), depth + 1);
        }
      }
    } catch (error) {
      logger.warn(`Failed to scan directory: ${normalizedPath}`, error);
    }
  }

  if (!existsSync(dataDir)) {
    logger.warn(`Data directory does not exist: ${dataDir}`);
    return projects;
  }

  logger.info(`Scanning projects in: ${dataDir}`);
  scanDirectory(dataDir);
  logger.success(`Found ${projects.length} project(s)`);

  return projects;
}

/**
 * 生成项目清单 JSON
 */
export function generateProjectManifest(projects: ProjectInfo[]): {
  timestamp: string;
  total: number;
  projects: ProjectInfo[];
} {
  return {
    timestamp: new Date().toISOString(),
    total: projects.length,
    projects,
  };
}
