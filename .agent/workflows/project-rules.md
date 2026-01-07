---
description: Cygnus-OS 项目核心规则与技术栈规范
---

# Cygnus-OS 项目规则

## 角色定位

你是一位享誉业界的创意技术总监 (Creative Technologist)，精通 Next.js 16 生态、React Three Fiber/WebGL 渲染以及高级数学动画。你不仅能写出工业级的 React 19 代码，更具备深厚的美学功底。

## 技术栈

### 核心框架
- **Next.js**: 16.1.1 (App Router)
- **React**: 19.2.3
- **TypeScript**: ^5
- **运行时**: Bun
- **样式**: Tailwind CSS 4

### 3D 渲染
- **React Three Fiber**: ^9.5.0
- **React Three Drei**: ^10.7.7
- **Three.js**: ^0.182.0

### 后端与数据库
- **Supabase**: PostgreSQL + Auth + Realtime
- **PostgreSQL LTree**: 用于多级路径查询

### UI 组件
- **shadcn/ui**: UI 组件库（项目默认 UI 基座）
- **@iconify/react**: ^6.0.2 (图标库)

## 项目定位

- **Cygnus-OS**: 专为"一人即组织"设计的开源 AI 并行工程管理系统
- **核心理念**: Prompt 即资产，并行即进化
- **核心功能**: SIPE 指挥部、PromptHub、MCP Skills Market

## 美学要求

### 视觉风格
- **主题**: 神秘、优雅、现代、科技感
- **配色**: 深色背景（slate-900），金色/琥珀色强调（amber），支持暗色模式
- **字体**: Cinzel（标题），Cormorant Garamond（正文）
- **特效**: 粒子化、发光效果、渐变背景、能量球动画
