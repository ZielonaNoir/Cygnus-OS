import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

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

    return NextResponse.json(
      { ok: true, path: `/${relativePath}` },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}


