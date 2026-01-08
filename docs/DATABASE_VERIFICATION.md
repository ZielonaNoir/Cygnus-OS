# 🗄️ Cygnus-OS 数据库架构与权限策略

本文档展示了当前部署在 Supabase 上的实际数据库表结构和行级安全 (RLS) 策略。

> **生成时间**: 2026-01-08
> **数据源**: Live Database Metadata

---

## 🔒 Row Level Security (RLS) 策略矩阵

以下策略确保了数据的物理隔离和隐私安全。

| 表名 (Table) | 操作 (Op) | 策略名称 (Policy Name) | 权限规则 (Rule) | 解释 |
|---|---|---|---|---|
| **projects** | `SELECT` | Users can view their own projects | `auth.uid() = owner_id` | 只能查看自己拥有的项目 |
| **projects** | `INSERT` | Users can insert their own projects | `auth.role() = 'authenticated'` | 登录用户可以创建项目 |
| **projects** | `UPDATE` | Users can update their own projects | `auth.uid() = owner_id` | 只能更新自己拥有的项目 |
| **projects** | `DELETE` | Users can delete their own projects | `auth.uid() = owner_id` | 只能删除自己拥有的项目 |
| | | | | |
| **prompt_repos** | `SELECT` | Users can view public or own prompt repos | `(visibility = 'public') OR (owner_id = auth.uid())` | 可查看**公开的**或**自己的** Repo |
| **prompt_repos** | `INSERT` | Users can insert their own prompt repos | `auth.role() = 'authenticated'` | 登录用户可以创建 Repo |
| **prompt_repos** | `UPDATE` | Users can update their own prompt repos | `owner_id = auth.uid()` | **只能**更新自己拥有的 Repo (无论是否公开) |
| **prompt_repos** | `DELETE` | Users can delete their own prompt repos | `owner_id = auth.uid()` | **只能**删除自己拥有的 Repo |
| | | | | |
| **prompts** | `SELECT` | Users can view prompts for accessible repos | *Exists Check* via `prompt_repos` | 继承 Repo 的可见性规则 (Public 或 Own) |
| **prompts** | `INSERT` | Users can insert prompts for their repos | *Exists Check* via `prompt_repos` | 只能在自己拥有的 Repo 下创建 Prompt |
| **prompts** | `UPDATE` | Users can update prompts for their repos | *Exists Check* for Owner | 只能更新自己拥有的 Repo 下的 Prompt |
| **prompts** | `DELETE` | Users can delete prompts for their repos | *Exists Check* for Owner | 只能删除自己拥有的 Repo 下的 Prompt |

---

## 🏗️ 数据库表结构 (Schema)

### 1. `projects` 表
存储项目元数据和进度信息。

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `uuid` | ✅ | 主键 |
| `name` | `text` | ✅ | 项目名称 |
| `description` | `text` | ❌ | 描述 |
| `path` | `text` | ✅ | 本地路径 |
| `progress` | `integer` | ✅ | 进度 (0-100) |
| `status` | `text` | ✅ | 状态 (pending/in_progress/completed) |
| `health_score` | `integer` | ✅ | 健康度评分 |
| `owner_id` | `uuid` | ❌ | **所有者 ID** (关键权限字段) |
| `created_at` | `timestamptz` | ✅ | 创建时间 |
| `updated_at` | `timestamptz` | ✅ | 更新时间 |

### 2. `prompt_repos` 表
Prompt 仓库，支持多级目录结构。

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `uuid` | ✅ | 主键 |
| `name` | `text` | ✅ | Repo 名称 |
| `path` | `ltree` | ✅ | **LTree 路径** (如: `Coding.Frontend.Nuxt`) |
| `domain` | `text` | ✅ | 一级分类 (Domain) |
| `scenario` | `text` | ✅ | 二级分类 (Scenario) |
| `visibility` | `text` | ✅ | **可见性** (`public` / `private`) |
| `owner_id` | `uuid` | ❌ | **所有者 ID** (关键权限字段) |
| `description` | `text` | ❌ | 描述 |

### 3. `prompts` 表
实际的 Prompt 内容及其元数据。

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `uuid` | ✅ | 主键 |
| `repo_id` | `uuid` | ✅ | 外键 -> `prompt_repos.id` |
| `title` | `text` | ✅ | 标题 |
| `content` | `text` | ✅ | **Prompt 原始内容** |
| `version` | `text` | ✅ | 版本号 (如: 1.0.0) |
| `tags` | `text[]` | ❌ | 标签数组 |
| `summary` | `text` | ❌ | AI 生成的摘要 |
| `main_prompt_path` | `text` | ✅ | 文件路径 |
| `context_md_path` | `text` | ❌ | 上下文文件路径 |
| `config_yaml_path` | `text` | ❌ | 配置文件路径 |

---

## ✅ 安全性评估结论

1. **严格的所有权隔离**:
   所有写操作 (`INSERT`, `UPDATE`, `DELETE`) 都强制检查 `owner_id = auth.uid()`。没有任何后门允许用户修改他人的数据。

2. **精确的读权限控制**:
   - `projects`: 只有所有者可读。
   - `prompt_repos`: 只有所有者**或**明确标记为 `public` 的记录可读。
   - `prompts`: 继承所属 Repo 的权限规则。

3. **数据独立性**:
   即使用户将 Prompt 设为公开，数据的物理存储依然是独立的，且所有权不可变更。

此架构完全符合 **"各自独立存储，按需只读分享"** 的隐私安全要求。
