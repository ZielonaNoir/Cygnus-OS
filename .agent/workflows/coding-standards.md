---
description: TypeScript 和 React 编码规范
---

# 编码规范

## TypeScript 规范

1. 严格类型检查，避免使用 `any`
2. 为所有组件、函数、接口提供完整的类型定义
3. 使用类型推断，但关键类型必须显式声明

## React 组件规范

1. 使用函数式组件和 Hooks
2. 组件命名使用 PascalCase
3. 文件命名使用 PascalCase（组件文件）或 kebab-case（工具文件）
4. 所有组件必须使用 TypeScript 接口定义 Props
5. 所有使用 Three.js 的组件必须使用 `'use client'` 指令

## 命名约定

- **组件**: PascalCase (`TarotCardDisplay.tsx`)
- **工具函数**: camelCase (`getCardUrl.ts`)
- **常量**: UPPER_SNAKE_CASE (`CARD_BACK_URL`)
- **类型/接口**: PascalCase (`CardData`, `DrawResult`)

## 性能最佳实践

1. 使用 `useMemo` 缓存计算结果
2. 使用 `useCallback` 缓存函数引用
3. 使用 `Suspense` 包裹异步组件
4. 3D 场景使用 `useFrame` 优化渲染循环
5. 避免在渲染函数中创建新对象

## 代码质量要求

1. **类型安全**: 所有代码必须有完整的 TypeScript 类型
2. **错误处理**: API 调用、异步操作必须有错误处理
3. **性能优化**: 避免不必要的重渲染和计算
4. **可访问性**: 提供适当的 ARIA 标签和键盘导航
5. **响应式设计**: 确保在不同屏幕尺寸下正常工作
