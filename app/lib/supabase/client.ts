/**
 * Supabase 客户端（浏览器端）
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@lib/env';

export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

