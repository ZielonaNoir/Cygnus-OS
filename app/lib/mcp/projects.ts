
/**
 * MCP Project Service
 * 实现通过 MCP 工具更新项目进度的逻辑
 * 复用 CLI 的同步逻辑，但适配 Web 环境和 RLS
 */

import { createClientFromToken } from '@lib/supabase/server';
import type { MCPProjectUpdateParams } from './schema';

/**
 * 更新项目进度 (需要 Token)
 */
export async function updateProjectProgress(token: string, data: MCPProjectUpdateParams) {
    const supabase = createClientFromToken(token);

    // 1. 查找或创建项目
    let projectId: string;

    const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('path', data.path)
        .single();

    if (existingProject) {
        projectId = existingProject.id;

        // 更新项目信息
        const { error: updateError } = await supabase
            .from('projects')
            .update({
                name: data.projectName,
                progress: data.progress,
                status: data.status,
                health_score: data.healthScore,
                last_sync: new Date().toISOString(),
            })
            .eq('id', projectId);

        if (updateError) throw new Error(`Failed to update project: ${updateError.message}`);
    } else {
        // 创建新项目
        // 获取当前用户 ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error("Failed to get authenticated user for project creation");
        }

        const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert({
                name: data.projectName,
                path: data.path,
                progress: data.progress,
                status: data.status,
                health_score: data.healthScore,
                last_sync: new Date().toISOString(),
                owner_id: user.id, // Explicitly set owner_id
            })
            .select('id')
            .single();

        if (createError) throw new Error(`Failed to create project: ${createError.message}`);
        projectId = newProject.id;
    }

    // 2. 同步任务列表 (全量覆盖)
    if (data.tasks) {
        // 删除旧任务
        await supabase.from('tasks').delete().eq('project_id', projectId);

        // 插入新任务
        if (data.tasks.length > 0) {
            const tasksToInsert = data.tasks.map(taskText => ({
                project_id: projectId,
                task_text: taskText,
                status: 'pending', // 默认为 pending，除非文本中有标记 (CLI 做了解析，MCP 这里简化处理或假设 AI 已清洗)
                priority: 'medium',
                file_path: 'unknown'
            }));

            const { error: taskError } = await supabase
                .from('tasks')
                .insert(tasksToInsert);

            if (taskError) throw new Error(`Failed to sync tasks: ${taskError.message}`);
        }
    }

    // 3. 保存快照 (Project Sync V1)
    await supabase.from('project_sync_v1').insert({
        project_id: projectId,
        sipe_json: data as unknown as Record<string, unknown>, // 保存原始数据
        sync_timestamp: new Date().toISOString(),
    });

    return { success: true, projectId };
}

/**
 * 获取项目状态
 */
export async function getProjectStatus(token: string, path: string) {
    const supabase = createClientFromToken(token);
    
    // 查询项目基本信息
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('path', path)
        .single();
        
    if (error) return null;
    
    // 查询关联任务
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*') // Select all fields including priority, file_path etc
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
        
    return {
        ...project,
        tasks: tasks || []
    };
}

/**
 * 列出所有项目
 */
export async function listProjects(token: string) {
    const supabase = createClientFromToken(token);
    
    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name, path, status, progress, last_sync, health_score')
        .order('last_sync', { ascending: false });
        
    if (error) throw new Error(error.message);
    
    return projects;
}

// --- Granular Task Management ---

export async function listTasks(token: string, projectId: string, status?: string) {
    const supabase = createClientFromToken(token);
    let query = supabase.from('tasks').select('*').eq('project_id', projectId);
    
    if (status) {
        query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('priority', { ascending: false }); // Sort by urgency
    if (error) throw new Error(error.message);
    return data;
}

export async function createTask(token: string, projectId: string, task: { 
    text: string, 
    status?: string, 
    priority?: string, 
    file_path?: string, 
    line_number?: number 
}) {
    const supabase = createClientFromToken(token);
    
    const { data, error } = await supabase
        .from('tasks')
        .insert({
            project_id: projectId,
            task_text: task.text,
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            file_path: task.file_path || 'unknown',
            line_number: task.line_number
        })
        .select()
        .single();
        
    if (error) throw new Error(error.message);
    return data;
}

export async function updateTask(token: string, taskId: string, updates: { 
    status?: string, 
    priority?: string, 
    task_text?: string 
}) {
    const supabase = createClientFromToken(token);
    
    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();
        
    if (error) throw new Error(error.message);
    return data;
}

// --- Schema Introspection ---

export function getSchemaInfo() {
    return {
        projects: {
            status: ['pending', 'in_progress', 'completed', 'paused', 'cancelled'],
            health_score: '0-100 integer',
            progress: '0-100 integer'
        },
        tasks: {
            status: ['pending', 'completed'],
            priority: ['low', 'medium', 'high', 'urgent'],
            required_fields: ['project_id', 'task_text', 'file_path']
        }
    };
}
