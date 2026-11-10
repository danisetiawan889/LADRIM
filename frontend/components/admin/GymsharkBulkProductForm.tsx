'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  X,
  Check,
  ArrowRight,
  Flame,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
  Tag,
  Palette,
} from 'lucide-react';
import { getColorHex } from '@/lib/catalogData';

export interface VariantRow {
  id: string;
  color: string;
  size: string;
  sku: string;
  price: number;
  stock: number;
}

interface GymsharkBulkProductFormProps {
  onSuccess?: (createdProduct: any) => void;
  onCancel?: () => void;
}

// Minimal Fashion Item Types requested by user
const PRODUCT_ITEM_TYPES = [
  'Cargo',
  'Hoodie',
  'T-Shirt',
  'Polo',
  'Jeans',
  'Jacket',
  'Pants',
  'Shorts',
  'Sweater',
  'Bag',
  'Other',
];

const PRESET_COLORS = [
  { name: 'Black', hex: '#18181b' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#71717a' },
  { name: 'Navy', hex: '#1e293b' },
  { name: 'Beige', hex: '#f5f5dc' },
  { name: 'Olive', hex: '#166534' },
  { name: 'Brown', hex: '#78350f' },
  { name: 'Burgundy', hex: '#831843' },
  { name: 'Khaki', hex: '#a3a286' },
  { name: 'Charcoal', hex: '#374151' },
];

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const getItemSubcategory = (item: string): string => {
  const i = (item || '').toLowerCase();
  if (['cargo', 'jeans', 'pants', 'shorts'].some((k) => i.includes(k))) return 'Bottoms';
  if (['jacket', 'hoodie', 'sweater'].some((k) => i.includes(k))) return 'Outerwear';
  if (['polo', 't-shirt', 'shirt'].some((k) => i.includes(k))) return 'Tops';
  if (['bag', 'backpack', 'duffel'].some((k) => i.includes(k))) return 'Bags';
  return 'Apparel';
};

export default function GymsharkBulkProductForm({ onSuccess, onCancel }: GymsharkBulkProductFormProps) {
  // Product Basic Metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Department & Simplified Item Type
  const [department, setDepartment] = useState<string>('Men');
  const [itemType, setItemType] = useState<string>('Cargo');
  const [customItemType, setCustomItemType] = useState<string>('');

  // Search Tags
  const [tagsInput, setTagsInput] = useState<string>('');

  // Homepage Feature Toggles (Trending Now & New Releases)
  const [isTrending, setIsTrending] = useState<boolean>(false);
  const [isNewRelease, setIsNewRelease] = useState<boolean>(true);

  // Comma-Separated Colors & Sizes
  const [colorsInput, setColorsInput] = useState('Black, White');
  const [sizesInput, setSizesInput] = useState('S, M, L, XL');

  // Color-grouped image state: { [colorTag: string]: string[] }
  const [colorImages, setColorImages] = useState<Record<string, string[]>>({});

  // Mass Fill Bar State (in USD) - The single, authoritative price input
  const [massPrice, setMassPrice] = useState<string>('48');
  const [massStock, setMassStock] = useState<string>('25');

  // Matrix Variant Rows State
  const [variants, setVariants] = useState<VariantRow[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Parsed Color List
  const parsedColors = useMemo(() => {
    return colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }, [colorsInput]);

  // Parsed Size List
  const parsedSizes = useMemo(() => {
    return sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [sizesInput]);

  const resolvedItemType = itemType === 'Other' ? customItemType.trim() || 'Item' : itemType;
  const subcategory = getItemSubcategory(resolvedItemType);

  // Toggle Preset Color helper
  const handleTogglePresetColor = (colorName: string) => {
    const currentList = colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const exists = currentList.some((c) => c.toLowerCase() === colorName.toLowerCase());
    let nextList: string[];
    if (exists) {
      nextList = currentList.filter((c) => c.toLowerCase() !== colorName.toLowerCase());
    } else {
      nextList = [...currentList, colorName];
    }
    setColorsInput(nextList.join(', '));
  };

  // Toggle Preset Size helper
  const handleTogglePresetSize = (sizeName: string) => {
    const currentList = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = currentList.some((s) => s.toLowerCase() === sizeName.toLowerCase());
    let nextList: string[];
    if (exists) {
      nextList = currentList.filter((s) => s.toLowerCase() !== sizeName.toLowerCase());
    } else {
      nextList = [...currentList, sizeName];
    }
    setSizesInput(nextList.join(', '));
  };

  // Reactive Matrix Generator: Synchronize rows when parsedColors or parsedSizes change
  useEffect(() => {
    if (parsedColors.length === 0 || parsedSizes.length === 0) {
      setVariants([]);
      return;
    }

    const nameSlug = (name || resolvedItemType || 'LDRM')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();

    const p = Number(massPrice) || 0;
    const s = Number(massStock) || 0;

    setVariants((prevRows) => {
      const existingMap = new Map<string, VariantRow>();
      prevRows.forEach((r) => {
        existingMap.set(`${r.color}:::${r.size}`, r);
      });

      const nextRows: VariantRow[] = [];
      parsedColors.forEach((color) => {
        const colorCode = color.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'CLR';

        parsedSizes.forEach((size) => {
          const key = `${color}:::${size}`;
          const existing = existingMap.get(key);
          const sizeCode = size.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'STD';

          if (existing) {
            nextRows.push(existing);
          } else {
            const rand = Math.floor(100 + Math.random() * 900);
            nextRows.push({
              id: key,
              color,
              size,
              sku: `${nameSlug}-${colorCode}-${sizeCode}-${rand}`,
              price: p,
              stock: s,
            });
          }
        });
      });

      return nextRows;
    });
  }, [parsedColors, parsedSizes, name, resolvedItemType]);

  // Mass Fill Handler
  const handleApplyMassFill = () => {
    const p = Number(massPrice);
    const s = Number(massStock);

    setVariants((prev) =>
      prev.map((row) => ({
        ...row,
        price: !isNaN(p) && p > 0 ? p : row.price,
        stock: !isNaN(s) && s >= 0 ? s : row.stock,
      }))
    );
  };

  // When massPrice input changes, keep table rows updated if they match old massPrice or are 0
  const handleMassPriceChange = (val: string) => {
    setMassPrice(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      setVariants((prev) =>
        prev.map((row) => ({
          ...row,
          price: row.price === 0 || row.price === Number(massPrice) ? num : row.price,
        }))
      );
    }
  };

  // Image Upload Handler for a specific color tag
  const handleAddImagesForColor = (colorTag: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setColorImages((prev) => ({
            ...prev,
            [colorTag]: [...(prev[colorTag] || []), dataUrl],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove single image from a color tag
  const handleRemoveImage = (colorTag: string, indexToRemove: number) => {
    setColorImages((prev) => ({
      ...prev,
      [colorTag]: (prev[colorTag] || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Keyboard Navigation: col 0 = Price ($), col 1 = Stock
  const handleGridKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const totalRows = variants.length;

    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault();
        if (rowIndex > 0) {
          const target = document.getElementById(`grid-cell-${rowIndex - 1}-${colIndex}`);
          target?.focus();
        }
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        if (rowIndex < totalRows - 1) {
          const target = document.getElementById(`grid-cell-${rowIndex + 1}-${colIndex}`);
          target?.focus();
        }
        break;
      }
      case 'ArrowLeft': {
        const input = e.currentTarget;
        if (input.selectionStart === 0 && input.selectionEnd === 0 && colIndex === 1) {
          e.preventDefault();
          const target = document.getElementById(`grid-cell-${rowIndex}-0`);
          target?.focus();
        }
        break;
      }
      case 'ArrowRight': {
        const input = e.currentTarget;
        if (input.selectionStart === input.value.length && colIndex === 0) {
          e.preventDefault();
          const target = document.getElementById(`grid-cell-${rowIndex}-1`);
          target?.focus();
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (rowIndex < totalRows - 1) {
          const target = document.getElementById(`grid-cell-${rowIndex + 1}-${colIndex}`);
          target?.focus();
        } else if (colIndex === 0) {
          const target = document.getElementById(`grid-cell-0-1`);
          target?.focus();
        }
        break;
      }
      default:
        break;
    }
  };

  // Update single variant row cell
  const handleRowChange = (index: number, field: 'price' | 'stock' | 'sku', value: any) => {
    setVariants((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  // Submit Handler: Saves product into database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    if (!finalName) {
      setErrorMessage('Product title is required.');
      return;
    }
    if (variants.length === 0) {
      setErrorMessage('At least one color and size combination is required.');
      return;
    }

    const calculatedBasePrice = Number(massPrice) || Number(variants[0]?.price) || 0;
    if (calculatedBasePrice <= 0) {
      setErrorMessage('Please enter a valid price in the Mass Fill Bar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        name: finalName,
        basePrice: calculatedBasePrice,
        category: `${department} / ${subcategory} / ${resolvedItemType}`,
        department,
        subcategory,
        itemType: resolvedItemType,
        tags: tagsInput.trim(),
        isTrending,
        isNewRelease,
        description,
        colorImages,
        variants: variants.map((v) => ({
          color: v.color,
          size: v.size,
          sku: v.sku,
          price: Number(v.price) || calculatedBasePrice,
          stock: Number(v.stock) || 0,
        })),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      setSuccessMessage(
        `Product "${finalName}" published successfully ($${calculatedBasePrice} USD) with ${variants.length} variants across ${parsedColors.length} colors.`
      );
      if (onSuccess) {
        onSuccess(json.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white text-ink rounded-2xl border border-black/10 shadow-sm p-6 md:p-8 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/10 mb-6">
        <div>
          <h2 className="text-base font-bold tracking-wide text-ink">
            Add New Product
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure catalog item, select colors, upload images, and mass-fill variants.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-neutral-600 hover:text-ink px-3 py-1.5 rounded border border-neutral-200 hover:border-black/20 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-xs">
          <Check size={14} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Simplified Classification: Department & Item Type */}
        <div className="bg-neutral-50/70 border border-neutral-200/80 p-5 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department (Men, Women, Accessories) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
                Department
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-neutral-200/60 p-1 rounded-lg border border-neutral-200">
                {['Men', 'Women', 'Accessories'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepartment(d)}
                    className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      department === d
                        ? 'bg-white text-ink font-bold shadow-xs'
                        : 'text-neutral-600 hover:text-ink'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Item Type (Cargo, Hoodie, T-Shirt, Polo, etc.) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
                Product Item Type
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-ink transition-colors cursor-pointer shadow-2xs font-medium"
              >
                {PRODUCT_ITEM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {itemType === 'Other' && (
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-medium text-neutral-700">
                Specify Custom Item Type
              </label>
              <input
                type="text"
                placeholder="e.g. Compression Arm Sleeves"
                value={customItemType}
                onChange={(e) => setCustomItemType(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-ink placeholder-neutral-400 focus:outline-none focus:border-ink shadow-2xs"
              />
            </div>
          )}

          {/* Search Tags */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-200/80">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <Tag size={12} className="text-neutral-500" />
              <span>Product Search Tags (Comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. cargo, relaxed, cotton, streetwear"
              className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-ink placeholder-neutral-400 focus:outline-none focus:border-ink font-mono shadow-2xs"
            />
          </div>
        </div>

        {/* Title and Homepage Badges (Base Price input REMOVED as requested - handled solely by Mass Fill Bar) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Product Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Baggy Relaxed Cargo Jeans"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs text-ink placeholder-neutral-400 focus:outline-none focus:border-ink transition-colors font-medium shadow-2xs"
            />
          </div>

          {/* Homepage Feature Toggles */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Homepage Placement
            </label>
            <div className="flex items-center gap-4 bg-neutral-50/70 p-2.5 rounded-lg border border-neutral-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-ink">
                <input
                  type="checkbox"
                  checked={isTrending}
                  onChange={(e) => setIsTrending(e.target.checked)}
                  className="rounded border-neutral-300 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="flex items-center gap-1 font-medium">
                  <Flame size={13} className="text-amber-500" />
                  <span>Trending Now</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-ink">
                <input
                  type="checkbox"
                  checked={isNewRelease}
                  onChange={(e) => setIsNewRelease(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles size={13} className="text-emerald-500" />
                  <span>New Release</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Color Palette Selector & Sizes with Quick Swatch Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50/70 p-4 rounded-xl border border-neutral-200/80">
          {/* Colors with interactive swatches */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Palette size={12} className="text-neutral-500" />
                <span>Select Colors</span>
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">
                {parsedColors.length} colors selected
              </span>
            </div>

            {/* Preset Color Swatches Button Bar */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {PRESET_COLORS.map((preset) => {
                const isSelected = parsedColors.some(
                  (c) => c.toLowerCase() === preset.name.toLowerCase()
                );
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleTogglePresetColor(preset.name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'border-ink bg-white text-ink font-semibold ring-1 ring-ink'
                        : 'border-neutral-200 bg-white/80 text-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-black/30 shadow-xs shrink-0"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span>{preset.name}</span>
                    {isSelected && <Check size={11} className="text-ink stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              placeholder="e.g. Black, White, Grey"
              className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-ink placeholder-neutral-400 focus:outline-none focus:border-ink transition-colors font-medium shadow-2xs"
            />
          </div>

          {/* Sizes with interactive pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
                Select Sizes
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">
                {parsedSizes.length} sizes selected
              </span>
            </div>

            {/* Preset Size Buttons Bar */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {PRESET_SIZES.map((size) => {
                const isSelected = parsedSizes.some(
                  (s) => s.toLowerCase() === size.toLowerCase()
                );
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleTogglePresetSize(size)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-medium border transition-all cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'border-ink bg-white text-ink font-bold ring-1 ring-ink'
                        : 'border-neutral-200 bg-white/80 text-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              placeholder="e.g. S, M, L, XL"
              className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-ink placeholder-neutral-400 focus:outline-none focus:border-ink transition-colors font-medium shadow-2xs"
            />
          </div>
        </div>

        {/* Color-Grouped Image Dropzones */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <ImageIcon size={14} className="text-neutral-500" />
              <span>Color-Grouped Image Dropzones</span>
            </span>
            <span className="text-[10px] text-neutral-500">
              Each color gets its own dedicated gallery
            </span>
          </div>

          {parsedColors.length === 0 ? (
            <div className="border border-dashed border-neutral-300 rounded-xl p-8 text-center text-xs text-neutral-500 bg-neutral-50/50">
              Select or type colors above to generate dedicated image dropzones.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parsedColors.map((colorTag) => {
                const images = colorImages[colorTag] || [];
                const hex = getColorHex(colorTag);

                return (
                  <div
                    key={colorTag}
                    className="bg-neutral-50/60 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-2xs"
                  >
                    <div>
                      {/* Dropzone Header with accurate Color Swatch */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-black/30 shadow-xs shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-xs font-bold text-ink">
                            {colorTag}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {images.length} {images.length === 1 ? 'photo' : 'photos'}
                        </span>
                      </div>

                      {/* Dropzone Area */}
                      <label className="border border-dashed border-neutral-300 hover:border-ink bg-white/70 hover:bg-white rounded-lg p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors mb-3">
                        <Upload size={16} className="text-neutral-500" />
                        <span className="text-[11px] font-medium text-neutral-700">
                          Upload {colorTag} photos
                        </span>
                        <span className="text-[9px] text-neutral-400">
                          PNG, JPG, WebP up to 10MB
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleAddImagesForColor(colorTag, e.target.files)}
                        />
                      </label>

                      {/* Preview Thumbnails Grid */}
                      {images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200">
                          {images.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="relative group h-12 w-12 rounded border border-neutral-200 bg-white overflow-hidden shrink-0 shadow-2xs"
                            >
                              <img
                                src={imgUrl}
                                alt={`${colorTag}-${imgIdx}`}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(colorTag, imgIdx)}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                                title="Remove image"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* EXCEL-LIKE BULK TABLE GRID WITH MASS FILL BAR (THE ONLY PRICE INPUT) */}
        <div className="space-y-3 pt-2">
          {/* Mass Fill Bar (in USD) */}
          <div className="bg-neutral-50 border border-neutral-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Mass Fill Bar:
              </span>

              <div className="flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg shadow-2xs">
                <span className="text-[10px] text-neutral-500 font-mono font-bold">$ USD</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={massPrice}
                  onChange={(e) => handleMassPriceChange(e.target.value)}
                  className="w-20 bg-transparent text-xs text-ink font-mono focus:outline-none font-bold"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg shadow-2xs">
                <span className="text-[10px] text-neutral-500 font-mono font-medium">Stock</span>
                <input
                  type="number"
                  min={0}
                  value={massStock}
                  onChange={(e) => setMassStock(e.target.value)}
                  className="w-16 bg-transparent text-xs text-ink font-mono focus:outline-none text-center font-medium"
                  placeholder="0"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyMassFill}
                className="bg-ink hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Apply to All Rows
              </button>
            </div>

            <span className="text-[10px] font-mono text-neutral-500">
              Total Matrix: {variants.length} SKU Rows
            </span>
          </div>

          {/* Table Container */}
          {variants.length > 0 ? (
            <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="max-h-[380px] overflow-y-auto overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-100/90 text-neutral-700 uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-10 border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-3 w-14">Photo</th>
                      <th className="py-2.5 px-3">Color</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 w-36">Price ($ USD)</th>
                      <th className="py-2.5 px-3 w-28">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-ink">
                    {variants.map((row, rowIndex) => {
                      const colorThumb = colorImages[row.color]?.[0];
                      const hex = getColorHex(row.color);

                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-neutral-50/80 transition-colors group"
                        >
                          {/* Color-tagged Image Thumbnail */}
                          <td className="py-2 px-3">
                            <div className="h-7 w-7 rounded overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                              {colorThumb ? (
                                <img
                                  src={colorThumb}
                                  alt={row.color}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-[9px] text-neutral-400 font-mono">-</span>
                              )}
                            </div>
                          </td>

                          {/* Color Tag with Swatch */}
                          <td className="py-2 px-3 font-semibold text-ink">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-full border border-black/30 shadow-xs shrink-0"
                                style={{ backgroundColor: hex }}
                              />
                              <span>{row.color}</span>
                            </div>
                          </td>

                          {/* Size Tag */}
                          <td className="py-2 px-3 font-bold text-ink">
                            {row.size}
                          </td>

                          {/* SKU Input */}
                          <td className="py-2 px-3 font-mono text-[11px] text-neutral-600">
                            <input
                              type="text"
                              value={row.sku}
                              onChange={(e) => handleRowChange(rowIndex, 'sku', e.target.value)}
                              className="bg-transparent border border-transparent hover:border-neutral-200 focus:border-ink focus:bg-white rounded px-1.5 py-0.5 w-36 text-xs text-neutral-800 font-mono focus:outline-none transition-colors"
                            />
                          </td>

                          {/* Price in USD ($) */}
                          <td className="py-2 px-3">
                            <div className="relative flex items-center">
                              <span className="absolute left-2 text-[11px] text-neutral-400 font-mono">$</span>
                              <input
                                id={`grid-cell-${rowIndex}-0`}
                                type="number"
                                min={0}
                                step="any"
                                value={row.price}
                                onChange={(e) => handleRowChange(rowIndex, 'price', Number(e.target.value))}
                                onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 0)}
                                className="w-full bg-white border border-neutral-200 focus:border-ink focus:ring-1 focus:ring-ink rounded pl-5 pr-2.5 py-1 text-xs text-ink font-mono focus:outline-none transition-all shadow-2xs font-semibold"
                              />
                            </div>
                          </td>

                          {/* Stock */}
                          <td className="py-2 px-3">
                            <input
                              id={`grid-cell-${rowIndex}-1`}
                              type="number"
                              min={0}
                              value={row.stock}
                              onChange={(e) => handleRowChange(rowIndex, 'stock', Number(e.target.value))}
                              onKeyDown={(e) => handleGridKeyDown(e, rowIndex, 1)}
                              className="w-full bg-white border border-neutral-200 focus:border-ink focus:ring-1 focus:ring-ink rounded px-2.5 py-1 text-xs text-ink font-mono focus:outline-none text-center transition-all shadow-2xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-xl p-8 text-center text-xs text-neutral-500 bg-neutral-50/50">
              No variant combinations generated yet. Select colors and sizes above.
            </div>
          )}
        </div>

        {/* Submit Controls */}
        <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            <span className="font-mono bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-700">
              Arrow Keys / Enter / Tab
            </span>
            <span>navigate table cells seamlessly</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || variants.length === 0}
            className="bg-ink hover:bg-neutral-800 text-white font-semibold text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-98"
          >
            {isSubmitting ? (
              <span>Publishing Product...</span>
            ) : (
              <>
                <span>Publish Product ({variants.length} Variants)</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
