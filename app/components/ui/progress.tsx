'use client';

import * as React from 'react';
import { cn } from '@/app/lib/utils';

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const clampedValue = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        {...props}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out shadow-sm"
          style={{
            width: `${clampedValue}%`,
            boxShadow: '0 0 8px rgba(var(--primary), 0.4)',
          }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedValue}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };

