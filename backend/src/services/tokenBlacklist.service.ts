import crypto from 'crypto';
import { query } from '../config/db';

/**
 * SHA-256 hash helper for JWT tokens.
 * We never store raw JWT tokens in the database to prevent token leakage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Add a token to the database blacklist upon logout.
 */
export async function invalidateToken(token: string, expiresAt: Date): Promise<void> {
  if (!token) return;
  const tokenHash = hashToken(token);
  try {
    await query(
      `INSERT INTO invalidated_tokens (token_hash, expires_at)
       VALUES ($1, $2)
       ON CONFLICT (token_hash) DO NOTHING`,
      [tokenHash, expiresAt]
    );
  } catch (err) {
    console.error('[TOKEN_BLACKLIST_INSERT_ERR]', err);
  }
}

/**
 * Check if a token has been blacklisted/revoked.
 */
export async function isTokenInvalidated(token: string): Promise<boolean> {
  if (!token) return false;
  const tokenHash = hashToken(token);
  try {
    const { rows } = await query(
      `SELECT 1 FROM invalidated_tokens WHERE token_hash = $1 AND expires_at > NOW() LIMIT 1`,
      [tokenHash]
    );
    return rows.length > 0;
  } catch (err) {
    console.error('[TOKEN_BLACKLIST_CHECK_ERR]', err);
    return false;
  }
}

/**
 * Cleanup expired tokens from the blacklist table periodically.
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await query(`DELETE FROM invalidated_tokens WHERE expires_at < NOW()`);
    return result.rowCount || 0;
  } catch (err) {
    console.error('[TOKEN_BLACKLIST_CLEANUP_ERR]', err);
    return 0;
  }
}
