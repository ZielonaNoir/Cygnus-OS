/**
 * AI Agent 分析层
 * 使用 LLM 将非结构化的 Markdown 转换为结构化的 SIPE JSON
 */

import OpenAI from "openai";
import { logger } from "../logger.js";
import type { SIPEJSON } from "./types.js";
import type { ParsedMarkdown } from "../parser/markdown-parser.js";

export interface AgentConfig {
  provider: "openai" | "qwen" | "kimi";
  apiKey: string;
  apiUrl?: string;
  model?: string;
}

/**
 * 使用 LLM 分析 Markdown 并生成 SIPE JSON
 */
export async function analyzeWithLLM(
  parsedMarkdown: ParsedMarkdown,
  projectName: string,
  config: AgentConfig
): Promise<SIPEJSON> {
  logger.info(`Analyzing project: ${projectName} with ${config.provider}`);

  const prompt = buildAnalysisPrompt(parsedMarkdown, projectName);
  const response = await callLLM(prompt, config);

  // 解析 LLM 响应
  const sipeJson = parseLLMResponse(response, projectName);

  // 验证结果
  if (!isValidSIPEJSON(sipeJson)) {
    logger.warn("LLM response validation failed, using fallback calculation");
    return generateFallbackSIPEJSON(parsedMarkdown, projectName);
  }

  return sipeJson;
}

/**
 * 构建分析 Prompt
 */
function buildAnalysisPrompt(
  parsedMarkdown: ParsedMarkdown,
  projectName: string
): string {
  const tasksList = parsedMarkdown.tasks
    .map(
      (task, idx) =>
        `${idx + 1}. [${task.status === "completed" ? "x" : " "}] ${task.text}`
    )
    .join("\n");

  return `你是一个项目进度分析专家。请分析以下项目信息，并生成结构化的 SIPE JSON 格式数据。

项目名称: ${projectName}
项目阶段: ${parsedMarkdown.projectStage}

任务列表:
${tasksList}

需求列表:
${parsedMarkdown.requirements.map((req, idx) => `${idx + 1}. ${req}`).join("\n")}

请根据以下规则生成 SIPE JSON：

1. **进度计算 (progress)**: 基于已完成任务数量，但也要考虑任务的重要性和复杂度
   - 如果关键任务未完成，即使完成了很多次要任务，进度也应该较低
   - 考虑任务优先级：urgent > high > medium > low
   - 计算公式建议：基础进度 = (已完成任务数 / 总任务数) * 100
   - 然后根据优先级调整：urgent 任务权重 4x, high 2x, medium 1x, low 0.5x

2. **健康度评分 (health_score)**: 综合评估项目健康状态 (0-100)
   - 进度完成度: 40%
   - 任务优先级分布: 20% (urgent 任务应该尽快完成)
   - 需求覆盖度: 20% (已完成任务是否覆盖了主要需求)
   - 项目阶段匹配度: 20% (当前进度是否匹配项目阶段)

3. **任务优先级识别**: 如果任务文本中没有明确优先级，请根据任务内容智能判断
   - urgent: 阻塞性任务、关键路径任务、紧急修复
   - high: 核心功能、重要特性
   - medium: 常规功能、优化任务
   - low: 锦上添花、文档、重构

请返回纯 JSON 格式，不要包含任何 Markdown 代码块标记：

{
  "project_name": "${projectName}",
  "last_sync": "${new Date().toISOString()}",
  "progress": <计算出的进度 0-100>,
  "tasks": [
    {
      "id": 1,
      "text": "任务文本",
      "status": "completed" | "pending",
      "priority": "low" | "medium" | "high" | "urgent"
    }
  ],
  "requirements": [需求列表],
  "health_score": <计算出的健康度 0-100>
}`;
}

/**
 * 调用 LLM API
 */
async function callLLM(prompt: string, config: AgentConfig): Promise<string> {
  const { provider, apiKey, apiUrl, model } = config;

  // 统一使用 OpenAI 兼容的 API
  const client = new OpenAI({
    apiKey,
    baseURL: apiUrl || getDefaultApiUrl(provider),
  });

  const modelName = model || getDefaultModel(provider);

  try {
    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的项目进度分析助手。请严格按照 JSON 格式返回分析结果，不要添加任何解释性文字。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // 降低随机性，提高一致性
      response_format: { type: "json_object" }, // 强制 JSON 格式
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from LLM");
    }

    return content;
  } catch (error) {
    logger.error(`LLM API call failed (${provider}):`, error);
    throw error;
  }
}

/**
 * 获取默认 API URL
 */
function getDefaultApiUrl(provider: string): string {
  switch (provider) {
    case "kimi":
      return "https://api.moonshot.cn/v1";
    case "qwen":
      return process.env.QWEN_API_URL || "http://localhost:8000/v1";
    case "openai":
      return "https://api.openai.com/v1";
    default:
      return "https://api.openai.com/v1";
  }
}

/**
 * 获取默认模型
 */
function getDefaultModel(provider: string): string {
  switch (provider) {
    case "kimi":
      return "moonshot-v1-8k"; // 或 moonshot-v1-32k, moonshot-v1-128k
    case "qwen":
      return "qwen-turbo";
    case "openai":
      return "gpt-3.5-turbo";
    default:
      return "gpt-3.5-turbo";
  }
}

/**
 * 解析 LLM 响应
 */
function parseLLMResponse(response: string, projectName: string): SIPEJSON {
  try {
    // 移除可能的 Markdown 代码块标记
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    // 确保所有必需字段存在
    return {
      project_name:
        (typeof parsed.project_name === "string"
          ? parsed.project_name
          : projectName),
      last_sync:
        typeof parsed.last_sync === "string"
          ? parsed.last_sync
          : new Date().toISOString(),
      progress:
        typeof parsed.progress === "number" ? parsed.progress : 0,
      tasks: Array.isArray(parsed.tasks) ? (parsed.tasks as SIPEJSON["tasks"]) : [],
      requirements: Array.isArray(parsed.requirements)
        ? (parsed.requirements as string[])
        : [],
      health_score:
        typeof parsed.health_score === "number" ? parsed.health_score : 0,
    };
  } catch (error) {
    logger.error("Failed to parse LLM response:", error);
    throw new Error("Invalid JSON response from LLM");
  }
}

/**
 * 验证 SIPE JSON
 */
function isValidSIPEJSON(data: unknown): data is SIPEJSON {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.project_name === "string" &&
    typeof obj.last_sync === "string" &&
    typeof obj.progress === "number" &&
    obj.progress >= 0 &&
    obj.progress <= 100 &&
    Array.isArray(obj.tasks) &&
    Array.isArray(obj.requirements) &&
    typeof obj.health_score === "number" &&
    obj.health_score >= 0 &&
    obj.health_score <= 100
  );
}

/**
 * 生成备用 SIPE JSON（当 LLM 失败时使用）
 */
function generateFallbackSIPEJSON(
  parsedMarkdown: ParsedMarkdown,
  projectName: string
): SIPEJSON {
  // 基础进度计算：已完成任务 / 总任务
  const totalTasks = parsedMarkdown.tasks.length;
  const completedTasks = parsedMarkdown.tasks.filter(
    (t) => t.status === "completed"
  ).length;
  const baseProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // 根据优先级加权计算进度
  const priorityWeights = { urgent: 4, high: 2, medium: 1, low: 0.5 };
  let weightedCompleted = 0;
  let weightedTotal = 0;

  parsedMarkdown.tasks.forEach((task) => {
    const weight = priorityWeights[task.priority || "medium"];
    weightedTotal += weight;
    if (task.status === "completed") {
      weightedCompleted += weight;
    }
  });

  const weightedProgress =
    weightedTotal > 0 ? (weightedCompleted / weightedTotal) * 100 : 0;
  const finalProgress = Math.round(baseProgress * 0.6 + weightedProgress * 0.4);

  // 健康度评分
  const progressScore = finalProgress * 0.4;
  const urgentTaskRatio =
    parsedMarkdown.tasks.filter((t) => t.priority === "urgent").length /
    Math.max(totalTasks, 1);
  const priorityScore = (1 - urgentTaskRatio) * 20; // urgent 任务越少越好
  const requirementCoverage = parsedMarkdown.requirements.length > 0 ? 20 : 0;
  const stageScore = 20; // 简化处理

  const healthScore = Math.round(
    progressScore + priorityScore + requirementCoverage + stageScore
  );

  return {
    project_name: projectName,
    last_sync: new Date().toISOString(),
    progress: finalProgress,
    tasks: parsedMarkdown.tasks.map((task, idx) => ({
      id: idx + 1,
      text: task.text,
      status: task.status,
      priority: task.priority || "medium",
    })),
    requirements: parsedMarkdown.requirements,
    health_score: Math.min(100, Math.max(0, healthScore)),
  };
}
