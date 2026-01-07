import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import webPush from 'web-push';

webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, url } = await request.json();

    // 获取用户的所有订阅
    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', user.id);

    if (error || !subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
        title: title || 'Cygnus-OS Notification',
        body: body || 'Hello from the system!',
        url: url || '/dashboard',
        icon: '/icons/icon-192x192.png'
    });

    const promises = subscriptions.map((sub) =>
        webPush.sendNotification(sub.subscription, payload).catch((err) => {
            console.error('Error sending notification:', err);
            // 如果收到 410 Gone，说明用户已取消订阅或订阅失效，应该从数据库删除（这里简化处理暂不删除）
        })
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true, count: promises.length });
}
