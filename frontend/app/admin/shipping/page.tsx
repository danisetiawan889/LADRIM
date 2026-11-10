'use client';

import React, { useState } from 'react';
import { Truck, CheckCircle2, MapPin, Search, ExternalLink, RefreshCw } from 'lucide-react';

const COURIERS = [
  { name: 'DHL Express', code: 'dhl', active: true, services: 'Express Worldwide', avgTime: '2-5 Days' },
  { name: 'FedEx Express', code: 'fedex', active: true, services: 'Priority, Standard', avgTime: '1-3 Days' },
  { name: 'J&T Express', code: 'jnt', active: true, services: 'EZ, Super', avgTime: '1-3 Days' },
  { name: 'JNE Express', code: 'jne', active: true, services: 'Reguler, YES, OKE', avgTime: '1-3 Days' },
  { name: 'SiCepat Ekspres', code: 'sicepat', active: true, services: 'BEST, REG', avgTime: '1-2 Days' },
  { name: 'Instant Courier', code: 'instant', active: true, services: 'Instant & Same Day', avgTime: '3-6 Hours' },
];

export default function AdminShippingPage() {
  const [courierList, setCourierList] = useState(COURIERS);

  const toggleCourier = (code: string) => {
    setCourierList((prev) =>
      prev.map((c) => (c.code === code ? { ...c, active: !c.active } : c))
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Shipping &amp; Logistics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure shipping carriers, tracking gateway, and origin fulfillment warehouse
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
            Logistics Gateway Connected
          </span>
        </div>
      </div>

      {/* ORIGIN WAREHOUSE CARD */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">LADRIM Main Distribution Warehouse</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Jl. Metro Pondok Indah Blok TB No. 12, Kebayoran Lama, Jakarta Selatan 12310
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Warehouse settings form')}
          className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-800 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
        >
          Change Origin Location
        </button>
      </div>

      {/* COURIER PARTNERS TABLE */}
      <div className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900">Active Courier Partners</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">COURIER</th>
                <th className="py-3.5 px-4">API CODE</th>
                <th className="py-3.5 px-4">SUPPORTED SERVICES</th>
                <th className="py-3.5 px-4">ESTIMATED DELIVERY</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courierList.map((c) => (
                <tr key={c.code} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-4 font-bold text-gray-950 flex items-center gap-2">
                    <Truck size={15} className="text-gray-500" />
                    <span>{c.name}</span>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px] text-gray-400 font-semibold uppercase">
                    {c.code}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-medium">{c.services}</td>
                  <td className="py-4 px-4 text-gray-600">{c.avgTime}</td>
                  <td className="py-4 px-4">
                    {c.active ? (
                      <span className="inline-block bg-black text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => toggleCourier(c.code)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition shadow-2xs cursor-pointer ${
                        c.active
                          ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          : 'bg-black text-white hover:bg-neutral-800'
                      }`}
                    >
                      {c.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
