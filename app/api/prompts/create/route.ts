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

    // ---------------------------------------------------------
    // DB Primary: Insert into Supabase
    // ---------------------------------------------------------
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // path needs to be ltree compatible
    const ltreePath = `${safeDomain.replace(/-/g, '_')}.${safeScenario.replace(/-/g, '_')}.${safeName.replace(/-/g, '_')}`;
    
    // 1. Insert Repo
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
      console.error('DB: Failed to insert repo', repoError);
      return NextResponse.json({ ok: false, error: repoError.message }, { status: 400 });
    }

    if (!repoData) {
      return NextResponse.json({ ok: false, error: 'Failed to create repo data' }, { status: 500 });
    }

    // 2. Insert Prompt Version (Initial)
    // Construct virtual paths for DB storage (legacy compatibility)
    const relativePath = `data/prompts/${safeDomain}/${safeScenario}/${safeName}`;
    const tagsArray: string[] = Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === 'string'
      ? body.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const { error: promptError } = await supabase
      .from('prompts')
      .insert({
        repo_id: repoData.id,
        title: body.name.trim(),
        content: body.mainPrompt,
        context: body.context || null,
        main_prompt_path: `${relativePath}/main.prompt`,
        context_md_path: body.context ? `${relativePath}/context.md` : null,
        config_yaml_path: `${relativePath}/config.yaml`,
        summary: body.description?.trim(),
        tags: tagsArray,
        version: '1.0.0'
      });

    if (promptError) {
       console.error('DB: Failed to insert prompt', promptError);
       // Rollback repo? For simplicity, we leave it or manual cleanup, but ideally rollback.
       return NextResponse.json({ ok: false, error: promptError.message }, { status: 400 });
    }

    // ---------------------------------------------------------
    // Secondary: Write to local FS (Best Effort / Dev Only)
    // ---------------------------------------------------------
    try {
      // Only attempt if we are in an environment where we can write (e.g. dev)
      // or just try and suppress error
      const baseDir = path.join(process.cwd(), 'data', 'prompts');
      const targetDir = path.join(baseDir, safeDomain, safeScenario, safeName);
      await fs.mkdir(targetDir, { recursive: true });

      await fs.writeFile(path.join(targetDir, 'main.prompt'), body.mainPrompt, 'utf8');

      if (typeof body.context === 'string' && body.context.trim().length > 0) {
        await fs.writeFile(path.join(targetDir, 'context.md'), body.context, 'utf8');
      }

      // config.yaml construction
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
    } catch (fsError) {
      console.warn('FS Sync failed (expected in Serverless):', fsError);
      // Do not fail request
    }

    return NextResponse.json(
      { ok: true, path: `/${relativePath}` },
      { status: 201 }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}


