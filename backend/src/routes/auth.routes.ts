import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { authRateLimiter } from '../middlewares/security';
import * as c from '../controllers/auth.controller';
import { checkLoginLock } from '../services/loginSecurity.service';

const r = Router();
const registerCreds = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const LOCKOUT_WARNING = 'Too many failed login attempts. Please wait 3 minutes before trying again.';

// User login pre-check: Checks lockout FIRST, never throws "Invalid input"
function userLoginMiddleware(req: Request, res: Response, next: NextFunction) {
  const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
  const clientIp = String(req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');

  // 1. Check if user or IP is locked
  const lockCheck = checkLoginLock('user', cleanEmail, clientIp);
  if (lockCheck.isLocked) {
    return res.status(429).json({
      error: LOCKOUT_WARNING,
      locked: true,
      remainingSec: lockCheck.remainingSec,
    });
  }

  // 2. Normalize and check presence without showing technical "Invalid input"
  const password = String(req.body?.password || '');
  if (!cleanEmail || !password) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  req.body.email = cleanEmail;
  req.body.password = password;
  next();
}

// Admin login pre-check: Checks lockout FIRST, never throws "Invalid input"
function adminLoginMiddleware(req: Request, res: Response, next: NextFunction) {
  const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
  const clientIp = String(req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');

  // 1. Check if admin or IP is locked
  const lockCheck = checkLoginLock('admin', cleanEmail, clientIp);
  if (lockCheck.isLocked) {
    return res.status(429).json({
      error: LOCKOUT_WARNING,
      locked: true,
      remainingSec: lockCheck.remainingSec,
    });
  }

  // 2. Normalize and check presence without showing technical "Invalid input"
  const password = String(req.body?.password || '');
  if (!cleanEmail || !password) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  req.body.email = cleanEmail;
  req.body.password = password;
  next();
}

r.get('/me', c.me);
r.post('/register', validate(registerCreds.extend({ fullName: z.string().min(1).max(100) })), c.register);

// 6-digit OTP verification flow
r.post('/register/send-otp', validate(registerCreds.extend({ fullName: z.string().min(1).max(100) })), c.sendRegisterOtp);
r.post(
  '/register/verify-otp',
  validate(z.object({ email: z.string().email(), otp: z.string().min(6).max(6) })),
  c.verifyRegisterOtp
);
r.post(
  '/register/resend-otp',
  validate(z.object({ email: z.string().email() })),
  c.resendRegisterOtp
);

r.post('/login', authRateLimiter, userLoginMiddleware, c.login);
r.post('/logout', c.logout);
r.post(
  '/admin/login',
  authRateLimiter,
  adminLoginMiddleware,
  c.adminLogin
);

export default r;
