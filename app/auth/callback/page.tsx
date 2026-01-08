'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <React.Suspense fallback={
                <div className="text-center space-y-4">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-muted-foreground">加载中...</p>
                </div>
            }>
                <CallbackContent />
            </React.Suspense>
        </div>
    );
}

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = React.useState('正在验证登录...');

    React.useEffect(() => {
        const handleCallback = async () => {
            try {
                // 首先检查是否已经有 session（可能之前的登录已完成）
                const { data: { session: existingSession } } = await supabase.auth.getSession();

                if (existingSession) {
                    console.log('Already have session:', existingSession.user?.email);
                    setStatus('登录成功！正在跳转...');
                    router.replace('/dashboard');
                    return;
                }

                // 检查 URL hash 中是否有 access_token（隐式流程）
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                console.log('Callback page loaded');
                console.log('Hash has access_token:', !!accessToken);

                if (accessToken && refreshToken) {
                    console.log('Setting session with tokens...');

                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    console.log('setSession result:', { data, error });

                    if (!error && data.session) {
                        setStatus('登录成功！正在跳转...');
                        window.history.replaceState(null, '', window.location.pathname);
                        router.replace('/dashboard');
                        return;
                    }
                }

                // 检查 URL query 中是否有 code（PKCE 流程）
                const code = searchParams.get('code');

                if (code) {
                    console.log('Exchanging code for session...');
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) {
                        // PKCE 错误时，再次检查是否已经有 session（可能是重复访问）
                        const { data: { session: retrySession } } = await supabase.auth.getSession();
                        if (retrySession) {
                            console.log('Found session after PKCE error:', retrySession.user?.email);
                            setStatus('登录成功！正在跳转...');
                            router.replace('/dashboard');
                            return;
                        }
                        console.error('exchangeCodeForSession error:', error.message);
                        throw error;
                    }

                    if (data.session) {
                        setStatus('登录成功！正在跳转...');
                        router.replace('/dashboard');
                        return;
                    }
                }

                // 检查是否有错误
                const error = searchParams.get('error') || hashParams.get('error');
                const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

                if (error) {
                    throw new Error(errorDescription || error);
                }

                throw new Error('未找到认证信息');
            } catch (err) {
                const message = err instanceof Error ? err.message : '认证失败';
                console.error('Auth callback error:', message);
                setStatus(`认证失败: ${message}`);
                setTimeout(() => {
                    router.replace(`/login?error=${encodeURIComponent(message)}`);
                }, 2000);
            }
        };

        handleCallback();
    }, [router, searchParams]);

    return (
        <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">{status}</p>
        </div>
    );
}
