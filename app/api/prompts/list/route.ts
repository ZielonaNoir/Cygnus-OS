import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { createClient } from '@/app/lib/supabase/server';

type PromptItem = {
  id: string; // domain/scenario/name
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

    // 从文件系统读取所有 Prompt（文件系统即真相）
    const baseDir = path.join(process.cwd(), 'data', 'prompts');
    const allItems: PromptItem[] = [];

    async function exists(p: string): Promise<boolean> {
      try {
        await fs.access(p);
        return true;
      } catch {
        return false;
      }
    }

    async function safeReaddir(dir: string) {
      try {
        return await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return [];
      }
    }

    const domains = await safeReaddir(baseDir);
    for (const d of domains) {
      if (!d.isDirectory()) continue;
      const domain = d.name;
      const domainDir = path.join(baseDir, domain);
      const scenarios = await safeReaddir(domainDir);
      for (const s of scenarios) {
        if (!s.isDirectory()) continue;
        const scenario = s.name;
        const scenarioDir = path.join(domainDir, scenario);
        const assets = await safeReaddir(scenarioDir);
        for (const a of assets) {
          if (!a.isDirectory()) continue;
          const name = a.name;
          const assetDir = path.join(scenarioDir, name);
          const id = [domain, scenario, name].join('/');
          const hasContext = await exists(path.join(assetDir, 'context.md'));
          allItems.push({
            id,
            label: name,
            domain,
            scenario,
            name,
            hasContext,
          });
        }
      }
    }

    // 从 Supabase 查询用户有权限访问的 prompt_repos（RLS 会自动过滤）
    // 将路径转换为 LTree 格式：Domain/Scenario/Name -> Domain.Scenario.Name
    const accessiblePaths = new Set<string>();
    
    const { data: repos, error: reposError } = await supabase
      .from('prompt_repos')
      .select('path, visibility, owner_id')
      .or(`visibility.eq.public,owner_id.eq.${user.id}`);
    
    if (!reposError && repos) {
      // 将 LTree 路径转换回文件系统路径格式
      for (const repo of repos) {
        const fsPath = repo.path.replace(/\./g, '/');
        accessiblePaths.add(fsPath);
      }
    }

    // 过滤：只返回用户有权限访问的 Prompt
    // 如果 prompt_repo 在数据库中不存在，默认不允许访问（安全策略）
    const items = allItems.filter(item => accessiblePaths.has(item.id));

    // sort by id for stable order
    items.sort((x, y) => x.id.localeCompare(y.id));
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


