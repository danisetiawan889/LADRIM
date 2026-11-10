'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  ArrowUpDown,
  RefreshCw,
  Package,
  Edit2,
  Trash2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ProductDisplayItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  rootCategory: string;
  price: number;
  stock: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock';
  status: 'Active' | 'Draft' | 'Out of Stock';
  createdAt: string;
  image: string;
}

const DEFAULT_PRODUCTS: ProductDisplayItem[] = [
  {
    id: 'p-1',
    name: 'Heavyweight Minimalist T-Shirt',
    sku: 'LDR-TSHIRT-01',
    category: 'T-Shirts',
    rootCategory: 'Men',
    price: 45,
    stock: 48,
    stockStatus: 'In Stock',
    status: 'Active',
    createdAt: 'Oct 12, 2024',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'p-2',
    name: 'Raw Linen Structured Blazer',
    sku: 'LDR-BLZR-04',
    category: 'Women Tops',
    rootCategory: 'Women',
    price: 160,
    stock: 4,
    stockStatus: 'Critical',
    status: 'Active',
    createdAt: 'Oct 08, 2024',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'p-3',
    name: 'Full-Grain Leather Cardholder',
    sku: 'LDR-CRD-11',
    category: 'Bags & Backpacks',
    rootCategory: 'Accessories',
    price: 65,
    stock: 19,
    stockStatus: 'Low Stock',
    status: 'Active',
    createdAt: 'Sep 29, 2024',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'p-4',
    name: 'Minimalist Relaxed Fit Chino Pants',
    sku: 'LDR-CHIN-08',
    category: 'Men Bottoms',
    rootCategory: 'Men',
    price: 85,
    stock: 25,
    stockStatus: 'In Stock',
    status: 'Active',
    createdAt: 'Sep 15, 2024',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'p-5',
    name: 'Canvas Daypack Utility Tote',
    sku: 'LDR-BAG-02',
    category: 'Bags & Backpacks',
    rootCategory: 'Accessories',
    price: 75,
    stock: 82,
    stockStatus: 'In Stock',
    status: 'Active',
    createdAt: 'Sep 02, 2024',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'p-6',
    name: 'Relaxed Silk Knit Cardigan',
    sku: 'LDR-KNT-09',
    category: 'Women Tops',
    rootCategory: 'Women',
    price: 95,
    stock: 30,
    stockStatus: 'In Stock',
    status: 'Draft',
    createdAt: 'Aug 24, 2024',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=300&q=80',
  },
];

function ProductsContent() {
  const [products, setProducts] = useState<ProductDisplayItem[]>(DEFAULT_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [loading, setLoading] = useState(true);

  // Sync with API - fetch all products
  useEffect(() => {
    setLoading(true);
    const url = '/api/admin/products';
    apiFetch(url)
      .then((res: any) => {
        if (res?.products && Array.isArray(res.products) && res.products.length > 0) {
          const apiProducts: ProductDisplayItem[] = res.products.map((p: any) => {
            const stock = Number(p.total_stock ?? (p.variants?.[0]?.stock || 0));
            let stockStatus: 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock' = 'In Stock';
            if (stock === 0) stockStatus = 'Out of Stock';
            else if (stock <= 5) stockStatus = 'Critical';
            else if (stock <= 20) stockStatus = 'Low Stock';

            let status: 'Active' | 'Draft' | 'Out of Stock' = p.is_active ? 'Active' : 'Draft';
            if (stock === 0) status = 'Out of Stock';

            const sku = p.variants?.[0]?.sku || `LDR-${p.slug?.slice(0, 4)?.toUpperCase() || 'PROD'}-01`;
            const dateStr = p.created_at
              ? new Date(p.created_at).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Oct 10, 2024';

            return {
              id: p.id,
              name: p.name,
              sku,
              category: p.category_name || 'General Collection',
              rootCategory: p.root_category || p.department || 'Men',
              price: Number(p.base_price || 49),
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
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        const matchesRoot = p.rootCategory?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesCat && !matchesRoot) return false;
      }

      return true;
    });

    if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Stock: Lowest First') {
      result.sort((a, b) => a.stock - b.stock);
    }

    return result;
  }, [products, searchQuery, sortBy]);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API delete error, updating state locally:', e);
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Product Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Add New Product Button */}
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-black text-white rounded-lg hover:bg-neutral-800 transition active:scale-[0.99] shadow-xs"
          >
            <Plus size={15} />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* 2 STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {/* Card 1: Total Products */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Total Products</span>
            <div className="w-2 h-2 rounded-full bg-black" />
          </div>
          <div className="flex items-baseline justify-between gap-2 mt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-gray-950">
                {filteredProducts.length}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                registered products
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
              Store Catalog
            </span>
          </div>
        </div>

        {/* Card 2: Core Categories */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Core Categories</span>
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>
          <div className="flex items-baseline justify-between gap-2 mt-1">
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-950">
                Men · Women · Accessories
              </span>
              <p className="text-xs text-gray-500 font-medium mt-0.5">3 Catalog Hierarchy Pillars</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & CONTROLS */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, or category..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50/60 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-48 appearance-none px-3.5 py-2 pr-8 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer shadow-2xs"
            >
              <option value="Newest">Sort: Newest</option>
              <option value="Price: High to Low">Price: High to Low</option>
              <option value="Price: Low to High">Price: Low to High</option>
              <option value="Stock: Lowest First">Stock: Lowest First</option>
            </select>
            <ArrowUpDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-500 hover:text-black px-2 py-1 cursor-pointer"
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
                <th className="py-3.5 px-5 font-bold">PRODUCT</th>
                <th className="py-3.5 px-5 font-bold">CATEGORY</th>
                <th className="py-3.5 px-5 font-bold">PRICE</th>
                <th className="py-3.5 px-5 font-bold">STOCK</th>
                <th className="py-3.5 px-5 font-bold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <Package size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-sm text-gray-800">No products found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchQuery
                        ? `No products matching "${searchQuery}"`
                        : 'No products in catalog yet'}
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

                    {/* Category: Root + Subcategory */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs">
                          {p.rootCategory || 'Collection'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {p.category}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="font-bold text-gray-950">
                        ${Number(p.price).toLocaleString('en-US', { minimumFractionDigits: p.price % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="font-bold text-gray-900 text-xs">
                        {p.stock} Units
                      </span>
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="py-4 px-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white text-gray-800 rounded-lg text-xs font-semibold transition shadow-2xs group"
                          title="Edit Product"
                        >
                          <Edit2 size={13} className="text-gray-500 group-hover:text-white" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg text-xs font-semibold transition cursor-pointer group"
                          title="Delete Product"
                        >
                          <Trash2 size={13} className="text-rose-500 group-hover:text-white" />
                          <span>Delete</span>
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
            Showing <span className="font-bold text-gray-900">{filteredProducts.length}</span> products
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-gray-500">
          <RefreshCw size={20} className="animate-spin mx-auto text-gray-400 mb-2" />
          <span>Loading products...</span>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
