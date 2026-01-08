'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Icon } from '../Icon';
import { Button } from '../ui/button';
import { ThemeToggle } from '../theme-toggle';
import { supabase } from '@/app/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<{ email?: string; avatar_url?: string } | null>(null);

  // 获取当前用户信息
  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url,
        });
      }
    };
    getUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const title = React.useMemo(() => {
    if (!pathname) return 'Cygnus-OS';
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'SIPE 指挥部';
    if (pathname === '/prompts' || pathname.startsWith('/prompts/')) return 'PromptHub';
    if (pathname.startsWith('/prompts/categories')) return '分类管理';
    if (pathname === '/mcp' || pathname.startsWith('/mcp/')) return 'MCP Skills';
    return 'Cygnus-OS';
  }, [pathname]);

  const titleIcon = React.useMemo(() => {
    if (!pathname) return 'mdi:star';
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'mdi:view-dashboard';
    if (pathname.startsWith('/prompts/categories')) return 'mdi:folder-cog';
    if (pathname === '/prompts' || pathname.startsWith('/prompts/')) return 'mdi:book-open-variant';
    if (pathname === '/mcp' || pathname.startsWith('/mcp/')) return 'mdi:puzzle';
    return 'mdi:star';
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-md px-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* 侧边栏切换按钮 - 桌面和移动端都显示 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
        >
          <Icon icon="mdi:menu" className="h-5 w-5" />
        </Button>
        <div className="hidden items-center gap-2 lg:flex">
          <Icon icon={titleIcon} className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative">
          <Icon icon="mdi:bell-outline" className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"></span>
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" suppressHydrationWarning>
              {user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt="Avatar"
                  width={28}
                  height={28}
                  className="rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <Icon icon="mdi:account-circle" className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user && (
              <>
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Icon icon="mdi:cog" className="mr-2 h-4 w-4" />
              设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <Icon icon="mdi:logout" className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
