'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Search,
  ArrowUpDown,
  RefreshCw,
  Package,
  Edit2,
  Trash2,
  ChevronDown,
  SlidersHorizontal,
  X,
  Tag,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { taxonomy, Node } from '@/lib/taxonomy';

interface ProductDisplayItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  categorySlug?: string;
  level2Name?: string | null;
  level2Slug?: string | null;
  level3Name?: string | null;
  level3Slug?: string | null;
  rootCategory: string;
  price: number;
  stock: number;
  stockStatus: 'Aman' | 'Sedang' | 'Kritis' | 'Habis';
  status: 'Aktif' | 'Draft' | 'Stok Habis';
  createdAt: string;
  image: string;
}

const DEFAULT_PRODUCTS: ProductDisplayItem[] = [
  {
    id: 'p-1',
    name: 'Heavyweight Minimalist T-Shirt',
    sku: 'LDR-TSHIRT-01',
    category: 'Kaos Polos',
    categorySlug: 'plain-tees',
    level2Name: 'Atasan Pria',
    level2Slug: 'men-tops',
    level3Name: 'Kaos Polos',
    level3Slug: 'plain-tees',
    rootCategory: 'Men',
    price: 249000,
    stock: 48,
    stockStatus: 'Aman',
    status: 'Aktif',
    createdAt: '12 Okt 2024',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'p-2',
    name: 'Raw Linen Structured Blazer',
    sku: 'LDR-BLZR-04',
    category: 'Atasan Wanita',
    categorySlug: 'women-tops',
    level2Name: 'Atasan Wanita',
    level2Slug: 'women-tops',
    rootCategory: 'Women',
    price: 899000,
    stock: 4,
    stockStatus: 'Kritis',
    status: 'Aktif',
    createdAt: '08 Okt 2024',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'p-3',
    name: 'Full-Grain Leather Cardholder',
    sku: 'LDR-CRD-11',
    category: 'Tas & Ransel',
    categorySlug: 'acc-bags',
    level2Name: 'Tas & Ransel',
    level2Slug: 'acc-bags',
    rootCategory: 'Accessories',
    price: 350000,
    stock: 19,
    stockStatus: 'Sedang',
    status: 'Aktif',
    createdAt: '29 Sep 2024',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'p-4',
    name: 'Minimalist Relaxed Fit Chino Pants',
    sku: 'LDR-CHIN-08',
    category: 'Bawahan Pria',
    categorySlug: 'men-bottoms',
    level2Name: 'Bawahan Pria',
    level2Slug: 'men-bottoms',
    level3Slug: 'chinos',
    rootCategory: 'Men',
    price: 499000,
    stock: 25,
    stockStatus: 'Aman',
    status: 'Aktif',
    createdAt: '15 Sep 2024',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'p-5',
    name: 'Canvas Daypack Utility Tote',
    sku: 'LDR-BAG-02',
    category: 'Tas & Ransel',
    categorySlug: 'acc-bags',
    level2Name: 'Tas & Ransel',
    level2Slug: 'acc-bags',
    rootCategory: 'Accessories',
    price: 480000,
    stock: 82,
    stockStatus: 'Aman',
    status: 'Aktif',
    createdAt: '02 Sep 2024',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'p-6',
    name: 'Relaxed Silk Knit Cardigan',
    sku: 'LDR-KNT-09',
    category: 'Atasan Wanita',
    categorySlug: 'women-tops',
    level2Name: 'Atasan Wanita',
    level2Slug: 'women-tops',
    rootCategory: 'Women',
    price: 520000,
    stock: 30,
    stockStatus: 'Aman',
    status: 'Draft',
    createdAt: '24 Agu 2024',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=300&q=80',
  },
];

function CategoryProductsContent() {
  const params = useParams();
  const slug = (params?.slug as string) || 'men';

  // Format display category name
  const categoryTitle = useMemo(() => {
    const s = slug.toLowerCase();
    if (s === 'men') return 'Men';
    if (s === 'women') return 'Women';
    if (s === 'accessories' || s === 'aksesoris') return 'Accessories';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [slug]);

  const [liveTaxonomy, setLiveTaxonomy] = useState<Node[]>(taxonomy);
  const [showItemTypeModal, setShowItemTypeModal] = useState(false);
  const [modalMajorSlug, setModalMajorSlug] = useState<string>('');
  const [newItemTypeName, setNewItemTypeName] = useState('');
  const [newItemTypeSlug, setNewItemTypeSlug] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  // Sync fresh taxonomy from backend
  const loadTaxonomy = () => {
    apiFetch('/api/admin/taxonomy')
      .then((res) => {
        if (res?.taxonomy && Array.isArray(res.taxonomy)) {
          setLiveTaxonomy(res.taxonomy);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadTaxonomy();
  }, []);

  const currentPillar = useMemo(() => {
    const s = slug.toLowerCase();
    const pillarSlug = s === 'accessories' || s === 'aksesoris' ? 'accessories' : s;
    return liveTaxonomy.find((p) => p.slug === pillarSlug) || liveTaxonomy[0];
  }, [slug, liveTaxonomy]);

  // Level 2 options (e.g. Tops, Bottoms, Bags, Shoes)
  const level2Options = useMemo(() => {
    return currentPillar?.children || [];
  }, [currentPillar]);

  const [products, setProducts] = useState<ProductDisplayItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel2, setSelectedLevel2] = useState<string>('');
  const [selectedLevel3, setSelectedLevel3] = useState<string>('');
  const [sortBy, setSortBy] = useState('Urutan: Terbaru');
  const [loading, setLoading] = useState(true);

  // Level 3 options derived when Level 2 is selected
  const level3Options = useMemo(() => {
    if (!selectedLevel2) return [];
    const node = level2Options.find((m) => m.slug === selectedLevel2);
    return node?.children || [];
  }, [level2Options, selectedLevel2]);

  // When modal opens, sync active modal major slug
  useEffect(() => {
    if (showItemTypeModal && (!modalMajorSlug || !level2Options.some((m) => m.slug === modalMajorSlug))) {
      setModalMajorSlug(selectedLevel2 || level2Options[0]?.slug || '');
    }
  }, [showItemTypeModal, modalMajorSlug, selectedLevel2, level2Options]);

  const activeModalMajor = useMemo(() => {
    return level2Options.find((m) => m.slug === modalMajorSlug) || level2Options[0];
  }, [level2Options, modalMajorSlug]);

  const modalItemTypes = useMemo(() => {
    return activeModalMajor?.children || [];
  }, [activeModalMajor]);

  const handleAddItemType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTypeName.trim()) return;
    const targetMajor = modalMajorSlug || level2Options[0]?.slug;
    if (!targetMajor) return;

    setModalSubmitting(true);
    try {
      const res = await apiFetch('/api/admin/taxonomy/item-type', {
        method: 'POST',
        body: JSON.stringify({
          pillarSlug: slug,
          majorSlug: targetMajor,
          name: newItemTypeName.trim(),
          slug: newItemTypeSlug.trim() || undefined,
        }),
      });
      if (res?.taxonomy) {
        setLiveTaxonomy(res.taxonomy);
        setNewItemTypeName('');
        setNewItemTypeSlug('');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan item type');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteItemType = async (itemSlug: string, itemName: string) => {
    if (!confirm(`Hapus item type "${itemName}"?`)) return;
    const targetMajor = modalMajorSlug || level2Options[0]?.slug;
    if (!targetMajor) return;

    setDeletingSlug(itemSlug);
    try {
      const res = await apiFetch('/api/admin/taxonomy/item-type', {
        method: 'DELETE',
        body: JSON.stringify({
          pillarSlug: slug,
          majorSlug: targetMajor,
          slug: itemSlug,
        }),
      });
      if (res?.taxonomy) {
        setLiveTaxonomy(res.taxonomy);
        if (selectedLevel3 === itemSlug) {
          setSelectedLevel3('');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus item type');
    } finally {
      setDeletingSlug(null);
    }
  };

  // Reset filters when pillar slug changes
  useEffect(() => {
    setSelectedLevel2('');
    setSelectedLevel3('');
    setSearchQuery('');
  }, [slug]);

  // Fetch products for this specific category
  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/admin/products?category=${encodeURIComponent(categoryTitle)}`)
      .then((res: any) => {
        if (res?.products && Array.isArray(res.products)) {
          const apiProducts: ProductDisplayItem[] = res.products.map((p: any) => {
            const stock = Number(p.total_stock ?? (p.variants?.[0]?.stock || 0));
            let stockStatus: 'Aman' | 'Sedang' | 'Kritis' | 'Habis' = 'Aman';
            if (stock === 0) stockStatus = 'Habis';
            else if (stock <= 5) stockStatus = 'Kritis';
            else if (stock <= 20) stockStatus = 'Sedang';

            let status: 'Aktif' | 'Draft' | 'Stok Habis' = p.is_active ? 'Aktif' : 'Draft';
            if (stock === 0) status = 'Stok Habis';

            const sku = p.variants?.[0]?.sku || `LDR-${p.slug?.slice(0, 4)?.toUpperCase() || 'PROD'}-01`;
            const dateStr = p.created_at
              ? new Date(p.created_at).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '10 Okt 2024';

            return {
              id: p.id,
              name: p.name,
              sku,
              category: p.category_name || 'Koleksi Umum',
              categorySlug: p.category_slug || '',
              level2Name: p.level2_name || null,
              level2Slug: p.level2_slug || null,
              level3Name: p.level3_name || null,
              level3Slug: p.level3_slug || null,
              rootCategory: p.root_category || p.department || categoryTitle,
              price: Number(p.base_price || 249000),
              stock,
              stockStatus,
              status,
              createdAt: dateStr,
              image:
                p.image ||
                p.images?.[0] ||
                p.variants?.[0]?.image ||
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80',
            };
          });

          setProducts(apiProducts);
        } else {
          // Fallback matching default products
          const matched = DEFAULT_PRODUCTS.filter(
            (p) => p.rootCategory.toLowerCase() === categoryTitle.toLowerCase()
          );
          setProducts(matched);
        }
      })
      .catch(() => {
        const matched = DEFAULT_PRODUCTS.filter(
          (p) => p.rootCategory.toLowerCase() === categoryTitle.toLowerCase()
        );
        setProducts(matched);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [categoryTitle]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesCat) return false;
      }

      // 2. Level 2 Category Filter (Tops, Bottoms, Shoes, Bags)
      if (selectedLevel2) {
        const selL2Node = level2Options.find((m) => m.slug === selectedLevel2);
        const l2Name = selL2Node?.name.toLowerCase() || '';
        const l2Slug = selectedLevel2.toLowerCase();
        const childSlugs = (selL2Node?.children || []).map((c) => c.slug.toLowerCase());
        const childNames = (selL2Node?.children || []).map((c) => c.name.toLowerCase());

        const pL2Slug = (p.level2Slug || '').toLowerCase();
        const pL2Name = (p.level2Name || '').toLowerCase();
        const pL3Slug = (p.level3Slug || '').toLowerCase();
        const pCatSlug = (p.categorySlug || '').toLowerCase();
        const pCatName = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();

        const matchesL2Direct =
          pL2Slug.includes(l2Slug) ||
          pL2Name.includes(l2Name) ||
          pCatSlug.includes(l2Slug) ||
          pCatName.includes(l2Name) ||
          (l2Slug === 'tops' && (pL2Name.includes('atasan') || pCatName.includes('atasan') || pCatName.includes('kaos') || pCatName.includes('hoodie') || pCatName.includes('blouse') || pCatName.includes('shirt'))) ||
          (l2Slug === 'bottoms' && (pL2Name.includes('bawahan') || pCatName.includes('bawahan') || pCatName.includes('chino') || pCatName.includes('pant') || pCatName.includes('short') || pCatName.includes('jogger'))) ||
          (l2Slug === 'shoes' && (pL2Name.includes('sepatu') || pCatName.includes('sepatu') || pCatName.includes('sneaker') || pCatName.includes('loafer'))) ||
          (l2Slug === 'bags' && (pL2Name.includes('tas') || pCatName.includes('tas') || pCatName.includes('ransel') || pCatName.includes('bag')));

        const matchesViaChildren =
          childSlugs.some((cs) => pL3Slug === cs || pCatSlug === cs || pL2Slug.includes(cs) || pName.includes(cs)) ||
          childNames.some((cn) => pCatName.includes(cn) || pName.includes(cn));

        if (!matchesL2Direct && !matchesViaChildren) {
          return false;
        }
      }

      // 3. Level 3 Item Type Filter (Plain T-Shirts, Polo Shirts, Hoodies, Chinos, etc.)
      if (selectedLevel3) {
        const selL3Node = level3Options.find((s) => s.slug === selectedLevel3);
        const l3Slug = selectedLevel3.toLowerCase();
        const l3Name = selL3Node?.name.toLowerCase() || '';

        const pL3Slug = (p.level3Slug || '').toLowerCase();
        const pL3Name = (p.level3Name || '').toLowerCase();
        const pCatSlug = (p.categorySlug || '').toLowerCase();
        const pCatName = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();

        const matchesL3 =
          pL3Slug === l3Slug ||
          pCatSlug === l3Slug ||
          pL3Slug.includes(l3Slug) ||
          pCatSlug.includes(l3Slug) ||
          pL3Name.includes(l3Name) ||
          pCatName.includes(l3Name) ||
          pName.includes(l3Name) ||
          (l3Slug === 'plain-tees' && (pName.includes('tee') || pCatName.includes('kaos polos'))) ||
          (l3Slug === 'polos' && (pName.includes('polo') || pCatName.includes('polo'))) ||
          (l3Slug === 'hoodies' && (pName.includes('hoodie') || pCatName.includes('hoodie'))) ||
          (l3Slug === 'chinos' && (pName.includes('chino') || pCatName.includes('chino'))) ||
          (l3Slug === 'sneakers' && (pName.includes('sneaker') || pCatName.includes('sneaker')));

        if (!matchesL3) {
          return false;
        }
      }

      return true;
    });

    if (sortBy === 'Harga: Tertinggi') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Harga: Terendah') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Stok: Paling Sedikit') {
      result.sort((a, b) => a.stock - b.stock);
    }

    return result;
  }, [products, searchQuery, sortBy, selectedLevel2, selectedLevel3, level2Options, level3Options]);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) return;
    try {
      await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API delete error, updating state locally:', e);
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* BREADCRUMB / BACK NAVIGATION */}
      <div>
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </Link>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {categoryTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowItemTypeModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-50 transition active:scale-[0.99] shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal size={14} className="text-gray-500" />
            <span>Kelola Item Type</span>
          </button>

          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-black text-white rounded-lg hover:bg-neutral-800 transition active:scale-[0.99] shadow-xs"
          >
            <Plus size={15} />
            <span>Tambah Produk Baru</span>
          </Link>
        </div>
      </div>

      {/* SEARCH & CONTROLS */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari produk ${categoryTitle} berdasarkan nama, SKU, atau sub-kategori...`}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/60 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
            />
          </div>

          {/* Level 2 Category Dropdown (e.g. Tops, Bottoms, Bags, Shoes) */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedLevel2}
              onChange={(e) => {
                setSelectedLevel2(e.target.value);
                setSelectedLevel3('');
              }}
              className="w-full sm:w-44 appearance-none px-3.5 py-2 pr-8 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer shadow-2xs"
            >
              <option value="">Semua Kategori</option>
              {level2Options.map((opt) => (
                <option key={opt.slug} value={opt.slug}>
                  {opt.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Level 3 Item Type Dropdown (Appears only after Level 2 is selected) */}
          {selectedLevel2 && level3Options.length > 0 && (
            <div className="relative w-full sm:w-auto transition-all animate-in fade-in duration-200">
              <select
                value={selectedLevel3}
                onChange={(e) => setSelectedLevel3(e.target.value)}
                className="w-full sm:w-48 appearance-none px-3.5 py-2 pr-8 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer shadow-2xs"
              >
                <option value="">Semua Item Type</option>
                {level3Options.map((opt) => (
                  <option key={opt.slug} value={opt.slug}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-44 appearance-none px-3.5 py-2 pr-8 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer shadow-2xs"
            >
              <option value="Urutan: Terbaru">Urutan: Terbaru</option>
              <option value="Harga: Tertinggi">Harga: Tertinggi</option>
              <option value="Harga: Terendah">Harga: Terendah</option>
              <option value="Stok: Paling Sedikit">Stok: Paling Sedikit</option>
            </select>
            <ArrowUpDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {(searchQuery || selectedLevel2 || selectedLevel3) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLevel2('');
                setSelectedLevel3('');
              }}
              className="text-xs text-gray-500 hover:text-black px-2 py-1 cursor-pointer whitespace-nowrap self-center"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-5 font-bold">PRODUK</th>
                <th className="py-3.5 px-5 font-bold">KATEGORI</th>
                <th className="py-3.5 px-5 font-bold">HARGA SATUAN</th>
                <th className="py-3.5 px-5 font-bold">STOK</th>
                <th className="py-3.5 px-5 font-bold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <Package size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-sm text-gray-800">
                      Tidak ada produk ditemukan untuk kategori {categoryTitle}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchQuery
                        ? `Tidak ada hasil untuk pencarian "${searchQuery}"`
                        : `Belum ada produk yang ditambahkan ke kategori ${categoryTitle}`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Product info: Thumbnail, Name, SKU */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3 min-w-[240px]">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-11 h-11 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="font-bold text-gray-950 hover:underline block truncate"
                          >
                            {p.name}
                          </Link>
                          <span className="text-[11px] font-mono text-gray-400 font-medium tracking-wide">
                            {p.sku}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category: Subcategory */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs">
                          {p.rootCategory || categoryTitle}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {p.category}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="text-gray-500 mr-1 text-[11px]">Rp</span>
                      <span className="font-bold text-gray-950">
                        {p.price.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="font-bold text-gray-900 text-xs">
                        {p.stock} Unit
                      </span>
                    </td>

                    {/* Actions: Edit & Hapus */}
                    <td className="py-4 px-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white text-gray-800 rounded-lg text-xs font-semibold transition shadow-2xs group"
                          title="Edit Produk"
                        >
                          <Edit2 size={13} className="text-gray-500 group-hover:text-white" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg text-xs font-semibold transition cursor-pointer group"
                          title="Hapus Produk"
                        >
                          <Trash2 size={13} className="text-rose-500 group-hover:text-white" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <div>
            Menampilkan <span className="font-bold text-gray-900">{filteredProducts.length}</span> produk
            <span className="text-gray-400"> (kategori: {categoryTitle})</span>
          </div>
        </div>
      </div>

      {/* MODAL KELOLA ITEM TYPE */}
      {showItemTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Kelola Item Type</h3>
                <p className="text-xs text-gray-500">
                  Kategori Utama: <span className="font-semibold text-gray-800">{categoryTitle}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowItemTypeModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Select Level 2 Category */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Pilih Kategori ke-2
                </label>
                <select
                  value={modalMajorSlug}
                  onChange={(e) => setModalMajorSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                >
                  {level2Options.map((opt) => (
                    <option key={opt.slug} value={opt.slug}>
                      {opt.name} ({opt.children?.length || 0} item type)
                    </option>
                  ))}
                </select>
              </div>

              {/* Existing Item Types List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Daftar Item Type ({modalItemTypes.length})
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Kategori: {activeModalMajor?.name}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {modalItemTypes.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      Belum ada item type pada kategori ini
                    </div>
                  ) : (
                    modalItemTypes.map((item) => (
                      <div
                        key={item.slug}
                        className="flex items-center justify-between px-3.5 py-2 bg-gray-50/80 hover:bg-gray-100/80 rounded-lg border border-gray-200/60 transition group"
                      >
                        <div className="flex items-center gap-2">
                          <Tag size={13} className="text-gray-400" />
                          <span className="text-xs font-semibold text-gray-900">{item.name}</span>
                          <span className="text-[10px] font-mono text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                            {item.slug}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteItemType(item.slug, item.name)}
                          disabled={deletingSlug === item.slug}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                          title="Hapus Item Type"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add New Item Type Form */}
              <div className="pt-4 border-t border-gray-100">
                <span className="block text-xs font-bold text-gray-800 mb-2">
                  + Tambah Item Type Baru ke {activeModalMajor?.name}
                </span>
                <form onSubmit={handleAddItemType} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={newItemTypeName}
                      onChange={(e) => {
                        setNewItemTypeName(e.target.value);
                        if (!newItemTypeSlug || newItemTypeSlug === newItemTypeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
                          setNewItemTypeSlug(
                            e.target.value
                              .toLowerCase()
                              .trim()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)+/g, '')
                          );
                        }
                      }}
                      placeholder="Nama Item Type (misal: Vests, Cardigans, Sandals)"
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItemTypeSlug}
                      onChange={(e) => setNewItemTypeSlug(e.target.value)}
                      placeholder="Slug / ID (otomatis)"
                      className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      type="submit"
                      disabled={!newItemTypeName.trim() || modalSubmitting}
                      className="px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition disabled:opacity-40 whitespace-nowrap cursor-pointer"
                    >
                      {modalSubmitting ? 'Menyimpan...' : '+ Tambah'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowItemTypeModal(false)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-2xs cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoryProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-gray-500">
          <RefreshCw size={20} className="animate-spin mx-auto text-gray-400 mb-2" />
          <span>Memuat data produk kategori...</span>
        </div>
      }
    >
      <CategoryProductsContent />
    </Suspense>
  );
}
