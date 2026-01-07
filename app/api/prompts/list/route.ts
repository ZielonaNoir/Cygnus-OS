import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

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
    const baseDir = path.join(process.cwd(), 'data', 'prompts');
    const items: PromptItem[] = [];

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
          items.push({
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

    // sort by id for stable order
    items.sort((x, y) => x.id.localeCompare(y.id));
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


