#!/usr/bin/env node

import { Command } from "commander";
import { loadConfig, getDataDir } from "./lib/config.js";
import { logger } from "./lib/logger.js";
import { scanProjects } from "./lib/scanner/project-scanner.js";
import {
  parseMarkdownFile,
  type ParsedMarkdown,
} from "./lib/parser/markdown-parser.js";
import { analyzeWithLLM } from "./lib/agent/analyzer.js";
import type { SIPEJSON } from "./lib/agent/types.js";
import { syncAllProjects } from "./lib/sync/supabase-sync.js";
import { scanPromptRepos } from "./lib/scanner/prompt-scanner.js";
import {
  classifyPrompt,
  type ClassificationResult,
} from "./lib/agent/classifier.js";
import { syncAllPromptRepos } from "./lib/sync/prompt-sync.js";
import {
  saveProjectState,
  loadProjectState,
  isCacheValid,
} from "./lib/cache/state-cache.js";

const program = new Command();

program
  .name("cygnus")
  .description("Cygnus-OS CLI tool for project sync and prompt management")
  .version("0.1.0")
  .option("-v, --verbose", "Enable verbose logging", false)
  .option("-c, --config <path>", "Path to config file");

program
  .command("sync")
  .description("Sync all projects to Supabase")
  .option("-d, --data-dir <path>", "Data directory path")
  .option("--dry-run", "Perform a dry run without syncing", false)
  .action(async (options) => {
    try {
      const config = loadConfig();
      const dataDir = options.dataDir || getDataDir(config);
      logger.info("🚀 Starting project sync...");

      if (options.dryRun) {
        logger.warn("Dry run mode: No data will be synced");
      }

      // 1. 扫描项目
      const projects = scanProjects(dataDir);
      if (projects.length === 0) {
        logger.warn("No projects found");
        return;
      }

      // 2. 解析每个项目的 Markdown 文件
      const sipeData = new Map<string, SIPEJSON>();
      for (const project of projects) {
        if (project.markdownFiles.length === 0) {
          logger.warn(`No markdown files found for project: ${project.name}`);
          continue;
        }

        // 检查缓存
        let sipeJson;
        if (isCacheValid(project.path, project.markdownFiles)) {
          const cachedState = loadProjectState(project.path);
          if (cachedState) {
            logger.debug(`Using cached state for: ${project.name}`);
            sipeJson = cachedState.sipeJson;
            sipeData.set(project.path, sipeJson);
            continue;
          }
        }

        // 解析第一个 Markdown 文件（通常是 PRD）
        const parsed = await parseMarkdownFile(project.markdownFiles[0]);

        // 3. 使用 AI 分析（如果配置了 LLM）
        if (config.llm?.apiKey && !options.dryRun) {
          try {
            sipeJson = await analyzeWithLLM(parsed, project.name, {
              provider: config.llm.provider || "kimi",
              apiKey: config.llm.apiKey,
              apiUrl: config.llm.apiUrl,
              model: config.llm.model,
            });
          } catch (error) {
            logger.warn(`AI analysis failed, using fallback:`, error);
            // 使用备用算法
            sipeJson = generateFallbackSIPE(parsed, project.name);
          }
        } else {
          sipeJson = generateFallbackSIPE(parsed, project.name);
        }

        // 保存到缓存
        saveProjectState(project.path, sipeJson, project.markdownFiles);
        sipeData.set(project.path, sipeJson);
      }

      // 4. 同步到 Supabase
      if (
        !options.dryRun &&
        config.supabase?.url &&
        config.supabase?.serviceRoleKey
      ) {
        const result = await syncAllProjects(projects, sipeData, {
          url: config.supabase.url,
          serviceRoleKey: config.supabase.serviceRoleKey,
        });
        logger.success(
          `Sync completed: ${result.success} success, ${result.failed} failed`
        );
      } else if (options.dryRun) {
        logger.info("Dry run: Would sync the following projects:");
        for (const project of projects) {
          const sipe = sipeData.get(project.path);
          logger.info(
            `  - ${project.name}: ${sipe?.progress || 0}% progress, health: ${sipe?.health_score || 0}`
          );
        }
      } else {
        logger.warn("Supabase config not found, skipping sync");
      }
    } catch (error) {
      logger.error("Sync failed:", error);
      process.exit(1);
    }
  });

program
  .command("classify")
  .description("Auto-classify prompts using AI Agent")
  .option("-d, --data-dir <path>", "Data directory path")
  .option("--interactive", "Interactive mode for confirmation", false)
  .action(async (options) => {
    try {
      const config = loadConfig();
      const dataDir = options.dataDir || getDataDir(config);
      const promptsDir = `${dataDir}/prompts`;

      logger.info("🤖 Starting prompt classification...");

      // 扫描 Prompt Repos
      const repos = scanPromptRepos(promptsDir);
      if (repos.length === 0) {
        logger.warn("No prompt repos found");
        return;
      }

      logger.info(`Found ${repos.length} prompt repo(s)`);

      // 使用 AI 进行分类（如果配置了 LLM）
      const classifications = new Map<string, ClassificationResult>();
      if (config.llm?.apiKey) {
        logger.info("Starting AI classification...");
        for (const repo of repos) {
          try {
            const classification = await classifyPrompt(repo, {
              provider: config.llm.provider || "kimi",
              apiKey: config.llm.apiKey,
              apiUrl: config.llm.apiUrl,
              model: config.llm.model,
            });
            classifications.set(repo.path, classification);

            if (options.interactive) {
              logger.info(`\n分类结果: ${repo.name}`);
              logger.info(`  Domain: ${classification.domain}`);
              logger.info(`  Scenario: ${classification.scenario}`);
              logger.info(`  Tags: ${classification.tags.join(", ")}`);
              logger.info(`  Summary: ${classification.summary}`);
              // TODO: 添加确认逻辑
            }
          } catch (error) {
            logger.warn(`Classification failed for ${repo.name}:`, error);
          }
        }
      } else {
        logger.warn("LLM API Key not configured, skipping classification");
      }

      // 同步到 Supabase（如果配置了）
      if (
        !options.interactive &&
        config.supabase?.url &&
        config.supabase?.serviceRoleKey
      ) {
        const result = await syncAllPromptRepos(repos, classifications, {
          url: config.supabase.url,
          serviceRoleKey: config.supabase.serviceRoleKey,
        });
        logger.success(
          `Sync completed: ${result.success} success, ${result.failed} failed`
        );
      }

      logger.success("Classification completed successfully");
    } catch (error) {
      logger.error("Classification failed:", error);
      process.exit(1);
    }
  });

// 处理全局选项
program.hook("preAction", (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.verbose) {
    logger.setLevel(0); // DEBUG
  }
});

// 辅助函数：生成备用 SIPE JSON
function generateFallbackSIPE(
  parsed: ParsedMarkdown,
  projectName: string
): SIPEJSON {
  const totalTasks = parsed.tasks.length;
  const completedTasks = parsed.tasks.filter(
    (t) => t.status === "completed"
  ).length;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    project_name: projectName,
    last_sync: new Date().toISOString(),
    progress,
    tasks: parsed.tasks.map((task, idx) => ({
      id: idx + 1,
      text: task.text,
      status: task.status,
      priority: task.priority || "medium",
    })),
    requirements: parsed.requirements,
    health_score: progress, // 简化处理
  };
}

program.parse();
