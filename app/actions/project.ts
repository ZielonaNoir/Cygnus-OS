'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function syncProject(projectId: string) {
  try {
    const supabase = await createClient()
    
    // 验证用户已认证
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '未认证，请先登录' }
    }
    
    // 先验证项目所有权（RLS 会自动过滤，但这里双重检查）
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single()
    
    if (fetchError || !project) {
      return { success: false, error: '项目不存在或无权访问' }
    }
    
    if (project.owner_id !== user.id) {
      return { success: false, error: '无权访问此项目' }
    }
    
    // In a real scenario, this would:
    // 1. Read the TODO.md file at projectPath
    // 2. Parse it
    // 3. Diff with DB tasks
    // 4. Update DB

    // For now, we simulate a sync by updating the `last_sync` timestamp
    const { error } = await supabase
      .from('projects')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', projectId)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, message: 'Project synced successfully' }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function startAgent(_projectId: string) {
    // Placeholder for Agent Trigger
    // Could eventually call an MCP tool or external API
    return { success: true, message: 'Agent sequence initiated' }
}
