'use client';

import * as React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../ui/hover-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Icon } from '../Icon';
import { cn } from '@/app/lib/utils';

interface AgentSummaryPopupProps {
  title: string;
  summary: string;
  stats?: {
    count?: number;
    lastUpdated?: string;
  };
  children: React.ReactNode;
}

export function AgentSummaryPopup({
  title,
  summary,
  stats,
  children,
}: AgentSummaryPopupProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        className={cn(
          'w-80 bg-card/95 backdrop-blur-md border-border/50 shadow-2xl',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
      >
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon icon="mdi:robot" className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            {stats?.count !== undefined && (
              <CardDescription className="mt-1">
                {stats.count} 个资产
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">{summary}</p>
            {stats?.lastUpdated && (
              <p className="mt-3 text-xs text-muted-foreground">
                最后更新: {stats.lastUpdated}
              </p>
            )}
          </CardContent>
        </Card>
      </HoverCardContent>
    </HoverCard>
  );
}

