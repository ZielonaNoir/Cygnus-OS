---
description: SIPE 数据模型与数据库结构
---

# 数据模型规范

## SIPE JSON 标准

定义在 `types/sipe.ts`，结构包含：
- `project_name`: 项目名称
- `last_sync`: 最后同步时间
- `progress`: 进度百分比
- `tasks[]`: 任务列表
- `requirements[]`: 需求列表
- `health_score`: 健康评分

## 数据库表结构

### projects 表
项目进度表：id, name, description, path, progress, status, health_score, last_sync

### tasks 表
MD 任务快照：id, project_id, task_text, status, priority, line_number, file_path

### project_sync_v1 表
CLI 同步状态：id, project_id, sipe_json (JSONB), sync_timestamp

### prompt_repos 表
Prompt 仓库：id, name, description, path (LTree), domain, scenario, visibility

### prompts 表
Prompt 资产：id, repo_id, title, content, main_prompt_path, context_md_path, config_yaml_path, summary, tags[], version

### prompt_metadata 表
Agent 生成的元数据：id, prompt_id, frontmatter (JSONB), ai_summary, classification_suggestions

## CLI 工具命令

- `cygnus sync`: 同步所有项目进度到 Supabase
- `cygnus classify`: Agent 自动分类 Prompt
- CLI 工具位于 `packages/cygnus-cli/` 独立包

## Agent 分析流程

1. 读取 Markdown 内容
2. 调用 LLM 进行语义分析
3. 生成 SIPE JSON 或分类建议
4. 本地缓存结果
5. 同步到 Supabase

## 注意事项

- LTree 路径：使用 PostgreSQL LTree 扩展管理多级分类路径
- Agent 驱动：LLM 调用需要错误处理和重试机制
- 数据隐私：Private Prompt 必须通过 RLS 策略严格控制访问权限
- 文件系统即真相：数据库仅作为索引和元数据存储
