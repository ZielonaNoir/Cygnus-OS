import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { isSafePath, resolvePromptPath } from '../_utils';

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


