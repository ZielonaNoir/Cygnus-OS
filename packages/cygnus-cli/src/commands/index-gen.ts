
import { Command } from "commander";
import { loadConfig, getDataDir } from "../lib/config.js";
import { logger } from "../lib/logger.js";
import { scanPromptRepos, generatePromptManifest } from "../lib/scanner/prompt-scanner.js";
import fs from "fs-extra";
import path from "path";

export const indexCommand = new Command("index-gen")
    .description("Generate full index for prompt repositories")
    .option("-d, --data-dir <path>", "Data directory path")
    .option("-o, --output <path>", "Output file path (default: .cygnus/index.json)")
    .action(async (options) => {
        try {
            const config = loadConfig();
            const dataDir = options.dataDir || getDataDir(config);
            const promptsDir = path.join(dataDir, "prompts");

            logger.info("📦 Starting index generation...");
            logger.debug(`Scanning prompts in: ${promptsDir}`);

            const repos = scanPromptRepos(promptsDir);

            if (repos.length === 0) {
                logger.warn("No prompt repos found");
                return;
            }

            logger.info(`Found ${repos.length} prompt repo(s)`);

            const manifest = generatePromptManifest(repos);

            let outputPath = options.output;
            if (!outputPath) {
                const indexDir = path.join(dataDir, ".cygnus");
                await fs.ensureDir(indexDir);
                outputPath = path.join(indexDir, "index.json");
            }

            // Ensure output directory exists if custom path provided
            await fs.ensureDir(path.dirname(outputPath));

            await fs.writeJSON(outputPath, manifest, { spaces: 2 });
            logger.success(`Index generated successfully at: ${outputPath}`);

        } catch (error) {
            logger.error("Failed to generate index:", error);
            process.exit(1);
        }
    });
