'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/app/lib/utils';

interface ProjectPulse {
  id: string;
  name: string;
  activity: number; // 0-100, 活跃度
  health: number; // 0-100, 健康度
  progress: number; // 0-100, 进度
}

interface PulseChartProps {
  projects: ProjectPulse[];
  className?: string;
}

export function PulseChart({ projects, className }: PulseChartProps) {
  if (projects.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>并行脉动图</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            暂无项目数据
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>并行脉动图</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => {
            const pulseIntensity = project.activity;
            const glowIntensity = project.health;

            return (
              <div
                key={project.id}
                className="relative flex items-center gap-4 rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm"
              >
                {/* Pulse Indicator */}
                <div className="relative flex h-12 w-12 items-center justify-center">
                  {/* Outer pulse ring */}
                  <div
                    className={cn(
                      'absolute h-full w-full rounded-full animate-pulse',
                      'bg-primary/20'
                    )}
                    style={{
                      animationDuration: `${3 + (100 - pulseIntensity) / 10}s`,
                      opacity: pulseIntensity / 100,
                    }}
                  />
                  {/* Inner glow */}
                  <div
                    className={cn(
                      'absolute h-8 w-8 rounded-full',
                      'bg-primary shadow-lg transition-all duration-300'
                    )}
                    style={{
                      opacity: glowIntensity / 100,
                      boxShadow: `0 0 ${glowIntensity / 5}px rgba(245, 158, 11, ${glowIntensity / 100})`,
                    }}
                  />
                  {/* Center dot */}
                  <div
                    className={cn(
                      'relative z-10 h-3 w-3 rounded-full bg-primary',
                      'shadow-sm'
                    )}
                  />
                </div>

                {/* Project Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">{project.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {project.activity}% 活跃
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>健康度: {project.health}</span>
                    <span>进度: {project.progress}%</span>
                  </div>
                  {/* Activity Bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${project.activity}%`,
                        boxShadow: `0 0 8px rgba(245, 158, 11, ${project.activity / 200})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

