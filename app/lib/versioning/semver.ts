/**
 * 版本号工具函数
 * 实现语义化版本控制 (Semantic Versioning)
 */

export interface SemanticVersion {
    major: number;
    minor: number;
    patch: number;
}

/**
 * 解析语义化版本字符串
 * @param versionString - 例如 "1.0.0"
 * @returns SemanticVersion 对象
 */
export function parseVersion(versionString: string): SemanticVersion {
    const parts = versionString.split('.');
    return {
        major: parseInt(parts[0] || '1', 10),
        minor: parseInt(parts[1] || '0', 10),
        patch: parseInt(parts[2] || '0', 10),
    };
}

/**
 * 将 SemanticVersion 对象转换为字符串
 * @param version - SemanticVersion 对象
 * @returns 版本字符串，例如 "1.0.1"
 */
export function stringifyVersion(version: SemanticVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * 递增补丁版本号 (Patch)
 * @param currentVersion - 当前版本字符串，例如 "1.0.0"
 * @returns 新版本字符串，例如 "1.0.1"
 */
export function incrementPatch(currentVersion: string): string {
    const version = parseVersion(currentVersion);
    version.patch += 1;
    return stringifyVersion(version);
}

/**
 * 递增次版本号 (Minor)
 * @param currentVersion - 当前版本字符串
 * @returns 新版本字符串，例如 "1.1.0"
 */
export function incrementMinor(currentVersion: string): string {
    const version = parseVersion(currentVersion);
    version.minor += 1;
    version.patch = 0;
    return stringifyVersion(version);
}

/**
 * 递增主版本号 (Major)
 * @param currentVersion - 当前版本字符串
 * @returns 新版本字符串，例如 "2.0.0"
 */
export function incrementMajor(currentVersion: string): string {
    const version = parseVersion(currentVersion);
    version.major += 1;
    version.minor = 0;
    version.patch = 0;
    return stringifyVersion(version);
}
