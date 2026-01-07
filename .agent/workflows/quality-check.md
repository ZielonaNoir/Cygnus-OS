---
description: 代码质量检查工作流
---

# 代码质量检查

**每完成一个功能后，必须执行以下检查：**

## 步骤

1. 运行 lint 检查代码规范
// turbo
```bash
bun run lint
```

2. 运行 TypeScript 类型检查
// turbo
```bash
bunx tsc --noEmit
```

3. 确保所有错误和警告都已修复

4. 进行第二次检查确认修复
// turbo
```bash
bun run lint
```

5. 再次运行类型检查
// turbo
```bash
bunx tsc --noEmit
```

## 代码审查检查点

- [ ] TypeScript 类型完整且正确
- [ ] 没有控制台错误或警告
- [ ] 性能优化已应用（useMemo, useCallback）
- [ ] 错误处理已实现
- [ ] 代码已格式化（Prettier/ESLint）
- [ ] 组件可复用且模块化

## 提交前确认

- 使用语义化提交信息：`feat:`, `fix:`, `refactor:`, `docs:`, `style:`
- 提交前必须通过 lint 和 typecheck 检查
- 重要功能需要更新相关文档
