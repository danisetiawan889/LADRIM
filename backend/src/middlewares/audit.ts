import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';

// Mount on every admin router: logs each successful state-changing request.
export function audit(entity: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 400) {
        query(
          `INSERT INTO audit_logs (admin_id, action, entity, entity_id, diff, ip) VALUES ($1,$2,$3,$4,$5,$6)`,
          [req.principal?.sub, req.method, entity, req.params.id ?? null, JSON.stringify(req.body ?? {}), req.ip],
        ).catch(console.error);
      }
    });
    next();
  };
}

export function auditLogger(entityOrReq?: any, res?: Response, next?: NextFunction): any {
  if (typeof entityOrReq === 'string') {
    return audit(entityOrReq);
  }
  if (entityOrReq && typeof entityOrReq === 'object' && res && next) {
    return audit('admin')(entityOrReq, res, next);
  }
  return audit('admin');
}
