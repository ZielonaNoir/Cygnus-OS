import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { isSafePath, resolvePromptPath } from '../_utils';

type DeletePromptRequest = {
  path: string; // domain/scenario/name 或短名称
};

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as unknown as DeletePromptRequest;
    if (!body?.path || !isSafePath(body.path)) {
      return NextResponse.json({ ok: false, error: '非法路径' }, { status: 400 });
    }

    const targetDir = await resolvePromptPath(body.path);
    if (!targetDir) {
      return NextResponse.json({ ok: false, error: `未找到名为 ${body.path} 的 Prompt` }, { status: 404 });
    }

    await fs.rm(targetDir, { recursive: true, force: true });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


