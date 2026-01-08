/**
 * 单个项目的 CRUD API
 * GET /api/projects/[id] - 获取项目详情
 * PATCH /api/projects/[id] - 更新项目
 * DELETE /api/projects/[id] - 删除项目
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET: 获取项目详情
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

        // 查询项目（RLS 会自动验证所有权）
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !project) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
        }

        // 验证所有权（双重检查）
        if (project.owner_id !== user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // 获取关联的任务
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', id)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            ...project,
            tasks: tasks || [],
        });
    } catch (error) {
        console.error('Project fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH: 更新项目
export async function PATCH(
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
        const body = await request.json();

        // 验证项目所有权
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', id)
            .single();

        if (fetchError || !project || project.owner_id !== user.id) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 });
        }

        // 更新项目
        const updateData: Record<string, unknown> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.path !== undefined) updateData.path = body.path;
        if (body.progress !== undefined) updateData.progress = body.progress;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.healthScore !== undefined) updateData.health_score = body.healthScore;
        updateData.updated_at = new Date().toISOString();

        const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Failed to update project:', updateError);
            return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
        }

        return NextResponse.json({ project: updatedProject });
    } catch (error) {
        console.error('Project update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: 删除项目
export async function DELETE(
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

        // 验证项目所有权
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', id)
            .single();

        if (fetchError || !project || project.owner_id !== user.id) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 });
        }

        // 删除项目（级联删除会处理关联的任务）
        const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Failed to delete project:', deleteError);
            return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Project deletion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
