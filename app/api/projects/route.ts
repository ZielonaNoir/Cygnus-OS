/**
 * 项目 CRUD API
 * GET /api/projects - 列出所有项目（遵循 RLS）
 * POST /api/projects - 创建新项目
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET: 列出所有项目
export async function GET() {
    try {
        const supabase = await createClient();

        // 验证用户
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 查询项目（RLS 会自动过滤）
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch projects:', error);
            return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
        }

        return NextResponse.json({ projects });
    } catch (error) {
        console.error('Projects fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: 创建新项目
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 验证用户
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, path, progress, status, healthScore } = body;

        if (!name || !path) {
            return NextResponse.json({ error: 'Missing required fields: name, path' }, { status: 400 });
        }

        // 检查路径是否已存在
        const { data: existing } = await supabase
            .from('projects')
            .select('id')
            .eq('path', path)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Project with this path already exists' }, { status: 409 });
        }

        // 创建项目
        const { data: project, error } = await supabase
            .from('projects')
            .insert({
                name,
                description: description || null,
                path,
                progress: progress || 0,
                status: status || 'pending',
                health_score: healthScore || 0,
                owner_id: user.id, // 自动设置为当前用户
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create project:', error);
            return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
        }

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error('Project creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
