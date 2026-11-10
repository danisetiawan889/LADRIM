import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import * as c from '../controllers/checkout.controller';
import * as paypalController from '../controllers/paypal.controller';

const r = Router();

// Guests send an email; registered users are identified by their cookie (optionalAuth runs globally).
r.post('/', validate(z.object({
  email: z.string().email().optional(),
  items: z.array(z.object({ variantId: z.string().uuid(), qty: z.number().int().min(1).max(99) })).min(1),
})), c.start);

r.put('/:id/address', validate(z.object({
  courier: z.enum(['jne', 'jnt', 'sicepat']),
  address: z.object({ recipient: z.string(), phone: z.string(), line1: z.string(), cityId: z.string(), postalCode: z.string() }),
})), c.address);

r.post('/:id/pay', c.pay);

// 🔒 ZOD VALIDATION SCHEMAS FOR PAYPAL ENDPOINTS
const paypalCreateOrderSchema = z.object({
  email: z.string().email().optional(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      variantId: z.string().optional(),
      qty: z.number().int().min(1).max(99),
    }).refine((data) => Boolean(data.id || data.variantId), {
      message: 'Item must specify an id or variantId',
    })
  ).min(1, 'Cart items cannot be empty'),
  address: z.object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    addressLine1: z.string().trim().min(1, 'Address is required'),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().trim().min(1, 'Postal code is required'),
    country: z.string().trim().min(1, 'Country is required'),
    phone: z.string().trim().min(5, 'Valid phone number is required'),
  }).passthrough().optional(),
  courier: z.string().optional(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const paypalCaptureOrderSchema = z.object({
  token: z.string().trim().min(3).optional(),
  paypalOrderId: z.string().trim().min(3).optional(),
}).refine((data) => Boolean(data.token || data.paypalOrderId), {
  message: 'token or paypalOrderId is required',
});

// PayPal International Gateway endpoints with strict validation
r.post('/paypal/create-order', validate(paypalCreateOrderSchema), paypalController.createOrder);
r.post('/paypal/capture-order', validate(paypalCaptureOrderSchema), paypalController.captureOrder);

export default r;
