/**
 * WebSocket 连接状态管理器
 * 提供全局连接状态跟踪和离线检测
 */

'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@lib/supabase/client';

/** 网络状态 */
export type NetworkStatus = 'online' | 'offline';

/** 连接上下文类型 */
interface ConnectionContextType {
    networkStatus: NetworkStatus;
    isSupabaseConnected: boolean;
    lastConnectedAt: Date | null;
    reconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

/**
 * 连接状态 Provider
 */
export function ConnectionProvider({ children }: { children: ReactNode }) {
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
    const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
    const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);

    // 监听浏览器在线状态
    useEffect(() => {
        const handleOnline = () => {
            setNetworkStatus('online');
        };

        const handleOffline = () => {
            setNetworkStatus('offline');
        };

        // 初始状态
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNetworkStatus(navigator.onLine ? 'online' : 'offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 监听 Supabase 连接状态
    useEffect(() => {
        const channel = supabase.channel('connection-status');

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setIsSupabaseConnected(true);
                setLastConnectedAt(new Date());
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                setIsSupabaseConnected(false);
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const reconnect = useCallback(() => {
        const tempChannel = supabase.channel('reconnect-trigger');
        tempChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setIsSupabaseConnected(true);
                setLastConnectedAt(new Date());
                supabase.removeChannel(tempChannel);
            }
        });
    }, []);

    const contextValue: ConnectionContextType = {
        networkStatus,
        isSupabaseConnected,
        lastConnectedAt,
        reconnect,
    };

    return React.createElement(
        ConnectionContext.Provider,
        { value: contextValue },
        children
    );
}

/**
 * React Hook: 获取连接状态
 */
export function useConnection() {
    const context = useContext(ConnectionContext);

    if (!context) {
        return {
            networkStatus: 'online' as NetworkStatus,
            isSupabaseConnected: false,
            lastConnectedAt: null,
            reconnect: () => { },
        };
    }

    return context;
}

/**
 * React Hook: 简单的网络状态检测
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOnline(navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

/**
 * React Hook: 页面可见性检测
 */
export function usePageVisibility() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return isVisible;
}

/**
 * React Hook: 自动刷新数据
 */
export function useAutoRefresh(
    refreshFn: () => void | Promise<void>,
    options?: {
        interval?: number;
        enabled?: boolean;
        refreshOnReconnect?: boolean;
        refreshOnFocus?: boolean;
    }
) {
    const {
        interval = 30000,
        enabled = true,
        refreshOnReconnect = true,
        refreshOnFocus = true,
    } = options || {};

    const isOnline = useNetworkStatus();
    const isVisible = usePageVisibility();

    useEffect(() => {
        if (!enabled || !isOnline) return;

        const timer = setInterval(() => {
            if (isVisible) {
                refreshFn();
            }
        }, interval);

        return () => clearInterval(timer);
    }, [enabled, isOnline, isVisible, interval, refreshFn]);

    useEffect(() => {
        if (refreshOnReconnect && isOnline) {
            refreshFn();
        }
    }, [isOnline, refreshOnReconnect, refreshFn]);

    useEffect(() => {
        if (refreshOnFocus && isVisible && isOnline) {
            refreshFn();
        }
    }, [isVisible, refreshOnFocus, isOnline, refreshFn]);
}
