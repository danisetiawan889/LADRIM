'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  Package,
  X,
  ExternalLink,
  RefreshCw,
  FolderTree,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  subcategories: string[];
  isActive: boolean;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: '1',
    name: 'Men',
    slug: 'men',
    productCount: 5,
    subcategories: ['Atasan Pria', 'Bawahan Pria', 'Shoes'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Women',
    slug: 'women',
    productCount: 1,
    subcategories: ['Atasan Wanita', 'Bottoms', 'Shoes'],
    isActive: true,
  },
  {
    id: '3',
    name: 'Accessories',
    slug: 'accessories',
    productCount: 1,
    subcategories: ['Tas & Ransel', 'Belts', 'Eyewear'],
    isActive: true,
  },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCategories = () => {
    setLoading(true);
    apiFetch('/api/admin/categories')
      .then((res: any) => {
        if (res?.categories && Array.isArray(res.categories) && res.categories.length > 0) {
          const mapped = res.categories.map((c: any) => ({
            id: String(c.id),
            name: c.name,
            slug: c.slug,
            productCount: Number(c.product_count || 0),
            subcategories: Array.isArray(c.subcategories) && c.subcategories.length > 0
              ? c.subcategories
              : ['Semua Item', 'Koleksi Musim Ini'],
            isActive: true,
          }));
          setCategories(mapped);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch categories from API, using defaults:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const catName = newCatName.trim();
    const catSlug =
      newCatSlug.trim() ||
      catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    try {
      const res = await apiFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: catName, slug: catSlug }),
      });
      if (res?.category) {
        setCategories((prev) => [
          ...prev,
          {
            id: String(res.category.id),
            name: res.category.name,
            slug: res.category.slug,
            productCount: 0,
            subcategories: [],
            isActive: true,
          },
        ]);
      } else {
        loadCategories();
      }
    } catch {
      // Local fallback
      const newCat: CategoryItem = {
        id: `c-${Date.now()}`,
        name: catName,
        slug: catSlug,
        productCount: 0,
        subcategories: [],
        isActive: true,
      };
      setCategories((prev) => [...prev, newCat]);
    }

    setNewCatName('');
    setNewCatSlug('');
    setShowAddModal(false);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    } catch {}
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalAllProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Category Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-black text-white rounded-lg hover:bg-neutral-800 transition shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-2xs flex items-center gap-3">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories (e.g. Men, Women, Accessories)..."
          className="w-full text-xs text-gray-900 bg-transparent focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* CATEGORIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
                  <Layers size={18} />
                </div>
                <h3 className="font-bold text-base text-gray-950 tracking-tight">{cat.name}</h3>
              </div>

              <span className="text-xs font-bold text-gray-900 bg-gray-100 border border-gray-200/60 px-2.5 py-1 rounded-full">
                {cat.productCount} Products
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <Link
                href={`/admin/categories/${cat.slug || cat.name.toLowerCase()}`}
                className="flex-1 font-semibold text-xs bg-black text-white hover:bg-neutral-800 px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs group"
              >
                <span>View Products</span>
                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              {/* Delete button (only allow deletion for custom added categories, not default 1, 2, 3) */}
              {!['1', '2', '3'].includes(String(cat.id)) && (
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ADD CATEGORY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900">Add New Category</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add a new core category into the LADRIM catalog
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (!newCatSlug || newCatSlug === newCatName.toLowerCase().replace(/\s+/g, '-')) {
                      setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                    }
                  }}
                  placeholder="e.g. Footwear, Outerwear, Kids"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Slug URL
                </label>
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="e.g. footwear, outerwear, kids"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs font-mono focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCatName.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
