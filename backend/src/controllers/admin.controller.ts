import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { query, escapeLikePattern } from '../config/db';
import { updateOrderTracking, TrackingState } from '../services/tracking.service';

/**
 * Helper to safely serialize BigInt and Decimal fields for JSON response
 */
function serializeData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'bigint') return data.toString();
  if (data instanceof Date) return data.toISOString();
  if (Array.isArray(data)) return data.map(serializeData);
  if (typeof data === 'object') {
    // Check if it's a Prisma Decimal
    if ('d' in data && 's' in data && 'e' in data && typeof data.toNumber === 'function') {
      return data.toNumber();
    }
    const res: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      res[key] = serializeData(data[key]);
    }
    return res;
  }
  return data;
}

/**
 * 1. GET /summary
 * High-level metrics (Revenue, Orders, Low Stock, AOV, Recent Orders)
 */
export async function getSummary(_req: Request, res: Response) {
  try {
    const [totalOrders, paidOrders, lowStockVariants, recentOrders, allStatusCounts] =
      await Promise.all([
        prisma.orders.count(),
        prisma.orders.findMany({
          where: {
            status: { in: ['processing', 'shipped', 'completed'] },
          },
          select: { total: true },
        }),
        prisma.product_variants.findMany({
          where: {
            stock: { lte: 5 },
          },
          include: {
            products: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: { stock: 'asc' },
          take: 10,
        }),
        prisma.orders.findMany({
          take: 8,
          orderBy: { created_at: 'desc' },
          include: {
            users: {
              select: { id: true, email: true, full_name: true },
            },
            order_items: true,
          },
        }),
        prisma.orders.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

    const grossRevenue = paidOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const averageOrderValue = paidOrders.length > 0 ? grossRevenue / paidOrders.length : 0;

    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
    };
    allStatusCounts.forEach((sc) => {
      if (sc.status) statusCounts[sc.status] = sc._count.id;
    });

    const lowStockAlerts = lowStockVariants.map((v) => ({
      variant_id: v.id,
      sku: v.sku,
      product_id: v.product_id,
      product_name: v.products.name,
      size: v.size || 'M',
      color: v.color || 'Default',
      stock: v.stock,
      low_stock_threshold: v.low_stock_threshold,
    }));

    return res.json(
      serializeData({
        metrics: {
          gross_revenue: Math.round(grossRevenue),
          total_orders: totalOrders,
          low_stock_count: lowStockAlerts.length,
          average_order_value: Math.round(averageOrderValue),
          pending_orders: statusCounts.pending,
          processing_orders: statusCounts.processing,
          shipped_orders: statusCounts.shipped,
          completed_orders: statusCounts.completed,
          cancelled_orders: statusCounts.cancelled,
        },
        recent_orders: recentOrders.map((o) => ({
          id: o.id,
          total: Number(o.total),
          subtotal: Number(o.subtotal),
          status: o.status,
          checkout_state: o.checkout_state,
          tracking_state: o.tracking_state,
          courier: o.courier,
          tracking_number: o.tracking_number,
          created_at: o.created_at,
          paid_at: o.paid_at,
          user_email: o.users?.email || o.guest_email || 'Guest',
          user_name: o.users?.full_name || 'Guest Customer',
          items_count: o.order_items.length,
        })),
        low_stock_alerts: lowStockAlerts,
      })
    );
  } catch (err: any) {
    console.error('[ADMIN_GET_SUMMARY_ERROR]', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch admin summary' });
  }
}

/**
 * 2. GET /products
 * List products with variants and inventory counts
 */
export async function getProducts(req: Request, res: Response) {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';
    const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
    const categoryParam = req.query.category ? String(req.query.category).trim() : '';
    const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;

    // Fetch category hierarchy mapping to root categories and levels
    const { rows: catHierarchies } = await query(`
      WITH RECURSIVE cat_hierarchy AS (
        SELECT id, id as root_id, name as root_name, slug as root_slug,
               id as level1_id, name as level1_name, slug as level1_slug,
               NULL::int as level2_id, NULL::text as level2_name, NULL::text as level2_slug,
               NULL::int as level3_id, NULL::text as level3_name, NULL::text as level3_slug,
               1 as depth
        FROM categories
        WHERE parent_id IS NULL
        UNION ALL
        SELECT c.id, ch.root_id, ch.root_name, ch.root_slug,
               ch.level1_id, ch.level1_name, ch.level1_slug,
               CASE WHEN ch.depth = 1 THEN c.id ELSE ch.level2_id END as level2_id,
               CASE WHEN ch.depth = 1 THEN c.name ELSE ch.level2_name END as level2_name,
               CASE WHEN ch.depth = 1 THEN c.slug ELSE ch.level2_slug END as level2_slug,
               CASE WHEN ch.depth = 2 THEN c.id ELSE ch.level3_id END as level3_id,
               CASE WHEN ch.depth = 2 THEN c.name ELSE ch.level3_name END as level3_name,
               CASE WHEN ch.depth = 2 THEN c.slug ELSE ch.level3_slug END as level3_slug,
               ch.depth + 1
        FROM categories c
        JOIN cat_hierarchy ch ON c.parent_id = ch.id
      )
      SELECT id, root_id, root_name, root_slug,
             level2_id, level2_name, level2_slug,
             level3_id, level3_name, level3_slug
      FROM cat_hierarchy;
    `);
    const hierarchyMap = new Map<number, any>();
    catHierarchies.forEach((r: any) => hierarchyMap.set(Number(r.id), r));

    const where: any = {};
    if (q) {
      const safeQ = escapeLikePattern(q);
      where.OR = [
        { name: { contains: safeQ, mode: 'insensitive' } },
        { slug: { contains: safeQ, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      const matchingCatIds = Array.from(hierarchyMap.entries())
        .filter(([id, r]) => id === categoryId || r.root_id === categoryId)
        .map(([id]) => id);
      where.category_id = { in: matchingCatIds.length > 0 ? matchingCatIds : [categoryId] };
    } else if (categoryParam && categoryParam !== 'Semua Kategori' && categoryParam.toLowerCase() !== 'all') {
      const target = categoryParam.toLowerCase().trim();
      const matchingCatIds = Array.from(hierarchyMap.entries())
        .filter(([id, r]) =>
          r.root_name.toLowerCase() === target ||
          r.root_slug.toLowerCase() === target
        )
        .map(([id]) => id);
      if (matchingCatIds.length > 0) {
        where.category_id = { in: matchingCatIds };
      }
    }

    if (active !== undefined) {
      where.is_active = active;
    }

    const prods = await prisma.products.findMany({
      where,
      include: {
        categories: {
          select: { id: true, name: true, slug: true, level: true },
        },
        product_variants: {
          orderBy: [{ color: 'asc' }, { size: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });

    // Also fetch product images
    const prodIds = prods.map((p) => p.id);
    let imagesByProdId: Record<string, string[]> = {};
    try {
      const imgs = await prisma.productImage.findMany({
        where: { productId: { in: prodIds } },
        orderBy: { createdAt: 'asc' },
      });
      imgs.forEach((img) => {
        if (!imagesByProdId[img.productId]) imagesByProdId[img.productId] = [];
        imagesByProdId[img.productId].push(img.url);
      });
    } catch {}

    const formatted = prods.map((p) => {
      const totalStock = p.product_variants.reduce((acc, v) => acc + (v.stock || 0), 0);
      const isLowStock = p.product_variants.some((v) => v.stock <= v.low_stock_threshold);
      const hInfo = hierarchyMap.get(p.category_id);
      const rootCategory = hInfo?.root_name || 'Men';
      const rootSlug = hInfo?.root_slug || 'men';

      const prodImages = imagesByProdId[p.id] || [];
      const primaryImage =
        prodImages[0] ||
        p.product_variants[0]?.variant ||
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80';

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category_id: p.category_id,
        category_name: p.categories?.name || 'Koleksi Umum',
        category_slug: p.categories?.slug || '',
        root_category: rootCategory,
        root_slug: rootSlug,
        department: rootCategory,
        level2_id: hInfo?.level2_id || null,
        level2_name: hInfo?.level2_name || null,
        level2_slug: hInfo?.level2_slug || null,
        level3_id: hInfo?.level3_id || null,
        level3_name: hInfo?.level3_name || null,
        level3_slug: hInfo?.level3_slug || null,
        base_price: Number(p.base_price),
        cost_price: Number(p.cost_price),
        weight_grams: p.weight_grams,
        description_html: p.description_html || '',
        tags: p.tags,
        is_active: p.is_active,
        total_stock: totalStock,
        is_low_stock: isLowStock,
        variants_count: p.product_variants.length,
        image: primaryImage,
        images: prodImages,
        variants: p.product_variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size || 'M',
          color: v.color || 'Standard',
          stock: v.stock,
          low_stock_threshold: v.low_stock_threshold,
          price: v.price_override ? Number(v.price_override) : Number(p.base_price),
          image: v.variant,
        })),
      };
    });

    return res.json(serializeData({ products: formatted, total: formatted.length }));
  } catch (err: any) {
    console.error('[ADMIN_GET_PRODUCTS_ERROR]', err);
    return res.status(500).json({ error: err.message || 'Failed to list products' });
  }
}

/**
 * 3. GET /products/:id
 * Single product detail with full variant matrix
 */
export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const prod = await prisma.products.findUnique({
      where: { id },
      include: {
        categories: true,
        product_variants: {
          orderBy: [{ color: 'asc' }, { size: 'asc' }],
        },
      },
    });

    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let imagesList: any[] = [];
    try {
      imagesList = await prisma.productImage.findMany({
        where: { productId: id },
        orderBy: { createdAt: 'asc' },
      });
    } catch {}

    const colorImages: Record<string, string[]> = {};
    imagesList.forEach((img) => {
      const tag = img.colorTag || 'Standard';
      if (!colorImages[tag]) colorImages[tag] = [];
      colorImages[tag].push(img.url);
    });

    return res.json(
      serializeData({
        product: {
          ...prod,
          base_price: Number(prod.base_price),
          cost_price: Number(prod.cost_price),
          category_name: prod.categories?.name || '',
          images: imagesList.map((img) => ({
            id: img.id,
            url: img.url,
            colorTag: img.colorTag,
          })),
          colorImages,
          variants: prod.product_variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size || 'M',
            color: v.color || 'Standard',
            stock: v.stock,
            low_stock_threshold: v.low_stock_threshold,
            price_override: v.price_override ? Number(v.price_override) : null,
            image: v.variant,
          })),
        },
      })
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get product' });
  }
}

/**
 * 4. POST /products
 * Create product with variant array via Prisma Transaction
 */
export async function createProduct(req: Request, res: Response) {
  try {
    const {
      name,
      slug: customSlug,
      category_id,
      category,
      department,
      subcategory,
      itemType,
      base_price,
      cost_price = 0,
      weight_grams = 250,
      description_html = '',
      description = '',
      tags = [],
      is_active = true,
      isTrending = false,
      isNewRelease = true,
      images = [],
      colorImages = null,
      variants = [],
    } = req.body;

    if (!name || base_price === undefined) {
      return res.status(400).json({ error: 'Name and base_price are required' });
    }

    const finalSlug =
      customSlug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
        '-' +
        Math.random().toString(36).substring(2, 6);

    // Normalize images and colorImages into { url, colorTag }
    const imageRecords: { colorTag: string; url: string }[] = [];
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: any) => {
        if (img?.url) imageRecords.push({ url: img.url, colorTag: (img.colorTag || 'Standard').trim() });
      });
    }
    if (colorImages) {
      if (Array.isArray(colorImages)) {
        colorImages.forEach((img: any) => {
          if (img?.url && img?.colorTag) {
            imageRecords.push({ url: img.url, colorTag: img.colorTag.trim() });
          }
        });
      } else {
        Object.entries(colorImages).forEach(([colorTag, urls]) => {
          if (Array.isArray(urls)) {
            urls.forEach((u: any) => {
              if (u) imageRecords.push({ url: String(u), colorTag: colorTag.trim() });
            });
          } else if (typeof urls === 'string' && urls) {
            imageRecords.push({ url: urls, colorTag: colorTag.trim() });
          }
        });
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      // 1. Resolve category ID
      let resolvedCatId = Number(category_id || 101);
      if (subcategory) {
        const found = await tx.categories.findFirst({
          where: { slug: { contains: String(subcategory).toLowerCase() } },
        });
        if (found) resolvedCatId = found.id;
      }

      // 2. Insert main product row
      const product = await tx.products.create({
        data: {
          category_id: resolvedCatId,
          name,
          slug: finalSlug,
          description_html: description_html || description || '',
          base_price: Number(base_price),
          cost_price: Number(cost_price || 0),
          weight_grams: Number(weight_grams || 250),
          tags: Array.isArray(tags) ? tags : [tags],
          is_active: Boolean(is_active),
        },
      });

      // 3. Insert variant rows
      const variantList =
        Array.isArray(variants) && variants.length > 0
          ? variants
          : [{ size: 'M', color: 'Standard', stock: 15, low_stock_threshold: 5 }];

      const insertedVariants = [];
      for (const v of variantList) {
        const prefix = (finalSlug || 'LDR').slice(0, 4).toUpperCase();
        const colorCode = (v.color || 'STD').slice(0, 3).toUpperCase();
        const sizeCode = (v.size || 'M').toUpperCase();
        const sku =
          v.sku ||
          `${prefix}-${colorCode}-${sizeCode}-${Math.floor(100 + Math.random() * 900)}`;

        const newVariant = await tx.product_variants.create({
          data: {
            product_id: product.id,
            sku,
            size: v.size || 'M',
            color: v.color || 'Standard',
            stock: Number(v.stock ?? 10),
            low_stock_threshold: Number(v.low_stock_threshold ?? 5),
            price_override: v.price_override
              ? Number(v.price_override)
              : v.price
              ? Number(v.price)
              : null,
            variant: v.image || v.variant || null,
          },
        });
        insertedVariants.push(newVariant);
      }

      // 4. Synchronize with Product, Variant, and ProductImage models
      try {
        await tx.product.create({
          data: {
            id: product.id,
            name,
            slug: finalSlug,
            description: description_html || description || '',
            basePrice: Number(base_price),
            category: category || `${department || 'Men'} / ${subcategory || 'Tops'}`,
            department: department || 'Men',
            subcategory: subcategory || 'Tops',
            itemType: itemType || 'Staple',
            tags: Array.isArray(tags) ? tags.join(', ') : String(tags || ''),
            isTrending: Boolean(isTrending),
            isNewRelease: isNewRelease !== undefined ? Boolean(isNewRelease) : true,
          },
        });

        for (const v of insertedVariants) {
          await tx.variant.create({
            data: {
              id: v.id,
              productId: product.id,
              color: v.color || 'Standard',
              size: v.size || 'M',
              sku: v.sku,
              price: Number(v.price_override ?? base_price),
              stock: Number(v.stock),
            },
          });
        }

        if (imageRecords.length > 0) {
          for (const img of imageRecords) {
            if (img.url) {
              await tx.productImage.create({
                data: {
                  productId: product.id,
                  url: img.url,
                  colorTag: img.colorTag || 'Standard',
                },
              });
            }
          }
        }
      } catch (syncErr) {
        // Non-fatal sync notice
        console.warn('Sync to alternative Product model notice:', syncErr);
      }

      return {
        ...product,
        variants: insertedVariants,
      };
    });

    return res.status(201).json(serializeData({ success: true, product: created }));
  } catch (err: any) {
    console.error('[ADMIN_CREATE_PRODUCT_ERROR]', err);
    return res.status(400).json({ error: err.message || 'Failed to create product' });
  }
}

/**
 * 5. PUT /products/:id
 * Update product and variant attributes
 */
export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      category_id,
      base_price,
      cost_price,
      weight_grams,
      description_html,
      tags,
      is_active,
      images,
      colorImages,
      variants,
    } = req.body;

    // Normalize images and colorImages into { url, colorTag }
    const imageRecords: { colorTag: string; url: string }[] = [];
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: any) => {
        if (img?.url) imageRecords.push({ url: img.url, colorTag: (img.colorTag || 'Standard').trim() });
      });
    }
    if (colorImages) {
      if (Array.isArray(colorImages)) {
        colorImages.forEach((img: any) => {
          if (img?.url && img?.colorTag) {
            imageRecords.push({ url: img.url, colorTag: img.colorTag.trim() });
          }
        });
      } else {
        Object.entries(colorImages).forEach(([colorTag, urls]) => {
          if (Array.isArray(urls)) {
            urls.forEach((u: any) => {
              if (u) imageRecords.push({ url: String(u), colorTag: colorTag.trim() });
            });
          } else if (typeof urls === 'string' && urls) {
            imageRecords.push({ url: urls, colorTag: colorTag.trim() });
          }
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {};
      if (name !== undefined) dataToUpdate.name = name;
      if (category_id !== undefined) dataToUpdate.category_id = Number(category_id);
      if (base_price !== undefined) dataToUpdate.base_price = Number(base_price);
      if (cost_price !== undefined) dataToUpdate.cost_price = Number(cost_price);
      if (weight_grams !== undefined) dataToUpdate.weight_grams = Number(weight_grams);
      if (description_html !== undefined) dataToUpdate.description_html = description_html;
      if (tags !== undefined) dataToUpdate.tags = Array.isArray(tags) ? tags : [tags];
      if (is_active !== undefined) dataToUpdate.is_active = Boolean(is_active);

      const prod = await tx.products.update({
        where: { id },
        data: dataToUpdate,
      });

      // Update images if provided
      if (images !== undefined || colorImages !== undefined) {
        try {
          await tx.productImage.deleteMany({ where: { productId: id } });
          for (const img of imageRecords) {
            if (img.url) {
              await tx.productImage.create({
                data: {
                  productId: id,
                  url: img.url,
                  colorTag: img.colorTag || 'Standard',
                },
              });
            }
          }
        } catch (imgErr) {
          console.warn('Sync ProductImage error:', imgErr);
        }
      }

      // Synchronize Product model if exists
      try {
        await tx.product.update({
          where: { id },
          data: {
            name: name ?? undefined,
            basePrice: base_price !== undefined ? Number(base_price) : undefined,
            description: description_html ?? undefined,
          },
        });
      } catch {}

      // Update variants if provided
      if (Array.isArray(variants) && variants.length > 0) {
        for (const v of variants) {
          if (v.id) {
            await tx.product_variants.update({
              where: { id: v.id },
              data: {
                size: v.size ?? undefined,
                color: v.color ?? undefined,
                stock: v.stock !== undefined ? Number(v.stock) : undefined,
                low_stock_threshold:
                  v.low_stock_threshold !== undefined ? Number(v.low_stock_threshold) : undefined,
                price_override:
                  v.price_override !== undefined
                    ? v.price_override
                      ? Number(v.price_override)
                      : null
                    : undefined,
                variant: v.image || v.variant || undefined,
              },
            });
          } else {
            // New variant
            const sku =
              v.sku ||
              `${(prod.slug || 'LDR').slice(0, 4).toUpperCase()}-${(v.color || 'STD')
                .slice(0, 3)
                .toUpperCase()}-${(v.size || 'M').toUpperCase()}-${Math.floor(
                100 + Math.random() * 900
              )}`;
            await tx.product_variants.create({
              data: {
                product_id: id,
                sku,
                size: v.size || 'M',
                color: v.color || 'Standard',
                stock: Number(v.stock ?? 10),
                low_stock_threshold: Number(v.low_stock_threshold ?? 5),
                price_override: v.price_override ? Number(v.price_override) : null,
                variant: v.image || v.variant || null,
              },
            });
          }
        }
      }

      const allVariants = await tx.product_variants.findMany({
        where: { product_id: id },
        orderBy: [{ color: 'asc' }, { size: 'asc' }],
      });

      return { ...prod, variants: allVariants };
    });

    return res.json(serializeData({ success: true, product: updated }));
  } catch (err: any) {
    console.error('[ADMIN_UPDATE_PRODUCT_ERROR]', err);
    return res.status(400).json({ error: err.message || 'Failed to update product' });
  }
}

/**
 * 6. DELETE /products/:id
 */
export async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.$transaction(async (tx) => {
      await tx.product_variants.deleteMany({ where: { product_id: id } });
      await tx.products.delete({ where: { id } });
      try {
        await tx.variant.deleteMany({ where: { productId: id } });
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.product.delete({ where: { id } });
      } catch {}
    });
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete product' });
  }
}

/**
 * 7. GET /orders
 * Real-time operational orders grid with customer details & order items
 */
export async function getOrders(req: Request, res: Response) {
  try {
    const status = req.query.status as any;
    const search = req.query.search ? String(req.query.search).trim() : '';

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      const safeSearch = escapeLikePattern(search);
      where.OR = [
        { id: { contains: safeSearch, mode: 'insensitive' } },
        { tracking_number: { contains: safeSearch, mode: 'insensitive' } },
        { guest_email: { contains: safeSearch, mode: 'insensitive' } },
        { users: { email: { contains: safeSearch, mode: 'insensitive' } } },
      ];
    }

    const orderRows = await prisma.orders.findMany({
      where,
      include: {
        users: {
          select: { id: true, email: true, full_name: true, phone: true },
        },
        order_items: {
          include: {
            product_variants: {
              include: {
                products: {
                  select: { name: true, slug: true },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    const formatted = orderRows.map((o) => ({
      id: o.id,
      user_id: o.user_id,
      customer_name: o.users?.full_name || 'Guest Customer',
      customer_email: o.users?.email || o.guest_email || 'guest@ladrim.com',
      phone: o.users?.phone || '',
      status: o.status,
      checkout_state: o.checkout_state,
      subtotal: Number(o.subtotal),
      shipping_cost: Number(o.shipping_cost),
      discount: Number(o.discount),
      total: Number(o.total),
      courier: o.courier || 'Standard Courier',
      tracking_number: o.tracking_number,
      tracking_state: o.tracking_state,
      last_raw_status: o.last_raw_status,
      shipping_address: o.shipping_address,
      payment_ref: o.payment_ref,
      paid_at: o.paid_at,
      created_at: o.created_at,
      tracking_updated_at: o.tracking_updated_at,
      items: o.order_items.map((i) => ({
        variant_id: i.variant_id,
        qty: i.qty,
        unit_price: Number(i.unit_price),
        product_name: i.product_variants.products.name,
        size: i.product_variants.size,
        color: i.product_variants.color,
        sku: i.product_variants.sku,
      })),
    }));

    return res.json(serializeData({ orders: formatted, count: formatted.length }));
  } catch (err: any) {
    console.error('[ADMIN_GET_ORDERS_ERROR]', err);
    return res.status(500).json({ error: err.message || 'Failed to list orders' });
  }
}

/**
 * 8. GET /orders/:id
 */
export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        users: true,
        order_items: {
          include: {
            product_variants: {
              include: { products: true },
            },
          },
        },
        tracking_events: {
          orderBy: { event_time: 'desc' },
          take: 20,
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(
      serializeData({
        order: {
          ...order,
          subtotal: Number(order.subtotal),
          shipping_cost: Number(order.shipping_cost),
          discount: Number(order.discount),
          total: Number(order.total),
          items: order.order_items.map((i) => ({
            ...i,
            unit_price: Number(i.unit_price),
            unit_cost: Number(i.unit_cost),
            product_name: i.product_variants.products.name,
            sku: i.product_variants.sku,
            size: i.product_variants.size,
            color: i.product_variants.color,
          })),
        },
      })
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get order details' });
  }
}

/**
 * 9. PUT /orders/:id & PATCH /orders/:id/status
 * Order status updater that syncs with Midtrans transaction states
 * and triggers updates to tracking.service.ts
 */
export async function updateOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      status,
      tracking_number,
      courier,
      tracking_state,
      raw_status,
      payment_ref,
      notes,
    } = req.body;

    // 1. Fetch current order state
    const current = await prisma.orders.findUnique({
      where: { id },
    });
    if (!current) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Map Midtrans / payment lifecycle transitions
    let checkoutState = current.checkout_state;
    let paidAt = current.paid_at;

    if (status === 'processing') {
      checkoutState = 'paid';
      paidAt = paidAt || new Date();
    } else if (status === 'cancelled') {
      checkoutState = 'failed';
    } else if (status === 'shipped' || status === 'completed') {
      checkoutState = 'paid';
    }

    // 3. Update orders table via Prisma
    const updated = await prisma.orders.update({
      where: { id },
      data: {
        status: status || current.status,
        checkout_state: checkoutState,
        paid_at: paidAt,
        courier: courier || current.courier,
        tracking_number: tracking_number !== undefined ? tracking_number : current.tracking_number,
        payment_ref: payment_ref || current.payment_ref,
        tracking_updated_at: new Date(),
      },
    });

    // 4. Trigger tracking service if tracking info or tracking_state is provided
    const targetTrackingState = (tracking_state as TrackingState) ||
      (status === 'shipped' ? 'SHIPPED' : status === 'completed' ? 'DELIVERED' : undefined);

    const activeTrackingNum = tracking_number || updated.tracking_number;

    if (targetTrackingState || activeTrackingNum) {
      const trackingMsg =
        raw_status ||
        (targetTrackingState === 'DELIVERED'
          ? 'Paket telah berhasil diserahkan kepada penerima'
          : targetTrackingState === 'OUT_FOR_DELIVERY'
          ? 'Kurir sedang dalam perjalanan ke alamat tujuan'
          : targetTrackingState === 'IN_CUSTOMS'
          ? 'Pemeriksaan di Hub Transit / Bea Cukai'
          : targetTrackingState === 'SHIPPED'
          ? 'Paket telah dikemas dan diserahkan ke jasa ekspedisi'
          : 'Status pengiriman diperbarui oleh admin');

      try {
        await updateOrderTracking(
          { orderId: id },
          trackingMsg,
          {
            courier: courier || updated.courier || 'Kurir Ekspedisi',
            trackingNumber: activeTrackingNum || undefined,
            location: notes || 'Gudang Pusat LADRIM',
            force: true,
          }
        );
      } catch (trackErr) {
        console.warn('[ADMIN_TRACKING_TRIGGER_WARN]', trackErr);
      }
    }

    // Return refreshed order
    const finalOrder = await prisma.orders.findUnique({
      where: { id },
      include: {
        users: { select: { email: true, full_name: true } },
        order_items: true,
        tracking_events: { orderBy: { event_time: 'desc' }, take: 5 },
      },
    });

    return res.json(serializeData({ success: true, order: finalOrder }));
  } catch (err: any) {
    console.error('[ADMIN_UPDATE_ORDER_ERROR]', err);
    return res.status(400).json({ error: err.message || 'Failed to update order' });
  }
}

/**
 * 10. GET /audit-logs
 * Fetch administrative activity trail
 */
export async function getAuditLogs(_req: Request, res: Response) {
  try {
    const logs = await prisma.audit_logs.findMany({
      take: 100,
      orderBy: { at: 'desc' },
      include: {
        admins: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    const formatted = logs.map((l) => ({
      id: l.id.toString(),
      admin_id: l.admin_id,
      admin_email: l.admins?.email || 'System Staff',
      admin_role: l.admins?.role || 'staff',
      action: l.action,
      entity: l.entity,
      entity_id: l.entity_id,
      diff: l.diff,
      ip: l.ip,
      at: l.at.toISOString(),
    }));

    return res.json({ audit_logs: formatted });
  } catch (err: any) {
    console.error('[ADMIN_GET_AUDIT_LOGS_ERROR]', err);
    return res.status(500).json({ error: err.message || 'Failed to get audit logs' });
  }
}
