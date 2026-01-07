'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Icon } from '@/app/components/Icon';
import { toast } from '@/app/lib/toast';
import { ShinyTitle } from '@/app/components/reactbits/ShinyTitle';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast.success('登录成功', '欢迎回来！');
            router.push('/dashboard');
        } catch (error) {
            const message = error instanceof Error ? error.message : '登录失败';
            toast.error('登录失败', message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGitHubLogin = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    skipBrowserRedirect: false,
                },
            });

            if (error) throw error;

            // Supabase 会自动处理重定向
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'GitHub 登录失败';
            toast.error('登录失败', message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* 背景装饰 */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <Card className="relative w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto mb-4">
                        <ShinyTitle text="Cygnus-OS" className="text-2xl" />
                    </div>
                    <CardTitle className="text-xl text-foreground">欢迎回来</CardTitle>
                    <CardDescription>登录到你的超级个体工作空间</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* OAuth 登录 */}
                    <Button
                        variant="outline"
                        className="w-full h-11 border-border/50 bg-background/50 hover:bg-background/80 hover:border-primary/50 transition-all"
                        onClick={handleGitHubLogin}
                    >
                        <Icon icon="mdi:github" className="h-5 w-5 mr-2" />
                        使用 GitHub 登录
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">或使用邮箱</span>
                        </div>
                    </div>

                    {/* Email 登录表单 */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">
                                邮箱
                            </label>
                            <div className="relative">
                                <Icon icon="mdi:email-outline" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium text-foreground">
                                    密码
                                </label>
                                <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                    忘记密码？
                                </Link>
                            </div>
                            <div className="relative">
                                <Icon icon="mdi:lock-outline" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 shadow-lg shadow-primary/20"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Icon icon="mdi:loading" className="h-4 w-4 mr-2 animate-spin" />
                                    登录中...
                                </>
                            ) : (
                                '登录'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        还没有账号？{' '}
                        <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            立即注册
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
