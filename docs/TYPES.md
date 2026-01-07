# Cygnus-OS 类型定义文档

本文档描述了 Cygnus-OS 项目中使用的核心类型定义。

## 目录

- [SIPE JSON 标准](#sipe-json-标准)
- [数据库类型](#数据库类型)
- [通用类型](#通用类型)

---

## SIPE JSON 标准

SIPE (Super Individual Project Engineering) JSON 是用于统一项目进度数据的标准格式。

### SIPEJSON

```typescript
interface SIPEJSON {
  project_name: string;        // 项目名称
  last_sync: string;           // 最后同步时间 (ISO 8601)
  progress: number;            // 进度百分比 (0-100)
  tasks: SIPETask[];           // 任务列表
  requirements: string[];      // 需求列表
  health_score: number;        // 健康度评分 (0-100)
}
```

### SIPETask

```typescript
interface SIPETask {
  id: number;                  // 任务 ID
  text: string;                // 任务文本
  status: 'completed' | 'pending';  // 任务状态
  priority: 'low' | 'medium' | 'high' | 'urgent';  // 优先级
}
```

### 验证函数

- `validateSIPEJSON(data: unknown): data is SIPEJSON` - 类型守卫验证
- `parseSIPEJSON(data: unknown): SIPEJSON` - 验证并解析，失败时抛出错误
- `validateSIPEJSONWithErrors(data: unknown): { valid: boolean; errors: string[] }` - 返回详细错误信息

### 示例

```json
{
  "project_name": "Tacit-Nuxt",
  "last_sync": "2026-01-07T12:00:00Z",
  "progress": 65,
  "tasks": [
    {
      "id": 1,
      "text": "Stripe 账户关联",
      "status": "completed",
      "priority": "high"
    },
    {
      "id": 2,
      "text": "自动化账单清洗",
      "status": "pending",
      "priority": "medium"
    }
  ],
  "requirements": [
    "支持跨境收单",
    "多维度资产快照"
  ],
  "health_score": 85
}
```

---

## 数据库类型

### Projects 表

```typescript
interface Project {
  id: string;                  // UUID
  name: string;                // 项目名称
  description: string | null;  // 项目描述
  path: string;                // 项目路径（唯一）
  progress: number;            // 进度 (0-100)
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  health_score: number;        // 健康度 (0-100)
  last_sync: string | null;   // 最后同步时间
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
}
```

### Tasks 表

```typescript
interface Task {
  id: string;                  // UUID
  project_id: string;         // 关联的项目 ID
  task_text: string;           // 任务文本
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  line_number: number | null;  // 在文件中的行号
  file_path: string;          // 文件路径
  created_at: string;
  updated_at: string;
}
```

### Project Sync 表

```typescript
interface ProjectSync {
  id: string;                  // UUID
  project_id: string;         // 关联的项目 ID
  sipe_json: Json;            // SIPE JSON 数据 (JSONB)
  sync_timestamp: string;     // 同步时间戳
  created_at: string;
}
```

### Prompt Repos 表

```typescript
interface PromptRepo {
  id: string;                  // UUID
  name: string;                // Repo 名称
  description: string | null;
  path: string;                // LTree 格式路径
  domain: string;              // 一级分类（Domain）
  scenario: string;            // 二级分类（Scenario）
  visibility: 'public' | 'private';
  owner_id: string | null;     // 所有者 ID
  created_at: string;
  updated_at: string;
}
```

**LTree 路径示例：**
- `Coding.Frontend.Nuxt4-Expert`
- `Finance.TradingView-SMC`

### Prompts 表

```typescript
interface Prompt {
  id: string;                  // UUID
  repo_id: string;            // 关联的 Repo ID
  title: string;               // Prompt 标题
  content: string;            // Prompt 内容
  main_prompt_path: string;   // 主 Prompt 文件路径
  context_md_path: string | null;  // Context 文件路径
  config_yaml_path: string | null; // Config 文件路径
  summary: string | null;     // Agent 生成的摘要
  tags: string[];             // 标签数组
  version: string;            // 版本号
  created_at: string;
  updated_at: string;
}
```

### Prompt Metadata 表

```typescript
interface PromptMetadata {
  id: string;                  // UUID
  prompt_id: string;          // 关联的 Prompt ID
  frontmatter: Json;          // Frontmatter 数据 (JSONB)
  ai_summary: string | null;  // AI 生成的摘要
  classification_suggestions: string[];  // 分类建议
  created_at: string;
}
```

---

## 通用类型

### Status

```typescript
type Status = 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
```

### Priority

```typescript
type Priority = 'low' | 'medium' | 'high' | 'urgent';
```

### Visibility

```typescript
type Visibility = 'public' | 'private';
```

### API Response

```typescript
interface APIResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
```

---

## 类型使用指南

### 在组件中使用

```typescript
import type { Project, Task } from '@lib/supabase/types';
import type { SIPEJSON } from '@types/sipe';

// 使用类型
const project: Project = {
  id: '...',
  name: 'My Project',
  // ...
};
```

### 验证 SIPE JSON

```typescript
import { parseSIPEJSON, validateSIPEJSON } from '@lib/validators/sipe-validator';

// 类型守卫
if (validateSIPEJSON(data)) {
  // data 现在是 SIPEJSON 类型
  console.log(data.project_name);
}

// 或直接解析（失败会抛出错误）
try {
  const sipe = parseSIPEJSON(data);
  console.log(sipe.project_name);
} catch (error) {
  console.error('Invalid SIPE JSON:', error);
}
```

### Supabase 查询类型

```typescript
import { supabase } from '@lib/supabase/client';
import type { Tables } from '@lib/supabase/types';

// 查询项目
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'in_progress');

// data 的类型是 Tables<'projects'>[]
```

---

## 类型生成

数据库类型定义通过 Supabase MCP 工具自动生成：

```bash
# 使用 MCP 工具生成类型
# 类型已自动生成在 app/lib/supabase/database.types.ts
```

---

## 更新日志

- **2026-01-07**: 初始版本，包含所有核心类型定义

