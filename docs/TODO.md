# Cygnus-OS 开发任务清单

> 按照重构和纠错成本从低到高排序，逐步实现
> 
> 整合需求来源：
> - `PRD.md` - 核心功能模块与架构
> - `Prompt 即 Repo.md` - PromptHub 文件系统即真相模式
> - `npm-cli.md` - CLI 工具与 AI 分析层

## 📋 任务状态说明
- ⬜ 待开始 (Pending)
- 🔄 进行中 (In Progress)
- ✅ 已完成 (Completed)
- ⏸️ 已暂停 (Paused)

---

## 🟢 阶段一：基础设置与配置（成本：低）

### 1. 项目基础配置
- ✅ 更新项目元数据（title: "Cygnus-OS", description）
- ✅ 配置 Tailwind CSS 主题变量（支持暗色模式）
- ✅ 设置项目基础路由结构（dashboard, prompts, api）
- ✅ 配置环境变量管理（.env.local, .env.example）
- ✅ 设置项目目录结构（lib/, components/, types/, data/）

### 2. 依赖安装 - Next.js Dashboard
- ✅ 安装 Supabase 客户端库 (`@supabase/supabase-js`)
- ✅ 安装文件监听库 (`chokidar`) - 用于本地开发
- ✅ 安装 Markdown 解析库 (`remark`, `remark-gfm`, `remark-frontmatter`)
- ✅ 安装日期处理库 (`date-fns`)
- ⬜ 安装 UI 组件库 (`shadcn/ui` 或类似)
- ✅ 安装代码编辑器 (`monaco-editor` 或 `@monaco-editor/react`)
- ✅ 安装图表库 (`recharts` 或 `react-gantt-chart`)

### 3. 依赖安装 - CLI 工具
- ✅ 创建独立的 CLI 项目目录 (`packages/cygnus-cli/`)
- ✅ 初始化 CLI 项目（使用 `commander` 或 `yargs`）
- ✅ 安装文件系统工具 (`glob`, `fs-extra`)
- ✅ 安装 LLM 调用库（OpenAI SDK 或本地 Qwen 接口）
- ✅ 安装 YAML 解析库 (`js-yaml`)

### 4. 代码规范与工具
- ✅ 配置 ESLint 规则（Next.js + TypeScript）
- ✅ 设置 Prettier 格式化
- ✅ 创建基础类型定义文件 (`types/index.ts`)
- ✅ 配置 TypeScript 路径别名 (`@/`, `@lib/`, `@components/`)

---

## 🟡 阶段二：数据模型与标准定义（成本：中低）

### 5. SIPE 标准 JSON 结构定义
- ✅ 定义 SIPE JSON Schema (`types/sipe.ts`)
  - project_name, last_sync, progress, tasks[], requirements[], health_score
- ✅ 创建 JSON Schema 验证工具 (`lib/validators/sipe-validator.ts`)
- ✅ 编写类型定义文档 (`docs/TYPES.md`)

### 6. Supabase 数据库设计 - 项目进度
- ✅ 创建 `projects` 表（项目进度）
  - id, name, description, path, progress, status, health_score, last_sync, created_at, updated_at
- ✅ 创建 `tasks` 表（MD 任务快照）
  - id, project_id, task_text, status, priority, line_number, file_path, created_at, updated_at
- ✅ 创建 `project_sync_v1` 表（CLI 同步状态）
  - id, project_id, sipe_json (JSONB), sync_timestamp, created_at

### 7. Supabase 数据库设计 - PromptHub（文件系统即真相）
- ✅ 创建 `prompt_repos` 表（Prompt 仓库）
  - id, name, description, path (LTree), domain, scenario, visibility, owner_id, created_at, updated_at
- ✅ 创建 `prompts` 表（Prompt 资产）
  - id, repo_id, title, content, main_prompt_path, context_md_path, config_yaml_path, summary, tags[], version, created_at, updated_at
- ✅ 创建 `prompt_metadata` 表（Agent 生成的元数据）
  - id, prompt_id, frontmatter (JSONB), ai_summary, classification_suggestions, created_at
- ✅ 启用 PostgreSQL LTree 扩展（用于多级路径查询）

### 8. RLS 权限策略
- ✅ 配置 `projects` 表的 RLS 策略（用户只能访问自己的项目）
- ✅ 配置 `prompts` 表的 RLS 策略（Private/Public 权限控制）
- ✅ 配置 `prompt_repos` 表的 RLS 策略
- ✅ 配置 `prompt_metadata` 表的 RLS 策略
- ⬜ 测试权限策略有效性

### 9. Supabase 客户端初始化
- ✅ 创建 Supabase 客户端工具 (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- ✅ 配置环境变量验证 (`lib/env.ts`)
- ✅ 创建数据库类型定义工具（基于 Supabase 生成）
- ⬜ 创建数据库迁移脚本模板

---

## 🟠 阶段三：CLI 工具开发（成本：中）

### 10. CLI 基础框架
- ✅ 实现 CLI 入口文件 (`packages/cygnus-cli/src/index.ts`)
- ✅ 实现 `cygnus sync` 命令框架
- ✅ 实现 `cygnus classify` 命令框架（Agent 自动分类）
- ✅ 实现命令行参数解析和帮助信息
- ✅ 实现配置文件读取（`.cygnusrc` 或 `cygnus.config.json`）

### 11. 项目扫描与发现
- ✅ 实现递归扫描 `/data` 目录逻辑 (`lib/scanner/project-scanner.ts`)
- ✅ 识别项目根目录（通过 `package.json` 或 `.git`）
- ✅ 定位每个项目的 `/docs/*.md` 文件
- ✅ 生成项目清单 JSON

### 12. Markdown 解析与任务提取
- ✅ 创建 MD 文件解析工具 (`lib/parser/markdown-parser.ts`)
- ✅ 实现任务列表解析（`- [ ]` 和 `- [x]`）
- ✅ 提取 PRD 中的核心功能定义
- ✅ 识别项目阶段（Demo、MVP、Production）
- ✅ 实现进度计算算法（SIPE Score）

### 13. AI Agent 分析层
- ✅ 创建 Agent 分析服务 (`lib/agent/analyzer.ts`)
- ✅ 实现非结构化转结构化逻辑（MD → SIPE JSON）
- ✅ 集成 LLM 调用（OpenAI、Qwen、Kimi）
- ✅ 实现任务优先级自动识别
- ✅ 实现健康度评分算法
- ⬜ 实现本地缓存机制（`.cygnus/state.json`）

### 14. CLI 数据同步
- ✅ 实现 Supabase 客户端配置（CLI 端）
- ✅ 实现数据上传逻辑（`upsert` 到 `project_sync_v1`）
- ✅ 实现批量同步机制
- ✅ 实现错误处理和重试逻辑
- ✅ 实现同步状态反馈（进度条、日志）

### 15. Prompt 文件系统扫描
- ✅ 实现 `/data/prompts` 目录扫描 (`lib/scanner/prompt-scanner.ts`)
- ✅ 识别 Prompt Repo 结构（Domain/Scenario/Asset）
- ✅ 读取 `main.prompt`, `context.md`, `config.yaml` 文件
- ✅ 生成 Prompt 清单

---

## 🔴 阶段四：Agent 自动分类与 Prompt 管理（成本：中高）

### 16. Agent 自动分类模块
- ✅ 实现语义提取逻辑 (`lib/agent/classifier.ts`)
- ✅ 实现自动打标功能（基于 LLM 分析）
- ✅ 实现 Frontmatter 自动注入（YAML 元数据生成）
- ⬜ 实现文件自动移动逻辑（按分类建议）
- ✅ 实现分类建议确认机制（交互式 CLI）

### 17. Prompt 元数据生成
- ✅ 实现 Agent 摘要生成（为每个 Prompt Repo）
- ✅ 实现场景综述生成（二级菜单汇总）
- ✅ 实现标签自动提取
- ✅ 实现版本管理逻辑
- ⬜ 实现 `.cygnus/index.json` 生成（全量索引）

### 18. Prompt 文件系统同步
- ✅ 实现 Prompt 数据同步到 Supabase (`lib/sync/prompt-sync.ts`)
- ✅ 实现 LTree 路径转换逻辑
- ✅ 实现批量同步机制
- ⬜ 实现冲突检测和解决

---

## 🟣 阶段五：Dashboard 核心功能（成本：中高）

### 19. 基础 UI 组件库
- ✅ 创建布局组件 (`components/layout/DashboardLayout.tsx`)
- ✅ 创建导航组件 (`components/navigation/Sidebar.tsx`, `TopNav.tsx`)
- ✅ 创建卡片组件 (`components/ui/card.tsx`)
- ✅ 创建进度条组件 (`components/ui/progress.tsx`)
- ✅ 创建加载状态组件 (`components/ui/skeleton.tsx`)
- ✅ 创建树形视图组件 (`components/ui/tree-view.tsx` - VS Code 风格)
- ✅ 创建搜索框组件 (`components/ui/command-palette.tsx` - Cmd+K)

### 20. SIPE 指挥部 (Commander Dashboard)
- ✅ 创建仪表板主页面 (`app/dashboard/page.tsx`)
- ✅ 实现项目列表展示（Grid 卡片布局）
- ✅ 实现进度条可视化
- ✅ 实现基础甘特图组件（使用 `recharts`）
- ✅ 实现并行脉动图（多项目活跃度分布）
- ✅ 实现项目筛选和搜索功能
- ✅ 实现项目详情页 (`app/dashboard/projects/[id]/page.tsx`)

### 21. PromptHub 基础界面
- ✅ 创建 PromptHub 主页面 (`app/prompts/page.tsx`)
- ✅ 实现双栏树状结构（左侧：分类树，右侧：内容区）
- ✅ 实现 Prompt 列表展示（GitLab 风格 Grid）
- ✅ 实现分类筛选功能（Domain/Scenario 下拉框 + 搜索）
- ✅ 实现 Prompt 详情页 (`app/prompts/[...id]/page.tsx` catch-all 路由)
- ✅ 实现代码高亮展示（使用 `react-markdown` + `rehype-highlight`）

### 22. PromptHub 多级菜单与汇总
- ✅ 实现递归树形菜单渲染 (`components/prompts/PromptTree.tsx` - 已集成到 TreeView)
- ✅ 实现 Agent 汇总信息弹窗（悬停显示场景综述，使用 HoverCard）
- ✅ 实现一级菜单统计（Domain 资产统计，显示在 TreeView 中）
- ✅ 实现二级菜单汇总（Scenario 场景综述，显示资产数量）
- ✅ 实现 Command+K 快速搜索（基于 Agent Summary）

### 23. PromptHub 编辑器集成
- ✅ 集成 Monaco Editor (`components/prompts/PromptEditor.tsx`)
- ✅ 实现浏览器内编辑功能
- ✅ 实现本地文件同步（通过 `/api/prompts/update` 同步回文件系统）
- ✅ 实现语法高亮和自动补全
- ✅ 实现保存和版本管理 UI

### 24. PromptHub 管理功能
- ✅ 实现 Prompt 创建表单（`/prompts/new` 页面，支持文件系统创建）
- ✅ 实现 Prompt 编辑功能（详情页编辑模式）
- ✅ 实现 Domain/Scenario CRUD（创建、重命名、删除分类目录）
- ✅ 重编排分类管理子页面（`/prompts/categories`，Domain/Scenario 分页维护）并在侧边栏新增入口（中文描述）
- ⬜ 实现版本控制 UI
- ⬜ 实现权限切换（Public/Private）
- ✅ 实现分享链接生成（`cygnus://` 协议 + Web 链接 + Markdown 格式）
- ✅ 实现导出功能（下载为 .md 文件）

---

## 🔵 阶段六：高级功能与集成（成本：高）

### 25. 实时数据同步
- ✅ 实现 Supabase Realtime 订阅 (`lib/realtime/subscriber.ts`)
- ✅ 实现 WebSocket 连接管理
- ✅ 实现自动刷新机制（项目进度、Prompt 更新）
- ✅ 实现离线状态检测

### 26. 文件监听服务（本地开发）
- ✅ 实现 Chokidar 文件监听 (`lib/watcher/file-watcher.ts`)
- ✅ 监听 `/data` 目录下的文件变更
- ✅ 实现变更事件处理（自动触发同步）
- ✅ 实现防抖和批量更新机制

### 27. MCP Skills Market
- ✅ 创建 MCP API 路由 (`app/api/mcp/route.ts`)
- ✅ 实现 MCP 协议规范响应
- ✅ 实现技能包查询接口（基于 PromptHub 数据）
- ⬜ 实现动态能力挂载逻辑
- ✅ 实现权限验证（Private Prompt 访问控制）

### 28. 3D 空间视图
- ⬜ 安装 Three.js 依赖 (`three`, `@react-three/fiber`, `@react-three/drei`)
- ⬜ 创建 3D 场景组件 (`components/3d/ProjectSphere.tsx`)
- ⬜ 实现能量球渲染逻辑（大小=活跃度，亮度=健康度）
- ⬜ 实现交互功能（旋转、缩放、点击跳转）
- ⬜ 集成到仪表板页面
- ⬜ 实现动画效果

### 29. 分享与协作功能
- ⬜ 实现 `cygnus://` 协议链接生成 (`lib/sharing/link-generator.ts`)
- ⬜ 实现分享链接解析和预览
- ⬜ 实现过期时间管理
- ⬜ 实现多用户协作支持（权限管理）
- ⬜ 实现导出功能（PDF、Markdown）

---

## 🟠 阶段七：优化与完善（成本：中高）

### 30. PWA 支持（渐进式 Web 应用）
- ✅ 创建 Web App Manifest (`public/manifest.json`)
- ✅ 配置 Service Worker (`public/sw.js`)
- ✅ 实现离线缓存策略
- ✅ 添加应用图标和启动画面（艺术风格）
- ⬜ 实现推送通知支持
- ✅ 添加"添加到主屏幕"提示
- ✅ 优化离线体验（离线页面、缓存策略）

### 31. 性能优化
- ⬜ 实现代码分割和懒加载（Next.js 动态导入）
- ⬜ 优化图片和资源加载
- ⬜ 实现缓存策略（SWR 或 React Query）
- ⬜ 优化数据库查询性能（索引、LTree 查询优化）
- ⬜ 实现虚拟滚动（长列表优化）

### 32. 用户体验优化
- ⬜ 实现响应式设计（移动端适配）
- ⬜ 实现暗色模式切换（完整主题系统）
- ⬜ 实现动画和过渡效果（Framer Motion）
- ✅ 实现错误处理和用户提示（Toast 通知）
- ✅ 实现加载状态优化（Skeleton 组件）

### 33. CLI 工具完善
- ⬜ 实现 CLI 配置向导（首次运行）
- ⬜ 实现 CLI 日志系统（彩色输出、日志文件）
- ⬜ 实现 CLI 错误恢复机制
- ⬜ 实现 CLI 性能监控
- ⬜ 编写 CLI 使用文档

### 34. 测试与质量保证
- ⬜ 编写单元测试（Jest + React Testing Library）
- ⬜ 编写集成测试（CLI + Dashboard）
- ⬜ 编写 E2E 测试（Playwright）
- ⬜ 实现 CI/CD 流程（GitHub Actions）
- ⬜ 代码覆盖率报告

### 35. 文档与部署
- ⬜ 更新项目 README.md
- ⬜ 编写用户使用指南
- ⬜ 编写开发者文档
- ⬜ 配置 Vercel 部署
- ⬜ 设置生产环境变量
- ⬜ 配置域名和 SSL
- ⬜ 实现监控和日志（Sentry 或类似）

---

## 📊 当前进度统计

- **阶段一**：4/4 完成 ✅
- **阶段二**：4.5/5 完成（数据库表、RLS 策略、客户端工具已完成，文档和迁移模板待补充）
- **阶段三**：6/6 完成 ✅
- **阶段四**：2.5/3 完成（核心功能已完成，文件移动和索引生成待实现）
- **阶段五**：6/6 完成 ✅（所有核心功能已完成）
- **阶段七（PWA）**：5/7 完成（基础 PWA 功能已完成，推送通知待实现）
- **阶段六**：5/5 完成 ✅
- **阶段七**：0/6 完成（新增 PWA 支持任务）

**总体进度**：0/34 任务完成 (0%)

---

## 🎯 下一步行动

从 **阶段一：基础设置与配置** 开始，逐步推进。

### 优先级说明
1. **阶段一、二**：基础设施，必须优先完成
2. **阶段三**：CLI 工具是核心，需要尽早实现
3. **阶段四**：Agent 分类是差异化功能，成本较高但价值大
4. **阶段五**：Dashboard 是用户界面，依赖前面的数据层
5. **阶段六、七**：高级功能和优化，可以并行开发

---

## 📝 关键设计决策

### 文件系统即真相 (Filesystem as Truth)
- Prompt 存储在 `/data/prompts` 目录，数据库仅作为索引和元数据
- CLI 工具负责文件系统和数据库的双向同步

### Agent 驱动
- 使用 LLM 进行自动分类、摘要生成、SIPE JSON 转换
- 减少手动维护成本，提高智能化水平

### LTree 路径管理
- 使用 PostgreSQL LTree 扩展管理多级分类路径
- 支持高效的树形查询和汇总

### 双端架构
- CLI 工具：本地执行，文件系统感知
- Dashboard：云端/本地展示，实时同步
