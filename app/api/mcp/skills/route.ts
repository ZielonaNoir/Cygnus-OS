/**
 * MCP Skills API - 技能包查询端点
 * GET /api/mcp/skills - 列出所有公开技能
 * GET /api/mcp/skills?query=xxx - 搜索技能
 */

import { NextRequest, NextResponse } from 'next/server';
import { listPublicSkills, searchSkills } from '@lib/mcp/skills';
import type { MCPSearchRequest } from '@lib/mcp/schema';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    try {
        const query = searchParams.get('query');
        const domain = searchParams.get('domain');
        const scenario = searchParams.get('scenario');
        const tagsParam = searchParams.get('tags');
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        // 如果有搜索参数，使用搜索接口
        if (query || domain || scenario || tagsParam) {
            const searchRequest: MCPSearchRequest = {
                query: query || undefined,
                domain: domain || undefined,
                scenario: scenario || undefined,
                tags: tagsParam ? tagsParam.split(',') : undefined,
                limit,
                offset,
            };

            const result = await searchSkills(searchRequest);
            return NextResponse.json({
                success: true,
                ...result,
            });
        }

        // 否则返回所有公开技能
        const result = await listPublicSkills({ limit, offset });
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
