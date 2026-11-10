import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth';
import { rbac } from '../middlewares/rbac';
import { auditLogger } from '../middlewares/audit';
import {
  validate,
  createProductSchema,
  updateProductSchema,
  updateOrderSchema,
  adminStockUpdateSchema,
  adminCouponSchema,
} from '../middlewares/validate';
import * as adminController from '../controllers/admin.controller';
import { query, escapeLikePattern } from '../config/db';
import { prisma } from '../config/prisma';
import { getBiteshipCouriers, getBiteshipRates } from '../services/biteship.service';
import {
  getPaymentSettings,
  savePaymentGatewayConfig,
  testGatewayConnection,
  addPaymentMethod,
  updatePaymentMethod,
  togglePaymentMethod,
  deletePaymentMethod,
} from '../services/payment.service';

const admin = Router();

// -------------------------------------------------------------
// 0. AUTHENTICATION SESSION STATUS (Always accessible)
// -------------------------------------------------------------
admin.get('/me', async (req: Request, res: Response) => {
  if (req.principal?.kind === 'admin') {
    let email = 'admin@ladrim.com';
    try {
      const a = await prisma.admins.findUnique({
        where: { id: req.principal.sub },
        select: { email: true, role: true },
      });
      if (a?.email) email = a.email;
    } catch {}

    return res.json({
      authenticated: true,
      admin: {
        id: req.principal.sub,
        email,
        role: req.principal.role || 'super_admin',
      },
    });
  }
  return res.json({ authenticated: false });
});

// -------------------------------------------------------------
// In development mode, auto-attach a mock admin principal if not present
admin.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production' && !req.principal) {
    req.principal = { sub: 'ac943636-6418-4e36-b382-faf2a744e9f1', kind: 'admin', role: 'super_admin' };
  }
  next();
});

admin.use(requireAuth);
admin.use(rbac(['admin', 'staff']));
admin.use(auditLogger('admin'));

// -------------------------------------------------------------
// 1. EXECUTIVE DASHBOARD SUMMARY
// -------------------------------------------------------------
admin.get('/summary', adminController.getSummary);

// -------------------------------------------------------------
// 2. PRODUCTS & INVENTORY MODULE
// -------------------------------------------------------------
admin.get('/products', adminController.getProducts);
admin.get('/products/:id', adminController.getProductById);
admin.post('/products', validate(createProductSchema), adminController.createProduct);
admin.put('/products/:id', validate(updateProductSchema), adminController.updateProduct);
admin.delete('/products/:id', adminController.deleteProduct);

// Quick stock adjustment helper
admin.patch('/products/:id/stock', validate(adminStockUpdateSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stock, delta } = req.body;
    if (stock !== undefined) {
      await query(`UPDATE product_variants SET stock = $1 WHERE product_id = $2`, [Number(stock), id]);
    } else if (delta !== undefined) {
      await query(
        `UPDATE product_variants SET stock = GREATEST(0, stock + $1) WHERE product_id = $2`,
        [Number(delta), id]
      );
    }
    const { rows } = await query(`SELECT * FROM product_variants WHERE product_id = $1`, [id]);
    res.json({ success: true, variants: rows });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// CSV Export catalog metadata
admin.get('/products/export/csv', async (_req: Request, res: Response) => {
  try {
    const { rows } = await query(`
      SELECT p.name, p.slug, p.base_price, p.cost_price, p.weight_grams, pv.sku, pv.size, pv.color, pv.stock
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
    `);
    const header = 'Name,Slug,BasePrice,CostPrice,WeightGrams,SKU,Size,Color,Stock\n';
    const csv = rows
      .map(
        (r) =>
          `"${r.name}","${r.slug}",${r.base_price},${r.cost_price},${r.weight_grams},"${r.sku || ''}","${r.size || ''}","${r.color || ''}",${r.stock || 0}`
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ladrim-catalog.csv"');
    res.send(header + csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. ORDERS & LOGISTICS PIPELINE MODULE
// -------------------------------------------------------------
admin.get('/orders', adminController.getOrders);
admin.get('/orders/:id', adminController.getOrderById);
admin.put('/orders/:id', validate(updateOrderSchema), adminController.updateOrder);
admin.patch('/orders/:id/status', validate(updateOrderSchema), adminController.updateOrder);

// -------------------------------------------------------------
// 4. AUDIT LOGS ACTIVITY STREAM
// -------------------------------------------------------------
admin.get('/audit-logs', adminController.getAuditLogs);

// -------------------------------------------------------------
// 5. CATEGORIES MODULE
// -------------------------------------------------------------
admin.get('/categories', async (req: Request, res: Response) => {
  try {
    const isFlat = req.query.flat === 'true' || req.query.all === 'true';
    if (isFlat) {
      const { rows } = await query(`
        SELECT c.id, c.name, c.slug, c.level, c.parent_id,
               p_parent.name as parent_name,
               COUNT(p.id)::int as product_count
        FROM categories c
        LEFT JOIN categories p_parent ON p_parent.id = c.parent_id
        LEFT JOIN products p ON p.category_id = c.id
        GROUP BY c.id, p_parent.name
        ORDER BY c.level ASC, c.sort_order ASC, c.name ASC
      `);
      return res.json({ categories: rows, total: rows.length });
    }

    // Root categories (Men, Women, Accessories) with recursive product count & subcategories
    const { rows } = await query(`
      WITH RECURSIVE cat_tree AS (
          SELECT id, id as root_id FROM categories WHERE parent_id IS NULL
          UNION ALL
          SELECT c.id, ct.root_id
          FROM categories c
          JOIN cat_tree ct ON c.parent_id = ct.id
      )
      SELECT 
          c.id, 
          c.name, 
          c.slug,
          COALESCE(
              (SELECT json_agg(sub.name ORDER BY sub.sort_order, sub.name)
               FROM categories sub WHERE sub.parent_id = c.id),
              '[]'::json
          ) as subcategories,
          COUNT(p.id)::int as product_count
      FROM categories c
      LEFT JOIN cat_tree ct ON ct.root_id = c.id
      LEFT JOIN products p ON p.category_id = ct.id
      WHERE c.parent_id IS NULL
      GROUP BY c.id, c.name, c.slug, c.sort_order
      ORDER BY c.sort_order ASC, c.id ASC;
    `);
    return res.json({ categories: rows, total: rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

admin.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const safeSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const { rows } = await query(
      `INSERT INTO categories (name, slug, level, sort_order)
       VALUES ($1, $2, 0, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories WHERE parent_id IS NULL))
       RETURNING id, name, slug;`,
      [name.trim(), safeSlug]
    );

    return res.status(201).json({
      success: true,
      category: {
        id: rows[0].id,
        name: rows[0].name,
        slug: rows[0].slug,
        product_count: 0,
        subcategories: [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

admin.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Valid category ID required' });
    await query(`DELETE FROM categories WHERE id = $1;`, [id]);
    return res.json({ success: true, message: 'Category deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5.1 DYNAMIC TAXONOMY & ITEM TYPES MODULE
// -------------------------------------------------------------
const taxonomyFilePath = path.resolve(__dirname, '../../../frontend/lib/taxonomy.json');

function readTaxonomyData(): any[] {
  try {
    if (fs.existsSync(taxonomyFilePath)) {
      return JSON.parse(fs.readFileSync(taxonomyFilePath, 'utf-8'));
    }
  } catch (err) {
    console.error('[READ_TAXONOMY_ERROR]', err);
  }
  return [];
}

function writeTaxonomyData(data: any[]): boolean {
  try {
    fs.writeFileSync(taxonomyFilePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[WRITE_TAXONOMY_ERROR]', err);
    return false;
  }
}

admin.get('/taxonomy', (_req: Request, res: Response) => {
  const data = readTaxonomyData();
  return res.json({ taxonomy: data });
});

admin.post('/taxonomy/item-type', async (req: Request, res: Response) => {
  try {
    const { pillarSlug, majorSlug, name, slug } = req.body;
    if (!pillarSlug || !majorSlug || !name || !String(name).trim()) {
      return res.status(400).json({ error: 'pillarSlug, majorSlug, dan name wajib diisi' });
    }

    const cleanName = String(name).trim();
    const cleanSlug = (slug || cleanName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const data = readTaxonomyData();
    const pillar = data.find((p: any) => p.slug === pillarSlug.toLowerCase());
    if (!pillar) {
      return res.status(404).json({ error: `Pillar ${pillarSlug} tidak ditemukan` });
    }

    let major = (pillar.children || []).find((m: any) => m.slug === majorSlug.toLowerCase());
    if (!major) {
      major = { slug: majorSlug.toLowerCase(), name: majorSlug.charAt(0).toUpperCase() + majorSlug.slice(1), children: [] };
      if (!pillar.children) pillar.children = [];
      pillar.children.push(major);
    }
    if (!major.children) major.children = [];

    // Check if item type already exists in JSON
    const existingIndex = major.children.findIndex((c: any) => c.slug === cleanSlug);
    if (existingIndex >= 0) {
      major.children[existingIndex].name = cleanName;
    } else {
      major.children.push({ slug: cleanSlug, name: cleanName });
    }

    writeTaxonomyData(data);

    // Also sync to PostgreSQL categories table
    try {
      const safeMajorSlug = escapeLikePattern(majorSlug);
      const { rows: parentRows } = await query(
        `SELECT id FROM categories 
         WHERE (slug = $1 OR slug LIKE '%' || $2 || '%') 
           AND level = 2 
         LIMIT 1;`,
        [majorSlug, safeMajorSlug]
      );
      const parentId = parentRows[0]?.id || null;

      await query(
        `INSERT INTO categories (name, slug, level, parent_id, sort_order)
         VALUES ($1, $2, 3, $3, 99)
         ON CONFLICT (slug) DO UPDATE SET name = $1, parent_id = COALESCE($3, categories.parent_id);`,
        [cleanName, cleanSlug, parentId]
      );
    } catch (dbErr) {
      console.warn('[DB_SYNC_TAXONOMY_WARN]', dbErr);
    }

    return res.status(201).json({
      success: true,
      itemType: { slug: cleanSlug, name: cleanName },
      taxonomy: data,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal menambahkan item type' });
  }
});

admin.delete('/taxonomy/item-type', async (req: Request, res: Response) => {
  try {
    const pillarSlug = String(req.query.pillarSlug || req.body?.pillarSlug || '').toLowerCase();
    const majorSlug = String(req.query.majorSlug || req.body?.majorSlug || '').toLowerCase();
    const slug = String(req.query.slug || req.body?.slug || '').toLowerCase();

    if (!slug) {
      return res.status(400).json({ error: 'Slug item type wajib disertakan' });
    }

    const data = readTaxonomyData();
    let found = false;

    data.forEach((p: any) => {
      if (!pillarSlug || p.slug === pillarSlug) {
        (p.children || []).forEach((m: any) => {
          if (!majorSlug || m.slug === majorSlug) {
            if (m.children) {
              const beforeLen = m.children.length;
              m.children = m.children.filter((c: any) => c.slug !== slug);
              if (m.children.length !== beforeLen) found = true;
            }
          }
        });
      }
    });

    if (found) {
      writeTaxonomyData(data);
    }

    // Also delete from PostgreSQL categories table
    try {
      await query(`DELETE FROM categories WHERE slug = $1 AND level = 3;`, [slug]);
    } catch (dbErr) {
      console.warn('[DB_DELETE_TAXONOMY_WARN]', dbErr);
    }

    return res.json({ success: true, message: 'Item type berhasil dihapus', taxonomy: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal menghapus item type' });
  }
});

// -------------------------------------------------------------
// 6. SHIPPING & BITESHIP LOGISTICS MODULE
// -------------------------------------------------------------
admin.get('/shipping/couriers', async (_req: Request, res: Response) => {
  try {
    const couriers = await getBiteshipCouriers();
    res.json({ couriers, sandbox: true, provider: 'Biteship' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

admin.post('/shipping/calculate-rates', async (req: Request, res: Response) => {
  try {
    const { weight_grams, destination_postal_code, origin_postal_code, couriers } = req.body;
    const items = [
      {
        name: 'LADRIM Order Parcel',
        value: 100000,
        quantity: 1,
        weight: weight_grams || 1000,
      },
    ];

    const rates = await getBiteshipRates({
      originPostalCode: origin_postal_code || 12440,
      destinationPostalCode: destination_postal_code || 40115,
      couriers: couriers || 'jne,sicepat,jnt,anteraja',
      items,
    });

    res.json({
      provider: 'Biteship Sandbox',
      origin_postal_code: origin_postal_code || 12440,
      destination_postal_code: destination_postal_code || 40115,
      weight_grams: weight_grams || 1000,
      available_services: rates,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. PROMOTIONS MODULE
// -------------------------------------------------------------
admin.get('/promotions/coupons', async (_req: Request, res: Response) => {
  try {
    const { rows } = await query(`SELECT * FROM coupons ORDER BY starts_at DESC NULLS LAST`);
    res.json({ coupons: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

admin.post('/promotions/coupons', validate(adminCouponSchema), async (req: Request, res: Response) => {
  try {
    const { code, kind, value, starts_at, ends_at, usage_limit } = req.body;
    const { rows } = await query(
      `INSERT INTO coupons (code, kind, value, starts_at, ends_at, usage_limit)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [code.toUpperCase(), kind, value, starts_at ?? null, ends_at ?? null, usage_limit ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

admin.delete('/promotions/coupons/:code', async (req: Request, res: Response) => {
  try {
    await query(`DELETE FROM coupons WHERE code = $1`, [req.params.code.toUpperCase()]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 8. PAYMENT METHODS & GATEWAY CONFIGURATION MODULE
// -------------------------------------------------------------
admin.get('/payments/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await getPaymentSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

admin.put('/payments/gateway', async (req: Request, res: Response) => {
  try {
    const { provider, isProduction, serverKey, clientKey, merchantId, autoCancelHours } = req.body;
    const updated = await savePaymentGatewayConfig({
      provider: provider || 'midtrans',
      isProduction: Boolean(isProduction),
      serverKey: serverKey ?? '',
      clientKey: clientKey ?? '',
      merchantId: merchantId ?? '',
      autoCancelHours: Number(autoCancelHours) || 24,
    });
    res.json({ success: true, gateway: updated, message: 'Konfigurasi Gateway berhasil disimpan' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

admin.post('/payments/gateway/test', async (req: Request, res: Response) => {
  try {
    const result = await testGatewayConnection(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

admin.post('/payments/methods', async (req: Request, res: Response) => {
  const { createPaymentMethod } = await import('../controllers/paymentMethod.controller');
  return createPaymentMethod(req, res);
});

admin.put('/payments/methods/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const methods = await updatePaymentMethod(id, updates);
    res.json({ success: true, methods, message: 'Metode pembayaran berhasil diperbarui' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

admin.patch('/payments/methods/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const methods = await togglePaymentMethod(id);
    res.json({ success: true, methods, message: 'Status metode pembayaran berhasil diperbarui' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

admin.delete('/payments/methods/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const methods = await deletePaymentMethod(id);
    res.json({ success: true, methods, message: 'Metode pembayaran berhasil dihapus' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default admin;
