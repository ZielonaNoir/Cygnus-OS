'use server'

import { createClient } from '@/app/lib/supabase/server'
import { Suspense } from 'react'
import { Progress } from '@/app/components/ui/progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Select } from '@/app/components/ui/select'
import { Button } from '@/app/components/ui/button'
import { PulseChart } from '@/app/components/dashboard/PulseChart'
import { DashboardBackground } from '@/app/components/reactbits/DashboardBackground'
import { ShinyTitle } from '@/app/components/reactbits/ShinyTitle'
import { UniverseScene } from '@/app/components/3d/UniverseScene'

type SearchParams = {
  q?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled'
}

async function fetchProjects(filters: SearchParams) {
  const supabase = await createClient()
  
  // 验证用户已认证
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: [], error: '未认证，请先登录' }
  }
  
  // 使用 RLS 策略，只查询当前用户的项目
  let query = supabase
    .from('projects')
    .select('id,name,description,progress,status,health_score,last_sync,path')
    .order('updated_at', { ascending: false })
    .limit(24)

  if (filters.q && filters.q.trim().length > 0) {
    query = query.ilike('name', `%${filters.q.trim()}%`)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    return { data: [], error: error.message }
  }
  return { data: data ?? [], error: null }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { data: projects, error } = await fetchProjects(params ?? {})

  return (
    <div className="relative min-h-full bg-background p-8">
      {/* Aurora 背景 */}
      <DashboardBackground />

      {/* 内容区域 */}
      <div className="relative z-10">
        <div className="mb-6">
          <ShinyTitle text="SIPE 指挥部" className="text-3xl" />
          <p className="mt-2 text-muted-foreground">项目进度管理看板</p>
        </div>

        {/* 3D 宇宙视图 */}
        <div className="mb-8 rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/50">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <UniverseScene projects={projects as any[]} />
        </div>

        {/* 操作栏 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">我的项目</h2>
          <Button asChild>
            <a href="/dashboard/projects/new">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建项目
            </a>
          </Button>
        </div>

        {/* 搜索与筛选区域 */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {/* 搜索框 - 带图标 */}
          <form className="flex items-center gap-3 flex-1 max-w-2xl" action="/dashboard" method="GET">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <Input
                name="q"
                defaultValue={params?.q ?? ''}
                placeholder="搜索项目名称..."
                className="pl-10 bg-card/50 border-border/50 focus:border-primary/50 focus:bg-card/80"
              />
            </div>
            {/* 状态筛选标签组 */}
            <div className="flex items-center gap-2">
              <Select
                name="status"
                defaultValue={params?.status ?? ''}
                className="w-36 bg-card/50 border-border/50"
              >
                <option value="">全部状态</option>
                <option value="pending">⏳ 待处理</option>
                <option value="in_progress">🔄 进行中</option>
                <option value="completed">✅ 已完成</option>
                <option value="paused">⏸️ 已暂停</option>
                <option value="cancelled">❌ 已取消</option>
              </Select>
              <Button type="submit" variant="default" className="shadow-lg shadow-primary/20">
                <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                筛选
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-muted-foreground">加载中…</p>}>
            {error ? (
              <p className="text-sm text-red-500">加载失败：{error}</p>
            ) : projects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/50 p-8 text-center space-y-4 bg-card/30">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">暂无项目数据</p>
                  <p className="text-sm text-muted-foreground">
                    请使用以下方式同步项目数据：
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                  <a
                    href="/dashboard/mcp"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    通过 MCP 连接
                  </a>
                  <span className="text-xs text-muted-foreground">或</span>
                  <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-foreground bg-muted rounded-lg border border-border/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    cygnus sync
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  查看 <a href="/docs/CLI_GUIDE.md" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CLI 使用指南</a> 了解更多
                </p>
              </div>
            ) : (
              <>
                {/* 并行脉动图 */}
                <div className="mb-6">
                  <PulseChart
                    projects={projects.map((p) => ({
                      id: p.id,
                      name: p.name,
                      activity: p.progress, // 使用进度作为活跃度
                      health: p.health_score,
                      progress: p.progress,
                    }))}
                  />
                </div>

                {/* 项目卡片网格 */}
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {projects.map((p) => (
                    <Card key={p.id} className="cursor-pointer hover:scale-[1.02] transition-transform">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{p.name}</CardTitle>
                            <CardDescription className="mt-1 line-clamp-2">
                              {p.description ?? '暂无描述'}
                            </CardDescription>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : p.status === 'in_progress'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <span>进度</span>
                              <span className="font-medium">{p.progress}%</span>
                            </div>
                            <Progress value={p.progress} />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">健康度</span>
                            <span className="font-medium text-foreground">{p.health_score}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {p.last_sync
                              ? new Date(p.last_sync as unknown as string).toLocaleString('zh-CN')
                              : '未同步'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

