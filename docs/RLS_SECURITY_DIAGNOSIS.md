# RLS 安全诊断报告

## 问题概述

**发现时间**: 2026-01-08  
**严重程度**: 🔴 **严重** - 存在数据泄露风险

## 发现的问题

### 1. 🔴 关键问题：使用 Admin Client 绕过 RLS

**位置**:
- `app/dashboard/page.tsx` (第 27 行)
- `app/dashboard/projects/[id]/page.tsx` (第 10 行)
- `app/actions/project.ts` (第 15 行)
- `app/lib/mcp/skills.ts` (第 32 行)

**问题描述**:
这些页面使用了 `createAdminClient()`，这会绕过所有 RLS (Row Level Security) 策略，导致任何认证用户都可以访问所有项目和数据。

**影响**:
- `noirrrc@outlook.com` 可以看到 `a406113864@hotmail.com` 的所有项目
- 任何认证用户都可以查看所有项目的任务
- 任何认证用户都可以查看所有 prompt repos 和 prompts

### 2. 🟡 RLS 策略漏洞

#### 2.1 `tasks` 表的 SELECT 策略过于宽松

**当前策略**:
```sql
(EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = tasks.project_id) AND (auth.role() = 'authenticated'::text))))
```

**问题**: 只检查用户是否已认证，**不检查项目所有权**！

**影响**: 任何认证用户都可以查看所有项目的任务，只要他们知道 `project_id`。

#### 2.2 `project_sync_v1` 表的 SELECT 策略过于宽松

**当前策略**:
```sql
(EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_sync_v1.project_id) AND (auth.role() = 'authenticated'::text))))
```

**问题**: 同样只检查认证状态，不检查项目所有权。

#### 2.3 `prompt_metadata` 表的策略可能有问题

**当前策略** (SELECT):
```sql
(EXISTS ( SELECT 1
   FROM (prompts
     JOIN prompt_repos ON ((prompt_repos.id = prompts.repo_id)))
  WHERE ((prompts.id = prompt_metadata.prompt_id) AND ((prompt_repos.visibility = 'public'::text) OR (prompt_repos.owner_id = auth.uid()) OR (auth.role() = 'authenticated'::text)))))
```

**问题**: 条件 `OR (auth.role() = 'authenticated'::text)` 使得所有认证用户都可以访问，即使 prompt_repo 是 private 且不属于他们。

### 3. 🟡 数据完整性问题

#### 3.1 项目缺少所有者

**发现**:
- 5 个项目中，4 个的 `owner_id` 为 `null`
- 只有 1 个项目有明确的 `owner_id` (`a406113864@hotmail.com`)

**影响**: 当 `owner_id` 为 `null` 时，RLS 策略 `auth.uid() = owner_id` 永远不会匹配，这些项目可能无法被正确访问。

#### 3.2 Prompt Repos 缺少所有者

**发现**:
- 所有 5 个 `prompt_repos` 的 `owner_id` 都是 `null`
- 所有 repos 的 `visibility` 都是 `'private'`

**影响**: 这些 private repos 理论上不应该被任何人访问（因为 `owner_id = auth.uid()` 永远不会为真），但如果通过 admin client 访问，仍然可以查看。

## 修复状态

### ✅ 已修复（2026-01-08）

1. **✅ 替换 Admin Client 为普通 Client**
   - ✅ 修改 `app/dashboard/page.tsx` 使用 `createClient()` 并添加用户认证检查
   - ✅ 修改 `app/dashboard/projects/[id]/page.tsx` 使用 `createClient()` 并验证所有权
   - ✅ 修改 `app/actions/project.ts` 使用 `createClient()` 并添加所有权验证
   - ✅ 修改 `app/lib/mcp/skills.ts` 使用匿名 client（无 token 时）或 `createClientFromToken()`（有 token 时）

2. **✅ 修复 RLS 策略**
   - ✅ 修复 `tasks` 表的所有策略（SELECT, INSERT, UPDATE, DELETE），添加项目所有权检查
   - ✅ 修复 `project_sync_v1` 表的 SELECT 和 INSERT 策略，添加项目所有权检查
   - ✅ 修复 `prompt_metadata` 表的所有策略，移除过于宽松的认证检查，只允许访问 public repos 或自己的 repos

### ✅ 额外修复（2026-01-08）

3. **✅ 修复 `/api/prompts/list` API 绕过 RLS 的问题**
   - **问题**: API 直接从文件系统读取所有 Prompt，完全绕过了 Supabase RLS 策略
   - **影响**: 任何认证用户都可以看到所有 Prompt，无论所有权和 visibility 设置
   - **修复**: 
     - 添加用户认证检查
     - 从 Supabase 查询用户有权限访问的 repos（RLS 自动过滤）
     - 只返回文件系统中存在且用户有权限访问的 Prompt

### ⚠️ 仍需修复

1. **🟡 prompt_versions 表的 RLS 策略**
   - 当前策略 `Enable insert for authenticated users` 的 `WITH CHECK` 子句是 `true`，允许所有认证用户插入
   - 建议：添加 prompt 所有权检查

2. **🔴 数据完整性问题（关键）**
   - **所有 5 个 prompt_repos 的 `owner_id` 都是 `null`**
   - **所有 repos 的 `visibility` 都是 `'private'`**
   - **影响**: 
     - 根据 RLS 策略 `((visibility = 'public'::text) OR (owner_id = auth.uid()))`，当 `owner_id = null` 且 `visibility = 'private'` 时，这些 repos 不应该被任何人访问
     - 修复后，`noirrrc@outlook.com` 将看不到任何 Prompt（因为所有 repos 都是 private 且 owner_id 为 null）
   - **建议**: 
     - **立即为现有 prompt_repos 分配正确的 `owner_id`**
     - 添加数据库约束，确保新创建的 repos 必须有 `owner_id`
     - 考虑为 `owner_id` 为 `null` 的 private repos 设置默认行为（例如，禁止访问或分配给系统管理员）

### 优先级 2: 数据修复

1. **为现有数据分配所有者**
   - 为所有 `owner_id` 为 `null` 的项目分配正确的所有者
   - 为所有 `owner_id` 为 `null` 的 prompt_repos 分配正确的所有者

2. **添加数据库约束**
   - 为 `projects.owner_id` 添加 NOT NULL 约束（或设置默认值）
   - 为 `prompt_repos.owner_id` 添加 NOT NULL 约束（对于 private repos）

## 测试验证

修复后，需要验证：
1. ✅ `noirrrc@outlook.com` 无法看到 `a406113864@hotmail.com` 的项目
2. ✅ 用户只能看到自己的项目和任务
3. ✅ Private prompts 只能被所有者访问
4. ✅ Public prompts 可以被所有认证用户访问

## 相关文件

- `app/lib/supabase/server.ts` - Supabase 客户端创建
- `app/dashboard/page.tsx` - 项目列表页面
- `app/dashboard/projects/[id]/page.tsx` - 项目详情页面
- `app/actions/project.ts` - 项目操作
- `app/lib/mcp/skills.ts` - MCP 技能查询
