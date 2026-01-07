'use client';

import * as React from 'react';
import { cn } from '@/app/lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm',
          'text-foreground', // 动态文字颜色（深色模式=浅色，浅色模式=深色）
          'ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          // option 元素样式（继承父元素文字颜色）
          '[&>option]:text-foreground [&>option]:bg-background',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };

