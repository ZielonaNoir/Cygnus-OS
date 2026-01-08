/**
 * 分享链接预览页面
 * /share/[token]
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LinkParser } from '@/app/lib/sharing/link-parser';
import type { ParsedShareLink } from '@/app/lib/sharing/link-parser';

export default function ShareLinkPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;
    const [loading, setLoading] = useState(true);
    const [shareInfo, setShareInfo] = useState<ParsedShareLink | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadShareLink() {
            try {
                // 解析分享链接
                const parsed = await LinkParser.parseShareToken(token);
                if (!parsed.valid) {
                    setError(parsed.error || 'Invalid share link');
                    setLoading(false);
                    return;
                }

                setShareInfo(parsed);

                // 记录使用
                await fetch(`/api/share/${token}`, { method: 'POST' });

                // 自动跳转到资源页面
                if (parsed.resourceType && parsed.resourceId) {
                    if (parsed.resourceType === 'project') {
                        router.push(`/dashboard/projects/${parsed.resourceId}`);
                    } else {
                        router.push(`/prompts/${parsed.resourceId}`);
                    }
                }
            } catch (err) {
                console.error('Failed to load share link:', err);
                setError('Failed to load share link');
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            loadShareLink();
        }
    }, [token, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">加载分享链接...</p>
                </div>
            </div>
        );
    }

    if (error || !shareInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-4">分享链接无效</h1>
                    <p className="text-muted-foreground mb-4">{error || '无法加载分享链接'}</p>
                    <a
                        href="/"
                        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        返回首页
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center max-w-md">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">正在跳转...</p>
            </div>
        </div>
    );
}
