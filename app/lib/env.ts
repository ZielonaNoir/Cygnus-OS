/**
 * 环境变量验证和管理
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Warning: Missing environment variable: ${key}`);
      return defaultValue || '';
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  // Supabase
  supabase: {
    url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // LLM / AI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  qwen: {
    apiUrl: process.env.QWEN_API_URL || 'http://localhost:8000/v1',
    apiKey: process.env.QWEN_API_KEY,
  },
  kimi: {
    apiKey: process.env.KIMI_API_KEY,
    apiUrl: process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1',
    model: process.env.KIMI_MODEL || 'moonshot-v1-8k',
  },
  
  // Data Directory
  dataDir: process.env.CYGNUS_DATA_DIR || './data',
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

