/**
 * Agent 自动分类模块
 * 使用 LLM 自动分类和打标 Prompt
 */

import OpenAI from "openai";
import { logger } from "../logger.js";
import type { AgentConfig } from "./analyzer.js";
import type { PromptRepoInfo } from "../scanner/prompt-scanner.js";
import { readPromptFiles } from "../scanner/prompt-scanner.js";

export interface ClassificationResult {
  domain: string;
  scenario: string;
  tags: string[];
  summary: string;
  frontmatter: Record<string, unknown>;
  suggestedPath?: string; // 建议的文件路径
}

/**
 * 使用 LLM 自动分类 Prompt
 */
export async function classifyPrompt(
  repoInfo: PromptRepoInfo,
  config: AgentConfig
): Promise<ClassificationResult> {
  logger.info(`Classifying prompt: ${repoInfo.name}`);

  const files = readPromptFiles(repoInfo);
  const prompt = buildClassificationPrompt(repoInfo, files);
  const response = await callLLMForClassification(prompt, config);

  return parseClassificationResponse(response, repoInfo);
}

/**
 * 构建分类 Prompt
 */
function buildClassificationPrompt(
  repoInfo: PromptRepoInfo,
  files: {
    mainPrompt: string | null;
    contextMd: string | null;
    config: Record<string, unknown> | null;
  }
): string {
  return `你是一个 Prompt 分类专家。请分析以下 Prompt 内容，并生成分类建议。

Prompt 名称: ${repoInfo.name}
当前路径: ${repoInfo.domain}/${repoInfo.scenario}/${repoInfo.asset}

Prompt 内容:
${files.mainPrompt || "无"}

上下文信息:
${files.contextMd || "无"}

请根据以下规则进行分类：

1. **Domain (一级分类)**: 选择最合适的领域
   - Coding: 编程相关（前端、后端、全栈、DevOps等）
   - Finance: 金融相关（交易、分析、量化等）
   - Design: 设计相关（UI、UX、视觉等）
   - Writing: 写作相关（内容创作、文案等）
   - Analysis: 分析相关（数据分析、商业分析等）
   - Other: 其他领域

2. **Scenario (二级分类)**: 选择具体的应用场景
   - 例如：Frontend, Backend, TradingView-SMC, UI-Generation 等
   - 应该具体且有意义

3. **Tags (标签)**: 提取 3-5 个关键词标签
   - 例如：["Nuxt4", "TypeScript", "Tailwind", "SSR"]
   - 应该准确反映 Prompt 的核心技术或领域

4. **Summary (摘要)**: 生成一段简洁的摘要（50-100字）
   - 描述这个 Prompt 的主要用途和特点

5. **Frontmatter**: 生成 YAML frontmatter 格式的元数据
   - 包含：version, author, created_at, updated_at 等

请返回 JSON 格式：

{
  "domain": "Coding",
  "scenario": "Frontend",
  "tags": ["Nuxt4", "TypeScript"],
  "summary": "用于处理 Nuxt 4 Nitro 渲染管线的专家级指令",
  "frontmatter": {
    "version": "1.0.0",
    "author": "system",
    "created_at": "${new Date().toISOString()}",
    "updated_at": "${new Date().toISOString()}"
  },
  "suggestedPath": "Coding.Frontend.Nuxt4-Expert"
}`;
}

/**
 * 调用 LLM 进行分类
 */
async function callLLMForClassification(
  prompt: string,
  config: AgentConfig
): Promise<string> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.apiUrl || getDefaultApiUrl(config.provider),
  });

  const modelName = config.model || getDefaultModel(config.provider);

  try {
    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的 Prompt 分类助手。请严格按照 JSON 格式返回分类结果，不要添加任何解释性文字。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from LLM");
    }

    return content;
  } catch (error) {
    logger.error(`LLM classification failed (${config.provider}):`, error);
    throw error;
  }
}

/**
 * 解析分类响应
 */
function parseClassificationResponse(
  response: string,
  repoInfo: PromptRepoInfo
): ClassificationResult {
  try {
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonStr) as Partial<ClassificationResult>;

    return {
      domain: parsed.domain || repoInfo.domain,
      scenario: parsed.scenario || repoInfo.scenario,
      tags: parsed.tags || [],
      summary: parsed.summary || "",
      frontmatter: parsed.frontmatter || {},
      suggestedPath: parsed.suggestedPath,
    };
  } catch (error) {
    logger.error("Failed to parse classification response:", error);
    throw new Error("Invalid JSON response from LLM");
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
      return "moonshot-v1-8k";
    case "qwen":
      return "qwen-turbo";
    case "openai":
      return "gpt-3.5-turbo";
    default:
      return "gpt-3.5-turbo";
  }
}

/**
 * 生成场景综述（二级菜单汇总）
 */
export async function generateScenarioSummary(
  repos: PromptRepoInfo[],
  scenario: string,
  config: AgentConfig
): Promise<string> {
  const scenarioRepos = repos.filter((r) => r.scenario === scenario);

  if (scenarioRepos.length === 0) {
    return `该场景下暂无 Prompt 资产`;
  }

  const prompt = `请为以下 Prompt 场景生成一段综述（50-100字）：

场景名称: ${scenario}
包含的 Prompt 数量: ${scenarioRepos.length}

Prompt 列表:
${scenarioRepos
  .map(
    (r, idx) =>
      `${idx + 1}. ${r.name}${r.config?.summary ? ` - ${r.config.summary}` : ""}`
  )
  .join("\n")}

请生成一段简洁的场景综述，描述这个场景下的 Prompt 资产特点和用途。`;

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.apiUrl || getDefaultApiUrl(config.provider),
  });

  try {
    const completion = await client.chat.completions.create({
      model: config.model || getDefaultModel(config.provider),
      messages: [
        {
          role: "system",
          content: "你是一个技术文档撰写专家。请生成简洁、准确的场景综述。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || "无法生成综述";
  } catch (error) {
    logger.error("Failed to generate scenario summary:", error);
    return `该场景下包含 ${scenarioRepos.length} 个 Prompt 资产`;
  }
}
