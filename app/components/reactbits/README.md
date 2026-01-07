# ReactBits 组件集成

由于 `jsrepo` 在 Windows 上存在依赖问题，我们采用手动集成方式。

## 📦 安装方式

### 方式一：从 GitHub 手动获取（推荐）

1. 访问 ReactBits GitHub 仓库：https://github.com/davidhdev/reactbits
2. 找到对应的组件文件（通常在 `packages/` 目录下）
3. 复制组件代码到 `app/components/reactbits/` 目录
4. 根据项目需求调整样式和配置

### 方式二：使用 WSL（如果可用）

```bash
# 在 WSL 中运行
npx jsrepo add https://reactbits.dev/ts/tailwind/Backgrounds/Aurora
# ... 其他组件
```

### 方式三：手动实现（基于设计理念）

根据 ReactBits 的设计理念，手动实现组件的基础版本。

## 🎨 组件列表

### 高优先级组件

- [ ] Aurora - 极光背景
- [ ] Antigravity - 反重力粒子
- [ ] ShinyText - 闪亮文本
- [ ] Hyperspeed - 超高速背景

### 中优先级组件

- [ ] AnimatedContent - 动画内容
- [ ] AnimatedList - 动画列表
- [ ] SplitText - 分割文本
- [ ] FadeContent - 渐隐内容
- [ ] ASCIIText - ASCII 文本
- [ ] BlurText - 模糊文本
- [ ] Stack - 堆叠布局

## 🔧 集成步骤

1. 将组件文件复制到对应目录
2. 调整导入路径和类型定义
3. 适配 Cygnus-OS 主题（深色 + 琥珀色）
4. 测试组件功能
5. 更新文档

## 📝 主题定制

所有组件需要适配以下主题配置：

- **背景色**: `slate-900` / `slate-950`
- **强调色**: `amber-500` / `amber-600`
- **文字色**: `slate-100` / `slate-200`
- **边框**: `border-amber-500/20`

