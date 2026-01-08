import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { isSafePath, resolvePromptPath } from '../_utils';
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

    const resolvedPath = await resolvePromptPath(body.path);
    if (!resolvedPath) {
      return NextResponse.json({ ok: false, error: `未找到名为 ${body.path} 的 Prompt` }, { status: 404 });
    }
    const targetDir: string = resolvedPath; // 类型收窄：确保 targetDir 是 string

    async function writeIfProvided(file: string, content?: string) {
      if (typeof content === 'string') {
        await fs.writeFile(path.join(targetDir, file), content, 'utf8');
      }
    }

    // 更新 main.prompt
    await writeIfProvided('main.prompt', body.mainPrompt);

    // 更新/删除 context.md
    if (body.context === null) {
      try {
        await fs.unlink(path.join(targetDir, 'context.md'));
      } catch {
        // ignore
      }
    } else if (typeof body.context === 'string') {
      await fs.writeFile(path.join(targetDir, 'context.md'), body.context, 'utf8');
    }

    // --- Sync to Supabase ---
    // 1. 获取 Repo ID 和 Prompt ID
    const ltreePath = body.path.replace(/\//g, '.');
    const { data: repo } = await supabase
      .from('prompt_repos')
      .select('id')
      .eq('path', ltreePath)
      .maybeSingle();

    if (repo && body.mainPrompt) {
      // Update Prompt Content
      // We first need the Prompt ID
      const { data: prompt } = await supabase
        .from('prompts')
        .select('id, version')
        .eq('repo_id', repo.id)
        .maybeSingle();

      if (prompt) {
        // Fetch the latest version from prompt_versions to determine next version
        const { data: latestVersion } = await supabase
          .from('prompt_versions')
          .select('version')
          .eq('prompt_id', prompt.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Import version utility
        const { incrementPatch } = await import('@/app/lib/versioning/semver');

        // Calculate next version
        const currentVersion = latestVersion?.version || prompt.version || '1.0.0';
        const nextVersion = incrementPatch(currentVersion);

        // Update Prompts Table with new version
        await supabase
          .from('prompts')
          .update({
            content: body.mainPrompt,
            version: nextVersion,
            updated_at: new Date().toISOString()
          })
          .eq('id', prompt.id);

        // Create Version Snapshot with incremented version
        await supabase.from('prompt_versions').insert({
          prompt_id: prompt.id,
          version: nextVersion,
          content: body.mainPrompt,
          summary: 'Web Editor Save',
          created_by: null
        });
      }
    }

    // 可选覆盖 config.yaml（高级用法）
    if (typeof body.config === 'string') {
      await fs.writeFile(path.join(targetDir, 'config.yaml'), body.config, 'utf8');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


