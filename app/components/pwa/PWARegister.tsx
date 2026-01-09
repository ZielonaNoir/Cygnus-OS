'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { cn } from '@/app/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);

  React.useEffect(() => {
    const isDev = process.env.NODE_ENV !== 'production';

    // 开发环境：不注册 SW，并尝试注销旧 SW / 清理缓存，避免 Turbopack ChunkLoadError
    if (isDev) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister());
        });
      }

      if (typeof window !== 'undefined' && 'caches' in window) {
        window.caches.keys().then((keys) => {
          keys
            .filter((k) => k.startsWith('cygnus-os-'))
            .forEach((k) => window.caches.delete(k));
        });
      }

      setShowInstallPrompt(false);
      return;
    }

    // 生产环境：注册 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    // 监听 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 检查是否已安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform',
        'rounded-xl border border-border/50 bg-card/95 backdrop-blur-md p-4 shadow-2xl',
        'flex items-center gap-4'
      )}
    >
      <Image 
        src="/icons/icon-192x192.png" 
        alt="Cygnus-OS" 
        width={48}
        height={48}
        className="rounded-2xl shadow-sm" 
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">安装 Cygnus-OS</p>
        <p className="text-xs text-muted-foreground">
          添加到主屏幕以获得更好的体验
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInstallPrompt(false)}
        >
          稍后
        </Button>
        <Button size="sm" onClick={handleInstallClick}>
          安装
        </Button>
      </div>
    </div>
  );
}
