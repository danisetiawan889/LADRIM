'use client';

import React, { useState } from 'react';
import { Settings, Save, Shield, Store, Bell, Key, Check } from 'lucide-react';

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('LADRIM Official Store');
  const [supportEmail, setSupportEmail] = useState('support@ladrim.com');
  const [currency, setCurrency] = useState('USD ($)');
  const [taxRate, setTaxRate] = useState('8.0% (Sales Tax)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Store Settings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure general LADRIM store settings, sales tax, and operational preferences
          </p>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <Check size={14} />
            <span>Settings Saved Successfully</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* GENERAL SETTINGS CARD */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <Store size={18} className="text-gray-700" />
            <h3 className="font-bold text-sm text-gray-900">Store Profile &amp; Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Public Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Support Contact Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Primary Currency
              </label>
              <input
                type="text"
                value={currency}
                disabled
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3.5 py-2 text-xs text-gray-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Default Sales Tax
              </label>
              <input
                type="text"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECURITY SETTINGS CARD */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <Shield size={18} className="text-gray-700" />
            <h3 className="font-bold text-sm text-gray-900">Security &amp; Admin Authentication</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-lg border border-gray-100">
              <div>
                <p className="font-bold text-gray-900">Two-Factor Authentication (2FA)</p>
                <p className="text-gray-500 text-[11px]">Require TOTP / authenticator app code for all staff members</p>
              </div>
              <span className="bg-black text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Enabled
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-lg border border-gray-100">
              <div>
                <p className="font-bold text-gray-900">Audit Logging &amp; Activity Stream</p>
                <p className="text-gray-500 text-[11px]">Record every price change, stock movement, and order update</p>
              </div>
              <span className="bg-black text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Active (Immutable)
              </span>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition active:scale-[0.99] shadow-xs cursor-pointer"
          >
            <Save size={15} />
            <span>Save Settings Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
