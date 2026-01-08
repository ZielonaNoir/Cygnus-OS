'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Icon } from '../Icon';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

const navigationItems = [
  {
    name: 'SIPE 指挥部',
    href: '/dashboard',
    icon: 'mdi:view-dashboard',
    description: '项目总览 · 进度与健康度',
  },
  {
    name: 'PromptHub',
    href: '/prompts',
    icon: 'mdi:book-open-variant',
    description: 'Prompt 资产库 · 编辑与检索',
  },
  {
    name: '分类管理',
    href: '/prompts/categories',
    icon: 'mdi:folder-cog',
    description: '维护 Domain / Scenario 分类',
  },
  {
    name: 'MCP Skills',
    href: '/dashboard/mcp',
    icon: 'mdi:puzzle',
    description: '技能市场 · MCP 能力挂载',
  },
];

export function Sidebar({ isOpen, onToggle, onClose }: SidebarProps) {
  const pathname = usePathname();

  // 点击遮罩层关闭侧边栏
  const handleOverlayClick = React.useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      onToggle();
    }
  }, [onClose, onToggle]);

  const sidebarVariants: Variants = {
    open: {
      width: 256,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    closed: {
      width: 80,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  };

  return (
    <>
      {/* Overlay for mobile - 点击关闭侧边栏 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-card/95 backdrop-blur-md border-r border-border/50',
          'hidden lg:flex flex-col overflow-hidden shadow-xl shadow-black/5'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center px-4 border-b border-border/50 relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="full-logo"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 shrink-0">
                    <Icon icon="mdi:star" className="h-5 w-5 text-primary" />
                  </div>
                  <h1 className="text-lg font-semibold text-foreground whitespace-nowrap">Cygnus-OS</h1>
                </motion.div>
              ) : (
                <motion.div
                  key="icon-logo"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex justify-center"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                    <Icon icon="mdi:star" className="h-5 w-5 text-primary" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-3">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative group block"
                >
                  <motion.div
                    className={cn(
                      'relative flex items-center rounded-lg px-3 py-2.5 transition-colors duration-200 z-10',
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Active Background */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-bg"
                        className="absolute inset-0 rounded-lg bg-primary/15 border border-primary/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    <div className={cn(
                      "relative z-10 flex items-center w-full",
                      isOpen ? "gap-3" : "justify-center"
                    )}>
                      <Icon icon={item.icon} className="h-5 w-5 shrink-0" />

                      <AnimatePresence mode="popLayout">
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 min-w-0 overflow-hidden"
                          >
                            <div className="font-medium truncate leading-none">{item.name}</div>
                            {item.description && (
                              <div className="text-[10px] text-muted-foreground/70 truncate mt-1 leading-tight">
                                {item.description}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border/50 p-4 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="full-footer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-xs text-muted-foreground flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground/80">Cygnus-OS</p>
                    <p className="mt-0.5 opacity-70">v0.1.0 Beta</p>
                  </div>
                  <Icon icon="mdi:server-network" className="h-4 w-4 opacity-50" />
                </motion.div>
              ) : (
                <motion.div
                  key="icon-footer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex justify-center"
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-500/50 animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar (Simplified for now, reusing motion logic) */}
      <motion.aside
        initial={false}
        animate={isOpen ? { x: 0 } : { x: "-100%" }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-card/95 backdrop-blur-md border-r border-border/50 lg:hidden',
          'flex flex-col shadow-xl'
        )}
      >
        <div className="flex h-16 items-center px-4 border-b border-border/50 justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Icon icon="mdi:star" className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Cygnus-OS</h1>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon icon="mdi:close" className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-2 p-3">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} className="block" onClick={onClose}>
                <div className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200',
                  isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}>
                  <Icon icon={item.icon} className="h-5 w-5 shrink-0" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-70 mt-0.5">{item.description}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
}
