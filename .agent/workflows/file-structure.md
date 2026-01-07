---
description: 项目文件结构与目录约定
---

# 文件结构

```
app/
  components/          # React 组件
    layout/           # 布局组件
    navigation/       # 导航组件
    ui/               # 基础 UI 组件（shadcn/ui 封装）
    prompts/          # PromptHub 相关组件
    3d/               # 3D 场景组件
  lib/                # 工具函数和常量
    supabase/         # Supabase 客户端
    parser/           # Markdown 解析器
    scanner/          # 文件扫描器
    agent/            # AI Agent 分析
    sync/             # 数据同步
    validators/       # 数据验证
    watcher/          # 文件监听
    realtime/         # 实时订阅
    sharing/          # 分享功能
  api/                # Next.js API Routes
    mcp/              # MCP Skills Market
    projects/         # 项目相关 API
  dashboard/          # SIPE 指挥部页面
  prompts/            # PromptHub 页面
  styles/             # 全局样式
packages/
  cygnus-cli/         # CLI 工具独立包
    src/
      index.ts        # CLI 入口
      commands/        # 命令实现
      lib/            # CLI 工具函数
public/
  images/              # 静态资源
types/                 # TypeScript 类型定义
  sipe.ts             # SIPE JSON 标准
  database.ts         # 数据库类型
data/                  # 本地数据目录（不提交到 Git）
  prompts/             # Prompt 文件系统存储
    Coding/           # Domain 一级分类
      Frontend/        # Scenario 二级分类
        Nuxt4-Expert/ # Asset Prompt Repo
docs/                  # 项目文档
scripts/               # 构建和工具脚本
```

## Prompt 存储结构

- 目录结构：`Domain/Scenario/Asset/`
- 每个 Prompt Repo 包含：
  - `main.prompt`: 核心指令
  - `context.md`: 背景知识/约束
  - `config.yaml`: 元数据

## 配置文件

- `.cygnusrc` 或 `cygnus.config.json`: CLI 配置文件
- `.cygnus/state.json`: 本地缓存状态
- `.cygnus/index.json`: Prompt 全量索引
