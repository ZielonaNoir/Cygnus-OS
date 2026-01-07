import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'data', 'prompts');

// 确保目录存在
async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// 验证名称（只允许英文、数字、连字符、下划线）
function isValidName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name);
}

// GET - 获取所有 Domain 和 Scenario
export async function GET() {
  try {
    await ensureDir(PROMPTS_DIR);
    
    const entries = await fs.readdir(PROMPTS_DIR, { withFileTypes: true });
    const domains: Array<{
      id: string;
      label: string;
      scenarios: Array<{ id: string; label: string; count: number }>;
    }> = [];
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const domainPath = path.join(PROMPTS_DIR, entry.name);
      const scenarioEntries = await fs.readdir(domainPath, { withFileTypes: true });
      
      const scenarios: Array<{ id: string; label: string; count: number }> = [];
      for (const scenarioEntry of scenarioEntries) {
        if (!scenarioEntry.isDirectory()) continue;
        
        const scenarioPath = path.join(domainPath, scenarioEntry.name);
        const assetEntries = await fs.readdir(scenarioPath, { withFileTypes: true });
        const assetCount = assetEntries.filter(e => e.isDirectory()).length;
        
        scenarios.push({
          id: scenarioEntry.name.toLowerCase(),
          label: scenarioEntry.name,
          count: assetCount,
        });
      }
      
      domains.push({
        id: entry.name.toLowerCase(),
        label: entry.name,
        scenarios: scenarios.sort((a, b) => a.label.localeCompare(b.label)),
      });
    }
    
    return NextResponse.json({
      ok: true,
      domains: domains.sort((a, b) => a.label.localeCompare(b.label)),
    });
  } catch (error) {
    console.error('Failed to list categories:', error);
    return NextResponse.json(
      { ok: false, error: '获取分类失败' },
      { status: 500 }
    );
  }
}

// POST - 创建 Domain 或 Scenario
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, domain, name } = body;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { ok: false, error: '名称不能为空' },
        { status: 400 }
      );
    }
    
    if (!isValidName(name)) {
      return NextResponse.json(
        { ok: false, error: '名称只能包含英文字母、数字、连字符和下划线，且必须以字母开头' },
        { status: 400 }
      );
    }
    
    await ensureDir(PROMPTS_DIR);
    
    if (type === 'domain') {
      // 创建 Domain
      const domainPath = path.join(PROMPTS_DIR, name);
      try {
        await fs.access(domainPath);
        return NextResponse.json(
          { ok: false, error: `Domain "${name}" 已存在` },
          { status: 400 }
        );
      } catch {
        // 目录不存在，可以创建
      }
      await fs.mkdir(domainPath, { recursive: true });
      return NextResponse.json({ ok: true, path: domainPath });
    } else if (type === 'scenario') {
      // 创建 Scenario
      if (!domain || typeof domain !== 'string') {
        return NextResponse.json(
          { ok: false, error: '创建 Scenario 需要指定 Domain' },
          { status: 400 }
        );
      }
      
      const domainPath = path.join(PROMPTS_DIR, domain);
      try {
        await fs.access(domainPath);
      } catch {
        return NextResponse.json(
          { ok: false, error: `Domain "${domain}" 不存在` },
          { status: 404 }
        );
      }
      
      const scenarioPath = path.join(domainPath, name);
      try {
        await fs.access(scenarioPath);
        return NextResponse.json(
          { ok: false, error: `Scenario "${name}" 已存在于 "${domain}" 中` },
          { status: 400 }
        );
      } catch {
        // 目录不存在，可以创建
      }
      await fs.mkdir(scenarioPath, { recursive: true });
      return NextResponse.json({ ok: true, path: scenarioPath });
    } else {
      return NextResponse.json(
        { ok: false, error: '无效的类型，必须是 "domain" 或 "scenario"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { ok: false, error: '创建分类失败' },
      { status: 500 }
    );
  }
}

// PUT - 重命名 Domain 或 Scenario
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { type, domain, oldName, newName } = body;
    
    if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') {
      return NextResponse.json(
        { ok: false, error: '旧名称和新名称不能为空' },
        { status: 400 }
      );
    }
    
    if (!isValidName(newName)) {
      return NextResponse.json(
        { ok: false, error: '新名称只能包含英文字母、数字、连字符和下划线，且必须以字母开头' },
        { status: 400 }
      );
    }
    
    if (type === 'domain') {
      const oldPath = path.join(PROMPTS_DIR, oldName);
      const newPath = path.join(PROMPTS_DIR, newName);
      
      try {
        await fs.access(oldPath);
      } catch {
        return NextResponse.json(
          { ok: false, error: `Domain "${oldName}" 不存在` },
          { status: 404 }
        );
      }
      
      try {
        await fs.access(newPath);
        return NextResponse.json(
          { ok: false, error: `Domain "${newName}" 已存在` },
          { status: 400 }
        );
      } catch {
        // 新路径不存在，可以重命名
      }
      
      await fs.rename(oldPath, newPath);
      return NextResponse.json({ ok: true, path: newPath });
    } else if (type === 'scenario') {
      if (!domain || typeof domain !== 'string') {
        return NextResponse.json(
          { ok: false, error: '重命名 Scenario 需要指定 Domain' },
          { status: 400 }
        );
      }
      
      const domainPath = path.join(PROMPTS_DIR, domain);
      const oldPath = path.join(domainPath, oldName);
      const newPath = path.join(domainPath, newName);
      
      try {
        await fs.access(oldPath);
      } catch {
        return NextResponse.json(
          { ok: false, error: `Scenario "${oldName}" 不存在于 "${domain}" 中` },
          { status: 404 }
        );
      }
      
      try {
        await fs.access(newPath);
        return NextResponse.json(
          { ok: false, error: `Scenario "${newName}" 已存在于 "${domain}" 中` },
          { status: 400 }
        );
      } catch {
        // 新路径不存在，可以重命名
      }
      
      await fs.rename(oldPath, newPath);
      return NextResponse.json({ ok: true, path: newPath });
    } else {
      return NextResponse.json(
        { ok: false, error: '无效的类型，必须是 "domain" 或 "scenario"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to rename category:', error);
    return NextResponse.json(
      { ok: false, error: '重命名失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除 Domain 或 Scenario
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { type, domain, name, force } = body;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { ok: false, error: '名称不能为空' },
        { status: 400 }
      );
    }
    
    if (type === 'domain') {
      const domainPath = path.join(PROMPTS_DIR, name);
      
      try {
        await fs.access(domainPath);
      } catch {
        return NextResponse.json(
          { ok: false, error: `Domain "${name}" 不存在` },
          { status: 404 }
        );
      }
      
      // 检查是否为空
      const entries = await fs.readdir(domainPath);
      if (entries.length > 0 && !force) {
        return NextResponse.json(
          { ok: false, error: `Domain "${name}" 不为空，包含 ${entries.length} 个 Scenario。使用 force=true 强制删除` },
          { status: 400 }
        );
      }
      
      await fs.rm(domainPath, { recursive: true });
      return NextResponse.json({ ok: true });
    } else if (type === 'scenario') {
      if (!domain || typeof domain !== 'string') {
        return NextResponse.json(
          { ok: false, error: '删除 Scenario 需要指定 Domain' },
          { status: 400 }
        );
      }
      
      const scenarioPath = path.join(PROMPTS_DIR, domain, name);
      
      try {
        await fs.access(scenarioPath);
      } catch {
        return NextResponse.json(
          { ok: false, error: `Scenario "${name}" 不存在于 "${domain}" 中` },
          { status: 404 }
        );
      }
      
      // 检查是否为空
      const entries = await fs.readdir(scenarioPath);
      if (entries.length > 0 && !force) {
        return NextResponse.json(
          { ok: false, error: `Scenario "${name}" 不为空，包含 ${entries.length} 个 Prompt。使用 force=true 强制删除` },
          { status: 400 }
        );
      }
      
      await fs.rm(scenarioPath, { recursive: true });
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json(
        { ok: false, error: '无效的类型，必须是 "domain" 或 "scenario"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { ok: false, error: '删除失败' },
      { status: 500 }
    );
  }
}

