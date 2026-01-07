'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { differenceInDays } from 'date-fns';

interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'paused';
}

interface GanttChartProps {
  tasks: GanttTask[];
  className?: string;
}

export function GanttChart({ tasks, className }: GanttChartProps) {
  const chartData = React.useMemo(() => {
    if (tasks.length === 0) return [];

    const minDate = new Date(Math.min(...tasks.map((t) => t.startDate.getTime())));

    return tasks.map((task) => {
      const startOffset = differenceInDays(task.startDate, minDate);
      const duration = differenceInDays(task.endDate, task.startDate);

      return {
        name: task.name,
        start: startOffset,
        duration: Math.max(1, duration),
        progress: task.progress,
        status: task.status,
      };
    });
  }, [tasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'rgb(34, 197, 94)'; // green-500
      case 'in_progress':
        return 'rgb(245, 158, 11)'; // amber-500
      case 'paused':
        return 'rgb(148, 163, 184)'; // slate-400
      default:
        return 'rgb(100, 116, 139)'; // slate-500
    }
  };

  if (tasks.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>项目甘特图</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            暂无任务数据
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>项目甘特图</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(51, 65, 85)" opacity={0.3} />
            <XAxis
              type="number"
              stroke="rgb(148, 163, 184)"
              tick={{ fill: 'rgb(148, 163, 184)' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={90}
              stroke="rgb(148, 163, 184)"
              tick={{ fill: 'rgb(148, 163, 184)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(30, 41, 59)',
                border: '1px solid rgb(51, 65, 85)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'rgb(241, 245, 249)' }}
            />
            <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

