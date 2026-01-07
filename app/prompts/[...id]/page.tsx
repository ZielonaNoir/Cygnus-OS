'use client';

import * as React from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Icon } from '@/app/components/Icon';
import { toast } from '@/app/lib/toast';
import { PromptEditor } from '@/app/components/prompts/PromptEditor';
import { MarkdownRenderer } from '@/app/components/ui/markdown-renderer';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ShareDialog } from '@/app/components/prompts/ShareDialog';

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
  const [isEditing, setIsEditing] = React.useState(false);
  const [updatedAt, setUpdatedAt] = React.useState<string>('');
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
        setUpdatedAt(new Date().toISOString().slice(0, 10));
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
      setUpdatedAt(new Date().toISOString().slice(0, 10));
      toast.success('保存成功', '已更新 main.prompt');
    } catch (err) {
      console.error(err);
      toast.error('保存失败', '请稍后重试');
    }
  };

  const handleDelete = async () => {
    try {
      const resp = await fetch('/api/prompts/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: promptPath }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data?.error || '删除失败');
      toast.success('删除成功', '该 Prompt 已移至虚空');
      router.push('/prompts');
    } catch (err) {
      console.error(err);
      toast.error('删除失败', '请稍后重试');
    }
  };

  return (
    <div className="h-full bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-foreground truncate">{title}</h1>
            <p className="mt-2 text-xs text-muted-foreground truncate">
              <Icon icon="mdi:folder-outline" className="inline h-4 w-4 mr-1" />
              {promptPath}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(content);
                toast.success('已复制到剪贴板', 'Prompt 内容已复制');
              }}
              disabled={!content}
            >
              <Icon icon="mdi:content-copy" className="h-4 w-4" />
              复制
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing((v) => !v)}
              disabled={isLoading || !!error}
            >
              <Icon icon={isEditing ? 'mdi:eye' : 'mdi:pencil'} className="h-4 w-4" />
              {isEditing ? '预览' : '编辑'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={isLoading || !!error}>
              <Icon icon="mdi:delete-outline" className="h-4 w-4" />
              删除
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:clock-outline" className="h-4 w-4" />
            <span>更新于: {updatedAt || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:code-tags" className="h-4 w-4" />
            <span>版本: 1.0.0</span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Prompt 内容</CardTitle>
              <CardDescription>加载中...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">未找到 Prompt</CardTitle>
              <CardDescription>该条目不存在于 `/data/prompts`</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/50 bg-background/50 p-4 text-sm text-muted-foreground">
                {error}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/prompts')}
                  className="group border-primary/30 bg-card/50 backdrop-blur-sm hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)] transition-all duration-300"
                >
                  <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
                  返回 PromptHub
                </Button>
                <Button onClick={() => window.location.reload()}>
                  <Icon icon="mdi:refresh" className="h-4 w-4" />
                  重试
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isEditing ? (
          <PromptEditor
            initialValue={content}
            language="markdown"
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Prompt 内容</CardTitle>
              <CardDescription>完整的 Prompt 指令文本</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 bg-background/50 p-6">
                <MarkdownRenderer content={content} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <ShareDialog promptPath={promptPath} promptTitle={title}>
            <Button variant="outline" disabled={isLoading || !!error}>
              <Icon icon="mdi:share-variant" className="h-4 w-4" />
              分享
            </Button>
          </ShareDialog>
          <Button
            variant="outline"
            disabled={isLoading || !!error}
            onClick={() => {
              const blob = new Blob([content], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${title}.md`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('导出成功', `${title}.md 已下载`);
            }}
          >
            <Icon icon="mdi:download" className="h-4 w-4" />
            导出
          </Button>
        </div>
      </div>
    </div>
  );
}


