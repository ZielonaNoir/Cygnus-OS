/**
 * Aurora - 极光背景组件
 * 
 * 注意：这是一个占位组件。
 * 请从 ReactBits GitHub 仓库获取完整实现：
 * https://github.com/davidhdev/reactbits
 * 
 * 或访问：https://reactbits.dev/ts/tailwind/Backgrounds/Aurora
 */

'use client';

import * as React from 'react';
import { cn } from '@/app/lib/utils';

interface AuroraProps {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  intensity?: number;
}

export default function Aurora({
  className,
  primaryColor = 'rgb(15, 23, 42)', // slate-900
  secondaryColor = 'rgb(245, 158, 11)', // amber-500
  intensity = 0.6,
}: AuroraProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 -z-10 overflow-hidden',
        'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900',
        className
      )}
      style={{
        background: `radial-gradient(ellipse at top, ${secondaryColor}20, ${primaryColor})`,
        opacity: intensity,
      }}
    >
      {/* 占位：请替换为完整的 Aurora 组件实现 */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/10 animate-pulse" />
    </div>
  );
}

