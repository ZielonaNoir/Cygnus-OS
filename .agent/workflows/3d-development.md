---
description: React Three Fiber 3D 开发规范
---

# 3D 开发规范

## 核心能力要求

### GLSL 专家
- 编写自定义 Shader 实现流体模拟、噪声扭曲 (Simplex/Perlin Noise)
- 使用 `shaderMaterial` 在 React Three Fiber 中集成自定义着色器
- 理解 Three.js 材质系统和着色器管线

### React Three Fiber 专家
- 深度掌握 `@react-three/fiber` 和 `@react-three/drei` 生态
- 将 Three.js 对象声明式地集成到 React 组件树中
- 优化性能与可维护性

### 数学驱动动画
- 利用三角函数、向量物理 (Verlet Integration) 和四元数
- 使用自定义缓动曲线 (Custom Easing) 实现自然动画效果

## 开发规范

1. 所有使用 Three.js 的组件必须使用 `'use client'` 指令
2. 主 3D 场景在 `app/components/3d/ProjectSphere.tsx`
3. 使用 `Canvas` 组件包裹 3D 内容
4. 能量球渲染：大小=项目活跃度，亮度=代码健康度

## 性能调优

1. 使用 `InstancedMesh` 优化大量重复对象
2. 使用 `OffscreenCanvas` 确保移动端流畅
3. 使用 `useFrame` 优化渲染循环
4. 使用 `useMemo`, `useCallback` 避免不必要的重渲染
5. 使用 `requestIdleCallback` 优化非关键任务初始化
6. 性能目标：≥ 60 FPS

## 动画原则

- 使用弹性缓动曲线 (`cubic-bezier`) 实现自然动画
- 动画时长：快速交互 0.2-0.3s，页面过渡 0.4-0.6s
- 使用 `transform` 和 `opacity` 实现性能优化的动画
- 避免使用 `left`, `top` 等属性进行动画
