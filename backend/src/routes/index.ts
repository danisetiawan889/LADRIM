import { Router } from 'express';
import { query, escapeLikePattern } from '../config/db';
import authRoutes from './auth.routes';
import checkoutRoutes from './checkout.routes';
import adminRoutes from './admin.routes';
import trackingRoutes from './tracking.routes';
import { generateToken } from '../middlewares/security';
import { validate, searchProductsQuerySchema } from '../middlewares/validate';

const api = Router();
api.get('/csrf', (req, res) => res.json({ token: generateToken(req, res) }));
api.use('/auth', authRoutes);
api.use('/checkout', checkoutRoutes);
api.use('/admin', adminRoutes);
api.use('/orders/track', trackingRoutes);
api.use('/tracking', trackingRoutes);
api.use('/webhook/tracking', trackingRoutes);

api.get('/categories', async (_q, res) =>
  res.json((await query(`SELECT id,parent_id,slug,name,level FROM categories ORDER BY level,sort_order`)).rows));

api.get('/products/search', validate({ query: searchProductsQuerySchema }), async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const safeQ = escapeLikePattern(q);
  const { rows } = await query(
    `SELECT id,name,slug,base_price FROM products WHERE is_active AND name ILIKE $1 LIMIT 6`, [`%${safeQ}%`]);
  res.json(rows); // TODO: join a media table for thumbnails
});
api.get('/payments/methods', async (_req, res) => {
  try {
    const { getActivePaymentMethods } = await import('../services/payment.service');
    res.json(await getActivePaymentMethods());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// International Payment Methods API Endpoints
api.post('/payment-methods', async (req, res) => {
  const { createPaymentMethod } = await import('../controllers/paymentMethod.controller');
  return createPaymentMethod(req, res);
});

api.get('/payment-methods', async (req, res) => {
  const { getPaymentMethods } = await import('../controllers/paymentMethod.controller');
  return getPaymentMethods(req, res);
});

export default api;
