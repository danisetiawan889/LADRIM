import { Request, Response } from 'express';
import {
  addPaymentMethod,
  getPaymentSettings,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethod,
  PaymentMethodItem,
} from '../services/payment.service';

/**
 * Controller for International Payment Methods
 * Implements strict switch(provider) validation for:
 * - "paypal" (PayPal)
 * - "stripe" (Stripe / Credit Card Gateway)
 * - "custom" (Custom International Provider)
 */

export async function createPaymentMethod(req: Request, res: Response) {
  try {
    const { provider, ...payload } = req.body;

    if (!provider || typeof provider !== 'string') {
      return res.status(400).json({
        error: 'Global payment provider is required ("paypal", "stripe", or "custom")',
      });
    }

    const normalizedProvider = provider.trim().toLowerCase();
    let validatedMethod: Partial<PaymentMethodItem> = {};

    // 2. SWITCH(PROVIDER) CONDITIONAL VALIDATION
    switch (normalizedProvider) {
      case 'paypal': {
        const { clientId, secretKey, environment, name, subtitle } = payload;

        if (!clientId || typeof clientId !== 'string' || !clientId.trim()) {
          return res.status(400).json({ error: 'Client ID is required for PayPal' });
        }
        if (!secretKey || typeof secretKey !== 'string' || !secretKey.trim()) {
          return res.status(400).json({ error: 'Secret Key is required for PayPal' });
        }

        const envMode: 'sandbox' | 'live' = environment === 'live' ? 'live' : 'sandbox';

        validatedMethod = {
          name: name?.trim() || 'PayPal',
          subtitle:
            subtitle?.trim() ||
            (envMode === 'live'
              ? 'PayPal Live Mode (International)'
              : 'PayPal Sandbox Mode (Testing)'),
          type: 'ewallet',
          brand: 'paypal',
          badge: envMode === 'live' ? 'Live' : 'Sandbox',
          provider: 'paypal',
          environment: envMode,
          credentials: {
            clientId: clientId.trim(),
            secretKey: secretKey.trim(),
            environment: envMode,
          },
          isActive: true,
          fee: Number(payload.fee) || 0,
        };
        break;
      }

      case 'stripe':
      case 'credit_card':
      case 'stripe_credit_card': {
        const { publishableKey, secretKey, webhookSecret, name, subtitle } = payload;

        if (!publishableKey || typeof publishableKey !== 'string' || !publishableKey.trim()) {
          return res.status(400).json({ error: 'Publishable Key (Client Key) is required for Stripe' });
        }
        if (!secretKey || typeof secretKey !== 'string' || !secretKey.trim()) {
          return res.status(400).json({ error: 'Secret Key (Server Key) is required for Stripe' });
        }

        const isLive =
          secretKey.trim().startsWith('sk_live_') || publishableKey.trim().startsWith('pk_live_');
        const envMode: 'sandbox' | 'live' = isLive ? 'live' : 'sandbox';

        validatedMethod = {
          name: name?.trim() || 'Stripe / Credit Card Gateway',
          subtitle:
            subtitle?.trim() ||
            (isLive
              ? 'Accepts Visa, Mastercard, American Express, Apple Pay'
              : 'Stripe Test Mode (Sandbox)'),
          type: 'credit_card',
          brand: 'stripe',
          badge: isLive ? 'Live' : 'Test Mode',
          provider: 'stripe',
          environment: envMode,
          credentials: {
            publishableKey: publishableKey.trim(),
            secretKey: secretKey.trim(),
            webhookSecret: (webhookSecret || '').trim(),
            environment: envMode,
          },
          isActive: true,
          fee: Number(payload.fee) || 0,
        };
        break;
      }

      case 'custom':
      case 'custom_international': {
        const { providerName, merchantId, apiKey, subtitle } = payload;

        if (!providerName || typeof providerName !== 'string' || !providerName.trim()) {
          return res.status(400).json({ error: 'Provider Name is required for Custom Provider' });
        }
        if (!merchantId || typeof merchantId !== 'string' || !merchantId.trim()) {
          return res.status(400).json({ error: 'Merchant ID is required for Custom Provider' });
        }
        if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
          return res.status(400).json({ error: 'API Key / Server Key is required for Custom Provider' });
        }

        validatedMethod = {
          name: providerName.trim(),
          subtitle: subtitle?.trim() || `Merchant ID: ${merchantId.trim()}`,
          type: 'other',
          brand: 'custom',
          badge: 'Custom Gateway',
          provider: 'custom',
          credentials: {
            providerName: providerName.trim(),
            merchantId: merchantId.trim(),
            apiKey: apiKey.trim(),
          },
          isActive: true,
          fee: Number(payload.fee) || 0,
        };
        break;
      }

      default:
        return res.status(400).json({
          error: `Unsupported provider "${provider}". Allowed options: "paypal", "stripe", or "custom".`,
        });
    }

    // Persist validated international payment method to database
    const updatedMethods = await addPaymentMethod(validatedMethod);

    return res.status(201).json({
      success: true,
      message: 'Payment method successfully created and saved',
      method: validatedMethod,
      methods: updatedMethods,
    });
  } catch (err: any) {
    console.error('[CREATE_PAYMENT_METHOD_ERR]', err);
    return res.status(500).json({ error: err.message || 'Failed to save payment method' });
  }
}

export async function getPaymentMethods(_req: Request, res: Response) {
  try {
    const { methods, gateway } = await getPaymentSettings();
    return res.json({ success: true, methods, gateway });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve payment methods' });
  }
}

export async function updatePaymentMethodHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const methods = await updatePaymentMethod(id, updates);
    return res.json({ success: true, methods, message: 'Payment method updated successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update payment method' });
  }
}

export async function togglePaymentMethodHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const methods = await togglePaymentMethod(id);
    return res.json({ success: true, methods, message: 'Payment method status toggled successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to toggle payment method' });
  }
}

export async function deletePaymentMethodHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const methods = await deletePaymentMethod(id);
    return res.json({ success: true, methods, message: 'Payment method deleted successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete payment method' });
  }
}
