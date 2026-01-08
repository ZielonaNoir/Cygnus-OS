# GitHub OAuth 登录配置指南

## 问题描述

部署到 Vercel 后，GitHub 登录跳转到 localhost 而不是 Vercel 域名。

## 解决方案

需要在以下三个地方配置正确的回调 URL：

### 1. Supabase Dashboard 配置

#### 步骤：

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 进入 **Authentication** → **URL Configuration**
4. 在 **Redirect URLs** 中添加以下 URL：

```
https://your-vercel-app.vercel.app/auth/callback
https://your-vercel-app.vercel.app/*
```

**注意**：
- 将 `your-vercel-app` 替换为你的 Vercel 应用域名
- 如果使用自定义域名，也要添加自定义域名的回调 URL
- 开发环境可以保留 `http://localhost:3000/auth/callback`

#### 示例配置：

```
http://localhost:3000/auth/callback
https://cygnus-os.vercel.app/auth/callback
https://cygnus-os.vercel.app/*
https://your-custom-domain.com/auth/callback
https://your-custom-domain.com/*
```

### 2. GitHub OAuth App 配置

#### 步骤：

1. 登录 [GitHub](https://github.com/)
2. 进入 **Settings** → **Developer settings** → **OAuth Apps**
3. 找到或创建你的 OAuth App
4. 在 **Authorization callback URL** 中配置：

```
https://your-vercel-app.vercel.app/auth/callback
```

**注意**：
- 将 `your-vercel-app` 替换为你的 Vercel 应用域名
- 如果使用自定义域名，使用自定义域名
- 开发环境可以保留 `http://localhost:3000/auth/callback`

#### 完整配置示例：

- **Application name**: Cygnus-OS
- **Homepage URL**: `https://your-vercel-app.vercel.app`
- **Authorization callback URL**: `https://your-vercel-app.vercel.app/auth/callback`

### 3. Vercel 环境变量配置（可选）

虽然代码中使用了 `window.location.origin` 自动获取域名，但为了确保一致性，可以在 Vercel 中设置环境变量：

#### 步骤：

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量（如果需要）：

```
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

**注意**：当前代码使用 `window.location.origin`，所以这个环境变量是可选的。

### 4. 代码检查（已自动处理）

代码中已经使用了 `window.location.origin` 自动获取当前域名：

```typescript
// app/login/page.tsx
redirectTo: `${window.location.origin}/auth/callback`
```

这意味着：
- 在 `localhost:3000` 时会使用 `http://localhost:3000/auth/callback`
- 在 Vercel 部署时会自动使用 `https://your-vercel-app.vercel.app/auth/callback`

**无需修改代码**，只需要配置 Supabase 和 GitHub 即可。

---

## 配置检查清单

- [ ] Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
  - [ ] 添加 `https://your-vercel-app.vercel.app/auth/callback`
  - [ ] 添加 `https://your-vercel-app.vercel.app/*`
  - [ ] 保留 `http://localhost:3000/auth/callback`（开发环境）

- [ ] GitHub → Settings → Developer settings → OAuth Apps
  - [ ] 更新 Authorization callback URL 为 `https://your-vercel-app.vercel.app/auth/callback`
  - [ ] 更新 Homepage URL 为 `https://your-vercel-app.vercel.app`

- [ ] Vercel Environment Variables（可选）
  - [ ] 添加 `NEXT_PUBLIC_APP_URL`（如果需要）

---

## 测试步骤

1. 访问你的 Vercel 应用：`https://your-vercel-app.vercel.app/login`
2. 点击 "使用 GitHub 登录"
3. 确认跳转到 GitHub 授权页面
4. 授权后应该跳转回 `https://your-vercel-app.vercel.app/auth/callback`
5. 最终跳转到 `https://your-vercel-app.vercel.app/dashboard`

---

## 常见问题

### Q: 为什么还是跳转到 localhost？

**A**: 检查以下几点：
1. 确认 Supabase Redirect URLs 中已添加 Vercel 域名
2. 确认 GitHub OAuth App 的 Authorization callback URL 已更新
3. 清除浏览器缓存和 Cookie
4. 确认 Vercel 部署已成功

### Q: 如何找到我的 Vercel 应用域名？

**A**: 
1. 登录 Vercel Dashboard
2. 选择你的项目
3. 在项目概览页面可以看到域名（通常是 `project-name.vercel.app`）
4. 或者在 **Settings** → **Domains** 中查看

### Q: 使用自定义域名怎么办？

**A**: 
1. 在 Supabase Redirect URLs 中添加自定义域名的回调 URL
2. 在 GitHub OAuth App 的 Authorization callback URL 中使用自定义域名
3. 确保自定义域名已正确配置 DNS 和 SSL 证书

### Q: 开发环境和生产环境都需要配置吗？

**A**: 
- **开发环境**：使用 `http://localhost:3000/auth/callback`
- **生产环境**：使用 `https://your-vercel-app.vercel.app/auth/callback`
- 两个环境都需要在 Supabase 和 GitHub 中配置

---

## 快速配置命令

如果你使用 Supabase CLI，也可以通过命令行配置：

```bash
# 链接到 Supabase 项目
supabase link --project-ref your-project-ref

# 更新 Redirect URLs（需要手动在 Dashboard 中配置）
```

---

**配置完成后，重新测试 GitHub 登录功能，应该可以正常跳转到 Vercel 域名了。**
