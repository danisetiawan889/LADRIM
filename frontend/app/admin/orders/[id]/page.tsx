'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  Copy,
  Check,
  Package,
  Truck,
  ShieldCheck,
  Scissors,
  QrCode,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface OrderDetail {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: {
    recipient: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
  };
  courier: string;
  courierService: string;
  trackingNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPrice: number;
  shippingCost: number;
  items: Array<{
    name: string;
    sku: string;
    size: string;
    color: string;
    qty: number;
    price: number;
    weight: string;
  }>;
  customerNote?: string;
}

// Fallback demo data for mockup IDs & offline support
const FALLBACK_ORDERS: Record<string, OrderDetail> = {
  '5eb3d8a8-4640-470d-bf8f-202c87e08f74': {
    id: '5eb3d8a8-4640-470d-bf8f-202c87e08f74',
    orderNumber: '#ORD-10874',
    date: '28 Oct 2026',
    time: '06:16 WIB',
    customerName: 'Dimas Anggara',
    customerPhone: '0821-3344-5566',
    customerEmail: 'dimas.anggara@gmail.com',
    shippingAddress: {
      recipient: 'Dimas Anggara',
      phone: '0821-3344-5566',
      address: 'Jl. Kaliurang KM 5, Gang Manggis No. 12, Caturtunggal, Depok',
      city: 'Kab. Sleman',
      province: 'D.I. Yogyakarta',
      postalCode: '55281',
    },
    courier: 'SICEPAT',
    courierService: 'REGULER (1-2 HARI)',
    trackingNumber: '004455667788',
    paymentMethod: 'Credit Card',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 344.0,
    shippingCost: 15.0,
    items: [
      {
        name: 'LADRIM Heavyweight Oversized Tee',
        sku: 'LDR-TEE-BLK-M',
        size: 'M',
        color: 'Onyx Black',
        qty: 1,
        price: 329.0,
        weight: '280 gr',
      },
    ],
    customerNote: 'Tolong titip di pos security jika rumah sedang kosong. Terima kasih!',
  },
  'ord-10874': {
    id: 'ord-10874',
    orderNumber: '#ORD-10874',
    date: '28 Oct 2026',
    time: '06:16 WIB',
    customerName: 'Dimas Anggara',
    customerPhone: '0821-3344-5566',
    customerEmail: 'dimas.anggara@gmail.com',
    shippingAddress: {
      recipient: 'Dimas Anggara',
      phone: '0821-3344-5566',
      address: 'Jl. Kaliurang KM 5, Gang Manggis No. 12, Caturtunggal, Depok',
      city: 'Kab. Sleman',
      province: 'D.I. Yogyakarta',
      postalCode: '55281',
    },
    courier: 'SICEPAT',
    courierService: 'REGULER (1-2 HARI)',
    trackingNumber: '004455667788',
    paymentMethod: 'Credit Card',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 344.0,
    shippingCost: 15.0,
    items: [
      {
        name: 'LADRIM Heavyweight Tee',
        sku: 'LDR-TEE-BLK-M',
        size: 'M',
        color: 'Onyx Black',
        qty: 1,
        price: 329.0,
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
    customerName: 'Amanda Manopo',
    customerPhone: '0878-5566-7788',
    customerEmail: 'amanda.m@gmail.com',
    shippingAddress: {
      recipient: 'Amanda Manopo',
      phone: '0878-5566-7788',
      address: 'Jl. Pemuda No. 88, Pandansari, Semarang Tengah',
      city: 'Kota Semarang',
      province: 'Jawa Tengah',
      postalCode: '50132',
    },
    courier: 'ANTERAJA',
    courierService: 'REGULAR SERVICE',
    trackingNumber: 'ANT1029384756',
    paymentMethod: 'Credit Card',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 752.0,
    shippingCost: 18.0,
    items: [
      {
        name: 'LADRIM Heavyweight Tee',
        sku: 'LDR-TEE-BLK-M',
        size: 'M',
        color: 'Onyx Black',
        qty: 2,
        price: 367.0,
        weight: '560 gr',
      },
    ],
  },
  'ord-10126': {
    id: 'ord-10126',
    orderNumber: '#ORD-10126',
    date: '28 Oct 2026',
    time: '06:16 WIB',
    customerName: 'Reza Rahadian',
    customerPhone: '0857-1122-3344',
    customerEmail: 'reza.rahadian@gmail.com',
    shippingAddress: {
      recipient: 'Reza Rahadian',
      phone: '0857-1122-3344',
      address: 'Apartemen Sudirman Tower A Lt 15, Jl. Jend. Sudirman Kav. 21',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10220',
    },
    courier: 'J&T EXPRESS',
    courierService: 'EZ REGULAR',
    trackingNumber: 'JT98217364501',
    paymentMethod: 'Apple Pay',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 563.0,
    shippingCost: 12.0,
    items: [
      {
        name: 'LADRIM Heavyweight Tee',
        sku: 'LDR-TEE-WHT-L',
        size: 'L',
        color: 'Bone White',
        qty: 1,
        price: 551.0,
        weight: '290 gr',
      },
    ],
  },
  'ord-10946c': {
    id: 'ord-10946c',
    orderNumber: '#ORD-10946C',
    date: '28 Oct 2026',
    time: '06:16 WIB',
    customerName: 'Siti Nurhaliza',
    customerPhone: '0812-9876-5432',
    customerEmail: 'siti.nurhaliza@gmail.com',
    shippingAddress: {
      recipient: 'Siti Nurhaliza',
      phone: '0812-9876-5432',
      address: 'Jl. Dago Asri No. 12, Dago, Coblong',
      city: 'Kota Bandung',
      province: 'Jawa Barat',
      postalCode: '40135',
    },
    courier: 'SICEPAT',
    courierService: 'BEST NEXT DAY',
    trackingNumber: '002918847261',
    paymentMethod: 'Credit Card',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 414.0,
    shippingCost: 20.0,
    items: [
      {
        name: 'LADRIM Heavyweight Tee',
        sku: 'LDR-TEE-BLK-S',
        size: 'S',
        color: 'Onyx Black',
        qty: 1,
        price: 394.0,
        weight: '270 gr',
      },
    ],
  },
  'ord-106f71': {
    id: 'ord-106f71',
    orderNumber: '#ORD-106F71',
    date: '28 Oct 2026',
    time: '06:16 WIB',
    customerName: 'Budi Santoso',
    customerPhone: '0812-3456-7890',
    customerEmail: 'budi.santoso@gmail.com',
    shippingAddress: {
      recipient: 'Budi Santoso',
      phone: '0812-3456-7890',
      address: 'Jl. Merdeka No. 45, Selong, Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12160',
    },
    courier: 'JNE',
    courierService: 'REGULER',
    trackingNumber: 'JNE9918273645',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 184.0,
    shippingCost: 10.0,
    items: [
      {
        name: 'LADRIM Heavyweight Tee',
        sku: 'LDR-TEE-GRY-M',
        size: 'M',
        color: 'Heather Gray',
        qty: 1,
        price: 174.0,
        weight: '280 gr',
      },
    ],
  },
  'ord-10f68b': {
    id: 'ord-10f68b',
    orderNumber: '#ORD-10F68B',
    date: '26 Oct 2026',
    time: '20:34 WIB',
    customerName: 'Guest Customer (Dani Setiawan)',
    customerPhone: '0812-1697-3665',
    customerEmail: 'guest@ladrim.com',
    shippingAddress: {
      recipient: 'Dani Setiawan',
      phone: '0812-1697-3665',
      address: 'Jalan Terusan Cipatik No. 7, Soreang',
      city: 'Kab. Bandung',
      province: 'Jawa Barat',
      postalCode: '40912',
    },
    courier: 'STANDARD',
    courierService: 'STANDARD COURIER',
    trackingNumber: 'LDRM-TRK-717140',
    paymentMethod: 'PayPal',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 59.5,
    shippingCost: 9.5,
    items: [
      {
        name: 'LADRIM Capsule Edition',
        sku: 'LAD-ITEM-01',
        size: 'OS',
        color: 'Black / Silver',
        qty: 1,
        price: 50.0,
        weight: '190 gr',
      },
    ],
  },
  'ord-031284': {
    id: 'ord-031284',
    orderNumber: '#ORD-031284',
    date: '10 Mar 2026',
    time: '13:42 WIB',
    customerName: 'Dimas Hendrawan',
    customerPhone: '0813-7766-5544',
    customerEmail: 'dimas.h@gmail.com',
    shippingAddress: {
      recipient: 'Dimas Hendrawan',
      phone: '0813-7766-5544',
      address: 'Jl. Tebet Barat Dalam VII No. 19, Tebet',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12810',
    },
    courier: 'DHL EXPRESS',
    courierService: 'DOMESTIC EXPRESS',
    trackingNumber: 'DHL019482188',
    paymentMethod: 'Credit Card',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 65.0,
    shippingCost: 15.0,
    items: [
      {
        name: 'Oversized Heavy Tee',
        sku: 'LDR-OVZ-TEE-02',
        size: 'L',
        color: 'Washed Black',
        qty: 2,
        price: 50.0,
        weight: '580 gr',
      },
    ],
  },
  'ord-031283': {
    id: 'ord-031283',
    orderNumber: '#ORD-031283',
    date: '10 Mar 2026',
    time: '12:15 WIB',
    customerName: 'Siti Aisyah',
    customerPhone: '0852-9988-7766',
    customerEmail: 'siti.aisyah@gmail.com',
    shippingAddress: {
      recipient: 'Siti Aisyah',
      phone: '0852-9988-7766',
      address: 'Jl. Riau No. 54, Cihapit, Bandung Wetan',
      city: 'Kota Bandung',
      province: 'Jawa Barat',
      postalCode: '40114',
    },
    courier: 'FEDEX',
    courierService: 'PRIORITY OVERNIGHT',
    trackingNumber: 'FDX0042918817',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'LUNAS (NON-COD)',
    totalPrice: 48.0,
    shippingCost: 12.0,
    items: [
      {
        name: 'Canvas Tote + Cardholder Bundle',
        sku: 'LDR-BND-01',
        size: 'One Size',
        color: 'Natural Ecru',
        qty: 2,
        price: 41.0,
        weight: '420 gr',
      },
    ],
  },
};

// Generates a realistic barcode visual with varying bar patterns
function RealisticBarcode({ code }: { code: string }) {
  // Deterministic bars based on string chars
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
      <div className="flex items-stretch justify-center h-12 sm:h-14 overflow-hidden w-full px-2 max-w-[280px]">
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
      <p className="font-mono text-[11px] font-bold tracking-widest text-black mt-1 uppercase">
        *{code}*
      </p>
    </div>
  );
}

export default function OrderShippingLabelPage() {
  const params = useParams();
  const rawId = (params?.id as string) || '';
  const orderId = rawId.toLowerCase();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [copied, setCopied] = useState(false);
  const [paperFormat, setPaperFormat] = useState<'thermal' | 'a4'>('thermal');

  // Load order data from API or fallback map
  useEffect(() => {
    // Check fallback first for instant render
    let matched = FALLBACK_ORDERS[orderId] || FALLBACK_ORDERS[rawId];
    if (!matched) {
      // Find by matching partial ID
      const foundKey = Object.keys(FALLBACK_ORDERS).find(
        (k) => orderId.includes(k) || k.includes(orderId)
      );
      if (foundKey) matched = FALLBACK_ORDERS[foundKey];
    }

    if (matched) {
      setOrder(matched);
    }

    // Try fetching from backend API for dynamic orders
    apiFetch(`/api/admin/orders/${rawId}`)
      .then((res: any) => {
        if (res?.order) {
          const o = res.order;
          const ship = o.shipping_address || {};
          const rawTotal = Number(o.total || 65);
          const totalPrice = rawTotal >= 10000 ? Math.round(rawTotal / 1000) : rawTotal;

          const d = o.created_at ? new Date(o.created_at) : new Date();
          const dateStr = d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          const timeStr = d.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }) + ' WIB';

          const mapped: OrderDetail = {
            id: o.id,
            orderNumber: `#ORD-${o.id.replace(/-/g, '').slice(-6).toUpperCase()}`,
            date: dateStr,
            time: timeStr,
            customerName: o.customer_name || ship.recipient || 'LADRIM Customer',
            customerPhone: o.phone || ship.phone || '0812-3344-5566',
            customerEmail: o.customer_email || 'customer@ladrim.com',
            shippingAddress: {
              recipient: ship.recipient || o.customer_name || 'Dimas Anggara',
              phone: ship.phone || o.phone || '0821-3344-5566',
              address: ship.address || ship.addressLine1 || ship.line1 || 'Jl. Kaliurang KM 5, Sleman',
              city: ship.city || '',
              province: ship.province || '',
              postalCode: ship.postalCode || '55281',
              country: ship.country || 'Indonesia',
            },
            courier: (o.courier || 'SICEPAT').replace(/\s*\(.*?\)/g, '').toUpperCase(),
            courierService: (o.courier || 'REGULER').toUpperCase(),
            trackingNumber: o.tracking_number || `LDRM-${o.id.slice(0, 8).toUpperCase()}`,
            paymentMethod: ship.paymentMethod || 'Credit Card',
            paymentStatus: o.checkout_state === 'paid' ? 'LUNAS (NON-COD)' : 'NON-COD',
            totalPrice,
            shippingCost: Number(o.shipping_cost || 15),
            items: (o.items && o.items.length > 0)
              ? o.items.map((it: any) => ({
                  name: it.product_name || 'LADRIM Heavyweight Tee',
                  sku: it.sku || 'LDR-TEE-BLK-M',
                  size: it.size || 'M',
                  color: it.color || 'Onyx Black',
                  qty: it.qty || 1,
                  price: Number(it.unit_price ? (it.unit_price >= 10000 ? it.unit_price / 1000 : it.unit_price) : 65),
                  weight: `${it.weight_grams || 280} gr`,
                }))
              : [
                  {
                    name: 'LADRIM Heavyweight Tee',
                    sku: 'LDR-TEE-BLK-M',
                    size: 'M',
                    color: 'Onyx Black',
                    qty: 1,
                    price: totalPrice,
                    weight: '280 gr',
                  },
                ],
            customerNote: 'Tolong titip di pos security jika rumah sedang kosong.',
          };
          setOrder(mapped);
        }
      })
      .catch(() => {});
  }, [rawId, orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAddress = () => {
    if (!order) return;
    const text = `Penerima: ${order.shippingAddress.recipient} (${order.shippingAddress.phone})\nAlamat: ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.province} ${order.shippingAddress.postalCode}\nKurir: ${order.courier} (${order.trackingNumber})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const data = order || FALLBACK_ORDERS['ord-10874'];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* SCREEN CONTROLS BAR (Hidden during Print) */}
      <div className="no-print bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Back Button & Order ID */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/admin/orders"
            className="w-10 h-10 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-700 transition shrink-0 cursor-pointer"
            title="Kembali ke Daftar Pesanan"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
                Label Pengiriman &amp; Packing Slip
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Siap Cetak
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pesanan <span className="font-semibold text-neutral-800">{data.orderNumber}</span> • {data.date}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Copy Address Button */}
          <button
            onClick={handleCopyAddress}
            className="px-3.5 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Salin Alamat Lengkap"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin' : 'Salin Alamat'}</span>
          </button>

          {/* PRINT BUTTON */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Printer size={15} />
            <span>Cetak Label (Print)</span>
          </button>
        </div>
      </div>

      {/* PAPER CANVAS BACKDROP */}
      <div className="no-print-bg bg-[#ECEEF1] p-4 sm:p-8 rounded-3xl flex flex-col items-center justify-center min-h-[700px]">
        {/* PHYSICAL PAPER SHIPPING LABEL (The exact element printed) */}
        <div
          id="shipping-label-paper"
          className="shipping-label-paper bg-white text-black font-sans w-full max-w-[480px] border-2 border-neutral-900 shadow-xl rounded-sm p-4 sm:p-5 select-none print:shadow-none print:border-2 print:border-black print:m-0 print:w-full print:max-w-[100mm]"
        >
          {/* HEADER: BRAND + COURIER BADGE */}
          <div className="flex items-stretch justify-between border-b-2 border-black pb-3">
            {/* Left: Brand Logo */}
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-black text-white flex items-center justify-center font-black text-sm">
                  L
                </div>
                <span className="font-black text-lg tracking-wider text-black">
                  LADRIM
                </span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mt-1">
                Official Shipping Label
              </p>
            </div>

            {/* Right: Courier Big Box */}
            <div className="border-2 border-black px-3 py-1.5 rounded-sm flex flex-col items-center justify-center text-center bg-neutral-50 min-w-[130px]">
              <span className="font-black text-base sm:text-lg tracking-tight uppercase leading-none">
                {data.courier}
              </span>
              <span className="text-[9px] font-bold tracking-wider text-neutral-700 uppercase mt-0.5">
                {data.shippingAddress.country && data.shippingAddress.country.toLowerCase() !== 'indonesia'
                  ? `INTL • ${data.shippingAddress.country.toUpperCase()}`
                  : data.courierService}
              </span>
            </div>
          </div>

          {/* BARCODE & TRACKING NUMBER SECTION */}
          <div className="py-3 border-b-2 border-black flex flex-col items-center justify-center bg-white">
            <RealisticBarcode code={data.trackingNumber} />
            <div className="flex items-center justify-between w-full mt-1.5 pt-1.5 border-t border-dashed border-neutral-300 text-[11px] px-1 font-mono">
              <span>
                No. Resi: <strong className="text-black">{data.trackingNumber}</strong>
              </span>
              <span>
                Order: <strong className="text-black">{data.orderNumber}</strong>
              </span>
            </div>
          </div>

          {/* SENDER & RECIPIENT GRID */}
          <div className="border-b-2 border-black grid grid-cols-1 divide-y-2 sm:divide-y-0 sm:grid-cols-12 sm:divide-x-2 divide-black">
            {/* PENERIMA (TO) - Takes 7 cols */}
            <div className="sm:col-span-7 p-2.5 sm:p-3 bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-xs">
                  PENERIMA (TO)
                </span>
                <span className="text-[10px] font-bold text-neutral-500 font-mono">
                  {data.shippingAddress.postalCode}
                </span>
              </div>

              <p className="font-black text-sm text-black leading-tight mt-1">
                {data.shippingAddress.recipient}
              </p>
              <p className="font-bold text-xs text-neutral-900 mt-0.5 font-mono">
                {data.shippingAddress.phone}
              </p>
              <p className="text-[11px] font-medium text-neutral-800 leading-snug mt-1">
                {data.shippingAddress.address}
              </p>
              <p className="text-[11px] font-bold text-black mt-0.5 uppercase">
                {data.shippingAddress.city ? `${data.shippingAddress.city}, ` : ''}{data.shippingAddress.province ? `${data.shippingAddress.province}, ` : ''}{data.shippingAddress.country ? `${data.shippingAddress.country.toUpperCase()} ` : 'INDONESIA '}{data.shippingAddress.postalCode}
              </p>
              {data.shippingAddress.country && data.shippingAddress.country.toLowerCase() !== 'indonesia' && (
                <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black text-white text-[9px] font-bold uppercase tracking-wider">
                  <span>✈️ International Destination</span>
                </div>
              )}
            </div>

            {/* PENGIRIM (FROM) - Takes 5 cols */}
            <div className="sm:col-span-5 p-2.5 sm:p-3 bg-neutral-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
                  PENGIRIM (FROM)
                </span>
                <p className="font-bold text-xs text-black leading-tight">
                  LADRIM Official Hub
                </p>
                <p className="font-semibold text-[10px] text-neutral-700 mt-0.5 font-mono">
                  +62 811-9876-5432
                </p>
                <p className="text-[10px] text-neutral-600 mt-0.5 leading-tight">
                  Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan 12190
                </p>
              </div>

              {/* Verified Authentic Badge */}
              <div className="mt-2 pt-1 border-t border-dashed border-neutral-300 flex items-center gap-1 text-[9px] font-bold text-neutral-600">
                <ShieldCheck size={12} className="text-black shrink-0" />
                <span>Verified Fulfillment</span>
              </div>
            </div>
          </div>

          {/* SHIPPING PARAMS ROW (NON-COD / BERAT / ONGKIR) */}
          <div className="border-b-2 border-black grid grid-cols-3 divide-x-2 divide-black text-center text-xs">
            {/* Payment Mode Box */}
            <div className="p-2 bg-neutral-900 text-white flex flex-col justify-center items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-300">
                TIPE PEMBAYARAN
              </span>
              <span className="font-black text-xs sm:text-sm tracking-tight text-white mt-0.5">
                {data.paymentStatus}
              </span>
            </div>

            {/* Total Weight */}
            <div className="p-2 bg-white flex flex-col justify-center items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                BERAT TOTAL
              </span>
              <span className="font-bold text-xs sm:text-sm text-black mt-0.5">
                {data.items[0]?.weight || '0.28 kg'}
              </span>
            </div>

            {/* Payment Method */}
            <div className="p-2 bg-white flex flex-col justify-center items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                METODE
              </span>
              <span className="font-bold text-xs sm:text-sm text-black mt-0.5 truncate max-w-[100px]">
                {data.paymentMethod}
              </span>
            </div>
          </div>

          {/* PACKING SLIP / DAFTAR ISI PAKET */}
          <div className="p-2.5 sm:p-3 border-b-2 border-black bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-900">
                DAFTAR ISI PAKET (PACKING SLIP)
              </span>
              <span className="text-[10px] font-bold text-neutral-500">
                Total: {data.items.reduce((acc, i) => acc + i.qty, 0)} Item
              </span>
            </div>

            <table className="w-full text-left text-[11px] border-collapse border border-neutral-300">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-[9px] uppercase text-neutral-700">
                  <th className="py-1 px-1.5 border-r border-neutral-300">No</th>
                  <th className="py-1 px-1.5 border-r border-neutral-300">Nama Produk</th>
                  <th className="py-1 px-1.5 border-r border-neutral-300">SKU / Varian</th>
                  <th className="py-1 px-1.5 text-center">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {data.items.map((item, index) => (
                  <tr key={index} className="text-black">
                    <td className="py-1.5 px-1.5 border-r border-neutral-300 font-bold text-center">
                      {index + 1}
                    </td>
                    <td className="py-1.5 px-1.5 border-r border-neutral-300 font-semibold leading-tight">
                      {item.name}
                    </td>
                    <td className="py-1.5 px-1.5 border-r border-neutral-300 font-mono text-[10px] text-neutral-700 leading-tight">
                      {item.sku}
                      <span className="block text-[9px] text-neutral-500 font-sans">
                        {item.color} • Size {item.size}
                      </span>
                    </td>
                    <td className="py-1.5 px-1.5 font-bold text-center">
                      {item.qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Customer Instruction / Note */}
            {data.customerNote && (
              <div className="mt-2 bg-neutral-50 border border-neutral-300 p-1.5 rounded text-[10px] text-neutral-800">
                <span className="font-bold">Instruksi: </span>
                <span>{data.customerNote}</span>
              </div>
            )}
          </div>

          {/* PERFORATED CUT LINE (TEAR OFF RECEIPT) */}
          <div className="relative py-2 flex items-center justify-between text-[9px] font-bold text-neutral-400">
            <div className="flex-1 border-t-2 border-dashed border-neutral-400" />
            <span className="px-2 flex items-center gap-1 font-mono uppercase bg-white">
              <Scissors size={10} className="rotate-90 text-neutral-500" />
              Potong Di Sini (Resi Penjual / Arsip)
            </span>
            <div className="flex-1 border-t-2 border-dashed border-neutral-400" />
          </div>

          {/* BOTTOM RECEIPT (RESI ARSIP TOKO) */}
          <div className="pt-1 flex items-start justify-between gap-3 text-[10px]">
            <div>
              <p className="font-bold text-black uppercase">
                {data.orderNumber} • {data.courier}
              </p>
              <p className="text-neutral-600 mt-0.5">
                Penerima: <strong className="text-black">{data.shippingAddress.recipient}</strong> ({data.shippingAddress.phone})
              </p>
              <p className="text-neutral-500 text-[9px] mt-0.5">
                Waktu Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right shrink-0 border border-neutral-300 px-2 py-1 rounded text-[9px] text-neutral-600">
              <span>Paraf Petugas:</span>
              <div className="h-6 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY CSS RULES (Pure clean thermal paper label) */}
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
          /* Hide all application chrome */
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
          /* Container styling for paper */
          .shipping-label-paper {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            padding: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
