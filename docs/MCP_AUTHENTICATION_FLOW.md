# MCP 认证流程说明

## 问题：MCP 如何知道当前登录的是谁？

MCP 通过 **JWT Token** 来识别当前登录用户。整个流程如下：

## 认证流程

### 1. 浏览器端获取 Token

在 `app/components/mcp/ConnectToCursor.tsx` 中：

```typescript
// 1. 创建浏览器端 Supabase 客户端
const supabase = createClient();

// 2. 获取当前会话（包含 JWT token）
const { data: { session } } = await supabase.auth.getSession();

// 3. 提取 access_token（JWT token）
const token = session?.access_token;

// 4. 将 token 嵌入到 MCP 配置 URL 中
const config = {
  name: "Cygnus-OS PromptHub",
  type: "sse",
  url: `${window.location.origin}/api/mcp?token=${token}`
};
```

**关键点**：
- `supabase.auth.getSession()` 从浏览器的 cookies/localStorage 中读取当前登录会话
- `session.access_token` 是 Supabase 签发的 JWT token，包含用户信息

### 2. Cursor 连接 MCP Server

当用户点击"一键安装"按钮时：

```typescript
// 构造 Deep Link
const link = `cursor://anysphere.cursor-deeplink/mcp/install?name=Cygnus-OS&config=${encodedConfig}`;

// 打开 Deep Link，Cursor 会读取配置并连接到 MCP Server
window.location.href = link;
```

**关键点**：
- Token 被编码在 MCP 配置中
- Cursor 会使用这个 URL 连接到你的 MCP Server

### 3. MCP API 提取 Token

在 `app/api/mcp/route.ts` 中：

```typescript
// 从请求中提取 token
const token = await getAuthToken(request);

// getAuthToken 支持多种方式：
// 1. Header: Authorization: Bearer <token>
// 2. Query Param: ?token=<token>
// 3. API Key: ?apikey=<key>
```

**关键点**：
- Token 可以从 URL query 参数或 HTTP Header 中提取
- 支持多种认证方式（JWT Token 或 API Key）

### 4. 从 Token 获取用户信息

在 `app/lib/mcp/projects.ts` 中：

```typescript
// 1. 使用 token 创建 Supabase 客户端
const supabase = createClientFromToken(token);

// 2. 从 token 中解析用户信息
const { data: { user } } = await supabase.auth.getUser();

// 3. 使用 user.id 作为 owner_id
owner_id: user.id
```

**关键点**：
- `createClientFromToken(token)` 创建一个带有 Authorization header 的 Supabase 客户端
- `supabase.auth.getUser()` 会验证 token 并从 token 中提取用户信息
- JWT token 本身包含用户 ID（`sub` claim），Supabase 会自动解析

## JWT Token 结构

Supabase 的 JWT token 包含以下信息：

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "7e0fa8e1-f209-4233-9fcd-f554cfb11913",  // 用户 UUID
  "email": "a406113864@hotmail.com",
  "role": "authenticated",
  ...
}
```

**关键字段**：
- `sub`: 用户 UUID（这就是 `user.id`）
- `email`: 用户邮箱
- `exp`: Token 过期时间（默认 1 小时）

## 完整流程图

```
┌─────────────────┐
│   浏览器登录     │
│  (Web 应用)      │
└────────┬────────┘
         │
         │ 1. supabase.auth.getSession()
         │    获取 JWT token
         ▼
┌─────────────────┐
│  ConnectToCursor │
│  组件获取 token  │
└────────┬────────┘
         │
         │ 2. 将 token 嵌入 MCP URL
         │    /api/mcp?token=<jwt>
         ▼
┌─────────────────┐
│  Cursor AI      │
│  连接 MCP Server │
└────────┬────────┘
         │
         │ 3. 发送请求到 /api/mcp?token=<jwt>
         ▼
┌─────────────────┐
│  MCP API        │
│  getAuthToken() │
└────────┬────────┘
         │
         │ 4. 提取 token
         ▼
┌─────────────────┐
│  createClient   │
│  FromToken()    │
└────────┬────────┘
         │
         │ 5. 使用 token 创建客户端
         │    Authorization: Bearer <token>
         ▼
┌─────────────────┐
│  supabase.auth  │
│  getUser()      │
└────────┬────────┘
         │
         │ 6. 从 JWT 解析用户信息
         │    返回 user.id, user.email
         ▼
┌─────────────────┐
│  创建项目        │
│  owner_id =     │
│  user.id        │
└─────────────────┘
```

## 安全说明

### Token 有效期

- **默认**: 1 小时
- **可调整**: 在 Supabase Dashboard → Authentication → Settings → JWT Expiry 中修改

### Token 存储

- **浏览器端**: 存储在 Supabase 的 cookies 中（HttpOnly，安全）
- **MCP 配置**: Token 被编码在 URL 中，Cursor 会保存这个配置

### 权限验证

- **RLS 策略**: 即使有 token，RLS 策略也会确保用户只能操作自己的数据
- **双重保护**: Token 验证 + RLS 策略

## 常见问题

### Q: Token 过期了怎么办？

**A**: Cursor 需要重新连接 MCP Server。可以：
1. 在 Web 应用中重新点击"一键安装"获取新 token
2. 或手动更新 Cursor 的 MCP 配置中的 token

### Q: 如果多个用户使用同一个 Cursor，会怎样？

**A**: 每个用户需要：
1. 在自己的浏览器中登录 Cygnus-OS
2. 获取自己的 token
3. 在 Cursor 中配置自己的 MCP Server URL（包含自己的 token）

**结果**: 每个用户看到的是自己的项目（因为 token 不同）

### Q: Token 泄露了怎么办？

**A**: 
1. 在 Supabase Dashboard 中撤销该用户的会话
2. 用户重新登录获取新 token
3. 更新 Cursor 的 MCP 配置

### Q: 能否使用 API Key 代替 JWT Token？

**A**: 可以！MCP 支持 API Key 认证：
- 使用 `?apikey=<key>` 代替 `?token=<jwt>`
- API Key 是永久有效的（除非手动撤销）
- 适合自动化场景

## 相关文件

- `app/components/mcp/ConnectToCursor.tsx` - 浏览器端获取 token
- `app/lib/mcp/auth.ts` - Token 提取逻辑
- `app/lib/supabase/server.ts` - `createClientFromToken()` 实现
- `app/lib/mcp/projects.ts` - 使用 token 创建项目
- `app/api/mcp/route.ts` - MCP API 入口
