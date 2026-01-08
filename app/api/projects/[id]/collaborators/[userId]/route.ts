/**
 * 移除项目协作者 API
 * DELETE /api/projects/[id]/collaborators/[userId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; userId: string } }
) {
    try {
        const supabase = await createClient();

        // 验证用户
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: projectId, userId } = params;

        // 验证项目所有权
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', projectId)
            .single();

        if (fetchError || !project || project.owner_id !== user.id) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 });
        }

        // 移除协作者
        const { error: deleteError } = await supabase
            .from('project_collaborators')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Failed to remove collaborator:', deleteError);
            return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Collaborator removal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
