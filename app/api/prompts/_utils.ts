import path from 'path';
import { promises as fs } from 'fs';

export function isSafePath(p: string): boolean {
  // Only allow segments a-zA-Z0-9_- and slashes
  return /^[a-zA-Z0-9_/-]+$/.test(p);
}

// 递归搜索目录名称匹配的 Prompt
export async function findPromptByName(baseDir: string, name: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(baseDir, entry.name);
      
      // 如果当前目录名匹配，检查是否有 main.prompt
      if (entry.name === name) {
        try {
          await fs.access(path.join(fullPath, 'main.prompt'));
          return fullPath;
        } catch {
          // 继续搜索子目录
        }
      }
      
      // 递归搜索子目录
      const found = await findPromptByName(fullPath, name);
      if (found) return found;
    }
    return null;
  } catch {
    return null;
  }
}

// 解析路径：支持短名称（自动搜索）和完整路径
export async function resolvePromptPath(rawPath: string): Promise<string | null> {
  const baseDir = path.join(process.cwd(), 'data', 'prompts');
  
  // 如果 path 不包含 '/'，则认为是短名称，需要搜索
  if (!rawPath.includes('/')) {
    return await findPromptByName(baseDir, rawPath);
  }
  
  // 否则认为是完整路径
  return path.join(baseDir, ...rawPath.split('/'));
}

