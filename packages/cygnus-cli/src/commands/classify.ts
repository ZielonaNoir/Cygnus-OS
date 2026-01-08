

import { Command } from "commander";
import { loadConfig, getDataDir } from "../lib/config.js";
import { logger } from "../lib/logger.js";
import { scanPromptRepos } from "../lib/scanner/prompt-scanner.js";
import { classifyPrompt, type ClassificationResult } from "../lib/agent/classifier.js";
import { syncAllPromptRepos, renamePromptRepoInDb } from "../lib/sync/prompt-sync.js";
import { movePromptRepo } from "../lib/utils/file-ops.js";



// Define a type for enquirer prompt options since we don't have types installed


// Importing enquirer dynamically or using require might be necessary if it's a CJS module,
// but usually `import pkg from 'enquirer'; const { Prompt } = pkg;` works for ESM interop if configured.
// However, since we are in TypeScript with ESM target, let's try standard import.
// If type checking fails, we might need a workaround. For now assuming @types/enquirer or loose typing.
// Since we don't want to break the build, let's use a simple confirm function wrapper.

async function confirmAction(message: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { Confirm } = await import('enquirer') as any;
    const prompt = new Confirm({
        name: 'confirm',
        message
    });
    return await prompt.run();
}

export const classifyCommand = new Command("classify")
    .description("Auto-classify prompts using AI Agent")
    .option("-d, --data-dir <path>", "Data directory path")
    .option("--interactive", "Interactive mode for confirmation", false)
    .option("--auto-move", "Automatically move files based on suggestion (Dangerous)", false)
    .option("-f, --force", "Force overwrite remote prompts even if they conflict", false)
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
                            provider: (config.llm.provider as "kimi" | "qwen" | "openai") || "kimi",
                            apiKey: config.llm.apiKey,
                            apiUrl: config.llm.apiUrl,
                            model: config.llm.model,
                        });
                        classifications.set(repo.path, classification);

                        logger.info(`\n分类结果: ${repo.name}`);
                        logger.info(`  Domain: ${classification.domain}`);
                        logger.info(`  Scenario: ${classification.scenario}`);
                        logger.info(`  Tags: ${classification.tags.join(", ")}`);
                        logger.info(`  Summary: ${classification.summary}`);

                        // Auto-move logic
                        if (options.interactive || options.autoMove) {
                            if (classification.suggestedPath) {
                                // Construct target LTree path locally to display to user
                                // The classifier returns suggested path like "Coding.Frontend.Nuxt"
                                const suggestedLtree = classification.suggestedPath;

                                // Check if move is needed
                                if (repo.ltreePath !== suggestedLtree) {
                                    const shouldMove = options.autoMove || await confirmAction(`Move from "${repo.ltreePath}" to "${suggestedLtree}"?`);

                                    if (shouldMove) {
                                        const moveResult = await movePromptRepo(repo, suggestedLtree, dataDir);

                                        if (moveResult.success && moveResult.newLtreePath) {
                                            // 1. Rename in Database (to preserve ID)
                                            if (config.supabase?.url && config.supabase?.serviceRoleKey) {
                                                await renamePromptRepoInDb(
                                                    repo.ltreePath,
                                                    moveResult.newLtreePath,
                                                    {
                                                        url: config.supabase.url,
                                                        serviceRoleKey: config.supabase.serviceRoleKey
                                                    }
                                                );
                                            }

                                            // 2. Update local repo object in-place so subsequent sync works
                                            repo.ltreePath = moveResult.newLtreePath;
                                            if (moveResult.newPath) {
                                                repo.path = moveResult.newPath;
                                            }
                                            // Update domain/scenario in repo info
                                            repo.domain = classification.domain;
                                            repo.scenario = classification.scenario;
                                        }
                                    }
                                } else {
                                    logger.debug("Prompt is already at suggested path");
                                }
                            }
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
                // Determine sync config
                const syncConfig = {
                    url: config.supabase.url,
                    serviceRoleKey: config.supabase.serviceRoleKey,
                    force: options.force,
                };

                // If we moved files interactively, we should allow sync to proceed without asking again
                // But typically syncAllPromptRepos is non-interactive.

                const result = await syncAllPromptRepos(repos, classifications, syncConfig);
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

