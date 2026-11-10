import { getPaymentSettings } from './payment.service';

// Bypass TLS verification in dev/sandbox environments if system clock has discrepancies
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export interface PayPalCredentials {
  clientId: string;
  secretKey: string;
  environment: 'sandbox' | 'live';
}

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  referenceId: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalOrderResult {
  orderId: string;
  status: string;
  approvalUrl: string;
}

/**
 * Retrieve active PayPal configuration from site_settings.payment_methods
 */
export async function getPayPalConfig(): Promise<PayPalCredentials> {
  const { methods } = await getPaymentSettings();
  const paypalMethod = methods.find(
    (m) => (m.provider === 'paypal' || m.brand === 'paypal') && m.isActive
  );

  if (!paypalMethod || !paypalMethod.credentials?.clientId || !paypalMethod.credentials?.secretKey) {
    throw new Error('PayPal payment gateway is not configured or active in Admin Settings.');
  }

  return {
    clientId: paypalMethod.credentials.clientId.trim(),
    secretKey: paypalMethod.credentials.secretKey.trim(),
    environment:
      paypalMethod.credentials.environment === 'live' || paypalMethod.environment === 'live'
        ? 'live'
        : 'sandbox',
  };
}

/**
 * Obtain OAuth2 Access Token from PayPal REST API
 */
export async function getPayPalAccessToken(config: PayPalCredentials): Promise<string> {
  const base =
    config.environment === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  const auth = Buffer.from(`${config.clientId}:${config.secretKey}`).toString('base64');

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.access_token) {
    const errorDesc = data.error_description || data.error || 'Authentication failed';
    throw new Error(
      `PayPal Authentication Error (${res.status}): ${errorDesc}. Please verify your Client ID and Secret Key in Admin > Payments.`
    );
  }

  return data.access_token;
}

/**
 * Create a PayPal Checkout v2 Order and extract Approval URL
 */
export async function createPayPalOrder(params: CreateOrderParams): Promise<PayPalOrderResult> {
  const config = await getPayPalConfig();
  const accessToken = await getPayPalAccessToken(config);

  const base =
    config.environment === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  const currency = params.currency || 'USD';
  const formattedAmount = Number(params.amount).toFixed(2);

  const orderPayload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.referenceId,
        description: `LADRIM Order ${params.referenceId}`,
        amount: {
          currency_code: currency,
          value: formattedAmount,
        },
      },
    ],
    application_context: {
      brand_name: 'LADRIM',
      landing_page: 'LOGIN',
      user_action: 'PAY_NOW',
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
    },
  };

  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(orderPayload),
  });

  const orderData = await res.json().catch(() => ({}));

  if (!res.ok || !orderData.id) {
    const msg =
      orderData.message ||
      (orderData.details && orderData.details[0]?.description) ||
      'Failed to create PayPal order';
    throw new Error(`PayPal Order Creation Failed: ${msg}`);
  }

  const approveLink = orderData.links?.find(
    (link: any) => link.rel === 'approve' || link.rel === 'payer-action'
  );

  if (!approveLink || !approveLink.href) {
    throw new Error('PayPal did not return an approval URL for redirect.');
  }

  return {
    orderId: orderData.id,
    status: orderData.status,
    approvalUrl: approveLink.href,
  };
}

/**
 * Capture a PayPal Order once customer returns from PayPal
 */
export async function capturePayPalOrder(paypalOrderId: string): Promise<any> {
  const config = await getPayPalConfig();
  const accessToken = await getPayPalAccessToken(config);

  const base =
    config.environment === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${base}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  });

  const captureData = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      captureData.message ||
      (captureData.details && captureData.details[0]?.description) ||
      'Failed to capture PayPal payment';
    throw new Error(`PayPal Capture Error: ${msg}`);
  }

  return captureData;
}
