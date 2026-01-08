/**
 * MCP (Model Context Protocol) 类型定义
 * 用于将 PromptHub 作为技能包暴露给 AI 模型
 */

/** MCP 服务信息 */
export interface MCPServerInfo {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  endpoints: {
    skills: string;
    search: string;
  };
}

/** MCP 技能包 */
export interface MCPSkill {
  id: string;
  name: string;
  description: string;
  domain: string;
  scenario: string;
  tags: string[];
  version: string;
  visibility: 'public' | 'private';
  content: string;
  context?: string;
  createdAt: string;
  updatedAt: string;
}

/** MCP 技能包摘要（列表展示用） */
export interface MCPSkillSummary {
  id: string;
  name: string;
  description: string;
  domain: string;
  scenario: string;
  tags: string[];
  visibility: 'public' | 'private';
}

/** MCP 搜索请求 */
export interface MCPSearchRequest {
  query?: string;
  domain?: string;
  scenario?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/** MCP 列表响应 */
export interface MCPListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

/** MCP 单项响应 */
export interface MCPItemResponse<T> {
  data: T;
}

/** MCP 错误响应 */
export interface MCPErrorResponse {
  error: {
    code: string;
    message: string;
  };
}


/** MCP API 响应类型 */
export type MCPResponse<T> = MCPItemResponse<T> | MCPListResponse<T> | MCPErrorResponse;

// --- Tools Extensions ---

/** MCP 工具定义 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/** 项目更新参数 (对应 SIPE JSON) */
export interface MCPProjectUpdateParams {
  path: string; // 项目路径 (唯一标识)
  projectName: string;
  progress: number;
  healthScore: number;
  status: string;
  tasks?: string[]; // Markdown 任务列表
  requirements?: string[]; // 需求列表
}

/** MCP 工具执行请求 */
export interface MCPExecuteRequest {
  tool: string;
  arguments: Record<string, unknown>;
}
