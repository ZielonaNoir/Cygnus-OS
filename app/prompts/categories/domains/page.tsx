'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Icon } from '@/app/components/Icon';
import { toast } from '@/app/lib/toast';
import { ShinyTitle } from '@/app/components/reactbits/ShinyTitle';
import { useCategories, Domain } from '@/app/lib/prompts/categories';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';

export default function DomainsManagerPage() {
  const { domains, isLoading, error, refetch } = useCategories();

  const [createName, setCreateName] = React.useState('');
  const [editingDomain, setEditingDomain] = React.useState<Domain | null>(null);
  const [renameTo, setRenameTo] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 创建 Domain
  const createDomain = async () => {
    if (!createName.trim()) return toast.error('请输入 Domain 名称');
    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/prompts/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'domain', name: createName.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data?.error || '创建失败');
      toast.success('创建成功', `Domain：${createName.trim()}`);
      setCreateName('');
      await refetch();
    } catch (e) {
      toast.error('创建失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重命名 Domain
  const handleRename = async () => {
    if (!editingDomain) return;
    if (!renameTo.trim()) return toast.error('请输入新名称');
    
    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/prompts/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'domain', oldName: editingDomain.label, newName: renameTo.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data?.error || '重命名失败');
      toast.success('重命名成功', `${editingDomain.label} → ${renameTo.trim()}`);
      setEditingDomain(null);
      setRenameTo('');
      await refetch();
    } catch (e) {
      toast.error('重命名失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除 Domain
  const handleDelete = async (domain: Domain, force: boolean = false) => {
    const msg = force
      ? `确定要强制删除 Domain「${domain.label}」吗？将删除其下所有 Scenario/Prompt，且不可恢复。`
      : `确定要删除 Domain「${domain.label}」吗？（若不为空会被拒绝）`;
    
    if (!confirm(msg)) return;

    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/prompts/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'domain', name: domain.label, force }),
      });
      const data = await resp.json();
      
      // 如果删除失败且提示不为空，询问是否强制删除
      if (!resp.ok && data?.error?.includes('不为空')) {
        if (confirm(`Domain「${domain.label}」不为空，是否强制删除？`)) {
          await handleDelete(domain, true); // 递归调用强制删除
          return;
        }
      }

      if (!resp.ok || !data?.ok) throw new Error(data?.error || '删除失败');
      toast.success('删除成功', `Domain：${domain.label}`);
      setEditingDomain(null);
      await refetch();
    } catch (e) {
      toast.error('删除失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-background/50 p-8 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShinyTitle text="Domain 管理" className="text-3xl" as="h1" />
            <p className="mt-2 text-muted-foreground">一级分类维护：创建 / 重命名 / 删除 Domain。</p>
          </motion.div>
          <Button asChild variant="outline" className="border-primary/20 hover:bg-primary/5">
            <Link href="/prompts/categories">
              <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-2" />
              返回 分类管理
            </Link>
          </Button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Create & Edit Form */}
          <div className="lg:col-span-4 space-y-6">
            {/* Create Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/30 backdrop-blur-sm sticky top-8">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Icon icon="mdi:folder-plus" className="h-5 w-5 text-primary" />
                    新建 Domain
                  </CardTitle>
                  <CardDescription>创建 `data/prompts/{`{Domain}`}` 目录</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="例如：Coding"
                      className="bg-background/50 border-primary/20 focus:border-primary/50 transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && createDomain()}
                    />
                    <p className="text-xs text-muted-foreground">
                      仅允许字母开头，可包含字母/数字/连字符/下划线。
                    </p>
                  </div>
                  <Button 
                    onClick={createDomain} 
                    disabled={isSubmitting || isLoading}
                    className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-none hover:shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all"
                  >
                    <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                    立即创建
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-8">
            <Card className="border-border/50 bg-card/30 backdrop-blur-sm min-h-[500px]">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Icon icon="mdi:folder-tree" className="h-5 w-5 text-primary" />
                  Domain 列表
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-normal text-primary">
                    {domains.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-white/5" />
                    ))}
                  </div>
                ) : domains.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
                    <Icon icon="mdi:folder-open-outline" className="h-16 w-16 mb-4 opacity-50" />
                    <p>暂无 Domain，请在左侧创建</p>
                  </div>
                ) : (
                  <motion.div layout className="space-y-3">
                    <AnimatePresence mode='popLayout'>
                      {domains.map((d) => (
                        <motion.div
                          layout
                          key={d.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={cn(
                            "group relative flex items-center justify-between rounded-lg border p-3 transition-all duration-200",
                            editingDomain?.id === d.id 
                              ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                              : "bg-background/40 border-border/50 hover:border-primary/30 hover:bg-background/60"
                          )}
                        >
                          {/* List Item Content */}
                          {editingDomain?.id === d.id ? (
                            <div className="flex flex-1 items-center gap-2 animate-in fade-in zoom-in duration-200">
                              <Input
                                value={renameTo}
                                onChange={(e) => setRenameTo(e.target.value)}
                                className="h-8 bg-background/80"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRename();
                                  if (e.key === 'Escape') setEditingDomain(null);
                                }}
                              />
                              <Button size="sm" onClick={handleRename} disabled={isSubmitting}>
                                <Icon icon="mdi:check" className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingDomain(null)}>
                                <Icon icon="mdi:close" className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                                  <Icon icon="mdi:folder" className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{d.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {d.scenarios.length} Scenarios
                                  </div>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10"
                                  onClick={() => {
                                    setEditingDomain(d);
                                    setRenameTo(d.label);
                                  }}
                                >
                                  <Icon icon="mdi:pencil" className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(d)}
                                >
                                  <Icon icon="mdi:trash-can-outline" className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
