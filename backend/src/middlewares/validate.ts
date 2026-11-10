import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export type RequestValidationTarget = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

/**
 * Universal validation middleware for Express using Zod.
 * Supports validating request body, query params, and URL route params.
 * Sanitizes error outputs to prevent information disclosure.
 */
export const validate = (schema: ZodSchema | RequestValidationTarget) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Direct ZodSchema target: Default to validating req.body (100% backward compatible)
    if ('safeParse' in schema) {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const formattedErrors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          error: 'Validation failed',
          message: formattedErrors[0]?.message || 'Invalid input provided',
          errors: formattedErrors,
        });
      }
      req.body = result.data;
      return next();
    }

    // 2. Structured Multi-Target: Validates { body?, query?, params? }
    const targets: Array<'body' | 'query' | 'params'> = ['body', 'query', 'params'];
    for (const target of targets) {
      const targetSchema = schema[target];
      if (targetSchema) {
        const result = targetSchema.safeParse(req[target]);
        if (!result.success) {
          const formattedErrors = result.error.errors.map((err) => ({
            location: target,
            field: err.path.join('.'),
            message: err.message,
          }));
          return res.status(400).json({
            error: 'Validation failed',
            message: `${target}: ${formattedErrors[0]?.message || 'Invalid input provided'}`,
            errors: formattedErrors,
          });
        }
        (req as any)[target] = result.data;
      }
    }

    return next();
  };
};

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  slug: z.string().trim().max(200).optional(),
  category_id: z.coerce.number().int().positive().optional().default(101),
  category: z.string().trim().optional(),
  department: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  itemType: z.string().trim().optional(),
  base_price: z.coerce.number().min(0, 'Base price must be a positive number'),
  cost_price: z.coerce.number().min(0).optional().default(0),
  weight_grams: z.coerce.number().min(0).optional().default(250),
  description_html: z.string().optional().default(''),
  description: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional().default([]),
  is_active: z.boolean().optional().default(true),
  isTrending: z.boolean().optional().default(false),
  isNewRelease: z.boolean().optional().default(true),
  image: z.string().url().or(z.string()).optional(),
  colorImages: z
    .union([
      z.record(z.union([z.array(z.string()), z.string()])),
      z.array(z.object({ url: z.string(), colorTag: z.string() })),
    ])
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string(),
        colorTag: z.string().optional().default('Standard'),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        size: z.string().optional().default('M'),
        color: z.string().optional().default('Standard'),
        sku: z.string().optional(),
        stock: z.coerce.number().int().min(0).default(10),
        low_stock_threshold: z.coerce.number().int().min(0).optional().default(5),
        price_override: z.coerce.number().min(0).optional(),
        price: z.coerce.number().min(0).optional(),
        image: z.string().optional(),
        variant: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const updateProductSchema = createProductSchema.partial();

// 🔒 Explicit, strongly-typed shipping address schema (Replaces unsafe z.any())
export const shippingAddressSchema = z.object({
  recipient: z.string().trim().max(100).optional(),
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(30).optional(),
  line1: z.string().trim().max(200).optional(),
  line2: z.string().trim().max(200).optional(),
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  cityId: z.string().trim().max(50).optional(),
  province: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  postal_code: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
}).passthrough();

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'completed', 'cancelled']).optional(),
  tracking_number: z.string().trim().max(100).optional(),
  courier: z.string().trim().max(50).optional(),
  tracking_state: z
    .enum(['ORDERED', 'SHIPPED', 'IN_CUSTOMS', 'OUT_FOR_DELIVERY', 'DELIVERED'])
    .optional(),
  raw_status: z.string().trim().max(255).optional(),
  shipping_address: shippingAddressSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
});

// 🔒 Admin stock quick adjustment schema
export const adminStockUpdateSchema = z.object({
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative').max(1000000).optional(),
  delta: z.coerce.number().int().min(-100000).max(100000).optional(),
}).refine((data) => data.stock !== undefined || data.delta !== undefined, {
  message: 'Either stock or delta must be provided',
});

// 🔒 Admin promotional coupon creation schema
export const adminCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Coupon code must be at least 2 characters')
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, 'Coupon code can only contain alphanumeric characters, hyphens, and underscores'),
  kind: z.enum(['fixed', 'percentage', 'free_shipping']),
  value: z.coerce.number().min(0, 'Coupon value must be a positive number'),
  starts_at: z.string().datetime({ offset: true }).nullable().optional(),
  ends_at: z.string().datetime({ offset: true }).nullable().optional(),
  usage_limit: z.coerce.number().int().min(1).nullable().optional(),
});

// 🔒 Public catalog search query schema
export const searchProductsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query cannot exceed 100 characters'),
});

// 🔒 Tracking simulator schema
export const trackingSimulatorSchema = z.object({
  raw_status: z.string().trim().min(1, 'raw_status is required').max(200),
  courier: z.string().trim().max(100).optional(),
  location: z.string().trim().max(200).optional(),
  tracking_number: z.string().trim().max(100).optional(),
});
