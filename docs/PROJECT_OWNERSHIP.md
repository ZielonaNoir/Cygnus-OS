# 项目所有权管理指南

## 问题说明

在 Cygnus-OS 中，项目通过 `owner_id` 字段与用户关联。由于 RLS (Row Level Security) 策略，用户只能看到自己拥有的项目。

## 创建项目的方式

### 1. 通过 MCP 创建项目

**特点**：
- ✅ 自动绑定到当前登录用户
- ✅ `owner_id` 自动设置为当前用户的 UUID
- ✅ 项目立即可见

**使用场景**：
- 在 Cursor AI 中通过 MCP 工具创建/更新项目
- 项目会自动绑定到当前登录的账号

**示例**：
```typescript
// 在 Cursor 中使用 MCP 工具
project_update({
  path: "my-project",
  projectName: "我的项目",
  progress: 50,
  status: "in_progress"
})
// 项目会自动绑定到当前登录用户
```

### 2. 通过 CLI 同步创建项目

**特点**：
- ⚠️ 需要手动指定 `owner_id`
- ⚠️ 如果不指定，`owner_id` 为 `null`，项目对任何用户都不可见

**使用方式**：

#### 方式 1：通过命令行参数指定

```bash
cygnus sync --owner-id <用户UUID>
```

#### 方式 2：通过配置文件指定

在 `.cygnusrc` 或 `cygnus.config.json` 中：

```json
{
  "supabase": {
    "url": "https://xxx.supabase.co",
    "serviceRoleKey": "xxx",
    "ownerId": "7e0fa8e1-f209-4233-9fcd-f554cfb11913"
  }
}
```

#### 方式 3：通过环境变量

```bash
export SUPABASE_OWNER_ID="7e0fa8e1-f209-4233-9fcd-f554cfb11913"
cygnus sync
```

## 如何获取用户 UUID

### 方法 1：通过 Supabase Dashboard

1. 登录 Supabase Dashboard
2. 进入 Authentication → Users
3. 找到目标用户，复制其 UUID

### 方法 2：通过数据库查询

```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

### 方法 3：通过 Web 应用

1. 登录 Cygnus-OS Web 应用
2. 打开浏览器开发者工具
3. 在 Console 中执行：
```javascript
// 获取当前用户 ID
const { data: { user } } = await supabase.auth.getUser();
console.log(user.id);
```

## 常见问题

### Q: 为什么我运行 `cygnus sync` 后看不到项目？

**A**: 如果未指定 `owner_id`，项目会被创建为 `owner_id = null`。根据 RLS 策略，这些项目对任何用户都不可见。

**解决方案**：
1. 使用 `--owner-id` 参数指定用户 UUID
2. 或在配置文件中设置 `supabase.ownerId`

### Q: 如何将现有项目分配给用户？

**A**: 需要手动更新数据库（使用 Supabase Dashboard 或 SQL）：

```sql
-- 将项目分配给指定用户
UPDATE projects 
SET owner_id = '7e0fa8e1-f209-4233-9fcd-f554cfb11913' 
WHERE owner_id IS NULL;
```

### Q: MCP 和 CLI 创建的项目有什么区别？

**A**:
- **MCP**: 自动绑定到当前登录用户，无需配置
- **CLI**: 需要手动指定 `owner_id`，适合批量同步或自动化场景

### Q: 多个用户能否共享同一个项目？

**A**: 当前设计不支持。每个项目只能有一个 `owner_id`。如果需要共享，可以考虑：
1. 将项目设置为特定用户的，然后通过其他方式共享数据
2. 未来可以实现项目共享功能（需要修改 RLS 策略）

## 最佳实践

1. **开发环境**：使用 MCP 创建项目，自动绑定到当前用户
2. **生产环境**：使用 CLI 同步时，始终指定 `owner_id`
3. **团队协作**：每个团队成员使用自己的账号，项目自动隔离
4. **批量迁移**：使用 SQL 脚本批量更新现有项目的 `owner_id`

## 相关文件

- `app/lib/mcp/projects.ts` - MCP 项目创建逻辑
- `packages/cygnus-cli/src/lib/sync/supabase-sync.ts` - CLI 同步逻辑
- `packages/cygnus-cli/src/lib/config.ts` - CLI 配置定义
- `docs/RLS_SECURITY_DIAGNOSIS.md` - RLS 安全诊断报告
