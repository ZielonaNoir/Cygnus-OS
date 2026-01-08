# 项目 CRUD 功能使用指南

## 概述

项目 CRUD（创建、读取、更新、删除）功能已完全实现，包括 API 和前端 UI。

## 功能位置

### 1. 前端 UI

#### 创建项目
- **页面**: `/dashboard/projects/new`
- **访问方式**: 
  - 在仪表板页面点击"创建项目"按钮
  - 或直接访问 `/dashboard/projects/new`

#### 查看项目列表
- **页面**: `/dashboard`
- **功能**: 显示所有当前用户的项目（遵循 RLS）

#### 查看项目详情
- **页面**: `/dashboard/projects/[id]`
- **功能**: 显示项目详细信息、任务列表等

#### 编辑/删除项目
- **当前状态**: API 已实现，前端 UI 待完善
- **API 端点**: 
  - `PATCH /api/projects/[id]` - 更新项目
  - `DELETE /api/projects/[id]` - 删除项目

### 2. API 端点

#### 项目列表
```typescript
GET /api/projects
// 返回当前用户的所有项目（遵循 RLS）
```

#### 创建项目
```typescript
POST /api/projects
Content-Type: application/json

{
  "name": "项目名称",
  "description": "项目描述（可选）",
  "path": "/data/project-path",  // 唯一路径
  "progress": 0,                  // 0-100
  "status": "pending",            // pending | in_progress | completed | paused | cancelled
  "healthScore": 0                // 0-100
}
```

#### 获取项目详情
```typescript
GET /api/projects/[id]
// 返回项目详情和关联的任务列表
```

#### 更新项目
```typescript
PATCH /api/projects/[id]
Content-Type: application/json

{
  "name": "新名称",
  "progress": 50,
  "status": "in_progress",
  // ... 其他可更新字段
}
```

#### 删除项目
```typescript
DELETE /api/projects/[id]
// 删除项目（级联删除关联的任务）
```

## 使用示例

### 在组件中创建项目

```typescript
const createProject = async () => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '我的新项目',
      description: '项目描述',
      path: '/data/my-project',
      progress: 0,
      status: 'pending',
      healthScore: 0,
    }),
  });

  if (!response.ok) {
    throw new Error('创建项目失败');
  }

  const { project } = await response.json();
  console.log('项目已创建:', project);
};
```

### 更新项目

```typescript
const updateProject = async (projectId: string) => {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      progress: 75,
      status: 'in_progress',
    }),
  });

  if (!response.ok) {
    throw new Error('更新项目失败');
  }
};
```

### 删除项目

```typescript
const deleteProject = async (projectId: string) => {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('删除项目失败');
  }
};
```

## 安全特性

### RLS (Row Level Security)

所有操作都遵循 RLS 策略：
- 用户只能看到自己的项目
- 用户只能创建、更新、删除自己的项目
- 协作者可以查看和编辑（根据权限级别）

### 权限验证

所有 API 都进行双重验证：
1. **用户身份验证**: 验证 JWT token
2. **资源所有权验证**: 验证项目是否属于当前用户

## 相关文件

- `app/api/projects/route.ts` - 项目列表和创建 API
- `app/api/projects/[id]/route.ts` - 项目 CRUD API
- `app/dashboard/projects/new/page.tsx` - 创建项目页面
- `app/dashboard/page.tsx` - 项目列表页面
- `app/dashboard/projects/[id]/page.tsx` - 项目详情页面

## 待完善功能

1. **编辑项目 UI**: 在项目详情页添加编辑按钮和表单
2. **删除项目 UI**: 在项目详情页添加删除按钮和确认对话框
3. **批量操作**: 支持批量删除、批量更新状态等
