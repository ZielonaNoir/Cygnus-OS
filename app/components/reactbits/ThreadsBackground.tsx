import * as React from 'react';
import { cn } from '@/app/lib/utils';

interface ThreadsBackgroundProps {
  className?: string;
}

// CSS-only threads effect suitable for Server Components
export function ThreadsBackground({ className }: ThreadsBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'threads-bg pointer-events-none absolute inset-0 select-none opacity-40',
        className
      )}
    />
  );
}


