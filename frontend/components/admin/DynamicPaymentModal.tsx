'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Lock,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export type GlobalPaymentProvider = 'paypal' | 'stripe' | 'custom';

export interface DynamicPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedMethods: any[]) => void;
}

export interface FormDataState {
  // Common / Dropdown
  provider: GlobalPaymentProvider;
  
  // PayPal fields
  paypalClientId: string;
  paypalSecretKey: string;
  paypalEnvironment: 'sandbox' | 'live';

  // Stripe fields
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;

  // Custom Provider fields
  customProviderName: string;
  customMerchantId: string;
  customApiKey: string;
}

const initialFormState: FormDataState = {
  provider: 'stripe',
  paypalClientId: '',
  paypalSecretKey: '',
  paypalEnvironment: 'sandbox',
  stripePublishableKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  customProviderName: '',
  customMerchantId: '',
  customApiKey: '',
};

export const DynamicPaymentModal: React.FC<DynamicPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormDataState>(initialFormState);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [webhookCopied, setWebhookCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://ladrim.com';
  const webhookEndpointUrl = `${currentOrigin}/api/checkout/webhook`;

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookEndpointUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  };

  /**
   * Frontend Submission Handler
   * Assembles a JSON payload based on the selected provider and POSTs to /api/payment-methods
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let payload: Record<string, any> = {
      provider: formData.provider,
    };

    // Client-side quick validation & payload construction per provider
    if (formData.provider === 'paypal') {
      if (!formData.paypalClientId.trim()) {
        setErrorMessage('Client ID is required for PayPal');
        return;
      }
      if (!formData.paypalSecretKey.trim()) {
        setErrorMessage('Secret Key is required for PayPal');
        return;
      }
      payload = {
        provider: 'paypal',
        clientId: formData.paypalClientId.trim(),
        secretKey: formData.paypalSecretKey.trim(),
        environment: formData.paypalEnvironment,
      };
    } else if (formData.provider === 'stripe') {
      if (!formData.stripePublishableKey.trim()) {
        setErrorMessage('Publishable Key (Client Key) is required for Stripe');
        return;
      }
      if (!formData.stripeSecretKey.trim()) {
        setErrorMessage('Secret Key (Server Key) is required for Stripe');
        return;
      }
      payload = {
        provider: 'stripe',
        publishableKey: formData.stripePublishableKey.trim(),
        secretKey: formData.stripeSecretKey.trim(),
        webhookSecret: formData.stripeWebhookSecret.trim(),
      };
    } else if (formData.provider === 'custom') {
      if (!formData.customProviderName.trim()) {
        setErrorMessage('Provider Name is required for Custom Provider');
        return;
      }
      if (!formData.customMerchantId.trim()) {
        setErrorMessage('Merchant ID is required for Custom Provider');
        return;
      }
      if (!formData.customApiKey.trim()) {
        setErrorMessage('API Key / Server Key is required for Custom Provider');
        return;
      }
      payload = {
        provider: 'custom',
        providerName: formData.customProviderName.trim(),
        merchantId: formData.customMerchantId.trim(),
        apiKey: formData.customApiKey.trim(),
      };
    }

    try {
      setIsSubmitting(true);
      const res = await apiFetch('/api/payment-methods', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.success) {
        setFormData(initialFormState);
        onSuccess(res.methods || []);
        onClose();
      } else {
        setErrorMessage(res?.error || 'Failed to register payment method');
      }
    } catch (err: any) {
      console.error('Failed to submit global payment method:', err);
      setErrorMessage(err.message || 'Network error occurred while connecting to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200/80 space-y-6 my-auto max-h-[92vh] overflow-y-auto">
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                <Globe size={15} />
              </span>
              <h3 className="font-bold text-base sm:text-lg text-neutral-900 tracking-tight">
                Add Global Payment Method
              </h3>
            </div>
            <p className="text-xs text-neutral-500">
              Configure international gateways (PayPal, Stripe, or Custom) for cross-border transactions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 transition p-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* DYNAMIC FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. DROPDOWN UTAMA (Pilih Provider Global) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Pilih Provider Global
            </label>
            <div className="relative">
              <select
                value={formData.provider}
                onChange={(e) => {
                  setErrorMessage(null);
                  setFormData({
                    ...formData,
                    provider: e.target.value as GlobalPaymentProvider,
                  });
                }}
                className="w-full bg-neutral-50 border border-neutral-300 hover:border-neutral-400 focus:border-black rounded-xl px-3.5 py-2.5 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black transition appearance-none cursor-pointer"
              >
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe / Credit Card Gateway</option>
                <option value="custom">Custom International Provider</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 text-xs">
                ▼
              </div>
            </div>
            <p className="text-[11px] text-neutral-400">
              Select the international processing engine to dynamically configure its credentials.
            </p>
          </div>

          {/* 2. LOGIKA KONDISIONAL (KOLOM YANG MUNCUL) */}

          {/* ================= CONDITION 1: PAYPAL ================= */}
          {formData.provider === 'paypal' && (
            <div className="space-y-4 p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                  PayPal Configuration
                </span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Global Wallet
                </span>
              </div>

              {/* Client ID */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Client ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.paypalClientId}
                  onChange={(e) =>
                    setFormData({ ...formData, paypalClientId: e.target.value })
                  }
                  placeholder="e.g. AUq..."
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-black focus:outline-none transition"
                />
              </div>

              {/* Secret Key */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Secret Key <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    required
                    value={formData.paypalSecretKey}
                    onChange={(e) =>
                      setFormData({ ...formData, paypalSecretKey: e.target.value })
                    }
                    placeholder="e.g. ELp..."
                    className="w-full bg-white border border-neutral-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-black focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
                    tabIndex={-1}
                  >
                    {showSecretKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Dropdown: Mode Environment (Sandbox / Live) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Mode Environment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.paypalEnvironment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paypalEnvironment: e.target.value as 'sandbox' | 'live',
                    })
                  }
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-medium text-neutral-900 focus:ring-1 focus:ring-black focus:outline-none transition cursor-pointer"
                >
                  <option value="sandbox">Sandbox (Testing / Development)</option>
                  <option value="live">Live (Production Payments)</option>
                </select>
              </div>
            </div>
          )}

          {/* ================= CONDITION 2: STRIPE / CREDIT CARD GATEWAY ================= */}
          {formData.provider === 'stripe' && (
            <div className="space-y-4 p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                  Stripe / Credit Card Gateway Configuration
                </span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Visa, MC, Amex
                </span>
              </div>

              {/* Publishable Key (Client Key) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Publishable Key (Client Key) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.stripePublishableKey}
                  onChange={(e) =>
                    setFormData({ ...formData, stripePublishableKey: e.target.value })
                  }
                  placeholder="e.g. pk_live_... or pk_test_..."
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-black focus:outline-none transition"
                />
              </div>

              {/* Secret Key (Server Key) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Secret Key (Server Key) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    required
                    value={formData.stripeSecretKey}
                    onChange={(e) =>
                      setFormData({ ...formData, stripeSecretKey: e.target.value })
                    }
                    placeholder="e.g. sk_live_... or sk_test_..."
                    className="w-full bg-white border border-neutral-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-black focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
                    tabIndex={-1}
                  >
                    {showSecretKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Webhook Signing Secret (Opsional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Webhook Signing Secret <span className="text-neutral-400 font-normal">(Opsional)</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={formData.stripeWebhookSecret}
                    onChange={(e) =>
                      setFormData({ ...formData, stripeWebhookSecret: e.target.value })
                    }
                    placeholder="e.g. whsec_..."
                    className="w-full bg-white border border-neutral-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-black focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
                    tabIndex={-1}
                  >
                    {showWebhookSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Used to verify asynchronous transaction events (e.g., checkout.session.completed).
                </p>
              </div>

              {/* Webhook URL Endpoint for Stripe Dashboard */}
              <div className="pt-1">
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Webhook Endpoint URL (Copy to Stripe Dashboard)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={webhookEndpointUrl}
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-neutral-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhookUrl}
                    className="p-1.5 border border-neutral-300 rounded-lg hover:bg-neutral-100 text-neutral-700 transition cursor-pointer shrink-0"
                    title="Copy Webhook Endpoint URL"
                  >
                    {webhookCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= CONDITION 3: CUSTOM INTERNATIONAL PROVIDER ================= */}
          {formData.provider === 'custom' && (
            <div className="space-y-4 p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-700 inline-block" />
                  Custom International Provider Configuration
                </span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-neutral-200 text-neutral-800">
                  Custom Gateway
                </span>
              </div>

              {/* Input Text: Provider Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Provider Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customProviderName}
                  onChange={(e) =>
                    setFormData({ ...formData, customProviderName: e.target.value })
                  }
                  placeholder="e.g. Adyen, 2Checkout, Authorize.Net, Worldpay"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-medium text-neutral-900 focus:ring-1 focus:ring-black focus:outline-none transition"
                />
              </div>

              {/* Input Text: Merchant ID */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Merchant ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customMerchantId}
                  onChange={(e) =>
                    setFormData({ ...formData, customMerchantId: e.target.value })
                  }
                  placeholder="e.g. MCH-98412948"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-black focus:outline-none transition"
                />
              </div>

              {/* Input Text: API Key / Server Key */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  API Key / Server Key <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    required
                    value={formData.customApiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, customApiKey: e.target.value })
                    }
                    placeholder="Enter Provider API Key or Private Secret"
                    className="w-full bg-white border border-neutral-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-black focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
                    tabIndex={-1}
                  >
                    {showSecretKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIONS / SUBMIT BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition shadow-sm cursor-pointer flex items-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Connecting &amp; Saving...</span>
                </>
              ) : (
                <span>Save Payment Method</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DynamicPaymentModal;
