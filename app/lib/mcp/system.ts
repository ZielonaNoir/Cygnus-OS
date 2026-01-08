
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 获取系统日志
 */
export async function getLogs(lines: number = 50, type: 'cli' | 'recovery' = 'cli') {
    const logDir = path.join(os.homedir(), '.cygnus', 'logs');
    
    let logFile: string;

    if (type === 'recovery') {
        logFile = path.join(logDir, 'recovery.log');
    } else {
        // Find the latest daily log file
        try {
            if (!fs.existsSync(logDir)) return { error: "Log directory not found" };
            
            const files = fs.readdirSync(logDir)
                .filter(f => f.startsWith('cygnus-') && f.endsWith('.log'))
                .sort()
                .reverse();
                
            if (files.length === 0) return { error: "No log files found" };
            logFile = path.join(logDir, files[0]);
        } catch (error) {
            return { error: `Failed to list log files: ${error}` };
        }
    }

    try {
        if (!fs.existsSync(logFile)) return { error: "Log file not found" };

        const content = fs.readFileSync(logFile, 'utf-8');
        const allLines = content.split('\n');
        // Get last N lines
        const result = allLines.slice(-lines);
        
        return {
            file: logFile,
            totalLines: allLines.length,
            requestedLines: lines,
            content: result
        };
    } catch (error) {
        return { error: `Failed to read log file: ${error}` };
    }
}
