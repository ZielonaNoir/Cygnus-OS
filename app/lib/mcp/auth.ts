
import { NextRequest } from 'next/server';
import { authenticateApiKey } from '@/app/actions/api-keys';

/**
 * 从请求中提取认证 Token 或 API Key
 * 支持:
 * 1. Header (Authorization: Bearer <token>)
 * 2. Query Param (?token=<token>) - JWT Token
 * 3. Query Param (?apikey=<key>) - Permanent API Key
 */
export async function getAuthToken(request: NextRequest): Promise<string | null> {
    // 1. Check Header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // 2. Check Query Param for JWT Token
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (token) return token;

    // 3. Check Query Param for API Key (NEW)
    const apiKey = searchParams.get('apikey');
    if (apiKey) {
        // Authenticate API key and return a valid token
        const validToken = await authenticateApiKey(apiKey);
        return validToken;
    }

    return null;
}
