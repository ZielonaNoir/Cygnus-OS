# 域名配置指南 - GitHub OAuth 和 PWA

本指南说明部署到 Vercel 后，GitHub OAuth 登录和 PWA 所需的额外域名配置。

---

## 🔐 GitHub OAuth 登录配置

### 需要配置的原因

您的项目使用 Supabase 的 GitHub OAuth 提供者，回调 URL 设置为：
```typescript
redirectTo: `${window.location.origin}/auth/callback`
```

这意味着需要：
1. **在 Supabase Dashboard 中配置 GitHub OAuth Provider**
2. **在 GitHub 中创建 OAuth App 并配置回调 URL**

### 配置步骤

#### 步骤 1: 在 GitHub 创建 OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 **"New OAuth App"**（或编辑现有应用）
3. 填写以下信息：

   **Application name**: `Cygnus-OS`（或您喜欢的名称）
   
   **Homepage URL**: 
   ```
   https://cygnus-os.vercel.app
   ```
   （或您的 Vercel 部署域名）
   
   **Authorization callback URL**（重要）:
   ```
   https://jcauxnzgcqyjxrnhfnne.supabase.co/auth/v1/callback
   ```
   ⚠️ **注意**: 这是 Supabase 的回调 URL，格式为：`https://[您的Supabase项目ID].supabase.co/auth/v1/callback`

4. 点击 **"Register application"**
5. **复制以下信息**（稍后需要）：
   - **Client ID**
   - **Client Secret**

#### 步骤 2: 在 Supabase Dashboard 配置 GitHub Provider

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 **Authentication** → **Providers**
4. 找到 **GitHub** 并点击启用
5. 填写以下信息：
   - **Client ID**: 从 GitHub OAuth App 复制的 Client ID
   - **Client Secret**: 从 GitHub OAuth App 复制的 Client Secret
6. 点击 **"Save"**

#### 步骤 3: 配置 Supabase 重定向 URL（重要）

1. 在 Supabase Dashboard 中，进入 **Authentication** → **URL Configuration**
2. 在 **Redirect URLs** 中添加您的生产域名：
   ```
   https://cygnus-os.vercel.app/auth/callback
   ```
   （替换为您的实际 Vercel 域名）

3. 如果使用自定义域名，也要添加：
   ```
   https://yourdomain.com/auth/callback
   ```

4. 点击 **"Save"**

---

## 📱 PWA 配置

### 当前配置状态

您的 PWA 配置已经基本完成：

✅ **manifest.json**: 已配置，使用相对路径（会自动使用当前域名）
✅ **HTTPS**: Vercel 自动提供 HTTPS
✅ **Service Worker**: 已配置（`public/sw.js`）
✅ **Icons**: 已配置所有必需尺寸

### 需要检查的配置

#### 1. manifest.json 中的 start_url

当前配置：
```json
{
  "start_url": "/"
}
```

✅ **无需修改** - 相对路径会自动使用当前域名，适用于所有环境。

#### 2. Service Worker 作用域

确保 `public/sw.js` 中的 Service Worker 配置正确。如果使用自定义域名，Service Worker 会自动适配。

#### 3. VAPID 密钥配置（Web Push）

如果您使用推送通知，VAPID 配置已经通过环境变量设置：
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

✅ **无需额外域名配置** - VAPID 密钥与域名无关。

---

## 🌐 自定义域名配置（可选）

### 如果使用自定义域名

1. **在 Vercel Dashboard 添加自定义域名**：
   - 进入项目 → **Settings** → **Domains**
   - 添加您的自定义域名
   - 按照提示配置 DNS 记录

2. **更新 GitHub OAuth App**：
   - 在 GitHub OAuth App 设置中更新 **Homepage URL** 和 **Authorization callback URL**
   - ⚠️ **注意**: Supabase 回调 URL 不变，只需要更新 Homepage URL

3. **更新 Supabase 重定向 URL**：
   - 在 Supabase Dashboard → **Authentication** → **URL Configuration**
   - 添加新的自定义域名回调 URL：
     ```
     https://yourdomain.com/auth/callback
     ```

---

## ✅ 配置检查清单

### GitHub OAuth
- [ ] 在 GitHub 创建 OAuth App
- [ ] 配置 Authorization callback URL 为 Supabase URL
- [ ] 在 Supabase Dashboard 启用 GitHub Provider
- [ ] 在 Supabase 中配置 Client ID 和 Client Secret
- [ ] 在 Supabase Redirect URLs 中添加生产域名回调 URL

### PWA
- [ ] manifest.json 配置正确（✅ 已完成）
- [ ] Service Worker 正常工作（✅ 已配置）
- [ ] HTTPS 已启用（✅ Vercel 自动提供）
- [ ] Icons 已配置（✅ 已完成）

### 自定义域名（如果使用）
- [ ] 在 Vercel 添加自定义域名
- [ ] 配置 DNS 记录
- [ ] 更新 GitHub OAuth App Homepage URL
- [ ] 更新 Supabase Redirect URLs

---

## 🔍 验证配置

### 验证 GitHub OAuth

1. 访问您的部署应用
2. 点击 "使用 GitHub 登录"
3. 应该跳转到 GitHub 授权页面
4. 授权后应该重定向回 `/auth/callback`
5. 登录成功后应该进入应用

### 验证 PWA

1. 在移动设备或支持 PWA 的浏览器中访问应用
2. 应该看到 "添加到主屏幕" 提示
3. 添加到主屏幕后，应该可以像原生应用一样打开
4. 检查 manifest.json 是否正确加载：
   - 打开浏览器开发者工具
   - 进入 **Application** → **Manifest**
   - 确认所有信息正确显示

---

## 🐛 常见问题

### 问题 1: GitHub OAuth 重定向失败

**错误**: `redirect_uri_mismatch`

**解决方法**:
1. 检查 GitHub OAuth App 中的 **Authorization callback URL** 是否为 Supabase URL
2. 检查 Supabase Redirect URLs 中是否包含您的应用域名

### 问题 2: PWA 无法安装

**可能原因**:
- Service Worker 未正确注册
- manifest.json 路径错误
- HTTPS 未启用（Vercel 自动提供，通常不是问题）

**解决方法**:
1. 检查浏览器控制台是否有 Service Worker 错误
2. 确认 `manifest.json` 在 `/manifest.json` 可访问
3. 检查 `app/layout.tsx` 中的 manifest 配置

### 问题 3: 自定义域名后 OAuth 不工作

**解决方法**:
1. 更新 Supabase Redirect URLs 添加新域名
2. 更新 GitHub OAuth App 的 Homepage URL（回调 URL 不变）

---

## 📚 相关资源

- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [GitHub OAuth App 文档](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [PWA 最佳实践](https://web.dev/progressive-web-apps/)
- [Vercel 自定义域名文档](https://vercel.com/docs/concepts/projects/domains)

---

## 🎯 快速参考

### Supabase 回调 URL 格式
```
https://[您的Supabase项目ID].supabase.co/auth/v1/callback
```

### 应用回调 URL 格式
```
https://[您的Vercel域名]/auth/callback
```

### GitHub OAuth App 配置
- **Homepage URL**: 您的应用域名
- **Authorization callback URL**: Supabase 回调 URL（不是应用回调 URL）

---

**配置完成后，您的 GitHub OAuth 登录和 PWA 功能就可以正常工作了！** 🚀
