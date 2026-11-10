'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Zap,
  RefreshCw,
  AlertCircle,
  Check,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { taxonomy, Node } from '@/lib/taxonomy';
import { apiFetch } from '@/lib/api';
import { getColorHex } from '@/lib/catalogData';

interface VariantRow {
  id?: string;
  size: string;
  color: string;
  sku: string;
  price_override?: number;
  stock: number;
  low_stock_threshold: number;
  image?: string;
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COMMON_COLORS = [
  'Signature Black',
  'Optic White',
  'Heather Gray',
  'Navy Blue',
];

export default function ProductFormPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const isNew = productId === 'new' || !productId;

  // Loading & Error States
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Core Product Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number>(20);
  const [weightGrams, setWeightGrams] = useState<number>(250);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [highlightedTagIndex, setHighlightedTagIndex] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);

  const handleAddTag = (val?: string) => {
    const text = (val !== undefined ? val : tagInput).trim();
    if (!text) return;
    const parts = text.split(',').map((t) => t.trim()).filter(Boolean);
    setTags((prev) => {
      const updated = [...prev];
      parts.forEach((p) => {
        if (!updated.includes(p)) updated.push(p);
      });
      return updated;
    });
    setTagInput('');
    if (highlightedTagIndex !== null) setHighlightedTagIndex(null);
    if (error) setError(null);
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (highlightedTagIndex !== null) setHighlightedTagIndex(null);
  };

  // 3-Level Taxonomy Selection
  const [selectedPillarSlug, setSelectedPillarSlug] = useState<string>('men');
  const [selectedMajorSlug, setSelectedMajorSlug] = useState<string>('tops');
  const [selectedSubSlug, setSelectedSubSlug] = useState<string>('plain-tees');

  // Variants Array - empty by default
  const [variants, setVariants] = useState<VariantRow[]>([]);

  // Quick Matrix Builder States - not automatically populated or selected
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [genColors, setGenColors] = useState<string[]>([]);
  const [genSizes, setGenSizes] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [matrixUnit, setMatrixUnit] = useState<number | ''>('');

  const handleAddNewColor = () => {
    const col = prompt('Enter new color name (e.g. Navy Blue, Beige, Olive):');
    if (col && col.trim()) {
      const trimmed = col.trim();
      if (!availableColors.includes(trimmed)) {
        setAvailableColors((prev) => [...prev, trimmed]);
      }
      if (!genColors.includes(trimmed)) {
        setGenColors((prev) => [...prev, trimmed]);
      }
      setColorImages((prev) => ({ ...prev, [trimmed]: prev[trimmed] || [] }));
      setActiveUploadTab(trimmed);
    }
  };

  const handleDeleteColor = (colorToDelete: string) => {
    setAvailableColors((prev) => prev.filter((c) => c !== colorToDelete));
    setGenColors((prev) => prev.filter((c) => c !== colorToDelete));
    setVariants((prev) => prev.filter((v) => v.color !== colorToDelete));
    setColorImages((prev) => {
      const next = { ...prev };
      delete next[colorToDelete];
      return next;
    });
    if (activeUploadTab === colorToDelete) {
      const remaining = availableColors.filter((c) => c !== colorToDelete);
      if (remaining.length > 0) {
        setActiveUploadTab(remaining[0]);
      } else {
        setActiveUploadTab('');
      }
    }
  };

  // Color-grouped image state: { [colorTag: string]: string[] } - empty by default
  const [colorImages, setColorImages] = useState<Record<string, string[]>>({});
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [newColorInput, setNewColorInput] = useState<string>('');
  const [activeUploadTab, setActiveUploadTab] = useState<string>('');

  // Dynamic live taxonomy from backend
  const [liveTaxonomy, setLiveTaxonomy] = useState<Node[]>(taxonomy);

  useEffect(() => {
    apiFetch('/api/admin/taxonomy')
      .then((res: any) => {
        if (res?.taxonomy && Array.isArray(res.taxonomy) && res.taxonomy.length > 0) {
          setLiveTaxonomy(res.taxonomy);
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic taxonomy:', err);
      });
  }, []);

  // 1. Taxonomy Derivation (Pillar -> Major -> Sub)
  const currentPillar = useMemo(() => {
    return liveTaxonomy.find((p) => p.slug === selectedPillarSlug) || liveTaxonomy[0];
  }, [liveTaxonomy, selectedPillarSlug]);

  const majorOptions = useMemo(() => {
    return currentPillar?.children || [];
  }, [currentPillar]);

  const currentMajor = useMemo(() => {
    return majorOptions.find((m) => m.slug === selectedMajorSlug) || majorOptions[0];
  }, [majorOptions, selectedMajorSlug]);

  const subOptions = useMemo(() => {
    return currentMajor?.children || [];
  }, [currentMajor]);

  // Update dependent taxonomy dropdowns when parent changes
  useEffect(() => {
    if (majorOptions.length > 0 && !majorOptions.some((m) => m.slug === selectedMajorSlug)) {
      setSelectedMajorSlug(majorOptions[0].slug);
    }
  }, [majorOptions, selectedMajorSlug]);

  useEffect(() => {
    if (subOptions.length > 0 && !subOptions.some((s) => s.slug === selectedSubSlug)) {
      setSelectedSubSlug(subOptions[0].slug);
    }
  }, [subOptions, selectedSubSlug]);

  // Derive list of all color names from variants, genColors, and existing colorImages
  const activeColorTags = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => {
      if (v.color?.trim()) set.add(v.color.trim());
    });
    genColors.forEach((c) => {
      if (c?.trim()) set.add(c.trim());
    });
    Object.keys(colorImages).forEach((c) => {
      if (c?.trim()) set.add(c.trim());
    });
    return Array.from(set);
  }, [variants, genColors, colorImages]);

  // Keep activeUploadTab valid
  useEffect(() => {
    if (activeColorTags.length > 0 && (!activeUploadTab || !activeColorTags.includes(activeUploadTab))) {
      setActiveUploadTab(activeColorTags[0]);
    }
  }, [activeColorTags, activeUploadTab]);

  // Handle direct file upload for a specific color tag
  const handleFileUpload = async (colorTag: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    let targetTag = colorTag;
    if (!targetTag) {
      const entered = prompt('Enter colorway name for these photos (e.g. Signature Black, Beige):');
      if (entered && entered.trim()) {
        targetTag = entered.trim();
        if (!availableColors.includes(targetTag)) {
          setAvailableColors((prev) => [...prev, targetTag]);
        }
        if (!genColors.includes(targetTag)) {
          setGenColors((prev) => [...prev, targetTag]);
        }
        setActiveUploadTab(targetTag);
      } else {
        targetTag = 'Standard';
        setActiveUploadTab(targetTag);
      }
    }
    setUploadingColor(targetTag);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('file', file));
      formData.append('colorTag', targetTag);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload photo');

      const newUrls: string[] = Array.isArray(json.urls) ? json.urls : json.url ? [json.url] : [];
      if (newUrls.length > 0) {
        setColorImages((prev) => ({
          ...prev,
          [targetTag]: [...(prev[targetTag] || []), ...newUrls],
        }));
      }
    } catch (err: any) {
      alert(`Failed to upload photo for ${targetTag}: ${err.message}`);
    } finally {
      setUploadingColor(null);
    }
  };

  // Handle adding image via URL for a specific color tag
  const handleAddImageUrl = (colorTag: string) => {
    const rawUrl = (urlInputs[colorTag] || '').trim();
    if (!rawUrl) return;
    setColorImages((prev) => ({
      ...prev,
      [colorTag]: [...(prev[colorTag] || []), rawUrl],
    }));
    setUrlInputs((prev) => ({ ...prev, [colorTag]: '' }));
  };

  // Remove single image from colorway
  const handleRemoveImage = (colorTag: string, indexToRemove: number) => {
    setColorImages((prev) => ({
      ...prev,
      [colorTag]: (prev[colorTag] || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Add custom colorway section manually
  const handleAddCustomColorSection = () => {
    const trimmed = newColorInput.trim();
    if (!trimmed) return;
    setColorImages((prev) => {
      if (prev[trimmed]) return prev;
      return { ...prev, [trimmed]: [] };
    });
    if (!genColors.includes(trimmed)) {
      setGenColors((prev) => [...prev, trimmed]);
    }
    setActiveUploadTab(trimmed);
    setNewColorInput('');
  };

  // 2. Fetch Existing Product Data in Edit Mode
  useEffect(() => {
    if (isNew) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/admin/products/${productId}`);
        if (res?.product) {
          const p = res.product;
          setName(p.name || '');
          setSlug(p.slug || '');
          setBasePrice(Number(p.base_price || 0));
          setCostPrice(Number(p.cost_price || 0));
          setWeightGrams(p.weight_grams || 250);
          setDescription(p.description_html || p.description || '');
          if (Array.isArray(p.tags)) {
            setTags(p.tags);
          } else if (typeof p.tags === 'string' && p.tags.trim()) {
            setTags(p.tags.split(',').map((t: string) => t.trim()).filter(Boolean));
          } else {
            setTags([]);
          }
          setIsActive(Boolean(p.is_active));

          if (p.colorImages && Object.keys(p.colorImages).length > 0) {
            setColorImages(p.colorImages);
          } else if (p.images && p.images.length > 0) {
            const mapped: Record<string, string[]> = {};
            p.images.forEach((img: any) => {
              const tag = (img.colorTag || 'Standard').trim();
              if (!mapped[tag]) mapped[tag] = [];
              if (img.url) mapped[tag].push(img.url);
            });
            setColorImages(mapped);
          }

          if (p.variants && p.variants.length > 0) {
            setVariants(
              p.variants.map((v: any) => ({
                id: v.id,
                size: v.size || 'M',
                color: v.color || 'Standard',
                sku: v.sku,
                stock: Number(v.stock || 0),
                low_stock_threshold: Number(v.low_stock_threshold || 5),
                price_override: v.price_override ? Number(v.price_override) : undefined,
                image: v.image || v.variant,
              }))
            );
            const loadedColors = Array.from(new Set(p.variants.map((v: any) => v.color).filter(Boolean))) as string[];
            if (loadedColors.length > 0) {
              setAvailableColors((prev) => Array.from(new Set([...prev, ...loadedColors])));
              setGenColors(loadedColors);
              setActiveUploadTab(loadedColors[0]);
            }
            const loadedSizes = Array.from(new Set(p.variants.map((v: any) => v.size).filter(Boolean))) as string[];
            if (loadedSizes.length > 0) {
              setGenSizes(loadedSizes);
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, isNew]);

  // Generate Unique SKU
  const generateSku = (colorName: string, sizeName: string) => {
    const base = (name || slug || 'LDR').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const col = (colorName || 'STD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
    const sz = (sizeName || 'M').toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    return `${base}-${col}-${sz}-${rand}`;
  };

  // Total stock calculation
  const totalStock = useMemo(
    () => variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    [variants]
  );

  // Table row selection helpers
  const handleToggleSelectAll = () => {
    if (selectedIndices.length === variants.length && variants.length > 0) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(variants.map((_, i) => i));
    }
  };

  const handleToggleRowSelect = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.length === 0) return;
    setVariants((prev) => prev.filter((_, i) => !selectedIndices.includes(i)));
    setSelectedIndices([]);
  };

  const handleDuplicateVariant = (idx: number) => {
    const target = variants[idx];
    if (!target) return;
    const duplicated: VariantRow = {
      ...target,
      id: undefined,
      sku: `${target.sku}-COPY`,
    };
    setVariants((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, duplicated);
      return next;
    });
  };

  const handleUpdateVariant = (idx: number, field: keyof VariantRow, value: any) => {
    setVariants((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  // Add Single Empty Variant
  const handleAddVariant = () => {
    const newSku = generateSku(activeUploadTab || 'Default', 'M');
    setVariants((prev) => [
      ...prev,
      {
        size: 'M',
        color: activeUploadTab || 'Signature Black',
        sku: newSku,
        stock: 20,
        low_stock_threshold: 5,
        price_override: basePrice ? Number(basePrice) : 24.9,
      },
    ]);
  };

  // Remove Variant Row
  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndices((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
  };

  // Quick Matrix Combination Generator
  const handleGenerateMatrix = () => {
    // 1. Validate all fields in Product Information
    if (!name.trim()) {
      setError('Please enter Title in Product Information before generating variants.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (basePrice === '' || basePrice === null || basePrice === undefined || Number(basePrice) <= 0) {
      setError('Please enter Price in Product Information before generating variants.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    let currentTags = [...tags];
    if (tagInput.trim()) {
      const parts = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (!currentTags.includes(p)) currentTags.push(p);
      });
      setTags(currentTags);
      setTagInput('');
    }
    if (currentTags.length === 0) {
      setError('Please enter Search by Tag in Product Information before generating variants.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (!description.trim()) {
      setError('Please enter Description in Product Information before generating variants.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    // 2. Validate Unit
    if (matrixUnit === '' || matrixUnit === null || matrixUnit === undefined || Number(matrixUnit) <= 0) {
      setError('Please enter the unit quantity before generating variants.');
      return;
    }

    // 3. Validate Colors and Sizes
    if (genColors.length === 0 || genSizes.length === 0) {
      setError('Please select at least one color and one size.');
      return;
    }

    setError(null);

    const combinations: VariantRow[] = [];
    for (const color of genColors) {
      const colorShort = color.toLowerCase().includes('black')
        ? 'BLK'
        : color.toLowerCase().includes('white')
        ? 'WHT'
        : color.toLowerCase().includes('gray') || color.toLowerCase().includes('grey')
        ? 'GRY'
        : color.toLowerCase().includes('navy')
        ? 'NVY'
        : color.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'COL';

      for (const size of genSizes) {
        combinations.push({
          size,
          color,
          sku: `${colorShort}-TEE-${size}`,
          stock: Number(matrixUnit),
          low_stock_threshold: 5,
          price_override: Number(basePrice),
        });
      }
    }

    setVariants(combinations);
    setSelectedIndices([]);

    setColorImages((prev) => {
      const next = { ...prev };
      genColors.forEach((c) => {
        if (!next[c]) next[c] = [];
      });
      return next;
    });
    if (!genColors.includes(activeUploadTab) && genColors.length > 0) {
      setActiveUploadTab(genColors[0]);
    }
  };

  const renderSizeLabel = (sz: string) => {
    return <span className="text-[11px] font-bold tracking-tight">{sz}</span>;
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Title is required in Product Information.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (basePrice === '' || basePrice === null || basePrice === undefined || Number(basePrice) <= 0) {
      setError('Price is required in Product Information.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    let currentTags = [...tags];
    if (tagInput.trim()) {
      const parts = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (!currentTags.includes(p)) currentTags.push(p);
      });
      setTags(currentTags);
      setTagInput('');
    }
    if (currentTags.length === 0) {
      setError('Search by Tag is required in Product Information.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (!description.trim()) {
      setError('Description is required in Product Information.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    if (variants.length === 0) {
      setError('At least one inventory variant is required. Please generate or add variants.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    // Format flat images array with colorTag
    const flatImages: { url: string; colorTag: string }[] = [];
    Object.entries(colorImages).forEach(([colorTag, urls]) => {
      if (Array.isArray(urls)) {
        urls.forEach((url) => {
          if (url) flatImages.push({ url, colorTag });
        });
      }
    });

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      category: `${currentPillar?.name} / ${currentMajor?.name} / ${subOptions.find((s) => s.slug === selectedSubSlug)?.name || selectedSubSlug}`,
      department: currentPillar?.name || 'Men',
      subcategory: currentMajor?.name || 'Tops',
      itemType: subOptions.find((s) => s.slug === selectedSubSlug)?.name || 'Apparel',
      base_price: Number(basePrice || 0),
      cost_price: Number(costPrice || basePrice || 0),
      weight_grams: Number(weightGrams || 250),
      description_html: description,
      tags: currentTags,
      is_active: true,
      images: flatImages,
      colorImages,
      variants: variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        stock: Number(v.stock),
        low_stock_threshold: Number(v.low_stock_threshold),
        price_override: v.price_override ? Number(v.price_override) : undefined,
        image: colorImages[v.color]?.[0] || v.image,
      })),
    };

    try {
      if (isNew) {
        await apiFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        // Also synchronize directly to Storefront Product/Variant/ProductImage
        try {
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: payload.name,
              slug: payload.slug,
              description: payload.description_html,
              basePrice: payload.base_price,
              category: payload.category,
              department: payload.department,
              subcategory: payload.subcategory,
              itemType: payload.itemType,
              tags: currentTags.join(', '),
              colorImages,
              variants: payload.variants.map((v) => ({
                color: v.color,
                size: v.size,
                sku: v.sku,
                price: v.price_override || payload.base_price,
                stock: v.stock,
              })),
            }),
          });
        } catch (syncErr) {
          console.warn('Sync /api/products notice:', syncErr);
        }

        setSuccessMsg('Product and colorway photo gallery saved successfully.');
        setTimeout(() => router.push('/admin/products'), 1200);
      } else {
        await apiFetch(`/api/admin/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('Product and colorway photos updated successfully.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-neutral-400" />
          <p className="text-xs uppercase font-mono tracking-widest text-neutral-500">
            Loading Fashion Silhouette Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-8">
      {/* ──── TOP HEADER ──── */}
      <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="p-1 text-neutral-500 hover:text-ink hover:bg-neutral-100 rounded-md transition"
            title="Back to Products"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="font-display text-lg font-bold tracking-tight text-ink">
            {isNew ? 'New Product' : `Edit: ${name}`}
          </h1>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <Check size={14} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* ──── SECTION 1: CATEGORY ──── */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-2.5">
          <div className="border-b border-neutral-100 pb-2">
            <h2 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-800">
              Category
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Category
              </label>
              <select
                value={selectedPillarSlug}
                onChange={(e) => setSelectedPillarSlug(e.target.value)}
                className="w-full bg-white border border-neutral-200 px-2.5 py-1.5 text-xs text-ink rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black"
              >
                {liveTaxonomy.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub Category */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Sub Category
              </label>
              <select
                value={selectedMajorSlug}
                onChange={(e) => setSelectedMajorSlug(e.target.value)}
                className="w-full bg-white border border-neutral-200 px-2.5 py-1.5 text-xs text-ink rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black"
              >
                {majorOptions.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name Item */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Name Item
              </label>
              <select
                value={selectedSubSlug}
                onChange={(e) => setSelectedSubSlug(e.target.value)}
                className="w-full bg-white border border-neutral-200 px-2.5 py-1.5 text-xs text-ink rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black"
              >
                {subOptions.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ──── SECTION 2: PRODUCT INFORMATION ──── */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-2.5">
          <div className="border-b border-neutral-100 pb-2">
            <h2 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-800">
              Product Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Title (Row 1 Left) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                required
                placeholder="Title"
                className={`w-full bg-white border ${
                  error && !name.trim() ? 'border-rose-400 ring-1 ring-rose-400' : 'border-neutral-200'
                } px-2.5 py-1.5 text-xs text-ink rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-neutral-400`}
              />
            </div>

            {/* Price (Row 1 Right) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Price *
              </label>
              <div
                className={`flex items-center w-full bg-white border ${
                  error && (basePrice === '' || Number(basePrice) <= 0)
                    ? 'border-rose-400 ring-1 ring-rose-400'
                    : 'border-neutral-200'
                } px-2.5 py-1.5 rounded-lg focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all overflow-hidden`}
              >
                <span className="text-xs font-normal text-neutral-900 select-none mr-1.5 shrink-0">
                  $
                </span>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => {
                    setBasePrice(e.target.value === '' ? '' : Number(e.target.value));
                    if (error) setError(null);
                  }}
                  min={0}
                  step="any"
                  required
                  className="w-full text-xs text-neutral-900 font-normal outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                />
              </div>
            </div>

            {/* Description (Row 2 Left) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError(null);
                }}
                required
                placeholder="Description"
                style={{ height: '125px', minHeight: '125px' }}
                className={`w-full bg-white border ${
                  error && !description.trim() ? 'border-rose-400 ring-1 ring-rose-400' : 'border-neutral-200'
                } p-2.5 text-xs text-ink rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black resize-none transition-all placeholder:text-neutral-400`}
              />
            </div>

            {/* Search by Tag (Row 2 Right) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Search by Tag *
              </label>
              <div
                style={{ height: '125px', minHeight: '125px', alignContent: 'flex-start' }}
                className={`w-full overflow-y-auto bg-white border ${
                  error && tags.length === 0 && !tagInput.trim()
                    ? 'border-rose-400 ring-1 ring-rose-400'
                    : 'border-neutral-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black'
                } p-2.5 rounded-lg flex flex-wrap items-start gap-1.5 transition-all cursor-text`}
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input') as HTMLInputElement | null;
                  input?.focus();
                }}
              >
                {tags.map((tag, idx) => {
                  const isHighlighted = highlightedTagIndex === idx;
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors select-none ${
                        isHighlighted
                          ? 'bg-neutral-900 text-white border border-neutral-900 shadow-2xs'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-300/80 shadow-2xs'
                      }`}
                    >
                      <span className="leading-tight">{tag}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(idx);
                        }}
                        className={`p-0.5 rounded-full transition cursor-pointer ${
                          isHighlighted
                            ? 'text-neutral-300 hover:text-white'
                            : 'text-neutral-400 hover:text-rose-600'
                        }`}
                        title={`Remove ${tag}`}
                      >
                        <X size={9} />
                      </button>
                    </span>
                  );
                })}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    if (highlightedTagIndex !== null) setHighlightedTagIndex(null);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    } else if (e.key === 'Backspace') {
                      if (e.repeat) {
                        e.preventDefault();
                        return;
                      }
                      if (!tagInput && tags.length > 0) {
                        e.preventDefault();
                        if (highlightedTagIndex === tags.length - 1) {
                          handleRemoveTag(tags.length - 1);
                          setHighlightedTagIndex(null);
                        } else {
                          setHighlightedTagIndex(tags.length - 1);
                        }
                      }
                    } else {
                      if (highlightedTagIndex !== null) {
                        setHighlightedTagIndex(null);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (highlightedTagIndex !== null) setHighlightedTagIndex(null);
                  }}
                  placeholder={tags.length === 0 ? 'Supporting tag' : ''}
                  className="flex-1 min-w-[90px] text-xs text-ink outline-none bg-transparent py-0.5 px-1 placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ──── SECTION 3: MATRIX VARIANT ──── */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h2 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-800">
              Matrix Variant
            </h2>

            <button
              type="button"
              onClick={handleAddVariant}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-black text-white text-[11px] font-semibold rounded-lg transition cursor-pointer shadow-sm"
            >
              <Plus size={12} />
              <span>Add Single Row</span>
            </button>
          </div>

          {/* Choose Matrix Area */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Choose Matrix
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-1.5">
                {/* Sizes Row */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-500 w-12 shrink-0 uppercase tracking-wider">
                    Sizes:
                  </span>
                  <div className="flex items-center gap-1">
                    {COMMON_SIZES.map((sz) => {
                      const checked = genSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            setGenSizes((prev) =>
                              checked ? prev.filter((s) => s !== sz) : [...prev, sz]
                            );
                          }}
                          className={`min-w-[30px] h-7 px-2 rounded-md flex items-center justify-center transition cursor-pointer ${
                            checked
                              ? 'border border-neutral-700 bg-neutral-100/70 text-neutral-900 font-bold shadow-2xs'
                              : 'border border-neutral-200 text-neutral-400 bg-white hover:border-neutral-300 hover:text-neutral-600'
                          }`}
                        >
                          {renderSizeLabel(sz)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colors Row */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-500 w-12 shrink-0 uppercase tracking-wider">
                    Colors:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {availableColors.map((col) => {
                      const checked = genColors.includes(col);
                      const hex = getColorHex(col);
                      return (
                        <div
                          key={col}
                          onClick={() => {
                            setGenColors((prev) =>
                              checked ? prev.filter((c) => c !== col) : [...prev, col]
                            );
                          }}
                          className={`group/pill flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer select-none ${
                            checked
                              ? 'border border-neutral-700 bg-neutral-100/70 text-neutral-900 shadow-2xs'
                              : 'border border-neutral-200 text-neutral-400 bg-white hover:border-neutral-300 hover:text-neutral-600'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/15 shadow-2xs"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="leading-tight">{col}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteColor(col);
                            }}
                            className="ml-0.5 p-0.5 rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-rose-600 transition cursor-pointer"
                            title={`Delete ${col}`}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}

                    {/* Add Color Button */}
                    <button
                      type="button"
                      onClick={handleAddNewColor}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-dashed border-neutral-300 hover:border-neutral-600 text-neutral-600 hover:text-black bg-white transition cursor-pointer shadow-2xs"
                    >
                      <Plus size={11} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Unit input & Generate Button */}
              <div className="flex items-center gap-2 sm:justify-end shrink-0">
                <div
                  className={`flex items-center gap-1.5 bg-white border ${
                    error && (matrixUnit === '' || Number(matrixUnit) <= 0)
                      ? 'border-rose-400 ring-1 ring-rose-400'
                      : 'border-neutral-200'
                  } rounded-lg px-2.5 py-1 focus-within:border-black shadow-2xs transition-all`}
                >
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider select-none">
                    Unit:
                  </span>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 20"
                    value={matrixUnit}
                    onChange={(e) => {
                      setMatrixUnit(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)));
                      if (error) setError(null);
                    }}
                    className="w-16 text-xs font-semibold text-neutral-900 outline-none bg-transparent"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateMatrix}
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white text-[11px] font-semibold rounded-lg shadow-sm transition cursor-pointer"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Sub-bar above table & Variants Table - only visible after generation or adding rows */}
          {variants.length > 0 && (
            <>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px]">
                <div className="flex items-center gap-2.5">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-neutral-600 font-medium">
                    <input
                      type="checkbox"
                      checked={variants.length > 0 && selectedIndices.length === variants.length}
                      onChange={handleToggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-neutral-300 accent-black cursor-pointer"
                    />
                    <span>Select all</span>
                  </label>

                  {selectedIndices.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="text-rose-600 hover:text-rose-700 font-medium cursor-pointer transition"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div>
                  <span className="text-neutral-400">Total Stock: </span>
                  <span className="text-neutral-900 font-bold">{totalStock} units</span>
                </div>
              </div>

              {/* Variants Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="w-6 py-1.5 px-1.5"></th>
                      <th className="py-1.5 px-2 text-left">Colorway</th>
                      <th className="py-1.5 px-2 text-center">Size</th>
                      <th className="py-1.5 px-2 text-center">Unit</th>
                      <th className="py-1.5 px-2 text-left">Price</th>
                      <th className="py-1.5 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100/70">
                    {variants.map((v, idx) => {
                      const isSelected = selectedIndices.includes(idx);
                      const hex = getColorHex(v.color);
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-neutral-50/60 transition ${
                            isSelected ? 'bg-neutral-50/40' : ''
                          }`}
                        >
                          <td className="py-1.5 px-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRowSelect(idx)}
                              className="w-3.5 h-3.5 rounded border-neutral-300 accent-black cursor-pointer"
                            />
                          </td>

                          <td className="py-1.5 px-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
                              <span
                                className="w-2 h-2 rounded-full border border-black/15 shrink-0"
                                style={{ backgroundColor: hex }}
                              />
                              <span>{v.color}</span>
                            </div>
                          </td>

                          <td className="py-1.5 px-2 text-center">
                            <span className="inline-block px-1.5 py-0.5 bg-neutral-100 text-neutral-800 text-[11px] font-bold rounded">
                              {v.size}
                            </span>
                          </td>

                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={v.stock}
                              onChange={(e) =>
                                handleUpdateVariant(idx, 'stock', Number(e.target.value))
                              }
                              className="w-16 bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-xs font-semibold text-center outline-none focus:border-black"
                            />
                          </td>

                          <td className="py-1.5 px-2">
                            <div className="flex items-center w-24 bg-white border border-neutral-200 rounded px-2 py-0.5 focus-within:border-black">
                              <span className="text-black text-xs mr-1.5 font-normal select-none">
                                $
                              </span>
                              <input
                                type="number"
                                step="any"
                                min={0}
                                value={v.price_override ?? ''}
                                placeholder={
                                  basePrice !== '' ? Number(basePrice).toFixed(2) : '24.90'
                                }
                                onChange={(e) =>
                                  handleUpdateVariant(
                                    idx,
                                    'price_override',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="w-full text-xs font-mono outline-none bg-transparent"
                              />
                            </div>
                          </td>

                          <td className="py-1.5 px-2 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-neutral-400">
                              <button
                                type="button"
                                onClick={() => handleDuplicateVariant(idx)}
                                className="hover:text-neutral-800 transition cursor-pointer p-0.5"
                                title="Duplicate variant"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="hover:text-rose-600 transition cursor-pointer p-0.5"
                                title="Delete variant"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* ──── SECTION 4: COLORWAY MODEL ──── */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
          {/* Header */}
          <div className="border-b border-neutral-100 pb-2">
            <h2 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-800">
              Colorway Model
            </h2>
          </div>

          {/* Color Navigation Tabs */}
          <div className="flex items-center gap-4 border-b border-neutral-100 text-xs overflow-x-auto">
            {activeColorTags.map((color) => {
              const isActive = activeUploadTab === color;
              const hex = getColorHex(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setActiveUploadTab(color)}
                  className={`flex items-center gap-1.5 pb-1.5 font-semibold transition cursor-pointer border-b-2 -mb-[1px] whitespace-nowrap text-xs ${
                    isActive
                      ? 'border-black text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full border border-black/15 shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                  <span>{color}</span>
                </button>
              );
            })}
          </div>

          {/* Photo Gallery Grid - explicitly compact height, strictly 4 columns */}
          <div>
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              {(colorImages[activeUploadTab] || []).length} IMAGE
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {(colorImages[activeUploadTab] || []).map((url, imgIdx) => (
                <div
                  key={`${url}-${imgIdx}`}
                  className="group relative h-28 sm:h-32 md:h-36 w-full bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 shadow-2xs"
                >
                  <img
                    src={url}
                    alt={`${name || 'Product'} - ${activeUploadTab} ${imgIdx + 1}`}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badge 1st Image as COVER */}
                  {imgIdx === 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-black/90 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm backdrop-blur-xs">
                      COVER
                    </span>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(activeUploadTab, imgIdx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-sm cursor-pointer"
                    title="Delete photo"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}

              {/* Add Shot placeholder card */}
              <label className="border-2 border-dashed border-neutral-200 hover:border-neutral-400 rounded-lg flex flex-col items-center justify-center h-28 sm:h-32 md:h-36 transition cursor-pointer bg-white group p-1.5 text-center shadow-2xs">
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    handleFileUpload(activeUploadTab, e.target.files);
                    e.target.value = '';
                  }}
                />
                {uploadingColor === activeUploadTab ? (
                  <div className="flex flex-col items-center justify-center gap-1 text-neutral-400">
                    <RefreshCw size={14} className="animate-spin text-black" />
                    <span className="text-[10px] font-medium">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center text-neutral-500 transition mb-1">
                      <Plus size={13} />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-800">Add Shot</span>
                    <span className="text-[9px] text-neutral-400">Model or Laydown</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* ──── BOTTOM SUBMIT BAR ──── */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-2xs" />
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/products"
              className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-black transition"
            >
              Discard
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
            >
              {submitting && <RefreshCw size={12} className="animate-spin" />}
              <span>{submitting ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
