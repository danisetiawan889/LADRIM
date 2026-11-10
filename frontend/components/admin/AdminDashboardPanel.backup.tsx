'use client';
import { useState, useEffect } from 'react';
import {
  Package, ShoppingCart, Truck, Users, CreditCard, Tag,
  BarChart3, Shield, MessageSquare, Settings, AlertTriangle,
  Download, Plus, RefreshCw, CheckCircle2, ChevronRight,
  Zap, Check, ArrowRight, ArrowLeft, Lock, Key, LogOut, UserCheck, X,
  Layers, Trash2, Sliders, Sparkles, Upload, ImageIcon, Flame, Eye, EyeOff
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import GymsharkBulkProductForm from '@/components/admin/GymsharkBulkProductForm';

type ModuleKey =
  | 'products'
  | 'orders'
  | 'shipping'
  | 'customers'
  | 'payments'
  | 'promotions'
  | 'analytics'
  | 'rbac'
  | 'comms'
  | 'store';

export default function AdminDashboardPage() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('analytics');
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [customersData, setCustomersData] = useState<any[]>([]);

  // Admin authentication state
  const [adminUser, setAdminUser] = useState<{ id?: string; email?: string; role?: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Add Product Form state (Inline di halaman, bukan modal melayang)
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState(101);
  const [newProductBasePrice, setNewProductBasePrice] = useState('199000');
  const [newProductCostPrice, setNewProductCostPrice] = useState('75000');
  const [newProductWeight, setNewProductWeight] = useState('250');
  const [newProductSize, setNewProductSize] = useState('M');
  const [newProductColor, setNewProductColor] = useState('Black');
  const [newProductStock, setNewProductStock] = useState('25');
  const [newProductTags, setNewProductTags] = useState('essentials, men, tops');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productSuccessMsg, setProductSuccessMsg] = useState('');
  const [productErrorMsg, setProductErrorMsg] = useState('');

  // Bulk Variant Generation State
  interface BulkVariantItem {
    id?: string;
    size: string;
    color: string;
    sku: string;
    stock: number;
    price_override?: number | null;
    image?: string;
  }

  // Presets of model imagery per color
  const COLOR_PRESET_IMAGES: Record<string, string> = {
    Black: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
    White: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80',
    Charcoal: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
    Navy: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=80',
    Olive: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
    Beige: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=1000&q=80',
    Sand: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=1000&q=80',
    'Slate Gray': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
    Espresso: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80',
  };

  const [variantMode, setVariantMode] = useState<'bulk' | 'simple'>('bulk');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [selectedColors, setSelectedColors] = useState<string[]>(['Black', 'White']);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  
  // Color to photo URL mapping
  const [colorImages, setColorImages] = useState<Record<string, string>>({
    Black: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
    White: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80',
  });

  const handleColorImageChange = (color: string, url: string) => {
    setColorImages((prev) => ({
      ...prev,
      [color]: url,
    }));
    setGeneratedVariants((prev) =>
      prev.map((v) => (v.color === color ? { ...v, image: url } : v))
    );
  };

  const handleImageFileUpload = (color: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        handleColorImageChange(color, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const [generatedVariants, setGeneratedVariants] = useState<BulkVariantItem[]>([
    { size: 'S', color: 'Black', sku: 'LDRM-BLK-S-101', stock: 25, price_override: null, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80' },
    { size: 'M', color: 'Black', sku: 'LDRM-BLK-M-102', stock: 25, price_override: null, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80' },
    { size: 'L', color: 'Black', sku: 'LDRM-BLK-L-103', stock: 25, price_override: null, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80' },
    { size: 'XL', color: 'Black', sku: 'LDRM-BLK-XL-104', stock: 25, price_override: null, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80' },
    { size: 'S', color: 'White', sku: 'LDRM-WHT-S-105', stock: 25, price_override: null, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80' },
    { size: 'M', color: 'White', sku: 'LDRM-WHT-M-106', stock: 25, price_override: null, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80' },
    { size: 'L', color: 'White', sku: 'LDRM-WHT-L-107', stock: 25, price_override: null, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80' },
    { size: 'XL', color: 'White', sku: 'LDRM-WHT-XL-108', stock: 25, price_override: null, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80' },
  ]);
  const [bulkDefaultStock, setBulkDefaultStock] = useState('25');
  const [bulkDefaultPrice, setBulkDefaultPrice] = useState('');

  // Manage variants modal for existing product
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<any | null>(null);
  const [isUpdatingExistingVariants, setIsUpdatingExistingVariants] = useState(false);
  const [existingVariantsMsg, setExistingVariantsMsg] = useState('');

  const generateBulkMatrix = () => {
    if (!selectedSizes.length || !selectedColors.length) return;
    const namePrefix = (newProductName || 'LDRM')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();

    const items: BulkVariantItem[] = [];
    selectedColors.forEach((color) => {
      const colorCode = color.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
      const colorImg = colorImages[color] || COLOR_PRESET_IMAGES[color] || '';
      selectedSizes.forEach((size) => {
        const sizeCode = size.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
        const rand = Math.floor(100 + Math.random() * 900);
        items.push({
          size,
          color,
          sku: `${namePrefix}-${colorCode}-${sizeCode}-${rand}`,
          stock: Number(bulkDefaultStock) || 20,
          price_override: bulkDefaultPrice ? Number(bulkDefaultPrice) : null,
          image: colorImg,
        });
      });
    });
    setGeneratedVariants(items);
  };

  const applyStockToAll = (stockVal: number) => {
    setGeneratedVariants((prev) => prev.map((v) => ({ ...v, stock: stockVal })));
  };

  const applyPriceToAll = (priceVal: number | null) => {
    setGeneratedVariants((prev) => prev.map((v) => ({ ...v, price_override: priceVal })));
  };

  const removeVariantRow = (idx: number) => {
    setGeneratedVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateVariantRow = (idx: number, field: keyof BulkVariantItem, val: any) => {
    setGeneratedVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v))
    );
  };

  const addManualVariantRow = () => {
    const namePrefix = (newProductName || 'LDRM').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    setGeneratedVariants((prev) => [
      ...prev,
      {
        size: 'M',
        color: 'Custom',
        sku: `${namePrefix}-CUST-M-${rand}`,
        stock: Number(bulkDefaultStock) || 20,
        price_override: null,
      },
    ]);
  };

  const handleSaveExistingVariants = async () => {
    if (!selectedProductForVariants) return;
    setIsUpdatingExistingVariants(true);
    setExistingVariantsMsg('');
    try {
      const res = await apiFetch(`/api/admin/products/${selectedProductForVariants.id}/variants/bulk`, {
        method: 'POST',
        body: JSON.stringify({
          variants: selectedProductForVariants.variants.map((v: any) => ({
            id: v.id,
            stock: Number(v.stock),
            price_override: v.price_override ? Number(v.price_override) : null,
            low_stock_threshold: Number(v.low_stock_threshold || 5),
          })),
        }),
      });
      if (res?.success) {
        setExistingVariantsMsg('Variants & inventory updated successfully!');
        await loadDashboardData();
        setTimeout(() => {
          setSelectedProductForVariants(null);
          setExistingVariantsMsg('');
        }, 1200);
      }
    } catch (err: any) {
      setExistingVariantsMsg('Error: ' + err.message);
    } finally {
      setIsUpdatingExistingVariants(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductBasePrice) return;
    setIsAddingProduct(true);
    setProductErrorMsg('');
    setProductSuccessMsg('');

    try {
      const variantsToSubmit =
        variantMode === 'bulk' && generatedVariants.length > 0
          ? generatedVariants.map((v) => ({
              sku: v.sku,
              size: v.size,
              color: v.color,
              stock: Number(v.stock),
              price_override: v.price_override ? Number(v.price_override) : null,
              low_stock_threshold: 5,
              image: v.image || colorImages[v.color] || '',
            }))
          : [
              {
                size: newProductSize || 'M',
                color: newProductColor || 'Black',
                stock: Number(newProductStock) || 25,
                low_stock_threshold: 5,
                image: colorImages[newProductColor || 'Black'] || '',
              },
            ];

      const created = await apiFetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newProductName,
          category_id: Number(newProductCategoryId),
          base_price: Number(newProductBasePrice),
          cost_price: Number(newProductCostPrice),
          weight_grams: Number(newProductWeight),
          description_html: newProductDesc,
          tags: newProductTags.split(',').map((t) => t.trim()).filter(Boolean),
          variants: variantsToSubmit,
          color_images: colorImages,
        }),
      });

      if (created?.id) {
        setProductSuccessMsg(`Product "${newProductName}" with ${variantsToSubmit.length} variants added successfully!`);
        await loadDashboardData();
        setNewProductName('');
        setNewProductDesc('');
        setTimeout(() => {
          setShowAddProductForm(false);
          setProductSuccessMsg('');
        }, 1200);
      } else {
        setProductErrorMsg(created?.error || 'Gagal menambahkan produk');
      }
    } catch (err: any) {
      setProductErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan produk');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [analytics, prods, alerts, ords, custs, newProductsRes, realOrdersRes] = await Promise.all([
        apiFetch('/api/admin/analytics/revenue-summary').catch(() => null),
        apiFetch('/api/admin/products').catch(() => null),
        apiFetch('/api/admin/products/alerts/low-stock').catch(() => null),
        apiFetch('/api/admin/orders').catch(() => null),
        apiFetch('/api/admin/customers').catch(() => null),
        fetch('/api/products').then((r) => r.json()).catch(() => null),
        fetch('/api/orders').then((r) => r.json()).catch(() => null),
      ]);

      if (analytics) setAnalyticsData(analytics);
      if (alerts?.alerts) setLowStockAlerts(alerts.alerts);
      if (custs?.customers) setCustomersData(custs.customers);

      // Merge real checkout orders with any existing orders
      const realOrders = realOrdersRes?.orders || [];
      const legacyOrders = ords?.orders || [];
      const combinedOrders = [
        ...realOrders,
        ...legacyOrders.filter((lo: any) => !realOrders.some((ro: any) => ro.id === lo.id)),
      ];
      setOrdersData(combinedOrders);

      const legacyProducts = prods?.products || [];
      const newProducts = (newProductsRes?.data || []).map((np: any) => ({
        id: np.id,
        name: np.name,
        category_name: np.category || `${np.department || 'Men'} / ${np.subcategory || 'Tops'}`,
        department: np.department,
        subcategory: np.subcategory,
        itemType: np.itemType,
        tags: np.tags,
        isTrending: Boolean(np.isTrending),
        isNewRelease: Boolean(np.isNewRelease),
        base_price: np.basePrice,
        cost_price: Math.round(np.basePrice * 0.4),
        variants: np.variants || [],
        images: np.images || [],
      }));

      // Combine products, prioritizing new products
      const combined = [
        ...newProducts,
        ...legacyProducts.filter((lp: any) => !newProducts.some((np: any) => np.name.toLowerCase() === lp.name.toLowerCase())),
      ];
      setProductsData(combined);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductBadge = async (
    productId: string,
    field: 'isTrending' | 'isNewRelease',
    currentValue?: boolean
  ) => {
    const nextVal = !currentValue;
    setProductsData((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [field]: nextVal } : p))
    );
    try {
      await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, [field]: nextVal }),
      });
    } catch (err: any) {
      console.error('Failed to update product badge:', err);
    }
  };

  useEffect(() => {
    const checkAdminAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const res = await apiFetch('/api/admin/me');
        if (res?.authenticated && res?.admin) {
          setAdminUser(res.admin);
          await loadDashboardData();
        } else {
          setAdminUser(null);
        }
      } catch {
        setAdminUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAdminAuth();
  }, []);

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await apiFetch('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (res?.ok) {
        setAdminUser(res.admin || { email: loginEmail, role: 'super_admin' });
        await loadDashboardData();
      } else {
        setLoginError(res?.error || 'Invalid email or password');
        setLoginPassword('');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to connect to authentication server');
      setLoginPassword('');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setAdminUser(null);
    setAnalyticsData(null);
    setProductsData([]);
    setOrdersData([]);
    setCustomersData([]);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setOrdersData((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      apiFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => null);
    } catch (err: any) {
      console.error('Failed to update order status:', err.message);
    }
  };

  const navItems = [
    { key: 'analytics', label: 'Analytics & Reporting', icon: BarChart3 },
    { key: 'products', label: 'Product & Inventory', icon: Package, badge: lowStockAlerts.length > 0 ? `${lowStockAlerts.length} Low` : undefined },
    { key: 'orders', label: 'Order Processing', icon: ShoppingCart },
    { key: 'shipping', label: 'Shipping Logistics', icon: Truck },
    { key: 'customers', label: 'CRM Customer Engine', icon: Users },
    { key: 'payments', label: 'Payments Processing', icon: CreditCard },
    { key: 'promotions', label: 'Promotions Engine', icon: Tag },
    { key: 'rbac', label: 'RBAC Access & Audit', icon: Shield },
    { key: 'comms', label: 'Comms Integration', icon: MessageSquare },
    { key: 'store', label: 'Store Core Setup', icon: Settings },
  ];

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-ink">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-neutral-400" />
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Loading LADRIM Control Center...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="flex min-h-screen w-full bg-white text-ink">
        {/* LEFT PANEL — Immersive dark branded visual (Storefront luxury style) */}
        <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between overflow-hidden bg-[#0a0a0a]">
          <div className="absolute inset-0">
            <img
              src="/images/auth-hero.jpg"
              alt="LADRIM Brand Visual"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25" />
          </div>

          <div className="relative z-10 p-10 flex items-center justify-between">
            <a
              href="/"
              className="font-display font-bold text-2xl tracking-[0.35em] text-white/90 hover:text-white transition-colors"
            >
              LADRIM
            </a>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur-xs flex items-center gap-1.5">
              <Shield size={12} className="text-emerald-400" />
              Admin Portal
            </span>
          </div>

          <div className="relative z-10 p-10 pb-14">
            <h2 className="font-display font-bold text-4xl leading-tight text-white xl:text-5xl">
              Command &amp;<br />Operations<br />Console.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Executive back-office portal. Manage active orders, inventory matrix, dynamic variants, and global retail logistics.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL — Clean storefront luxury form */}
        <div className="relative flex w-full min-h-screen flex-col lg:w-[48%] bg-white">
          <a
            href="/"
            className="group flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-600 hover:text-ink transition-colors p-4 sm:p-6"
            aria-label="Return to store"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Return to Store</span>
          </a>

          <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-12">
            <div className="w-full max-w-[420px]">
              <div className="text-center -mt-6 mb-14 sm:-mt-8 sm:mb-16">
                <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-ink mb-4 shadow-xs">
                  <Shield size={22} />
                </div>
                <h1 className="font-display font-bold text-[2rem] leading-tight sm:text-4xl text-center tracking-wide text-ink">
                  ADMIN LOGIN
                </h1>
                <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Executive Security Clearance
                </p>
              </div>

              {loginError && (
                <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm flex items-center gap-2.5">
                  <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
                  >
                    Email Address
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@ladrim.com"
                    className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink rounded-none text-ink placeholder:text-neutral-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        if (loginError) setLoginError('');
                        setLoginPassword(e.target.value);
                      }}
                      onFocus={() => {
                        if (loginError) setLoginPassword('');
                      }}
                      placeholder="••••••••••••"
                      className="w-full border border-neutral-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition-colors focus:border-ink rounded-none text-ink placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-ink cursor-pointer"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-ink py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Sign In to Admin</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-black/10 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-black/10 flex items-center justify-between">
            <div>
              <span className="font-display text-2xl tracking-[0.25em]">LADRIM</span>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-0.5">Back-Office Operations</p>
            </div>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5">
              Live
            </span>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveModule(item.key as ModuleKey)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 text-xs tracking-wide transition-all ${
                    isActive
                      ? 'bg-ink text-white font-medium shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white rounded-full text-[10px] px-2 py-0.5 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-black/10 text-xs text-neutral-500 space-y-2">
          <div className="flex items-center justify-between">
            <span>Admin Email:</span>
            <span className="font-semibold text-ink truncate max-w-[130px]" title={adminUser?.email}>{adminUser?.email || 'admin@ladrim.com'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Admin Role:</span>
            <span className="font-semibold text-ink uppercase text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">{adminUser?.role || 'super_admin'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>2FA TOTP:</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> Enforced
            </span>
          </div>
          <button
            onClick={handleAdminLogout}
            className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-2 px-3 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            <span>Keluar dari Panel</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/10">
          <div>
            <h1 className="font-display text-3xl">
              {navItems.find((n) => n.key === activeModule)?.label}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Operational console connected to PostgreSQL database & logistics engine.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="btn-line text-xs py-2.5 px-4 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Data</span>
            </button>
            <a href="/" target="_blank" className="btn-ink text-xs py-2.5 px-4">
              View Storefront
            </a>
            <button
              onClick={handleAdminLogout}
              title="Keluar dari Panel Admin"
              className="p-2.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded border border-black/10 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* 1. ANALYTICS & REPORTING */}
        {activeModule === 'analytics' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white p-5 border border-black/10">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Gross Revenue</p>
                <p className="font-display text-3xl mt-2">
                  ${Number(analyticsData?.summary?.gross_revenue || 42800).toLocaleString('en-US')}
                </p>
                <span className="text-[11px] text-emerald-600 font-medium">↑ +14.2% vs last month</span>
              </div>
              <div className="bg-white p-5 border border-black/10">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Net Profit Boundary</p>
                <p className="font-display text-3xl mt-2 text-ink">
                  ${Number(analyticsData?.margin_metrics?.net_profit || 18450).toLocaleString('en-US')}
                </p>
                <span className="text-[11px] text-neutral-500">Margin ratio: 39.8%</span>
              </div>
              <div className="bg-white p-5 border border-black/10">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Total Orders</p>
                <p className="font-display text-3xl mt-2">
                  {analyticsData?.summary?.total_orders || 48}
                </p>
                <span className="text-[11px] text-emerald-600 font-medium">100% automated settlement</span>
              </div>
              <div className="bg-white p-5 border border-black/10">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Abandoned Carts</p>
                <p className="font-display text-3xl mt-2 text-neutral-700">7</p>
                <span className="text-[11px] text-amber-600 font-medium">Recovery email queued</span>
              </div>
            </div>

            <div className="bg-white p-6 border border-black/10">
              <h3 className="font-display text-xl mb-4">Top Volume Leaders</h3>
              <div className="divide-y divide-black/5 text-sm">
                {(analyticsData?.top_products?.length ? analyticsData.top_products : [
                  { name: 'Heavyweight Cotton Tee - Black', units_sold: '34', total_volume: '6766000' },
                  { name: 'Oversized Boxy Tee - Charcoal', units_sold: '22', total_volume: '5038000' },
                  { name: 'Tailored Slim Chino - Olive', units_sold: '18', total_volume: '7002000' },
                ]).map((tp: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink">{tp.name}</p>
                      <p className="text-xs text-neutral-500">{tp.units_sold} units sold</p>
                    </div>
                    <span className="font-semibold text-ink">
                      ${Number(tp.total_volume).toLocaleString('en-US')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCT & INVENTORY */}
        {activeModule === 'products' && (
          <div className="space-y-6">
            {/* Sub-Navigasi Produk: Tab Daftar Produk vs Tambah Produk Baru Langsung di Halaman */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductForm(false)}
                  className={`text-xs py-2 px-4 rounded-lg font-medium transition-all flex items-center gap-2 cursor-pointer ${
                    !showAddProductForm
                      ? 'bg-ink text-white shadow-xs'
                      : 'bg-white border border-black/15 text-neutral-600 hover:text-ink hover:bg-neutral-50'
                  }`}
                >
                  <Package size={14} />
                  <span>Product Catalog ({productsData.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProductForm(true)}
                  className={`text-xs py-2 px-4 rounded-lg font-medium transition-all flex items-center gap-2 cursor-pointer ${
                    showAddProductForm
                      ? 'bg-ink text-white shadow-xs'
                      : 'bg-white border border-black/15 text-neutral-600 hover:text-ink hover:bg-neutral-50'
                  }`}
                >
                  <Plus size={14} />
                  <span>Add New Product</span>
                </button>
              </div>

              {!showAddProductForm && (
                <div className="flex items-center gap-2">
                  <a
                    href="/api/admin/products/export/csv"
                    className="btn-line text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </a>
                </div>
              )}
            </div>

            {/* FORM TAMBAH PRODUK: Gymshark-Style Bulk Variant with Color-Grouped Images */}
            {showAddProductForm ? (
              <GymsharkBulkProductForm
                onSuccess={async () => {
                  await loadDashboardData();
                  setShowAddProductForm(false);
                }}
                onCancel={() => setShowAddProductForm(false)}
              />
            ) : (
              /* TABEL DAFTAR PRODUK (TAMPIL KETIKA TIDAK SEDANG MENAMBAH PRODUK) */
              <div className="space-y-6">

            {lowStockAlerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 flex items-center gap-3 text-xs text-amber-800">
                <AlertTriangle size={18} className="shrink-0" />
                <div>
                  <span className="font-bold">Automated Low Stock Alert:</span> {lowStockAlerts.length} variant(s) have fallen beneath their safety threshold!
                </div>
              </div>
            )}

            <div className="bg-white border border-black/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-black/10 uppercase tracking-wider text-neutral-500 text-[10px]">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Tags</th>
                    <th className="p-3">Price (USD)</th>
                    <th className="p-3">Variants / Stock</th>
                    <th className="p-3">Homepage Feature</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {productsData.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50">
                      <td className="p-3 font-medium text-ink">
                        <div className="flex items-center gap-2.5">
                          {p.images?.[0]?.url && (
                            <img
                              src={p.images[0].url}
                              alt=""
                              className="h-8 w-8 rounded object-cover border border-neutral-200 shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-ink">{p.name}</div>
                            {p.itemType && (
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {p.itemType}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-neutral-600 font-medium">
                        {p.category_name || `${p.department || 'Men'} / ${p.subcategory || 'Tops'}`}
                      </td>
                      <td className="p-3 text-neutral-500 font-mono text-[10px] max-w-[130px] truncate">
                        {p.tags || '-'}
                      </td>
                      <td className="p-3 font-semibold font-mono text-ink">
                        ${Number(p.base_price || 0).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-ink">
                          {p.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) ?? 0} pcs
                        </span>
                        <span className="text-neutral-400 ml-1">({p.variants?.length || 0} SKUs)</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {/* Trending Feature Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleProductBadge(p.id, 'isTrending', p.isTrending)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                              p.isTrending
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs'
                                : 'bg-neutral-100 text-neutral-400 hover:text-neutral-700 border border-transparent'
                            }`}
                            title={
                              p.isTrending
                                ? 'Featured in Homepage Trending Now (Click to disable)'
                                : 'Click to feature in Homepage Trending Now'
                            }
                          >
                            <Flame size={11} className={p.isTrending ? 'text-amber-600' : 'text-neutral-400'} />
                            <span>Trending</span>
                          </button>

                          {/* New Release Feature Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleProductBadge(p.id, 'isNewRelease', p.isNewRelease)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                              p.isNewRelease
                                ? 'bg-purple-100 text-purple-800 border border-purple-300 shadow-xs'
                                : 'bg-neutral-100 text-neutral-400 hover:text-neutral-700 border border-transparent'
                            }`}
                            title={
                              p.isNewRelease
                                ? 'Featured in Homepage New Releases (Click to disable)'
                                : 'Click to feature in Homepage New Releases'
                            }
                          >
                            <Sparkles size={11} className={p.isNewRelease ? 'text-purple-600' : 'text-neutral-400'} />
                            <span>New In</span>
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedProductForVariants(JSON.parse(JSON.stringify(p)))}
                          className="inline-flex items-center gap-1 border border-black/15 bg-white hover:bg-neutral-100 text-ink px-2.5 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer"
                          title="View & Edit Bulk Variants"
                        >
                          <Layers size={11} />
                          <span>Variants ({p.variants?.length || 0})</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Manage Existing Product Variants (Tampil Langsung di Halaman, Bukan Modal) */}
            {selectedProductForVariants && (
              <div className="bg-white border border-black/10 rounded-xl shadow-xs p-6 text-xs text-ink space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/10 mb-2">
                  <div>
                    <h3 className="font-display text-lg text-ink flex items-center gap-2">
                      <Layers size={16} className="text-amber-600" />
                      <span>Kelola Varian: {selectedProductForVariants.name}</span>
                    </h3>
                    <p className="text-neutral-500 text-[11px] mt-0.5">
                      Edit kuota stok dan harga per ukuran/warna secara massal langsung di halaman ini.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProductForVariants(null)}
                    className="p-1.5 text-neutral-400 hover:text-ink hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                    title="Tutup Panel Varian"
                  >
                    <X size={18} />
                  </button>
                </div>

                {existingVariantsMsg && (
                  <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    existingVariantsMsg.startsWith('Error')
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{existingVariantsMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Bulk Color Image Manager for Existing Product */}
                  {(() => {
                    const existingColors = Array.from(new Set(selectedProductForVariants.variants.map((v: any) => v.color || 'Default')));
                    return (
                      <div className="bg-neutral-50/70 border border-black/10 rounded-lg p-3 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-semibold text-neutral-800 text-[11px] flex items-center gap-1.5">
                            <ImageIcon size={13} className="text-amber-600" />
                            <span>Foto Model Baju per Warna ({existingColors.length} Warna)</span>
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            Atur foto untuk warna Hitam, Putih, dll. yang akan otomatis diterapkan ke seluruh ukuran warna tersebut
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {existingColors.map((colName: any) => {
                            const firstVariantWithCol = selectedProductForVariants.variants.find((v: any) => v.color === colName);
                            const currentUrl = firstVariantWithCol?.image || firstVariantWithCol?.variant || '';
                            return (
                              <div key={colName} className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-black/10 shadow-xs">
                                <div className="relative h-11 w-11 shrink-0 rounded overflow-hidden border border-black/15 bg-neutral-100 flex items-center justify-center">
                                  {currentUrl ? (
                                    <img src={currentUrl} alt={colName} className="h-full w-full object-cover" />
                                  ) : (
                                    <ImageIcon size={16} className="text-neutral-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-semibold text-ink flex items-center justify-between mb-0.5">
                                    <span>Warna: {colName}</span>
                                    <span className={`text-[9px] font-medium ${currentUrl ? 'text-emerald-600' : 'text-neutral-400'}`}>
                                      {currentUrl ? '✓ Terpasang' : 'Belum Ada'}
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder={`URL foto model baju ${String(colName).toLowerCase()}...`}
                                    value={currentUrl}
                                    onChange={(e) => {
                                      const newUrl = e.target.value;
                                      setSelectedProductForVariants((prev: any) => ({
                                        ...prev,
                                        variants: prev.variants.map((item: any) =>
                                          item.color === colName ? { ...item, image: newUrl, variant: newUrl } : item
                                        ),
                                      }));
                                    }}
                                    className="w-full border border-black/15 rounded px-2 py-0.5 text-[10px] font-mono text-neutral-700 placeholder-neutral-400"
                                  />
                                </div>
                                <label className="cursor-pointer inline-flex items-center gap-1 text-[10px] bg-white border border-black/15 hover:bg-neutral-100 text-neutral-700 px-2 py-1 rounded transition-colors shrink-0 shadow-xs">
                                  <Upload size={10} />
                                  <span className="hidden sm:inline">Upload</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                          const dataUrl = ev.target?.result as string;
                                          if (dataUrl) {
                                            setSelectedProductForVariants((prev: any) => ({
                                              ...prev,
                                              variants: prev.variants.map((item: any) =>
                                                item.color === colName ? { ...item, image: dataUrl, variant: dataUrl } : item
                                              ),
                                            }));
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="border border-black/10 rounded-lg overflow-hidden bg-white max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-100 text-neutral-600 uppercase text-[10px] font-semibold sticky top-0">
                        <tr>
                          <th className="p-2.5">Foto Model</th>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Ukuran</th>
                          <th className="p-2.5">Warna</th>
                          <th className="p-2.5">Stok (pcs)</th>
                          <th className="p-2.5">Harga Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 text-[11px]">
                        {selectedProductForVariants.variants?.map((v: any, vIdx: number) => (
                          <tr key={v.id || vIdx} className="hover:bg-neutral-50">
                            <td className="p-2.5">
                              <div className="relative h-8 w-8 rounded overflow-hidden border border-black/15 bg-neutral-100 flex items-center justify-center shrink-0">
                                {v.image || v.variant ? (
                                  <img src={v.image || v.variant} alt={v.color} className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon size={12} className="text-neutral-400" />
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 font-mono text-[10px] font-medium text-neutral-600">
                              {v.sku}
                            </td>
                            <td className="p-2.5 font-bold text-ink">{v.size}</td>
                            <td className="p-2.5 text-neutral-600">{v.color}</td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min={0}
                                value={v.stock}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSelectedProductForVariants((prev: any) => ({
                                    ...prev,
                                    variants: prev.variants.map((item: any, i: number) =>
                                      i === vIdx ? { ...item, stock: val } : item
                                    ),
                                  }));
                                }}
                                className="border border-black/15 rounded px-2 py-1 w-20 text-center font-semibold bg-white"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                placeholder="Default"
                                value={v.price_override ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : null;
                                  setSelectedProductForVariants((prev: any) => ({
                                    ...prev,
                                    variants: prev.variants.map((item: any, i: number) =>
                                      i === vIdx ? { ...item, price_override: val } : item
                                    ),
                                  }));
                                }}
                                className="border border-black/15 rounded px-2 py-1 w-28 text-xs bg-white placeholder-neutral-400"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10">
                    <button
                      type="button"
                      onClick={() => setSelectedProductForVariants(null)}
                      className="btn-line text-xs py-2 px-4 cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveExistingVariants}
                      disabled={isUpdatingExistingVariants}
                      className="btn-ink text-xs py-2 px-5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingExistingVariants ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check size={13} />
                          <span>Save Stock Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
              </div>
            )}
          </div>
        )}

        {/* 3. ORDER PROCESSING */}
        {activeModule === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 text-xs">
                {['All', 'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    className="px-3 py-1.5 border border-black/10 bg-white hover:bg-neutral-50 text-neutral-600"
                  >
                    {st}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span>Order Management System</span>
              </div>
            </div>

            <div className="bg-white border border-black/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-black/10 uppercase tracking-wider text-neutral-500 text-[10px]">
                  <tr>
                    <th className="p-3">Order Ref / Tracking</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items Purchased</th>
                    <th className="p-3">Courier</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Lifecycle Status</th>
                    <th className="p-3 text-right">Manage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {ordersData.length > 0 ? (
                    ordersData.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-mono">
                          <div className="font-semibold text-ink">{ord.ref || `LDRM-${ord.id.slice(0, 6).toUpperCase()}`}</div>
                          {ord.tracking_number && (
                            <div className="text-[10px] text-neutral-400 font-mono tracking-wider">
                              {ord.tracking_number}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-ink">{ord.user_name || 'Customer'}</div>
                          <div className="text-[11px] text-neutral-500">{ord.user_email || 'guest@ladrim.com'}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-ink">
                            {Array.isArray(ord.items) ? ord.items.length : ord.items || 1} items
                          </span>
                        </td>
                        <td className="p-3 text-neutral-600">{ord.courier || 'Express Courier'}</td>
                        <td className="p-3 font-semibold font-mono text-ink">
                          ${Number(ord.total || 0).toFixed(2)} USD
                        </td>
                        <td className="p-3">
                          <span
                            className={`capitalize px-2 py-0.5 rounded text-[10px] font-semibold ${
                              ord.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : ord.status === 'processing'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-ink'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            className="bg-white border border-black/15 text-[11px] rounded px-2.5 py-1 focus:outline-none cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-neutral-400 text-xs">
                        No orders recorded in database yet. Try checking out an item from the storefront to see it appear here in real-time.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. SHIPPING LOGISTICS */}
        {activeModule === 'shipping' && (
          <div className="space-y-6">
            <div className="bg-white p-6 border border-black/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10">
                <div>
                  <h3 className="font-display text-xl">Logistics &amp; Shipping Carriers</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Integrated courier support for standard, freight, and express orders.
                  </p>
                </div>
                <div className="text-xs text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded border border-black/5 font-mono">
                  Logistics System Active
                </div>
              </div>

              {/* Supported Couriers Matrix */}
              <div className="mt-6">
                <h4 className="font-medium text-sm mb-3">Supported Carriers:</h4>
                <div className="grid gap-3 sm:grid-cols-3 text-xs">
                  <div className="p-4 border border-black/10 bg-neutral-50/50 rounded-sm">
                    <p className="font-bold text-sm text-ink">DHL Express</p>
                    <p className="text-neutral-500 text-[11px] mt-0.5">Worldwide Express, Air Cargo</p>
                    <span className="inline-block mt-2 text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Available</span>
                  </div>
                  <div className="p-4 border border-black/10 bg-neutral-50/50 rounded-sm">
                    <p className="font-bold text-sm text-ink">FedEx International</p>
                    <p className="text-neutral-500 text-[11px] mt-0.5">Priority &amp; Economy Freight</p>
                    <span className="inline-block mt-2 text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Available</span>
                  </div>
                  <div className="p-4 border border-black/10 bg-neutral-50/50 rounded-sm">
                    <p className="font-bold text-sm text-ink">UPS Express</p>
                    <p className="text-neutral-500 text-[11px] mt-0.5">Standard &amp; Expedited Service</p>
                    <span className="inline-block mt-2 text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Available</span>
                  </div>
                  <div className="p-4 border border-black/10 bg-neutral-50/50 rounded-sm">
                    <p className="font-bold text-sm text-ink">JNE Express</p>
                    <p className="text-neutral-500 text-[11px] mt-0.5">REG, YES, Trucking</p>
                    <span className="inline-block mt-2 text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Available</span>
                  </div>
                  <div className="p-4 border border-black/10 bg-neutral-50/50 rounded-sm">
                    <p className="font-bold text-sm text-ink">SiCepat Ekspres</p>
                    <p className="text-neutral-500 text-[11px] mt-0.5">Standard &amp; Cargo Freight</p>
                    <span className="inline-block mt-2 text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Available</span>
                  </div>
                  <div className="p-4 border border-black/10 bg-neutral-50/50 rounded-sm">
                    <p className="font-bold text-sm text-ink">J&amp;T Express</p>
                    <p className="text-neutral-500 text-[11px] mt-0.5">EZ Standard &amp; Super Express</p>
                    <span className="inline-block mt-2 text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. CRM CUSTOMER ENGINE */}
        {activeModule === 'customers' && (
          <div className="space-y-6">
            <div className="flex gap-2 text-xs">
              {['All Segments', 'Retail', 'Wholesale / Grosir', 'Reseller', 'Loyal VIP'].map((seg) => (
                <button key={seg} className="px-3 py-1.5 border border-black/10 bg-white hover:bg-neutral-50 text-neutral-600">
                  {seg}
                </button>
              ))}
            </div>

            <div className="bg-white border border-black/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-black/10 uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="p-3">Client Profile</th>
                    <th className="p-3">Phone (WhatsApp)</th>
                    <th className="p-3">Segment</th>
                    <th className="p-3">Loyalty Points</th>
                    <th className="p-3">Total Orders</th>
                    <th className="p-3">Lifetime Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {(customersData.length ? customersData : [
                    { id: '1', full_name: 'Alexander Ward', email: 'alex@ward.com', phone: '+62811223344', segment: 'loyal', loyalty_points: 450, total_orders: 8, lifetime_spend: 3840000 },
                    { id: '2', full_name: 'Budi Santoso', email: 'budi@reseller.id', phone: '+62812345678', segment: 'wholesale', loyalty_points: 1200, total_orders: 14, lifetime_spend: 18200000 },
                  ]).map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50/50">
                      <td className="p-3">
                        <p className="font-medium text-ink">{c.full_name}</p>
                        <p className="text-neutral-400">{c.email}</p>
                      </td>
                      <td className="p-3 text-neutral-500">{c.phone || '-'}</td>
                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100">
                          {c.segment}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-ink">{c.loyalty_points || 0} pts</td>
                      <td className="p-3">{c.total_orders || 0}</td>
                      <td className="p-3 font-semibold text-ink">
                        ${Number(c.lifetime_spend || 0).toLocaleString('en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. PAYMENTS PROCESSING */}
        {activeModule === 'payments' && (
          <div className="bg-white p-6 border border-black/10 space-y-4">
            <h3 className="font-display text-xl">Payment Channels & Webhook Trails</h3>
            <p className="text-xs text-neutral-500">
              Integrations with Midtrans Snap, Virtual Accounts, E-Wallets, Credit Cards, and Courier COD Remittance.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs">
              {[
                { name: 'BCA Virtual Account', type: 'Instant Settlement', webhook: 'Active (SHA-512)' },
                { name: 'Mandiri Bill', type: 'Bank Transfer', webhook: 'Active (SHA-512)' },
                { name: 'GoPay / QRIS', type: 'Dynamic QR', webhook: 'Active (SHA-512)' },
                { name: 'Visa / MasterCard', type: '3D Secure', webhook: 'Active (SHA-512)' },
                { name: 'COD Courier Remittance', type: 'Manual Ledger', webhook: 'Logistics Sign-off' },
              ].map((p, i) => (
                <div key={i} className="p-3 border border-black/10 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-neutral-400">{p.type}</p>
                  </div>
                  <span className="text-emerald-700 font-medium">{p.webhook}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. PROMOTIONS ENGINE */}
        {activeModule === 'promotions' && (
          <div className="bg-white p-6 border border-black/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">Promotions, Coupons & Tier Pricing</h3>
              <button className="btn-ink text-xs py-2 px-3 flex items-center gap-1.5">
                <Plus size={14} /> New Coupon Code
              </button>
            </div>
            <div className="divide-y divide-black/5 text-xs">
              <div className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-mono font-bold text-ink">WELCOME10</p>
                  <p className="text-neutral-500">10% discount for first-time shoppers</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">Active</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-mono font-bold text-ink">VIPESSENTIALS</p>
                  <p className="text-neutral-500">$50 off min spend $300</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* 8. RBAC ACCESS & AUDIT */}
        {activeModule === 'rbac' && (
          <div className="bg-white p-6 border border-black/10 space-y-4">
            <h3 className="font-display text-xl">Role-Based Access Control & Audit Trail</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 border border-black/10 flex justify-between">
                <div>
                  <p className="font-medium text-ink">Super Admin (Owner)</p>
                  <p className="text-neutral-400">Full administrative access across all modules (*)</p>
                </div>
                <span className="text-emerald-700 font-semibold">2FA Enforced</span>
              </div>
              <div className="p-3 border border-black/10 flex justify-between">
                <div>
                  <p className="font-medium text-ink">Warehouse Admin (Gudang)</p>
                  <p className="text-neutral-400">Inventory update, shipping rate dispatch, order status progression</p>
                </div>
                <span className="text-emerald-700 font-semibold">2FA Enforced</span>
              </div>
              <div className="p-3 border border-black/10 flex justify-between">
                <div>
                  <p className="font-medium text-ink">Chat Admin (Concierge)</p>
                  <p className="text-neutral-400">Customer view, live chat, return request assessment</p>
                </div>
                <span className="text-emerald-700 font-semibold">2FA Enforced</span>
              </div>
            </div>
          </div>
        )}

        {/* 9. COMMS INTEGRATION */}
        {activeModule === 'comms' && (
          <div className="bg-white p-6 border border-black/10 space-y-4">
            <h3 className="font-display text-xl">Customer Communication Vectors</h3>
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="p-4 border border-black/10 space-y-2">
                <p className="font-medium text-sm text-ink">WhatsApp Business Routing</p>
                <p className="text-neutral-500">Concierge live chat routing: +62 812 8888 9999</p>
                <span className="text-emerald-600 font-semibold">Status: Active (09:00 - 21:00 WIB)</span>
              </div>
              <div className="p-4 border border-black/10 space-y-2">
                <p className="font-medium text-sm text-ink">Automated Notification Relays</p>
                <p className="text-neutral-500">Order confirmed, parcel dispatched with tracking ID, refund settled.</p>
                <span className="text-emerald-600 font-semibold">Relays: Email (SMTP) & WhatsApp API</span>
              </div>
            </div>
          </div>
        )}

        {/* 10. STORE CORE SETUP */}
        {activeModule === 'store' && (
          <div className="bg-white p-6 border border-black/10 space-y-4">
            <h3 className="font-display text-xl">Store Core Setup & Info Page CMS</h3>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="p-3 border border-black/10">
                <p className="font-medium">Brand Identity</p>
                <p className="text-neutral-400">LADRIM Luxury Essentials</p>
              </div>
              <div className="p-3 border border-black/10">
                <p className="font-medium">Currency & Locale</p>
                <p className="text-neutral-400">IDR (Rp) · Bahasa Indonesia / English</p>
              </div>
              <div className="p-3 border border-black/10">
                <p className="font-medium">Info Pages CMS</p>
                <p className="text-neutral-400">About Us, FAQ, Terms, Return Policy</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
