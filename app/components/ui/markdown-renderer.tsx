'use client';

import * as React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/app/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// 自定义组件样式（支持明暗模式）
const components: Components = {
  // 标题
  h1: ({ children, ...props }) => (
    <h1 className="text-2xl font-bold text-foreground mt-6 mb-4 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-xl font-semibold text-foreground mt-5 mb-3 border-b border-border/50 pb-2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-semibold text-foreground mt-4 mb-2" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-base font-semibold text-foreground mt-3 mb-2" {...props}>
      {children}
    </h4>
  ),

  // 段落
  p: ({ children, ...props }) => (
    <p className="text-foreground leading-7 mb-4 last:mb-0" {...props}>
      {children}
    </p>
  ),

  // 列表
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside text-foreground mb-4 space-y-1 pl-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside text-foreground mb-4 space-y-1 pl-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-foreground" {...props}>
      {children}
    </li>
  ),

  // 代码块
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground"
          {...props}
        >
          {children}
        </code>
      );
    }
    // 代码块
    const language = className?.replace('language-', '') || 'text';
    return (
      <div className="relative my-4 rounded-lg overflow-hidden border border-border/50 bg-slate-900 dark:bg-slate-950">
        {/* 语言标签 */}
        <div className="absolute top-0 right-0 px-3 py-1 text-xs text-slate-400 bg-slate-800/80 rounded-bl-lg">
          {language}
        </div>
        <pre className="overflow-x-auto p-4 pt-8">
          <code className={cn('font-mono text-sm text-slate-200', className)} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  },
  pre: ({ children }) => <>{children}</>,

  // 引用块
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-4"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // 链接
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  // 分隔线
  hr: (props) => <hr className="my-6 border-border/50" {...props} />,

  // 表格（GFM 支持）
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full text-sm text-foreground" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/50" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-2 text-left font-semibold text-foreground border-b border-border/50" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2 border-b border-border/30 text-foreground" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-muted/30 transition-colors" {...props}>
      {children}
    </tr>
  ),

  // 强调
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-foreground" {...props}>
      {children}
    </em>
  ),

  // 删除线（GFM）
  del: ({ children, ...props }) => (
    <del className="line-through text-muted-foreground" {...props}>
      {children}
    </del>
  ),

  // 图片（Markdown 渲染的图片 src 来自内容，无法使用 next/image 的静态优化）
  img: ({ src, alt, ...props }) => (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt || ''}
      className="rounded-lg max-w-full h-auto my-4 border border-border/50"
      {...props}
    />
  ),
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-slate dark:prose-invert max-w-none', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

