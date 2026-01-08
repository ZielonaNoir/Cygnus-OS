/**
 * 创建分享链接 API
 * POST /api/share/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 验证用户
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { resourceType, resourceId, expiresAt, maxUses, permissions, metadata } = body;

        if (!resourceType || !resourceId) {
            return NextResponse.json({ error: 'Missing resourceType or resourceId' }, { status: 400 });
        }

        // 验证资源所有权
        if (resourceType === 'project') {
            const { data: project, error } = await supabase
                .from('projects')
                .select('owner_id')
                .eq('id', resourceId)
                .single();

            if (error || !project || project.owner_id !== user.id) {
                return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 });
            }
        } else if (resourceType === 'prompt') {
            const { data: prompt, error } = await supabase
                .from('prompts')
                .select('repo_id, prompt_repos!inner(owner_id)')
                .eq('id', resourceId)
                .single();

            if (error || !prompt || (prompt.prompt_repos as { owner_id: string }).owner_id !== user.id) {
                return NextResponse.json({ error: 'Prompt not found or access denied' }, { status: 403 });
            }
        }

        // 生成唯一 token
        const token = randomBytes(32).toString('base64url');

        // 创建分享链接
        const { data: shareLink, error: createError } = await supabase
            .from('share_links')
            .insert({
                resource_type: resourceType,
                resource_id: resourceId,
                created_by: user.id,
                token,
                expires_at: expiresAt || null,
                max_uses: maxUses || null,
                permissions: permissions || { read: true, write: false },
                metadata: metadata || {},
                is_active: true,
            })
            .select()
            .single();

        if (createError) {
            console.error('Failed to create share link:', createError);
            return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
        }

        return NextResponse.json({
            token: shareLink.token,
            expiresAt: shareLink.expires_at,
            maxUses: shareLink.max_uses,
            permissions: shareLink.permissions,
        });
    } catch (error) {
        console.error('Share link creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
