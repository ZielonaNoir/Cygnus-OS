'use client';

import * as React from 'react';
import { cn } from '@/app/lib/utils';
import { Input } from './input';
import { Icon } from '../Icon';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  keywords?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  items: CommandItem[];
  placeholder?: string;
  onClose?: () => void;
}

export function CommandPalette({ items, placeholder = '搜索命令或项目...', onClose }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter items based on query
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();
    return items.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const descMatch = item.description?.toLowerCase().includes(lowerQuery);
      const keywordMatch = item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery));
      return titleMatch || descMatch || keywordMatch;
    });
  }, [items, query]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }

      // Escape to close
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
        setQuery('');
        onClose?.();
      }

      // Arrow keys for navigation
      if (open) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
          e.preventDefault();
          filteredItems[selectedIndex].action();
          setOpen(false);
          setQuery('');
          onClose?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredItems, selectedIndex, onClose]);

  // Focus input when opened
  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Reset selected index when query changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          setOpen(false);
          onClose?.();
        }}
      />

      {/* Command Palette */}
      <div className="fixed left-1/2 top-1/4 z-50 w-full max-w-2xl -translate-x-1/2 transform">
        <div className="mx-4 rounded-xl border border-border/50 bg-card/95 backdrop-blur-md shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-border/50 p-4">
            <Icon icon="mdi:magnify" className="h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="border-0 bg-transparent focus-visible:ring-0"
            />
            <kbd className="hidden rounded border border-border/50 bg-muted px-2 py-1 text-xs font-mono text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                未找到匹配的命令
              </div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setOpen(false);
                      setQuery('');
                      onClose?.();
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all',
                      'hover:bg-accent/50 hover:text-accent-foreground',
                      selectedIndex === index
                        ? 'bg-primary/20 text-primary shadow-sm'
                        : 'text-foreground'
                    )}
                  >
                    {item.icon && (
                      <Icon icon={item.icon} className="h-5 w-5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

