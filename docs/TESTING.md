# Cygnus-OS 测试文档

本文档列出了所有需要测试的功能和测试用例。

## 目录

- [环境准备](#环境准备)
- [阶段一：基础设置与配置](#阶段一基础设置与配置)
- [阶段二：数据模型与标准定义](#阶段二数据模型与标准定义)
- [阶段三：CLI 工具开发](#阶段三cli-工具开发)
- [集成测试](#集成测试)
- [性能测试](#性能测试)

---

## 环境准备

### 前置条件

1. **Node.js/Bun 环境**
   ```bash
   bun --version  # 或 node --version
   ```

2. **Supabase 项目**
   - 创建 Supabase 项目
   - 获取 Project URL 和 Service Role Key
   - 确保数据库迁移已执行

3. **环境变量配置**
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Kimi API (可选，用于 AI 分析)
   KIMI_API_KEY=your_kimi_api_key
   KIMI_API_URL=https://api.moonshot.cn/v1
   LLM_MODEL=moonshot-v1-8k
   ```

4. **测试数据准备**
   ```bash
   # 创建测试项目结构
   mkdir -p data/test-project/docs
   # 创建测试 Markdown 文件
   ```

---

## 阶段一：基础设置与配置

### 1.1 项目元数据

**测试项：**
- [ ] 检查 `app/layout.tsx` 中的 title 是否为 "Cygnus-OS"
- [ ] 检查 description 是否正确
- [ ] 检查语言设置是否为 `zh-CN`

**测试命令：**
```bash
# 启动开发服务器
bun run dev
# 访问 http://localhost:3000，检查页面标题
```

### 1.2 Tailwind CSS 主题变量

**测试项：**
- [ ] 检查暗色模式 CSS 变量是否正确定义
- [ ] 检查主题切换是否正常工作
- [ ] 检查颜色变量（slate-900, amber-500）是否可用

**测试方法：**
- 在浏览器中切换暗色/亮色模式
- 检查控制台是否有 CSS 错误

### 1.3 项目路由结构

**测试项：**
- [ ] `/dashboard` 页面可访问
- [ ] `/prompts` 页面可访问
- [ ] `/api/mcp` API 路由可访问
- [ ] `/api/projects/sync` API 路由可访问

**测试命令：**
```bash
bun run dev
# 访问以下 URL：
# http://localhost:3000/dashboard
# http://localhost:3000/prompts
# http://localhost:3000/api/mcp
# http://localhost:3000/api/projects/sync
```

### 1.4 环境变量管理

**测试项：**
- [ ] `app/lib/env.ts` 正确读取环境变量
- [ ] 缺少必需环境变量时显示警告（开发模式）
- [ ] 生产模式缺少环境变量时抛出错误

**测试方法：**
```typescript
// 在代码中测试
import { env } from '@lib/env';
console.log(env.supabase.url);
```

### 1.5 TypeScript 路径别名

**测试项：**
- [ ] `@/` 别名正常工作
- [ ] `@lib/` 别名正常工作
- [ ] `@components/` 别名正常工作
- [ ] `@types/` 别名正常工作

**测试命令：**
```bash
bunx tsc --noEmit
```

### 1.6 Prettier 格式化

**测试项：**
- [ ] `bun run format` 命令正常工作
- [ ] `bun run format:check` 命令正常工作
- [ ] 代码格式化符合配置规则

**测试命令：**
```bash
bun run format:check
bun run format
bun run format:check  # 应该全部通过
```

---

## 阶段二：数据模型与标准定义

### 2.1 SIPE JSON 标准

**测试项：**
- [ ] `types/sipe.ts` 类型定义正确
- [ ] `validateSIPEJSON` 函数正确验证数据
- [ ] `parseSIPEJSON` 函数正确解析数据
- [ ] 验证器能识别无效数据

**测试用例：**
```typescript
// 测试有效数据
const validSIPE = {
  project_name: "Test Project",
  last_sync: "2026-01-07T12:00:00Z",
  progress: 50,
  tasks: [{ id: 1, text: "Task 1", status: "completed", priority: "high" }],
  requirements: ["Req 1"],
  health_score: 75
};
// 应该通过验证

// 测试无效数据
const invalidSIPE = {
  project_name: "Test",
  progress: 150  // 超出范围
};
// 应该验证失败
```

### 2.2 Supabase 数据库表

**测试项：**
- [ ] `projects` 表已创建
- [ ] `tasks` 表已创建
- [ ] `project_sync_v1` 表已创建
- [ ] `prompt_repos` 表已创建
- [ ] `prompts` 表已创建
- [ ] `prompt_metadata` 表已创建
- [ ] LTree 扩展已启用

**测试方法：**
```sql
-- 在 Supabase SQL Editor 中执行
SELECT * FROM projects LIMIT 1;
SELECT * FROM tasks LIMIT 1;
SELECT * FROM project_sync_v1 LIMIT 1;
SELECT * FROM prompt_repos LIMIT 1;
SELECT * FROM prompts LIMIT 1;
SELECT * FROM prompt_metadata LIMIT 1;
```

### 2.3 RLS 权限策略

**测试项：**
- [ ] 所有表已启用 RLS
- [ ] 认证用户只能访问自己的项目
- [ ] Public Prompt 可以被所有用户访问
- [ ] Private Prompt 只能被所有者访问

**测试方法：**
```sql
-- 测试 RLS 策略
-- 1. 创建测试用户
-- 2. 尝试访问其他用户的项目（应该失败）
-- 3. 尝试访问自己的项目（应该成功）
-- 4. 尝试访问 Public Prompt（应该成功）
-- 5. 尝试访问其他用户的 Private Prompt（应该失败）
```

### 2.4 Supabase 客户端

**测试项：**
- [ ] `app/lib/supabase/client.ts` 浏览器端客户端正常工作
- [ ] `app/lib/supabase/server.ts` 服务器端客户端正常工作
- [ ] 管理员客户端（Service Role）正常工作
- [ ] 类型定义正确导入

**测试方法：**
```typescript
// 在 API Route 中测试
import { createServerClient } from '@lib/supabase/server';
const supabase = await createServerClient();
const { data } = await supabase.from('projects').select('*');
```

---

## 阶段三：CLI 工具开发

### 3.1 CLI 基础框架

**测试项：**
- [ ] `cygnus --help` 显示帮助信息
- [ ] `cygnus --version` 显示版本号
- [ ] `cygnus sync --help` 显示 sync 命令帮助
- [ ] `cygnus classify --help` 显示 classify 命令帮助
- [ ] `-v, --verbose` 选项启用详细日志
- [ ] `-c, --config` 选项指定配置文件

**测试命令：**
```bash
cd packages/cygnus-cli
bun run dev -- --help
bun run dev -- --version
bun run dev -- sync --help
bun run dev -- classify --help
bun run dev -- -v sync
```

### 3.2 配置文件读取

**测试项：**
- [ ] 从 `.cygnusrc` 读取配置
- [ ] 从 `cygnus.config.json` 读取配置
- [ ] 从环境变量读取配置
- [ ] 配置文件优先级正确（本地 > 环境变量 > 默认值）

**测试方法：**
```bash
# 创建测试配置文件
echo '{"dataDir": "./test-data"}' > .cygnusrc
bun run dev -- sync --dry-run
# 应该使用 ./test-data 目录
```

### 3.3 项目扫描与发现

**测试项：**
- [ ] 正确识别项目根目录（通过 `package.json`）
- [ ] 正确识别项目根目录（通过 `.git`）
- [ ] 正确扫描 `/docs/*.md` 文件
- [ ] 跳过隐藏目录和 `node_modules`
- [ ] 生成正确的项目清单 JSON

**测试数据准备：**
```bash
mkdir -p data/test-project/docs
echo "# Test Project" > data/test-project/docs/PRD.md
echo '{"name": "test-project"}' > data/test-project/package.json
```

**测试命令：**
```bash
bun run dev -- sync --data-dir ./data --dry-run
# 应该找到 test-project
```

### 3.4 Markdown 解析

**测试项：**
- [ ] 正确解析任务列表（`- [ ]` 和 `- [x]`）
- [ ] 正确提取需求列表
- [ ] 正确识别项目阶段（Demo/MVP/Production）
- [ ] 正确解析 Frontmatter
- [ ] 正确计算基础进度

**测试 Markdown 文件：**
```markdown
---
stage: MVP
---

# Test Project

## 需求
- 需求1
- 需求2

## 任务
- [x] 已完成任务1
- [ ] 待完成任务2 [high]
- [ ] 待完成任务3 [low]
```

**测试命令：**
```bash
# 创建测试文件后
bun run dev -- sync --data-dir ./data --dry-run
# 检查输出中的任务列表
```

### 3.5 AI Agent 分析层

**测试项：**
- [ ] Kimi API 调用成功
- [ ] OpenAI API 调用成功（如果配置）
- [ ] Qwen API 调用成功（如果配置）
- [ ] AI 分析生成有效的 SIPE JSON
- [ ] AI 失败时自动降级到基础算法
- [ ] 进度计算考虑任务优先级
- [ ] 健康度评分合理

**测试前准备：**
```bash
# 在 .env.local 中配置
KIMI_API_KEY=your_key
```

**测试命令：**
```bash
bun run dev -- sync --data-dir ./data --dry-run -v
# 检查日志中的 AI 分析结果
```

**预期结果：**
- 如果配置了 API Key，应该看到 "Analyzing project with kimi"
- 生成的 SIPE JSON 应该包含合理的 progress 和 health_score
- 如果 API 调用失败，应该看到警告并使用备用算法

### 3.6 CLI 数据同步

**测试项：**
- [ ] 成功创建新项目记录
- [ ] 成功更新现有项目记录
- [ ] 成功同步任务列表
- [ ] 成功保存 SIPE JSON 快照
- [ ] 批量同步多个项目
- [ ] 错误处理和重试逻辑
- [ ] 同步状态反馈（日志）

**测试前准备：**
```bash
# 配置 Supabase
export SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_key
```

**测试命令：**
```bash
# 首次同步（创建）
bun run dev -- sync --data-dir ./data

# 再次同步（更新）
bun run dev -- sync --data-dir ./data

# 检查 Supabase 数据库
# 应该看到项目记录和任务记录
```

**验证方法：**
```sql
-- 在 Supabase 中检查
SELECT * FROM projects;
SELECT * FROM tasks;
SELECT * FROM project_sync_v1 ORDER BY sync_timestamp DESC LIMIT 5;
```

### 3.7 Prompt 文件系统扫描

**测试项：**
- [ ] 正确扫描 `/data/prompts` 目录
- [ ] 正确识别 Domain/Scenario/Asset 结构
- [ ] 正确读取 `main.prompt` 文件
- [ ] 正确读取 `context.md` 文件
- [ ] 正确读取 `config.yaml` 文件
- [ ] 正确解析 YAML 配置
- [ ] 生成正确的 LTree 路径

**测试数据准备：**
```bash
mkdir -p data/prompts/Coding/Frontend/Nuxt4-Expert
echo "You are a Nuxt expert" > data/prompts/Coding/Frontend/Nuxt4-Expert/main.prompt
echo "# Context" > data/prompts/Coding/Frontend/Nuxt4-Expert/context.md
echo "version: 1.0.0" > data/prompts/Coding/Frontend/Nuxt4-Expert/config.yaml
```

**测试命令：**
```bash
bun run dev -- classify --data-dir ./data
# 应该找到 Nuxt4-Expert repo
```

### 3.8 本地缓存机制

**测试项：**
- [ ] 成功保存项目状态到 `.cygnus/state.json`
- [ ] 成功读取缓存的项目状态
- [ ] 缓存失效检测（文件修改）
- [ ] 缓存版本验证
- [ ] 清除缓存功能

**测试命令：**
```bash
# 首次同步（创建缓存）
bun run dev -- sync --data-dir ./data --dry-run

# 检查缓存文件
cat data/test-project/.cygnus/state.json

# 再次同步（使用缓存）
bun run dev -- sync --data-dir ./data --dry-run -v
# 应该看到 "Using cached state"
```

---

## 阶段四：Agent 自动分类与 Prompt 管理

### 4.1 Agent 自动分类模块

**测试项：**
- [ ] `classifyPrompt` 函数正确调用 LLM
- [ ] 正确提取 Domain（一级分类）
- [ ] 正确提取 Scenario（二级分类）
- [ ] 正确提取 Tags（标签）
- [ ] 正确生成 Summary（摘要）
- [ ] 正确生成 Frontmatter（元数据）
- [ ] 支持交互式确认模式

**测试前准备：**
```bash
# 配置 Kimi API Key
export KIMI_API_KEY=your_key
```

**测试命令：**
```bash
bun run dev -- classify --data-dir ./data --interactive
# 应该看到每个 Prompt 的分类结果
```

**测试数据准备：**
```bash
mkdir -p data/prompts/Coding/Frontend/Test-Prompt
echo "You are a frontend expert" > data/prompts/Coding/Frontend/Test-Prompt/main.prompt
```

**预期结果：**
- 应该正确识别 Domain 为 "Coding"
- 应该正确识别 Scenario 为 "Frontend"
- 应该生成相关的 Tags
- 应该生成有意义的 Summary

### 4.2 Prompt 元数据生成

**测试项：**
- [ ] 为每个 Prompt Repo 生成摘要
- [ ] 生成场景综述（二级菜单汇总）
- [ ] 自动提取标签
- [ ] 版本管理逻辑正常

**测试命令：**
```bash
# 测试场景综述生成
# 在代码中调用 generateScenarioSummary
```

**测试方法：**
```typescript
// 在测试代码中
import { generateScenarioSummary } from './lib/agent/classifier';
const summary = await generateScenarioSummary(repos, 'Frontend', config);
// 应该返回一段场景综述
```

### 4.3 Prompt 文件系统同步

**测试项：**
- [ ] LTree 路径转换正确
- [ ] 成功创建 Prompt Repo 记录
- [ ] 成功更新现有 Repo 记录
- [ ] 成功同步 Prompt 内容
- [ ] 成功同步元数据
- [ ] 批量同步多个 Repos

**测试前准备：**
```bash
# 配置 Supabase
export SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_key
```

**测试命令：**
```bash
bun run dev -- classify --data-dir ./data
# 应该同步所有 Prompt Repos 到 Supabase
```

**验证方法：**
```sql
-- 在 Supabase 中检查
SELECT * FROM prompt_repos;
SELECT * FROM prompts;
SELECT * FROM prompt_metadata;
```

**测试用例：**
1. **新 Repo 同步**：创建新的 Prompt Repo，应该成功创建记录
2. **更新 Repo**：修改 Prompt 内容，应该成功更新记录
3. **批量同步**：同步多个 Repos，应该全部成功

### 4.4 分类建议确认

**测试项：**
- [ ] 交互式模式显示分类建议
- [ ] 用户可以确认或拒绝建议
- [ ] 确认后自动应用分类

**测试命令：**
```bash
bun run dev -- classify --data-dir ./data --interactive
# 应该显示每个 Prompt 的分类建议
# 等待用户确认
```

---

## 集成测试

### 5.1 完整同步流程

**测试场景：**
1. 准备多个测试项目
2. 运行 `cygnus sync`
3. 验证所有项目都同步到 Supabase
4. 验证数据完整性

**测试步骤：**
```bash
# 1. 准备测试数据
mkdir -p data/{project1,project2}/docs
# 创建 Markdown 文件...

# 2. 运行同步
bun run dev -- sync --data-dir ./data

# 3. 验证数据库
# 在 Supabase Dashboard 中检查
```

### 5.2 AI 分析 + 同步流程

**测试场景：**
1. 配置 Kimi API Key
2. 运行同步
3. 验证 AI 分析结果
4. 验证同步到数据库的数据

**测试步骤：**
```bash
# 1. 配置 API Key
export KIMI_API_KEY=your_key

# 2. 运行同步
bun run dev -- sync --data-dir ./data -v

# 3. 检查日志
# 应该看到 AI 分析过程

# 4. 验证数据库
# progress 和 health_score 应该更合理
```

### 5.3 Prompt 分类 + 同步流程

**测试场景：**
1. 扫描 Prompt Repos
2. 使用 AI 进行分类
3. 同步到 Supabase
4. 验证数据完整性

**测试步骤：**
```bash
# 1. 准备测试数据
mkdir -p data/prompts/Coding/Frontend/Test-Prompt
echo "You are a frontend expert" > data/prompts/Coding/Frontend/Test-Prompt/main.prompt

# 2. 运行分类和同步
bun run dev -- classify --data-dir ./data

# 3. 验证数据库
# 在 Supabase Dashboard 中检查
```

### 5.4 错误恢复

**测试场景：**
1. AI API 调用失败
2. Supabase 连接失败
3. 文件读取失败
4. 验证错误处理和恢复

**测试方法：**
```bash
# 1. 使用无效的 API Key
export KIMI_API_KEY=invalid_key
bun run dev -- sync --data-dir ./data
# 应该降级到基础算法

# 2. 使用无效的 Supabase URL
export SUPABASE_URL=invalid_url
bun run dev -- sync --data-dir ./data
# 应该显示错误但不崩溃
```

---

## 性能测试

### 6.1 扫描性能

**测试项：**
- [ ] 扫描 10 个项目的时间 < 1 秒
- [ ] 扫描 100 个项目的时间 < 5 秒
- [ ] 内存使用合理

**测试方法：**
```bash
time bun run dev -- sync --data-dir ./data --dry-run
```

### 6.2 AI 分析性能

**测试项：**
- [ ] 单个项目 AI 分析时间 < 5 秒
- [ ] 批量分析 10 个项目时间 < 30 秒
- [ ] API 调用重试机制有效

### 6.3 数据库同步性能

### 6.4 Prompt 分类性能

**测试项：**
- [ ] 单个 Prompt 分类时间 < 3 秒
- [ ] 批量分类 10 个 Prompts 时间 < 20 秒
- [ ] 场景综述生成时间 < 5 秒

**测试项：**
- [ ] 同步 10 个项目时间 < 3 秒
- [ ] 批量插入任务性能良好
- [ ] 数据库连接池有效

---

## 测试检查清单

### 基础功能
- [ ] 项目元数据正确
- [ ] 路由结构完整
- [ ] 环境变量管理正常
- [ ] TypeScript 类型检查通过
- [ ] Prettier 格式化正常

### 数据库
- [ ] 所有表已创建
- [ ] RLS 策略正确
- [ ] 索引已创建
- [ ] 触发器正常工作

### CLI 工具
- [ ] 命令解析正常
- [ ] 配置文件读取正常
- [ ] 项目扫描正常
- [ ] Markdown 解析正常
- [ ] AI 分析正常（如果配置）
- [ ] 数据同步正常
- [ ] Prompt 扫描正常
- [ ] 缓存机制正常
- [ ] Prompt 分类正常
- [ ] Prompt 同步正常

### 集成
- [ ] 完整流程测试通过
- [ ] 错误处理正常
- [ ] 性能满足要求

---

## 测试报告模板

```markdown
# 测试报告 - [日期]

## 测试环境
- Node.js 版本: 
- Bun 版本: 
- 操作系统: 
- Supabase 项目: 

## 测试结果

### 阶段一：基础设置
- [ ] 通过 / [ ] 失败
- 问题记录: 

### 阶段二：数据模型
- [ ] 通过 / [ ] 失败
- 问题记录: 

### 阶段三：CLI 工具
- [ ] 通过 / [ ] 失败
- 问题记录: 

## 已知问题
1. 
2. 

## 性能数据
- 扫描时间: 
- AI 分析时间: 
- 同步时间: 
```

---

## 自动化测试建议

### 单元测试
```bash
# 使用 Vitest 或 Jest
bun add -d vitest
# 创建测试文件
```

### E2E 测试
```bash
# 使用 Playwright
bun add -d @playwright/test
# 创建 E2E 测试
```

---

## 持续集成

建议在 GitHub Actions 中设置：
- 每次 PR 自动运行类型检查
- 每次 PR 自动运行格式化检查
- 每次 PR 自动运行单元测试
- 每次合并到 main 自动运行完整测试套件

