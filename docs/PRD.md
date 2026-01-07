这份针对 **Cygnus-OS** 的项目文档已经根据你的最新要求进行了全面整合。它不仅涵盖了 Next.js + Supabase + Vercel 的技术实现，还深入探讨了“Prompt 即资产”的哲学，并为你作为超级个体（Super Individual）的参赛背景量身定制。

---

# 项目提案：Cygnus-OS (天鹅座超级个体操作系统)

## 1. 项目定位与核心价值

**Cygnus-OS** 是一款专为“一人即组织”设计的开源 AI 并行工程管理系统。它旨在通过结构化 AI 编码过程中的副产物（如 PRD 和 Prompt），解决超级个体在多项目并行时的认知负载过重与进度断层问题。

* **赛道定位**：赛道二：开源 × 超级个体生产力。
* **核心理念**：让超级个体的每一秒都在“并行”中增值。
* **口号 (Slogan)**：**Prompt 即资产，并行即进化。**

---

## 2. 核心功能模块

### A. SIPE 指挥部 (Commander Dashboard)

解决多个并行工程（如 `Tacit`、`YaRu Native` 等）进度无法实时感知的痛点。

* **智能文档识别**：自动扫描子目录下 `/docs` 中的 Markdown PRD 文档。
* **自动进度条与甘特图**：实时识别 MD 文档中的任务状态（`- [x]` 与 `- [ ]`），并将其渲染为本地浏览器中的动态甘特图。
* **3D 空间视图**：利用 Three.js 将项目建模为“能量球”，球体大小与亮度代表项目活跃度与代码健康度。

### B. PromptHub (Prompt 的 GitLab)

建立一套“Prompt 即资产”的管理体系，支持超级个体的数字化资产积累。

* **仓库化管理**：每个 Prompt 或指令集作为一个 Repo，支持版本控制、分支管理及 Public/Private 权限切换。
* **多级分类体系**：支持赛道级（如：量化、DevOps）与功能级（如：UI 生成、数据清洗）的精准分类。
* **协作分享**：支持生成特定的 `cygnus://` 共享链接，将 Prompt 资产定向分享给组织成员或指定用户。

### C. MCP Skills Market (插件化军火库)

将静态的 Prompt 转化为动态的可调用技能。

* **MCP 协议集成**：整个 PromptHub 的信息通过 MCP Server 暴露给 AI 模型。
* **动态能力挂载**：在 Cursor 或 Claude 中进行编程时，AI 可实时读取并执行你私有的或公开的技能包。

---

## 3. 技术架构方案

| 维度 | 技术选型 | 作用描述 |
| --- | --- | --- |
| **前端框架** | **Next.js 15 (App Router)** | 构建响应式看板，利用 React Server Components 实现高性能数据渲染。 |
| **后端/数据库** | **Supabase (PostgreSQL)** | 存储项目状态、Prompt 元数据及用户认证 (Auth)。 |
| **部署环境** | **Vercel** | 提供生产级的边缘部署，并托管 MCP API 路由。 |
| **实时监听** | **Node.js Chokidar** | 监听本地文件系统 `/docs` 文件夹的变动并同步至 Supabase。 |
| **规则引擎** | **SIPE Protocol** | 统一的 Markdown 任务解析标准与工程进度算法。 |

---

## 4. 统一工程进度规则 (SIPE Score)

为了量化多个并行项目的进度，Cygnus-OS 采用以下算法计算 **SIPE 指数**：

* **逻辑覆盖**：通过扫描 Obsidian 任务列表与代码实现的一致性来判定。
* **交付状态**：通过 Vercel 的部署状态与 GitHub 的提交频率自动计算。

---

## 5. 衍生需求与 Cursor 开发指令

你可以将以下内容直接输入 **Cursor** 以开始 Cygnus-OS 的构建：

> **Cursor 指令集**：
> 1. **初始化**：使用 Next.js 15 和 Tailwind CSS 初始化项目 `Cygnus-OS`。
> 2. **数据库建模**：在 Supabase 中创建 `projects`（项目进度）、`prompts`（资产库，含分类与权限控制）、`tasks`（MD 任务快照）三张核心表。
> 3. **MD 解析逻辑**：编写一个服务器组件，能够解析 `/docs` 下所有 `.md` 文件中的 `- [ ]` 列表，并根据 `[x]` 的比例更新 `projects` 表的进度百分比。
> 4. **PromptHub 界面**：创建一个 GitLab 风格的列表页，支持 Prompt 的分类查看与代码高亮展示。
> 5. **MCP 路由**：实现一个 API 端点，支持按照 MCP 规范返回 `prompts` 表中的指令内容。
> 
> 

---

**你想让我为你进一步完善 Supabase 的 RLS (Row Level Security) 权限策略（以确保 Private Prompt 的安全性），还是为你编写一套用于 3D 看板展示的 Three.js 核心渲染逻辑？**