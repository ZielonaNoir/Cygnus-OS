/**
 * MCP Skills 查询服务
 * 将 PromptHub 数据转换为 MCP Skills 格式
 */

import { createClientFromToken } from '@lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@lib/env';
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
 * 获取 Supabase 客户端
 * 有 Token -> User Client (RLS) - 可以访问自己的 private repos
 * 无 Token -> Anonymous Client (RLS) - 只能访问 public repos
 * 
 * 注意：不再使用 Admin Client，确保 RLS 策略生效
 */
function getClient(token?: string | null) {
    if (token) {
        return createClientFromToken(token);
    }
    // 无 token 时，使用匿名客户端（anon key），RLS 会自动过滤只返回 public 数据
    // 这比使用 admin client 更安全，因为会遵守 RLS 策略
    return createSupabaseClient(env.supabase.url, env.supabase.anonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * 列出技能包 (支持 Auth)
 */
export async function listSkills(
    options: { limit?: number; offset?: number; token?: string | null } = {}
): Promise<MCPListResponse<MCPSkillSummary>> {
    const { limit = 20, offset = 0, token } = options;
    const supabase = getClient(token);

    let query = supabase
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
        );

    // 如果未认证，强制过滤 public
    if (!token) {
        query = query.eq('visibility', 'public');
    }

    const { data: repos, error, count } = await query
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

// 兼容旧名字，避免破坏性变更（如果有其他地方引用）
export const listPublicSkills = listSkills;

/**
 * 搜索技能包 (支持 Auth)
 */
export async function searchSkills(
    request: MCPSearchRequest & { token?: string | null }
): Promise<MCPListResponse<MCPSkillSummary>> {
    const { query, domain, scenario, tags, limit = 20, offset = 0, token } = request;
    const supabase = getClient(token);

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
        );

    // 如果未认证，强制过滤 public
    if (!token) {
        queryBuilder = queryBuilder.eq('visibility', 'public');
    }

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
 * 获取单个技能包详情 (支持 Auth)
 */
export async function getSkillById(id: string, token?: string | null): Promise<MCPSkill | null> {
    const supabase = getClient(token);

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

    // 如果未认证，且不是 public，则无权访问
    // 注意：如果是 Admin Client，select * 会拿到 private 数据，所以这里必须手动检查
    // 如果是 RLS Client，select * 根本拿不到 private 数据（返回 null error），所以这层检查是双保险
    if (!token && repo.visibility !== 'public') {
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
 * 获取所有可用的 Domains (支持 Auth - 仅看可见的)
 */
export async function listDomains(token?: string | null): Promise<string[]> {
    const supabase = getClient(token);

    let query = supabase
        .from('prompt_repos')
        .select('domain');

    if (!token) {
        query = query.eq('visibility', 'public');
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching domains:', error);
        return [];
    }

    // 去重
    const domains = [...new Set((data || []).map((r) => r.domain))];
    return domains.sort();
}

/**
 * 获取指定 Domain 下的所有 Scenarios (支持 Auth)
 */
export async function listScenarios(domain: string, token?: string | null): Promise<string[]> {
    const supabase = getClient(token);

    let query = supabase
        .from('prompt_repos')
        .select('scenario')
        .eq('domain', domain);

    if (!token) {
        query = query.eq('visibility', 'public');
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching scenarios:', error);
        return [];
    }

    // 去重
    const scenarios = [...new Set((data || []).map((r) => r.scenario))];
    return scenarios.sort();
}
