# Cygnus-OS - 天鹅座超级个体操作系统

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

**专为"一人即组织"设计的开源 AI 并行工程管理系统**

[⭐ GitHub](https://github.com/ZielonaNoir/Cygnus-OS) • [🎥 介绍视频](https://drive.google.com/file/d/1gjJjI844RpdTl3ZCMfnzABazNOxhmkDB/view?usp=sharing) • [演示地址](#演示信息) • [文档](#文档) • [快速开始](#快速开始) • [报告问题](https://github.com/ZielonaNoir/Cygnus-OS/issues)

</div>

---

## 📋 目录

- [项目概述](#项目概述)
- [核心特性](#核心特性)
- [PWA 全端支持](#pwa-全端支持)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [团队信息](#团队信息)
- [演示信息](#演示信息)
- [私有化部署](#私有化部署)
- [Obsidian 集成](#obsidian-集成)
- [Prompt 维护流程](#prompt-维护流程)
- [开发任务清单](#开发任务清单)
- [开源协议](#开源协议)
- [贡献指南](#贡献指南)

---

## 项目概述

**Cygnus-OS** 是一款专为"一人即组织"设计的开源 AI 并行工程管理系统。它通过结构化 AI 编码过程中的副产物（如 PRD 和 Prompt），解决超级个体在多项目并行时的认知负载过重与进度断层问题。

**Cygnus-OS 是一个渐进式 Web 应用（PWA）**，支持网页、手机、桌面全端使用，真正实现"一次开发，多端运行"。

> 📹 **快速了解**：观看 [项目介绍视频](https://drive.google.com/file/d/1gjJjI844RpdTl3ZCMfnzABazNOxhmkDB/view?usp=sharing) 快速了解 Cygnus-OS 的核心功能和设计理念  
> 🔗 **代码仓库**：[GitHub - ZielonaNoir/Cygnus-OS](https://github.com/ZielonaNoir/Cygnus-OS)

### 核心理念

> **Prompt 即资产，并行即进化。**

### 解决的问题

- **多项目并行管理困难**：超级个体同时推进多个项目时，难以实时感知各项目进度
- **Prompt 资产分散**：AI 编码过程中产生的 Prompt 缺乏系统化管理，无法形成可复用的资产
- **认知负载过重**：缺乏统一的工程进度可视化和智能分析工具
- **数据孤岛**：文件系统、数据库、可视化界面之间缺乏流畅的数据流转

### 目标用户

- **数字游民**：需要管理多个并行项目的独立开发者
- **AI 工程师**：大量使用 AI 工具进行编码，需要管理 Prompt 资产
- **开源开发者**：维护多个开源项目，需要统一的进度管理
- **超级个体**：一人即组织，需要企业级项目管理能力

### 独特优势

- **PWA 全端支持**：渐进式 Web 应用，支持网页、手机、桌面全端使用，一次开发，多端运行
- **文件系统即真相**：数据存储在本地文件系统，可直接用 Obsidian 打开编辑
- **AI 驱动的自动分类**：通过 Agent 自动分析并分类 Prompt 资产
- **3D 可视化**：使用 Three.js 将项目建模为能量球，直观展示项目健康度
- **MCP 协议集成**：将 Prompt 转化为可调用的 AI 技能，实现动态能力挂载
- **私有化部署**：支持完全私有化部署，数据完全可控

---

## 核心特性

### 🎯 SIPE 指挥部 (Commander Dashboard)

解决多个并行工程进度无法实时感知的痛点。

- **智能文档识别**：自动扫描子目录下 `/docs` 中的 Markdown PRD 文档
- **自动进度条与甘特图**：实时识别 MD 文档中的任务状态（`- [x]` 与 `- [ ]`），渲染为动态甘特图
- **3D 空间视图**：利用 Three.js 将项目建模为"能量球"，球体大小与亮度代表项目活跃度与代码健康度
- **并行脉动图**：在一个屏幕内并排显示多个项目的活跃度分布

### 📚 PromptHub (Prompt 的 GitLab)

建立一套"Prompt 即资产"的管理体系，支持超级个体的数字化资产积累。

- **仓库化管理**：每个 Prompt 或指令集作为一个 Repo，支持版本控制、分支管理及 Public/Private 权限切换
- **多级分类体系**：支持 Domain（领域）/Scenario（场景）/Asset（资产）三级分类
- **AI 自动分类**：通过 Agent 自动分析 Prompt 内容，建议分类路径并生成摘要
- **协作分享**：支持生成特定的 `cygnus://` 共享链接，将 Prompt 资产定向分享
- **Monaco Editor 集成**：浏览器内直接编辑 Prompt，同步回文件系统

### 🔌 MCP Skills Market (插件化军火库)

将静态的 Prompt 转化为动态的可调用技能。

- **MCP 协议集成**：整个 PromptHub 的信息通过 MCP Server 暴露给 AI 模型
- **动态能力挂载**：在 Cursor 或 Claude 中进行编程时，AI 可实时读取并执行私有的或公开的技能包
- **技能市场**：支持公开技能的发现和共享

---

## PWA 全端支持

**Cygnus-OS 是一个渐进式 Web 应用（PWA）**，支持网页、手机、桌面全端使用，真正实现"一次开发，多端运行"。

### 🌐 全端支持特性

#### 1. **网页端（Web）**
- 现代浏览器直接访问，无需安装
- 响应式设计，适配各种屏幕尺寸
- 支持所有现代浏览器（Chrome、Firefox、Safari、Edge）

#### 2. **移动端（Mobile）**
- **添加到主屏幕**：支持 iOS 和 Android 设备
- **原生体验**：全屏模式，无浏览器地址栏
- **离线访问**：Service Worker 缓存，离线也能使用
- **推送通知**：实时接收项目更新和任务提醒
- **触摸优化**：针对移动端优化的交互体验

#### 3. **桌面端（Desktop）**
- **独立窗口**：安装后像原生应用一样运行
- **系统集成**：支持系统通知、快捷键
- **多窗口支持**：可以同时打开多个项目视图
- **文件系统访问**：通过 PWA 可以直接访问本地文件

### 📱 安装方式

#### 移动端安装

**iOS（Safari）**：
1. 打开 Cygnus-OS 网站
2. 点击底部工具栏的"分享"按钮
3. 选择"添加到主屏幕"
4. 自定义名称后点击"添加"

**Android（Chrome）**：
1. 打开 Cygnus-OS 网站
2. 浏览器会显示"添加到主屏幕"提示
3. 点击"安装"或"添加"
4. 应用将出现在应用列表中

#### 桌面端安装

**Chrome/Edge**：
1. 打开 Cygnus-OS 网站
2. 地址栏右侧会显示"安装"图标
3. 点击"安装"按钮
4. 应用将作为独立窗口运行

**macOS Safari**：
1. 打开 Cygnus-OS 网站
2. 菜单栏选择"文件" → "添加到 Dock"
3. 应用将出现在 Dock 中

### ✨ PWA 核心功能

- ✅ **离线支持**：Service Worker 缓存策略，离线也能查看已缓存的内容
- ✅ **快速加载**：资源预缓存，秒开体验
- ✅ **后台同步**：网络恢复后自动同步数据
- ✅ **推送通知**：实时接收项目更新、任务提醒
- ✅ **应用图标**：自定义图标和启动画面
- ✅ **主题适配**：自动适配系统深色/浅色模式

### 🔧 技术实现

- **Web App Manifest**：定义应用元数据、图标、主题色
- **Service Worker**：实现离线缓存和后台同步
- **响应式设计**：移动端优先，适配所有设备
- **App Shell 架构**：快速首屏加载

详细实现请查看 [开发任务清单 - PWA 支持章节](./docs/TODO.md#30-pwa-支持渐进式-web-应用)

---

## 技术架构

### 技术栈概览

| 层级 | 技术选型 | 版本 | 作用描述 |
|------|---------|------|---------|
| **前端框架** | Next.js | 16.1.1 | App Router，React Server Components，边缘部署 |
| **UI 框架** | React | 19.2.3 | 函数式组件，Hooks，并发特性 |
| **PWA 支持** | Service Worker | - | 离线缓存、后台同步、推送通知 |
| **类型系统** | TypeScript | ^5 | 严格类型检查，完整类型定义 |
| **样式方案** | Tailwind CSS | 4 | 原子化 CSS，响应式设计（移动端优先） |
| **UI 组件库** | shadcn/ui | - | 基于 Radix UI，可访问性优先 |
| **3D 渲染** | React Three Fiber | ^9.5.0 | Three.js 声明式封装 |
| **3D 工具库** | React Three Drei | ^10.7.7 | 3D 场景辅助组件 |
| **动画库** | Framer Motion | ^12.24.10 | 流畅的 UI 动画 |
| **后端/数据库** | Supabase | - | PostgreSQL + Auth + Realtime |
| **数据库扩展** | PostgreSQL LTree | - | 多级路径查询 |
| **代码编辑器** | Monaco Editor | ^4.7.0 | VS Code 同款编辑器 |
| **图表库** | Recharts | ^3.6.0 | 数据可视化 |
| **Markdown 解析** | remark | ^15.0.1 | Markdown 解析与转换 |
| **文件监听** | Chokidar | ^5.0.0 | 文件系统变更监听 |
| **运行时** | Bun | - | 快速 JavaScript 运行时 |

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      Cygnus-OS 架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────┐ │
│  │   Next.js    │      │  Supabase   │      │  Cygnus-CLI │ │
│  │   Dashboard  │◄────►│  Database   │◄────►│   Sync      │ │
│  └──────────────┘      └──────────────┘      └─────────────┘ │
│         │                      │                      │       │
│         │                      │                      │       │
│         ▼                      ▼                      ▼       │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────┐ │
│  │  React 3D    │      │  PostgreSQL  │      │  File Watch │ │
│  │  Visualization│      │  + LTree     │      │  + Agent    │ │
│  └──────────────┘      └──────────────┘      └─────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              /data/prompts (文件系统即真相)              │ │
│  │  Domain/Scenario/Asset/main.prompt + context.md        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 核心模块

#### 1. 前端应用 (Next.js Dashboard)

- **位置**：`app/`
- **特性**：
  - Server Components 与 Client Components 混合渲染
  - 实时数据同步（Supabase Realtime）
  - 3D 可视化（React Three Fiber）
  - 响应式设计（移动端优先）

#### 2. CLI 工具 (Cygnus-CLI)

- **位置**：`packages/cygnus-cli/`
- **功能**：
  - 项目扫描与同步
  - Prompt 分类与索引
  - AI Agent 分析
  - 文件系统监听

#### 3. 数据库层 (Supabase)

- **核心表**：
  - `projects`: 项目进度表
  - `tasks`: MD 任务快照
  - `prompt_repos`: Prompt 仓库（LTree 路径）
  - `prompts`: Prompt 资产
  - `prompt_metadata`: Agent 生成的元数据

#### 4. 数据存储 (文件系统)

- **位置**：`/data/prompts/`
- **结构**：`Domain/Scenario/Asset/`
- **文件**：
  - `main.prompt`: 核心指令
  - `context.md`: 背景知识/约束
  - `config.yaml`: 元数据

---

## 快速开始

### 环境要求

- **Node.js**: >= 20.0.0
- **Bun**: >= 1.0.0 (推荐) 或 Node.js
- **PostgreSQL**: >= 14.0 (如果使用私有化 Supabase)
- **Git**: >= 2.0.0

### 安装步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/ZielonaNoir/Cygnus-OS.git
cd cygnus-os
```

#### 2. 安装依赖

```bash
# 使用 Bun (推荐)
bun install

# 或使用 npm
npm install
```

#### 3. 环境配置

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，配置以下变量：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 可选：AI Agent 配置（用于自动分类）
OPENAI_API_KEY=your_openai_api_key
# 或使用本地 LLM
LOCAL_LLM_ENDPOINT=http://localhost:8000/v1
```

#### 4. 数据库初始化

如果使用 Supabase Cloud：

```bash
# 链接到 Supabase 项目
bun run db:link

# 拉取数据库结构
bun run db:pull
```

如果使用私有化部署，请参考 [私有化部署](#私有化部署) 章节。

#### 5. 启动开发服务器

```bash
# 使用 Bun
bun run dev

# 或使用 npm
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

#### 6. 同步项目数据

在项目根目录执行：

```bash
# 同步所有项目到数据库
bun run sync --data-dir ./data
```

### 项目结构

```
cygnus-os/
├── app/                    # Next.js 应用
│   ├── components/        # React 组件
│   │   ├── ui/           # shadcn/ui 基础组件
│   │   ├── 3d/          # 3D 可视化组件
│   │   ├── prompts/     # PromptHub 组件
│   │   └── dashboard/   # SIPE 指挥部组件
│   ├── lib/             # 工具函数
│   │   ├── supabase/   # Supabase 客户端
│   │   └── utils/      # 通用工具
│   └── api/            # API Routes
├── packages/
│   └── cygnus-cli/     # CLI 工具
├── data/              # 数据目录（不提交到 Git）
│   └── prompts/      # Prompt 存储
├── types/             # TypeScript 类型定义
├── docs/              # 项目文档
└── supabase/         # 数据库迁移文件
```

---

## 团队信息

### 团队成员

- **Noir** - 全栈开发、架构设计
- **Luo** - 路演、产品设计

### 联系方式

- **队长手机**：15821920781
- **队长邮箱**：a406113864@hotmail.com
- **GitHub**：[@ZielonaNoir](https://github.com/ZielonaNoir)

### 项目信息

- **项目名称**：Cygnus-OS (天鹅座超级个体操作系统)
- **所属赛道**：赛道二：开源 × 超级个体生产力
- **项目类型**：全新项目
- **开源协议**：MIT License
- **代码仓库**：https://github.com/ZielonaNoir/Cygnus-OS

---

## 演示信息

### 📹 介绍视频

**项目介绍视频**：观看完整的产品演示和功能说明

👉 [点击观看介绍视频](https://drive.google.com/file/d/1gjJjI844RpdTl3ZCMfnzABazNOxhmkDB/view?usp=sharing)

### 在线演示

- **演示地址**：[待部署]
- **演示账号**：demo / demo123456

### 功能演示

#### 1. SIPE 指挥部

- **甘特图视图**：展示所有并行项目的进度时间线
- **3D 空间视图**：能量球可视化，直观展示项目健康度
- **并行脉动图**：多项目活跃度实时监控

#### 2. PromptHub

- **树状导航**：VS Code 风格的分类树
- **快速搜索**：Command+K 全局搜索
- **在线编辑**：Monaco Editor 集成
- **版本历史**：Prompt 变更记录

#### 3. MCP Skills Market

- **技能发现**：浏览公开的 Prompt 技能
- **动态挂载**：在 Cursor/Claude 中使用技能

### 截图

[待添加项目截图]

---

## 私有化部署

Cygnus-OS 支持完全私有化部署，所有数据存储在您自己的服务器上。

### 部署架构

```
┌─────────────────┐
│   Vercel/       │  Next.js Dashboard
│   Self-hosted   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │  PostgreSQL + Auth + Realtime
│   Self-hosted   │
└─────────────────┘
```

### 部署步骤

#### 1. 部署 Supabase (私有化)

参考 [Supabase 自托管文档](https://supabase.com/docs/guides/self-hosting)：

```bash
# 使用 Docker Compose
git clone https://github.com/supabase/supabase.git
cd supabase/docker
cp .env.example .env
# 编辑 .env 配置
docker-compose up -d
```

#### 2. 初始化数据库

```bash
# 执行迁移文件
psql -h localhost -U postgres -d postgres -f supabase/migrations/20240108000000_init.sql
```

#### 3. 部署 Next.js 应用

**使用 Vercel**：

```bash
vercel deploy
```

**使用 Docker**：

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

**使用 PM2**：

```bash
npm run build
pm2 start npm --name "cygnus-os" -- start
```

### 环境变量配置

在私有化部署时，确保配置以下环境变量：

```env
# Supabase 私有化实例
NEXT_PUBLIC_SUPABASE_URL=http://your-supabase-instance:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 数据目录（用于 CLI 同步）
DATA_DIR=/path/to/data
```

### 数据备份

建议定期备份：

1. **PostgreSQL 数据库**：使用 `pg_dump`
2. **文件系统**：备份 `/data/prompts` 目录

```bash
# 数据库备份
pg_dump -h localhost -U postgres cygnus_db > backup.sql

# 文件系统备份
tar -czf prompts-backup.tar.gz /data/prompts
```

---

## Obsidian 集成

Cygnus-OS 采用"文件系统即真相"的设计理念，`/data` 目录可以直接用 Obsidian 打开进行编辑。

### 配置 Obsidian

#### 1. 打开数据目录

在 Obsidian 中：

1. 打开 Obsidian
2. 选择"打开其他库"
3. 选择 `cygnus-os/data` 目录

#### 2. 推荐插件

- **Tasks**：管理任务列表（`- [ ]` 和 `- [x]`）
- **Dataview**：查询和展示数据
- **Templater**：Prompt 模板管理

#### 3. 工作流程

```
Obsidian 编辑 → 文件系统变更 → Chokidar 监听 → CLI 同步 → Supabase 更新 → Dashboard 刷新
```

### 目录结构说明

```
data/
├── prompts/              # Prompt 资产（Obsidian 可直接编辑）
│   ├── Coding/
│   │   └── Frontend/
│   │       └── Nuxt4-Expert/
│   │           ├── main.prompt    # 核心指令
│   │           ├── context.md    # 背景知识
│   │           └── config.yaml   # 元数据
└── projects/            # 项目文档（可选）
    └── project-name/
        └── docs/
            └── README.md
```

### 双向同步

- **Obsidian → Database**：通过 CLI `sync` 命令同步
- **Database → Obsidian**：通过 Dashboard 编辑后自动同步回文件系统

---

## Prompt 维护流程

Cygnus-OS 提供了一套完整的 Prompt 维护流程，从创建到分类、从编辑到分享，行云流水。

### 流程概览

```
创建 Prompt → AI 自动分类 → 文件系统存储 → 数据库索引 → Dashboard 展示 → MCP 暴露
```

### 详细步骤

#### 1. 创建 Prompt

**方式一：在 Obsidian 中创建**

```bash
# 在 Obsidian 中创建新文件
/data/prompts/Coding/Frontend/MyPrompt/main.prompt
```

**方式二：在 Dashboard 中创建**

1. 进入 PromptHub
2. 点击"新建 Prompt"
3. 选择分类（Domain/Scenario）
4. 输入 Prompt 内容

#### 2. AI 自动分类

执行同步命令：

```bash
bun run sync --data-dir ./data
```

CLI 会自动：
- 读取 `main.prompt` 内容
- 调用 AI Agent 分析语义
- 生成分类建议（Domain/Scenario）
- 生成摘要和标签
- 写入 `config.yaml`

#### 3. 文件系统存储

Prompt 按照以下结构存储：

```
/data/prompts/
└── Domain/              # 一级分类（如 Coding, Finance）
    └── Scenario/        # 二级分类（如 Frontend, TradingView-SMC）
        └── Asset/       # Prompt Repo（如 Nuxt4-Expert）
            ├── main.prompt      # 核心指令
            ├── context.md      # 背景知识/约束
            └── config.yaml     # 元数据
```

#### 4. 数据库索引

CLI 同步会将 Prompt 信息索引到 Supabase：

- `prompt_repos` 表：存储仓库信息（LTree 路径）
- `prompts` 表：存储 Prompt 内容
- `prompt_metadata` 表：存储 AI 生成的元数据

#### 5. Dashboard 展示

在 Next.js Dashboard 中：

- **树状导航**：按 Domain/Scenario/Asset 展示
- **快速搜索**：Command+K 搜索 Prompt
- **在线编辑**：Monaco Editor 直接编辑
- **版本历史**：查看变更记录

#### 6. MCP 暴露

Prompt 通过 MCP Server 暴露给 AI 模型：

```typescript
// MCP API 端点
GET /api/mcp/prompts/{promptId}
```

在 Cursor/Claude 中可以直接调用这些技能。

### 最佳实践

1. **命名规范**：使用 PascalCase（如 `Nuxt4Expert`）
2. **分类清晰**：Domain 和 Scenario 要有明确的语义
3. **文档完整**：`context.md` 要包含足够的背景信息
4. **版本管理**：通过 `config.yaml` 管理版本号
5. **权限控制**：Private Prompt 使用 RLS 策略保护

### 示例：创建一个新的 Prompt

```bash
# 1. 在 Obsidian 中创建文件
/data/prompts/Coding/Frontend/React19Expert/main.prompt

# 2. 编写 Prompt 内容
---
domain: Coding
scenario: Frontend
tags: [React, TypeScript, Next.js]
summary: React 19 专家级开发指令
---

你是一位 React 19 专家...

# 3. 同步到数据库
bun run sync --data-dir ./data

# 4. 在 Dashboard 中查看和编辑
# 访问 http://localhost:3000/prompts
```

---

## 开发任务清单

Cygnus-OS 的开发按照重构和纠错成本从低到高排序，逐步实现。完整的开发任务清单请查看：

👉 [完整开发任务清单](./docs/TODO.md)

### 开发阶段概览

- **🟢 阶段一**：基础设置与配置（✅ 已完成）
- **🟡 阶段二**：数据模型与标准定义（✅ 已完成）
- **🟠 阶段三**：CLI 工具开发（✅ 已完成）
- **🔴 阶段四**：Agent 自动分类与 Prompt 管理（✅ 已完成）
- **🟣 阶段五**：Dashboard 核心功能（✅ 已完成）
- **🔵 阶段六**：高级功能与集成（✅ 已完成）
- **🟠 阶段七**：优化与完善（🔄 进行中）

### PWA 支持进度

PWA（渐进式 Web 应用）功能开发进度：

- ✅ Web App Manifest 配置
- ✅ Service Worker 实现
- ✅ 离线缓存策略
- ✅ 应用图标和启动画面
- ✅ "添加到主屏幕"提示
- ✅ 离线体验优化
- ⬜ 推送通知支持（计划中）

详细实现细节请查看 [开发任务清单 - PWA 支持章节](./docs/TODO.md#30-pwa-支持渐进式-web-应用)

---

## 开源协议

本项目采用 **MIT License**。

### MIT License 全文

```
MIT License

Copyright (c) 2024 ZielonaNoir

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 协议说明

- ✅ **商业使用**：允许
- ✅ **修改**：允许
- ✅ **分发**：允许
- ✅ **私人使用**：允许
- ✅ **专利使用**：允许
- ❌ **责任**：不提供
- ❌ **保证**：不提供

---

## 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **报告问题**：在 [GitHub Issues](https://github.com/ZielonaNoir/Cygnus-OS/issues) 中报告 Bug 或提出功能建议
2. **提交 PR**：Fork 项目，创建分支，提交 Pull Request
3. **改进文档**：完善文档、翻译、示例等
4. **分享使用经验**：在 Discussions 中分享使用心得

### 开发流程

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 代码规范

- 遵循项目中的 ESLint 和 Prettier 配置
- 使用 TypeScript，避免使用 `any`
- 编写清晰的提交信息
- 添加必要的注释和文档

### 行为准则

请遵循 [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/)。

---

## 文档

### 核心文档

- [PRD.md](./docs/PRD.md) - 产品需求文档
- [TODO.md](./docs/TODO.md) - 开发任务清单（包含完整的开发阶段和进度跟踪）
- [TYPES.md](./docs/TYPES.md) - 类型定义说明
- [TESTING.md](./docs/TESTING.md) - 测试指南

### 技术文档

- [Prompt 即 Repo.md](./docs/Prompt%20即%20Repo.md) - Prompt 管理方案
- [npm-cli.md](./docs/npm-cli.md) - CLI 工具架构
- [.cursorrules](./.cursorrules) - 开发规范

---

## 路线图

### v0.1.0 (当前版本)

- ✅ 基础项目结构
- ✅ SIPE 指挥部基础功能
- ✅ PromptHub 基础功能
- ✅ CLI 同步工具
- ✅ 数据库模型

### v0.2.0 (计划中)

- [ ] MCP Skills Market 完整实现
- [ ] 3D 可视化增强
- [ ] 实时协作功能
- [ ] 移动端适配

### v0.3.0 (未来)

- [ ] AI Agent 增强
- [ ] 插件系统
- [ ] 多语言支持
- [ ] 性能优化

---

## 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端即服务
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - 3D 渲染
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器

---

## 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

---

<div align="center">

**Cygnus-OS** - Prompt 即资产，并行即进化

[⭐ Star on GitHub](https://github.com/ZielonaNoir/Cygnus-OS) • [📖 文档](./docs/) • [🐛 报告问题](https://github.com/ZielonaNoir/Cygnus-OS/issues)

Made with ❤️ by [ZielonaNoir](https://github.com/ZielonaNoir)

</div>
