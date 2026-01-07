/**
 * Cygnus-OS 基础类型定义
 */

// 通用类型
export type Status = 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Visibility = 'public' | 'private';

// 项目相关类型
export interface Project {
  id: string;
  name: string;
  description: string | null;
  path: string;
  progress: number; // 0-100
  status: Status;
  health_score: number; // 0-100
  last_sync: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  task_text: string;
  status: 'pending' | 'completed';
  priority: Priority;
  line_number: number | null;
  file_path: string;
  created_at: string;
  updated_at: string;
}

// Prompt 相关类型
export interface PromptRepo {
  id: string;
  name: string;
  description: string | null;
  path: string; // LTree format
  domain: string;
  scenario: string;
  visibility: Visibility;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  repo_id: string;
  title: string;
  content: string;
  main_prompt_path: string;
  context_md_path: string | null;
  config_yaml_path: string | null;
  summary: string | null;
  tags: string[];
  version: string;
  created_at: string;
  updated_at: string;
}

export interface PromptMetadata {
  id: string;
  prompt_id: string;
  frontmatter: Record<string, unknown>;
  ai_summary: string | null;
  classification_suggestions: string[] | null;
  created_at: string;
}

// SIPE JSON 标准类型
export interface SIPEJSON {
  project_name: string;
  last_sync: string;
  progress: number;
  tasks: SIPETask[];
  requirements: string[];
  health_score: number;
}

export interface SIPETask {
  id: number;
  text: string;
  status: 'completed' | 'pending';
  priority: Priority;
}

// API 响应类型
export interface APIResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

