# 进度计算算法说明

## 概述

Cygnus-OS 使用两种方式计算项目进度：

1. **基础算法**（备用方案）：基于任务完成率的简单计算
2. **AI 增强算法**（推荐）：使用 LLM（Kimi/OpenAI/Qwen）智能分析

---

## 基础算法（Fallback）

当 LLM 调用失败时，使用基础算法计算进度。

### 计算公式

```typescript
// 1. 基础进度 = 已完成任务数 / 总任务数 * 100
const baseProgress = (completedTasks / totalTasks) * 100;

// 2. 加权进度（考虑任务优先级）
const priorityWeights = {
  urgent: 4,   // 紧急任务权重最高
  high: 2,     // 高优先级
  medium: 1,   // 中等优先级
  low: 0.5     // 低优先级
};

// 计算加权完成度
let weightedCompleted = 0;
let weightedTotal = 0;

tasks.forEach(task => {
  const weight = priorityWeights[task.priority];
  weightedTotal += weight;
  if (task.status === 'completed') {
    weightedCompleted += weight;
  }
});

const weightedProgress = (weightedCompleted / weightedTotal) * 100;

// 3. 最终进度 = 基础进度 * 60% + 加权进度 * 40%
const finalProgress = baseProgress * 0.6 + weightedProgress * 0.4;
```

### 健康度评分

```typescript
// 健康度 = 进度分 + 优先级分 + 需求覆盖分 + 阶段匹配分
const healthScore = 
  progressScore * 0.4 +      // 进度完成度 40%
  priorityScore * 0.2 +      // 任务优先级分布 20%
  requirementCoverage * 0.2 + // 需求覆盖度 20%
  stageScore * 0.2;           // 项目阶段匹配度 20%
```

---

## AI 增强算法（推荐）

使用 LLM（Kimi API）进行智能分析，考虑更多因素：

### Prompt 设计

AI 会收到以下信息：
- 项目名称和阶段
- 完整任务列表（含状态和优先级）
- 需求列表

### AI 分析规则

1. **进度计算**：
   - 基础：已完成任务数 / 总任务数
   - 调整：考虑任务重要性和复杂度
   - 关键任务未完成时，即使完成很多次要任务，进度也应该较低
   - 优先级权重：urgent (4x) > high (2x) > medium (1x) > low (0.5x)

2. **健康度评分**：
   - 进度完成度：40%
   - 任务优先级分布：20%（urgent 任务应该尽快完成）
   - 需求覆盖度：20%（已完成任务是否覆盖主要需求）
   - 项目阶段匹配度：20%（当前进度是否匹配项目阶段）

3. **任务优先级识别**：
   - 如果任务文本中没有明确优先级，AI 会智能判断：
     - **urgent**: 阻塞性任务、关键路径任务、紧急修复
     - **high**: 核心功能、重要特性
     - **medium**: 常规功能、优化任务
     - **low**: 锦上添花、文档、重构

### 使用 Kimi API

在 `.env.local` 中配置：

```env
LLM_PROVIDER=kimi
KIMI_API_KEY=your_kimi_api_key_here
KIMI_API_URL=https://api.moonshot.cn/v1
LLM_MODEL=moonshot-v1-8k
```

或者在 CLI 项目的 `.env` 中配置（CLI 工具会读取环境变量）。

---

## 算法选择

1. **优先使用 AI 算法**：如果配置了 LLM API Key，会自动使用 AI 分析
2. **降级到基础算法**：如果 LLM 调用失败，自动使用基础算法
3. **手动指定**：可以通过配置强制使用基础算法（不配置 LLM）

---

## 示例

### 场景 1：简单项目

```
任务列表：
- [x] 任务1 (medium)
- [x] 任务2 (medium)
- [ ] 任务3 (medium)

基础进度 = 2/3 * 100 = 66.67%
加权进度 = (1+1)/(1+1+1) * 100 = 66.67%
最终进度 = 66.67%
```

### 场景 2：有优先级差异

```
任务列表：
- [x] 任务1 (low)
- [x] 任务2 (low)
- [ ] 任务3 (urgent)  ← 关键任务未完成

基础进度 = 2/3 * 100 = 66.67%
加权进度 = (0.5+0.5)/(0.5+0.5+4) * 100 = 20%
最终进度 = 66.67 * 0.6 + 20 * 0.4 = 48%

AI 分析可能会进一步降低进度，因为关键任务未完成。
```

---

## 配置说明

### 环境变量（.env.local）

```env
# 使用 Kimi
LLM_PROVIDER=kimi
KIMI_API_KEY=sk-xxx
KIMI_API_URL=https://api.moonshot.cn/v1
LLM_MODEL=moonshot-v1-8k

# 或使用 OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxx

# 或使用 Qwen
LLM_PROVIDER=qwen
QWEN_API_KEY=xxx
QWEN_API_URL=http://localhost:8000/v1
```

### 配置文件（.cygnusrc）

```json
{
  "llm": {
    "provider": "kimi",
    "apiKey": "sk-xxx",
    "apiUrl": "https://api.moonshot.cn/v1",
    "model": "moonshot-v1-8k"
  }
}
```

---

## 总结

- **基础算法**：快速、无需 API，但相对简单
- **AI 算法**：更智能、考虑更多因素，需要 API Key
- **自动降级**：AI 失败时自动使用基础算法，确保可用性

