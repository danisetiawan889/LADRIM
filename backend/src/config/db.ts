import { Pool, QueryResultRow } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  max: 20,
});

// Every query goes through here: values are ALWAYS passed as parameters ($1, $2...).
export async function query<T extends QueryResultRow = any>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}

/**
 * Escapes characters with special meaning in SQL LIKE / ILIKE patterns (%, _, \).
 * Prevents SQL LIKE Wildcard Pattern Injection and ReDoS attacks.
 */
export function escapeLikePattern(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[%_\\]/g, '\\$&');
}

export async function tx<T>(fn: (q: typeof query) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn((t, p = []) => client.query(t, p as any[]) as any);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
