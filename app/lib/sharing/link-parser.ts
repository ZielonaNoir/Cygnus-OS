/**
 * 链接解析器
 * 用于解析 cygnus:// 协议链接和分享链接
 */

export type ParsedCygnusLink = {
    valid: boolean;
    type?: 'prompt' | 'project' | 'settings';
    id?: string;
    params?: Record<string, string>;
    error?: string;
};

export type ParsedShareLink = {
    valid: boolean;
    token?: string;
    resourceType?: 'project' | 'prompt';
    resourceId?: string;
    expiresAt?: string;
    isExpired?: boolean;
    maxUses?: number;
    useCount?: number;
    permissions?: {
        read?: boolean;
        write?: boolean;
        admin?: boolean;
    };
    error?: string;
};

export const LinkParser = {
    /**
     * 解析 cygnus:// 链接
     * @param url cygnus://prompt/domain/scenario/name?version=1.0&token=xxx
     */
    parse(url: string): ParsedCygnusLink {
        if (!url.startsWith('cygnus://')) {
            return { valid: false, error: 'Invalid protocol' };
        }

        try {
            // 移除协议头
            const pathWithQuery = url.replace('cygnus://', '');
            const [path, queryString] = pathWithQuery.split('?');

            const parts = path.split('/');
            const type = parts[0] as 'prompt' | 'project' | 'settings';

            //重新组合剩余部分作为 ID (因为 ID 可能包含 /)
            const id = parts.slice(1).join('/');

            const params: Record<string, string> = {};
            if (queryString) {
                const searchParams = new URLSearchParams(queryString);
                searchParams.forEach((value, key) => {
                    params[key] = value;
                });
            }

            return {
                valid: true,
                type,
                id,
                params
            };
        } catch (e) {
            return { valid: false, error: String(e) };
        }
    },

    /**
     * 解析分享链接 token
     * @param token 分享链接的 token
     */
    async parseShareToken(token: string): Promise<ParsedShareLink> {
        try {
            const response = await fetch(`/api/share/${token}`);
            if (!response.ok) {
                return {
                    valid: false,
                    error: response.status === 404 ? 'Share link not found' : 'Failed to fetch share link',
                };
            }

            const data = await response.json();
            const now = new Date();
            const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
            const isExpired = expiresAt ? expiresAt < now : false;
            const isMaxUsesReached = data.maxUses ? data.useCount >= data.maxUses : false;

            if (isExpired || isMaxUsesReached || !data.isActive) {
                return {
                    valid: false,
                    token,
                    error: isExpired ? 'Share link has expired' : isMaxUsesReached ? 'Share link has reached max uses' : 'Share link is inactive',
                    isExpired,
                };
            }

            return {
                valid: true,
                token,
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                expiresAt: data.expiresAt,
                isExpired: false,
                maxUses: data.maxUses,
                useCount: data.useCount,
                permissions: data.permissions,
            };
        } catch (e) {
            return { valid: false, error: String(e) };
        }
    },

    /**
     * 从 URL 中提取分享 token
     * 支持格式: /share/<token> 或 ?token=<token>
     */
    extractTokenFromUrl(url: string): string | null {
        try {
            // 从路径中提取: /share/<token>
            const pathMatch = url.match(/\/share\/([^/?]+)/);
            if (pathMatch) {
                return pathMatch[1];
            }

            // 从查询参数中提取: ?token=<token>
            const urlObj = new URL(url, window.location.origin);
            return urlObj.searchParams.get('token');
        } catch {
            return null;
        }
    },
};
