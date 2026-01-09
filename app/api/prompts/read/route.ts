import { NextResponse } from 'next/server';
import { isSafePath } from '../_utils';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawPath = url.searchParams.get('path') || '';
    if (!rawPath || !isSafePath(rawPath)) {
      return NextResponse.json({ ok: false, error: '非法路径' }, { status: 400 });
    }

    const supabase = await createClient();

    // Convert path "Domain/Scenario/Name" to LTree "Domain.Scenario.Name"
    const ltreePath = rawPath.replace(/\//g, '.');

    // 1. Get Repo
    const { data: repo } = await supabase
        .from('prompt_repos')
        .select('id, name, domain, scenario, visibility, description')
        .eq('path', ltreePath)
        .maybeSingle();
    
    if (!repo) {
       return NextResponse.json({ ok: false, error: 'Prompt Not Found (DB)' }, { status: 404 });
    }

    // 2. Get Prompt Content
    const { data: prompt } = await supabase
          .from('prompts')
          .select('id, content, context, summary, tags')
          .eq('repo_id', repo.id)
          .maybeSingle();

    if (!prompt) {
        return NextResponse.json({ ok: false, error: 'Prompt Content Not Found (DB)' }, { status: 404 }); 
    }

    // 3. Construct Config (virtual) on the fly to satisfy frontend expectation
    // Frontend expects config.yaml content string.
    const tagsArray = (prompt.tags as string[]) || []; 
    const configYaml =
      `version: 1\n` +
      `name: "${repo.name}"\n` +
      `domain: "${repo.domain}"\n` +
      `scenario: "${repo.scenario}"\n` +
      `visibility: "${repo.visibility}"\n` +
      (repo.description 
        ? `description: "${repo.description.replace(/"/g, '\\"')}"\n`
        : '') +
      `tags:\n` +
      (tagsArray.length > 0 ? tagsArray.map((t) => `  - "${t.replace(/"/g, '\\"')}"`).join('\n') + '\n' : '');

    return NextResponse.json({
      ok: true,
      path: rawPath,
      mainPrompt: prompt.content || '',
      context: prompt.context || undefined, // undefined -> empty in JSON? or null? NextResponse handles it.
      config: configYaml,
      id: prompt.id,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


