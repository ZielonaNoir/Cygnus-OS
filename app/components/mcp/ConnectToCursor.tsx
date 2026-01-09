
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@lib/supabase/client';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowRight, CheckCircle2, Copy } from 'lucide-react';

export function ConnectToCursor() {
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [deepLink, setDeepLink] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function getToken() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    setToken(session.access_token);

                    // Determine environment name to prevent collision in Cursor
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const serverName = isLocal ? "Cygnus-OS (Local)" : "Cygnus-OS (Remote)";

                    // Construct MCP Config for SSE
                    const config = {
                        name: serverName,
                        type: "sse",
                        url: `${window.location.origin}/api/mcp?token=${session.access_token}`
                    };

                    // Base64 Encode
                    const encodedConfig = btoa(JSON.stringify(config));

                    // Construct Deep Link for Cursor
                    // Use encodeURIComponent for the name to handle spaces/parentheses
                    const link = `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(serverName)}&config=${encodedConfig}`;
                    setDeepLink(link);
                }
            } catch (error) {
                console.error('Failed to get session:', error);
                toast.error('认证失败');
            } finally {
                setLoading(false);
            }
        }

        getToken();
    }, [supabase]);

    const handleConnect = () => {
        if (!deepLink) return;

        // Open deep link
        window.location.href = deepLink;

        toast.success('正在打开 Cursor...', {
            description: '请在 Cursor 中确认安装对话框'
        });
    };

    const handleCopyURL = () => {
        if (!token) return;
        const url = `${window.location.origin}/api/mcp?token=${token}`;
        navigator.clipboard.writeText(url);
        toast.success('URL 已复制', {
            description: '可以手动粘贴到 Cursor MCP 设置中（SSE 类型）'
        });
    };

    return (
        <Card className="w-full max-w-md mx-auto my-4 border-border/50 bg-card/50 backdrop-blur-xl relative overflow-hidden group">
            {/* 装饰性光效 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 pointer-events-none" />

            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <span className="text-xl">🔌</span> 连接到 Cursor
                </CardTitle>
                <CardDescription>
                    允许 Cursor AI 访问你的私有 Cygnus Prompts
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>通过 RLS 访问私有 prompts</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>通过 SSE 实时更新</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>语义搜索能力</span>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-200">
                        💡 使用 JWT Token 认证，token 有效期为 1 小时。可在 Supabase Dashboard 调整过期时间。
                    </p>
                </div>

                {/* One-Click Install Button */}
                <div className="pt-2">
                    <Button
                        onClick={handleConnect}
                        disabled={loading || !deepLink}
                        className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <span className="flex items-center">
                                一键安装
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </span>
                        )}
                    </Button>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-0">
                <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">或手动设置</span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyURL}
                    disabled={!token}
                    className="w-full text-muted-foreground hover:text-foreground"
                >
                    <Copy className="w-4 h-4 mr-2" />
                    复制服务器 URL
                </Button>
            </CardFooter>
        </Card>
    );
}
