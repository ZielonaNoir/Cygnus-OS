'use server'

import { createAdminClient } from '@/app/lib/supabase/server'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { Progress } from '@/app/components/ui/progress'

async function fetchProject(id: string) {
  const supabase = createAdminClient()
  const { data: project, error } = await supabase
    .from('projects')
    .select('id,name,description,progress,status,health_score,last_sync,path')
    .eq('id', id)
    .single()
  if (error) return { project: null, tasks: [], error: error.message }

  const { data: tasks, error: taskErr } = await supabase
    .from('tasks')
    .select('id,task_text,status,priority,file_path,line_number,created_at,updated_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(200)

  return { project, tasks: tasks ?? [], error: taskErr?.message ?? null }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { project, tasks, error } = await fetchProject(id)

  if (error) {
    return <p className="p-8 text-sm text-red-500">加载失败：{error}</p>
  }
  if (!project) {
    return <p className="p-8 text-sm text-muted-foreground">未找到项目</p>
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{project.description ?? '暂无描述'}</p>
        </div>
        <div className="w-64">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>进度</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="mt-2" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4">
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            暂无任务
          </div>
        ) : (
          tasks.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base">{t.task_text}</CardTitle>
                    <CardDescription className="mt-1 text-xs font-mono">
                      {t.file_path}{t.line_number ? `:${t.line_number}` : ''}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1 text-right text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        t.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : t.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-muted-foreground">priority: {t.priority}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}


