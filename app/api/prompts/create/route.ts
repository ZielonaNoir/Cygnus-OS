import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { createClient } from '@/app/lib/supabase/server';

type CreatePromptRequest = {
  name: string;
  domain: string;
  scenario: string;
  description?: string;
  tags?: string[] | string;
  mainPrompt: string;
  context?: string;
  visibility?: 'public' | 'private';
};

function sanitizeSegment(input: string): string {
  return input.trim().replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
}

function ensureNonEmpty(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`缺少必填字段: ${field}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown as CreatePromptRequest;

    ensureNonEmpty(body.name, 'name');
    ensureNonEmpty(body.domain, 'domain');
    ensureNonEmpty(body.scenario, 'scenario');
    ensureNonEmpty(body.mainPrompt, 'mainPrompt');

    const safeName = sanitizeSegment(body.name);
    const safeDomain = sanitizeSegment(body.domain);
    const safeScenario = sanitizeSegment(body.scenario);

    const baseDir = path.join(process.cwd(), 'data', 'prompts');
    const targetDir = path.join(baseDir, safeDomain, safeScenario, safeName);

    await fs.mkdir(targetDir, { recursive: true });

    // Write main.prompt
    await fs.writeFile(path.join(targetDir, 'main.prompt'), body.mainPrompt, 'utf8');

    // Optional context.md
    if (typeof body.context === 'string' && body.context.trim().length > 0) {
      await fs.writeFile(path.join(targetDir, 'context.md'), body.context, 'utf8');
    }

    // config.yaml (minimal)
    const tagsArray: string[] = Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === 'string'
      ? body.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const configYaml =
      `version: 1\n` +
      `name: "${safeName}"\n` +
      `domain: "${safeDomain}"\n` +
      `scenario: "${safeScenario}"\n` +
      `visibility: "${body.visibility ?? 'private'}"\n` +
      (typeof body.description === 'string' && body.description.trim().length > 0
        ? `description: "${body.description.replace(/"/g, '\\"')}"\n`
        : '') +
      `tags:\n` +
      (tagsArray.length > 0 ? tagsArray.map((t) => `  - "${t.replace(/"/g, '\\"')}"`).join('\n') + '\n' : '');

    await fs.writeFile(path.join(targetDir, 'config.yaml'), configYaml, 'utf8');

    const relativePath = path
      .relative(process.cwd(), targetDir)
      .split(path.sep)
      .join('/');

    // ---------------------------------------------------------
    // DB Sync: Insert into Supabase to ensure immediate visibility
    // ---------------------------------------------------------
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 1. Insert or Get Repo
        // path needs to be ltree compatible (alphanumeric and underscores only, no hyphens)
        // Domain.Scenario.Name
        const ltreePath = `${safeDomain.replace(/-/g, '_')}.${safeScenario.replace(/-/g, '_')}.${safeName.replace(/-/g, '_')}`;
        
        const { data: repoData, error: repoError } = await supabase
          .from('prompt_repos')
          .insert({
            name: body.name.trim(),
            description: body.description?.trim(),
            path: ltreePath,
            domain: body.domain, 
            scenario: body.scenario,
            visibility: body.visibility ?? 'private',
            owner_id: user.id
          })
          .select('id')
          .single();

        if (repoError) {
          console.error('DB Sync: Failed to insert repo', repoError);
          // Don't fail the request, file is created
        } else if (repoData) {
          // 2. Insert Prompt Version (Initial)
          await supabase
            .from('prompts')
            .insert({
              repo_id: repoData.id,
              title: body.name.trim(),
              content: body.mainPrompt,
              main_prompt_path: `${relativePath}/main.prompt`,
              context_md_path: body.context ? `${relativePath}/context.md` : null,
              config_yaml_path: `${relativePath}/config.yaml`,
              summary: body.description?.trim(),
              tags: tagsArray,
              version: '1.0.0'
            });
        }
      }
    } catch (dbError) {
      console.error('DB Sync: Unexpected error', dbError);
    }
    // ---------------------------------------------------------

    return NextResponse.json(
      { ok: true, path: `/${relativePath}` },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}


