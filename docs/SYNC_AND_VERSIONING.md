# Cygnus-OS Sync & Version Control System

## 1. 核心理念 (Core Concepts)

Cygnus-OS 采用 **"Filesystem as Truth" (文件系统即真理)** 的架构设计。所有 Prompt 和项目数据首先存储在本地文件系统中（`.md`, `.prompt`, `.yaml`），然后通过 CLI 工具同步到 Supabase 数据库，以提供高级的 Web 界面交互和版本回溯功能。

### 双重同步机制 (Dual Sync)
`cygnus sync` 命令执行两类数据的同步：
1.  **Prompt Repos**: 位于 `/data/prompts`，包含 Prompt 内容、配置和上下文。
2.  **SIPE Projects**: 位于 `/data/[项目名]`，包含 PRD、任务列表和进度追踪。

---

## 2. 版本控制 (Version Control)

版本控制旨在解决 Prompt 迭代过程中的"后悔药"问题。系统会自动为每一个 Prompt 维护一份完整的历史快照。

### 版本生成逻辑
版本快照在以下两种情况下自动生成：

1.  **CLI 同步时 (Local -> Cloud)**
    *   当您在本地修改了 `main.prompt` 并运行 `npm run sync`。
    *   CLI 检测到内容变化或版本号变更，会自动在 Supabase `prompt_versions` 表中插入一条记录（默认为 `v1.0.0` 或 `config.yaml` 中指定的版本）。

2.  **Web端编辑时 (Cloud Direct)**
    *   当您在网页端 Prompt 详情页点击 **"保存"**。
    *   API 会同时更新 `prompts` 表（最新状态）和插入一条 `prompt_versions` 记录（历史快照）。

### 数据库结构
*   **prompts**: 存储 Prompt 的**当前最新状态**。
*   **prompt_versions**: 存储 Prompt 的**历史快照**（包含 content, version, created_at）。

---

## 3. 使用指南 (Usage Guide)

### 3.1 全量同步 (Full Sync)
这是最常用的操作。当您在本地添加了新的 Prompt 文件，或者批量修改了文件后，请执行：

```bash
npm run sync
```

该命令会自动：
1.  扫描 `/data` 目录下的所有 Prompt 和 Project。
2.  读取 `.env.local` 中的 Supabase 密钥。
3.  将变更推送到云端数据库。
4.  为新增或修改的 Prompt 创建版本快照。

### 3.2 常用参数
您也可以直接使用 CLI 的高级参数（通常通过 `npm run start -- sync` 调用）：

*   `--dry-run`: 试运行，只打印会同步什么，不实际写入数据库。
*   `--force`: 强制覆盖（即使云端内容比本地新）。
*   `--data-dir <path>`: 指定非默认的数据目录。

### 3.3 典型工作流
1.  **本地开发**: 在 VS Code 中创建 `data/prompts/Coding/MyPrompt/main.prompt`。
2.  **提交同步**: 运行 `npm run sync`。
3.  **在线查看**: 打开浏览器，在 Dashboard 中查看该 Prompt 及其初始版本。
4.  **在线微调**: 在网页端微调 Prompt 措辞并保存 -> **自动生成 v1.0.0 (Web Editor Save)** 版本。

---

## 4. 故障排查 (Troubleshooting)

### Q: 为什么网页端看不到版本历史？
**A**: 通常是因为数据库中没有该 Prompt 的记录。请确保至少运行过一次 `npm run sync`。即使是空的 Prompt，也需要先初始化。

### Q: 运行 sync 报错 "Supabase config not found"？
**A**: 确保项目根目录存在 `.env.local` 文件，并且包含正确的 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`。

### Q: 为什么我的 Prompt 没有被扫描到？
**A**: 请检查目录结构是否符合标准：`/data/prompts/<Domain>/<Scenario>/<Name>/main.prompt`。只有包含 `main.prompt` 的目录才会被视为有效的 Prompt Repo。
