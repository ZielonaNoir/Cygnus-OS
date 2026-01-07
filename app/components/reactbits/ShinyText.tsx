/**
 * ShinyText - 闪亮文本组件
 * 
 * 注意：这是一个占位组件。
 * 请从 ReactBits GitHub 仓库获取完整实现：
 * https://github.com/davidhdev/reactbits
 * 
 * 或访问：https://reactbits.dev/ts/tailwind/TextAnimations/ShinyText
 */

'use client';

import * as React from 'react';
import { cn } from '@/app/lib/utils';

interface ShinyTextProps {
  text: string;
  className?: string;
  color?: string;
}

export default function ShinyText({
  text,
  className,
  color = 'rgb(245, 158, 11)', // amber-500
}: ShinyTextProps) {
  return (
    <span
      className={cn(
        'relative inline-block font-bold',
        'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600',
        'bg-clip-text text-transparent',
        'animate-pulse',
        className
      )}
      style={{
        backgroundImage: `linear-gradient(90deg, ${color}, ${color}dd, ${color})`,
      }}
    >
      {text}
    </span>
  );
}

