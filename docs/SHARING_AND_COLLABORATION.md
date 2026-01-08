# 分享与协作功能实现文档

## 概述

本文档描述了 Cygnus-OS 的分享与协作功能的实现，包括分享链接生成、权限管理、多用户协作和导出功能。

## 功能列表

### ✅ 1. 分享链接生成 (`cygnus://` 协议)

**实现位置**:
- `app/lib/sharing/link-generator.ts` - 链接生成器
- `app/lib/sharing/link-parser.ts` - 链接解析器

**功能特性**:
- 支持生成 Web 链接、Deep Link (`cygnus://`) 和 Markdown 格式链接
- 支持过期时间设置
- 支持最大使用次数限制
- 支持权限控制（read、write、admin）
- 支持自定义元数据

**使用示例**:
```typescript
import { LinkGenerator } from '@/app/lib/sharing/link-generator';

// 生成分享链接
const shareLink = await LinkGenerator.generateShareLink('project', projectId, {
    expiresAt: new Date('2026-12-31'),
    maxUses: 10,
    permissions: { read: true, write: false },
});
```

### ✅ 2. 分享链接解析和预览

**实现位置**:
- `app/share/[token]/page.tsx` - 分享链接预览页面
- `app/api/share/[token]/route.ts` - 分享链接 API

**功能特性**:
- 自动验证分享链接有效性
- 检查过期时间和使用次数
- 自动跳转到资源页面
- 记录使用统计

**访问方式**:
- Web: `https://your-domain.com/share/<token>`
- Deep Link: `cygnus://project/<id>?token=<token>`

### ✅ 3. 过期时间管理

**数据库字段**:
- `share_links.expires_at` - 过期时间（NULL 表示永不过期）
- `share_links.max_uses` - 最大使用次数（NULL 表示无限制）
- `share_links.use_count` - 已使用次数

**验证逻辑**:
- 自动检查链接是否过期
- 自动检查是否达到最大使用次数
- 过期或达到限制的链接无法访问

### ✅ 4. 多用户协作支持

**数据库表**:
- `project_collaborators` - 项目协作者表
- `prompt_collaborators` - Prompt 协作者表

**权限级别**:
- `viewer` - 只读权限
- `editor` - 读写权限
- `admin` - 完全权限（可管理协作者）

**API 端点**:
- `GET /api/projects/[id]/collaborators` - 列出协作者
- `POST /api/projects/[id]/collaborators` - 添加协作者
- `DELETE /api/projects/[id]/collaborators/[userId]` - 移除协作者

**RLS 策略**:
- 项目所有者可以管理所有协作者
- 协作者只能查看自己的协作关系
- 所有操作都遵循 RLS 策略

### ✅ 5. 项目 CRUD API

**实现位置**:
- `app/api/projects/route.ts` - 项目列表和创建
- `app/api/projects/[id]/route.ts` - 单个项目的 CRUD

**功能特性**:
- ✅ 创建项目（自动绑定到当前用户）
- ✅ 读取项目（遵循 RLS，只返回用户有权限的项目）
- ✅ 更新项目（验证所有权）
- ✅ 删除项目（级联删除关联数据）

**RLS 保护**:
- 所有 API 都验证用户身份
- 所有操作都验证资源所有权
- 协作者可以查看和编辑（根据权限级别）

### ✅ 6. 导出功能

**实现位置**:
- `app/api/projects/[id]/export/route.ts` - 导出 API
- `app/lib/export/pdf.ts` - PDF 导出工具
- `app/components/project/ExportButton.tsx` - 导出按钮组件

**支持格式**:
- **Markdown** - 直接下载 `.md` 文件
- **PDF** - 使用 jsPDF 生成 PDF（需要客户端库）

**导出内容**:
- 项目基本信息（名称、描述、状态、进度、健康度）
- 任务列表（按优先级和状态分组）
- 导出时间戳

## 数据库结构

### share_links 表

```sql
CREATE TABLE share_links (
    id UUID PRIMARY KEY,
    resource_type TEXT NOT NULL, -- 'project' | 'prompt'
    resource_id UUID NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    permissions JSONB DEFAULT '{"read": true, "write": false}',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### project_collaborators 表

```sql
CREATE TABLE project_collaborators (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(project_id, user_id)
);
```

## API 端点

### 分享链接

- `POST /api/share/create` - 创建分享链接
- `GET /api/share/[token]` - 获取分享链接信息
- `POST /api/share/[token]` - 记录使用（增加计数）

### 项目 CRUD

- `GET /api/projects` - 列出所有项目
- `POST /api/projects` - 创建新项目
- `GET /api/projects/[id]` - 获取项目详情
- `PATCH /api/projects/[id]` - 更新项目
- `DELETE /api/projects/[id]` - 删除项目

### 协作者管理

- `GET /api/projects/[id]/collaborators` - 列出协作者
- `POST /api/projects/[id]/collaborators` - 添加协作者
- `DELETE /api/projects/[id]/collaborators/[userId]` - 移除协作者

### 导出

- `GET /api/projects/[id]/export?format=markdown` - 导出为 Markdown
- `GET /api/projects/[id]/export?format=pdf` - 导出为 PDF（返回 JSON，客户端生成）

## 安全特性

### RLS (Row Level Security)

所有表都启用了 RLS，确保：
- 用户只能访问自己的资源
- 协作者只能访问被授权的资源
- 分享链接只能由资源所有者创建

### 权限验证

所有 API 都进行双重验证：
1. 用户身份验证（JWT token）
2. 资源所有权验证（RLS + 显式检查）

### 分享链接安全

- Token 使用加密随机生成（32 字节 base64url）
- 支持过期时间限制
- 支持使用次数限制
- 支持权限控制（read/write/admin）

## 使用示例

### 创建分享链接

```typescript
// 在组件中
const handleShare = async () => {
    const shareLink = await LinkGenerator.generateShareLink('project', projectId, {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 天后过期
        maxUses: 10,
        permissions: { read: true, write: false },
    });
    
    // 复制链接到剪贴板
    await navigator.clipboard.writeText(shareLink.webLink);
};
```

### 添加协作者

```typescript
const addCollaborator = async (projectId: string, userId: string, role: 'viewer' | 'editor' | 'admin') => {
    const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
    });
    
    if (!response.ok) {
        throw new Error('Failed to add collaborator');
    }
};
```

### 导出项目

```typescript
// 使用 ExportButton 组件
<ExportButton projectId={project.id} projectName={project.name} />
```

## 相关文件

- `app/lib/sharing/link-generator.ts` - 链接生成器
- `app/lib/sharing/link-parser.ts` - 链接解析器
- `app/api/share/create/route.ts` - 创建分享链接 API
- `app/api/share/[token]/route.ts` - 分享链接信息 API
- `app/share/[token]/page.tsx` - 分享链接预览页面
- `app/api/projects/route.ts` - 项目列表和创建 API
- `app/api/projects/[id]/route.ts` - 项目 CRUD API
- `app/api/projects/[id]/collaborators/route.ts` - 协作者管理 API
- `app/api/projects/[id]/export/route.ts` - 导出 API
- `app/lib/export/pdf.ts` - PDF 导出工具
- `app/components/project/ExportButton.tsx` - 导出按钮组件

## 待优化项

1. **PDF 导出**: 当前需要客户端安装 jsPDF，可以考虑服务端生成
2. **分享链接通知**: 可以添加邮件通知功能
3. **协作权限细化**: 可以添加更细粒度的权限控制（如只能编辑特定字段）
4. **分享链接统计**: 可以添加更详细的访问统计和分析

## 测试建议

1. **分享链接测试**:
   - 创建分享链接并验证过期时间
   - 测试最大使用次数限制
   - 验证权限控制

2. **协作功能测试**:
   - 添加和移除协作者
   - 验证不同权限级别的访问控制
   - 测试 RLS 策略

3. **导出功能测试**:
   - 测试 Markdown 导出
   - 测试 PDF 导出（如果安装了 jsPDF）
   - 验证导出内容的完整性
