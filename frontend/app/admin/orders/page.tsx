'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Clock,
  Package,
  Printer,
  X,
  Copy,
  Check,
  ShieldCheck,
  Scissors,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerInitials: string;
  customerContact: string;
  productTitle: string;
  productSummary: string;
  paymentMethod: string;
  totalPrice: number;
  status: 'Needs Processing' | 'Completed' | 'Shipped' | 'Pending Payment' | 'Cancelled';
  country?: string;
}

interface OrderLabelDetail {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  courier: string;
  courierService: string;
  trackingNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPrice: number;
  items: Array<{
    name: string;
    sku: string;
    size: string;
    color: string;
    qty: number;
    weight: string;
  }>;
  customerNote?: string;
}

const DEFAULT_ORDERS: OrderItem[] = [
  {
    id: 'ord-10874',
    orderNumber: '#ORD-10874',
    customerName: 'Dimas Anggara',
    customerInitials: 'DA',
    customerContact: 'dimas.anggara@gmail.com',
    productTitle: 'LADRIM Heavyweight Tee',
    productSummary: '1 item • SKU: LDR-TEE-BLK-M',
    paymentMethod: 'Credit Card',
    totalPrice: 344.0,
    status: 'Needs Processing',
  },
  {
    id: 'ord-1041fd',
    orderNumber: '#ORD-1041FD',
    customerName: 'Amanda Manopo',
    customerInitials: 'AM',
    customerContact: 'amanda.m@gmail.com',
    productTitle: 'LADRIM Heavyweight Tee',
    productSummary: '1 item • SKU: LDR-TEE-BLK-M',
    paymentMethod: 'Credit Card',
    totalPrice: 752.0,
    status: 'Completed',
  },
  {
    id: 'ord-10126',
    orderNumber: '#ORD-10126',
    customerName: 'Reza Rahadian',
    customerInitials: 'RR',
    customerContact: 'reza.rahadian@gmail.com',
    productTitle: 'LADRIM Heavyweight Tee',
    productSummary: '1 item • SKU: LDR-TEE-BLK-M',
    paymentMethod: 'Apple Pay',
    totalPrice: 563.0,
    status: 'Shipped',
  },
  {
    id: 'ord-10946c',
    orderNumber: '#ORD-10946C',
    customerName: 'Siti Nurhaliza',
    customerInitials: 'SN',
    customerContact: 'siti.nurhaliza@gmail.com',
    productTitle: 'LADRIM Heavyweight Tee',
    productSummary: '1 item • SKU: LDR-TEE-BLK-M',
    paymentMethod: 'Credit Card',
    totalPrice: 414.0,
    status: 'Needs Processing',
  },
  {
    id: 'ord-106f71',
    orderNumber: '#ORD-106F71',
    customerName: 'Budi Santoso',
    customerInitials: 'BS',
    customerContact: 'budi.santoso@gmail.com',
    productTitle: 'LADRIM Heavyweight Tee',
    productSummary: '1 item • SKU: LDR-TEE-BLK-M',
    paymentMethod: 'Bank Transfer',
    totalPrice: 184.0,
    status: 'Pending Payment',
  },
  {
    id: 'ord-10f68b',
    orderNumber: '#ORD-10F68B',
    customerName: 'Guest Customer',
    customerInitials: 'GC',
    customerContact: 'guest@ladrim.com',
    productTitle: 'LADRIM Capsule Edition',
    productSummary: '1 item • SKU: LAD-ITEM-01',
    paymentMethod: 'PayPal',
    totalPrice: 59.5,
    status: 'Needs Processing',
  },
  {
    id: 'ord-031284',
    orderNumber: '#ORD-031284',
    customerName: 'Dimas Hendrawan',
    customerInitials: 'DH',
    customerContact: 'dimas.h@gmail.com',
    productTitle: 'Oversized Heavy Tee',
    productSummary: '2 items • Special Request',
    paymentMethod: 'Credit Card',
    totalPrice: 65.0,
    status: 'Needs Processing',
  },
  {
    id: 'ord-031283',
    orderNumber: '#ORD-031283',
    customerName: 'Siti Aisyah',
    customerInitials: 'SA',
    customerContact: 'siti.aisyah@gmail.com',
    productTitle: 'Canvas Tote + Cardholder',
    productSummary: '2 items • Standard Bundle',
    paymentMethod: 'Bank Transfer',
    totalPrice: 48.0,
    status: 'Needs Processing',
  },
];

// Rich shipping label details for each seed / order
const ORDER_LABEL_MAP: Record<string, OrderLabelDetail> = {
  'ord-10874': {
    id: 'ord-10874',
    orderNumber: '#ORD-10874',
    date: '28 Oct 2026',
    time: '06:16 WIB',
    recipientName: 'Dimas Anggara',
    recipientPhone: '0821-3344-5566',
    address: 'Jl. Kaliurang KM 5, Gang Manggis No. 12, Caturtunggal, Depok',
    city: 'Kab. Sleman',
    province: 'D.I. Yogyakarta',
    postalCode: '55281',
    courier: 'SICEPAT',
    courierService: 'REGULER (1-2 HARI)',
    trackingNumber: '004455667788',
    paymentMethod: 'Credit Card',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 344.0,
    items: [
      {
        name: 'LADRIM Heavyweight Tee',
        sku: 'LDR-TEE-BLK-M',
        size: 'M',
        color: 'Onyx Black',
        qty: 1,
        weight: '280 gr',
      },
    ],
    customerNote: 'Tolong titip di pos security jika rumah sedang kosong.',
  },
  'ord-1041fd': {
    id: 'ord-1041fd',
    orderNumber: '#ORD-1041FD',
    date: '28 Oct 2026',
    time: '06:16 WIB',
    recipientName: 'Amanda Manopo',
    recipientPhone: '0878-5566-7788',
    address: 'Jl. Pemuda No. 88, Pandansari, Semarang Tengah',
    city: 'Kota Semarang',
    province: 'Jawa Tengah',
    postalCode: '50132',
    courier: 'ANTERAJA',
    courierService: 'REGULAR SERVICE',
    trackingNumber: 'ANT1029384756',
    paymentMethod: 'Credit Card',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 752.0,
    items: [
      {
        name: 'LADRIM Heavyweight Tee',
        sku: 'LDR-TEE-BLK-M',
        size: 'M',
        color: 'Onyx Black',
        qty: 2,
        weight: '560 gr',
      },
    ],
  },
  'ord-10126': {
    id: 'ord-10126',
    orderNumber: '#ORD-10126',
    date: '28 Oct 2026',
    time: '06:16 WIB',
    recipientName: 'Reza Rahadian',
    recipientPhone: '0857-1122-3344',
    address: 'Apartemen Sudirman Tower A Lt 15, Jl. Jend. Sudirman Kav. 21',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '10220',
    courier: 'J&T EXPRESS',
    courierService: 'EZ REGULAR',
    trackingNumber: 'JT98217364501',
    paymentMethod: 'Apple Pay',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 563.0,
    items: [
      {
        name: 'LADRIM Heavyweight Tee',
        sku: 'LDR-TEE-WHT-L',
        size: 'L',
        color: 'Bone White',
        qty: 1,
        weight: '290 gr',
      },
    ],
  },
  'ord-10946c': {
    id: 'ord-10946c',
    orderNumber: '#ORD-10946C',
    date: '28 Oct 2026',
    time: '06:16 WIB',
    recipientName: 'Siti Nurhaliza',
    recipientPhone: '0812-9876-5432',
    address: 'Jl. Dago Asri No. 12, Dago, Coblong',
    city: 'Kota Bandung',
    province: 'Jawa Barat',
    postalCode: '40135',
    courier: 'SICEPAT',
    courierService: 'BEST NEXT DAY',
    trackingNumber: '002918847261',
    paymentMethod: 'Credit Card',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 414.0,
    items: [
      {
        name: 'LADRIM Heavyweight Tee',
        sku: 'LDR-TEE-BLK-S',
        size: 'S',
        color: 'Onyx Black',
        qty: 1,
        weight: '270 gr',
      },
    ],
  },
  'ord-106f71': {
    id: 'ord-106f71',
    orderNumber: '#ORD-106F71',
    date: '28 Oct 2026',
    time: '06:16 WIB',
    recipientName: 'Budi Santoso',
    recipientPhone: '0812-3456-7890',
    address: 'Jl. Merdeka No. 45, Selong, Kebayoran Baru',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12160',
    courier: 'JNE',
    courierService: 'REGULER',
    trackingNumber: 'JNE9918273645',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 184.0,
    items: [
      {
        name: 'LADRIM Heavyweight Tee',
        sku: 'LDR-TEE-GRY-M',
        size: 'M',
        color: 'Heather Gray',
        qty: 1,
        weight: '280 gr',
      },
    ],
  },
  'ord-10f68b': {
    id: 'ord-10f68b',
    orderNumber: '#ORD-10F68B',
    date: '26 Oct 2026',
    time: '20:34 WIB',
    recipientName: 'Guest Customer (Dani Setiawan)',
    recipientPhone: '0812-1697-3665',
    address: 'Jalan Terusan Cipatik No. 7, Soreang',
    city: 'Kab. Bandung',
    province: 'Jawa Barat',
    postalCode: '40912',
    courier: 'STANDARD',
    courierService: 'STANDARD COURIER',
    trackingNumber: 'LDRM-TRK-717140',
    paymentMethod: 'PayPal',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 59.5,
    items: [
      {
        name: 'LADRIM Capsule Edition',
        sku: 'LAD-ITEM-01',
        size: 'OS',
        color: 'Black / Silver',
        qty: 1,
        weight: '190 gr',
      },
    ],
  },
  'ord-031284': {
    id: 'ord-031284',
    orderNumber: '#ORD-031284',
    date: '10 Mar 2026',
    time: '13:42 WIB',
    recipientName: 'Dimas Hendrawan',
    recipientPhone: '0813-7766-5544',
    address: 'Jl. Tebet Barat Dalam VII No. 19, Tebet',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12810',
    courier: 'DHL EXPRESS',
    courierService: 'DOMESTIC EXPRESS',
    trackingNumber: 'DHL019482188',
    paymentMethod: 'Credit Card',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 65.0,
    items: [
      {
        name: 'Oversized Heavy Tee',
        sku: 'LDR-OVZ-TEE-02',
        size: 'L',
        color: 'Washed Black',
        qty: 2,
        weight: '580 gr',
      },
    ],
  },
  'ord-031283': {
    id: 'ord-031283',
    orderNumber: '#ORD-031283',
    date: '10 Mar 2026',
    time: '12:15 WIB',
    recipientName: 'Siti Aisyah',
    recipientPhone: '0852-9988-7766',
    address: 'Jl. Riau No. 54, Cihapit, Bandung Wetan',
    city: 'Kota Bandung',
    province: 'Jawa Barat',
    postalCode: '40114',
    courier: 'FEDEX',
    courierService: 'PRIORITY OVERNIGHT',
    trackingNumber: 'FDX0042918817',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 48.0,
    items: [
      {
        name: 'Canvas Tote + Cardholder Bundle',
        sku: 'LDR-BND-01',
        size: 'One Size',
        color: 'Natural Ecru',
        qty: 2,
        weight: '420 gr',
      },
    ],
  },
};

// Generates a clean realistic barcode visual with alternating bar patterns
function RealisticBarcode({ code }: { code: string }) {
  const bars: { w: number; s: number }[] = [];
  for (let i = 0; i < code.length; i++) {
    const val = code.charCodeAt(i);
    bars.push({
      w: (val % 3 === 0 ? 3 : val % 2 === 0 ? 2 : 1),
      s: (val % 4 === 0 ? 2 : 1),
    });
  }
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-stretch justify-center h-11 overflow-hidden w-full px-2 max-w-[260px]">
        {bars.map((b, idx) => (
          <React.Fragment key={idx}>
            <div
              style={{ width: `${b.w}px` }}
              className="bg-black shrink-0 h-full"
            />
            <div
              style={{ width: `${b.s}px` }}
              className="bg-white shrink-0 h-full"
            />
          </React.Fragment>
        ))}
      </div>
      <p className="font-mono text-[10px] font-bold tracking-widest text-black mt-1 uppercase">
        *{code}*
      </p>
    </div>
  );
}

// Reusable Physical Shipping Label Card Component (100x150mm format)
function ShippingLabelCard({ label }: { label: OrderLabelDetail }) {
  return (
    <div
      id={`shipping-label-paper-${label.id}`}
      className="shipping-label-paper bg-white text-black font-sans border-2 border-black shadow-sm rounded-xs p-3 select-none print:shadow-none print:border-2 print:border-black print:m-0 print:w-full print:max-w-[100mm]"
      style={{ width: '100%', maxWidth: '370px' }}
    >
      {/* HEADER: BRAND + COURIER BADGE */}
      <div className="flex items-stretch justify-between border-b-2 border-black pb-2">
        <div className="flex flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-xs bg-black text-white flex items-center justify-center font-black text-[11px]">
              L
            </div>
            <span className="font-black text-sm tracking-wider text-black">
              LADRIM
            </span>
          </div>
          <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-600 mt-0.5">
            Official Shipping Label
          </p>
        </div>

        {/* Courier Box */}
        <div className="border-2 border-black px-2 py-0.5 rounded-xs flex flex-col items-center justify-center text-center bg-neutral-50 min-w-[105px]">
          <span className="font-black text-xs sm:text-sm tracking-tight uppercase leading-none">
            {label.courier}
          </span>
          <span className="text-[8px] font-bold tracking-wider text-neutral-700 uppercase mt-0.5">
            {label.country && label.country.toLowerCase() !== 'indonesia'
              ? `INTL • ${label.country.toUpperCase()}`
              : label.courierService}
          </span>
        </div>
      </div>

      {/* BARCODE & TRACKING NUMBER SECTION */}
      <div className="py-2 border-b-2 border-black flex flex-col items-center justify-center bg-white">
        <RealisticBarcode code={label.trackingNumber} />
        <div className="flex items-center justify-between w-full mt-1 pt-1 border-t border-dashed border-neutral-300 text-[9px] px-1 font-mono">
          <span>
            Resi: <strong className="text-black">{label.trackingNumber}</strong>
          </span>
          <span>
            Order: <strong className="text-black">{label.orderNumber}</strong>
          </span>
        </div>
      </div>

      {/* SENDER & RECIPIENT GRID */}
      <div className="border-b-2 border-black grid grid-cols-1 divide-y-2 sm:divide-y-0 sm:grid-cols-12 sm:divide-x-2 divide-black">
        {/* PENERIMA (TO) */}
        <div className="sm:col-span-7 p-2 bg-white">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[8px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-xs">
              PENERIMA (TO)
            </span>
            <span className="text-[8px] font-bold text-neutral-500 font-mono">
              {label.postalCode}
            </span>
          </div>

          <p className="font-black text-xs text-black leading-tight mt-1">
            {label.recipientName}
          </p>
          <p className="font-bold text-[10px] text-neutral-900 mt-0.5 font-mono">
            {label.recipientPhone}
          </p>
          <p className="text-[9px] font-medium text-neutral-800 leading-snug mt-1">
            {label.address}
          </p>
          <p className="text-[9px] font-bold text-black mt-0.5 uppercase">
            {label.city ? `${label.city}, ` : ''}{label.province ? `${label.province}, ` : ''}{label.country ? `${label.country.toUpperCase()} ` : ''}{label.postalCode}
          </p>
          {label.country && label.country.toLowerCase() !== 'indonesia' && (
            <div className="mt-1 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-black text-white text-[8px] font-bold uppercase tracking-wider">
              <span>✈️ Intl: {label.country}</span>
            </div>
          )}
        </div>

        {/* PENGIRIM (FROM) */}
        <div className="sm:col-span-5 p-2 bg-neutral-50/60 flex flex-col justify-between">
          <div>
            <span className="text-[8px] font-black uppercase tracking-wider text-neutral-500 block mb-0.5">
              PENGIRIM (FROM)
            </span>
            <p className="font-bold text-[10px] text-black leading-tight">
              LADRIM Official Hub
            </p>
            <p className="font-semibold text-[8px] text-neutral-700 mt-0.5 font-mono">
              +62 811-9876-5432
            </p>
            <p className="text-[8px] text-neutral-600 mt-0.5 leading-tight">
              Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan 12190
            </p>
          </div>

          <div className="mt-1 pt-0.5 border-t border-dashed border-neutral-300 flex items-center gap-1 text-[8px] font-bold text-neutral-600">
            <ShieldCheck size={10} className="text-black shrink-0" />
            <span>Verified Fulfillment</span>
          </div>
        </div>
      </div>

      {/* SHIPPING PARAMS ROW (NON-COD / BERAT / ONGKIR) */}
      <div className="border-b-2 border-black grid grid-cols-3 divide-x-2 divide-black text-center text-xs">
        <div className="p-1 bg-neutral-900 text-white flex flex-col justify-center items-center">
          <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-300">
            PEMBAYARAN
          </span>
          <span className="font-black text-[10px] sm:text-[11px] tracking-tight text-white mt-0.5">
            {label.paymentStatus}
          </span>
        </div>

        <div className="p-1 bg-white flex flex-col justify-center items-center">
          <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-500">
            BERAT
          </span>
          <span className="font-bold text-[10px] sm:text-[11px] text-black mt-0.5">
            {label.items[0]?.weight || '0.28 kg'}
          </span>
        </div>

        <div className="p-1 bg-white flex flex-col justify-center items-center">
          <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-500">
            METODE
          </span>
          <span className="font-bold text-[10px] sm:text-[11px] text-black mt-0.5 truncate max-w-[80px]">
            {label.paymentMethod}
          </span>
        </div>
      </div>

      {/* PACKING SLIP / DAFTAR ISI PAKET */}
      <div className="p-2 border-b-2 border-black bg-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] font-black uppercase tracking-wider text-neutral-900">
            DAFTAR ISI PAKET (PACKING SLIP)
          </span>
          <span className="text-[8px] font-bold text-neutral-500">
            Total: {label.items.reduce((acc, i) => acc + i.qty, 0)} Item
          </span>
        </div>

        <table className="w-full text-left text-[9px] border-collapse border border-neutral-300">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-[8px] uppercase text-neutral-700">
              <th className="py-0.5 px-1 border-r border-neutral-300">No</th>
              <th className="py-0.5 px-1 border-r border-neutral-300">Nama Produk</th>
              <th className="py-0.5 px-1 border-r border-neutral-300">SKU / Varian</th>
              <th className="py-0.5 px-1 text-center">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {label.items.map((item, index) => (
              <tr key={index} className="text-black">
                <td className="py-0.5 px-1 border-r border-neutral-300 font-bold text-center text-[8px]">
                  {index + 1}
                </td>
                <td className="py-0.5 px-1 border-r border-neutral-300 font-semibold leading-tight text-[9px]">
                  {item.name}
                </td>
                <td className="py-0.5 px-1 border-r border-neutral-300 font-mono text-[8px] text-neutral-700 leading-tight">
                  {item.sku}
                  <span className="block text-[7px] text-neutral-500 font-sans">
                    {item.color} • Size {item.size}
                  </span>
                </td>
                <td className="py-0.5 px-1 font-bold text-center text-[9px]">
                  {item.qty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {label.customerNote && (
          <div className="mt-1 bg-neutral-50 border border-neutral-300 p-1 rounded text-[8px] text-neutral-800">
            <span className="font-bold">Instruksi: </span>
            <span>{label.customerNote}</span>
          </div>
        )}
      </div>

      {/* PERFORATED CUT LINE (TEAR OFF RECEIPT) */}
      <div className="relative py-1 flex items-center justify-between text-[8px] font-bold text-neutral-400">
        <div className="flex-1 border-t-2 border-dashed border-neutral-400" />
        <span className="px-1.5 flex items-center gap-1 font-mono uppercase bg-white text-[8px]">
          <Scissors size={9} className="rotate-90 text-neutral-500" />
          Potong Di Sini (Resi Penjual / Arsip Toko)
        </span>
        <div className="flex-1 border-t-2 border-dashed border-neutral-400" />
      </div>

      {/* BOTTOM RECEIPT (RESI ARSIP TOKO) */}
      <div className="pt-0.5 flex items-start justify-between gap-2 text-[8px]">
        <div>
          <p className="font-bold text-black uppercase">
            {label.orderNumber} • {label.courier}
          </p>
          <p className="text-neutral-600 text-[8px] mt-0.5">
            Penerima: <strong className="text-black">{label.recipientName}</strong> ({label.recipientPhone})
          </p>
          <p className="text-neutral-500 text-[8px] mt-0.5">
            Waktu Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-right shrink-0 border border-neutral-300 px-1 py-0.5 rounded text-[8px] text-neutral-600">
          <span>Paraf Kurir:</span>
          <div className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>(DEFAULT_ORDERS);
  const [activeTab, setActiveTab] = useState<string>('All Orders');

  // Single order modal state
  const [activeLabel, setActiveLabel] = useState<OrderLabelDetail | null>(null);
  // Bulk order print modal state
  const [bulkLabels, setBulkLabels] = useState<OrderLabelDetail[] | null>(null);
  // Checked order IDs for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Format price helper (handles both USD and IDR thousand scaled inputs)
  const formatPrice = (val: number) => {
    const num = val >= 10000 ? val / 1000 : val;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLabel(null);
        setBulkLabels(null);
      }
    };
    if (activeLabel || bulkLabels) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLabel, bulkLabels]);

  // Sync with API if dynamic orders exist
  useEffect(() => {
    apiFetch('/api/admin/orders')
      .then((res: any) => {
        if (res?.orders && Array.isArray(res.orders) && res.orders.length > 0) {
          const apiOrders: OrderItem[] = res.orders.map((o: any) => {
            let status: OrderItem['status'] = 'Needs Processing';
            if (o.status === 'completed') status = 'Completed';
            else if (o.status === 'shipped') status = 'Shipped';
            else if (o.status === 'pending') status = 'Pending Payment';
            else if (o.status === 'cancelled') status = 'Cancelled';
            else if (o.status === 'processing') status = 'Needs Processing';

            const name = o.customer_name || 'LADRIM Customer';
            const initials = name
              .split(' ')
              .map((w: string) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            const firstItem = o.items?.[0];
            const productTitle = firstItem?.product_name
              ? firstItem.product_name.replace('Oversized ', '')
              : (o.shipping_address?.items?.[0]?.name || 'LADRIM Heavyweight Tee');
            const sku = firstItem?.sku || 'LDR-TEE-BLK-M';

            // Clean total price: IDR thousands normalized to USD numbers
            const rawTotal = Number(o.total || 0);
            const totalPrice = rawTotal >= 10000 ? Math.round(rawTotal / 1000) : rawTotal;

            // Payment method: use shipping_address.paymentMethod when available, fall back to Credit Card for legacy orders
            const paymentMethod = o.shipping_address?.paymentMethod || 'Credit Card';

            const orderNumber = `#ORD-${o.id.slice(-6).toUpperCase()}`;
            const shipCountry = o.shipping_address?.country || 'Indonesia';

            return {
              id: o.id,
              orderNumber,
              customerName: name,
              customerInitials: initials,
              customerContact: o.customer_email || o.phone || 'South Jakarta',
              productTitle,
              productSummary: `${o.items?.length || 1} item • SKU: ${sku}`,
              paymentMethod,
              totalPrice,
              status,
              country: shipCountry,
            };
          });

          setOrders(apiOrders);
        }
      })
      .catch(() => {});
  }, []);

  // Filter orders by tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'All Orders') return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  // Dynamic stat computations
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.totalPrice, 0);
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts = { all: orders.length, needsProcessing: 0, shipped: 0, pendingPayment: 0, completed: 0, cancelled: 0 };
    for (const o of orders) {
      if (o.status === 'Needs Processing') counts.needsProcessing++;
      else if (o.status === 'Shipped') counts.shipped++;
      else if (o.status === 'Pending Payment') counts.pendingPayment++;
      else if (o.status === 'Completed') counts.completed++;
      else if (o.status === 'Cancelled') counts.cancelled++;
    }
    return counts;
  }, [orders]);

  // Checkbox Selection Logic
  const isAllSelected = useMemo(() => {
    if (filteredOrders.length === 0) return false;
    return filteredOrders.every((o) => selectedIds.includes(o.id));
  }, [filteredOrders, selectedIds]);

  const isSomeSelected = useMemo(() => {
    return filteredOrders.some((o) => selectedIds.includes(o.id)) && !isAllSelected;
  }, [filteredOrders, selectedIds, isAllSelected]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      const filteredSet = new Set(filteredOrders.map((o) => o.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const newIds = Array.from(new Set([...selectedIds, ...filteredOrders.map((o) => o.id)]));
      setSelectedIds(newIds);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Helper to resolve OrderLabelDetail for any order item
  const getOrderLabelDetail = (ord: OrderItem): OrderLabelDetail => {
    const found = ORDER_LABEL_MAP[ord.id] || ORDER_LABEL_MAP[ord.id.toLowerCase()] || ORDER_LABEL_MAP[ord.orderNumber];
    if (found) return found;

    return {
      id: ord.id,
      orderNumber: ord.orderNumber,
      date: '28 Oct 2026',
      time: '06:16 WIB',
      recipientName: ord.customerName,
      recipientPhone: '0821-3344-5566',
      address: 'Jl. Kaliurang KM 5, Gang Manggis No. 12',
      city: 'Kab. Sleman',
      province: 'D.I. Yogyakarta',
      postalCode: '55281',
      courier: 'SICEPAT',
      courierService: 'REGULER (1-2 HARI)',
      trackingNumber: `004455${ord.id.replace(/-/g, '').slice(-6)}`,
      paymentMethod: ord.paymentMethod,
      paymentStatus: 'LUNAS (NON-COD)',
      totalPrice: ord.totalPrice,
      items: [
        {
          name: ord.productTitle,
          sku: 'LDR-TEE-BLK-M',
          size: 'M',
          color: 'Onyx Black',
          qty: 1,
          weight: '280 gr',
        },
      ],
      customerNote: 'Tolong titip di pos security jika rumah sedang kosong.',
    };
  };

  // Open the floating modal with single order label details
  const handleOpenLabel = (ord: OrderItem) => {
    const detail = getOrderLabelDetail(ord);
    setActiveLabel(detail);

    // If dynamic backend order, fetch latest details in background
    apiFetch(`/api/admin/orders/${ord.id}`)
      .then((res: any) => {
        if (res?.order) {
          const o = res.order;
          const ship = o.shipping_address || {};
          setActiveLabel((prev) => {
            if (!prev || prev.id !== ord.id) return prev;
            return {
              ...prev,
              recipientName: ship.recipient || o.customer_name || prev.recipientName,
              recipientPhone: ship.phone || o.phone || prev.recipientPhone,
              address: ship.address || ship.line1 || prev.address,
              city: ship.city || prev.city,
              province: ship.province || prev.province,
              postalCode: ship.postalCode || prev.postalCode,
              country: ship.country || prev.country || 'Indonesia',
              courier: (o.courier || prev.courier).replace(/\s*\(.*?\)/g, '').toUpperCase(),
              trackingNumber: o.tracking_number || prev.trackingNumber,
              items: (o.items && o.items.length > 0)
                ? o.items.map((it: any) => ({
                    name: it.product_name || prev.items[0]?.name || 'LADRIM Heavyweight Tee',
                    sku: it.sku || 'LDR-TEE-BLK-M',
                    size: it.size || 'M',
                    color: it.color || 'Onyx Black',
                    qty: it.qty || 1,
                    weight: `${it.weight_grams || 280} gr`,
                  }))
                : prev.items,
            };
          });
        }
      })
      .catch(() => {});
  };

  // Open bulk print modal for all currently checked orders
  const handleOpenBulkPrint = () => {
    const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));
    if (selectedOrders.length === 0) return;
    const labels = selectedOrders.map((ord) => getOrderLabelDetail(ord));
    setBulkLabels(labels);
  };

  const handleCopyAddress = () => {
    if (!activeLabel) return;
    const text = `Penerima: ${activeLabel.recipientName} (${activeLabel.recipientPhone})\nAlamat: ${activeLabel.address}, ${activeLabel.city}, ${activeLabel.province} ${activeLabel.postalCode}\nKurir: ${activeLabel.courier} (${activeLabel.trackingNumber})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden animate-fadeIn">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Orders List
        </h1>
      </div>

      {/* 3 STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 w-full min-w-0">
        {/* Card 1: Today's Revenue */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-neutral-500 truncate">Today's Revenue</p>
              <p className="text-2xl font-bold tracking-tight text-neutral-900 mt-1 truncate">
                {formatPrice(totalRevenue)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs flex-wrap">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5 whitespace-nowrap">
              ↑ +12.4%
            </span>
            <span className="text-neutral-400 whitespace-nowrap">vs. yesterday</span>
          </div>
        </div>

        {/* Card 2: Needs Processing */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-neutral-500 truncate">Needs Processing</p>
              <p className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">{statusCounts.needsProcessing}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs flex-wrap">
            <span className="bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
              Action required
            </span>
            <span className="text-neutral-400 text-[11px] whitespace-nowrap">8 expedited</span>
          </div>
        </div>

        {/* Card 3: In Transit */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-neutral-500 truncate">In Transit</p>
              <p className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">{statusCounts.shipped}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <Package size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs flex-wrap">
            <span className="bg-neutral-100 text-neutral-700 font-semibold px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
              Active routes
            </span>
            <span className="text-neutral-400 text-[11px] whitespace-nowrap">98.2% on-time rate</span>
          </div>
        </div>
      </div>

      {/* WHITE CARD: TABS + BULK BAR + ORDERS TABLE */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-2xs overflow-hidden w-full max-w-full min-w-0">
        {/* Status Tabs Bar & Bulk Print Button */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-3 pb-2 border-b border-neutral-100 gap-4 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none">
            {[
              { label: 'All Orders', count: String(statusCounts.all) },
              { label: 'Needs Processing', count: String(statusCounts.needsProcessing), color: 'amber' },
              { label: 'Shipped', count: String(statusCounts.shipped) },
              { label: 'Pending Payment', count: String(statusCounts.pendingPayment) },
              { label: 'Completed', count: String(statusCounts.completed) },
              { label: 'Cancelled', count: statusCounts.cancelled > 0 ? String(statusCounts.cancelled) : undefined },
            ].map((tab) => {
              const isActive = activeTab === tab.label;
              return (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  className={`relative pb-2.5 text-xs font-semibold cursor-pointer transition whitespace-nowrap flex items-center ${
                    isActive
                      ? 'text-neutral-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count && (
                    <span
                      className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        tab.color === 'amber'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bulk Print Action Button in Toolbar */}
          <div className="flex items-center gap-2 shrink-0 py-1">
            <button
              type="button"
              onClick={handleOpenBulkPrint}
              disabled={selectedIds.length === 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                selectedIds.length > 0
                  ? 'bg-black text-white hover:bg-neutral-800 shadow-xs active:scale-95'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
              }`}
              title={
                selectedIds.length > 0
                  ? `Cetak Sekaligus (${selectedIds.length} Pesanan)`
                  : 'Centang checkbox pada pesanan untuk cetak sekaligus'
              }
            >
              <Printer
                size={13}
                className={selectedIds.length > 0 ? 'text-white' : 'text-neutral-400'}
              />
              <span>Cetak Sekaligus</span>
              {selectedIds.length > 0 && (
                <span className="bg-emerald-500 text-black px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {selectedIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Selected Orders Notification Banner */}
        {selectedIds.length > 0 && (
          <div className="bg-neutral-900 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between border-t border-neutral-800 animate-fadeIn text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">
                {selectedIds.length} pesanan dipilih
              </span>
              <span className="text-neutral-500">•</span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Batalkan pilihan
              </button>
            </div>
            <button
              type="button"
              onClick={handleOpenBulkPrint}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            >
              <Printer size={13} />
              <span>Print Sekaligus ({selectedIds.length})</span>
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-white">
                {/* 0. Checkbox (Select All) */}
                <th className="py-3 pl-4 pr-2 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer accent-black"
                    title={isAllSelected ? 'Batalkan pilihan semua' : 'Pilih semua'}
                  />
                </th>
                <th className="py-3 px-3 sm:px-4">PRODUCT</th>
                <th className="py-3 px-3 sm:px-4">ORDER ID</th>
                <th className="py-3 px-3 sm:px-4">CONTACT</th>
                <th className="py-3 px-3 sm:px-4">PAYMENT</th>
                <th className="py-3 px-3 sm:px-4">STATUS</th>
                <th className="py-3 px-3 sm:px-4">TOTAL</th>
                <th className="py-3 px-3 sm:px-4 text-center pr-4 sm:pr-6">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100/80">
              {filteredOrders.map((ord) => {
                const isChecked = selectedIds.includes(ord.id);
                return (
                  <tr
                    key={ord.id}
                    onClick={() => handleOpenLabel(ord)}
                    className={`hover:bg-neutral-50/80 transition-colors cursor-pointer group ${
                      isChecked ? 'bg-neutral-50/80' : ''
                    }`}
                  >
                    {/* 0. Row Checkbox */}
                    <td
                      className="py-3.5 pl-4 pr-2 align-top text-center"
                      onClick={(e) => handleToggleSelect(ord.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer accent-black mt-0.5"
                      />
                    </td>

                    {/* 1. Product */}
                    <td className="py-3.5 px-3 sm:px-4 align-top min-w-[140px]">
                      <p className="font-bold text-neutral-900 text-xs leading-snug group-hover:text-black">
                        {ord.productTitle}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        {ord.productSummary}
                      </p>
                    </td>

                    {/* 2. Order ID (Pure text, click row/id to preview) */}
                    <td className="py-3.5 px-3 sm:px-4 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-neutral-900 text-xs group-hover:underline text-left font-mono">
                          {ord.orderNumber}
                        </span>
                        {ord.country && ord.country.toLowerCase() !== 'indonesia' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-950 text-white tracking-wider">
                            ✈️ {ord.country}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Contact */}
                    <td className="py-3.5 px-3 sm:px-4 align-top whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {ord.customerInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 text-xs truncate max-w-[130px]">
                            {ord.customerName}
                          </p>
                          <p className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-[130px]">
                            {ord.customerContact}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 4. Payment */}
                    <td className="py-3.5 px-3 sm:px-4 align-top whitespace-nowrap">
                      <span className="inline-block bg-neutral-100/90 text-neutral-700 text-[11px] font-semibold px-2.5 py-0.5 rounded">
                        {ord.paymentMethod}
                      </span>
                    </td>

                    {/* 5. Status */}
                    <td className="py-3.5 px-3 sm:px-4 align-top whitespace-nowrap">
                      {ord.status === 'Needs Processing' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-amber-50/80 border border-amber-200/60 text-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Needs Processing</span>
                        </span>
                      )}
                      {ord.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50/80 border border-emerald-200/60 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Completed</span>
                        </span>
                      )}
                      {ord.status === 'Shipped' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-blue-50/80 border border-blue-200/60 text-blue-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>Shipped</span>
                        </span>
                      )}
                      {ord.status === 'Pending Payment' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 border border-neutral-200/80 text-neutral-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                          <span>Pending Payment</span>
                        </span>
                      )}
                      {ord.status === 'Cancelled' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200/60 text-rose-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Cancelled</span>
                        </span>
                      )}
                    </td>

                    {/* 6. Total */}
                    <td className="py-3.5 px-3 sm:px-4 align-top whitespace-nowrap">
                      <p className="font-bold text-neutral-900 text-xs">
                        {formatPrice(ord.totalPrice)}
                      </p>
                    </td>

                    {/* 7. ACTION (Paling Kanan - Tombol Print Satu Persatu) */}
                    <td className="py-3.5 px-3 sm:px-4 align-top text-center whitespace-nowrap pr-4 sm:pr-6">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLabel(ord);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-black hover:text-white hover:border-black text-neutral-700 text-xs font-semibold transition cursor-pointer shadow-2xs group/btn active:scale-95"
                        title={`Cetak Label ${ord.orderNumber}`}
                      >
                        <Printer
                          size={13}
                          className="text-neutral-500 group-hover/btn:text-white transition"
                        />
                        <span className="text-[11px]">Print</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING SINGLE LABEL MODAL (CETAK SATU PERSATU) */}
      {activeLabel && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex justify-center items-start p-3 sm:p-5 no-print-bg animate-fadeIn select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveLabel(null);
          }}
        >
          {/* FLOATING CARD CONTAINER: Fixed max-width, never cut off from top */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden flex flex-col my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-150"
            style={{ width: '100%', maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* STICKY TOP BAR: High-contrast, unmissable, contains prominent X button */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-neutral-900 text-white shadow-sm no-print">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-xs sm:text-sm text-white tracking-tight truncate">
                  Label Paket
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  {activeLabel.orderNumber}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Salin Alamat */}
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-neutral-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Salin Alamat Lengkap"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Printer size={12} />
                  <span>Cetak</span>
                </button>

                {/* X BUTTON (BUAT KELUAR) - VERY CLEAR AND PROMINENT */}
                <button
                  type="button"
                  onClick={() => setActiveLabel(null)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer ml-1 active:scale-90"
                  title="Tutup / Keluar (Esc)"
                  aria-label="Tutup"
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Modal Body / Realistic Paper Shipping Label */}
            <div className="p-3 bg-neutral-200/70 flex justify-center overflow-y-auto max-h-[75vh]">
              <ShippingLabelCard label={activeLabel} />
            </div>

            {/* MODAL BOTTOM FOOTER: Quick Close and Print buttons */}
            <div className="px-4 py-2 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between no-print">
              <button
                type="button"
                onClick={() => setActiveLabel(null)}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <X size={13} />
                <span>Tutup</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Printer size={13} />
                <span>Cetak Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BULK PRINT MODAL (CETAK SEKALIGUS) */}
      {bulkLabels && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex justify-center items-start p-3 sm:p-5 no-print-bg animate-fadeIn select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBulkLabels(null);
          }}
        >
          {/* FLOATING CARD CONTAINER: Sized for comfortable multi-label review */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden flex flex-col my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-150"
            style={{ width: '100%', maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* STICKY TOP BAR */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-neutral-900 text-white shadow-sm no-print">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-xs sm:text-sm text-white tracking-tight truncate">
                  Cetak Sekaligus
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  {bulkLabels.length} Paket
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Print All Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Printer size={12} />
                  <span>Cetak Semua ({bulkLabels.length})</span>
                </button>

                {/* X BUTTON (BUAT KELUAR) */}
                <button
                  type="button"
                  onClick={() => setBulkLabels(null)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer ml-1 active:scale-90"
                  title="Tutup / Keluar (Esc)"
                  aria-label="Tutup"
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Modal Body / Multi-Label Paper List */}
            <div className="p-3 bg-neutral-200/70 overflow-y-auto max-h-[75vh] space-y-4">
              {bulkLabels.map((lbl, idx) => (
                <div key={lbl.id} className="bulk-label-item">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 mb-1 px-1 no-print">
                    <span>Label {idx + 1} dari {bulkLabels.length}</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-neutral-800 border border-neutral-300 text-[10px]">
                      {lbl.orderNumber} • {lbl.courier}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <ShippingLabelCard label={lbl} />
                  </div>
                </div>
              ))}
            </div>

            {/* MODAL BOTTOM FOOTER */}
            <div className="px-4 py-2 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between no-print">
              <button
                type="button"
                onClick={() => setBulkLabels(null)}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <X size={13} />
                <span>Tutup</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Printer size={13} />
                <span>Cetak Semua ({bulkLabels.length} Label)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY CSS RULES (Supports single and multi-page bulk label printing) */}
      <style jsx global>{`
        @media print {
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          aside,
          header,
          nav,
          .no-print,
          .no-print-bg,
          button,
          a {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .bulk-label-item {
            page-break-after: always !important;
            break-after: page !important;
          }
          .shipping-label-paper {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
