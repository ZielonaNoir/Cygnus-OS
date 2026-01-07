'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { Icon } from '@/app/components/Icon';
import { toast } from '@/app/lib/toast';
import { ShinyTitle } from '@/app/components/reactbits/ShinyTitle';
import { useCategories, Scenario } from '@/app/lib/prompts/categories';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';

export default function ScenariosManagerPage() {
  const { domains, isLoading, error, refetch } = useCategories();

  const [domainId, setDomainId] = React.useState('');
  const [createName, setCreateName] = React.useState('');
  const [editingScenario, setEditingScenario] = React.useState<Scenario | null>(null);
  const [renameTo, setRenameTo] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const domain = React.useMemo(() => domains.find((d) => d.id === domainId) || null, [domains, domainId]);
  const scenarios = React.useMemo(() => domain?.scenarios ?? [], [domain]);

  React.useEffect(() => {
    setEditingScenario(null);
    setRenameTo('');
  }, [domainId]);

  const createScenario = async () => {
    if (!domain) return toast.error('请先选择 Domain');
    if (!createName.trim()) return toast.error('请输入 Scenario 名称');
    
    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/prompts/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'scenario', domain: domain.label, name: createName.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data?.error || '创建失败');
      toast.success('创建成功', `Scenario：${createName.trim()}`);
      setCreateName('');
      await refetch();
    } catch (e) {
      toast.error('创建失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRename = async () => {
    if (!domain || !editingScenario) return;
    if (!renameTo.trim()) return toast.error('请输入新名称');
    
    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/prompts/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'scenario',
          domain: domain.label,
          oldName: editingScenario.label,
          newName: renameTo.trim(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data?.error || '重命名失败');
      toast.success('重命名成功', `${editingScenario.label} → ${renameTo.trim()}`);
      setEditingScenario(null);
      setRenameTo('');
      await refetch();
    } catch (e) {
      toast.error('重命名失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (scenario: Scenario, force: boolean = false) => {
    if (!domain) return;
    
    const msg = force
      ? `确定要强制删除 Scenario「${scenario.label}」吗？将删除其下所有 Prompt，且不可恢复。`
      : `确定要删除 Scenario「${scenario.label}」吗？（若不为空会被拒绝）`;
    
    if (!confirm(msg)) return;

    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/prompts/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'scenario', 
          domain: domain.label, 
          name: scenario.label, 
          force 
        }),
      });
      const data = await resp.json();

      if (!resp.ok && data?.error?.includes('不为空')) {
        if (confirm(`Scenario「${scenario.label}」不为空，是否强制删除？`)) {
          await handleDelete(scenario, true);
          return;
        }
      }

      if (!resp.ok || !data?.ok) throw new Error(data?.error || '删除失败');
      toast.success('删除成功', `Scenario：${scenario.label}`);
      setEditingScenario(null);
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
            <ShinyTitle text="Scenario 管理" className="text-3xl" as="h1" />
            <p className="mt-2 text-muted-foreground">二级分类维护：在指定 Domain 下管理 Scenario。</p>
          </motion.div>
          <Button asChild variant="outline" className="border-primary/20 hover:bg-primary/5">
            <Link href="/prompts/categories">
              <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-2" />
              返回 分类管理
            </Link>
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. Select Domain */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">1</div>
                    选择 Domain
                  </CardTitle>
                  <CardDescription>首先选择归属的业务领域</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={domainId}
                    onChange={(e) => setDomainId(e.target.value)}
                    className="bg-background/50 border-primary/20"
                    disabled={isLoading}
                  >
                    <option value="">{isLoading ? '加载中...' : '请选择 Domain'}</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </Select>
                </CardContent>
              </Card>
            </motion.div>

            {/* 2. Create Scenario */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className={cn(
                "border-border/50 bg-card/30 backdrop-blur-sm transition-opacity duration-300",
                !domainId ? "opacity-50 pointer-events-none" : "opacity-100"
              )}>
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">2</div>
                    新建 Scenario
                  </CardTitle>
                  <CardDescription>创建 `data/prompts/{`{Domain}`}/{`{Scenario}`}`</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="例如：Frontend"
                    className="bg-background/50 border-primary/20"
                    disabled={!domainId}
                    onKeyDown={(e) => e.key === 'Enter' && createScenario()}
                  />
                  <Button 
                    onClick={createScenario} 
                    disabled={isSubmitting || !domainId}
                    className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                  >
                    <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                    创建 Scenario
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
                  Scenario 列表
                  {domain && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-normal text-primary">
                      {scenarios.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!domain ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
                    <Icon icon="mdi:arrow-left" className="h-16 w-16 mb-4 opacity-50" />
                    <p>请先在左侧选择 Domain</p>
                  </div>
                ) : scenarios.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
                    <Icon icon="mdi:folder-open-outline" className="h-16 w-16 mb-4 opacity-50" />
                    <p>该 Domain 下暂无 Scenario</p>
                  </div>
                ) : (
                  <motion.div layout className="space-y-3">
                    <AnimatePresence mode='popLayout'>
                      {scenarios.map((s) => (
                        <motion.div
                          layout
                          key={s.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={cn(
                            "group relative flex items-center justify-between rounded-lg border p-3 transition-all duration-200",
                            editingScenario?.id === s.id
                              ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                              : "bg-background/40 border-border/50 hover:border-primary/30 hover:bg-background/60"
                          )}
                        >
                          {editingScenario?.id === s.id ? (
                            <div className="flex flex-1 items-center gap-2 animate-in fade-in zoom-in duration-200">
                              <Input
                                value={renameTo}
                                onChange={(e) => setRenameTo(e.target.value)}
                                className="h-8 bg-background/80"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRename();
                                  if (e.key === 'Escape') setEditingScenario(null);
                                }}
                              />
                              <Button size="sm" onClick={handleRename} disabled={isSubmitting}>
                                <Icon icon="mdi:check" className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingScenario(null)}>
                                <Icon icon="mdi:close" className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                                  <Icon icon="mdi:folder-outline" className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{s.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {s.count} Prompts
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10"
                                  onClick={() => {
                                    setEditingScenario(s);
                                    setRenameTo(s.label);
                                  }}
                                >
                                  <Icon icon="mdi:pencil" className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(s)}
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
