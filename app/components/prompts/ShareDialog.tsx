'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Icon } from '@/app/components/Icon';
import { toast } from '@/app/lib/toast';

interface ShareDialogProps {
  promptPath: string;
  promptTitle: string;
  children: React.ReactNode;
}

export function ShareDialog({ promptPath, promptTitle, children }: ShareDialogProps) {
  const [open, setOpen] = React.useState(false);

  // 生成不同类型的分享链接
  const links = React.useMemo(() => {
    const encodedPath = promptPath.split('/').map(encodeURIComponent).join('/');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    return {
      // Cygnus 协议链接（用于 CLI 或桌面应用）
      cygnus: `cygnus://prompts/${encodedPath}`,
      // Web 链接
      web: `${baseUrl}/prompts/${encodedPath}`,
      // Markdown 格式
      markdown: `[${promptTitle}](${baseUrl}/prompts/${encodedPath})`,
    };
  }, [promptPath, promptTitle]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制', `${label}已复制到剪贴板`);
    } catch {
      toast.error('复制失败', '请手动复制链接');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:share-variant" className="h-5 w-5 text-primary" />
            分享 Prompt
          </DialogTitle>
          <DialogDescription>
            选择一种链接格式分享给他人
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cygnus 协议链接 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Icon icon="mdi:link-variant" className="h-4 w-4 text-primary" />
              Cygnus 协议
              <span className="text-xs text-muted-foreground">(CLI / 桌面应用)</span>
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={links.cygnus}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(links.cygnus, 'Cygnus 链接')}
              >
                <Icon icon="mdi:content-copy" className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Web 链接 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Icon icon="mdi:web" className="h-4 w-4 text-primary" />
              Web 链接
              <span className="text-xs text-muted-foreground">(浏览器访问)</span>
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={links.web}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(links.web, 'Web 链接')}
              >
                <Icon icon="mdi:content-copy" className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Markdown 链接 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Icon icon="mdi:language-markdown" className="h-4 w-4 text-primary" />
              Markdown 格式
              <span className="text-xs text-muted-foreground">(文档引用)</span>
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={links.markdown}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(links.markdown, 'Markdown 链接')}
              >
                <Icon icon="mdi:content-copy" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="flex justify-between border-t border-border/50 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(links.web, 'Web 链接')}
          >
            <Icon icon="mdi:content-copy" className="h-4 w-4 mr-2" />
            一键复制 Web 链接
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

