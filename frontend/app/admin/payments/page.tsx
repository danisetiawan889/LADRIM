'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  X,
  Copy,
  Check,
  Globe,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import DynamicPaymentModal from '@/components/admin/DynamicPaymentModal';

// Interface Types
export interface PaymentMethodItem {
  id: string;
  name: string;
  code?: string;
  subtitle: string;
  type: 'credit_card' | 'qris' | 'virtual_account' | 'bank_transfer' | 'ewallet' | 'cod' | 'other';
  brand?: string;
  badge?: string;
  tag?: string;
  provider: 'stripe' | 'paypal' | 'custom' | string;
  environment?: 'sandbox' | 'live';
  credentials?: {
    clientId?: string;
    secretKey?: string;
    environment?: 'sandbox' | 'live';
    publishableKey?: string;
    webhookSecret?: string;
    providerName?: string;
    merchantId?: string;
    apiKey?: string;
  };
  isActive: boolean;
  fee: number;
  accountNumber?: string;
}

// Brand SVG Logos
const StripeLogo = () => (
  <svg className="w-10 h-5" viewBox="0 0 60 25" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M59.64 14.28c0-4.49-3.26-7.85-7.68-7.85-4.47 0-7.79 3.36-7.79 7.85 0 4.9 3.58 7.79 8.24 7.79 2.27 0 3.99-.54 5.3-1.46v-3.48c-1.31.84-2.81 1.29-4.59 1.29-2.07 0-3.87-.92-4.14-2.79h10.63c.02-.45.03-.98.03-1.35zm-10.69-1.28c.16-1.7 1.54-2.5 3.01-2.5 1.45 0 2.82.8 2.98 2.5h-5.99zm-13.43 9.07V6.78h4.51v15.29h-4.51zm0-18.06V.86h4.51v3.23h-4.51zm-5.72 18.06V11.2c0-1.07-.63-1.74-1.71-1.74-.98 0-1.85.74-2.18 1.45v11.16H21.4V6.78h4.29v2.09c1.07-1.45 2.58-2.44 4.54-2.44 2.85 0 4.67 1.93 4.67 5.09v10.55h-4.51v-.01zM18.77 17.5c0 2.83-2.18 4.57-5.55 4.57-1.93 0-3.66-.54-4.88-1.43v-3.7c1.3.88 2.88 1.43 4.34 1.43 1.05 0 1.63-.42 1.63-.98 0-.67-.78-.96-2.1-1.4-2.76-.92-4.14-2.25-4.14-4.47 0-2.87 2.23-4.59 5.4-4.59 1.76 0 3.32.48 4.41 1.23l-1.32 3.12c-.9-.63-2.12-1.05-3.32-1.05-.88 0-1.43.4-1.43.9 0 .61.7 1 1.95 1.39 2.92.98 4.21 2.37 4.21 4.53v-.02zm-12.8-5.3V8.89H2.33l.03-2.11 3.61-.45V3.38L9.93 2v4.33h4.63v2.56H9.93v5.12c0 .92.65 1.34 1.63 1.34.8 0 1.49-.17 1.95-.4v3.1c-.8.36-1.87.53-3.14.53-2.83 0-4.4-1.63-4.4-4.21z"
      fill="#635BFF"
    />
  </svg>
);

const PayPalLogo = () => (
  <div className="flex items-center justify-center font-black tracking-tight text-xs">
    <span className="text-[#003087]">Pay</span>
    <span className="text-[#0079C1]">Pal</span>
  </div>
);

const VisaMastercardBadges = () => (
  <div className="flex items-center gap-1">
    <div className="px-1 py-0.5 rounded bg-blue-900 text-white font-black text-[7px] tracking-wider">
      VISA
    </div>
    <div className="relative flex items-center">
      <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] -ml-1 mix-blend-multiply opacity-90" />
    </div>
  </div>
);

export default function AdminPaymentsPage() {
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dynamic Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);

  // Manage / Edit Modal State
  const [editingMethod, setEditingMethod] = useState<PaymentMethodItem | null>(null);
  const [editCredentials, setEditCredentials] = useState<any>({});
  const [showEditSecret, setShowEditSecret] = useState(false);
  const [showEditWebhook, setShowEditWebhook] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch Payment Methods
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch('/api/admin/payments/settings');
      if (data?.methods) {
        setMethods(data.methods);
      }
    } catch (err: any) {
      console.error('Failed to load payment settings:', err);
      showToast('Gagal memuat pengaturan metode pembayaran', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Toggle Payment Method Active/Inactive
  const handleToggleMethod = async (id: string, currentStatus: boolean) => {
    // Optimistic UI Update
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !currentStatus } : m))
    );

    try {
      const res = await apiFetch(`/api/admin/payments/methods/${id}/toggle`, {
        method: 'PATCH',
      });
      if (res?.methods) {
        setMethods(res.methods);
      }
      showToast(
        `Metode berhasil di-${!currentStatus ? 'aktifkan' : 'nonaktifkan'}!`,
        'success'
      );
    } catch (err: any) {
      // Revert optimistic update
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isActive: currentStatus } : m))
      );
      showToast(err.message || 'Gagal mengubah status metode', 'error');
    }
  };

  // Open Manage Modal
  const handleOpenManageModal = (method: PaymentMethodItem) => {
    setEditingMethod(method);
    setEditCredentials(method.credentials || {});
    setShowEditSecret(false);
    setShowEditWebhook(false);
  };

  // Update Payment Method Credentials
  const handleUpdateMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;

    setIsSubmittingEdit(true);
    try {
      const updatedItem: Partial<PaymentMethodItem> = {
        ...editingMethod,
        credentials: editCredentials,
        environment: editCredentials.environment || editingMethod.environment,
      };

      const res = await apiFetch(`/api/admin/payments/methods/${editingMethod.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedItem),
      });

      if (res?.methods) {
        setMethods(res.methods);
      }
      setEditingMethod(null);
      showToast('Metode pembayaran berhasil diperbarui!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui metode pembayaran', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete Payment Method
  const handleDeleteMethod = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus metode pembayaran ini?')) return;

    try {
      const res = await apiFetch(`/api/admin/payments/methods/${id}`, {
        method: 'DELETE',
      });

      if (res?.methods) {
        setMethods(res.methods);
      }
      setEditingMethod(null);
      showToast('Metode pembayaran berhasil dihapus!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus metode pembayaran', 'error');
    }
  };

  // Render Icon according to global method
  const renderMethodIcon = (method: PaymentMethodItem) => {
    const prov = method.provider?.toLowerCase() || '';
    const brand = method.brand?.toLowerCase() || '';
    const name = method.name?.toLowerCase() || '';

    if (prov === 'paypal' || brand === 'paypal' || name.includes('paypal')) {
      return <PayPalLogo />;
    }
    if (prov === 'stripe' || brand === 'stripe' || name.includes('stripe')) {
      return <StripeLogo />;
    }
    if (name.includes('card') || method.type === 'credit_card') {
      return <CreditCard size={18} className="text-neutral-800" />;
    }
    return <Globe size={18} className="text-neutral-700" />;
  };

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://ladrim.com';
  const webhookEndpointUrl = `${currentOrigin}/api/checkout/webhook`;

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-4xl mx-auto">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce-short">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-neutral-900 text-white border-neutral-700 shadow-neutral-900/20'
                : 'bg-rose-950 text-rose-100 border-rose-700/80 shadow-rose-950/20'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* HEADER SECTION (CLEAN & MINIMALIST) */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Metode Pembayaran
          </h1>
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wider border border-neutral-200">
            Global Gateway
          </span>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500">
          Kelola integrasi pembayaran internasional (PayPal, Stripe / Kartu Kredit Global, dan Custom Provider).
        </p>
      </div>

      {/* PAYMENT METHODS LIST SECTION */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
              Metode Pembayaran Global
            </h2>
            <p className="text-xs text-neutral-400">
              Gerbang pembayaran aktif yang dapat digunakan pembeli dari seluruh dunia.
            </p>
          </div>

          {/* DYNAMIC FORM MODAL TRIGGER */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>Tambah Metode</span>
          </button>
        </div>

        {/* LIST OF GLOBAL PAYMENT METHODS */}
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-neutral-500" />
            <span>Memuat metode pembayaran internasional...</span>
          </div>
        ) : methods.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
            <p className="text-xs text-neutral-500 mb-3">Belum ada metode pembayaran global yang terdaftar.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-black text-white text-xs rounded-full font-semibold cursor-pointer"
            >
              + Tambah Metode Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {methods.map((method) => {
              const isLive =
                method.environment === 'live' ||
                method.badge?.toLowerCase().includes('live');

              return (
                <div
                  key={method.id}
                  className="bg-[#fcfcfc] border border-neutral-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-neutral-400 hover:shadow-xs"
                >
                  {/* LEFT SIDE: LOGO + DETAILS */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Logo Container */}
                    <div className="w-14 h-11 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                      {renderMethodIcon(method)}
                    </div>

                    {/* Info Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-neutral-900">
                          {method.name}
                        </span>

                        {/* Badges */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            isLive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              : 'bg-amber-50 text-amber-700 border-amber-200/60'
                          }`}
                        >
                          {isLive ? 'Live Production' : 'Sandbox / Test Mode'}
                        </span>

                        {method.provider === 'stripe' && <VisaMastercardBadges />}
                      </div>

                      {/* Subtitle */}
                      {method.subtitle && (
                        <p className="text-[11px] text-neutral-500 leading-tight">
                          {method.subtitle}
                        </p>
                      )}

                      {/* Credentials Hint */}
                      {method.credentials && (
                        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-neutral-400 font-mono">
                          {method.credentials.clientId && (
                            <span>ID: {method.credentials.clientId.slice(0, 10)}...</span>
                          )}
                          {method.credentials.publishableKey && (
                            <span>PK: {method.credentials.publishableKey.slice(0, 10)}...</span>
                          )}
                          {method.credentials.merchantId && (
                            <span>Merchant: {method.credentials.merchantId}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE: TOGGLE SWITCH + MANAGE BUTTON */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200/60">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-neutral-600 font-medium select-none">
                        {method.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>

                      {/* iOS Style Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleMethod(method.id, method.isActive)}
                        className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out p-0.5 relative cursor-pointer focus:outline-none ${
                          method.isActive ? 'bg-neutral-900' : 'bg-neutral-300'
                        }`}
                        aria-label={`Toggle ${method.name}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                            method.isActive ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* MANAGE (KELOLA) BUTTON */}
                    <button
                      onClick={() => handleOpenManageModal(method)}
                      className="px-4 py-1.5 rounded-full border border-neutral-300 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 hover:border-black transition cursor-pointer shadow-2xs"
                    >
                      Kelola
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER NOTICE / DISCLAIMER */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3 mt-6">
          <ShieldCheck size={18} className="text-neutral-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Semua transaksi internasional dienkripsi dengan standar keamanan PCI-DSS Tier 1.
            Kunci rahasia API (Secret Key) disimpan dengan aman dan hanya digunakan oleh server backend
            untuk komunikasi terotentikasi ke gateway global.
          </p>
        </div>
      </div>

      {/* DYNAMIC MODAL: TAMBAH PROVIDER GLOBAL BARU */}
      <DynamicPaymentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(updatedMethods) => {
          if (updatedMethods && updatedMethods.length > 0) {
            setMethods(updatedMethods);
          } else {
            fetchSettings();
          }
          showToast('Metode pembayaran global berhasil ditambahkan!', 'success');
        }}
      />

      {/* MANAGE PAYMENT MODAL (KELOLA KREDENSIAL PROVIDER) */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto animate-scaleUp max-h-[92vh] overflow-y-auto border border-neutral-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center border border-neutral-200">
                  {renderMethodIcon(editingMethod)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">
                    Manage Payment
                  </h3>
                  <p className="text-[11px] text-neutral-500">{editingMethod.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMethod(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer p-1 rounded-lg hover:bg-neutral-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateMethod} className="space-y-4">
              {/* DYNAMIC FIELDS PER PROVIDER */}
              
              {/* 1. PAYPAL FIELDS */}
              {editingMethod.provider === 'paypal' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={editCredentials.clientId || ''}
                      onChange={(e) =>
                        setEditCredentials({ ...editCredentials, clientId: e.target.value })
                      }
                      placeholder="PayPal Client ID"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Secret Key
                    </label>
                    <div className="relative">
                      <input
                        type={showEditSecret ? 'text' : 'password'}
                        value={editCredentials.secretKey || ''}
                        onChange={(e) =>
                          setEditCredentials({ ...editCredentials, secretKey: e.target.value })
                        }
                        placeholder="PayPal Secret Key"
                        className="w-full border border-neutral-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono focus:ring-1 focus:ring-black focus:outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditSecret(!showEditSecret)}
                        className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
                      >
                        {showEditSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Mode Environment
                    </label>
                    <select
                      value={editCredentials.environment || 'sandbox'}
                      onChange={(e) =>
                        setEditCredentials({ ...editCredentials, environment: e.target.value })
                      }
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none bg-white cursor-pointer"
                    >
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="live">Live (Production)</option>
                    </select>
                  </div>
                </>
              )}

              {/* 2. STRIPE FIELDS */}
              {editingMethod.provider === 'stripe' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Publishable Key (Client Key)
                    </label>
                    <input
                      type="text"
                      value={editCredentials.publishableKey || ''}
                      onChange={(e) =>
                        setEditCredentials({ ...editCredentials, publishableKey: e.target.value })
                      }
                      placeholder="pk_live_... / pk_test_..."
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Secret Key (Server Key)
                    </label>
                    <div className="relative">
                      <input
                        type={showEditSecret ? 'text' : 'password'}
                        value={editCredentials.secretKey || ''}
                        onChange={(e) =>
                          setEditCredentials({ ...editCredentials, secretKey: e.target.value })
                        }
                        placeholder="sk_live_... / sk_test_..."
                        className="w-full border border-neutral-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono focus:ring-1 focus:ring-black focus:outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditSecret(!showEditSecret)}
                        className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
                      >
                        {showEditSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Webhook Signing Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showEditWebhook ? 'text' : 'password'}
                        value={editCredentials.webhookSecret || ''}
                        onChange={(e) =>
                          setEditCredentials({ ...editCredentials, webhookSecret: e.target.value })
                        }
                        placeholder="whsec_..."
                        className="w-full border border-neutral-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono focus:ring-1 focus:ring-black focus:outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditWebhook(!showEditWebhook)}
                        className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
                      >
                        {showEditWebhook ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Webhook Endpoint URL
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={webhookEndpointUrl}
                        className="w-full border border-neutral-200 bg-neutral-50 rounded-lg px-2.5 py-2 text-[11px] font-mono text-neutral-600 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(webhookEndpointUrl);
                          setCopiedWebhook(true);
                          setTimeout(() => setCopiedWebhook(false), 2000);
                          showToast('URL Webhook berhasil disalin!', 'success');
                        }}
                        className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 text-neutral-700 transition cursor-pointer shrink-0"
                        title="Copy Webhook URL"
                      >
                        {copiedWebhook ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* 3. CUSTOM PROVIDER FIELDS */}
              {editingMethod.provider === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Provider Name
                    </label>
                    <input
                      type="text"
                      value={editCredentials.providerName || editingMethod.name || ''}
                      onChange={(e) =>
                        setEditCredentials({ ...editCredentials, providerName: e.target.value })
                      }
                      placeholder="Provider Name"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Merchant ID
                    </label>
                    <input
                      type="text"
                      value={editCredentials.merchantId || ''}
                      onChange={(e) =>
                        setEditCredentials({ ...editCredentials, merchantId: e.target.value })
                      }
                      placeholder="Merchant ID"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      API Key / Server Key
                    </label>
                    <div className="relative">
                      <input
                        type={showEditSecret ? 'text' : 'password'}
                        value={editCredentials.apiKey || ''}
                        onChange={(e) =>
                          setEditCredentials({ ...editCredentials, apiKey: e.target.value })
                        }
                        placeholder="API Key / Server Key"
                        className="w-full border border-neutral-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono focus:ring-1 focus:ring-black focus:outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditSecret(!showEditSecret)}
                        className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 cursor-pointer p-0.5"
                      >
                        {showEditSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* MODAL ACTIONS: DELETE & SAVE */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => handleDeleteMethod(editingMethod.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Payment</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMethod(null)}
                    className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingEdit && <RefreshCw size={13} className="animate-spin" />}
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
