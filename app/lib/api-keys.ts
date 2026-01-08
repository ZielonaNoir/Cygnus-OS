/**
 * API Key Utilities
 * Handles generation, hashing, and validation of permanent API keys for MCP authentication
 */

import { createHash, randomBytes } from 'crypto';

const API_KEY_PREFIX = 'cygnus_sk_';
const KEY_LENGTH = 32; // bytes (will be 64 hex chars)

/**
 * Generate a new API key
 * Format: cygnus_sk_[64 hex characters]
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const randomPart = randomBytes(KEY_LENGTH).toString('hex');
  const key = `${API_KEY_PREFIX}${randomPart}`;
  const prefix = key.substring(0, 20); // Show first 20 chars for display
  const hash = hashApiKey(key);
  
  return { key, prefix, hash };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  const pattern = new RegExp(`^${API_KEY_PREFIX}[a-f0-9]{64}$`);
  return pattern.test(key);
}

/**
 * Mask API key for display (show only prefix)
 */
export function maskApiKey(prefix: string): string {
  return `${prefix}${'*'.repeat(52)}`;
}
