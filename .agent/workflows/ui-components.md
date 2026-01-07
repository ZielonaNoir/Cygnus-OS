---
description: shadcn/ui 组件与样式规范
---

# UI 组件规范

## shadcn/ui 约定

1. 基础控件（Button、Card、Input、Select、Progress、Dialog、Toast）均来源于 `shadcn/ui`
2. 所有组件在 `app/components/ui/` 目录下做语义化二次封装
3. 所有组件必须支持暗色模式，遵循项目配色（slate/amber）
4. 禁止直接在页面中使用第三方库的原始未封装组件
5. **优先使用现成组件**：通过 shadcn MCP/registry 搜索并添加现成组件

## 图标规范

1. **统一使用 Iconify**：所有图标必须使用 `@iconify/react` 库
2. 通过 `app/components/Icon.tsx` 组件使用
3. **禁止使用表情符号**：不得在代码中直接使用 emoji
4. 优先使用 Material Design Icons (mdi) 图标集
5. 图标库地址：https://icon-sets.iconify.design/

**使用示例：**
```tsx
import { Icon } from './components/Icon';
<Icon icon="mdi:crystal-ball" width="1em" height="1em" />
```

## 样式规范

1. 优先使用 Tailwind CSS 类名
2. 复杂动画使用 CSS Keyframes（定义在 `globals.css`）
3. 3D 效果使用 Three.js Shader 或 CSS 3D Transform
4. 响应式设计：移动端优先

## Light/Dark Mode 规则

### 主题 Token
- 前景：`text-foreground`（浅色模式=slate-900，深色模式=slate-100）
- 次级前景：`text-muted-foreground`
- 背景：`bg-background`
- 卡片背景：`bg-card/50` + `backdrop-blur-sm`
- 边框：`border-border/50`
- 主色：`text-primary`/`bg-primary`（amber，默认 `#f59e0b`）

### 组件适配要求
- Button `outline`/`ghost` 变体必须包含 `text-foreground`
- 图标颜色使用 `currentColor`
- 禁止写死深色背景/文字，一律使用语义化 token 类名
