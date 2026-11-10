'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Calendar,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpRight,
  ShoppingCart,
  Receipt,
  Ticket,
  Truck,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  FileCode,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('Financial Summary');
  const [activeChannel, setActiveChannel] = useState('All Channels');
  const [selectedFormat, setSelectedFormat] = useState<'XLSX' | 'PDF' | 'CSV'>('XLSX');
  const [isGenerating, setIsGenerating] = useState(false);

  // Column export checkboxes state
  const [exportColumns, setExportColumns] = useState({
    txId: true,
    channel: true,
    skuDesc: true,
    gmv: true,
    hpp: true,
    discount: true,
    merchantFee: true,
    shippingStatus: true,
  });

  const selectAllColumns = (val: boolean) => {
    setExportColumns({
      txId: val,
      channel: val,
      skuDesc: val,
      gmv: val,
      hpp: val,
      discount: val,
      merchantFee: val,
      shippingStatus: val,
    });
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert(`${selectedFormat} report generated successfully and download has started.`);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Sales Reports &amp; Analytics
          </h1>
        </div>

        <div>
          <button
            onClick={() => handleGenerateReport()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-black text-white rounded-lg hover:bg-neutral-800 transition active:scale-[0.99] shadow-xs cursor-pointer"
          >
            <Download size={14} />
            <span>Download Report (Excel / PDF)</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
          {[
            'Financial Summary',
            'Best-Selling Products',
            'Logistics & Shipping',
            'Taxes & Platform Fees',
          ].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs font-semibold whitespace-nowrap transition cursor-pointer relative ${
                  isActive
                    ? 'text-black border-b-2 border-black font-bold'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200/90 rounded-xl p-3 shadow-2xs">
        {/* Left: Date Period Dropdown */}
        <div className="relative">
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition shadow-2xs cursor-pointer">
            <Calendar size={13} className="text-gray-500" />
            <span className="text-gray-400 font-normal uppercase text-[10px]">REPORT PERIOD:</span>
            <span>This Month (Mar 1 - Mar 31, 2025)</span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>
        </div>

        {/* Channels & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {['All Channels', 'Online Store', 'Marketplace Sync', 'Retail'].map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeChannel === ch
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {ch}
            </button>
          ))}

          <button
            onClick={() => alert('Advanced parameters filter')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal size={13} />
            <span>Advanced Parameters</span>
          </button>

          <button
            onClick={() => alert('Report data re-synchronized.')}
            className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 shadow-2xs cursor-pointer"
            title="Reload Data"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* 4 STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Gross Merch. Value */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500">
              GROSS MERCH. VALUE
            </span>
            <Receipt size={16} className="text-gray-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-gray-950">
            $312,450.00
          </p>
          <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
            <ArrowUpRight size={14} />
            <span>+14.2% vs previous month</span>
          </p>
        </div>

        {/* Card 2: Net Profit */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500">
              NET PROFIT
            </span>
            <Receipt size={16} className="text-gray-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-gray-950">
            $94,200.00
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="text-gray-500">Net Margin:</span>
            <span className="bg-gray-100 text-gray-800 font-semibold px-2 py-0.5 rounded text-[11px]">
              30.1% Net
            </span>
          </div>
        </div>

        {/* Card 3: Average Order Value */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500">
              AVERAGE ORDER VALUE
            </span>
            <ShoppingCart size={16} className="text-gray-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-gray-950">
            $251.90
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight size={14} /> +3.8%
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">1,240 Total Transactions</span>
          </div>
        </div>

        {/* Card 4: Discounts & Promos */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500">
              DISCOUNTS &amp; PROMOS
            </span>
            <Ticket size={16} className="text-gray-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-gray-950">
            $14,800.00
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Share: <strong className="text-gray-900">5.2%</strong> of turnover
          </p>
        </div>
      </div>

      {/* MIDDLE CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Chart (8 cols): Daily Sales Trend & Order Volume */}
        <div className="lg:col-span-8 bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-base text-gray-900">
                Daily Sales Trend &amp; Order Volume
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Correlation between gross transaction value and order volume
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-600 font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-gray-300 rounded-xs" />
                <span>Daily GMV</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-black" />
                <div className="w-2 h-2 rounded-full border border-black bg-white -ml-2" />
                <span>Order Count</span>
              </div>
            </div>
          </div>

          {/* SVG Bar & Line Combo Chart */}
          <div className="w-full h-64 relative pt-4 pb-2">
            <svg viewBox="0 0 700 240" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Horizontal Grid */}
              <line x1="20" y1="30" x2="680" y2="30" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="20" y1="90" x2="680" y2="90" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="20" y1="150" x2="680" y2="150" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="20" y1="210" x2="680" y2="210" stroke="#e5e7eb" strokeWidth="1" />

              {/* GMV Daily Bars */}
              <rect x="40" y="140" width="16" height="70" rx="2" fill="#e5e7eb" />
              <rect x="62" y="130" width="16" height="80" rx="2" fill="#e5e7eb" />
              <rect x="84" y="145" width="16" height="65" rx="2" fill="#e5e7eb" />
              <rect x="150" y="120" width="16" height="90" rx="2" fill="#e5e7eb" />
              <rect x="172" y="135" width="16" height="75" rx="2" fill="#e5e7eb" />
              <rect x="194" y="110" width="16" height="100" rx="2" fill="#e5e7eb" />
              <rect x="260" y="130" width="16" height="80" rx="2" fill="#e5e7eb" />
              <rect x="282" y="125" width="16" height="85" rx="2" fill="#e5e7eb" />
              <rect x="360" y="115" width="16" height="95" rx="2" fill="#e5e7eb" />
              <rect x="382" y="105" width="16" height="105" rx="2" fill="#e5e7eb" />
              <rect x="450" y="30" width="18" height="180" rx="2" fill="#111827" />
              <rect x="474" y="95" width="16" height="115" rx="2" fill="#e5e7eb" />
              <rect x="540" y="130" width="16" height="80" rx="2" fill="#e5e7eb" />
              <rect x="562" y="120" width="16" height="90" rx="2" fill="#e5e7eb" />
              <rect x="584" y="110" width="16" height="100" rx="2" fill="#e5e7eb" />

              {/* Order Count Connected Line */}
              <polyline
                points="
                  50,150 
                  160,115 
                  270,165 
                  370,105 
                  460,35 
                  550,120 
                  600,100
                "
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Circle Points on line */}
              <circle cx="50" cy="150" r="4.5" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
              <circle cx="160" cy="115" r="4.5" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
              <circle cx="270" cy="165" r="4.5" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
              <circle cx="370" cy="105" r="4.5" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
              <circle cx="460" cy="35" r="5.5" fill="#ffffff" stroke="#111827" strokeWidth="3" />
              <circle cx="550" cy="120" r="4.5" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
              <circle cx="600" cy="100" r="4.5" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between text-xs text-gray-500 font-medium px-4 pt-2 border-t border-gray-100">
            <span>Mar 01</span>
            <span>Mar 08</span>
            <span>Mar 12</span>
            <span>Mar 18</span>
            <span className="font-bold text-gray-900">Mar 24 [Peak Spike]</span>
            <span>Mar 31</span>
          </div>
        </div>

        {/* Right Card (4 cols): Methods & Logistics */}
        <div className="lg:col-span-4 bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900">Methods &amp; Logistics</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Payment gateway and logistics share distribution
              </p>
            </div>
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">
              PORTFOLIO
            </span>
          </div>

          {/* Payment Gateway Breakdown Progress Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-gray-800">Credit / Debit Cards</span>
                <span className="text-gray-950">54.2% ($169.3K)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full" style={{ width: '54.2%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-gray-800">Bank Transfer / VA</span>
                <span className="text-gray-950">32.6% ($101.8K)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 rounded-full" style={{ width: '32.6%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-gray-800">Digital Wallets</span>
                <span className="text-gray-950">13.2% ($41.3K)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: '13.2%' }} />
              </div>
            </div>
          </div>

          {/* Shipping Highlights Box */}
          <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-medium">
                <Truck size={14} />
                <span>TOTAL SHIPPING BILLED</span>
              </div>
              <p className="text-xl font-bold text-gray-950 mt-1">$18,640.00</p>
            </div>
            <span className="bg-white border border-gray-200 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold shadow-2xs">
              98.4% On-Time
            </span>
          </div>
        </div>
      </div>

      {/* TOP 5 REVENUE CONTRIBUTORS TABLE */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-gray-900">
              Top 5 Revenue Contributors
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              SKUs with highest turnover and gross profit margins
            </p>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-semibold text-gray-700 hover:text-black flex items-center gap-1"
          >
            <span>View All Products (184)</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="pb-3">PRODUCT INFO</th>
                <th className="pb-3">CATEGORY</th>
                <th className="pb-3 text-right">UNITS SOLD</th>
                <th className="pb-3 text-right">TOTAL REVENUE</th>
                <th className="pb-3 text-right">PROFIT MARGIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                {
                  name: 'Nexus Precision Wireless Keyboard',
                  sku: 'SKU-NX-0941',
                  category: 'Hardware & Peripherals',
                  sold: '342 pcs',
                  omzet: '$64,980.00',
                  margin: '38.4%',
                  image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=100&q=80',
                },
                {
                  name: 'Artisan Minimalist Desk Pad (Large)',
                  sku: 'SKU-NX-0312',
                  category: 'Workspace Accessories',
                  sold: '418 pcs',
                  omzet: '$52,250.00',
                  margin: '44.1%',
                  image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=100&q=80',
                },
                {
                  name: 'Acoustic Clarity Studio Monitors',
                  sku: 'SKU-NX-1045',
                  category: 'Audio Gear',
                  sold: '96 pcs',
                  omzet: '$48,000.00',
                  margin: '28.5%',
                  image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=100&q=80',
                },
                {
                  name: 'Aluminium Dual Monitor Riser',
                  sku: 'SKU-NX-0582',
                  category: 'Workspace Ergonomics',
                  sold: '112 pcs',
                  omzet: '$39,200.00',
                  margin: '32.0%',
                  image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=100&q=80',
                },
                {
                  name: 'Braided Type-C Thunderbolt Dock Cable',
                  sku: 'SKU-NX-0021',
                  category: 'Cables & Power',
                  sold: '514 pcs',
                  omzet: '$25,700.00',
                  margin: '52.2%',
                  image: 'https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&w=100&q=80',
                },
              ].map((prod) => (
                <tr key={prod.sku} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-9 h-9 rounded-md object-cover bg-gray-100 border border-gray-200 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-gray-950">{prod.name}</p>
                        <span className="text-[11px] font-mono text-gray-400 font-medium">
                          {prod.sku}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-gray-600 font-medium">{prod.category}</td>
                  <td className="py-3.5 text-right font-medium text-gray-900">{prod.sold}</td>
                  <td className="py-3.5 text-right font-bold text-gray-950">{prod.omzet}</td>
                  <td className="py-3.5 text-right">
                    <span className="font-semibold text-gray-800 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[11px]">
                      {prod.margin}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORT EXPORT & DOWNLOAD CUSTOMIZATION */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
              <Download size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">
                Report Export &amp; Download Customization
              </h3>
              <p className="text-xs text-gray-500">
                Sync endpoint: <code className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">/reports/download</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-gray-600 uppercase">
              READY TO STREAM
            </span>
          </div>
        </div>

        {/* 2 Sub Columns: File Format & Column Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Format Selection (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
              SELECT FILE FORMAT
            </p>

            <div className="space-y-2.5">
              {[
                {
                  id: 'XLSX',
                  title: 'Spreadsheet (.XLSX)',
                  desc: 'Integrated formulas, pivot tables, and multi-sheet tabs',
                  icon: FileSpreadsheet,
                },
                {
                  id: 'PDF',
                  title: 'Financial PDF (.PDF)',
                  desc: 'Official A4 layout with digital signature & graphical summary',
                  icon: FileText,
                },
                {
                  id: 'CSV',
                  title: 'Raw Data (.CSV)',
                  desc: 'Raw rows for ingest pipelines into BI / Data Lake',
                  icon: FileCode,
                },
              ].map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                const Icon = fmt.icon;
                return (
                  <div
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id as any)}
                    className={`flex items-start justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-black bg-gray-50/70 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-950">{fmt.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{fmt.desc}</p>
                    </div>
                    <Icon size={18} className={isSelected ? 'text-black' : 'text-gray-400'} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column Checkboxes (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                SELECT DATA COLUMNS
              </p>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => selectAllColumns(true)}
                  className="text-gray-700 hover:text-black font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-gray-300">•</span>
                <button
                  onClick={() => selectAllColumns(false)}
                  className="text-gray-500 hover:text-black cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { key: 'txId', label: 'Transaction ID & Timestamp' },
                { key: 'channel', label: 'Channel & Source' },
                { key: 'skuDesc', label: 'Product SKU & Description' },
                { key: 'gmv', label: 'Gross Merchandise Value (GMV)' },
                { key: 'hpp', label: 'Cost of Goods Sold (COGS)' },
                { key: 'discount', label: 'Discounts & Promo Vouchers' },
                { key: 'merchantFee', label: 'Service & Gateway Fees' },
                { key: 'shippingStatus', label: 'Logistics & Shipping Status' },
              ].map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(exportColumns as any)[col.key]}
                    onChange={(e) =>
                      setExportColumns({
                        ...exportColumns,
                        [col.key]: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-gray-800 font-medium">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer row: File size estimate & Generate button */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            Estimated file size: <strong className="text-gray-900">~2.4 MB</strong> (1,240 records)
          </p>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition active:scale-[0.99] disabled:opacity-60 shadow-xs cursor-pointer"
          >
            {isGenerating ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>Generate &amp; Download Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
