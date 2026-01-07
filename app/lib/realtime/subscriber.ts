/**
 * Supabase Realtime 订阅管理器
 * 提供项目和 Prompt 数据的实时订阅功能
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** 连接状态 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/** 订阅事件类型 */
export type SubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/** 变更回调数据 */
export interface ChangePayload<T> {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T | null;
    old: T | null;
}

/** 订阅回调 */
export type SubscriptionCallback<T> = (payload: ChangePayload<T>) => void;

/**
 * 创建表订阅
 */
export function subscribeToTable<T>(
    table: string,
    callback: SubscriptionCallback<T>,
    options?: {
        event?: SubscriptionEvent;
        filter?: string;
    }
): RealtimeChannel {
    const { event = '*', filter } = options || {};

    const channel = supabase.channel(`${table}-changes`);

    // 使用 any 类型绕过 SDK 类型问题
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (channel as any).on(
        'postgres_changes',
        {
            event,
            schema: 'public',
            table,
            filter,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
            callback({
                eventType: payload.eventType,
                new: payload.new,
                old: payload.old,
            });
        }
    );

    channel.subscribe();

    return channel;
}

/**
 * 取消订阅
 */
export function unsubscribe(channel: RealtimeChannel): Promise<'ok' | 'timed out' | 'error'> {
    return supabase.removeChannel(channel);
}

/**
 * React Hook: 订阅项目表变更
 */
export function useRealtimeProjects<T>(callback: SubscriptionCallback<T>) {
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const channelRef = useRef<RealtimeChannel | null>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const channel = supabase.channel('projects-realtime');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (channel as any).on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'projects',
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (payload: any) => {
                callbackRef.current({
                    eventType: payload.eventType,
                    new: payload.new,
                    old: payload.old,
                });
            }
        );

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setStatus('connected');
            } else if (status === 'CLOSED') {
                setStatus('disconnected');
            } else if (status === 'CHANNEL_ERROR') {
                setStatus('error');
            }
        });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    return { status };
}

/**
 * React Hook: 订阅 Prompt 表变更
 */
export function useRealtimePrompts<T>(callback: SubscriptionCallback<T>) {
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const channelRef = useRef<RealtimeChannel | null>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const channel = supabase.channel('prompts-realtime');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (channel as any)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'prompts',
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload: any) => {
                    callbackRef.current({
                        eventType: payload.eventType,
                        new: payload.new,
                        old: payload.old,
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'prompt_repos',
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload: any) => {
                    callbackRef.current({
                        eventType: payload.eventType,
                        new: payload.new,
                        old: payload.old,
                    });
                }
            );

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setStatus('connected');
            } else if (status === 'CLOSED') {
                setStatus('disconnected');
            } else if (status === 'CHANNEL_ERROR') {
                setStatus('error');
            }
        });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    return { status };
}

/**
 * React Hook: 通用表订阅
 */
export function useRealtimeTable<T>(
    table: string,
    callback: SubscriptionCallback<T>,
    options?: {
        event?: SubscriptionEvent;
        filter?: string;
        enabled?: boolean;
    }
) {
    const { event = '*', filter, enabled = true } = options || {};
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const channelRef = useRef<RealtimeChannel | null>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled) {
            if (status !== 'disconnected') {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setStatus('disconnected');
            }
            return;
        }

        const channelName = filter
            ? `${table}-${filter}-realtime`
            : `${table}-realtime`;

        const channel = supabase.channel(channelName);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (channel as any).on(
            'postgres_changes',
            {
                event,
                schema: 'public',
                table,
                filter,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (payload: any) => {
                callbackRef.current({
                    eventType: payload.eventType,
                    new: payload.new,
                    old: payload.old,
                });
            }
        );

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setStatus('connected');
            } else if (status === 'CLOSED') {
                setStatus('disconnected');
            } else if (status === 'CHANNEL_ERROR') {
                setStatus('error');
            }
        });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [table, event, filter, enabled, status]);

    const reconnect = useCallback(() => {
        if (channelRef.current) {
            channelRef.current.subscribe();
        }
    }, []);

    return { status, reconnect };
}
