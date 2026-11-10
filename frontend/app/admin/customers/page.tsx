'use client';

import React, { useState } from 'react';
import { Users, Search, Download, Mail, Phone, MapPin } from 'lucide-react';

const CUSTOMERS = [
  {
    id: 'c-1',
    name: 'Bambang Pamungkas',
    initials: 'BP',
    email: 'bambang@gmail.com',
    phone: '+62 812-9842-1102',
    city: 'South Jakarta',
    ordersCount: 8,
    totalSpent: '$430.00',
    joinedDate: 'Jan 12, 2024',
    tier: 'VIP Gold',
  },
  {
    id: 'c-2',
    name: 'Siti Amelia',
    initials: 'SA',
    email: 'siti.a@yahoo.com',
    phone: '+62 856-9182-4491',
    city: 'Bandung',
    ordersCount: 5,
    totalSpent: '$255.00',
    joinedDate: 'Feb 04, 2024',
    tier: 'Member',
  },
  {
    id: 'c-3',
    name: 'Dimas Kusuma',
    initials: 'DK',
    email: 'dimas.k@outlook.com',
    phone: '+62 812-3499-1022',
    city: 'Surabaya',
    ordersCount: 12,
    totalSpent: '$980.00',
    joinedDate: 'Nov 18, 2023',
    tier: 'VIP Platinum',
  },
  {
    id: 'c-4',
    name: 'Rina Novita',
    initials: 'RN',
    email: 'rina.nov@icloud.com',
    phone: '+62 813-7729-1884',
    city: 'Tangerang',
    ordersCount: 3,
    totalSpent: '$130.00',
    joinedDate: 'May 28, 2024',
    tier: 'Member',
  },
  {
    id: 'c-5',
    name: 'Hendra Fadhil',
    initials: 'HF',
    email: 'hendra.f@gmail.com',
    phone: '+62 811-2394-0911',
    city: 'Yogyakarta',
    ordersCount: 4,
    totalSpent: '$195.00',
    joinedDate: 'Aug 15, 2024',
    tier: 'Member',
  },
];

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');

  const filtered = CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Customers
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Customer profile directory, order history, and membership tiers
          </p>
        </div>

        <button
          onClick={() => alert('Customer data exported successfully.')}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-800 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
        >
          <Download size={14} />
          <span>Export Customer Data</span>
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-2xs flex items-center gap-3">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or city..."
          className="w-full text-xs text-gray-900 bg-transparent focus:outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">CUSTOMER</th>
                <th className="py-3.5 px-4">CONTACT &amp; CITY</th>
                <th className="py-3.5 px-4">TOTAL ORDERS</th>
                <th className="py-3.5 px-4">TOTAL SPENT</th>
                <th className="py-3.5 px-4">TIER</th>
                <th className="py-3.5 px-4">JOINED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.initials}
                      </div>
                      <div>
                        <p className="font-bold text-gray-950">{c.name}</p>
                        <p className="text-[11px] text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">
                    <p className="font-medium">{c.phone}</p>
                    <p className="text-[11px] text-gray-400">{c.city}</p>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    {c.ordersCount} Orders
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-950">{c.totalSpent}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block bg-black text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {c.tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{c.joinedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
