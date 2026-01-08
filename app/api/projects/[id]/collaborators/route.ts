/**
 * 项目协作者管理 API
 * GET /api/projects/[id]/collaborators - 列出协作者
 * POST /api/projects/[id]/collaborators - 添加协作者
 * DELETE /api/projects/[id]/collaborators/[userId] - 移除协作者
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET: 列出协作者
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

        const { id: projectId } = params;

        // 验证项目所有权
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', projectId)
            .single();

        if (fetchError || !project || project.owner_id !== user.id) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 });
        }

        // 查询协作者（RLS 会自动过滤）
        const { data: collaborators, error } = await supabase
            .from('project_collaborators')
            .select('*, user:user_id(id, email)')
            .eq('project_id', projectId);

        if (error) {
            console.error('Failed to fetch collaborators:', error);
            return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
        }

        return NextResponse.json({ collaborators });
    } catch (error) {
        console.error('Collaborators fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: 添加协作者
export async function POST(
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

        const { id: projectId } = params;
        const body = await request.json();
        const { userId, role = 'viewer' } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // 验证项目所有权
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', projectId)
            .single();

        if (fetchError || !project || project.owner_id !== user.id) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 });
        }

        // 不能添加自己为协作者
        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot add yourself as collaborator' }, { status: 400 });
        }

        // 添加协作者
        const { data: collaborator, error: createError } = await supabase
            .from('project_collaborators')
            .insert({
                project_id: projectId,
                user_id: userId,
                role,
                invited_by: user.id,
            })
            .select()
            .single();

        if (createError) {
            if (createError.code === '23505') {
                return NextResponse.json({ error: 'User is already a collaborator' }, { status: 409 });
            }
            console.error('Failed to add collaborator:', createError);
            return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 });
        }

        return NextResponse.json({ collaborator }, { status: 201 });
    } catch (error) {
        console.error('Collaborator addition error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
