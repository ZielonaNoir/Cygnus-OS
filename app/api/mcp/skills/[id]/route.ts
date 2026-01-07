/**
 * MCP Skill Detail API - 单个技能详情
 * GET /api/mcp/skills/[id] - 获取技能详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSkillById } from '@lib/mcp/skills';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_ID', message: 'Skill ID is required' } },
                { status: 400 }
            );
        }

        const skill = await getSkillById(id);

        if (!skill) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Skill not found' } },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: skill,
        });
    } catch (error) {
        console.error('MCP Skill Detail API error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}
