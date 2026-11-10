import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import { prisma } from '../config/prisma';
import { signAccess } from '../middlewares/auth';
import { env } from '../config/env';
import { getTrackingUiDetails, buildTimelineSteps } from '../services/tracking.service';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { invalidateToken } from '../services/tokenBlacklist.service';
import {
  checkLoginLock,
  recordLoginFailure,
  recordLoginSuccess,
} from '../services/loginSecurity.service';

const userCookie = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const adminCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

// Helper to generate secure 6-digit numeric OTP code
function generate6DigitOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Step 1: Send 6-digit OTP code to the user's email via Brevo
 * Persisted in PostgreSQL table `pending_registrations` for multi-instance cluster safety.
 */
export async function sendRegisterOtp(req: Request, res: Response) {
  try {
    const { email, password, fullName } = req.body;
    const cleanEmail = String(email).trim().toLowerCase();

    if (!cleanEmail || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 1 uppercase letter (A-Z)' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 1 number (0-9)' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 1 special character (e.g. _, ., !, @, #, $)' });
    }

    const existing = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered. Please sign in instead.' });
    }

    // Rate limiting & duplicate check: check cooldown between OTP requests (60s)
    const { rows: pendingRows } = await query(
      `SELECT last_sent_at, expires_at FROM pending_registrations WHERE email = $1`,
      [cleanEmail]
    );

    if (pendingRows.length > 0) {
      const lastSentTime = new Date(pendingRows[0].last_sent_at).getTime();
      const expiresTime = new Date(pendingRows[0].expires_at).getTime();
      const elapsed = Date.now() - lastSentTime;
      const isNotExpired = Date.now() < expiresTime;

      // If user submits again while previous OTP cooldown (60s) is still running and OTP is unexpired:
      // Do not send a duplicate email or trigger 429 error.
      // Allow user back to the verification screen, carrying over the remaining cooldown seconds.
      if (elapsed < 60_000 && isNotExpired) {
        const remainingSec = Math.max(1, Math.ceil((60_000 - elapsed) / 1000));
        const passwordHash = await bcrypt.hash(password, 12);
        await query(
          `UPDATE pending_registrations SET password_hash = $1, full_name = $2 WHERE email = $3`,
          [passwordHash, String(fullName).trim(), cleanEmail]
        );
        return res.json({
          ok: true,
          reused: true,
          cooldownRemaining: remainingSec,
          message: 'Active verification code still valid',
          email: cleanEmail,
        });
      }
    }

    const otp = generate6DigitOtp();
    const passwordHash = await bcrypt.hash(password, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL
    const now = new Date();

    // Upsert into persistent PostgreSQL table
    await query(
      `INSERT INTO pending_registrations (email, password_hash, full_name, otp, expires_at, last_sent_at, attempts)
       VALUES ($1, $2, $3, $4, $5, $6, 0)
       ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           full_name = EXCLUDED.full_name,
           otp = EXCLUDED.otp,
           expires_at = EXCLUDED.expires_at,
           last_sent_at = EXCLUDED.last_sent_at,
           attempts = 0`,
      [cleanEmail, passwordHash, String(fullName).trim(), otp, expiresAt, now]
    );

    // Send email using Brevo SMTP
    const { sendVerificationOtpEmail } = await import('../services/email.service');
    await sendVerificationOtpEmail(cleanEmail, fullName, otp);

    return res.json({
      ok: true,
      reused: false,
      cooldownRemaining: 60,
      message: 'Verification code sent to your email',
      email: cleanEmail,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send verification code' });
  }
}

/**
 * Step 2: Verify the 6-digit OTP code and finalize user creation
 */
export async function verifyRegisterOtp(req: Request, res: Response) {
  try {
    const { email, otp } = req.body;
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const { rows } = await query(
      `SELECT * FROM pending_registrations WHERE email = $1`,
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No pending registration found or code expired. Please register again.' });
    }

    const pending = rows[0];
    const expiresTime = new Date(pending.expires_at).getTime();

    if (Date.now() > expiresTime) {
      await query(`DELETE FROM pending_registrations WHERE email = $1`, [cleanEmail]);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (Number(pending.attempts) >= 5) {
      await query(`DELETE FROM pending_registrations WHERE email = $1`, [cleanEmail]);
      return res.status(429).json({ error: 'Too many incorrect attempts. Please start registration again.' });
    }

    if (pending.otp !== cleanOtp) {
      await query(
        `UPDATE pending_registrations SET attempts = attempts + 1 WHERE email = $1`,
        [cleanEmail]
      );
      return res.status(400).json({ error: 'Incorrect 6-digit verification code. Please check your email.' });
    }

    // OTP is valid! Create user in database
    const user = await prisma.users.create({
      data: {
        email: cleanEmail,
        password_hash: pending.password_hash,
        full_name: pending.full_name,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        segment: true,
        loyalty_points: true,
        created_at: true,
      },
    });

    // Clean up pending registration row
    await query(`DELETE FROM pending_registrations WHERE email = $1`, [cleanEmail]);

    // Auto-link any existing guest orders
    await prisma.orders.updateMany({
      where: { guest_email: cleanEmail, user_id: null },
      data: { user_id: user.id },
    });

    return res
      .cookie('access_token', signAccess({ sub: user.id, kind: 'user' }, '7d'), userCookie)
      .status(201)
      .json({ ok: true, user });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: err.message || 'Failed to complete registration' });
  }
}

/**
 * Resend 6-digit OTP code to the pending email
 */
export async function resendRegisterOtp(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const cleanEmail = String(email).trim().toLowerCase();

    const { rows } = await query(
      `SELECT * FROM pending_registrations WHERE email = $1`,
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No pending registration found for this email. Please register again.' });
    }

    const pending = rows[0];
    const lastSentTime = new Date(pending.last_sent_at).getTime();
    const elapsed = Date.now() - lastSentTime;

    // Rate limit resend: 60 seconds cooldown
    if (elapsed < 60_000) {
      const waitSec = Math.ceil((60_000 - elapsed) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSec}s before resending` });
    }

    const newOtp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const now = new Date();

    await query(
      `UPDATE pending_registrations
       SET otp = $1, expires_at = $2, last_sent_at = $3, attempts = 0
       WHERE email = $4`,
      [newOtp, expiresAt, now, cleanEmail]
    );

    const { sendVerificationOtpEmail } = await import('../services/email.service');
    await sendVerificationOtpEmail(cleanEmail, pending.full_name, newOtp);

    return res.json({ ok: true, message: 'New verification code sent', cooldownRemaining: 60 });
  } catch (err: any) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: err.message || 'Failed to resend verification code' });
  }
}

/**
 * Direct registration fallback
 */
export async function register(req: Request, res: Response) {
  try {
    const { email, password, fullName } = req.body;
    const cleanEmail = String(email).trim().toLowerCase();

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 1 uppercase letter (A-Z)' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 1 number (0-9)' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 1 special character (e.g. _, ., !, @, #, $)' });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.users.create({
      data: {
        email: cleanEmail,
        password_hash: hash,
        full_name: fullName,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        segment: true,
        loyalty_points: true,
        created_at: true,
      },
    });

    // Also link any existing orders made with this guest email to this user_id
    await prisma.orders.updateMany({
      where: { guest_email: cleanEmail, user_id: null },
      data: { user_id: user.id },
    });

    res
      .cookie('access_token', signAccess({ sub: user.id, kind: 'user' }, '7d'), userCookie)
      .status(201)
      .json({ ok: true, user });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Failed to register account' });
  }
}

const LOCKOUT_WARNING = 'Too many failed login attempts. Please wait 3 minutes before trying again.';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email).trim().toLowerCase();
    const clientIp = String(req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');

    // 1. Check if user account or IP is temporarily locked (after 5 failed attempts)
    const lockCheck = checkLoginLock('user', cleanEmail, clientIp);
    if (lockCheck.isLocked) {
      return res.status(429).json({
        error: LOCKOUT_WARNING,
        locked: true,
        remainingSec: lockCheck.remainingSec,
      });
    }

    const user = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });
    if (!user) {
      const fail = recordLoginFailure('user', cleanEmail, clientIp);
      if (fail.isLocked) {
        return res.status(429).json({
          error: LOCKOUT_WARNING,
          locked: true,
          remainingSec: fail.remainingSec,
        });
      }
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const fail = recordLoginFailure('user', cleanEmail, clientIp);
      if (fail.isLocked) {
        return res.status(429).json({
          error: LOCKOUT_WARNING,
          locked: true,
          remainingSec: fail.remainingSec,
        });
      }
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    // Login successful: reset failed attempt counter
    recordLoginSuccess('user', cleanEmail, clientIp);

    // Link any guest orders placed with this email to user_id
    await prisma.orders.updateMany({
      where: { guest_email: cleanEmail, user_id: null },
      data: { user_id: user.id },
    });

    const userSummary = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      segment: user.segment,
      loyalty_points: user.loyalty_points,
      created_at: user.created_at,
    };

    res
      .cookie('access_token', signAccess({ sub: user.id, kind: 'user' }, '7d'), userCookie)
      .json({ ok: true, user: userSummary });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Failed to log in' });
  }
}

export async function me(req: Request, res: Response) {
  try {
    if (!req.principal || req.principal.kind !== 'user') {
      return res.status(401).json({ user: null });
    }

    const user = await prisma.users.findUnique({
      where: { id: req.principal.sub },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        segment: true,
        loyalty_points: true,
        created_at: true,
        addresses: true,
      },
    });

    if (!user) {
      return res.status(401).json({ user: null });
    }

    // Fetch user orders with tracking data and items
    const rawOrders = await prisma.orders.findMany({
      where: {
        OR: [{ user_id: user.id }, { guest_email: user.email }],
      },
      include: {
        tracking_events: {
          orderBy: { event_time: 'desc' },
        },
        order_items: {
          include: {
            product_variants: {
              include: {
                products: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Format tracking details into Gymshark-style 5 stages for frontend
    const orders = rawOrders.map((o) => {
      let destCountry = 'Indonesia';
      if (o.shipping_address) {
        try {
          const addr = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address as string) : o.shipping_address;
          if (addr && addr.country && typeof addr.country === 'string' && addr.country.trim()) {
            destCountry = addr.country.trim();
          }
        } catch {
          // ignore
        }
      }
      const uiDetails = getTrackingUiDetails(o.tracking_state, destCountry);
      const steps = buildTimelineSteps(o.tracking_state, destCountry);

      return {
        id: o.id,
        tracking_number: o.tracking_number,
        courier: o.courier || 'DHL Express',
        status: o.status,
        total: Number(o.total),
        subtotal: Number(o.subtotal),
        shipping_cost: Number(o.shipping_cost),
        created_at: o.created_at,
        shipping_address: o.shipping_address,
        tracking: {
          order_id: o.id,
          tracking_number: o.tracking_number,
          courier: o.courier || 'DHL Express',
          current_state: o.tracking_state,
          ui_title: uiDetails.ui_title,
          ui_description: uiDetails.ui_description,
          last_raw_status: o.last_raw_status,
          updated_at: o.tracking_updated_at ? new Date(o.tracking_updated_at).toISOString() : new Date().toISOString(),
          steps,
          events: o.tracking_events.map((e) => ({
            id: String(e.id),
            raw_status: e.raw_status,
            mapped_state: e.mapped_state,
            location: e.location || 'In Transit',
            event_time: e.event_time,
          })),
        },
        items: o.order_items.map((i) => ({
          variant_id: i.variant_id,
          name: i.product_variants.products.name,
          size: i.product_variants.size || 'Standard',
          color: i.product_variants.color || 'Signature',
          sku: i.product_variants.sku,
          qty: i.qty,
          unit_price: Number(i.unit_price),
        })),
      };
    });

    return res.json({ user, orders });
  } catch (err: any) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve profile' });
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.access_token;
  if (token) {
    try {
      const decoded = jwt.decode(token) as any;
      const exp = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await invalidateToken(token, exp);
    } catch (e) {
      console.warn('[LOGOUT_REVOCATION_WARN]', e);
    }
  }
  res.clearCookie('access_token').json({ ok: true });
}

export async function adminLogin(req: Request, res: Response) {
  const { email, password, otp } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const clientIp = String(req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');

  // 1. Check if admin account or IP is temporarily locked (after 5 failed attempts)
  const lockCheck = checkLoginLock('admin', cleanEmail, clientIp);
  if (lockCheck.isLocked) {
    return res.status(429).json({
      error: LOCKOUT_WARNING,
      locked: true,
      remainingSec: lockCheck.remainingSec,
    });
  }

  let admin = await prisma.admins.findUnique({
    where: { email: cleanEmail },
  });

  // If admin@ladrim.com doesn't exist yet, auto-create it
  if (!admin && cleanEmail === 'admin@ladrim.com') {
    const hash = await bcrypt.hash('admin123', 10);
    admin = await prisma.admins.create({
      data: {
        email: cleanEmail,
        password_hash: hash,
        role: 'super_admin',
        totp_secret: 'JBSWY3DPEHPK3PXP',
      },
    });
  }

  if (!admin) {
    const fail = recordLoginFailure('admin', cleanEmail, clientIp);
    if (fail.isLocked) {
      return res.status(429).json({
        error: LOCKOUT_WARNING,
        locked: true,
        remainingSec: fail.remainingSec,
      });
    }
    return res.status(401).json({
      error: 'Incorrect email or password',
    });
  }

  const validPassword = await bcrypt.compare(password, admin.password_hash);

  if (!validPassword) {
    const fail = recordLoginFailure('admin', cleanEmail, clientIp);
    if (fail.isLocked) {
      return res.status(429).json({
        error: LOCKOUT_WARNING,
        locked: true,
        remainingSec: fail.remainingSec,
      });
    }
    return res.status(401).json({
      error: 'Incorrect email or password',
    });
  }

  if (admin.totp_secret && otp) {
    const isOtpValid = authenticator.check(otp, admin.totp_secret);
    if (!isOtpValid) {
      const fail = recordLoginFailure('admin', cleanEmail, clientIp);
      if (fail.isLocked) {
        return res.status(429).json({
          error: LOCKOUT_WARNING,
          locked: true,
          remainingSec: fail.remainingSec,
        });
      }
      return res.status(401).json({
        error: 'Invalid 2FA verification code',
      });
    }
  }

  // Admin login successful: reset failed attempt counter
  recordLoginSuccess('admin', cleanEmail, clientIp);

  res
    .cookie(
      'access_token',
      signAccess({ sub: admin.id, kind: 'admin', role: admin.role, mfa: true }, '8h'),
      adminCookie
    )
    .json({
      ok: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
}
