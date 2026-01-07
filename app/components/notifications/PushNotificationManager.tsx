'use client';

import * as React from 'react';
import { Button } from '@/app/components/ui/button';
import { Icon } from '@/app/components/Icon';
import { toast } from 'sonner';

// Helper to encode VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = React.useState(false);
    const [subscription, setSubscription] = React.useState<PushSubscription | null>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    async function subscribeToPush() {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!publicKey) {
                throw new Error('VAPID public key not found');
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            setSubscription(sub);

            // Send to server
            await fetch('/api/web-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: sub,
                    user_agent: navigator.userAgent
                }),
            });

            toast.success('已开启推送通知');
        } catch (error) {
            console.error('Subscription failed:', error);
            toast.error('开启通知失败，请检查浏览器设置');
        } finally {
            setLoading(false);
        }
    }

    async function unsubscribeFromPush() {
        setLoading(true);
        try {
            if (subscription) {
                await subscription.unsubscribe();

                // Notify server
                await fetch('/api/web-push', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });

                setSubscription(null);
                toast.success('已关闭推送通知');
            }
        } catch (error) {
            console.error('Unsubscribe failed:', error);
        } finally {
            setLoading(false);
        }
    }

    async function sendTestNotification() {
        try {
            await fetch('/api/web-push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: '测试通知',
                    body: '恭喜！您的 Cygnus-OS 系统通知工作正常。',
                }),
            });
            toast.info('测试通知已发送');
        } catch (error) {
            console.error(error);
        }
    }

    if (!isSupported) {
        return null; // Don't verify/render on unsupported devices
    }

    return (
        <div className="flex items-center gap-2">
            {!subscription ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={subscribeToPush}
                    disabled={loading}
                    className="gap-2"
                >
                    <Icon icon="mdi:bell-off-outline" className="h-4 w-4" />
                    开启通知
                </Button>
            ) : (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={unsubscribeFromPush}
                        title="关闭通知"
                    >
                        <Icon icon="mdi:bell-check" className="h-5 w-5 text-primary" />
                    </Button>

                    <Button variant="ghost" size="sm" onClick={sendTestNotification}>
                        发送测试
                    </Button>
                </div>
            )}
        </div>
    );
}
