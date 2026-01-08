/**
 * 重试工具 - 提供指数退避重试逻辑
 */

import { logger } from '../logger.js';
import type { RetryResult } from '../recovery/recovery-types.js';

/**
 * 重试配置
 */
export interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    enableJitter?: boolean;
}

/**
 * 默认重试配置
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    enableJitter: true,
};

/**
 * 检查错误是否可重试
 */
export function isRetryableError(error: unknown): boolean {
    if (!error) return false;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorObj = error as { code?: string; status?: number; statusCode?: number };
    const errorCode = errorObj?.code;

    // 网络错误
    const networkErrors = [
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ENETUNREACH',
        'EHOSTUNREACH',
    ];

    if (errorCode && networkErrors.includes(errorCode)) {
        return true;
    }

    // HTTP 错误（5xx 服务器错误可重试，4xx 客户端错误不可重试）
    const statusCode = errorObj?.status || errorObj?.statusCode;
    if (statusCode !== undefined && statusCode >= 500 && statusCode < 600) {
        return true;
    }

    // 超时错误
    if (errorMessage.toLowerCase().includes('timeout')) {
        return true;
    }

    // 速率限制
    if (errorMessage.toLowerCase().includes('rate limit')) {
        return true;
    }

    return false;
}

/**
 * 计算退避延迟（带抖动）
 */
function calculateBackoffDelay(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number,
    enableJitter: boolean
): number {
    // 指数退避：baseDelay * 2^attempt
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);

    // 限制最大延迟
    let delay = Math.min(exponentialDelay, maxDelayMs);

    // 添加抖动（0-25% 随机变化）
    if (enableJitter) {
        const jitter = delay * 0.25 * Math.random();
        delay = delay + jitter;
    }

    return Math.floor(delay);
}

/**
 * 延迟函数
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带指数退避的重试逻辑
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<RetryResult<T>> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error | undefined;
    let totalDelay = 0;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            // 第一次尝试不延迟
            if (attempt > 0) {
                const delay = calculateBackoffDelay(
                    attempt - 1,
                    config.baseDelayMs,
                    config.maxDelayMs,
                    config.enableJitter
                );

                logger.debug(
                    `Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms delay`
                );

                await sleep(delay);
                totalDelay += delay;
            }

            const result = await operation();

            if (attempt > 0) {
                logger.info(`Operation succeeded after ${attempt} retry(ies)`);
            }

            return {
                success: true,
                result,
                attempts: attempt + 1,
                totalDelay,
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // 检查是否可重试
            if (!isRetryableError(error)) {
                logger.debug('Error is not retryable, failing immediately');
                return {
                    success: false,
                    error: lastError,
                    attempts: attempt + 1,
                    totalDelay,
                };
            }

            // 如果是最后一次尝试，不再重试
            if (attempt === config.maxRetries) {
                logger.warn(
                    `Operation failed after ${config.maxRetries} retries: ${lastError.message}`
                );
                break;
            }

            logger.warn(
                `Attempt ${attempt + 1} failed: ${lastError.message}. Retrying...`
            );
        }
    }

    return {
        success: false,
        error: lastError,
        attempts: config.maxRetries + 1,
        totalDelay,
    };
}

/**
 * 批量重试操作
 */
export async function retryBatch<T>(
    operations: Array<() => Promise<T>>,
    options: RetryOptions = {}
): Promise<Array<RetryResult<T>>> {
    const results: Array<RetryResult<T>> = [];

    for (const operation of operations) {
        const result = await retryWithBackoff(operation, options);
        results.push(result);
    }

    return results;
}
