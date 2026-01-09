'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Icon } from './Icon';
import { Input } from './ui/input';

interface CommandItem {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    action: () => void;
}

type PromptItem = {
    id: string;
    label: string;
    domain: string;
    scenario: string;
    name: string;
    hasContext: boolean;
};

type ListResponse =
    | { ok: true; items: PromptItem[] }
    | { ok: false; error: string };

export function GlobalSearch() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [items, setItems] = React.useState<CommandItem[]>([]);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Fetch prompts on mount (or when opened to be fresher?)
    // Let's fetch when opened to avoid unnecessary load, or pre-fetch if optimizing.
    // For now, fetch once on mount to keep it snappy.
    React.useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const resp = await fetch('/api/prompts/list');
                const data: ListResponse = await resp.json();
                if (data.ok) {
                    const promptItems: CommandItem[] = data.items.map(p => ({
                        id: p.id,
                        title: p.label,
                        description: `${p.domain} / ${p.scenario}`,
                        icon: p.hasContext ? 'mdi:file-document-edit-outline' : 'mdi:file-document-outline',
                        action: () => router.push(`/prompts/${p.id.split('/').map(encodeURIComponent).join('/')}`),
                    }));
                    
                    // Add some static commands
                    const staticItems: CommandItem[] = [
                        {
                            id: 'nav-dashboard',
                            title: 'Go to Dashboard',
                            description: 'SIPE 指挥部',
                            icon: 'mdi:view-dashboard',
                            action: () => router.push('/dashboard'),
                        },
                        {
                            id: 'nav-prompts',
                            title: 'Go to PromptHub',
                            description: 'Prompt 资产库',
                            icon: 'mdi:book-open-variant',
                            action: () => router.push('/prompts'),
                        },
                        {
                            id: 'nav-new-prompt',
                            title: 'Create New Prompt',
                            description: '新建 Prompt',
                            icon: 'mdi:plus-circle',
                            action: () => router.push('/prompts/new'),
                        },
                    ];

                    setItems([...staticItems, ...promptItems]);
                }
            } catch (error) {
                console.error('Failed to fetch prompts for global search', error);
            }
        };

        fetchPrompts();
    }, [router]);

    // Filter items
    const filteredItems = React.useMemo(() => {
        if (!query.trim()) return items.slice(0, 10); // Show helpful defaults if empty
        const lowerQuery = query.toLowerCase();
        return items.filter((item) => {
            return (
                item.title.toLowerCase().includes(lowerQuery) ||
                item.description?.toLowerCase().includes(lowerQuery)
            );
        }).slice(0, 20); // Limit results for performance
    }, [items, query]);

    // Keyboard bindings
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }

            if (open) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setOpen(false);
                    setQuery('');
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredItems[selectedIndex]) {
                        filteredItems[selectedIndex].action();
                        setOpen(false);
                        setQuery('');
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, filteredItems, selectedIndex]);

    // Reset selection on query change
    React.useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Auto focus
    React.useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-all" onClick={() => setOpen(false)}>
            <div className="fixed left-1/2 top-1/4 w-full max-w-2xl -translate-x-1/2 -translate-y-1/4 p-4" onClick={e => e.stopPropagation()}>
                <div className="overflow-hidden rounded-xl border border-border/50 bg-card/95 shadow-2xl backdrop-blur-md ring-1 ring-white/10">
                    <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                        <Icon icon="mdi:magnify" className="h-5 w-5 text-muted-foreground/70" />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type a command or search prompts..."
                            className="border-0 bg-transparent p-0 text-lg placeholder:text-muted-foreground/50 focus-visible:ring-0"
                        />
                        <div className="flex items-center gap-1">
                            <kbd className="hidden rounded bg-muted/50 px-2 py-1 text-xs font-mono text-muted-foreground sm:inline-block">ESC</kbd>
                        </div>
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {filteredItems.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">
                                No results found.
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
                                        }}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                                            index === selectedIndex ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50'
                                        )}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-md",
                                            index === selectedIndex ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Icon icon={item.icon || 'mdi:circle-outline'} className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{item.title}</div>
                                            {item.description && (
                                                <div className={cn(
                                                    "text-xs truncate",
                                                    index === selectedIndex ? "text-primary/70" : "text-muted-foreground"
                                                )}>
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="border-t border-border/50 px-4 py-2 text-xs text-muted-foreground flex justify-between">
                         <span><kbd className="font-sans">↑↓</kbd> to navigate</span>
                         <span><kbd className="font-sans">↵</kbd> to select</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
