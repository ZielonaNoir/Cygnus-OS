/**
 * Markdown 解析器
 * 解析 Markdown 文件，提取任务列表和项目信息
 */

import { readFileSync } from "fs";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import { logger } from "../logger.js";
// Note: SIPETask type is defined in the main project types
// For CLI, we'll use a local type definition
export type SIPETask = {
  id: number;
  text: string;
  status: "completed" | "pending";
  priority: "low" | "medium" | "high" | "urgent";
};

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  content: string;
  tasks: ExtractedTask[];
  requirements: string[];
  projectStage: "demo" | "mvp" | "production" | "unknown";
}

export interface ExtractedTask {
  text: string;
  status: "completed" | "pending";
  lineNumber: number;
  priority?: "low" | "medium" | "high" | "urgent";
}

/**
 * 解析 Markdown 文件
 */
export async function parseMarkdownFile(
  filePath: string
): Promise<ParsedMarkdown> {
  try {
    const content = readFileSync(filePath, "utf-8");
    return await parseMarkdown(content);
  } catch (error) {
    logger.error(`Failed to read markdown file: ${filePath}`, error);
    throw error;
  }
}

/**
 * 解析 Markdown 内容
 */
export async function parseMarkdown(
  content: string
): Promise<ParsedMarkdown> {
  // 提取 frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  let frontmatter: Record<string, unknown> = {};
  let markdownContent = content;

  if (frontmatterMatch) {
    try {
      // 简单的 YAML 解析（实际应该使用 js-yaml）
      const yamlContent = frontmatterMatch[1];
      frontmatter = parseSimpleYaml(yamlContent);
      markdownContent = content.replace(/^---\n[\s\S]*?\n---\n/, "");
    } catch (error) {
      logger.warn("Failed to parse frontmatter", error);
    }
  }

  // 使用 remark 解析 Markdown（用于验证，实际提取使用正则）
  const processor = remark().use(remarkGfm).use(remarkFrontmatter);
  const ast = processor.parse(markdownContent);

  // 提取任务列表（传入 ast 用于未来扩展，当前使用正则）
  const tasks = extractTasks(ast, markdownContent);

  // 提取需求（从标题或列表中，传入 ast 用于未来扩展）
  const requirements = extractRequirements(ast, markdownContent);

  // 识别项目阶段
  const projectStage = identifyProjectStage(content);

  return {
    frontmatter,
    content: markdownContent,
    tasks,
    requirements,
    projectStage,
  };
}

/**
 * 提取任务列表（`- [ ]` 和 `- [x]`）
 */
function extractTasks(_ast: unknown, content: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  const lines = content.split("\n");

  // 简单的正则匹配任务列表
  const taskRegex = /^(\s*)[-*]\s+\[([ xX])\]\s+(.+)$/;

  lines.forEach((line, index) => {
    const match = line.match(taskRegex);
    if (match) {
      const isCompleted = match[2].toLowerCase() === "x";
      const taskText = match[3].trim();

      // 尝试提取优先级（从文本中）
      const priority = extractPriority(taskText);

      tasks.push({
        text: taskText,
        status: isCompleted ? "completed" : "pending",
        lineNumber: index + 1,
        priority,
      });
    }
  });

  return tasks;
}

/**
 * 从任务文本中提取优先级
 */
function extractPriority(text: string): "low" | "medium" | "high" | "urgent" {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("[urgent]") || lowerText.includes("urgent")) {
    return "urgent";
  }
  if (lowerText.includes("[high]") || lowerText.includes("high priority")) {
    return "high";
  }
  if (lowerText.includes("[low]") || lowerText.includes("low priority")) {
    return "low";
  }

  return "medium"; // 默认优先级
}

/**
 * 提取需求列表
 */
function extractRequirements(_ast: unknown, content: string): string[] {
  const requirements: string[] = [];

  // 查找 "需求" 或 "Requirements" 标题下的内容
  const requirementsRegex =
    /(?:##\s+(?:需求|Requirements|需求列表)[\s\S]*?)(?=##|$)/i;
  const match = content.match(requirementsRegex);

  if (match) {
    const requirementsSection = match[0];
    // 提取列表项
    const listItemRegex = /^[-*]\s+(.+)$/gm;
    let listMatch;
    while ((listMatch = listItemRegex.exec(requirementsSection)) !== null) {
      requirements.push(listMatch[1].trim());
    }
  }

  return requirements;
}

/**
 * 识别项目阶段
 */
function identifyProjectStage(
  content: string
): "demo" | "mvp" | "production" | "unknown" {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("production") ||
    lowerContent.includes("生产环境")
  ) {
    return "production";
  }
  if (lowerContent.includes("mvp") || lowerContent.includes("最小可行产品")) {
    return "mvp";
  }
  if (lowerContent.includes("demo") || lowerContent.includes("演示")) {
    return "demo";
  }

  return "unknown";
}

/**
 * 计算进度（基于任务完成情况）
 */
export function calculateProgress(tasks: ExtractedTask[]): number {
  if (tasks.length === 0) {
    return 0;
  }

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  return Math.round((completedCount / tasks.length) * 100);
}

/**
 * 简单的 YAML 解析（用于 frontmatter）
 * 注意：这是一个简化版本，复杂 YAML 应该使用 js-yaml
 */
function parseSimpleYaml(yamlContent: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yamlContent.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    // 处理引号
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      result[key] = value.slice(1, -1);
    } else if (value === "true") {
      result[key] = true;
    } else if (value === "false") {
      result[key] = false;
    } else if (!isNaN(Number(value))) {
      result[key] = Number(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
