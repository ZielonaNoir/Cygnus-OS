/**
 * MCP Skills 查询服务
 * 将 PromptHub 数据转换为 MCP Skills 格式
 */

import { createAdminClient } from '@lib/supabase/server';
import type { MCPSkill, MCPSkillSummary, MCPSearchRequest, MCPListResponse, MCPServerInfo } from './schema';

/** MCP 服务器信息 */
export function getServerInfo(): MCPServerInfo {
    return {
        name: 'Cygnus-OS PromptHub',
        version: '1.0.0',
        description: 'AI 并行工程管理系统的技能包市场，提供 Prompt 资产查询服务',
        capabilities: ['skills.list', 'skills.search', 'skills.get'],
        endpoints: {
            skills: '/api/mcp/skills',
            search: '/api/mcp/skills/search',
        },
    };
}

/**
 * 列出所有公开的技能包
 */
export async function listPublicSkills(
    options: { limit?: number; offset?: number } = {}
): Promise<MCPListResponse<MCPSkillSummary>> {
    const { limit = 20, offset = 0 } = options;
    const supabase = createAdminClient();

    // 查询公开的 prompt_repos 和关联的 prompts
    const { data: repos, error, count } = await supabase
        .from('prompt_repos')
        .select(
            `
      id,
      name,
      description,
      domain,
      scenario,
      visibility,
      prompts (
        id,
        title,
        summary,
        tags
      )
    `,
            { count: 'exact' }
        )
        .eq('visibility', 'public')
        .range(offset, offset + limit - 1)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching skills:', error);
        return { data: [], total: 0, limit, offset };
    }

    // 转换为 MCPSkillSummary 格式
    const skills: MCPSkillSummary[] = (repos || []).map((repo) => {
        const prompt = Array.isArray(repo.prompts) ? repo.prompts[0] : null;
        return {
            id: repo.id,
            name: repo.name,
            description: prompt?.summary || repo.description || '',
            domain: repo.domain,
            scenario: repo.scenario,
            tags: prompt?.tags || [],
            visibility: repo.visibility as 'public' | 'private',
        };
    });

    return {
        data: skills,
        total: count || 0,
        limit,
        offset,
    };
}

/**
 * 搜索技能包
 */
export async function searchSkills(
    request: MCPSearchRequest
): Promise<MCPListResponse<MCPSkillSummary>> {
    const { query, domain, scenario, tags, limit = 20, offset = 0 } = request;
    const supabase = createAdminClient();

    let queryBuilder = supabase
        .from('prompt_repos')
        .select(
            `
      id,
      name,
      description,
      domain,
      scenario,
      visibility,
      prompts (
        id,
        title,
        summary,
        tags
      )
    `,
            { count: 'exact' }
        )
        .eq('visibility', 'public');

    // 按 domain 筛选
    if (domain) {
        queryBuilder = queryBuilder.eq('domain', domain);
    }

    // 按 scenario 筛选
    if (scenario) {
        queryBuilder = queryBuilder.eq('scenario', scenario);
    }

    // 文本搜索（name 或 description）
    if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data: repos, error, count } = await queryBuilder
        .range(offset, offset + limit - 1)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error searching skills:', error);
        return { data: [], total: 0, limit, offset };
    }

    // 转换为 MCPSkillSummary 格式
    let skills: MCPSkillSummary[] = (repos || []).map((repo) => {
        const prompt = Array.isArray(repo.prompts) ? repo.prompts[0] : null;
        return {
            id: repo.id,
            name: repo.name,
            description: prompt?.summary || repo.description || '',
            domain: repo.domain,
            scenario: repo.scenario,
            tags: prompt?.tags || [],
            visibility: repo.visibility as 'public' | 'private',
        };
    });

    // 按 tags 筛选（在内存中处理，因为 tags 是数组）
    if (tags && tags.length > 0) {
        skills = skills.filter((skill) =>
            tags.some((tag) => skill.tags.includes(tag))
        );
    }

    return {
        data: skills,
        total: count || skills.length,
        limit,
        offset,
    };
}

/**
 * 获取单个技能包详情
 */
export async function getSkillById(id: string): Promise<MCPSkill | null> {
    const supabase = createAdminClient();

    // 查询 repo
    const { data: repo, error: repoError } = await supabase
        .from('prompt_repos')
        .select('*')
        .eq('id', id)
        .single();

    if (repoError || !repo) {
        console.error('Error fetching repo:', repoError);
        return null;
    }

    // 检查权限（只返回公开的或服务端调用）
    if (repo.visibility !== 'public') {
        return null;
    }

    // 查询关联的 prompt
    const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .select('*')
        .eq('repo_id', id)
        .single();

    if (promptError) {
        console.error('Error fetching prompt:', promptError);
    }

    // 查询 prompt_metadata（如果存在）
    let context: string | undefined;
    if (prompt) {
        const { data: metadata } = await supabase
            .from('prompt_metadata')
            .select('*')
            .eq('prompt_id', prompt.id)
            .single();

        if (metadata?.ai_summary) {
            context = metadata.ai_summary;
        }
    }

    return {
        id: repo.id,
        name: repo.name,
        description: repo.description || '',
        domain: repo.domain,
        scenario: repo.scenario,
        tags: prompt?.tags || [],
        version: prompt?.version || '1.0.0',
        visibility: repo.visibility as 'public' | 'private',
        content: prompt?.content || '',
        context,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
    };
}

/**
 * 获取所有可用的 Domains
 */
export async function listDomains(): Promise<string[]> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('prompt_repos')
        .select('domain')
        .eq('visibility', 'public');

    if (error) {
        console.error('Error fetching domains:', error);
        return [];
    }

    // 去重
    const domains = [...new Set((data || []).map((r) => r.domain))];
    return domains.sort();
}

/**
 * 获取指定 Domain 下的所有 Scenarios
 */
export async function listScenarios(domain: string): Promise<string[]> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('prompt_repos')
        .select('scenario')
        .eq('visibility', 'public')
        .eq('domain', domain);

    if (error) {
        console.error('Error fetching scenarios:', error);
        return [];
    }

    // 去重
    const scenarios = [...new Set((data || []).map((r) => r.scenario))];
    return scenarios.sort();
}
