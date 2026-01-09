import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

type PromptItem = {
  id: string; // domain/scenario/name (db path format: domain.scenario.name)
  label: string;
  domain: string;
  scenario: string;
  name: string;
  hasContext: boolean;
};

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 验证用户已认证
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: '未认证，请先登录' }, { status: 401 });
    }

    // 从 Supabase 查询用户有权限访问的 prompt_repos
    // RLS 策略会自动过滤数据
    const { data: repos, error: reposError } = await supabase
      .from('prompt_repos')
      .select('path, domain, scenario, name, id')
      .or(`visibility.eq.public,owner_id.eq.${user.id}`); // Double check RLS, but explicit OR is safe
    
    if (reposError) {
      throw new Error(`Public Repo Query Error: ${reposError.message}`);
    }

    const items: PromptItem[] = [];

    if (repos && repos.length > 0) {
       // 为了获取 hasContext，我们需要查询 prompts 表
       // 我们可以批量查询，或者对于 List 视图暂时设为 false (性能优化)，
       // 但为了保持兼容性，我们查询最新的 prompt 记录看是否有 context_md_path 或 content
       
       const repoIds = repos.map(r => r.id);
       
       // 查询关联的 prompts 信息 (只需查是否存在 context)
       const { data: promptsDetails } = await supabase
         .from('prompts')
         .select('repo_id, context_md_path, content')
         .in('repo_id', repoIds);

       const contextMap = new Map<string, boolean>();
       if (promptsDetails) {
         for (const p of promptsDetails) {
             // 如果有 context_md_path 或者 content 中包含特定的 context 标记 (视业务逻辑而定)
             // 这里暂时沿用旧逻辑：如果有 context_md_path (虽然现在是 DB 里的字段)
             if (p.context_md_path || (p.content && p.content.includes('<context>'))) { // 简单的一层判断
                 contextMap.set(p.repo_id, true);
             }
         }
       }

       for (const repo of repos) {
          // LTree path format: Domain.Scenario.Name
          // Client expects: Domain/Scenario/Name
          const id = repo.path.replace(/\./g, '/'); 
          
          items.push({
            id,
            label: repo.name,
            domain: repo.domain,
            scenario: repo.scenario,
            name: repo.name,
            hasContext: contextMap.get(repo.id) || false,
          });
       }
    }

    // sort by id for stable order
    items.sort((x, y) => x.id.localeCompare(y.id));
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


