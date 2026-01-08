# GitHub OAuth 登录配置 - 快速指南

## 🚨 问题

部署到 Vercel 后，GitHub 登录跳转到 `localhost` 而不是 Vercel 域名。

## ✅ 解决方案

需要在 **2 个地方** 配置正确的回调 URL：

---

## 1️⃣ Supabase Dashboard 配置

### 操作步骤：

1. 访问：https://app.supabase.com/
2. 选择你的项目
3. 导航：**Authentication** → **URL Configuration**
4. 在 **Redirect URLs** 中添加：

```
https://你的vercel域名.vercel.app/auth/callback
https://你的vercel域名.vercel.app/*
```

### 示例：

如果你的 Vercel 域名是 `cygnus-os.vercel.app`，则添加：

```
https://cygnus-os.vercel.app/auth/callback
https://cygnus-os.vercel.app/*
```

**保留开发环境的配置**：
```
http://localhost:3000/auth/callback
```

---

## 2️⃣ GitHub OAuth App 配置

### 操作步骤：

1. 访问：https://github.com/settings/developers
2. 点击你的 OAuth App（或创建新的）
3. 更新以下字段：

**Authorization callback URL**：
```
https://你的vercel域名.vercel.app/auth/callback
```

**Homepage URL**（可选，建议更新）：
```
https://你的vercel域名.vercel.app
```

### 示例：

如果你的 Vercel 域名是 `cygnus-os.vercel.app`：

- **Authorization callback URL**: `https://cygnus-os.vercel.app/auth/callback`
- **Homepage URL**: `https://cygnus-os.vercel.app`

---

## 📋 配置检查清单

- [ ] **Supabase** → Authentication → URL Configuration
  - [ ] 添加生产环境回调 URL
  - [ ] 保留开发环境回调 URL

- [ ] **GitHub** → OAuth Apps
  - [ ] 更新 Authorization callback URL
  - [ ] 更新 Homepage URL（可选）

---

## 🔍 如何找到 Vercel 域名？

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 在项目页面可以看到域名（格式：`项目名.vercel.app`）

---

## ✅ 测试

配置完成后：

1. 访问：`https://你的vercel域名.vercel.app/login`
2. 点击 "使用 GitHub 登录"
3. 确认跳转到 GitHub 授权页面
4. 授权后应该跳转回 Vercel 域名，而不是 localhost

---

## 📚 详细文档

更多详细信息请查看：[docs/DEPLOYMENT_GITHUB_AUTH.md](./docs/DEPLOYMENT_GITHUB_AUTH.md)
