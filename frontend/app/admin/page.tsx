'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Download,
  ShoppingCart,
  Package,
  UserPlus,
  ChevronDown,
  RefreshCw,
  Wallet,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [revenueTab, setRevenueTab] = useState<'week' | 'month' | 'year'>('week');
  const [isExporting, setIsExporting] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Store summary successfully exported to Excel/CSV.');
    }, 800);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Store Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTimeMenu(!showTimeMenu)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
            >
              <Calendar size={14} className="text-gray-500" />
              <span>{timeRange}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {showTimeMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                {['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'This Year'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setTimeRange(opt);
                      setShowTimeMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-gray-50 font-medium cursor-pointer ${
                      timeRange === opt ? 'text-black font-bold bg-gray-50' : 'text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-black text-white rounded-lg hover:bg-neutral-800 transition active:scale-[0.99] disabled:opacity-60 shadow-xs cursor-pointer"
          >
            {isExporting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* 4 STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Stat 1: Total Revenue */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-medium">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-gray-950">
            $148,850.00
          </p>
        </div>

        {/* Stat 2: Total Orders */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-medium">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-gray-950">1,240</span>
            <span className="text-xs text-gray-500 font-medium">Orders</span>
          </div>
        </div>

        {/* Stat 3: Items Sold */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-medium">Items Sold</span>
            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
              <Package size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-gray-950">3,490</span>
            <span className="text-xs text-gray-500 font-medium">Units</span>
          </div>
        </div>

        {/* Stat 4: New Customers */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-medium">New Customers</span>
            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
              <UserPlus size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-gray-950">382</span>
            <span className="text-xs text-gray-500 font-medium">Users</span>
          </div>
        </div>
      </div>

      {/* Card: Sales & Revenue Trends */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-base text-gray-900">
              Sales & Revenue Trends
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Comparison between actual sales volume and weekly targets
            </p>
          </div>

          {/* Range Toggle Buttons */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setRevenueTab('week')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                revenueTab === 'week'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setRevenueTab('month')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                revenueTab === 'month'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setRevenueTab('year')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                revenueTab === 'year'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              This Year
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-3.5">
            <p className="text-[11px] font-medium text-gray-500">Daily Average</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">$21.2K</p>
          </div>
          <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-3.5">
            <p className="text-[11px] font-medium text-gray-500">Peak Day (Saturday)</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">$34.8K</p>
          </div>
          <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-3.5">
            <p className="text-[11px] font-medium text-gray-500">Target Achievement</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">104.2%</p>
          </div>
        </div>

        {/* Interactive SVG Chart */}
        <div className="relative pt-6 pb-2">
          {/* Pinned Saturday Tooltip */}
          <div className="absolute right-[17%] top-0 z-10 -translate-x-1/2 flex flex-col items-center">
            <div className="bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap text-center">
              <span className="block text-[10px] text-gray-300 font-normal">SATURDAY, MAY 18</span>
              <span>$34,800.00</span>
            </div>
            <div className="w-2 h-2 bg-black rotate-45 -mt-1" />
          </div>

          {/* Chart SVG */}
          <div className="w-full h-56 relative">
            <svg
              viewBox="0 0 700 220"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              <line x1="0" y1="20" x2="700" y2="20" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="0" y1="80" x2="700" y2="80" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="0" y1="140" x2="700" y2="140" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="0" y1="200" x2="700" y2="200" stroke="#e5e7eb" strokeWidth="1" />

              {/* Benchmark Target Curve (dashed gray) */}
              <path
                d="M 20 180 C 120 170, 200 160, 300 175 C 400 190, 500 160, 680 140"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Area fill for actual revenue */}
              <path
                d="M 20 195 C 100 185, 180 135, 270 145 C 360 155, 450 145, 520 85 C 570 30, 600 35, 680 90 L 680 200 L 20 200 Z"
                fill="url(#revenueGradient)"
              />

              {/* Actual Revenue Curve (solid black) */}
              <path
                d="M 20 195 C 100 185, 180 135, 270 145 C 360 155, 450 145, 520 85 C 570 30, 600 35, 680 90"
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
              />

              {/* Peak Point on Saturday */}
              <circle cx="580" cy="38" r="5" fill="#111827" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          {/* X-Axis Day Labels */}
          <div className="flex justify-between text-xs text-gray-500 font-medium px-2 pt-3 border-t border-gray-100">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="font-bold text-gray-900">Sat</span>
            <span>Sun</span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-5 text-xs text-gray-600 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-black" />
              <span>Actual Revenue (2024)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t-2 border-dashed border-gray-400" />
              <span>Benchmark Target</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
