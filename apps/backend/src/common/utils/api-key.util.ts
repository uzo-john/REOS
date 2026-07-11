import * as crypto from 'crypto';

const API_KEY_PREFIX = 'reos_';

/**
 * Generates a new API key pair: { rawKey, keyHash, keyPrefix }
 * rawKey    — shown to user once, never stored
 * keyHash   — stored in DB (sha256 hash)
 * keyPrefix — first 8 chars for identification (e.g. reos_abc1)
 */
export function generateApiKey(): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const secret = crypto.randomBytes(32).toString('hex');
  const rawKey = `${API_KEY_PREFIX}${secret}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 12);
  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hashes an incoming API key for lookup
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}
