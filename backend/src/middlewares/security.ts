import { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import xss from 'xss';
import { env } from '../config/env';

// Strip HTML/script from every string in body and query.
// Rich-text product descriptions use a separate allow-list sanitizer on their own route.
function clean(v: unknown): unknown {
  if (typeof v === 'string') return xss(v, { whiteList: {}, stripIgnoreTag: true });
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object')
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, clean(val)]));
  return v;
}
export function sanitize(req: Request, _res: Response, next: NextFunction) {
  if (req.body && !req.path.startsWith('/api/admin/products/rich')) req.body = clean(req.body);
  for (const k of Object.keys(req.query)) (req.query as any)[k] = clean((req.query as any)[k]);
  next();
}

const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  cookieName: env.NODE_ENV === 'production' ? '__Host-ladrim.csrf' : 'ladrim.csrf',
  cookieOptions: { sameSite: 'strict', secure: env.NODE_ENV === 'production', httpOnly: true },
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
});
export { doubleCsrfProtection, generateToken };

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login requests. Please wait a few minutes before trying again for security reasons.',
  },
});

export function applySecurity(app: Express) {
  app.set('trust proxy', 1);
  if (env.NODE_ENV === 'production')
    app.use((req: Request, res: Response, next: NextFunction) =>
      req.secure ? next() : res.redirect(301, `https://${req.headers.host}${req.url}`));
  app.use(helmet({
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], frameAncestors: ["'none'"] } },
  }));
  const allowedOrigins = [
    env.CLIENT_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, same-origin, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || origin.endsWith('.trycloudflare.com')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(hpp());
  app.use(rateLimit({ windowMs: 60_000, limit: 200, standardHeaders: true }));
}
