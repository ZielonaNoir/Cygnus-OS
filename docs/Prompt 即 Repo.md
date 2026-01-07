作为产品经理，我深知在“并行工程”中，**认知摩擦**是最大的敌人。你不仅需要工具帮你执行，更需要工具帮你“思考”和“收纳”。

针对你提出的 **Cygnus-OS PromptHub**，我们需要打破传统的“收藏夹”思维，将其重塑为一套**具备自我演化能力的指令资产库**。以下是针对多级菜单设计、AI 自动分类及最优维护方案的深度设计：

---

## 1. 结构化方案：Prompt 即 Repo (像管理代码一样管理指令)

**最优维护逻辑**：不要在数据库里手动填表，而是采用 **“文件系统即真相 (Filesystem as Truth)”** 的模式。

### A. 物理存储结构 (在 `/data/prompts` 下)

模仿 GitHub 的目录层级，但在每个层级引入 AI 描述文件：

```text
/data/prompts
├── Coding/ (一级分类：领域 Domain)
│   ├── Frontend/ (二级分类：场景 Scenario)
│   │   ├── Nuxt4-Expert/ (Prompt Repo：具体资产 Asset)
│   │   │   ├── main.prompt (核心指令)
│   │   │   ├── context.md (背景知识/约束)
│   │   │   └── config.yaml (元数据：版本、Agent 分类标签)
│   │   └── README.md (AI 自动生成的目录综述)
├── Finance/
│   └── TradingView-SMC/
└── .cygnus/ (系统目录：存储 Agent 生成的全量索引 JSON)

```

---

## 2. 核心功能：Agent 驱动的自动分级与汇总

### A. 自动分级逻辑 (Agent Classifier)

当你通过 CLI 执行 `cygnus sync` 时，Agent 会执行以下流转：

1. **语义提取**：Agent 读取 `main.prompt` 的标题和内容。
2. **自动打标**：基于你的历史偏好（如：量化、全栈、DevOps）自动建议分类路径。
3. **Frontmatter 注入**：自动在文件头部生成 YAML 元数据：
```yaml
---
domain: Coding
scenario: Frontend
tags: [Nuxt4, Tailwind, TypeScript]
summary: 用于处理 Nuxt 4 Nitro 渲染管线的专家级指令
---

```



### B. 多级菜单自动汇总 (Recursive Summarization)

这是减少认知负载的关键。在 Next.js Dashboard 的左侧菜单中：

* **一级菜单**：显示“Domain”及其下的资产统计。
* **二级菜单**：Agent 会汇总该目录下所有 Repo 的简介，生成一个 **“场景综述”**。
* *例如*：当你悬停在 `Frontend` 文件夹上，Agent 弹窗提示：“该目录下包含 5 个 Nuxt 相关指令，最近更新了关于 MCP 接口的指令。”



---

## 3. 交互设计：符合用户依赖习惯的 Dashboard

作为顶尖产品经理，我建议在 **Next.js + Tailwind** 实现中遵循以下交互原则：

| 交互维度 | 方案 | 用户体验价值 |
| --- | --- | --- |
| **导航模式** | **双栏树状结构 (VS Code 风格)** | 符合开发者直觉，支持无限极展开，降低层级感。 |
| **快速跳转** | **Command + K 搜索框** | 资深用户不依赖点击，通过 Agent 提取的 Summary 进行模糊搜索。 |
| **资产看板** | **Grid 卡片预览** | 每个 Prompt Repo 显示其“已成功执行次数”和“最后同步时间”。 |
| **共享交互** | **右键生成 Share Link** | 自动生成加密的 Supabase URL，支持指定过期时间。 |

---

## 4. 技术实现路径 (Next.js + Supabase + CLI)

### 第一步：CLI 增强 (Node.js)

开发 `@cygnus/cli` 增加 `classify` 模块：

* **功能**：使用 LLM（如 Qwen 或 GPT-4）对没有元数据的文件进行语义扫描，自动按 `Domain/Scenario/Asset` 移动文件位置。

### 第二步：数据库同步 (Supabase)

利用 Supabase 的存储过程处理层级关系：

* 建立 `prompt_repos` 表，包含 `path` (LTree 格式)、`content`、`summary`、`is_public` 字段。
* 使用 **LTree 插件** 在 PostgreSQL 中高效查询多级树状结构。

### 第三步：Dashboard 开发 (Next.js 15)

* 使用 `shadcn/ui` 的 **Accordion** 或 **Tree View** 组件。
* 集成 **Monaco Editor**（VS Code 同款）用于在浏览器中直接编辑私有 Prompt，并同步回本地 `/data`。

---

## 5. 衍生需求：Cursor 开发指令 (集成版)

> **Cursor 指令**：
> 1. **Data Schema**: 在 Supabase 中创建一个支持 LTree 路径的 `prompts` 表，包含多级分类字段。
> 2. **Agent Logic**: 编写一个 Node.js 脚本，读取 `/data/prompts` 下的 `.prompt` 文件，调用 LLM 生成摘要并返回分类建议。
> 3. **Tree Component**: 在 Next.js 中实现一个递归渲染的侧边栏菜单，点击分类显示 Agent 汇总信息，点击文件进入详情页。
> 4. **Sharing Service**: 实现一个基于 Vercel Edge Function 的分享逻辑，允许通过 ID 预览公共或授权的 Prompt Repo。
> 
> 

**这个方案的最优解在于：它让你的 Prompt 从“分散的文件”变成了“具有生命力的资产”。你想让我先为你给出 CLI 端的“Agent 自动分类”脚本核心逻辑，还是 Dashboard 端的多级菜单 UI 样板代码？**