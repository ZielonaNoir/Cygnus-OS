import { Command } from "commander";
import { logger } from "../lib/logger.js";
import fs from "fs-extra";
import path from "path";
import { homedir } from "os";

export const initCommand = new Command("init")
    .description("Initialize Cygnus CLI configuration interactively")
    .option("-f, --force", "Overwrite existing configuration", false)
    .action(async (options) => {
        try {
            // 动态导入 enquirer
            const enquirer = await import('enquirer');
            const { prompt } = enquirer.default;

            logger.info("🦢 Cygnus CLI Initialization Wizard");
            logger.info("This wizard will guide you through setting up your configuration file.");

            const homeConfigPath = path.join(homedir(), ".cygnusrc");

            if (fs.existsSync(homeConfigPath) && !options.force) {
                const { overwrite } = await prompt({
                    type: 'confirm',
                    name: 'overwrite',
                    message: `Configuration file already exists at ${homeConfigPath}. Overwrite?`,
                    initial: false
                }) as { overwrite: boolean };

                if (!overwrite) {
                    logger.info("Operation cancelled.");
                    return;
                }
            }

            interface EnquirerState {
                answers: {
                    supabaseUrl?: string;
                    llmProvider?: string;
                    [key: string]: unknown;
                };
            }

            const input = await prompt([
                {
                    type: 'input',
                    name: 'dataDir',
                    message: 'Where is your data directory located?',
                    initial: process.cwd() + '/data'
                },
                {
                    type: 'input',
                    name: 'supabaseUrl',
                    message: 'Supabase URL (optional):'
                },
                {
                    type: 'password',
                    name: 'supabaseKey',
                    message: 'Supabase Service Role Key (optional):',
                    skip: (state: EnquirerState) => !state.answers.supabaseUrl
                },
                {
                    type: 'select',
                    name: 'llmProvider',
                    message: 'Select LLM Provider:',
                    choices: ['kimi', 'qwen', 'openai'],
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    initial: 0 as any
                } as unknown, // Enquirer type definition workaround
                {
                    type: 'password',
                    name: 'llmApiKey',
                    message: 'LLM API Key:',
                    required: true
                },
                {
                    type: 'input',
                    name: 'llmModel',
                    message: 'LLM Model Name:',
                    initial: (state: EnquirerState) => {
                        switch (state.answers.llmProvider) {
                            case 'kimi': return 'moonshot-v1-8k';
                            case 'qwen': return 'qwen-turbo';
                            case 'openai': return 'gpt-4o';
                            default: return 'gpt-3.5-turbo';
                        }
                    }
                },
                {
                    type: 'input',
                    name: 'llmApiUrl',
                    message: 'LLM API Base URL (optional):'
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ] as any) as {
                dataDir: string;
                supabaseUrl?: string;
                supabaseKey?: string;
                llmProvider: 'kimi' | 'qwen' | 'openai';
                llmApiKey: string;
                llmModel: string;
                llmApiUrl?: string;
            };

            const config = {
                dataDir: input.dataDir,
                supabase: input.supabaseUrl ? {
                    url: input.supabaseUrl,
                    serviceRoleKey: input.supabaseKey
                } : undefined,
                llm: {
                    provider: input.llmProvider,
                    apiKey: input.llmApiKey,
                    apiUrl: input.llmApiUrl || undefined,
                    model: input.llmModel
                }
            };

            await fs.writeJSON(homeConfigPath, config, { spaces: 2 });
            logger.success(`✅ Configuration saved to ${homeConfigPath}`);
            logger.info("You can now run 'cygnus sync' or 'cygnus classify' to manage your data.");

        } catch (error) {
            logger.error("Initialization failed:", error);
        }
    });
