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

/**
 * 创建新 Prompt 资产 (需认证)
 */
export async function createSkill(
    token: string,
    data: {
        domain: string;
        scenario: string;
        name: string;
        title: string;
        content: string;
        description?: string;
        summary?: string;
        tags?: string[];
        context?: string;
        visibility?: 'public' | 'private';
    }
): Promise<{ success: boolean; id?: string; error?: string }> {
    const supabase = getClient(token);

    // 1. 获取用户信息 (用于设置 owner_id - 虽然 RLS 会自动处理，但显式设置更好)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "未认证用户" };

    // 2. 创建 Prompt Repo
    const path = `${data.domain}.${data.scenario}.${data.name}`; // LTree format
    const { data: repo, error: repoError } = await supabase
        .from('prompt_repos')
        .insert({
            name: data.name,
            description: data.description,
            domain: data.domain,
            scenario: data.scenario,
            path: path,
            visibility: data.visibility || 'private',
            owner_id: user.id
        })
        .select()
        .single();

    if (repoError) {
        return { success: false, error: `Repo creation failed: ${repoError.message}` };
    }

    // 3. 创建 Prompt Content
    const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .insert({
            repo_id: repo.id,
            title: data.title,
            content: data.content,
            summary: data.summary,
            tags: data.tags || [],
            version: '1.0.0',
            main_prompt_path: 'main.prompt', // Placeholder
        })
        .select()
        .single();

    if (promptError) {
        // 回滚: 删除 repo (Best effort)
        await supabase.from('prompt_repos').delete().eq('id', repo.id);
        return { success: false, error: `Prompt creation failed: ${promptError.message}` };
    }

    // 4. 创建 Metadata (Context)
    if (data.context) {
        await supabase.from('prompt_metadata').insert({
            prompt_id: prompt.id,
            ai_summary: data.context
        });
    }

    // 5. 创建 Version 0
    await supabase.from('prompt_versions').insert({
        prompt_id: prompt.id,
        version: '1.0.0',
        content: data.content,
        created_by: user.id
    });

    return { success: true, id: repo.id };
}

/**
 * 更新 Prompt 资产 (需认证 + RLS)
 */
export async function updateSkill(
    token: string,
    id: string,
    data: {
        content?: string;
        title?: string;
        description?: string;
        tags?: string[];
        context?: string;
        summary?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient(token);

    // 1. 获取关联 Prompt ID (RLS 确保只能查到有权限的)
    const { data: existingPrompt, error: fetchError } = await supabase
       .from('prompts')
       .select('id, version, content')
       .eq('repo_id', id)
       .single();
    
    // 如果查不到，说明不存在或者无权访问
    if (fetchError || !existingPrompt) {
        return { success: false, error: "资产不存在或无权访问" };
    }

    // 2. 更新 Repo 信息 (Description)
    if (data.description) {
        await supabase
            .from('prompt_repos')
            .update({ description: data.description })
            .eq('id', id);
    }

    // 3. 更新 Prompt 内容
    const updatePayload: Record<string, any> = {};
    if (data.content) updatePayload.content = data.content;
    if (data.title) updatePayload.title = data.title;
    if (data.tags) updatePayload.tags = data.tags;
    if (data.summary) updatePayload.summary = data.summary;

    if (Object.keys(updatePayload).length > 0) {
        // 增加版本号逻辑 (简单 +1 patch)
        const [major, minor, patch] = existingPrompt.version.split('.').map(Number);
        const newVersion = `${major}.${minor}.${patch + 1}`;
        updatePayload.version = newVersion;

        const { error: updateError } = await supabase
            .from('prompts')
            .update(updatePayload)
            .eq('id', existingPrompt.id);

        if (updateError) return { success: false, error: updateError.message };

        // 创建新版本快照
        if (data.content) {
             const { data: { user } } = await supabase.auth.getUser();
             await supabase.from('prompt_versions').insert({
                prompt_id: existingPrompt.id,
                version: newVersion,
                content: data.content,
                created_by: user?.id
            });
        }
    }

    // 4. 更新 Metadata (Context)
    if (data.context) {
        // Upsert metadata
        const { error: metaError } = await supabase
            .from('prompt_metadata')
            .upsert({ 
                prompt_id: existingPrompt.id, 
                ai_summary: data.context 
            }, { onConflict: 'prompt_id' });
            
        if (metaError) console.error("Metadata update failed", metaError);
    }

    return { success: true };
}

/**
 * 删除 Prompt 资产 (需认证 + RLS)
 */
export async function deleteSkill(token: string, id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient(token);

    // RLS 会阻止删除非 Owner 的数据
    // 由于有外键 Cascade (假设 DB 定义了，或者手动清理)
    // 根据之前的 Migration，没有明确定义 ON DELETE CASCADE，所以需要手动清理关联表
    // 或者 Supabase Client 尝试删除 Repo，如果没有 Cascade 可能会报错

    // 先查询 prompt_id
    const { data: prompt } = await supabase.from('prompts').select('id').eq('repo_id', id).single();
    
    if (prompt) {
        // 删除依赖项
        await supabase.from('prompt_metadata').delete().eq('prompt_id', prompt.id);
        await supabase.from('prompt_versions').delete().eq('prompt_id', prompt.id);
        await supabase.from('prompts').delete().eq('id', prompt.id); // 删除 Prompt
    }

    // 删除 Repo
    const { error } = await supabase
        .from('prompt_repos')
        .delete()
        .eq('id', id);

    if (error) {
        return { success: false, error: `Delete failed: ${error.message}` };
    }

    return { success: true };
}
