/**
 * MCP Skills API - 技能包查询端点
 * GET /api/mcp/skills - 列出所有公开技能
 * GET /api/mcp/skills?query=xxx - 搜索技能
 */

import { NextRequest, NextResponse } from 'next/server';
import { listSkills, searchSkills } from '@lib/mcp/skills';
import type { MCPSearchRequest } from '@lib/mcp/schema';
import { getAuthToken } from '@lib/mcp/auth';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = await getAuthToken(request);

    try {
        const query = searchParams.get('query');
        const domain = searchParams.get('domain');
        const scenario = searchParams.get('scenario');
        const tagsParam = searchParams.get('tags');
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        // 如果有搜索参数，使用搜索接口
        if (query || domain || scenario || tagsParam) {
            const searchRequest: MCPSearchRequest & { token?: string | null } = {
                query: query || undefined,
                domain: domain || undefined,
                scenario: scenario || undefined,
                tags: tagsParam ? tagsParam.split(',') : undefined,
                limit,
                offset,
                token
            };

            const result = await searchSkills(searchRequest);
            return NextResponse.json({
                success: true,
                ...result,
            });
        }

        // 否则返回所有技能 (根据 Auth 决定是否包含 private)
        const result = await listSkills({ limit, offset, token });
        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('MCP Skills API error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}
