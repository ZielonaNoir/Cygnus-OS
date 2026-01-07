/**
 * MCP Skills Market API
 * 实现 MCP 协议规范，将 PromptHub 作为技能包暴露给 AI 模型
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerInfo, listPublicSkills, listDomains, listScenarios } from '@lib/mcp/skills';

/**
 * GET /api/mcp
 * 返回 MCP 服务信息和可用端点
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    // 默认返回服务信息
    if (!action) {
      const serverInfo = getServerInfo();
      return NextResponse.json({
        success: true,
        data: serverInfo,
      });
    }

    // 获取所有 Domains
    if (action === 'domains') {
      const domains = await listDomains();
      return NextResponse.json({
        success: true,
        data: domains,
      });
    }

    // 获取指定 Domain 的 Scenarios
    if (action === 'scenarios') {
      const domain = searchParams.get('domain');
      if (!domain) {
        return NextResponse.json(
          { success: false, error: { code: 'MISSING_DOMAIN', message: 'domain parameter is required' } },
          { status: 400 }
        );
      }
      const scenarios = await listScenarios(domain);
      return NextResponse.json({
        success: true,
        data: scenarios,
      });
    }

    // 列出所有公开技能
    if (action === 'skills') {
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);
      const result = await listPublicSkills({ limit, offset });
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` } },
      { status: 400 }
    );
  } catch (error) {
    console.error('MCP API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
