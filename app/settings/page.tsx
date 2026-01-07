'use client';

import { PushNotificationManager } from '@/app/components/notifications/PushNotificationManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import { Icon } from '@/app/components/Icon';
import { DashboardBackground } from '@/app/components/reactbits/DashboardBackground';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
    const router = useRouter();
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);

    return (
        <div className="relative min-h-screen bg-background overflow-hidden font-sans">
            <DashboardBackground />

            <div className="relative z-10 container mx-auto p-8 max-w-4xl space-y-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="hover:bg-white/10 text-white"
                    >
                        <Icon icon="mdi:arrow-left" className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            系统设置
                        </h1>
                        <p className="text-white/60 mt-1">管理您的个性化偏好和系统连接</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <Card className="bg-black/40 border-white/10 backdrop-blur-md shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Icon icon="mdi:bell-ring" className="h-5 w-5 text-primary" />
                                通知与推送
                            </CardTitle>
                            <CardDescription className="text-white/50">
                                配置系统的实时通知偏好。需要允许浏览器通知权限。
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                                <div>
                                    <h3 className="font-medium text-white">Web Push 通知</h3>
                                    <p className="text-sm text-white/50 mt-1">接收后台任务完成、数据同步状态等关键系统提醒。</p>
                                </div>
                                <PushNotificationManager />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-white/10 backdrop-blur-md shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Icon icon="mdi:theme-light-dark" className="h-5 w-5 text-primary" />
                                外观与主题
                            </CardTitle>
                            <CardDescription className="text-white/50">自定义界面视觉体验</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant={mounted && theme === 'dark' ? 'default' : 'outline'}
                                    onClick={() => setTheme('dark')}
                                    className={`border-white/20 text-white hover:bg-white/10 ${mounted && theme === 'dark' ? 'bg-primary border-primary' : 'bg-transparent'}`}
                                >
                                    <Icon icon="mdi:weather-night" className="mr-2 h-4 w-4" />
                                    深色模式
                                </Button>
                                <Button
                                    variant={mounted && theme === 'light' ? 'default' : 'outline'}
                                    onClick={() => setTheme('light')}
                                    className={`border-white/20 text-white hover:bg-white/10 ${mounted && theme === 'light' ? 'bg-primary border-primary' : 'bg-transparent'}`}
                                >
                                    <Icon icon="mdi:weather-sunny" className="mr-2 h-4 w-4" />
                                    浅色模式
                                </Button>
                                <Button
                                    variant={mounted && theme === 'system' ? 'default' : 'outline'}
                                    onClick={() => setTheme('system')}
                                    className={`border-white/20 text-white hover:bg-white/10 ${mounted && theme === 'system' ? 'bg-primary border-primary' : 'bg-transparent'}`}
                                >
                                    <Icon icon="mdi:theme-light-dark" className="mr-2 h-4 w-4" />
                                    跟随系统
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
