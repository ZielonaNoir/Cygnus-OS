/**
 * Supabase 客户端（服务器端）
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@lib/env';

/**
 * 创建服务器端 Supabase 客户端（使用用户会话）
 * 注意：在 Next.js App Router 中，应该使用 @supabase/ssr 包来处理服务器端会话
 * 这里提供简化版本，实际使用时建议安装 @supabase/ssr
 */
export async function createServerClient() {
  return createClient(env.supabase.url, env.supabase.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * 创建管理员 Supabase 客户端（使用 Service Role Key）
 * 仅在服务器端使用，绕过 RLS
 */
export function createAdminClient() {
  if (!env.supabase.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

