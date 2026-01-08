# 数据库迁移指南 (Database Migration Guide)

## 1. 概述

本指南介绍如何管理 Cygnus-OS 的数据库变更。我们使用 Supabase CLI 进行迁移管理，采用 **Schema-as-Code** 的原则。

## 2. 初始化基线 (Baseline)

如果您是第一次设置本地环境，或者想要同步线上数据库结构，请运行：

```bash
bun run db:pull
```

此命令会：

1.  连接到线上 Supabase 项目 (`jcauxnzgcqyjxrnhfnne`)
2.  下载当前完整的数据库结构 (Schema, Tables, Functions, RLS Policies)
3.  保存为 `supabase/migrations/20240108000000_init.sql`

> **注意**: 运行此命令需要先登录 Supabase CLI:
> `npx supabase login`

## 3. 创建新迁移

当您需要修改数据库结构（如新增表、修改字段）时，请遵循以下步骤：

1.  **复制模板**：
    复制 `supabase/migrations/00000000000000_template.sql` 为新的 SQL 文件。
    命名格式：`<YYYYMMDDHHMMSS>_<description>.sql`
    示例：`20240109120000_add_user_profiles.sql`

2.  **编写 SQL**：
    在文件中编写您的 DDL 语句 (CREATE, ALTER, DROP)。

3.  **应用迁移**：
    虽然我们目前主要依赖 Dashboard 操作，但建议将手动操作记录在迁移文件中，保持 Git 记录与数据库状态同步。
    未来可以使用 `npx supabase db push` 自动应用变更。

## 4. 常用命令

| 命令                   | 说明                             |
| ---------------------- | -------------------------------- |
| `bun run db:pull`      | 从线上下载最新结构到本地迁移文件 |
| `npx supabase login`   | 登录 CLI                         |
| `npx supabase db diff` | 比较本地与远程差异 (需要 Docker) |
