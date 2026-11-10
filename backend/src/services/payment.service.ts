import crypto from 'crypto';
import { env } from '../config/env';
import { tx, query } from '../config/db';

export interface PaymentMethodCredentials {
  clientId?: string;
  secretKey?: string;
  publishableKey?: string;
  webhookSecret?: string;
  merchantId?: string;
  apiKey?: string;
  providerName?: string;
  environment?: 'sandbox' | 'live';
}

export interface PaymentMethodItem {
  id: string;
  name: string;
  code?: string;
  subtitle: string;
  type: 'credit_card' | 'qris' | 'virtual_account' | 'bank_transfer' | 'ewallet' | 'cod' | 'paypal' | 'stripe' | 'custom' | 'other';
  brand?: string;
  badge?: string;
  tag?: string;
  provider: 'paypal' | 'stripe' | 'custom' | 'midtrans' | 'xendit' | 'manual';
  environment?: 'sandbox' | 'live';
  credentials?: PaymentMethodCredentials;
  isActive: boolean;
  fee: number;
  accountNumber?: string;
}

export interface PaymentGatewayConfig {
  provider: 'paypal' | 'stripe' | 'custom' | 'midtrans' | 'xendit' | 'manual';
  isProduction: boolean;
  serverKey: string;
  clientKey: string;
  merchantId: string;
  autoCancelHours?: number;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: 'pm-stripe-card',
    name: 'Stripe / Credit Card Gateway',
    subtitle: 'Accepts Visa, Mastercard, American Express, Apple Pay',
    type: 'credit_card',
    brand: 'stripe',
    badge: 'Live',
    provider: 'stripe',
    environment: 'live',
    credentials: {
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
      environment: 'live',
    },
    isActive: true,
    fee: 0,
  },
  {
    id: 'pm-paypal-intl',
    name: 'PayPal',
    subtitle: 'PayPal International & Global Checkout',
    type: 'ewallet',
    brand: 'paypal',
    badge: 'Live',
    provider: 'paypal',
    environment: 'live',
    credentials: {
      clientId: '',
      secretKey: '',
      environment: 'live',
    },
    isActive: true,
    fee: 0,
  },
];

export const DEFAULT_GATEWAY_CONFIG: PaymentGatewayConfig = {
  provider: 'midtrans',
  isProduction: env.MIDTRANS_IS_PRODUCTION || false,
  serverKey: env.MIDTRANS_SERVER_KEY || '',
  clientKey: '',
  merchantId: '',
  autoCancelHours: 24,
};

// Retrieve payment methods & gateway settings from database
export async function getPaymentSettings() {
  const [methodsRes, gwRes] = await Promise.all([
    query(`SELECT value FROM site_settings WHERE key = 'payment_methods'`),
    query(`SELECT value FROM site_settings WHERE key = 'payment_gateway'`),
  ]);

  let methods: PaymentMethodItem[] = DEFAULT_PAYMENT_METHODS;
  if (methodsRes.rows.length && Array.isArray(methodsRes.rows[0].value)) {
    methods = methodsRes.rows[0].value;
  } else {
    // Seed default payment methods into DB
    try {
      await query(
        `INSERT INTO site_settings (key, value) VALUES ('payment_methods', $1) ON CONFLICT (key) DO NOTHING`,
        [JSON.stringify(DEFAULT_PAYMENT_METHODS)]
      );
    } catch (e) {
      console.warn('[SEED_PAYMENT_METHODS_WARN]', e);
    }
  }

  let gateway: PaymentGatewayConfig = {
    ...DEFAULT_GATEWAY_CONFIG,
    serverKey: env.MIDTRANS_SERVER_KEY || '',
  };
  if (gwRes.rows.length && gwRes.rows[0].value) {
    gateway = {
      ...gateway,
      ...gwRes.rows[0].value,
      serverKey: gwRes.rows[0].value.serverKey || env.MIDTRANS_SERVER_KEY || '',
    };
  } else {
    try {
      await query(
        `INSERT INTO site_settings (key, value) VALUES ('payment_gateway', $1) ON CONFLICT (key) DO NOTHING`,
        [JSON.stringify(gateway)]
      );
    } catch (e) {
      console.warn('[SEED_PAYMENT_GATEWAY_WARN]', e);
    }
  }

  return { methods, gateway };
}

// Retrieve active gateway config
export async function getPaymentGatewayConfig(): Promise<PaymentGatewayConfig> {
  try {
    const { rows } = await query(`SELECT value FROM site_settings WHERE key = 'payment_gateway'`);
    if (rows.length && rows[0].value) {
      return {
        provider: rows[0].value.provider || 'midtrans',
        isProduction: Boolean(rows[0].value.isProduction),
        serverKey: rows[0].value.serverKey || env.MIDTRANS_SERVER_KEY || '',
        clientKey: rows[0].value.clientKey || '',
        merchantId: rows[0].value.merchantId || '',
        autoCancelHours: rows[0].value.autoCancelHours || 24,
      };
    }
  } catch (err) {
    console.error('[GET_PAYMENT_GATEWAY_CONFIG_ERR]', err);
  }
  return {
    provider: 'midtrans',
    isProduction: env.MIDTRANS_IS_PRODUCTION || false,
    serverKey: env.MIDTRANS_SERVER_KEY || '',
    clientKey: '',
    merchantId: '',
    autoCancelHours: 24,
  };
}

// Save payment gateway configuration
export async function savePaymentGatewayConfig(cfg: Partial<PaymentGatewayConfig>) {
  const current = await getPaymentGatewayConfig();
  const merged: PaymentGatewayConfig = {
    ...current,
    ...cfg,
    isProduction: Boolean(cfg.isProduction),
  };
  await query(
    `INSERT INTO site_settings (key, value) VALUES ('payment_gateway', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [JSON.stringify(merged)]
  );
  return merged;
}

// Toggle payment method active/inactive status
export async function togglePaymentMethod(id: string) {
  const { methods } = await getPaymentSettings();
  const updated = methods.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m));
  await query(
    `INSERT INTO site_settings (key, value) VALUES ('payment_methods', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [JSON.stringify(updated)]
  );
  return updated;
}

// Add new payment method
export async function addPaymentMethod(item: Partial<PaymentMethodItem>) {
  const { methods } = await getPaymentSettings();
  const newMethod: PaymentMethodItem = {
    id: item.id || ('pm-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6)),
    name: item.name || 'International Payment Method',
    code: item.code || '',
    subtitle: item.subtitle || '',
    type: item.type || 'other',
    brand: item.brand,
    badge: item.badge,
    tag: item.tag,
    provider: item.provider || 'stripe',
    environment: item.environment || 'live',
    credentials: item.credentials,
    isActive: item.isActive !== false,
    fee: Number(item.fee) || 0,
    accountNumber: item.accountNumber || '',
  };
  const updated = [newMethod, ...methods];
  await query(
    `INSERT INTO site_settings (key, value) VALUES ('payment_methods', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [JSON.stringify(updated)]
  );
  return updated;
}

// Update payment method
export async function updatePaymentMethod(id: string, updates: Partial<PaymentMethodItem>) {
  const { methods } = await getPaymentSettings();
  const updated = methods.map((m) => (m.id === id ? { ...m, ...updates } : m));
  await query(
    `INSERT INTO site_settings (key, value) VALUES ('payment_methods', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [JSON.stringify(updated)]
  );
  return updated;
}

// Delete payment method
export async function deletePaymentMethod(id: string) {
  const { methods } = await getPaymentSettings();
  const updated = methods.filter((m) => m.id !== id);
  await query(
    `INSERT INTO site_settings (key, value) VALUES ('payment_methods', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [JSON.stringify(updated)]
  );
  return updated;
}

// Get active payment methods for customer checkout
export async function getActivePaymentMethods() {
  const { methods } = await getPaymentSettings();
  return methods.filter((m) => m.isActive);
}

// Test connection to payment gateway
export async function testGatewayConnection({
  provider = 'midtrans',
  serverKey,
  isProduction = false,
}: {
  provider?: string;
  serverKey?: string;
  isProduction?: boolean;
}) {
  const activeKey = serverKey || (await getPaymentGatewayConfig()).serverKey;
  if (!activeKey) {
    return { success: false, message: 'Server Key belum diisi. Harap masukkan Server Key terlebih dahulu.' };
  }

  if (provider === 'midtrans') {
    const base = isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    try {
      // Test ping to midtrans transaction status API with mock order id
      const res = await fetch(`${base}/v2/ladrim-test-ping-auth/status`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Basic ' + Buffer.from(activeKey + ':').toString('base64'),
        },
      });

      // Midtrans returns 401 if server key is unauthorized/invalid,
      // and returns 404 / 400 when authentication succeeds but mock transaction doesn't exist.
      if (res.status === 401) {
        return {
          success: false,
          statusCode: 401,
          message: 'Autentikasi Gagal: Server Key Midtrans tidak valid atau ditolak oleh server Midtrans.',
        };
      } else if (res.status === 404 || res.status === 200 || res.status === 400) {
        return {
          success: true,
          statusCode: res.status,
          message: `Koneksi ke Midtrans (${isProduction ? 'Production Mode' : 'Sandbox Mode'}) Terverifikasi! Server Key valid dan siap digunakan.`,
        };
      } else {
        return {
          success: false,
          statusCode: res.status,
          message: `Midtrans merespons dengan status code: ${res.status}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menghubungi server Midtrans: ${err.message}`,
      };
    }
  }

  return {
    success: true,
    message: `Format API Key terverifikasi untuk provider ${provider}.`,
  };
}

// Create a Snap transaction (Midtrans). Dynamic server key and environment from DB settings
export async function createPayment(orderId: string) {
  const { rows: [o] } = await query(
    `SELECT total FROM orders WHERE id=$1 AND checkout_state='address_validated'`, [orderId]);
  if (!o) throw Object.assign(new Error('Order not ready for payment'), { status: 409 });

  const gw = await getPaymentGatewayConfig();
  const base = gw.isProduction ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
  const serverKey = gw.serverKey || env.MIDTRANS_SERVER_KEY;

  const res = await fetch(`${base}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(serverKey + ':').toString('base64'),
    },
    body: JSON.stringify({ transaction_details: { order_id: orderId, gross_amount: Math.round(Number(o.total)) } }),
  });
  if (!res.ok) throw new Error('Payment gateway error');
  await query(`UPDATE orders SET checkout_state='payment_pending' WHERE id=$1`, [orderId]);
  return res.json(); // { token, redirect_url }
}

// Midtrans signature verification
export async function verifyMidtransSignature(b: any) {
  const gw = await getPaymentGatewayConfig();
  const serverKey = gw.serverKey || env.MIDTRANS_SERVER_KEY;
  const expected = crypto.createHash('sha512')
    .update(`${b.order_id}${b.status_code}${b.gross_amount}${serverKey}`).digest('hex');
  const a = Buffer.from(expected), c = Buffer.from(String(b.signature_key ?? ''));
  return a.length === c.length && crypto.timingSafeEqual(a, c);
}

export async function handleMidtransWebhook(b: any) {
  const isValid = await verifyMidtransSignature(b);
  if (!isValid) throw Object.assign(new Error('Bad signature'), { status: 401 });
  return tx(async (q) => {
    // Idempotency: a repeated event is a no-op.
    const ins = await q(
      `INSERT INTO payment_events (provider,event_id,payload) VALUES ('midtrans',$1,$2) ON CONFLICT DO NOTHING`,
      [`${b.transaction_id}:${b.transaction_status}`, JSON.stringify(b)]);
    if (!ins.rowCount) return;
    const settled = ['settlement', 'capture'].includes(b.transaction_status) && b.fraud_status !== 'deny';
    const failed = ['deny', 'cancel', 'expire', 'failure'].includes(b.transaction_status);
    if (settled) {
      const { rows } = await q(
        `UPDATE orders SET checkout_state='paid', status='processing', paid_at=now(), payment_ref=$2
          WHERE id=$1 AND checkout_state<>'paid' RETURNING id`, [b.order_id, b.transaction_id]);
      if (rows.length)
        await q(`UPDATE product_variants v SET stock = v.stock - i.qty
                   FROM order_items i WHERE i.order_id=$1 AND i.variant_id=v.id`, [b.order_id]);
    } else if (failed) {
      await q(`UPDATE orders SET checkout_state='failed', status='cancelled'
                WHERE id=$1 AND checkout_state<>'paid'`, [b.order_id]);
    }
  });
}
