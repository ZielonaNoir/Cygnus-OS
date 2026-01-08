/**
 * File Operations Utility
 * Provides safe file system operations for prompt repositories
 */

import fs from "fs-extra";
import path from "path";
import { logger } from "../logger.js";
import type { PromptRepoInfo } from "../scanner/prompt-scanner.js";

export interface MoveResult {
    success: boolean;
    newPath?: string;
    newLtreePath?: string;
    error?: string;
}

/**
 * Moves a prompt repository to a new location based on LTree path
 * 
 * @param repoInfo Current repository info
 * @param targetLtreePath Target LTree path (e.g., "Coding.Frontend.MyRepo")
 * @param dataDir Base data directory
 * @returns MoveResult
 */
export async function movePromptRepo(
    repoInfo: PromptRepoInfo,
    targetLtreePath: string,
    dataDir: string
): Promise<MoveResult> {
    try {
        const oldPath = repoInfo.path;

        // Validate target LTree path format
        if (!targetLtreePath || !/^[a-zA-Z0-9_.-]+$/.test(targetLtreePath)) {
            return {
                success: false,
                error: `Invalid target LTree path format: ${targetLtreePath}`
            };
        }

        // Convert LTree path to filesystem path
        // Coding.Frontend.MyRepo -> prompts/Coding/Frontend/MyRepo
        const relativePath = targetLtreePath.replace(/\./g, path.sep);
        const newPath = path.join(dataDir, "prompts", relativePath);

        // Check if source exists
        if (!(await fs.pathExists(oldPath))) {
            return {
                success: false,
                error: `Source path does not exist: ${oldPath}`,
            };
        }

        // Check if destination exists (Conflict detection)
        if (await fs.pathExists(newPath)) {
            if (oldPath === newPath) {
                return {
                    success: false,
                    error: "Source and destination are the same"
                };
            }
            return {
                success: false,
                error: `Destination path already exists: ${newPath}`,
            };
        }

        logger.debug(`Moving repo from ${oldPath} to ${newPath}`);

        // Create parent directories if needed
        await fs.ensureDir(path.dirname(newPath));

        // Move the directory
        await fs.move(oldPath, newPath);

        logger.success(`Moved repo to: ${relativePath}`);

        return {
            success: true,
            newPath,
            newLtreePath: targetLtreePath,
        };
    } catch (error) {
        logger.error(`Failed to move repo: ${repoInfo.name}`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
