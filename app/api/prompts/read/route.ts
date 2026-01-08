import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { isSafePath, resolvePromptPath } from '../_utils';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawPath = url.searchParams.get('path') || '';
    if (!rawPath || !isSafePath(rawPath)) {
      return NextResponse.json({ ok: false, error: '非法路径' }, { status: 400 });
    }

    const targetDir = await resolvePromptPath(rawPath);
    if (!targetDir) {
      return NextResponse.json({ ok: false, error: `未找到名为 ${rawPath} 的 Prompt` }, { status: 404 });
    }

    async function readFileIfExists(filePath: string): Promise<string | null> {
      try {
        return await fs.readFile(filePath, 'utf8');
      } catch {
        return null;
      }
    }

    const mainPrompt = await readFileIfExists(path.join(targetDir, 'main.prompt'));
    if (mainPrompt === null) {
      return NextResponse.json({ ok: false, error: '主文件不存在' }, { status: 404 });
    }

    const context = await readFileIfExists(path.join(targetDir, 'context.md'));
    const config = await readFileIfExists(path.join(targetDir, 'config.yaml'));

    // Fetch ID from Supabase
    let promptId = '';
    try {
      const supabase = await createClient();
      // Convert path "Domain/Scenario/Name" to LTree "Domain.Scenario.Name"
      // Note: rawPath might need cleaning or validation
      const ltreePath = rawPath.replace(/\//g, '.');

      const { data: repo } = await supabase
        .from('prompt_repos')
        .select('id')
        .eq('path', ltreePath)
        .maybeSingle();

      if (repo) {
        const { data: prompt } = await supabase
          .from('prompts')
          .select('id')
          .eq('repo_id', repo.id)
          .maybeSingle();

        if (prompt) {
          promptId = prompt.id;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch prompt ID from Supabase:', err);
    }

    return NextResponse.json({
      ok: true,
      path: rawPath,
      mainPrompt,
      context,
      config,
      id: promptId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


