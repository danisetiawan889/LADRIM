'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingBag, Plus, Minus, RotateCcw, Check, Sparkles, Layers } from 'lucide-react';

export interface BulkMatrixColor {
  name: string;
  hex?: string;
}

export interface BulkMatrixItem {
  color: string;
  size: string;
  qty: number;
  price: number;
  image?: string;
}

export interface BulkVariantOrderMatrixProps {
  productName?: string;
  /**
   * Daftar warna yang tersedia (bisa berupa string[] atau { name, hex }[])
   */
  colors: (BulkMatrixColor | string)[];
  /**
   * Daftar ukuran yang tersedia, contoh: ['XS', 'S', 'M', 'L', 'XL']
   */
  sizes: string[];
  /**
   * Spesifikasi 1: Objek yang memetakan nama warna ke URL gambar model baju
   * Contoh: { 'Hitam': 'url_foto_model_baju_hitam.jpg', 'Sand': 'url_foto_model_sand.jpg' }
   */
  color_images: Record<string, string>;
  /**
   * Harga satuan per item (base price)
   */
  basePrice: number;
  currencySymbol?: string;
  /**
   * Matriks stok opsional: { [color]: { [size]: stockCount } }
   */
  stockMatrix?: Record<string, Record<string, number>>;
  /**
   * Warna yang saat ini aktif di pratinjau utama
   */
  activeColorName?: string;
  /**
   * Spesifikasi 2: Callback saat gambar/baris warna diklik atau di-hover,
   * untuk mengubah gambar pratinjau utama produk di sebelah kiri halaman
   */
  onActiveImageChange?: (imageUrl: string, colorName: string) => void;
  /**
   * Callback ketika user menekan tombol "Add to Cart" untuk semua varian terisi
   */
  onAddToCart?: (items: BulkMatrixItem[]) => void;
  className?: string;
}

export default function BulkVariantOrderMatrix({
  productName = 'Product',
  colors,
  sizes,
  color_images,
  basePrice,
  currencySymbol = '$',
  stockMatrix,
  activeColorName,
  onActiveImageChange,
  onAddToCart,
  className = '',
}: BulkVariantOrderMatrixProps) {
  // Normalisasi daftar warna menjadi objek { name, hex }
  const normalizedColors = useMemo<BulkMatrixColor[]>(() => {
    return colors.map((c) => {
      if (typeof c === 'string') {
        return { name: c, hex: '#111111' };
      }
      return c;
    });
  }, [colors]);

  // State untuk menyimpan kuantitas pemesanan: { [colorName]: { [size]: number } }
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Update kuantitas per sel (warna + ukuran)
  const handleQtyChange = (colorName: string, size: string, newQty: number) => {
    const validQty = Math.max(0, Math.floor(newQty || 0));
    setQuantities((prev) => ({
      ...prev,
      [colorName]: {
        ...(prev[colorName] || {}),
        [size]: validQty,
      },
    }));
  };

  // Tambah / kurangi kuantitas dengan tombol stepper (+ / -)
  const handleStepQty = (colorName: string, size: string, delta: number) => {
    const current = quantities[colorName]?.[size] || 0;
    handleQtyChange(colorName, size, current + delta);
  };

  // Cepat isi 1 baris warna (contoh: isi 1 pcs untuk semua ukuran di warna tersebut)
  const handleFillRow = (colorName: string, qtyPerSize: number = 1) => {
    setQuantities((prev) => {
      const rowState = { ...(prev[colorName] || {}) };
      sizes.forEach((s) => {
        rowState[s] = qtyPerSize;
      });
      return { ...prev, [colorName]: rowState };
    });
  };

  // Reset baris warna tertentu
  const handleResetRow = (colorName: string) => {
    setQuantities((prev) => ({
      ...prev,
      [colorName]: {},
    }));
  };

  // Reset semua input kuantitas di matriks
  const handleResetAll = () => {
    setQuantities({});
  };

  // Trigger pratinjau gambar model di kiri saat di-hover atau diklik
  const handlePreviewColor = (colorName: string) => {
    const imageUrl = color_images[colorName];
    if (imageUrl && onActiveImageChange) {
      onActiveImageChange(imageUrl, colorName);
    }
  };

  // Hitung total kuantitas & subtotal harga per baris warna
  const rowCalculations = useMemo(() => {
    const result: Record<string, { totalQty: number; subtotal: number }> = {};
    normalizedColors.forEach((color) => {
      const colorRow = quantities[color.name] || {};
      const rowQty = Object.values(colorRow).reduce((acc, val) => acc + (val || 0), 0);
      result[color.name] = {
        totalQty: rowQty,
        subtotal: rowQty * basePrice,
      };
    });
    return result;
  }, [normalizedColors, quantities, basePrice]);

  // Hitung total keseluruhan pesanan bulk
  const overallSummary = useMemo(() => {
    let totalPieces = 0;
    const selectedItems: BulkMatrixItem[] = [];

    normalizedColors.forEach((color) => {
      const colorRow = quantities[color.name] || {};
      sizes.forEach((size) => {
        const qty = colorRow[size] || 0;
        if (qty > 0) {
          totalPieces += qty;
          selectedItems.push({
            color: color.name,
            size,
            qty,
            price: basePrice,
            image: color_images[color.name],
          });
        }
      });
    });

    return {
      totalPieces,
      totalAmount: totalPieces * basePrice,
      selectedItems,
    };
  }, [normalizedColors, sizes, quantities, basePrice, color_images]);

  // Submit bulk order ke cart
  const handleSubmitBulk = () => {
    if (overallSummary.selectedItems.length === 0) return;
    if (onAddToCart) {
      onAddToCart(overallSummary.selectedItems);
    }
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2500);
  };

  return (
    <div className={`w-full rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden ${className}`}>
      {/* Header Info Matriks */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-neutral-50/70 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
            <Layers size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
              Bulk Variant Order Matrix
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-black/5 px-2 py-0.5 text-[10px] font-normal text-neutral-600">
                <Sparkles size={11} className="text-amber-600" /> Gymshark Style
              </span>
            </h3>
            <p className="text-xs text-neutral-500">
              Select order quantities across colors and sizes simultaneously in one table.
            </p>
          </div>
        </div>

        {overallSummary.totalPieces > 0 && (
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-rose-600 transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Tabel Matriks Responsif */}
      <div className="relative overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-black/10 bg-neutral-100/70 text-[11px] uppercase tracking-wider text-neutral-600">
              {/* Kolom 1: Warna & Model (Sticky horizontal untuk tablet/mobile) */}
              <th
                scope="col"
                className="sticky left-0 z-20 bg-neutral-100/95 backdrop-blur-sm py-3.5 pl-4 pr-3 sm:pl-6 w-[220px] font-semibold text-ink"
              >
                Color &amp; Variant
              </th>

              {/* Kolom Ukuran (Sizes) */}
              {sizes.map((size) => (
                <th
                  key={size}
                  scope="col"
                  className="py-3.5 px-2.5 text-center font-semibold text-ink w-[88px]"
                >
                  {size}
                </th>
              ))}

              {/* Kolom Subtotal Baris */}
              <th
                scope="col"
                className="py-3.5 pr-4 pl-3 sm:pr-6 text-right font-semibold text-ink w-[120px]"
              >
                Subtotal
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black/5">
            {normalizedColors.map((color) => {
              const modelImageUrl = color_images[color.name] || 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=300&q=80';
              const isCurrentActive = activeColorName === color.name || hoveredColor === color.name;
              const rowCalc = rowCalculations[color.name] || { totalQty: 0, subtotal: 0 };

              return (
                <tr
                  key={color.name}
                  onMouseEnter={() => {
                    setHoveredColor(color.name);
                    handlePreviewColor(color.name);
                  }}
                  onMouseLeave={() => setHoveredColor(null)}
                  onClick={() => handlePreviewColor(color.name)}
                  className={`group transition-colors cursor-pointer ${
                    isCurrentActive ? 'bg-neutral-50/90' : 'hover:bg-neutral-50/50'
                  }`}
                >
                  {/* Kolom Pertama: Thumbnail Model Baju (50x50 px) + Info Warna */}
                  <td
                    className={`sticky left-0 z-10 py-3 pl-4 pr-3 sm:pl-6 transition-colors ${
                      isCurrentActive
                        ? 'bg-neutral-50/95 backdrop-blur-sm shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]'
                        : 'bg-white group-hover:bg-neutral-50/95'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Thumbnail Model Baju (50x50px proporsional) */}
                      <div
                        className={`relative h-[50px] w-[50px] shrink-0 overflow-hidden rounded-md border bg-neutral-100 transition-all duration-200 ${
                          isCurrentActive
                            ? 'border-ink ring-2 ring-ink/20 shadow-sm'
                            : 'border-black/15 group-hover:border-black/40'
                        }`}
                      >
                        <img
                          src={modelImageUrl}
                          alt={`Model baju warna ${color.name}`}
                          width={50}
                          height={50}
                          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>

                      {/* Detail Nama Warna & Dot */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          {color.hex && (
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/20"
                              style={{ backgroundColor: color.hex }}
                              aria-hidden="true"
                            />
                          )}
                          <span className="font-semibold text-ink text-xs truncate max-w-[110px]">
                            {color.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 group-hover:text-neutral-600 transition-colors">
                          {isCurrentActive ? 'Sedang dilihat' : 'Hover/klik pratinjau'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Input Kuantitas per Ukuran */}
                  {sizes.map((size) => {
                    const currentQty = quantities[color.name]?.[size] || 0;
                    const stock = stockMatrix?.[color.name]?.[size];
                    const isOutOfStock = stock !== undefined && stock <= 0;

                    return (
                      <td key={size} className="py-2.5 px-1.5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-center">
                          {isOutOfStock ? (
                            <span className="inline-block rounded bg-neutral-100 px-2 py-1 text-[10px] font-medium text-neutral-400">
                              Habis
                            </span>
                          ) : (
                            <div className="flex items-center rounded border border-black/15 bg-white shadow-xs focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
                              {/* Tombol Kurang (-) */}
                              <button
                                type="button"
                                disabled={currentQty <= 0}
                                onClick={() => handleStepQty(color.name, size, -1)}
                                className="flex h-7 w-6 items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                aria-label={`Kurangi 1 ${color.name} ${size}`}
                              >
                                <Minus size={11} />
                              </button>

                              {/* Input Angka Kuantitas */}
                              <input
                                type="number"
                                min={0}
                                max={stock ?? 9999}
                                value={currentQty === 0 ? '' : currentQty}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                  handleQtyChange(color.name, size, isNaN(val) ? 0 : val);
                                }}
                                className="h-7 w-8 text-center text-xs font-semibold text-ink bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />

                              {/* Tombol Tambah (+) */}
                              <button
                                type="button"
                                disabled={stock !== undefined && currentQty >= stock}
                                onClick={() => handleStepQty(color.name, size, 1)}
                                className="flex h-7 w-6 items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                aria-label={`Tambah 1 ${color.name} ${size}`}
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Subtotal per Baris Warna */}
                  <td className="py-3 pr-4 pl-3 sm:pr-6 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end">
                      <span className={`font-semibold text-xs ${rowCalc.totalQty > 0 ? 'text-ink' : 'text-neutral-400'}`}>
                        {currencySymbol}
                        {rowCalc.subtotal.toLocaleString('en-US')}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {rowCalc.totalQty} pcs
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Ringkasan Bulk & Tombol Add to Bag */}
      <div className="border-t border-black/10 bg-neutral-50 px-4 py-3.5 sm:px-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Ringkasan Jumlah */}
          <div className="flex items-center gap-6">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                Total Pcs
              </span>
              <span className="text-base font-bold text-ink">
                {overallSummary.totalPieces}{' '}
                <span className="text-xs font-normal text-neutral-600">item</span>
              </span>
            </div>

            <div className="h-8 w-px bg-black/10" aria-hidden="true" />

            <div>
              <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                Total Estimasi
              </span>
              <span className="text-base font-bold text-ink">
                {currencySymbol}
                {overallSummary.totalAmount.toLocaleString('en-US')}
              </span>
            </div>
          </div>

          {/* Action Button: Add Bulk Items to Bag */}
          <button
            type="button"
            disabled={overallSummary.totalPieces === 0}
            onClick={handleSubmitBulk}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-sm ${
              overallSummary.totalPieces > 0
                ? isSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ink text-white hover:bg-neutral-800 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSuccess ? (
              <>
                <Check size={16} />
                <span>{overallSummary.totalPieces} Items Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} />
                <span>
                  {overallSummary.totalPieces > 0
                    ? `Add Bulk Order (${overallSummary.totalPieces} Pcs) — ${currencySymbol}${overallSummary.totalAmount.toLocaleString('en-US')}`
                    : 'Select Quantities in Matrix'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
