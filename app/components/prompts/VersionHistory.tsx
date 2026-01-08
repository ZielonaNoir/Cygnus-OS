'use client';

import * as React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from '@/app/components/ui/sheet';
import { Button } from '@/app/components/ui/button';
import { Icon } from '@/app/components/Icon';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/app/lib/supabase/client';
import { toast } from 'sonner';

interface Version {
    id: string;
    version: string;
    created_at: string;
    summary?: string;
}

interface VersionHistoryProps {
    promptId: string;
    versions?: Version[];
    onRevert: (versionId: string) => void;
    children?: React.ReactNode;
}

export function VersionHistory({ promptId, versions: initialVersions, onRevert, children }: VersionHistoryProps) {
    const [fetchedVersions, setFetchedVersions] = React.useState<Version[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [revertingId, setRevertingId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!promptId) return;

        const fetchVersions = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data, error } = await supabase
                .from('prompt_versions')
                .select('*')
                .eq('prompt_id', promptId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[VersionHistory] Error fetching versions:', error);
                toast.error('无法加载历史版本');
            } else {
                setFetchedVersions(data || []);
            }
            setLoading(false);
        };

        fetchVersions();
    }, [promptId]);

    const versions = initialVersions || fetchedVersions;

    const handleRevertClick = async (version: Version) => {
        if (confirm(`确认要回滚到版本 v${version.version} 吗？\n此操作将创建一个新的版本记录。`)) {
            setRevertingId(version.id);
            try {
                await onRevert(version.id);
                // onRevert usually triggers a reload or state update
            } catch (error) {
                console.error('Revert failed:', error);
                toast.error('回滚失败');
                setRevertingId(null);
            }
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" title="版本历史" className="hover:bg-primary/10 hover:text-primary transition-colors duration-300">
                        <Icon icon="mdi:history" className="h-5 w-5" />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] border-l-0 bg-background/80 backdrop-blur-xl shadow-2xl">
                <SheetHeader className="pb-6 border-b border-border/40">
                    <SheetTitle className="text-2xl font-light tracking-tight flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Icon icon="mdi:timeline-clock-outline" className="h-6 w-6" />
                        </span>
                        版本时光机
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground/80">
                        追溯 Prompt 的演进历程，随时重返高光时刻
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-140px)] w-full mt-6 pr-6">
                    <div className="relative ml-4 space-y-8 pl-8 before:absolute before:inset-y-0 before:left-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                        <AnimatePresence>
                            {loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2"
                                >
                                    <Icon icon="line-md:loading-loop" className="h-8 w-8 text-primary/50" />
                                    <span className="text-xs tracking-widest uppercase">Loading History</span>
                                </motion.div>
                            ) : (
                                versions.map((v, index) => (
                                    <motion.div
                                        key={v.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
                                        className="relative group"
                                    >
                                        {/* Timeline Dot */}
                                        <div className={`
                                            absolute -left-[39px] top-1.5 h-4 w-4 rounded-full border-4 border-background transition-all duration-300 z-10
                                            ${index === 0
                                                ? 'bg-primary ring-4 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-110'
                                                : 'bg-muted-foreground/30 group-hover:bg-primary/50 group-hover:scale-110'}
                                        `} />

                                        {/* Card Content */}
                                        <div className={`
                                            rounded-xl border p-4 transition-all duration-300
                                            ${index === 0
                                                ? 'bg-gradient-to-br from-primary/5 to-transparent border-primary/20 shadow-lg shadow-primary/5'
                                                : 'bg-card/50 hover:bg-card hover:shadow-md hover:border-primary/20 border-border/40'}
                                        `}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className={`
                                                        font-mono text-sm font-bold tracking-wider px-2 py-0.5 rounded-md
                                                        ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                                                    `}>
                                                        v{v.version}
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-muted-foreground/70 font-mono">
                                                    {format(new Date(v.created_at), 'yyyy/MM/dd HH:mm', { locale: zhCN })}
                                                </span>
                                            </div>

                                            <p className="text-sm text-foreground/80 leading-relaxed mb-4 pl-1">
                                                {v.summary || '暂无版本描述'}
                                            </p>

                                            {index !== 0 && (
                                                <div className="flex justify-end pt-2 border-t border-dashed border-border/50">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={revertingId === v.id}
                                                        onClick={() => handleRevertClick(v)}
                                                        className="h-8 text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-colors group/btn"
                                                    >
                                                        {revertingId === v.id ? (
                                                            <Icon icon="line-md:loading-loop" className="h-3.5 w-3.5 mr-1" />
                                                        ) : (
                                                            <Icon icon="mdi:restore" className="h-3.5 w-3.5 mr-1 group-hover/btn:-rotate-180 transition-transform duration-500" />
                                                        )}
                                                        {revertingId === v.id ? '回滚中...' : '回溯至此版本'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
