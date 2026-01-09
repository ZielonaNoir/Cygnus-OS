import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { isSafePath } from '../_utils';
import { createClient } from '@supabase/supabase-js';

// 使用 Service Role Key 以获得写入权限 (API Route 运行在服务器端)
// 注意：应当使用 lib/supabase/server 但如果是 route handler 使用 service role 可能需要直接初始化
// 或者使用 createClient from @supabase/supabase-js for robust backend ops
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type UpdatePromptRequest = {
  path: string; // domain/scenario/name 或短名称
  mainPrompt?: string;
  context?: string | null; // null 表示删除 context.md
  config?: string; // 完整的 config.yaml 文本，可选
};

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown as UpdatePromptRequest;
    if (!body?.path || !isSafePath(body.path)) {
      return NextResponse.json({ ok: false, error: '非法路径' }, { status: 400 });
    }

    // --- DB-First Logic ---
    // 1. Resolve Repo ID from DB (by path or name)
    let repoData: { id: string; path: string; name: string; domain: string; scenario: string; } | null = null;
    
    // Treat as full path (Domain/Scenario/Name) or Name
    const isFullPath = body.path.includes('/');
    
    if (isFullPath) {
      const ltreePath = body.path.replace(/\//g, '.');
      const { data } = await supabase
        .from('prompt_repos')
        .select('*')
        .eq('path', ltreePath)
        .maybeSingle();
      repoData = data;
    } else {
      // Short name match
      const { data } = await supabase
        .from('prompt_repos')
        .select('*')
        .eq('name', body.path)
        .maybeSingle(); // Assumes uniqueness or returns one
      repoData = data;
    }

    if (!repoData) {
       return NextResponse.json({ ok: false, error: `未找到名为 ${body.path} 的 Prompt` }, { status: 404 });
    }

    // 2. Fetch Prompt ID
    const { data: prompt } = await supabase
        .from('prompts')
        .select('id, version')
        .eq('repo_id', repoData.id)
        .maybeSingle();

    if (!prompt) {
        return NextResponse.json({ ok: false, error: 'Prompt Record Not Found' }, { status: 404 });
    }

    // 3. Prepare Updates
    const updates: {
        updated_at: string;
        content?: string;
        context?: string | null;
        version?: string;
    } = {
        updated_at: new Date().toISOString()
    };
    if (body.mainPrompt !== undefined) updates.content = body.mainPrompt;
    if (body.context !== undefined) updates.context = body.context; // supports null for delete
    
    // Determine Version
    const { data: latestVersion } = await supabase
          .from('prompt_versions')
          .select('version')
          .eq('prompt_id', prompt.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

    const { incrementPatch } = await import('@/app/lib/versioning/semver');
    const currentVersion = latestVersion?.version || prompt.version || '1.0.0';
    const nextVersion = incrementPatch(currentVersion);
    
    updates.version = nextVersion;

    // 4. Update Prompts Table
    await supabase.from('prompts').update(updates).eq('id', prompt.id);

    // 5. Create Version Snapshot
    // Need to fetch current data if partial update? body.mainPrompt might be incomplete?
    // Usually the editor sends FULL content. Let's assume body.mainPrompt IS the new full content if provided.
    // If not provided, we should probably fetch previous content. But typical SAVE sends all.
    // However, if body.mainPrompt is missing, we shouldn't insert a version with null content?
    // Let's assume SAVE sends mainPrompt.
    
    if (body.mainPrompt) {
        await supabase.from('prompt_versions').insert({
          prompt_id: prompt.id,
          version: nextVersion,
          content: body.mainPrompt,
          context: body.context || null,
          summary: 'Web Editor Save',
          created_by: null
        });
    }

    // ---------------------------------------------------------
    // Secondary: Write to Local FS (Best Effort)
    // ---------------------------------------------------------
    try {
        const baseDir = path.join(process.cwd(), 'data', 'prompts');
        // Reconstruct path from repo info to be safe
        const targetDir = path.join(baseDir, repoData.domain, repoData.scenario, repoData.name);
        
        // Ensure dir exists (it might not on Vercel or if new env)
        await fs.mkdir(targetDir, { recursive: true });

        if (typeof body.mainPrompt === 'string') {
             await fs.writeFile(path.join(targetDir, 'main.prompt'), body.mainPrompt, 'utf8');
        }

        if (body.context === null) {
          try { await fs.unlink(path.join(targetDir, 'context.md')); } catch {}
        } else if (typeof body.context === 'string') {
          await fs.writeFile(path.join(targetDir, 'context.md'), body.context, 'utf8');
        }

        if (typeof body.config === 'string') {
           await fs.writeFile(path.join(targetDir, 'config.yaml'), body.config, 'utf8');
        }
    } catch (err) {
        console.warn('FS Update Skipped:', err);
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


