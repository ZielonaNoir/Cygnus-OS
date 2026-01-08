'use client';

import * as React from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Icon } from '@/app/components/Icon';
import { toast } from '@/app/lib/toast';
import { PromptEditor } from '@/app/components/prompts/PromptEditor';
import { MarkdownRenderer } from '@/app/components/ui/markdown-renderer';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ShareDialog } from '@/app/components/prompts/ShareDialog';
import { VersionHistory } from '@/app/components/prompts/VersionHistory';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

interface PromptDetailPageProps {
  params: Promise<{ id: string[] }>;
}

type ReadResponse =
  | {
    ok: true;
    path: string;
    mainPrompt: string;
    context: string | null;
    config: string | null;
    id: string;
  }
  | { ok: false; error: string };

function decodeSegments(segments: string[]): string[] {
  return segments.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
}

export default function PromptDetailPage({ params }: PromptDetailPageProps) {
  const { id: rawSegments } = use(params);
  const router = useRouter();

  const segments = React.useMemo(() => decodeSegments(rawSegments), [rawSegments]);
  const promptPath = React.useMemo(() => segments.join('/'), [segments]);
  const title = React.useMemo(() => segments[segments.length - 1] ?? 'Prompt', [segments]);

  const [content, setContent] = React.useState<string>('');
  const [promptId, setPromptId] = React.useState<string>('');
  const [isEditing, setIsEditing] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError('');
        const resp = await fetch(`/api/prompts/read?path=${encodeURIComponent(promptPath)}`);
        const data: ReadResponse = await resp.json();
        if (!resp.ok || !('ok' in data) || !data.ok) {
          throw new Error(('error' in data && data.error) || '加载失败');
        }
        if (!mounted) return;
        setContent(data.mainPrompt);
        setPromptId(data.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '加载失败';
        if (!mounted) return;
        setError(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [promptPath]);

  const handleSave = async (newContent: string) => {
    try {
      const resp = await fetch('/api/prompts/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: promptPath, mainPrompt: newContent }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data?.error || '保存失败');
      setContent(newContent);
      setIsEditing(false);
      setIsEditing(false);
      toast.success('保存成功', '已更新 main.prompt');
    } catch (err) {
      console.error(err);
      toast.error('保存失败', '请稍后重试');
    }
  };

  const handleRevert = async (versionId: string) => {
    try {
      const resp = await fetch('/api/prompts/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, versionId })
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || '回滚失败');

      toast.success('回滚成功', '已恢复到选定版本');
      // Reload content
      window.location.reload();
    } catch (e) {
      console.error(e);
      toast.error('回滚失败', e instanceof Error ? e.message : '未知错误');
    }
  };



  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col p-8 space-y-8 bg-background/50">
        <Skeleton className="h-20 w-full max-w-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <Icon icon="mdi:alert-circle" className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">未找到 Prompt</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/prompts')}>返回列表</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Sticky Header with Glassmorphism */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background/80 px-3 md:px-6 py-3 md:py-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-xl font-bold tracking-tight truncate">{title}</h1>
              <Badge variant="outline" className="hidden sm:flex text-xs font-mono text-muted-foreground bg-muted/50 border-0">
                v1.0.0
              </Badge>
            </div>
            <div className="hidden md:flex items-center text-xs text-muted-foreground truncate font-mono opacity-70">
              <Icon icon="mdi:folder-outline" className="mr-1 h-3.5 w-3.5" />
              {promptPath}
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <VersionHistory promptId={promptId} onRevert={handleRevert} />

          <div className="h-6 w-px bg-border/50 mx-2" />

          <ShareDialog promptPath={promptPath} promptTitle={title}>
            <Button variant="ghost" size="icon" title="分享">
              <Icon icon="mdi:share-variant" className="h-5 w-5 opacity-70" />
            </Button>
          </ShareDialog>

          <Button variant="ghost" size="icon" title="导出" onClick={() => {
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.md`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('导出成功');
          }}>
            <Icon icon="mdi:download" className="h-5 w-5 opacity-70" />
          </Button>

          <div className="h-6 w-px bg-border/50 mx-2" />

          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>取消</Button>
              {/* Save button handled inside Editor? Or we can trigger it from outside ref. 
                        For now, PromptEditor has internal save button if showToolbar is true. 
                        Let's keep using PromptEditor's internal toolbar or lift state. 
                        Actually, PromptEditor internal save button is "Save". 
                        We will toggle "isEditing" here and let PromptEditor handle the rest.
                    */}
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
              <Icon icon="mdi:pencil" className="mr-2 h-4 w-4" />
              编辑 Prompt
            </Button>
          )}
        </div>

        {/* Mobile Actions - Dropdown Menu */}
        <div className="flex md:hidden items-center gap-1">
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} size="sm" variant="default" className="h-8 text-xs">
              <Icon icon="mdi:pencil" className="mr-1 h-3.5 w-3.5" />
              编辑
            </Button>
          )}
          {isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 text-xs">
              取消
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="mdi:dots-vertical" className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => {
                const blob = new Blob([content], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title}.md`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('导出成功');
              }}>
                <Icon icon="mdi:download" className="mr-2 h-4 w-4" />
                导出 Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                toast.info('请在桌面版访问完整分享功能');
              }}>
                <Icon icon="mdi:share-variant" className="mr-2 h-4 w-4" />
                分享
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                toast.info('请在桌面版访问版本历史');
              }}>
                <Icon icon="mdi:history" className="mr-2 h-4 w-4" />
                版本历史
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area - Full Width/Height */}
      <main className="flex-1 overflow-y-auto">
        {isEditing ? (
          <div className="h-full px-3 md:px-6 py-4 md:py-6">
            <PromptEditor
              initialValue={content}
              language="markdown"
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              promptId={promptId}
              height="100%"
              showToolbar={true}
              title=""
            />
          </div>
        ) : (
          <ScrollArea className="h-full w-full">
            <div className="max-w-[1200px] mx-auto p-4 md:p-8 lg:p-12">
              <div className="prose prose-invert prose-lg max-w-none prose-headings:font-semibold prose-a:text-primary">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
}
