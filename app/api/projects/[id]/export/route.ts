/**
 * 项目导出 API
 * GET /api/projects/[id]/export?format=pdf|markdown
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        // 验证用户
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'markdown';

        // 获取项目信息（RLS 自动验证）
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (projectError || !project) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
        }

        // 验证所有权或协作者权限
        const isOwner = project.owner_id === user.id;
        let hasAccess = isOwner;

        if (!hasAccess) {
            const { data: collaborator } = await supabase
                .from('project_collaborators')
                .select('role')
                .eq('project_id', id)
                .eq('user_id', user.id)
                .single();
            hasAccess = !!collaborator;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // 获取任务列表
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', id)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (format === 'markdown') {
            // 生成 Markdown
            const markdown = generateMarkdown(project, tasks || []);
            return new NextResponse(markdown, {
                headers: {
                    'Content-Type': 'text/markdown; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${project.name}-${new Date().toISOString().split('T')[0]}.md"`,
                },
            });
        } else if (format === 'pdf') {
            // PDF 导出需要额外的库，这里返回 JSON 数据，前端可以使用 jsPDF 等库生成
            return NextResponse.json({
                project,
                tasks: tasks || [],
                exportedAt: new Date().toISOString(),
            });
        } else {
            return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
        }
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

interface ProjectData {
    name: string;
    description?: string;
    status: string;
    progress: number;
    health_score: number;
    last_sync?: string;
    created_at: string;
}

interface TaskData {
    status: string;
    priority?: string;
    task_text: string;
}

function generateMarkdown(project: ProjectData, tasks: TaskData[]): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# ${project.name}\n`);

    // 项目信息
    if (project.description) {
        lines.push(`${project.description}\n`);
    }

    lines.push(`## 项目信息\n`);
    lines.push(`- **状态**: ${project.status}`);
    lines.push(`- **进度**: ${project.progress}%`);
    lines.push(`- **健康度**: ${project.health_score}/100`);
    if (project.last_sync) {
        lines.push(`- **最后同步**: ${new Date(project.last_sync).toLocaleString('zh-CN')}`);
    }
    lines.push(`- **创建时间**: ${new Date(project.created_at).toLocaleString('zh-CN')}`);
    lines.push(`\n`);

    // 任务列表
    if (tasks.length > 0) {
        lines.push(`## 任务列表\n`);

        const pendingTasks = tasks.filter((t) => t.status === 'pending');
        const completedTasks = tasks.filter((t) => t.status === 'completed');

        if (pendingTasks.length > 0) {
            lines.push(`### 待完成任务 (${pendingTasks.length})\n`);
            pendingTasks.forEach((task) => {
                const priority = task.priority ? `[${task.priority}]` : '';
                lines.push(`- [ ] ${priority} ${task.task_text}`);
            });
            lines.push(`\n`);
        }

        if (completedTasks.length > 0) {
            lines.push(`### 已完成任务 (${completedTasks.length})\n`);
            completedTasks.forEach((task) => {
                lines.push(`- [x] ${task.task_text}`);
            });
            lines.push(`\n`);
        }
    } else {
        lines.push(`## 任务列表\n`);
        lines.push(`暂无任务\n`);
    }

    // 导出信息
    lines.push(`---\n`);
    lines.push(`*导出时间: ${new Date().toLocaleString('zh-CN')}*\n`);

    return lines.join('\n');
}
