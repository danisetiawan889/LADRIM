/**
 * Login Security & Brute Force Protection Service
 *
 * Requirements:
 * - Maximum 5 failed attempts (for both User and Admin logins)
 * - 3-minute temporary lockout upon exceeding 5 failed attempts
 * - No remaining attempts warning text displayed to user during regular failures
 * - Reset on successful authentication
 */

interface AttemptRecord {
  attempts: number;
  lastAttemptAt: number;
  lockedUntil?: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 3 * 60 * 1000; // 3 minutes

// In-memory cache for failed attempts
const attemptStore = new Map<string, AttemptRecord>();

// Cleanup expired records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attemptStore.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) {
      attemptStore.delete(key);
    } else if (!record.lockedUntil && now - record.lastAttemptAt > LOCKOUT_DURATION_MS) {
      attemptStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function getKey(type: 'user' | 'admin', email: string): string {
  return `${type}:${normalizeEmail(email)}`;
}

function getIpKey(type: 'user' | 'admin', ip: string): string {
  return `ip:${type}:${String(ip || '').trim()}`;
}

/**
 * Check if login is currently permitted or if account/IP is locked
 */
export function checkLoginLock(
  type: 'user' | 'admin',
  email: string,
  ip: string
): { isLocked: boolean; remainingSec: number; attempts: number } {
  const now = Date.now();
  const emailKey = getKey(type, email);
  const ipKey = getIpKey(type, ip);

  const emailRec = attemptStore.get(emailKey);
  const ipRec = attemptStore.get(ipKey);

  // Check email-based lock
  if (emailRec?.lockedUntil && now < emailRec.lockedUntil) {
    const remainingSec = Math.ceil((emailRec.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSec, attempts: emailRec.attempts };
  }

  // Check IP-based lock
  if (ipRec?.lockedUntil && now < ipRec.lockedUntil) {
    const remainingSec = Math.ceil((ipRec.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSec, attempts: ipRec.attempts };
  }

  const currentAttempts = Math.max(emailRec?.attempts || 0, ipRec?.attempts || 0);
  return { isLocked: false, remainingSec: 0, attempts: currentAttempts };
}

/**
 * Record a failed login attempt. Increments count and locks if 5 attempts reached.
 */
export function recordLoginFailure(
  type: 'user' | 'admin',
  email: string,
  ip: string
): {
  isLocked: boolean;
  attempts: number;
  remainingAttempts: number;
  remainingSec: number;
} {
  const now = Date.now();
  const emailKey = getKey(type, email);
  const ipKey = getIpKey(type, ip);

  // Update email record
  const currentEmailRec = attemptStore.get(emailKey) || { attempts: 0, lastAttemptAt: now };
  const newEmailAttempts = (currentEmailRec.attempts || 0) + 1;
  const isEmailLocked = newEmailAttempts >= MAX_ATTEMPTS;

  attemptStore.set(emailKey, {
    attempts: newEmailAttempts,
    lastAttemptAt: now,
    lockedUntil: isEmailLocked ? now + LOCKOUT_DURATION_MS : undefined,
  });

  // Update IP record
  if (ip) {
    const currentIpRec = attemptStore.get(ipKey) || { attempts: 0, lastAttemptAt: now };
    const newIpAttempts = (currentIpRec.attempts || 0) + 1;
    const isIpLocked = newIpAttempts >= MAX_ATTEMPTS;

    attemptStore.set(ipKey, {
      attempts: newIpAttempts,
      lastAttemptAt: now,
      lockedUntil: isIpLocked ? now + LOCKOUT_DURATION_MS : undefined,
    });
  }

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - newEmailAttempts);
  const remainingSec = isEmailLocked ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0;

  return {
    isLocked: isEmailLocked,
    attempts: newEmailAttempts,
    remainingAttempts,
    remainingSec,
  };
}

/**
 * Reset failed attempts upon successful authentication
 */
export function recordLoginSuccess(
  type: 'user' | 'admin',
  email: string,
  ip: string
): void {
  const emailKey = getKey(type, email);
  const ipKey = getIpKey(type, ip);

  attemptStore.delete(emailKey);
  if (ip) {
    attemptStore.delete(ipKey);
  }
}

/**
 * Manually reset lock for an account (admin tool / test helper)
 */
export function resetLoginLock(
  type: 'user' | 'admin',
  email: string,
  ip?: string
): void {
  attemptStore.delete(getKey(type, email));
  if (ip) {
    attemptStore.delete(getIpKey(type, ip));
  }
}
