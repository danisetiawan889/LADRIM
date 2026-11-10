import { tx, query } from '../config/db';

type Line = { variantId: string; qty: number };

// Step 1: Cart verification. Prices and stock are ALWAYS re-read from the DB; client prices are ignored.
export async function verifyCart(lines: Line[], who: { userId?: string; guestEmail?: string }) {
  return tx(async (q) => {
    let subtotal = 0, weight = 0;
    const priced: any[] = [];
    for (const l of lines) {
      const { rows } = await q(
        `SELECT v.id, v.stock, COALESCE(v.price_override, p.base_price) AS price, p.cost_price, p.weight_grams
           FROM product_variants v JOIN products p ON p.id = v.product_id
          WHERE v.id = $1 AND p.is_active FOR UPDATE OF v`, [l.variantId]);
      const v = rows[0];
      if (!v || v.stock < l.qty) throw Object.assign(new Error('Item unavailable'), { status: 409 });
      subtotal += Number(v.price) * l.qty;
      weight += v.weight_grams * l.qty;
      priced.push({ ...l, unit_price: v.price, unit_cost: v.cost_price });
    }
    const { rows: [o] } = await q(
      `INSERT INTO orders (user_id, guest_email, subtotal, total, checkout_state)
       VALUES ($1,$2,$3,$3,'cart_verified') RETURNING id`, [who.userId ?? null, who.guestEmail ?? null, subtotal]);
    for (const p of priced)
      await q(`INSERT INTO order_items (order_id, variant_id, qty, unit_price, unit_cost) VALUES ($1,$2,$3,$4,$5)`,
        [o.id, p.variantId, p.qty, p.unit_price, p.unit_cost]);
    return { orderId: o.id, subtotal, weight };
  });
}

// Step 2: Address + courier. Shipping cost comes from the carrier API on the server, never the client.
export async function setAddress(orderId: string, address: unknown, courier: string, shippingCost: number) {
  const { rowCount } = await query(
    `UPDATE orders SET shipping_address=$2, courier=$3, shipping_cost=$4, total=subtotal-discount+$4,
            checkout_state='address_validated'
      WHERE id=$1 AND checkout_state='cart_verified'`, [orderId, JSON.stringify(address), courier, shippingCost]);
  if (!rowCount) throw Object.assign(new Error('Invalid checkout step'), { status: 409 });
}
// Step 3 (payment.service.ts) -> 'payment_pending'. Step 4 is the webhook. Step 5 reads the order from the DB.
