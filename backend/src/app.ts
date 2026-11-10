import express, { NextFunction, Request, Response } from 'express';
import { applySecurity, sanitize, doubleCsrfProtection } from './middlewares/security';
import { optionalAuth } from './middlewares/auth';
import { webhook } from './controllers/checkout.controller';
import { handleCarrierWebhook } from './controllers/tracking.controller';
import api from './routes';

export const app = express();
applySecurity(app);

// Server-to-server webhooks: no cookies/CSRF
app.post('/api/webhooks/midtrans', express.json(), (req, res, next) => webhook(req, res).catch(next));
app.post('/api/webhooks/tracking', express.json(), (req, res, next) => handleCarrierWebhook(req, res).catch(next));
app.post('/api/webhook/tracking', express.json(), (req, res, next) => handleCarrierWebhook(req, res).catch(next));

app.use(express.json({ limit: '1mb' }));
app.use(sanitize);
app.use(optionalAuth);
app.use('/api', doubleCsrfProtection, api); // CSRF on every state-changing call

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.status !== 401) console.error(err);
  res.status(err.status ?? 500).json({ error: err.status ? err.message : 'Something went wrong' });
});
