# PWA 图标设置指南

## 📋 当前状态

- ✅ `public/icons/` 目录已创建
- ⚠️ 图标文件需要添加

## 🎨 图标要求

### 尺寸列表
需要以下尺寸的 PNG 图标：
- `icon-72x72.png` - 72×72 像素
- `icon-96x96.png` - 96×96 像素
- `icon-128x128.png` - 128×128 像素
- `icon-144x144.png` - 144×144 像素
- `icon-152x152.png` - 152×152 像素
- `icon-192x192.png` - 192×192 像素
- `icon-384x384.png` - 384×384 像素
- `icon-512x512.png` - 512×512 像素

### 设计规范

根据 Cygnus-OS 的艺术风格：

1. **背景色**: 深色（`slate-900` - `#0f172a`）
2. **图标色**: 琥珀色（`amber-500` - `#f59e0b`）
3. **风格**: 简洁、现代、科技感
4. **支持 maskable**: 图标需要支持可遮罩（maskable）模式

### Maskable 图标要求

- 图标内容应位于安全区域内（中心 80% 区域）
- 边缘 10% 区域用于系统遮罩
- 确保图标在圆形、方形、圆角方形遮罩下都清晰可见

## 🛠️ 生成图标的方法

### 方法一：使用在线工具

1. **PWA Asset Generator**
   - 访问：https://www.pwabuilder.com/imageGenerator
   - 上传 512×512 的主图标
   - 自动生成所有尺寸

2. **RealFaviconGenerator**
   - 访问：https://realfavicongenerator.net/
   - 上传图标并配置
   - 生成所有尺寸和格式

### 方法二：使用命令行工具

```bash
# 安装 sharp（如果还没有）
bun add -d sharp

# 使用脚本生成（需要创建脚本）
```

### 方法三：使用设计工具

1. 在 Figma、Adobe Illustrator 等工具中设计
2. 导出为 512×512 PNG
3. 使用工具批量生成其他尺寸

## 📝 快速解决方案（临时）

如果暂时没有图标，可以：

1. **使用 favicon.ico**
   - 当前已在 manifest.json 中添加了 favicon.ico 作为备用
   - 浏览器会使用 favicon.ico 作为临时图标

2. **创建简单的占位图标**
   - 使用纯色背景 + 文字
   - 或使用 SVG 转换为 PNG

## 🎯 推荐图标设计

### 概念
- **天鹅座（Cygnus）**：天鹅星座的抽象表示
- **OS 标识**：操作系统风格的简洁图标
- **科技感**：线条、几何图形、发光效果

### 示例设计思路
1. 深色背景上的琥珀色天鹅轮廓
2. 几何化的 "C" 字母（Cygnus）
3. 抽象的能量球或粒子效果
4. 简洁的线条艺术风格

## 📂 文件放置

将所有生成的图标文件放置在：
```
public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

## ✅ 验证

图标添加后，验证步骤：

1. 检查文件是否存在
2. 访问 `http://localhost:3000/manifest.json` 确认配置
3. 在浏览器开发者工具中检查 Application > Manifest
4. 测试 PWA 安装功能

## 🔗 相关资源

- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
- [Maskable Icon Guidelines](https://web.dev/maskable-icon/)
- [PWA Manifest Icons](https://web.dev/add-manifest/#icons)

