import { Request, Response, NextFunction } from 'express';

export const PERMISSIONS = {
  super_admin: ['*'],
  chat_admin: ['chat:*', 'customers:read', 'orders:read'],
  warehouse_admin: ['inventory:*', 'orders:read', 'orders:update', 'shipping:*'],
} as const;

const can = (role: keyof typeof PERMISSIONS, perm: string) =>
  (PERMISSIONS[role] as readonly string[] | undefined)?.some(
    (p) => p === '*' || p === perm || (p.endsWith(':*') && perm.startsWith(p.slice(0, -1))),
  ) ?? false;

export const requirePermission = (perm: string) => (req: Request, res: Response, next: NextFunction) => {
  const p = req.principal;
  if (p?.kind !== 'admin' || !p.mfa) return res.status(401).json({ error: 'Admin sign-in with 2FA required' });
  if (!can(p.role as keyof typeof PERMISSIONS, perm)) return res.status(403).json({ error: 'Not permitted' });
  next();
};

export const rbac = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const p = req.principal;
  if (!p || p.kind !== 'admin') {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  // super_admin always has access
  if (p.role === 'super_admin') {
    return next();
  }

  const userRole = (p.role || '').toLowerCase();
  const allowed = roles.map((r) => r.toLowerCase());

  const isAllowed =
    allowed.includes(userRole) ||
    (allowed.includes('admin') && (userRole.includes('admin') || userRole === 'super_admin')) ||
    (allowed.includes('staff') &&
      (userRole.includes('admin') ||
        userRole.includes('staff') ||
        userRole === 'warehouse_admin' ||
        userRole === 'chat_admin'));

  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
  }
  next();
};
