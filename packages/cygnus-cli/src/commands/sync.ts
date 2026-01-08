
import { Command } from "commander";
import { loadConfig, getDataDir } from "../lib/config.js";
import { logger } from "../lib/logger.js";
import { scanProjects } from "../lib/scanner/project-scanner.js";
import { parseMarkdownFile, type ParsedMarkdown } from "../lib/parser/markdown-parser.js";
import { analyzeWithLLM } from "../lib/agent/analyzer.js";
import type { SIPEJSON } from "../lib/agent/types.js";
import { syncAllProjects } from "../lib/sync/supabase-sync.js";
import { saveProjectState, loadProjectState, isCacheValid } from "../lib/cache/state-cache.js";
import { scanPromptRepos } from "../lib/scanner/prompt-scanner.js";
import { syncAllPromptRepos } from "../lib/sync/prompt-sync.js";
import { generatePromptManifest } from "../lib/scanner/prompt-scanner.js";
import path from "path";
import fs from "fs-extra";
import {
    createRecoveryState,
    saveRecoveryState,
    loadRecoveryState,
    clearRecoveryState,
    hasRecoveryState,
    isProjectCompleted,
    getRecoverySummary,
} from "../lib/recovery/recovery-manager.js";
import type { RecoveryState } from "../lib/recovery/recovery-types.js";
import { PerformanceMonitor } from "../lib/performance/performance-monitor.js";
import { ProgressBar } from "../lib/utils/progress-bar.js";

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

export const syncCommand = new Command("sync")
    .description("Sync all projects to Supabase")
    .option("-d, --data-dir <path>", "Data directory path")
    .option("--owner-id <uuid>", "User ID (UUID) to assign as project owner. If not provided, projects will have owner_id=null (not visible to any user due to RLS)")
    .option("--dry-run", "Perform a dry run without syncing", false)
    .option("--recover", "Resume from last failed sync operation", false)
    .option("--no-retry", "Disable retry logic for failed operations", false)
    .option("--max-retries <n>", "Maximum number of retries", "3")
    .option("--profile", "Enable detailed performance profiling", false)
    .option("--no-progress", "Disable progress bar", false)
    .option("--quiet", "Suppress non-essential output", false)
    .action(async (options) => {
        let recoveryState: RecoveryState | null = null;
        let performanceMonitor: PerformanceMonitor | undefined;
        let projectProgress: ProgressBar | undefined;
        let promptProgress: ProgressBar | undefined;

        try {
            const config = loadConfig();
            const dataDir = options.dataDir || getDataDir(config);

            // Check for existing recovery state
            if (options.recover && hasRecoveryState()) {
                recoveryState = loadRecoveryState();
                if (recoveryState) {
                    logger.recovery("Found existing recovery state");
                    if (!options.quiet) {
                        logger.info(getRecoverySummary(recoveryState));
                    }
                }
            } else if (hasRecoveryState() && !options.recover) {
                logger.warn("Previous sync did not complete successfully.");
                logger.info("Run 'cygnus sync --recover' to resume from last checkpoint.");
            }

            // Initialize performance monitoring
            if (config.performance?.enabled !== false && !options.dryRun) {
                performanceMonitor = new PerformanceMonitor('sync');
                if (config.performance?.snapshotInterval) {
                    performanceMonitor.startMemoryMonitoring(config.performance.snapshotInterval);
                }
                performanceMonitor.addTimelineEvent('scan_start');
            }

            if (!options.quiet) {
                logger.info("🚀 Starting project sync...");
            }

            if (options.dryRun) {
                logger.warn("Dry run mode: No data will be synced");
            }

            // Initialize recovery state if not recovering
            if (!recoveryState && !options.dryRun) {
                const recoveryConfig = {
                    maxRetries: parseInt(options.maxRetries, 10),
                    retryDelayMs: config.recovery?.retryDelayMs || 1000,
                    autoResume: config.recovery?.autoResume || false,
                };
                recoveryState = createRecoveryState('sync', recoveryConfig);
                saveRecoveryState(recoveryState);
            }

            // 1. 扫描项目
            const projects = scanProjects(dataDir);
            if (projects.length === 0) {
                logger.warn("No projects found");
            }

            if (performanceMonitor) {
                performanceMonitor.addTimelineEvent('scan_end', { count: projects.length });
                performanceMonitor.setTotal(projects.length);
            }

            // 2. 解析每个项目的 Markdown 文件
            const sipeData = new Map<string, SIPEJSON>();
            for (const project of projects) {
                // Skip if already completed in recovery
                if (recoveryState && isProjectCompleted(recoveryState, project.path)) {
                    logger.recovery(`Skipping completed project: ${project.name}`);
                    continue;
                }

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
                            provider: (config.llm.provider as "kimi" | "qwen" | "openai") || "kimi",
                            apiKey: config.llm.apiKey,
                            apiUrl: config.llm.apiUrl,
                            model: config.llm.model,
                        });
                    } catch (error) {
                        logger.warn(`AI analysis failed, using fallback:`, error);
                        sipeJson = generateFallbackSIPE(parsed, project.name);
                    }
                } else {
                    sipeJson = generateFallbackSIPE(parsed, project.name);
                }

                // 保存到缓存
                saveProjectState(project.path, sipeJson, project.markdownFiles);
                sipeData.set(project.path, sipeJson);
            }

            if (performanceMonitor) {
                performanceMonitor.addTimelineEvent('parse_end');
            }

            // 4. 同步到 Supabase
            if (
                !options.dryRun &&
                config.supabase?.url &&
                config.supabase?.serviceRoleKey
            ) {
                // Initialize progress bar for projects
                if (options.progress && projects.length > 0 && !options.quiet) {
                    projectProgress = new ProgressBar(projects.length);
                    projectProgress.start();
                }

                if (performanceMonitor) {
                    performanceMonitor.addTimelineEvent('sync_projects_start');
                }

                // 获取 ownerId：优先使用命令行参数，其次使用配置文件，最后为 undefined
                const ownerId = options.ownerId || config.supabase?.ownerId;

                if (!ownerId && !options.quiet) {
                    logger.warn("⚠️  No owner_id specified. Projects will be created with owner_id=null.");
                    logger.warn("   These projects will NOT be visible to any user due to RLS policies.");
                    logger.warn("   Use --owner-id <uuid> or set supabase.ownerId in config file.");
                }

                const result = await syncAllProjects(projects, sipeData, {
                    url: config.supabase.url,
                    serviceRoleKey: config.supabase.serviceRoleKey,
                }, recoveryState, !options.retry, projectProgress, performanceMonitor, ownerId);

                if (projectProgress) {
                    projectProgress.finish();
                }

                if (performanceMonitor) {
                    performanceMonitor.addTimelineEvent('sync_projects_end', result);
                }

                if (!options.quiet) {
                    logger.success(
                        `Sync completed: ${result.success} success, ${result.failed} failed`
                    );
                }
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

            // 5. 同步 Prompt Repos
            logger.info("📦 Starting prompt repo sync...");
            const promptsDir = path.join(dataDir, "prompts");
            const promptRepos = scanPromptRepos(promptsDir);

            if (promptRepos.length > 0) {
                logger.info(`Found ${promptRepos.length} prompt repo(s)`);

                // Generate Index (.cygnus/index.json)
                const manifest = generatePromptManifest(promptRepos);
                const indexDir = path.join(dataDir, ".cygnus");
                await fs.ensureDir(indexDir);
                await fs.writeJSON(path.join(indexDir, "index.json"), manifest, { spaces: 2 });
                logger.info(`Generated prompt index at ${path.join(indexDir, "index.json")}`);

                if (!options.dryRun && config.supabase?.url && config.supabase?.serviceRoleKey) {
                    // Initialize progress bar for prompts
                    if (options.progress && promptRepos.length > 0 && !options.quiet) {
                        promptProgress = new ProgressBar(promptRepos.length);
                        promptProgress.start();
                    }

                    if (performanceMonitor) {
                        performanceMonitor.addTimelineEvent('sync_prompts_start');
                    }

                    const result = await syncAllPromptRepos(
                        promptRepos,
                        new Map(),
                        {
                            url: config.supabase.url,
                            serviceRoleKey: config.supabase.serviceRoleKey,
                            force: false
                        },
                        recoveryState,
                        !options.retry,
                        promptProgress,
                        performanceMonitor
                    );

                    if (promptProgress) {
                        promptProgress.finish();
                    }

                    if (performanceMonitor) {
                        performanceMonitor.addTimelineEvent('sync_prompts_end', result);
                    }

                    if (!options.quiet) {
                        logger.success(`Prompt sync completed: ${result.success} success, ${result.failed} failed`);
                    }
                } else if (options.dryRun) {
                    logger.info("Dry run: Would sync prompt repos:");
                    promptRepos.forEach(r => logger.info(`  - ${r.name} (${r.ltreePath})`));
                }
            } else {
                logger.info("No prompt repos found");
            }

            // Clear recovery state on success
            if (!options.dryRun) {
                clearRecoveryState();
                if (!options.quiet) {
                    logger.recovery("Recovery state cleared - sync completed successfully");
                }
            }

            // End performance monitoring and generate report
            if (performanceMonitor) {
                performanceMonitor.end();

                // Check memory threshold
                if (config.performance?.memoryWarningThreshold) {
                    performanceMonitor.checkMemoryThreshold(config.performance.memoryWarningThreshold);
                }

                // Display summary
                if (!options.quiet) {
                    performanceMonitor.displaySummary();
                }

                // Save detailed report if profiling is enabled
                if (options.profile || config.performance?.saveReports) {
                    const reportPath = await performanceMonitor.saveReport();
                    logger.info(`📄 Performance report saved to: ${reportPath}`);
                }
            }

        } catch (error) {
            logger.error("Sync failed:", error);
            if (recoveryState) {
                saveRecoveryState(recoveryState);
                logger.recovery("Recovery state saved. Run 'cygnus sync --recover' to resume.");
            }
            process.exit(1);
        }
    });
