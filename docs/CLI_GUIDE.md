# Cygnus CLI 使用指南

完整的 Cygnus CLI 工具使用文档，包括安装、配置、命令参考和高级用法。

---

## 📖 目录

- [快速开始](#快速开始)
- [安装](#安装)
- [配置](#配置)
- [命令参考](#命令参考)
- [高级用法](#高级用法)
- [故障排除](#故障排除)
- [最佳实践](#最佳实践)

---

## 🚀 快速开始

### 1. 初始化配置

首次使用时，运行配置向导：

```bash
cygnus init
```

配置向导会引导你设置：
- 📁 数据目录位置
- 🔗 Supabase 连接信息（可选）
- 🤖 LLM 提供商和 API 密钥

配置将保存到 `~/.cygnusrc`。

### 2. 同步项目数据

将本地项目同步到 Supabase：

```bash
# 方式 1：通过命令行参数指定用户 ID
cygnus sync --owner-id <用户UUID>

# 方式 2：在配置文件中设置 ownerId（见下方配置说明）
cygnus sync
```

**⚠️ 重要**：如果不指定 `owner_id`，创建的项目将不可见（`owner_id = null`）。请务必指定用户 UUID。

**如何获取用户 UUID**：
- 在 Supabase Dashboard → Authentication → Users 中查看
- 或运行 SQL: `SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';`

### 3. 分类 Prompt

使用 AI 自动分类 Prompt 资产：

```bash
cygnus classify
```

---

## 📦 安装

### 从源码安装

```bash
cd packages/cygnus-cli
npm install
npm run build
npm link
```

### 全局安装（开发中）

```bash
npm install -g @cygnus/cli
```

### 验证安装

```bash
cygnus --version
cygnus --help
```

---

## ⚙️ 配置

### 配置文件位置

Cygnus CLI 按以下顺序查找配置文件：

1. 当前目录：`.cygnusrc`
2. 当前目录：`cygnus.config.json`
3. 当前目录：`.cygnus/config.json`
4. 用户主目录：`~/.cygnusrc`

### 配置文件格式

完整的 `.cygnusrc` 示例：

```json
{
  "dataDir": "./data",
  "supabase": {
    "url": "https://your-project.supabase.co",
    "serviceRoleKey": "your-service-role-key",
    "ownerId": "your-user-uuid-here"
  },
  "llm": {
    "provider": "kimi",
    "apiKey": "your-api-key",
    "apiUrl": "https://api.moonshot.cn/v1",
    "model": "moonshot-v1-8k"
  },
  "recovery": {
    "enabled": true,
    "maxRetries": 3,
    "retryDelayMs": 1000,
    "autoResume": false
  },
  "performance": {
    "enabled": true,
    "memoryWarningThreshold": 500,
    "saveReports": false,
    "snapshotInterval": 5000
  }
}
```

### 环境变量

配置也可以通过环境变量设置：

**数据目录**:
```bash
export CYGNUS_DATA_DIR=./data
```

**Supabase**:
```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-key
export SUPABASE_OWNER_ID=your-user-uuid  # 可选：项目所有者 UUID
```

**LLM 配置**:
```bash
export LLM_PROVIDER=kimi
export KIMI_API_KEY=your-key
export KIMI_API_URL=https://api.moonshot.cn/v1
export LLM_MODEL=moonshot-v1-8k
```

**恢复设置**:
```bash
export RECOVERY_ENABLED=true
export MAX_RETRIES=3
export RETRY_DELAY_MS=1000
export AUTO_RESUME=false
```

**性能设置**:
```bash
export PERFORMANCE_ENABLED=true
export MEMORY_WARNING_THRESHOLD=500
export SAVE_PERFORMANCE_REPORTS=false
export SNAPSHOT_INTERVAL=5000
```

---

## 📚 命令参考

### `cygnus init`

交互式配置向导，引导设置 CLI 配置。

**用法**:
```bash
cygnus init [选项]
```

**选项**:
- `-f, --force` - 覆盖已存在的配置文件

**示例**:
```bash
# 首次配置
cygnus init

# 强制重新配置
cygnus init --force
```

---

### `cygnus sync`

将本地项目和 Prompt 数据同步到 Supabase。

**用法**:
```bash
cygnus sync [选项]
```

**选项**:
- `-d, --data-dir <path>` - 指定数据目录路径
- `--dry-run` - 模拟运行，不实际同步
- `--recover` - 从上次失败的同步恢复
- `--no-retry` - 禁用重试逻辑
- `--max-retries <n>` - 最大重试次数（默认：3）
- `--profile` - 启用详细性能分析
- `--no-progress` - 禁用进度条
- `--quiet` - 静默模式，仅输出结果

**示例**:

```bash
# 基础同步
cygnus sync

# 模拟运行
cygnus sync --dry-run

# 从失败恢复
cygnus sync --recover

# 详细性能分析
cygnus sync --profile

# 脚本友好的静默模式
cygnus sync --quiet

# 自定义数据目录
cygnus sync -d /path/to/data

# 禁用重试和进度条
cygnus sync --no-retry --no-progress
```

**输出示例**:
```
🚀 Starting project sync...
[████████████] 100% | 5/5 | ETA: 0s
✅ Sync completed: 5 success, 0 failed
[████████████] 100% | 12/12 | ETA: 0s
✅ Prompt sync completed: 12 success, 0 failed

📊 Performance Summary:
- Total Duration: 23.5s
- Items Processed: 17
- Average Time/Item: 1.38s
- Memory Usage: 124.56 MB (peak)
- Errors: 0
```

---

### `cygnus classify`

使用 AI 自动分类和标记 Prompt 资产。

**用法**:
```bash
cygnus classify [选项]
```

**选项**:
- `-d, --data-dir <path>` - 指定数据目录路径
- `--force` - 强制重新分类（覆盖现有元数据）
- `--dry-run` - 模拟运行，不实际写入

**示例**:

```bash
# 自动分类所有 Prompt
cygnus classify

# 强制重新分类
cygnus classify --force

# 预览分类结果
cygnus classify --dry-run
```

**功能**:
- 自动分析 Prompt 内容
- 生成 AI 摘要
- 提取和建议标签
- 生成 Frontmatter 元数据
- 交互式确认分类建议

---

### `cygnus index-gen`

生成 Prompt 索引文件 (`.cygnus/index.json`)。

**用法**:
```bash
cygnus index-gen [选项]
```

**选项**:
- `-d, --data-dir <path>` - 指定数据目录路径

**示例**:
```bash
cygnus index-gen
```

---

## 🔧 高级用法

### 错误恢复工作流

当同步中断时：

```bash
# 1. 检查错误日志
cat ~/.cygnus/logs/cygnus-$(date +%Y-%m-%d).log

# 2. 查看恢复状态
cat ~/.cygnus/recovery.json

# 3. 恢复同步
cygnus sync --recover
```

### 性能分析工作流

```bash
# 1. 运行带性能分析的同步
cygnus sync --profile

# 2. 查看性能报告
cat ~/.cygnus/performance/sync-*.json | jq .

# 3. 分析内存使用
cat ~/.cygnus/performance/sync-*.json | jq '.memory.peak'
```

### CI/CD 集成

在 CI/CD 管道中使用：

```bash
#!/bin/bash

# 设置环境变量
export SUPABASE_URL=$SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_KEY
export LLM_PROVIDER=kimi
export KIMI_API_KEY=$KIMI_KEY

# 静默模式同步
cygnus sync --quiet --no-progress

# 检查退出代码
if [ $? -eq 0 ]; then
  echo "Sync successful"
else
  echo "Sync failed"
  exit 1
fi
```

### 批量操作

同步多个项目：

```bash
for dir in /data/projects/*; do
  echo "Syncing $dir"
  cygnus sync -d "$dir" --quiet
done
```

---

## 🐛 故障排除

### 常见问题

#### 1. **配置文件未找到**

**错误**:
```
No configuration found. Run 'cygnus init' to set up.
```

**解决方案**:
```bash
cygnus init
```

#### 2. **Supabase 连接失败**

**错误**:
```
Failed to connect to Supabase
```

**检查清单**:
- ✅ 验证 `SUPABASE_URL` 正确
- ✅ 确认 `SUPABASE_SERVICE_ROLE_KEY` 有效
- ✅ 检查网络连接
- ✅ 确认 Supabase 项目状态

**测试连接**:
```bash
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     "$SUPABASE_URL/rest/v1/projects"
```

#### 3. **LLM API 失败**

**错误**:
```
AI analysis failed, using fallback
```

**解决方案**:
- 检查 API 密钥有效性
- 验证 API 限额未超
- 确认网络可访问 API 端点

#### 4. **内存不足警告**

**警告**:
```
⚠️  Memory usage (678.45 MB) exceeds threshold (500 MB)
```

**解决方案**:
```bash
# 增加内存阈值
export MEMORY_WARNING_THRESHOLD=1000

# 或在配置文件中设置
{
  "performance": {
    "memoryWarningThreshold": 1000
  }
}
```

#### 5. **同步中断**

**场景**: 同步过程中网络断开或进程被杀

**解决方案**:
```bash
# 使用恢复模式继续
cygnus sync --recover
```

### 调试技巧

#### 启用详细日志

```bash
# 查看实时日志
tail -f ~/.cygnus/logs/cygnus-$(date +%Y-%m-%d).log

# 查看恢复日志
tail -f ~/.cygnus/logs/recovery.log
```

#### 检查缓存状态

```bash
# 查看项目缓存
cat /path/to/project/.cygnus/state.json | jq .

# 清除缓存重新扫描
rm -rf /path/to/project/.cygnus/state.json
```

---

## ✨ 最佳实践

### 1. 定期同步

设置 cron 任务自动同步：

```bash
# 每小时同步一次
0 * * * * cd /path/to/data && cygnus sync --quiet
```

### 2. 使用版本控制

将配置文件加入版本控制（注意敏感信息）：

```bash
# .gitignore
.cygnusrc
*.local.json

# 提交示例配置
cp .cygnusrc .cygnusrc.example
# 移除敏感信息后提交
git add .cygnusrc.example
```

### 3. 分离环境配置

```bash
# 开发环境
cp .cygnusrc.dev .cygnusrc

# 生产环境
cp .cygnusrc.prod .cygnusrc
```

### 4. 监控性能

定期检查性能报告：

```bash
# 查看最近的性能报告
ls -lt ~/.cygnus/performance/ | head -n 5

# 分析平均同步时间
jq '.metrics.avgItemTime' ~/.cygnus/performance/*.json | \
  awk '{sum+=$1; n++} END {print sum/n}'
```

### 5. 备份重要数据

```bash
# 备份配置和状态
tar -czf cygnus-backup-$(date +%Y%m%d).tar.gz \
  ~/.cygnusrc \
  ~/.cygnus/
```

---

## 📞 获取帮助

### 内置帮助

```bash
# 查看所有命令
cygnus --help

# 查看特定命令帮助
cygnus sync --help
cygnus classify --help
cygnus init --help
```

### 日志文件位置

- 主日志: `~/.cygnus/logs/cygnus-YYYY-MM-DD.log`
- 恢复日志: `~/.cygnus/logs/recovery.log`
- 性能报告: `~/.cygnus/performance/sync-*.json`
- 恢复状态: `~/.cygnus/recovery.json`

---

## 📝 相关文档

- [项目 README](../../../README.md)
- [TODO 清单](./TODO.md)
- [类型定义](./TYPES.md)
- [数据模型](./DATA_MODEL.md)

---

*最后更新: 2026-01-08*
