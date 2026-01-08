/**
 * 链接生成器
 * 用于生成 Prompt 和 Project 的分享链接（Web、Deep Link、Markdown）
 * 支持过期时间、权限控制、使用次数限制
 */

// import { env } from '../env';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
const PROTOCOL = 'cygnus://';

export interface ShareLinkOptions {
    expiresAt?: Date | string; // 过期时间
    maxUses?: number; // 最大使用次数
    permissions?: {
        read?: boolean;
        write?: boolean;
        admin?: boolean;
    };
    metadata?: Record<string, unknown>;
}

export interface ShareLinkResult {
    token: string;
    webLink: string;
    deepLink: string;
    markdownLink: string;
    expiresAt?: string;
    maxUses?: number;
}

export const LinkGenerator = {
    /**
     * 生成 Web 访问链接（使用分享 token）
     */
    generateWebLink(resourceType: 'project' | 'prompt', resourceId: string, token?: string): string {
        if (token) {
            return `${BASE_URL}/share/${token}`;
        }
        // 直接访问链接（需要登录）
        return `${BASE_URL}/${resourceType === 'project' ? 'dashboard/projects' : 'prompts'}/${resourceId}`;
    },

    /**
     * 生成 App Deep Link
     * 格式: cygnus://<type>/<id>?token=<token>&version=<version>
     */
    generateDeepLink(
        resourceType: 'project' | 'prompt',
        resourceId: string,
        options?: { token?: string; version?: string }
    ): string {
        let url = `${PROTOCOL}${resourceType}/${resourceId}`;
        const params: string[] = [];
        if (options?.token) {
            params.push(`token=${options.token}`);
        }
        if (options?.version) {
            params.push(`version=${options.version}`);
        }
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        return url;
    },

    /**
     * 生成 Markdown 格式链接
     */
    generateMarkdown(title: string, resourceType: 'project' | 'prompt', resourceId: string, token?: string): string {
        const webLink = this.generateWebLink(resourceType, resourceId, token);
        return `[${title}](${webLink})`;
    },

    /**
     * 生成带 protocol 的 Markdown
     */
    generateProtocolMarkdown(
        title: string,
        resourceType: 'project' | 'prompt',
        resourceId: string,
        options?: { token?: string; version?: string }
    ): string {
        const deepLink = this.generateDeepLink(resourceType, resourceId, options);
        return `[打开 ${title} in Cygnus](${deepLink})`;
    },

    /**
     * 生成完整的分享链接信息（包含 token）
     * 此方法会调用 API 创建分享链接记录
     */
    async generateShareLink(
        resourceType: 'project' | 'prompt',
        resourceId: string,
        options: ShareLinkOptions = {}
    ): Promise<ShareLinkResult> {
        // 调用 API 创建分享链接
        const response = await fetch('/api/share/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resourceType,
                resourceId,
                ...options,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create share link');
        }

        const data = await response.json();
        const { token, expiresAt, maxUses } = data;

        return {
            token,
            webLink: this.generateWebLink(resourceType, resourceId, token),
            deepLink: this.generateDeepLink(resourceType, resourceId, { token }),
            markdownLink: this.generateMarkdown(
                resourceType === 'project' ? '项目' : 'Prompt',
                resourceType,
                resourceId,
                token
            ),
            expiresAt,
            maxUses,
        };
    },
};
