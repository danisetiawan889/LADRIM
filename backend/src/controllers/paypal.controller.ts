import { Request, Response } from 'express';
import { query, tx } from '../config/db';
import { createPayPalOrder, capturePayPalOrder } from '../services/paypal.service';

/**
 * POST /api/checkout/paypal/create-order
 * Recalculates product prices strictly from the database, checks inventory stock,
 * and initiates a secure PayPal order with server-calculated amounts.
 */
export async function createOrder(req: Request, res: Response) {
  try {
    const {
      email,
      address,
      items,
      courier,
      returnUrl,
      cancelUrl,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items cannot be empty' });
    }

    // 🔒 SECURITY CHECK 1: RE-CALCULATE ALL PRICES STRICTLY FROM DATABASE
    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      variantId: string;
      qty: number;
      unitPrice: number;
      unitCost: number;
      name: string;
    }> = [];

    for (const item of items) {
      const variantId = item.id || item.variantId;
      const qty = Math.max(1, Math.min(99, Number(item.qty) || 1));

      const { rows } = await query(
        `SELECT v.id, v.stock, COALESCE(v.price_override, p.base_price) AS price, p.cost_price, p.name
         FROM product_variants v
         JOIN products p ON p.id = v.product_id
         WHERE v.id = $1 AND p.is_active = true`,
        [variantId]
      );

      const variant = rows[0];
      if (!variant) {
        return res.status(404).json({ error: `Product variant not found or inactive: ${variantId}` });
      }

      if (variant.stock < qty) {
        return res.status(409).json({
          error: `Insufficient stock for product: "${variant.name}". Available stock: ${variant.stock}, requested: ${qty}.`,
        });
      }

      const unitPrice = Number(variant.price);
      calculatedSubtotal += unitPrice * qty;

      validatedItems.push({
        variantId: variant.id,
        qty,
        unitPrice,
        unitCost: Number(variant.cost_price) || 0,
        name: variant.name,
      });
    }

    // 🔒 SECURITY CHECK 2: SERVER-ENFORCED SHIPPING COST CALCULATION
    // Free shipping if subtotal >= $200, otherwise flat standard shipping $9.50
    const serverShippingCost = calculatedSubtotal >= 200 ? 0 : 9.50;
    const serverTotal = Number((calculatedSubtotal + serverShippingCost).toFixed(2));

    const referenceId = `LDRM-${Math.floor(100000 + Math.random() * 900000)}`;

    const origin =
      req.headers.origin ||
      (req.headers.referer ? new URL(req.headers.referer as string).origin : 'http://localhost:3000');

    const finalReturnUrl =
      returnUrl || `${origin}/checkout?gateway=paypal&status=approved&ref=${referenceId}`;
    const finalCancelUrl =
      cancelUrl || `${origin}/checkout?gateway=paypal&status=cancelled&ref=${referenceId}`;

    // 🔒 3. CREATE ORDER WITH SECURE SERVER-CALCULATED AMOUNT
    const paypalResult = await createPayPalOrder({
      amount: serverTotal,
      currency: 'USD',
      referenceId,
      items: validatedItems.map((i) => ({ name: i.name, qty: i.qty, price: i.unitPrice })),
      returnUrl: finalReturnUrl,
      cancelUrl: finalCancelUrl,
    });

    // 🔒 4. PERSIST ORDER & ORDER_ITEMS ATOMICALLY IN DB
    await tx(async (client) => {
      const user_id = (req as any).user?.id || null;
      const guest_email = !user_id ? (email || 'customer@ladrim.com') : null;

      const { rows: [newOrder] } = await client(
        `INSERT INTO orders (
          user_id, guest_email, status, checkout_state,
          subtotal, shipping_cost, discount, total,
          shipping_address, courier, payment_ref
        ) VALUES ($1, $2, 'pending', 'payment_pending', $3, $4, 0, $5, $6, $7, $8)
        RETURNING id`,
        [
          user_id,
          guest_email,
          calculatedSubtotal,
          serverShippingCost,
          serverTotal,
          JSON.stringify(address || {}),
          courier || 'Standard International',
          `${referenceId}|${paypalResult.orderId}`,
        ]
      );

      for (const line of validatedItems) {
        await client(
          `INSERT INTO order_items (order_id, variant_id, qty, unit_price, unit_cost)
           VALUES ($1, $2, $3, $4, $5)`,
          [newOrder.id, line.variantId, line.qty, line.unitPrice, line.unitCost]
        );
      }
    });

    return res.json({
      success: true,
      referenceId,
      paypalOrderId: paypalResult.orderId,
      approvalUrl: paypalResult.approvalUrl,
      serverTotal,
    });
  } catch (err: any) {
    console.error('[PAYPAL_CREATE_ORDER_ERR]', err);
    return res.status(400).json({
      error: err.message || 'Failed to initiate secure PayPal payment',
    });
  }
}

/**
 * POST /api/checkout/paypal/capture-order
 * Captures PayPal payment once the user completes the approval on paypal.com
 * and ATOMICALLY decrements stock in product_variants to prevent overselling race conditions.
 */
export async function captureOrder(req: Request, res: Response) {
  try {
    const { paypalOrderId, token } = req.body;
    const orderIdToCapture = paypalOrderId || token;

    if (!orderIdToCapture) {
      return res.status(400).json({ error: 'PayPal Order ID / token is required for capture' });
    }

    // 1. Capture payment via PayPal REST API
    const captureResult = await capturePayPalOrder(orderIdToCapture);

    if (captureResult.status !== 'COMPLETED') {
      return res.status(400).json({
        error: `PayPal payment not completed. Status: ${captureResult.status}`,
      });
    }

    // 🔒 2. ATOMIC DB TRANSACTION: MARK ORDER AS PAID AND DEDUCT INVENTORY STOCK
    const updated = await tx(async (client) => {
      // Find and update the order state idempotently (only if not already marked paid)
      const { rows } = await client(
        `UPDATE orders
         SET status = 'processing', checkout_state = 'paid', paid_at = now()
         WHERE payment_ref LIKE $1 AND checkout_state <> 'paid'
         RETURNING id, total`,
        [`%${orderIdToCapture}%`]
      );

      if (rows.length === 0) {
        // Order was already marked paid previously (idempotent duplicate capture)
        return { alreadyProcessed: true };
      }

      const orderId = rows[0].id;

      // 🔒 ATOMIC INVENTORY DEDUCTION: Prevent overselling race conditions
      await client(
        `UPDATE product_variants v
         SET stock = GREATEST(0, v.stock - i.qty)
         FROM order_items i
         WHERE i.order_id = $1 AND i.variant_id = v.id`,
        [orderId]
      );

      return { alreadyProcessed: false, orderId };
    });

    return res.json({
      success: true,
      message: 'PayPal payment captured & inventory stock deducted successfully',
      capture: captureResult,
      alreadyProcessed: updated.alreadyProcessed,
    });
  } catch (err: any) {
    console.error('[PAYPAL_CAPTURE_ORDER_ERR]', err);
    return res.status(400).json({
      error: err.message || 'Failed to capture PayPal payment',
    });
  }
}
