# Vercel 部署指南

本指南将帮助您将 Cygnus-OS 项目部署到 Vercel。

---

## 📋 部署前准备

### 1. 确保代码已提交到 Git 仓库

```bash
# 检查 Git 状态
git status

# 如果有未提交的更改，提交它们
git add .
git commit -m "准备部署到 Vercel"

# 推送到远程仓库（GitHub, GitLab, 或 Bitbucket）
git push origin main
```

### 2. 准备环境变量清单

根据 `SECURITY_CHECK_REPORT.md`，您需要准备以下环境变量：

#### 必需的环境变量
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

#### 可选的环境变量（根据功能使用）
- `OPENAI_API_KEY`
- `KIMI_API_KEY` 或 `KIMI_KEY`
- `QWEN_API_KEY`
- `QWEN_API_URL`
- `KIMI_API_URL`
- `KIMI_MODEL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `CYGNUS_DATA_DIR`

---

## 🚀 部署步骤

### 方法一：通过 Vercel Dashboard（推荐）

#### 步骤 1: 登录 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub、GitLab 或 Bitbucket 账号登录
3. 如果首次使用，需要授权 Vercel 访问您的代码仓库

#### 步骤 2: 导入项目

1. 点击 **"Add New..."** → **"Project"**
2. 从列表中选择您的 Cygnus-OS 仓库
3. 如果看不到仓库，点击 **"Adjust GitHub App Permissions"** 授权访问

#### 步骤 3: 配置项目

1. **项目名称**: 可以保持默认或修改
2. **框架预设**: Vercel 会自动检测为 Next.js
3. **根目录**: 保持默认（如果项目在仓库根目录）
4. **构建命令**: 保持默认 `npm run build`（Vercel 会自动检测）
5. **输出目录**: 保持默认 `.next`
6. **安装命令**: 保持默认 `npm install`（如果使用 Bun，Vercel 会自动检测）

#### 步骤 4: 配置环境变量

在部署前，点击 **"Environment Variables"** 添加所有必需的环境变量：

1. 点击 **"Add"** 按钮
2. 输入变量名（如 `NEXT_PUBLIC_SUPABASE_URL`）
3. 输入变量值
4. 选择环境（Production, Preview, Development）
5. 点击 **"Save"**

**重要提示**：
- `NEXT_PUBLIC_*` 变量需要在所有环境（Production, Preview, Development）中设置
- 服务器端变量（如 `SUPABASE_SERVICE_ROLE_KEY`）至少需要在 Production 中设置
- 可以批量添加多个环境变量

#### 步骤 5: 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（通常需要 2-5 分钟）
3. 构建成功后，Vercel 会提供一个部署 URL（如 `cygnus-os.vercel.app`）

---

### 方法二：通过 Vercel CLI

#### 步骤 1: 安装 Vercel CLI

```bash
# 使用 npm
npm i -g vercel

# 或使用 Bun
bun add -g vercel
```

#### 步骤 2: 登录 Vercel

```bash
vercel login
```

#### 步骤 3: 在项目目录中部署

```bash
# 进入项目目录
cd c:\Users\CygneNoir\Desktop\Cygnus-OS\cygnus-os

# 首次部署（会引导配置）
vercel

# 后续部署到生产环境
vercel --prod
```

#### 步骤 4: 配置环境变量

```bash
# 添加单个环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# 或使用 .env 文件批量添加（需要先创建 .env.production）
vercel env pull .env.production
# 编辑 .env.production 文件
vercel env push .env.production
```

---

## ⚙️ 项目配置

### 检查 next.config.ts

确保 `next.config.ts` 配置正确：

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### 检查 package.json 脚本

确保有以下脚本：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx"
  }
}
```

---

## 🔧 环境变量配置详解

### Supabase 配置

1. **获取 Supabase 项目 URL**
   - 登录 [Supabase Dashboard](https://app.supabase.com)
   - 选择您的项目
   - 进入 **Settings** → **API**
   - 复制 **Project URL**

2. **获取 Supabase Anon Key**
   - 在同一页面，复制 **anon public** key

3. **获取 Service Role Key**
   - 在同一页面，复制 **service_role** key（⚠️ 保密）

4. **获取 JWT Secret**
   - 进入 **Settings** → **API** → **JWT Settings**
   - 复制 **JWT Secret**

### LLM API 配置（可选）

- **OpenAI**: 从 [OpenAI Platform](https://platform.openai.com/api-keys) 获取
- **Kimi**: 从 [Moonshot AI](https://platform.moonshot.cn/) 获取
- **通义千问**: 从 [阿里云](https://dashscope.console.aliyun.com/) 获取

---

## ✅ 部署后验证

### 1. 检查部署状态

在 Vercel Dashboard 中：
- 查看 **Deployments** 标签页
- 确认最新部署状态为 **Ready**（绿色）

### 2. 访问应用

1. 点击部署 URL 访问应用
2. 检查页面是否正常加载
3. 测试主要功能：
   - 登录功能
   - Dashboard 页面
   - PromptHub 页面

### 3. 检查控制台错误

1. 打开浏览器开发者工具（F12）
2. 查看 **Console** 标签页
3. 确认没有环境变量缺失的错误

### 4. 检查环境变量

如果应用无法正常工作，检查：
- Vercel Dashboard → **Settings** → **Environment Variables**
- 确认所有必需变量都已设置
- 确认变量值正确（没有多余空格）

---

## 🔄 更新部署

### 自动部署（推荐）

如果您的仓库已连接到 Vercel：
1. 推送代码到主分支（main/master）
2. Vercel 会自动触发新的部署
3. 在 Vercel Dashboard 查看部署进度

### 手动部署

```bash
# 使用 CLI
vercel --prod

# 或通过 Dashboard
# Vercel Dashboard → 项目 → Deployments → 点击 "Redeploy"
```

---

## 🐛 常见问题排查

### 问题 1: 构建失败

**可能原因**：
- 缺少必需的环境变量
- TypeScript 类型错误
- 依赖安装失败

**解决方法**：
1. 检查 Vercel 构建日志
2. 在本地运行 `bun run build` 测试
3. 确保所有环境变量都已设置

### 问题 2: 运行时错误

**可能原因**：
- 环境变量未正确设置
- Supabase 连接失败
- API 路由错误

**解决方法**：
1. 检查 Vercel 函数日志（Dashboard → Functions）
2. 验证环境变量值是否正确
3. 检查 Supabase 项目是否正常运行

### 问题 3: 环境变量未生效

**可能原因**：
- 变量名拼写错误
- 未选择正确的环境（Production/Preview）
- 需要重新部署

**解决方法**：
1. 确认变量名完全匹配（区分大小写）
2. 确保在 Production 环境中设置了变量
3. 重新部署项目

### 问题 4: NEXT_PUBLIC_* 变量未生效

**解决方法**：
1. 确保变量名以 `NEXT_PUBLIC_` 开头
2. 重新构建和部署（这些变量在构建时注入）
3. 清除浏览器缓存

---

## 📝 最佳实践

### 1. 使用环境分支

- **Production**: 生产环境变量
- **Preview**: 预览环境变量（用于 PR 预览）
- **Development**: 开发环境变量

### 2. 保护敏感变量

- ✅ 使用 Vercel 的环境变量功能
- ✅ 不要在代码中硬编码
- ✅ 不要将 `.env` 文件提交到 Git

### 3. 监控部署

- 设置 Vercel 通知（邮件/Slack）
- 监控部署状态和错误日志
- 定期检查应用性能

### 4. 自定义域名

1. 在 Vercel Dashboard → **Settings** → **Domains**
2. 添加您的自定义域名
3. 按照提示配置 DNS 记录

---

## 🎯 快速检查清单

部署前：
- [ ] 代码已推送到 Git 仓库
- [ ] 本地构建测试通过（`bun run build`）
- [ ] 所有环境变量值已准备好

部署时：
- [ ] 在 Vercel 中导入项目
- [ ] 配置所有必需的环境变量
- [ ] 确认构建配置正确

部署后：
- [ ] 访问部署 URL 验证应用
- [ ] 检查浏览器控制台无错误
- [ ] 测试主要功能（登录、Dashboard 等）
- [ ] 检查 Vercel 函数日志

---

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase 文档](https://supabase.com/docs)
- [安全检查报告](./SECURITY_CHECK_REPORT.md)

---

## 🆘 需要帮助？

如果遇到问题：
1. 查看 Vercel 构建日志
2. 检查浏览器控制台错误
3. 参考 [Vercel 故障排除指南](https://vercel.com/docs/concepts/deployments/troubleshooting)

---

**祝您部署顺利！** 🚀
