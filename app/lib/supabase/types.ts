/**
 * Supabase 数据库类型定义
 * 
 * 使用 Supabase CLI 生成类型：
 * npx supabase gen types typescript --project-id <project-id> > app/lib/supabase/types.ts
 * 
 * 或者使用 MCP 工具生成
 */

import { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// 导出常用类型
export type Project = Tables<'projects'>;
export type Task = Tables<'tasks'>;
export type ProjectSync = Tables<'project_sync_v1'>;
export type PromptRepo = Tables<'prompt_repos'>;
export type Prompt = Tables<'prompts'>;
export type PromptMetadata = Tables<'prompt_metadata'>;

