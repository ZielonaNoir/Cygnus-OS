/**
 * 获取分享链接信息 API
 * GET /api/share/[token]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const supabase = await createClient();
        const { token } = params;

        // 获取分享链接信息（不需要认证，因为这是公开访问）
        const { data: shareLink, error } = await supabase
            .from('share_links')
            .select('*')
            .eq('token', token)
            .eq('is_active', true)
            .single();

        if (error || !shareLink) {
            return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
        }

        // 检查是否过期
        const now = new Date();
        const expiresAt = shareLink.expires_at ? new Date(shareLink.expires_at) : null;
        const isExpired = expiresAt ? expiresAt < now : false;
        const isMaxUsesReached = shareLink.max_uses ? shareLink.use_count >= shareLink.max_uses : false;

        if (isExpired || isMaxUsesReached) {
            return NextResponse.json(
                {
                    error: isExpired ? 'Share link has expired' : 'Share link has reached max uses',
                    isExpired,
                    isMaxUsesReached,
                },
                { status: 410 }
            );
        }

        return NextResponse.json({
            resourceType: shareLink.resource_type,
            resourceId: shareLink.resource_id,
            expiresAt: shareLink.expires_at,
            maxUses: shareLink.max_uses,
            useCount: shareLink.use_count,
            permissions: shareLink.permissions,
            metadata: shareLink.metadata,
        });
    } catch (error) {
        console.error('Share link fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * 使用分享链接（增加使用计数）
 * POST /api/share/[token]/use
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const supabase = await createClient();
        const { token } = params;

        // 更新使用计数
        const { error } = await supabase.rpc('increment_share_link_use_count', {
            link_token: token,
        });

        // 如果 RPC 不存在，直接更新
        if (error && error.message.includes('function')) {
            const { data: shareLink } = await supabase
                .from('share_links')
                .select('use_count, max_uses')
                .eq('token', token)
                .single();

            if (shareLink && (!shareLink.max_uses || shareLink.use_count < shareLink.max_uses)) {
                await supabase
                    .from('share_links')
                    .update({ use_count: (shareLink.use_count || 0) + 1 })
                    .eq('token', token);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Share link use error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
