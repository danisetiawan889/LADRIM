'use client';

import React, { useState } from 'react';
import { Ticket, Plus, Tag, Calendar, Copy, Check, Trash2, X } from 'lucide-react';

interface PromoCoupon {
  id: string;
  code: string;
  type: 'Percentage' | 'Fixed USD';
  value: string;
  minSpend: string;
  usedCount: number;
  limit: number;
  validUntil: string;
  isActive: boolean;
}

const DEFAULT_COUPONS: PromoCoupon[] = [
  {
    id: 'cp-1',
    code: 'LADRIMLUX10',
    type: 'Percentage',
    value: '10%',
    minSpend: '$50.00',
    usedCount: 142,
    limit: 500,
    validUntil: 'Dec 31, 2025',
    isActive: true,
  },
  {
    id: 'cp-2',
    code: 'NEWSEASON15',
    type: 'Fixed USD',
    value: '$15.00',
    minSpend: '$40.00',
    usedCount: 88,
    limit: 200,
    validUntil: 'Apr 30, 2025',
    isActive: true,
  },
  {
    id: 'cp-3',
    code: 'FREESHIPMARCH',
    type: 'Fixed USD',
    value: '$10.00 (Shipping)',
    minSpend: '$30.00',
    usedCount: 290,
    limit: 1000,
    validUntil: 'Mar 31, 2025',
    isActive: true,
  },
];

export default function AdminVouchersPage() {
  const [coupons, setCoupons] = useState<PromoCoupon[]>(DEFAULT_COUPONS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newValue, setNewValue] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleAdd = () => {
    if (!newCode.trim()) return;
    const cp: PromoCoupon = {
      id: `cp-${Date.now()}`,
      code: newCode.toUpperCase().trim(),
      type: 'Fixed USD',
      value: newValue || '$15.00',
      minSpend: '$30.00',
      usedCount: 0,
      limit: 100,
      validUntil: 'Dec 31, 2025',
      isActive: true,
    };
    setCoupons([cp, ...coupons]);
    setNewCode('');
    setNewValue('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Vouchers &amp; Promos
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage coupon codes, free shipping vouchers, and promotional campaigns
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-black text-white rounded-lg hover:bg-neutral-800 transition shadow-xs cursor-pointer"
        >
          <Plus size={15} />
          <span>Create New Voucher</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">VOUCHER CODE</th>
                <th className="py-3.5 px-4">TYPE &amp; VALUE</th>
                <th className="py-3.5 px-4">MINIMUM SPEND</th>
                <th className="py-3.5 px-4">USAGE</th>
                <th className="py-3.5 px-4">VALID UNTIL</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((cp) => (
                <tr key={cp.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-gray-950 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                        {cp.code}
                      </span>
                      <button
                        onClick={() => copyCode(cp.code)}
                        className="text-gray-400 hover:text-black transition cursor-pointer"
                        title="Copy Code"
                      >
                        {copiedCode === cp.code ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-gray-900">{cp.value}</p>
                    <p className="text-[11px] text-gray-400">{cp.type}</p>
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-medium">{cp.minSpend}</td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-gray-900">{cp.usedCount}</span>
                    <span className="text-gray-400"> / {cp.limit} times</span>
                  </td>
                  <td className="py-4 px-4 text-gray-600 font-medium">{cp.validUntil}</td>
                  <td className="py-4 px-4">
                    <span className="inline-block bg-black text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setCoupons(coupons.filter((c) => c.id !== cp.id))}
                      className="p-1.5 text-gray-400 hover:text-rose-600 transition cursor-pointer"
                      title="Delete Voucher"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900">Create New Voucher</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Promo Code (Uppercase)
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LADRIMMEGA20"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs font-mono uppercase focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Discount Value
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. 15% or $20.00"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 cursor-pointer"
              >
                Save &amp; Publish Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
