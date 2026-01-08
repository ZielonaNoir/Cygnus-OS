'use server'

import { createClient } from '@/app/lib/supabase/server'
import { ProjectHero } from '@/app/components/project/ProjectHero'
import { TaskFilter } from '@/app/components/project/TaskFilter'
import Link from 'next/link'
import { Icon } from '@/app/components/Icon'

async function fetchProject(id: string) {
  const supabase = await createClient()
  
  // 验证用户已认证
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { project: null, tasks: [], error: '未认证，请先登录' }
  }
  
  // 使用 RLS 策略，只查询当前用户的项目
  const { data: project, error } = await supabase
    .from('projects')
    .select('id,name,description,progress,status,health_score,last_sync,path,owner_id')
    .eq('id', id)
    .single()
  
  if (error) {
    // 如果是权限错误，返回更友好的提示
    if (error.code === 'PGRST116' || error.message.includes('permission')) {
      return { project: null, tasks: [], error: '无权访问此项目' }
    }
    return { project: null, tasks: [], error: error.message }
  }
  
  // 验证项目所有权（双重检查）
  if (project && project.owner_id !== user.id) {
    return { project: null, tasks: [], error: '无权访问此项目' }
  }

  // 使用 RLS 策略查询任务（会自动过滤非当前用户的项目）
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
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-red-500 p-8 font-mono">
            Error: Connection Lost. {error}
        </div>
    )
  }
  if (!project) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white/50 p-8 font-mono">
            Error: Target Node Not Found.
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020205] text-white p-6 md:p-12 font-sans selection:bg-purple-500/30">
      
      {/* Navigation Header */}
      <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
              <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                 <Icon icon="mdi:arrow-left" className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium tracking-wide">RETURN TO GALAXY</span>
          </Link>
          
          {/* Actions moved to Filter Bar */}
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Living Core */}
        <section>
            <ProjectHero project={project} />
        </section>

        {/* Data Streams */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Task Stream */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between pb-2">
                    <h2 className="text-xl font-light tracking-wide text-white/90">
                        <span className="text-amber-500 mr-2">{'///'}</span>
                        ACTIVE TASKS
                    </h2>
                </div>
                
                {/* Integrated Filter & List */}
                <TaskFilter 
                    tasks={tasks} 
                    projectId={project.id} 
                />
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Meta Data</h3>
                    
                    <div className="space-y-4 font-mono text-sm">
                        <div>
                            <div className="text-white/30 text-xs mb-1">LOCAL PATH</div>
                            <div className="text-white/80 break-all">{project.path}</div>
                        </div>
                        <div>
                            <div className="text-white/30 text-xs mb-1">LAST SYNC</div>
                            <div className="text-white/80">
                                {project.last_sync ? new Date(project.last_sync).toLocaleString() : 'NEVER'}
                            </div>
                        </div>
                        <div>
                             <div className="text-white/30 text-xs mb-1">OWNER ID</div>
                             <div className="text-white/50 text-xs truncate">{project.owner_id || 'UNKNOWN'}</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/10 to-transparent border border-purple-500/10 backdrop-blur-sm">
                    <h3 className="text-xs font-bold text-purple-300/50 uppercase tracking-widest mb-4">Intelligence</h3>
                    <p className="text-sm text-purple-200/60 leading-relaxed">
                        AI Agent analysis indicates stable development velocity. Use &quot;Start Agent&quot; to automate pending tasks.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}


