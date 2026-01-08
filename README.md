# Cygnus-OS

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

**专为"一人即组织"设计的开源 AI 并行工程管理系统**

[⭐ GitHub](https://github.com/ZielonaNoir/Cygnus-OS) • [🎥 介绍视频](https://drive.google.com/file/d/1gjJjI844RpdTl3ZCMfnzABazNOxhmkDB/view?usp=sharing) • [📖 完整文档](./project_main.md) • [🚀 快速开始](#快速开始) • [💬 讨论](https://github.com/ZielonaNoir/Cygnus-OS/discussions) • [🐛 报告问题](https://github.com/ZielonaNoir/Cygnus-OS/issues)

[English](./README_EN.md) | 中文

</div>

---

## ✨ 核心特性

> 📹 **快速了解**：观看 [项目介绍视频](https://drive.google.com/file/d/1gjJjI844RpdTl3ZCMfnzABazNOxhmkDB/view?usp=sharing) 快速了解 Cygnus-OS 的核心功能和设计理念

### 📱 PWA 全端支持

**Cygnus-OS 是一个渐进式 Web 应用（PWA）**，支持网页、手机、桌面全端使用：

- 🌐 **网页端**：现代浏览器直接访问，响应式设计
- 📱 **移动端**：添加到主屏幕，离线访问，推送通知
- 💻 **桌面端**：独立窗口运行，系统集成，多窗口支持

[详细 PWA 说明](./project_main.md#pwa-全端支持)

### 🎯 SIPE 指挥部
- 智能文档识别，自动解析 Markdown PRD
- 实时甘特图与 3D 能量球可视化
- 多项目并行进度监控

### 📚 PromptHub
- Prompt 仓库化管理（Domain/Scenario/Asset 三级分类）
- AI 自动分类与摘要生成
- Monaco Editor 在线编辑
- 版本控制与分享链接

### 🔌 MCP Skills Market
- MCP 协议集成
- 动态技能挂载（Cursor/Claude）
- 公开技能市场

---

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0.0
- Bun >= 1.0.0 (推荐) 或 Node.js
- PostgreSQL >= 14.0 (如果使用私有化部署)

### 安装

```bash
# 克隆仓库
git clone https://github.com/ZielonaNoir/Cygnus-OS.git
cd cygnus-os

# 安装依赖
bun install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 Supabase 配置

# 启动开发服务器
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 同步数据

```bash
# 同步项目到数据库
bun run sync --data-dir ./data
```

---

## 🏗️ 技术架构

- **前端**: Next.js 16.1.1 (App Router) + React 19.2.3 + TypeScript 5
- **UI**: Tailwind CSS 4 + shadcn/ui + Framer Motion
- **3D**: React Three Fiber + Three.js
- **后端**: Supabase (PostgreSQL + Auth + Realtime)
- **CLI**: Node.js + Chokidar + AI Agent
- **编辑器**: Monaco Editor

详细技术栈请查看 [完整文档](./project_main.md#技术架构)

---

## 📁 项目结构

```
cygnus-os/
├── app/                    # Next.js 应用
│   ├── components/        # React 组件
│   ├── lib/               # 工具函数
│   └── api/               # API Routes
├── packages/
│   └── cygnus-cli/        # CLI 工具
├── data/                  # 数据目录（可用 Obsidian 打开）
│   └── prompts/          # Prompt 存储
├── types/                 # TypeScript 类型
├── docs/                  # 项目文档
└── supabase/             # 数据库迁移
```

---

## 🔑 核心概念

### 文件系统即真相

所有数据存储在本地文件系统（`/data` 目录），可以直接用 **Obsidian** 打开编辑，CLI 工具负责同步到数据库。

### Prompt 即资产

Prompt 按照 `Domain/Scenario/Asset` 三级结构管理，支持 AI 自动分类、版本控制和分享。

### SIPE 标准

统一的工程进度标准（SIPE JSON），通过解析 Markdown 任务列表自动计算项目进度。

---

## 🎨 界面预览

### 📹 介绍视频

**项目介绍视频**：观看完整的产品演示和功能说明

👉 [点击观看介绍视频](https://drive.google.com/file/d/1gjJjI844RpdTl3ZCMfnzABazNOxhmkDB/view?usp=sharing)

### 截图

[待添加项目截图]

---

## 📖 文档

- [完整项目文档](./project_main.md) - 包含团队信息、技术架构、部署指南、PWA 说明等
- [PRD](./docs/PRD.md) - 产品需求文档
- [开发任务清单](./docs/TODO.md) - 完整的开发阶段和进度跟踪
- [开发规范](./.cursorrules) - 代码规范与最佳实践

---

## 🛠️ 私有化部署

Cygnus-OS 支持完全私有化部署，所有数据存储在您自己的服务器上。

详细部署指南请查看 [完整文档 - 私有化部署章节](./project_main.md#私有化部署)

---

## 🤝 贡献

我们欢迎所有形式的贡献！

- 🐛 [报告问题](https://github.com/ZielonaNoir/Cygnus-OS/issues)
- 💡 [提出功能建议](https://github.com/ZielonaNoir/Cygnus-OS/discussions)
- 🔧 [提交 Pull Request](https://github.com/ZielonaNoir/Cygnus-OS/pulls)
- 📖 [改进文档](./docs/)

详细贡献指南请查看 [完整文档 - 贡献指南章节](./project_main.md#贡献指南)

---

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

---

## 👥 团队

- **Noir** - 全栈开发、架构设计
- **Luo** - 路演、产品设计

联系方式：a406113864@hotmail.com

---

## 🌟 致谢

感谢以下优秀的开源项目：

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

---

<div align="center">

**Cygnus-OS** - Prompt 即资产，并行即进化

[⭐ Star on GitHub](https://github.com/ZielonaNoir/Cygnus-OS) • [📖 完整文档](./project_main.md) • [💬 讨论](https://github.com/ZielonaNoir/Cygnus-OS/discussions)

Made with ❤️ by [ZielonaNoir](https://github.com/ZielonaNoir)

</div>
