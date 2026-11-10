import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { isTokenInvalidated } from '../services/tokenBlacklist.service';

export type Principal = { sub: string; kind: 'user' | 'admin'; role?: string; mfa?: boolean };
declare global { namespace Express { interface Request { principal?: Principal } } }

export const signAccess = (p: Principal, expiresIn: string = '15m') =>
  jwt.sign(p, env.JWT_ACCESS_SECRET, { expiresIn } as jwt.SignOptions);

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const t = req.cookies?.access_token;
  if (t) {
    try {
      // 🔒 Check database blacklist: revoked tokens are immediately rejected
      if (await isTokenInvalidated(t)) {
        req.principal = undefined;
        return next();
      }
      req.principal = jwt.verify(t, env.JWT_ACCESS_SECRET) as Principal;
    } catch {
      req.principal = undefined;
    }
  }
  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (req.principal?.kind !== 'user') return res.status(401).json({ error: 'Sign in required' });
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.principal) return res.status(401).json({ error: 'Authentication required' });
  next();
}
