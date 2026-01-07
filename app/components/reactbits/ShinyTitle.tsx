'use client';

import ShinyText from './ShinyText';
import { cn } from '@/app/lib/utils';

interface ShinyTitleProps {
  text: string;
  className?: string;
  description?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * 闪亮标题组件
 * 使用 ShinyText 实现标题效果
 */
export function ShinyTitle({ 
  text, 
  className, 
  description,
  as: Component = 'h1'
}: ShinyTitleProps) {
  return (
    <div>
      <Component className={cn('font-bold', className)}>
        <ShinyText text={text} />
      </Component>
      {description && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

