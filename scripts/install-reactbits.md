# ReactBits 组件安装脚本说明

由于 `jsrepo` 在 Windows 上存在依赖问题，请按照以下步骤手动安装组件。

## 🚀 快速安装（使用 WSL，如果可用）

```bash
# 1. 打开 WSL
wsl

# 2. 进入项目目录
cd /mnt/c/Users/CygneNoir/Desktop/Cygnus-OS/cygnus-os

# 3. 安装 jsrepo
npm install -g jsrepo

# 4. 初始化项目
npx jsrepo init https://reactbits.dev/ts/tailwind/

# 5. 安装所有推荐组件
npx jsrepo add https://reactbits.dev/ts/tailwind/Backgrounds/Aurora
npx jsrepo add https://reactbits.dev/ts/tailwind/Backgrounds/Hyperspeed
npx jsrepo add https://reactbits.dev/ts/tailwind/TextAnimations/ShinyText
npx jsrepo add https://reactbits.dev/ts/tailwind/TextAnimations/SplitText
npx jsrepo add https://reactbits.dev/ts/tailwind/Animations/Antigravity
npx jsrepo add https://reactbits.dev/ts/tailwind/Animations/AnimatedContent
npx jsrepo add https://reactbits.dev/ts/tailwind/Animations/FadeContent
npx jsrepo add https://reactbits.dev/ts/tailwind/TextAnimations/ASCIIText
npx jsrepo add https://reactbits.dev/ts/tailwind/TextAnimations/BlurText
npx jsrepo add https://reactbits.dev/ts/tailwind/Components/AnimatedList
npx jsrepo add https://reactbits.dev/ts/tailwind/Components/Stack
```

## 📥 手动安装（从 GitHub）

1. 访问 ReactBits GitHub: https://github.com/davidhdev/reactbits
2. 查找组件代码（通常在 `packages/` 目录）
3. 复制到 `app/components/reactbits/`
4. 调整导入路径

## 📋 组件安装清单

### 高优先级
- [ ] Aurora
- [ ] Antigravity
- [ ] ShinyText
- [ ] Hyperspeed

### 中优先级
- [ ] AnimatedContent
- [ ] AnimatedList
- [ ] SplitText
- [ ] FadeContent
- [ ] ASCIIText
- [ ] BlurText
- [ ] Stack

