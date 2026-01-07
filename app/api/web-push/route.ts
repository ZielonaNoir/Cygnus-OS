import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// GET: 也可以用来分发 Public Key（虽然也可以直接环境变量）
export async function GET() {
    return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY });
}

// POST: 保存订阅信息到数据库
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription, user_agent } = await request.json();

    if (!subscription) {
        return NextResponse.json({ error: 'No subscription provided' }, { status: 400 });
    }

    // 检查是否已存在（避免重复）
    const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('subscription->endpoint', subscription.endpoint) // 检查 endpoint 是否相同
        .single();

    if (existing) {
        return NextResponse.json({ message: 'Subscription already exists' });
    }

    const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        subscription: subscription,
        user_agent: user_agent || 'unknown',
    });

    if (error) {
        console.error('Error saving subscription:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

// DELETE: 删除订阅
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
        return NextResponse.json({ error: 'No endpoint provided' }, { status: 400 });
    }

    // 利用 Supabase 的 endpoint 过滤（假设 jsonb 字段查询支持）
    // 注意：Supabase JS 客户端查询 JSONB 对象内部属性语法： .eq('subscription->>endpoint', endpoint)
    const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('subscription->>endpoint', endpoint);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
