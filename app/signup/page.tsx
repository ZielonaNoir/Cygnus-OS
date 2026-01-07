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

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('密码不匹配', '请确认两次输入的密码相同');
            return;
        }

        if (password.length < 6) {
            toast.error('密码过短', '密码至少需要 6 个字符');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            toast.success('注册成功', '请查收验证邮件以激活账号');
            router.push('/login');
        } catch (error) {
            const message = error instanceof Error ? error.message : '注册失败';
            toast.error('注册失败', message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGitHubSignup = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'GitHub 注册失败';
            toast.error('注册失败', message);
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
                    <CardTitle className="text-xl text-foreground">创建新账号</CardTitle>
                    <CardDescription>开始你的超级个体之旅</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* OAuth 注册 */}
                    <Button
                        variant="outline"
                        className="w-full h-11 border-border/50 bg-background/50 hover:bg-background/80 hover:border-primary/50 transition-all"
                        onClick={handleGitHubSignup}
                    >
                        <Icon icon="mdi:github" className="h-5 w-5 mr-2" />
                        使用 GitHub 注册
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">或使用邮箱</span>
                        </div>
                    </div>

                    {/* Email 注册表单 */}
                    <form onSubmit={handleSignup} className="space-y-4">
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
                            <label htmlFor="password" className="text-sm font-medium text-foreground">
                                密码
                            </label>
                            <div className="relative">
                                <Icon icon="mdi:lock-outline" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="至少 6 个字符"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                确认密码
                            </label>
                            <div className="relative">
                                <Icon icon="mdi:lock-check-outline" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="再次输入密码"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                                    required
                                    minLength={6}
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
                                    注册中...
                                </>
                            ) : (
                                '注册'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        已有账号？{' '}
                        <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            立即登录
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
