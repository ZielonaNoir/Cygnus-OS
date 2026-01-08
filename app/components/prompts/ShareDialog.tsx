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
import { Icon } from '@/app/components/Icon';
import { LinkGenerator } from '@/app/lib/sharing/link-generator';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareDialogProps {
  promptPath: string;
  promptTitle: string;
  children: React.ReactNode;
}

interface ShareOption {
  id: string;
  label: string;
  desc: string;
  icon: string;
  value: string;
  color: string;
}

export function ShareDialog({ promptPath, promptTitle, children }: ShareDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const links = React.useMemo(() => ({
    cygnus: LinkGenerator.generateDeepLink('prompt', promptPath),
    web: LinkGenerator.generateWebLink('prompt', promptPath),
    markdown: LinkGenerator.generateMarkdown(promptTitle, 'prompt', promptPath),
  }), [promptPath, promptTitle]);

  const options: ShareOption[] = [
    {
      id: 'web',
      label: 'Web 链接',
      desc: '浏览器直接访问',
      icon: 'mdi:web',
      value: links.web,
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      id: 'cygnus',
      label: 'Cygnus 协议',
      desc: 'CLI / 桌面端调用',
      icon: 'mdi:lightning-bolt',
      value: links.cygnus,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      id: 'markdown',
      label: 'Markdown',
      desc: '文档引用格式',
      icon: 'mdi:language-markdown',
      value: links.markdown,
      color: 'text-purple-500 bg-purple-500/10'
    }
  ];

  const handleCopy = async (text: string, id: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(`${label}已复制`, {
        description: '您可以直接粘贴使用',
        icon: <Icon icon="mdi:check-circle" className="text-green-500" />
      });

      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] border-0 bg-background/80 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden gap-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500" />

        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-light">
            <span className="p-2 rounded-full bg-secondary/50">
              <Icon icon="mdi:share-variant" className="h-5 w-5" />
            </span>
            分享灵感
          </DialogTitle>
          <DialogDescription>
            将 <span className="font-medium text-foreground">{promptTitle}</span> 分享给团队或集成到工作流
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 pt-4">
          {options.map((opt) => (
            <motion.button
              key={opt.id}
              onClick={() => handleCopy(opt.value, opt.id, opt.label)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative flex flex-col items-start p-4 rounded-xl border border-border/40 text-left transition-all duration-300
                hover:border-border hover:shadow-lg hover:shadow-primary/5 bg-card/50 hover:bg-card
                group outline-none focus-visible:ring-2 focus-visible:ring-ring
              `}
            >
              <div className="flex justify-between w-full mb-3">
                <div className={`p-2.5 rounded-lg ${opt.color} transition-colors`}>
                  <Icon icon={opt.icon} className="h-6 w-6" />
                </div>
                <div className="text-muted-foreground/30 group-hover:text-primary transition-colors">
                  <AnimatePresence mode="wait">
                    {copiedId === opt.id ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Icon icon="mdi:check-circle" className="h-5 w-5 text-green-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Icon icon="mdi:content-copy" className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  {opt.label}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {opt.desc}
                </p>
              </div>

              {/* Success Flash Effect */}
              <AnimatePresence>
                {copiedId === opt.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-xl bg-green-500/5 border-2 border-green-500/20 pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        <div className="bg-muted/30 p-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground px-6">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:shield-check-outline" className="h-3.5 w-3.5" />
            <span>仅公开可见的 Prompt 可被外部访问</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-8 hover:bg-destructive/10 hover:text-destructive">
            取消
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
