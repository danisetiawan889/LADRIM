'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Package,
  User,
  LogOut,
  ChevronDown,
  ChevronUp,
  Clock,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Mail,
  RefreshCw,
  Edit2,
  ShieldCheck,
  Check,
  ArrowRight,
  X,
  Heart,
  MapPin,
  RotateCcw,
  Users,
  HelpCircle,
  ChevronRight,
  Plus,
  Trash2,
  Truck,
  Box,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { lux } from '@/lib/motion';
import { apiFetch } from '@/lib/api';
import OrderTracker, { TrackingData } from '@/components/tracking/OrderTracker';
import GymsharkStyleFooter from '@/components/Footer';
import Header from '@/components/Header';
import { useCart } from '@/context/CartContext';
import { useSavedArchive } from '@/context/SavedArchiveContext';

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  segment: string;
  loyalty_points: number;
  created_at: string;
  addresses?: any[];
};

type OrderItem = {
  variant_id: string;
  name: string;
  size: string;
  color: string;
  sku: string;
  qty: number;
  unit_price: number;
  image?: string;
};

type UserOrder = {
  id: string;
  tracking_number: string | null;
  courier: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  created_at: string;
  items: OrderItem[];
  tracking: TrackingData;
};

export type AddressItem = {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};

export type ReturnRequest = {
  id: string;
  orderNumber: string;
  productName: string;
  reason: string;
  notes?: string;
  status: string;
  date: string;
};

// Rich default fallback orders for demonstration & interactive tracking
const defaultDemoOrders: UserOrder[] = [
  {
    id: 'ord-892401',
    tracking_number: 'LDRM-892401',
    courier: 'DHL Express Airway',
    status: 'In Transit',
    total: 110.0,
    subtotal: 92.5,
    shipping_cost: 17.5,
    created_at: '2026-10-20T10:30:00Z',
    items: [
      {
        variant_id: 'mt-polo-1',
        name: 'Hybrid Loose Shorts - Black',
        size: 'Medium (M)',
        color: 'Black',
        sku: 'LDRM-HLS-BLK-M',
        qty: 1,
        unit_price: 55.0,
        image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=400&q=80',
      },
      {
        variant_id: 'mt-tee-2',
        name: 'Heavyweight Minimalist Tee - Off White',
        size: 'Large (L)',
        color: 'Off White',
        sku: 'LDRM-HMT-WHT-L',
        qty: 1,
        unit_price: 37.5,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
      },
    ],
    tracking: {
      order_id: 'ord-892401',
      tracking_number: 'LDRM-892401',
      courier: 'DHL Express',
      current_state: 'SHIPPED',
      state_index: 2,
      ui_title: 'Handed to Courier / In Transit',
      ui_description: 'Parcel handed over to DHL Express courier and in transit to delivery address.',
      updated_at: '2026-10-21T09:15:00Z',
      steps: [
        { state: 'ORDERED', label: 'Order Received', step_number: 1, is_completed: true, is_current: false },
        { state: 'SHIPPED', label: 'Packaging QC', step_number: 2, is_completed: true, is_current: false },
        { state: 'IN_CUSTOMS', label: 'Handed to Courier', step_number: 3, is_completed: true, is_current: true },
        { state: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', step_number: 4, is_completed: false, is_current: false },
        { state: 'DELIVERED', label: 'Delivered', step_number: 5, is_completed: false, is_current: false },
      ],
      history: [
        { raw_status: 'Parcel arrived at transit sorting facility', mapped_state: 'SHIPPED', location: 'Jakarta Gateway Hub', event_time: '2026-10-21 09:15' },
        { raw_status: 'Parcel handed over to logistics carrier', mapped_state: 'SHIPPED', location: 'LADRIM Central Hub', event_time: '2026-10-20 18:30' },
        { raw_status: 'Order packed & passed luxury QC inspection', mapped_state: 'SHIPPED', location: 'LADRIM Fulfillment Warehouse', event_time: '2026-10-20 14:00' },
        { raw_status: 'Payment verified & order processing initiated', mapped_state: 'ORDERED', location: 'Payment Gateway', event_time: '2026-10-20 10:30' },
      ],
    },
  },
  {
    id: 'ord-771203',
    tracking_number: 'LDRM-771203',
    courier: 'FedEx Express Global',
    status: 'Completed',
    total: 145.0,
    subtotal: 145.0,
    shipping_cost: 0.0,
    created_at: '2026-10-12T11:00:00Z',
    items: [
      {
        variant_id: 'bag-tot-1',
        name: 'Structured Leather Tote - Noir',
        size: 'One Size',
        color: 'Noir',
        sku: 'LDRM-SLT-NOIR',
        qty: 1,
        unit_price: 145.0,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80',
      },
    ],
    tracking: {
      order_id: 'ord-771203',
      tracking_number: 'LDRM-771203',
      courier: 'FedEx Express',
      current_state: 'DELIVERED',
      state_index: 4,
      ui_title: 'Order Delivered',
      ui_description: 'Parcel successfully delivered to the recipient.',
      updated_at: '2026-10-15T15:40:00Z',
      steps: [
        { state: 'ORDERED', label: 'Order Received', step_number: 1, is_completed: true, is_current: false },
        { state: 'SHIPPED', label: 'Packaging QC', step_number: 2, is_completed: true, is_current: false },
        { state: 'IN_CUSTOMS', label: 'Handed to Courier', step_number: 3, is_completed: true, is_current: false },
        { state: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', step_number: 4, is_completed: true, is_current: false },
        { state: 'DELIVERED', label: 'Delivered', step_number: 5, is_completed: true, is_current: true },
      ],
      history: [
        { raw_status: 'Parcel successfully delivered to recipient', mapped_state: 'DELIVERED', location: 'Bandung, West Java', event_time: '2026-10-15 15:40' },
        { raw_status: 'Courier is out for final delivery', mapped_state: 'OUT_FOR_DELIVERY', location: 'Bandung Delivery Hub', event_time: '2026-10-15 08:30' },
        { raw_status: 'Parcel arrived at destination courier hub', mapped_state: 'IN_CUSTOMS', location: 'Bandung Central Station', event_time: '2026-10-14 19:20' },
        { raw_status: 'Order packed in luxury LADRIM signature box', mapped_state: 'SHIPPED', location: 'LADRIM Central Warehouse', event_time: '2026-10-12 14:10' },
      ],
    },
  },
];

const defaultInitialAddresses: AddressItem[] = [];

export default function AccountPage() {
  const router = useRouter();
  const { add: addToCart, openCart } = useCart();
  const { savedItems, count: savedCount, removeSaved } = useSavedArchive();

  // Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Mode: 'login' | 'register' | 'otp'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'otp'>('login');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const LOCKOUT_MSG = 'Too many failed login attempts. Please wait 3 minutes before trying again.';

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isPwFocused, setIsPwFocused] = useState(false);

  // Dynamic Password Validation Checklist
  const pwChecks = useMemo(() => ({
    minLength: regPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(regPassword),
    hasNumber: /[0-9]/.test(regPassword),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(regPassword),
  }), [regPassword]);

  // Automatically true when all 4 criteria are fulfilled
  const allPwChecksMet = useMemo(() => {
    return Object.values(pwChecks).every(Boolean);
  }, [pwChecks]);

  // OTP Verification inputs
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Active Modals & Views
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<UserOrder | null>(null);

  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [showConciergeModal, setShowConciergeModal] = useState(false);

  // Address Book state (starts empty for new accounts)
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrDefault, setAddrDefault] = useState(false);

  // Returns state (starts empty for new accounts)
  const [returnsList, setReturnsList] = useState<ReturnRequest[]>([]);
  const [returnOrderNum, setReturnOrderNum] = useState('');
  const [returnItemName, setReturnItemName] = useState('');
  const [returnReason, setReturnReason] = useState('Size too small / large');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  // User orders list (strictly real user orders, 0 for new accounts)
  const displayOrders = orders;

  // Load saved addresses and returns from localStorage on client mount (filter out legacy dummy items)
  useEffect(() => {
    try {
      const storedAddr = localStorage.getItem('ladrim.addresses');
      if (storedAddr) {
        const parsed = JSON.parse(storedAddr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((a: any) => a.id !== 'addr-1' && a.name !== 'Dani Setiawan');
          setAddresses(clean);
        }
      }
      const storedReturns = localStorage.getItem('ladrim.returns');
      if (storedReturns) {
        const parsed = JSON.parse(storedReturns);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((r: any) => r.id !== 'RET-89241');
          setReturnsList(clean);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist addresses
  const saveAddressesToStorage = (list: AddressItem[]) => {
    setAddresses(list);
    try {
      localStorage.setItem('ladrim.addresses', JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  // Persist returns
  const saveReturnsToStorage = (list: ReturnRequest[]) => {
    setReturnsList(list);
    try {
      localStorage.setItem('ladrim.returns', JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  // Handle Add New Address
  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName.trim() || !addrLine1.trim() || !addrCity.trim()) return;

    const newAddr: AddressItem = {
      id: `addr-${Date.now()}`,
      name: addrName.trim(),
      phone: addrPhone.trim(),
      addressLine1: addrLine1.trim(),
      addressLine2: addrLine2.trim() || undefined,
      city: addrCity.trim(),
      province: addrProvince.trim(),
      postalCode: addrPostal.trim(),
      isDefault: addrDefault || addresses.length === 0,
    };

    let updatedList = addresses;
    if (newAddr.isDefault) {
      updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
    }
    updatedList = [newAddr, ...updatedList];

    saveAddressesToStorage(updatedList);
    setIsAddingAddress(false);
    // Reset form
    setAddrName('');
    setAddrPhone('');
    setAddrLine1('');
    setAddrLine2('');
    setAddrCity('');
    setAddrProvince('');
    setAddrPostal('');
    setAddrDefault(false);
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    saveAddressesToStorage(updated);
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    saveAddressesToStorage(updated);
  };

  // Handle Submit Return
  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const orderNo = returnOrderNum || displayOrders[0]?.tracking_number || displayOrders[0]?.id || `ORD-${Date.now()}`;
    const item = returnItemName.trim() || displayOrders[0]?.items[0]?.name || 'Purchased Item';

    const newTicket: ReturnRequest = {
      id: `RET-${Math.floor(10000 + Math.random() * 90000)}`,
      orderNumber: orderNo,
      productName: item,
      reason: returnReason,
      notes: returnNotes.trim() || undefined,
      status: 'Pickup Scheduled (Courier Will Collect)',
      date: new Date().toISOString().split('T')[0],
    };

    const updated = [newTicket, ...returnsList];
    saveReturnsToStorage(updated);
    setReturnSuccessMsg(`Return request ${newTicket.id} submitted! Our courier will collect the package.`);
    setReturnNotes('');
    setTimeout(() => setReturnSuccessMsg(''), 4000);
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Check initial login status and prefetch home for instant back navigation
  useEffect(() => {
    router.prefetch('/');
    checkAuth();
  }, [router]);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setOrders(data.orders || []);
          if (data.user.full_name && addresses.length > 0) {
            setAddrName(data.user.full_name);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const lockoutDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showLockoutError = () => {
    if (lockoutDismissTimerRef.current) {
      clearTimeout(lockoutDismissTimerRef.current);
    }
    setFormError(LOCKOUT_MSG);
    lockoutDismissTimerRef.current = setTimeout(() => {
      setFormError('');
    }, 7000);
  };

  useEffect(() => {
    return () => {
      if (lockoutDismissTimerRef.current) clearTimeout(lockoutDismissTimerRef.current);
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      showLockoutError();
      return;
    }
    setFormError('');
    setSubmitting(true);

    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      await checkAuth();
      const targetUrl = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('redirect') || '/') : '/';
      window.location.href = targetUrl;
    } catch (err: any) {
      if (err.remainingSec || (err.message && err.message.toLowerCase().includes('too many failed login attempts'))) {
        setIsLocked(true);
        showLockoutError();
        const timeoutMs = (Number(err.remainingSec) || 180) * 1000;
        setTimeout(() => {
          setIsLocked(false);
        }, timeoutMs);
      } else {
        setFormError(err.message || 'Incorrect email or password');
      }
      setLoginPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    // Password complexity validation
    if (regPassword.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(regPassword)) {
      setFormError('Password must contain at least 1 uppercase letter (A-Z)');
      return;
    }
    if (!/[0-9]/.test(regPassword)) {
      setFormError('Password must contain at least 1 number (0-9)');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(regPassword)) {
      setFormError('Password must contain at least 1 special character (e.g. _, ., !, @, #, $)');
      return;
    }

    setSubmitting(true);

    try {
      const fullName = `${regFirstName} ${regLastName}`.trim();
      const res = await apiFetch<any>('/api/auth/register/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          fullName,
        }),
      });

      setAuthMode('otp');
      setOtpCode('');
      setFormError('');
      if (typeof res?.cooldownRemaining === 'number') {
        setCooldown(res.cooldownRemaining);
      } else {
        setCooldown(60);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to send verification code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (otpCode.trim().length !== 6) {
      setFormError('Please enter a valid 6-digit verification code');
      return;
    }

    setSubmitting(true);

    try {
      await apiFetch('/api/auth/register/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: regEmail,
          otp: otpCode.trim(),
        }),
      });
      await checkAuth();
      const targetUrl = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('redirect') || '/') : '/';
      window.location.href = targetUrl;
    } catch (err: any) {
      setFormError(err.message || 'Incorrect or expired verification code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setFormError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      await apiFetch('/api/auth/register/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: regEmail }),
      });
      setCooldown(60);
      setSuccessMsg('A new 6-digit code has been sent to your email.');
    } catch (err: any) {
      setFormError(err.message || 'Failed to resend code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setOrders([]);
      setAddresses([]);
      setReturnsList([]);
      try {
        localStorage.removeItem('ladrim.addresses');
        localStorage.removeItem('ladrim.returns');
        localStorage.removeItem('ladrim.saved_archive');
      } catch { }
      router.refresh();
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  // ─────────────────────────────────────────────────────────────
  // 1. LOADING SCREEN
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ x: [-14, 14, -14] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="flex items-center justify-center"
        >
          <img
            src="/logo.png"
            alt="LADRIM"
            className="h-11 w-auto object-contain select-none"
          />
        </motion.div>
        <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium select-none">
          Loading...
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. AUTHENTICATED BUYER PROFILE (Responsive Desktop & Mobile)
  // ─────────────────────────────────────────────────────────────
  if (user) {
    return (
      <div className="min-h-screen bg-white text-ink flex flex-col justify-between">
        {/* Header */}
        <Header />

        <div className="w-full pt-28 sm:pt-32 md:pt-36 pb-16">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
            {/* Top Bar: Clean Minimalist Back Button */}
            <div className="mb-6 md:mb-8">
              <Link
                href="/"
                prefetch={true}
                className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-ink transition-colors cursor-pointer active:scale-95"
              >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                <span>Back</span>
              </Link>
            </div>

            {/* ─────────────────────────────────────────────────── */}
            {/* DESKTOP VIEW (Two-Column Spacious Grid)             */}
            {/* ─────────────────────────────────────────────────── */}
            <div className="hidden md:grid md:grid-cols-12 md:gap-8 lg:gap-12">
              {/* Left Column: User Profile Sidebar with Centered Name & Email (Sticky) */}
              <div className="md:col-span-4 lg:col-span-4">
                <div className="sticky top-28 border border-neutral-200/90 rounded-sm p-6 bg-[#FAFAF8] space-y-5 shadow-2xs">
                  {/* User Identity Details (Centered Name, No Retail Patron) */}
                  <div className="text-center space-y-1.5">
                    <h1 className="font-display font-semibold text-2xl lg:text-3xl text-ink leading-tight text-center">
                      {user.full_name}
                    </h1>
                    <p className="text-xs text-neutral-500 font-medium text-center">
                      {user.email}
                    </p>
                    {user.phone && (
                      <p className="text-xs text-neutral-400 text-center pt-0.5">
                        {user.phone}
                      </p>
                    )}
                  </div>

                  {/* Account Overview Stats */}
                  <div className="pt-4 border-t border-neutral-200/80 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        Total Orders
                      </span>
                      <span className="font-sans font-bold text-lg text-ink">
                        {displayOrders.length}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        Addresses
                      </span>
                      <span className="font-sans font-bold text-lg text-ink">
                        {addresses.length}
                      </span>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-3 px-4 rounded-sm border border-neutral-300 text-neutral-700 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/40 transition-all flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out Account</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Dashboard Navigation Cards & Order Tracker */}
              <div className="md:col-span-8 lg:col-span-8 space-y-6">
                <div>
                  <h2 className="font-display font-semibold text-xl text-ink tracking-wide mb-1">
                    Account Overview
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Manage your active shipments, saved archive, destinations, and returns.
                  </p>
                </div>

                {/* Dashboard Navigation Grid (Clean 2-Column Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. ORDERS & TRACKING CARD */}
                  <div
                    onClick={() => {
                      setSelectedOrderForTracking(null);
                      setShowOrdersModal(true);
                    }}
                    className="p-5 border border-neutral-200 rounded-sm bg-white hover:border-ink hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-ink group-hover:bg-ink group-hover:text-white transition-colors">
                          <Package size={18} />
                        </div>
                        <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                          {displayOrders.length} {displayOrders.length === 1 ? 'Order' : 'Orders'}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-ink pt-1">
                        Orders &amp; Tracking
                      </h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        View customer order history and click to see 5-stage shipment progression.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink pt-1 group-hover:translate-x-0.5 transition-transform">
                      <span>View Orders</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* 2. SAVED ARCHIVE CARD */}
                  <div
                    onClick={() => setShowSavedModal(true)}
                    className="p-5 border border-neutral-200 rounded-sm bg-white hover:border-ink hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                          <Heart size={18} className="fill-rose-500 group-hover:fill-white transition-colors" />
                        </div>
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                          {savedCount} Saved
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-ink pt-1">
                        Saved Archive
                      </h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Browse pieces you have favorited with the heart icon and move them to cart.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink pt-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Open Archive</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* 3. ADDRESS BOOK CARD */}
                  <div
                    onClick={() => setShowAddressModal(true)}
                    className="p-5 border border-neutral-200 rounded-sm bg-white hover:border-ink hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-ink group-hover:bg-ink group-hover:text-white transition-colors">
                          <MapPin size={18} />
                        </div>
                        <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                          {addresses.length} Saved
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-ink pt-1">
                        Address Book
                      </h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Add and configure shipping destinations for express checkout.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink pt-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Manage &amp; Add</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* 4. RETURNS & EXCHANGES CARD (Replaces Refer a Friend) */}
                  <div
                    onClick={() => setShowReturnsModal(true)}
                    className="p-5 border border-neutral-200 rounded-sm bg-white hover:border-ink hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-ink group-hover:bg-ink group-hover:text-white transition-colors">
                          <RotateCcw size={18} />
                        </div>
                        {returnsList.length > 0 && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                            {returnsList.length} Active
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-ink pt-1">
                        Returns &amp; Exchanges
                      </h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Request complimentary courier returns or item exchanges easily.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink pt-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Start Return</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* 5. HELP & CONCIERGE CARD */}
                  <div
                    onClick={() => setShowConciergeModal(true)}
                    className="p-5 border border-neutral-200 rounded-sm bg-white hover:border-ink hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-4 sm:col-span-2"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-ink group-hover:bg-ink group-hover:text-white transition-colors">
                          <HelpCircle size={18} />
                        </div>
                        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Mon – Sat 09:00–18:00 WIB
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-ink pt-1">
                        Help &amp; Concierge
                      </h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Connect with our dedicated advisors for styling assistance, order alterations, or product inquiries.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink pt-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Contact Concierge</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────── */}
            {/* MOBILE VIEW (Clean Stacked Layout)                  */}
            {/* ─────────────────────────────────────────────────── */}
            <div className="md:hidden max-w-md mx-auto space-y-6">
              {/* User Identity Details (Centered Name, No Retail Patron) */}
              <div className="text-center space-y-1">
                <h1 className="font-display font-semibold text-2xl text-ink leading-tight text-center">
                  {user.full_name}
                </h1>
                <p className="text-xs text-neutral-500 text-center mt-0.5">
                  {user.email}
                </p>
              </div>

              {/* Vertical Navigation List */}
              <div className="divide-y divide-neutral-100 border-y border-neutral-100 pt-1">
                {/* 1. SAVED ARCHIVE */}
                <button
                  type="button"
                  onClick={() => setShowSavedModal(true)}
                  className="w-full py-4 flex items-center justify-between group text-left cursor-pointer transition-opacity hover:opacity-75"
                >
                  <div className="flex items-center gap-3.5">
                    <Heart size={18} className="text-rose-500 fill-rose-500 transition-colors" />
                    <span className="font-display font-semibold text-xs uppercase tracking-[0.16em] text-ink">
                      Saved Archive
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {savedCount > 0 && (
                      <span className="text-[10px] font-sans font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded">
                        {savedCount}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 2. ORDERS & TRACKING */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrderForTracking(null);
                    setShowOrdersModal(true);
                  }}
                  className="w-full py-4 flex items-center justify-between group text-left cursor-pointer transition-opacity hover:opacity-75"
                >
                  <div className="flex items-center gap-3.5">
                    <Package size={18} className="text-neutral-500 group-hover:text-ink transition-colors" />
                    <span className="font-display font-semibold text-xs uppercase tracking-[0.16em] text-ink">
                      Orders &amp; Tracking
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-sans font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                      {displayOrders.length}
                    </span>
                    <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 3. ADDRESS BOOK */}
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="w-full py-4 flex items-center justify-between group text-left cursor-pointer transition-opacity hover:opacity-75"
                >
                  <div className="flex items-center gap-3.5">
                    <MapPin size={18} className="text-neutral-500 group-hover:text-ink transition-colors" />
                    <span className="font-display font-semibold text-xs uppercase tracking-[0.16em] text-ink">
                      Address Book
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-sans font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                      {addresses.length}
                    </span>
                    <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 4. RETURNS & EXCHANGES (Replaces Refer a Friend) */}
                <button
                  type="button"
                  onClick={() => setShowReturnsModal(true)}
                  className="w-full py-4 flex items-center justify-between group text-left cursor-pointer transition-opacity hover:opacity-75"
                >
                  <div className="flex items-center gap-3.5">
                    <RotateCcw size={18} className="text-neutral-500 group-hover:text-ink transition-colors" />
                    <span className="font-display font-semibold text-xs uppercase tracking-[0.16em] text-ink">
                      Returns &amp; Exchanges
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {returnsList.length > 0 && (
                      <span className="text-[10px] font-sans font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                        {returnsList.length}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 5. HELP & CONCIERGE */}
                <button
                  type="button"
                  onClick={() => setShowConciergeModal(true)}
                  className="w-full py-4 flex items-center justify-between group text-left cursor-pointer transition-opacity hover:opacity-75"
                >
                  <div className="flex items-center gap-3.5">
                    <HelpCircle size={18} className="text-neutral-500 group-hover:text-ink transition-colors" />
                    <span className="font-display font-semibold text-xs uppercase tracking-[0.16em] text-ink">
                      Help &amp; Concierge
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Mobile Sign Out Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3.5 px-4 rounded-sm border border-neutral-300 text-neutral-700 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/30 transition-all flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <GymsharkStyleFooter />

        {/* ========================================================================= */}
        {/* MODAL 1: ORDERS & TRACKING (With Customer Order List & Drilldown Tracking) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showOrdersModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowOrdersModal(false);
                setSelectedOrderForTracking(null);
              }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.35, ease: lux }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    {selectedOrderForTracking && (
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForTracking(null)}
                        className="mr-1 p-1 rounded hover:bg-neutral-100 text-neutral-600 hover:text-ink transition-colors"
                        title="Back to all orders"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <div>
                      <h3 className="font-display font-semibold text-lg uppercase tracking-wider text-ink">
                        {selectedOrderForTracking
                          ? `Order #${selectedOrderForTracking.tracking_number || selectedOrderForTracking.id}`
                          : `My Orders (${displayOrders.length})`}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {selectedOrderForTracking ? selectedOrderForTracking.courier : user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrdersModal(false);
                      setSelectedOrderForTracking(null);
                    }}
                    className="p-2 text-neutral-400 hover:text-ink transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body: Level 1 (List) OR Level 2 (Detailed 5-Stage Tracking) */}
                <div className="p-5 space-y-6">
                  {selectedOrderForTracking ? (
                    /* ──── LEVEL 2: DETAILED ORDER TRACKING VIEW ──── */
                    <div className="space-y-6">
                      {/* Order Header summary */}
                      <div className="p-4 bg-[#FAFAF8] border border-neutral-200 rounded-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 font-medium">Delivery Status:</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {selectedOrderForTracking.tracking?.ui_title || selectedOrderForTracking.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500 font-medium">Carrier &amp; Tracking No:</span>
                          <span className="font-mono font-bold text-ink">
                            {selectedOrderForTracking.courier} · {selectedOrderForTracking.tracking_number}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-t border-neutral-200/60 pt-2">
                          <span className="text-neutral-500 font-medium">Order Total:</span>
                          <span className="font-bold text-ink">${selectedOrderForTracking.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* 5-Stage Live Order Tracker Component */}
                      <div className="border border-neutral-200 rounded-sm p-4 bg-white space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                          Fulfillment &amp; Delivery Progress
                        </h4>
                        <OrderTracker data={selectedOrderForTracking.tracking} />
                      </div>

                      {/* Order Items Breakdown */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                          Items in Order
                        </h4>
                        <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-sm overflow-hidden bg-white">
                          {selectedOrderForTracking.items.map((item, idx) => (
                            <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {item.image && (
                                  <div className="h-12 w-10 rounded-sm border border-neutral-200 overflow-hidden bg-neutral-100 shrink-0">
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                  </div>
                                )}
                                <div>
                                  <h5 className="font-sans font-medium text-xs text-ink">{item.name}</h5>
                                  <p className="text-[11px] text-neutral-400">Size: {item.size} · Qty: {item.qty}</p>
                                </div>
                              </div>
                              <span className="font-bold text-xs text-ink">${(item.unit_price * item.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Back to list button */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForTracking(null)}
                        className="w-full py-2.5 px-4 rounded-sm border border-neutral-300 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-ink hover:border-neutral-400 transition-colors cursor-pointer"
                      >
                        ← Back to All Orders
                      </button>
                    </div>
                  ) : displayOrders.length === 0 ? (
                    /* ──── EMPTY ORDERS STATE ──── */
                    <div className="py-16 text-center space-y-4">
                      <div className="mx-auto w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                        <Package size={26} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm text-ink uppercase tracking-wider">No Orders Yet</h4>
                        <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                          You haven't placed any orders yet. Discover our latest collections to get started.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowOrdersModal(false);
                            router.push('/shop/men/tops');
                          }}
                          className="btn-ink text-xs uppercase tracking-widest px-6 py-2.5 cursor-pointer"
                        >
                          Explore Collection
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ──── LEVEL 1: CUSTOMER ORDER LIST ──── */
                    displayOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="border border-neutral-200 rounded-sm overflow-hidden bg-white shadow-2xs hover:border-neutral-400 transition-all cursor-pointer space-y-3"
                        onClick={() => setSelectedOrderForTracking(ord)}
                      >
                        {/* Order Top Bar */}
                        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-ink">
                              #{ord.tracking_number || ord.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              {ord.tracking?.current_state || ord.status}
                            </span>
                          </div>
                          <span className="font-bold text-ink">${ord.total.toFixed(2)}</span>
                        </div>

                        {/* Order Items Preview */}
                        <div className="px-4 py-2 space-y-2">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-neutral-600">
                              <div className="flex items-center gap-2">
                                {it.image && (
                                  <img src={it.image} alt={it.name} className="h-8 w-7 object-cover rounded-sm border border-neutral-200" />
                                )}
                                <span className="line-clamp-1">{it.name} ({it.size}) × {it.qty}</span>
                              </div>
                              <span className="font-medium shrink-0 ml-2">${(it.unit_price * it.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Tracking CTA Clickable Button */}
                        <div className="px-4 pb-3 pt-1 border-t border-neutral-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-neutral-400">
                            Courier: {ord.courier}
                          </span>
                          <span className="font-semibold text-ink flex items-center gap-1 hover:underline">
                            <span>View Tracking Details</span>
                            <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* MODAL 2: SAVED ARCHIVE (FAVORITES / WISHLIST)                             */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showSavedModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSavedModal(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.35, ease: lux }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="p-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                      <Heart size={16} className="fill-rose-500" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg uppercase tracking-wider text-ink">
                        Saved Archive ({savedCount})
                      </h3>
                      <p className="text-xs text-neutral-500">Your curated favorite wardrobe pieces</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSavedModal(false)}
                    className="p-2 text-neutral-400 hover:text-ink transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Saved Items List */}
                <div className="p-5 space-y-4">
                  {savedItems.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-400 mx-auto flex items-center justify-center">
                        <Heart size={26} />
                      </div>
                      <h4 className="font-display font-semibold text-base text-ink">
                        Your Archive is Empty
                      </h4>
                      <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                        Click the heart icon on any product card across the boutique to add it to your saved archive.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSavedModal(false);
                          router.push('/shop');
                        }}
                        className="btn-ink text-xs py-2.5 px-6 mt-2"
                      >
                        Explore Boutique
                      </button>
                    </div>
                  ) : (
                    savedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 border border-neutral-200 rounded-sm flex items-center justify-between gap-4 bg-white hover:border-neutral-300 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="h-16 w-14 rounded-sm border border-neutral-200 overflow-hidden bg-neutral-100 shrink-0">
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-sans font-medium text-xs text-ink truncate">{item.name}</h5>
                            <p className="font-bold text-xs text-ink mt-0.5">${item.price.toFixed(2)}</p>
                            {item.material && (
                              <p className="text-[10px] text-neutral-400 truncate mt-0.5">{item.material}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              addToCart({
                                variantId: `${item.id}-std`,
                                name: item.name,
                                price: item.price,
                                qty: 1,
                                image: item.image,
                                slug: item.slug,
                              });
                              openCart();
                            }}
                            className="px-3 py-1.5 bg-ink text-white text-[11px] font-semibold uppercase tracking-wider rounded-sm hover:bg-neutral-800 transition-colors"
                          >
                            Add to Cart
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSaved(item.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                            title="Remove from saved archive"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* MODAL 3: ADDRESS BOOK (Interactive Address Manager & Add Address)         */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showAddressModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddressModal(false);
                setIsAddingAddress(false);
              }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.35, ease: lux }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="p-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-ink">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg uppercase tracking-wider text-ink">
                        Address Book ({addresses.length})
                      </h3>
                      <p className="text-xs text-neutral-500">Manage registered shipping destinations</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressModal(false);
                      setIsAddingAddress(false);
                    }}
                    className="p-2 text-neutral-400 hover:text-ink transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body: List OR Add Form */}
                <div className="p-5 space-y-5">
                  {isAddingAddress ? (
                    /* Form to Add New Address */
                    <form onSubmit={handleSaveNewAddress} className="space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                        <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-ink">
                          Add New Address
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsAddingAddress(false)}
                          className="text-xs text-neutral-500 hover:text-ink underline"
                        >
                          Cancel
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                          Recipient Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={addrName}
                          onChange={(e) => setAddrName(e.target.value)}
                          placeholder="e.g. Dani Setiawan"
                          className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={addrPhone}
                          onChange={(e) => setAddrPhone(e.target.value)}
                          placeholder="e.g. +1 (555) 234-5678"
                          className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                          Address Line 1 (Street, Apt / Suite) *
                        </label>
                        <input
                          type="text"
                          required
                          value={addrLine1}
                          onChange={(e) => setAddrLine1(e.target.value)}
                          placeholder="e.g. 742 Evergreen Terrace"
                          className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                          Address Line 2 (Building, Floor - Optional)
                        </label>
                        <input
                          type="text"
                          value={addrLine2}
                          onChange={(e) => setAddrLine2(e.target.value)}
                          placeholder="e.g. Suite 400"
                          className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                            placeholder="e.g. New York"
                            className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                            State / Province *
                          </label>
                          <input
                            type="text"
                            required
                            value={addrProvince}
                            onChange={(e) => setAddrProvince(e.target.value)}
                            placeholder="e.g. NY"
                            className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={addrPostal}
                          onChange={(e) => setAddrPostal(e.target.value)}
                          placeholder="e.g. 10001"
                          className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm"
                        />
                      </div>

                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addrDefault}
                          onChange={(e) => setAddrDefault(e.target.checked)}
                          className="accent-black h-4 w-4"
                        />
                        <span className="text-xs text-neutral-700">Set as primary shipping address</span>
                      </label>

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="submit"
                          className="flex-1 btn-ink text-xs py-3 font-semibold uppercase tracking-wider"
                        >
                          Save Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingAddress(false)}
                          className="px-4 py-3 border border-neutral-300 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-ink rounded-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Address List */
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(true)}
                        className="w-full py-3 px-4 border border-dashed border-neutral-300 hover:border-ink rounded-sm flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-ink transition-colors cursor-pointer bg-neutral-50/50"
                      >
                        <Plus size={16} />
                        <span>+ Add New Address</span>
                      </button>

                      <div className="space-y-3">
                        {addresses.length === 0 ? (
                          <div className="py-10 text-center space-y-2 border border-dashed border-neutral-200 rounded-sm">
                            <MapPin size={22} className="mx-auto text-neutral-400" />
                            <p className="text-xs font-medium text-neutral-600">No saved addresses</p>
                            <p className="text-[11px] text-neutral-400">Add a destination above for faster checkout.</p>
                          </div>
                        ) : (
                          addresses.map((item) => (
                            <div
                              key={item.id}
                              className={`p-4 rounded-sm border transition-all ${item.isDefault
                                  ? 'border-ink bg-neutral-50/40 shadow-xs'
                                  : 'border-neutral-200 bg-white hover:border-neutral-300'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-bold text-xs text-ink">{item.name}</h5>
                                    {item.isDefault && (
                                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-ink text-white">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-600 mt-1">{item.addressLine1}</p>
                                  {item.addressLine2 && (
                                    <p className="text-xs text-neutral-600">{item.addressLine2}</p>
                                  )}
                                  <p className="text-xs text-neutral-600">
                                    {item.city}, {item.province} {item.postalCode}
                                  </p>
                                  <p className="text-xs text-neutral-500 mt-1">Phone: {item.phone}</p>
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  {!item.isDefault && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetDefaultAddress(item.id)}
                                      className="text-[11px] font-semibold text-neutral-600 hover:text-ink underline"
                                    >
                                      Set Default
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAddress(item.id)}
                                    className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                                    title="Delete address"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* MODAL 4: RETURNS & EXCHANGES (Replaces Refer a Friend)                     */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showReturnsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReturnsModal(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.35, ease: lux }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="p-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-ink">
                      <RotateCcw size={16} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg uppercase tracking-wider text-ink">
                        Returns &amp; Exchanges
                      </h3>
                      <p className="text-xs text-neutral-500">14-Day Complimentary Return Service</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReturnsModal(false)}
                    className="p-2 text-neutral-400 hover:text-ink transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-6">
                  {/* Notice */}
                  <div className="p-4 bg-[#FAFAF8] border border-neutral-200 rounded-sm space-y-1.5 text-xs text-neutral-600">
                    <div className="flex items-center gap-2 font-bold text-ink">
                      <ShieldCheck size={16} className="text-emerald-700" />
                      <span>Return &amp; Exchange Policy</span>
                    </div>
                    <p className="leading-relaxed">
                      We provide a complimentary 14-day exchange and return service. Our courier will collect the package directly from your address.
                    </p>
                  </div>

                  {/* Success notification if submitted */}
                  {returnSuccessMsg && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>{returnSuccessMsg}</span>
                    </div>
                  )}

                  {/* Return Form */}
                  <form onSubmit={handleSubmitReturn} className="border border-neutral-200 rounded-sm p-4.5 bg-white space-y-4">
                    <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-ink border-b border-neutral-100 pb-2">
                      Submit New Return Request
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                        Select Order
                      </label>
                      {displayOrders.length > 0 ? (
                        <select
                          value={returnOrderNum}
                          onChange={(e) => setReturnOrderNum(e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm"
                        >
                          {displayOrders.map((ord) => (
                            <option key={ord.id} value={ord.tracking_number || ord.id}>
                              #{ord.tracking_number || ord.id} — ${ord.total.toFixed(2)} ({ord.status})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-2.5 bg-neutral-50 border border-neutral-200 text-neutral-500 text-xs rounded-sm italic">
                          No orders placed yet.
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                        Item to Return / Exchange
                      </label>
                      <input
                        type="text"
                        required
                        value={returnItemName}
                        onChange={(e) => setReturnItemName(e.target.value)}
                        placeholder="e.g. Baggy Relaxed Cargo Jeans - Black (M)"
                        className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                        Return Reason
                      </label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm"
                      >
                        <option value="Size too small / large">Size does not fit (Too small / large)</option>
                        <option value="Exchange for alternate tone">Exchange for another color or model</option>
                        <option value="Defective or damaged item">Defective or damaged item</option>
                        <option value="Incorrect item sent">Incorrect item sent</option>
                        <option value="Changed mind">Changed mind</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="Provide any additional details or exchange requests..."
                        className="w-full bg-white border border-neutral-300 p-2.5 text-xs outline-none focus:border-ink rounded-sm resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full btn-ink text-xs py-3 font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      Submit Return Request
                    </button>
                  </form>

                  {/* Active Return History */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-neutral-500">
                      Active Return History ({returnsList.length})
                    </h4>
                    {returnsList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-neutral-400 border border-neutral-100 rounded-sm">
                        No active return or exchange requests.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {returnsList.map((ret) => (
                          <div key={ret.id} className="p-3.5 border border-neutral-200 rounded-sm bg-white space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-ink">#{ret.id}</span>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {ret.status}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-700 font-medium">{ret.productName}</p>
                            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5">
                              <span>Reason: {ret.reason}</span>
                              <span>{ret.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* MODAL 5: HELP & CONCIERGE                                                 */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showConciergeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConciergeModal(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.35, ease: lux }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="p-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-ink">
                      <HelpCircle size={16} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg uppercase tracking-wider text-ink">
                        Client Concierge
                      </h3>
                      <p className="text-xs text-neutral-500">Dedicated styling &amp; support assistance</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConciergeModal(false)}
                    className="p-2 text-neutral-400 hover:text-ink transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5 text-xs text-neutral-600">
                  <div className="p-4 bg-[#FAFAF8] border border-neutral-200 rounded-sm space-y-2">
                    <h4 className="font-bold text-ink uppercase tracking-wider text-xs">
                      LADRIM Private Concierge
                    </h4>
                    <p className="leading-relaxed">
                      Our advisor team is available to assist with sizing consultations, material guidance, urgent order tracking, and complimentary luxury gift packaging.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 border border-neutral-200 rounded-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-ink">Direct Email Support</p>
                        <p className="text-neutral-500 text-[11px]">support@ladrim.com</p>
                      </div>
                      <a
                        href="mailto:support@ladrim.com"
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-ink hover:text-white rounded-sm text-[11px] font-semibold transition-colors"
                      >
                        Send Email
                      </a>
                    </div>

                    <div className="p-3.5 border border-neutral-200 rounded-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-ink">WhatsApp VIP Concierge</p>
                        <p className="text-neutral-500 text-[11px]">+62 812-1697-3665 (Senin - Sabtu 09:00 - 18:00 WIB)</p>
                      </div>
                      <a
                        href="https://wa.me/6281216973665"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-sm text-[11px] font-semibold transition-colors"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. UNAUTHENTICATED GUEST LOGIN / REGISTER / OTP SCREEN
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full">
      {/* LEFT PANEL — Immersive dark branded visual */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0">
          <img
            src="/images/auth-hero.jpg"
            alt="LADRIM Lifestyle"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        </div>

        <div className="relative z-10 p-10 flex items-center justify-between">
          <a
            href="/"
            className="font-display font-bold text-2xl tracking-[0.35em] text-white/90 hover:text-white transition-colors"
          >
            LADRIM
          </a>
        </div>

        <div className="relative z-10 p-10 pb-14">
          <h2 className="font-display font-bold text-4xl leading-tight text-white xl:text-5xl">
            Essentials made<br />to be worn<br />for years.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            Sign in to track active shipments, manage addresses, and unlock member rewards.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — Clean form area */}
      <div className="relative flex w-full min-h-screen flex-col lg:w-[48%] bg-white">
        <Link
          href="/"
          prefetch={true}
          className="group flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-600 hover:text-ink transition-colors p-4 sm:p-6 cursor-pointer active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </Link>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-10">
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              {authMode === 'otp' ? (
                /* ──── 6-DIGIT OTP VERIFICATION SCREEN ──── */
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: lux }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-ink mb-3 shadow-xs">
                      <Mail size={22} />
                    </div>
                    <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                      Verification Code
                    </h1>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                      A 6-digit verification code has been sent to your Gmail address.
                    </p>
                  </div>

                  {formError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm flex items-center gap-2.5">
                      <AlertCircle size={15} className="shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
                    <div>
                      <label className="block text-center text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                        Enter 6-Digit Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => {
                          if (formError) setFormError('');
                          setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                        }}
                        placeholder="••••••"
                        className="w-full text-center font-mono text-3xl font-bold tracking-[0.4em] py-3.5 border border-neutral-300 rounded-sm bg-neutral-50 focus:bg-white focus:border-ink outline-none transition-all placeholder:text-neutral-300"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || otpCode.length !== 6}
                      className="w-full bg-ink py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting && <Loader2 size={14} className="animate-spin" />}
                      <span>{submitting ? 'Verifying...' : 'Verification'}</span>
                    </button>
                  </form>

                  <div className="pt-2 flex flex-col items-center gap-3 text-xs text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <span>Didn&apos;t receive the code?</span>
                      <button
                        type="button"
                        disabled={cooldown > 0 || submitting}
                        onClick={handleResendOtp}
                        className="font-bold text-ink underline underline-offset-4 disabled:text-neutral-400 disabled:no-underline cursor-pointer"
                      >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormError('');
                        setSuccessMsg('');
                        setAuthMode('register');
                      }}
                      className="text-neutral-400 hover:text-ink text-[11px] cursor-pointer transition-colors underline underline-offset-2"
                    >
                      <span>not an email address?</span>
                    </button>
                  </div>
                </motion.div>
              ) : authMode === 'login' ? (
                /* ──── LOGIN FORM ──── */
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: lux }}
                >
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-center mb-6 tracking-wide text-ink">
                    LADRIM LOGIN
                  </h1>

                  {formError && (
                    <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm flex items-center gap-2.5">
                      <AlertCircle size={15} className="shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2.5">
                      <ShieldCheck size={15} className="shrink-0 text-emerald-600" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleLoginSubmit}>
                    <div>
                      <label
                        htmlFor="login-email"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        Email Address
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={loginEmail}
                        onChange={(e) => {
                          if (!isLocked && formError) setFormError('');
                          setLoginEmail(e.target.value);
                        }}
                        placeholder="you@example.com"
                        className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="login-pw"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="login-pw"
                          type={showPw ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={loginPassword}
                          onChange={(e) => {
                            if (!isLocked && formError) setFormError('');
                            setLoginPassword(e.target.value);
                          }}
                          onFocus={() => {
                            if (!isLocked && formError) {
                              setLoginPassword('');
                            }
                          }}
                          placeholder="Your password"
                          className="w-full border border-neutral-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition-colors focus:border-ink"
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
                      disabled={submitting}
                      className="w-full bg-ink py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {submitting && <Loader2 size={14} className="animate-spin" />}
                      <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                    </button>

                    <p className="mt-4 text-center text-xs text-neutral-500">
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setFormError('');
                          setSuccessMsg('');
                          setAuthMode('register');
                        }}
                        className="font-bold text-ink underline underline-offset-4 transition-opacity hover:opacity-70 cursor-pointer"
                      >
                        Create account
                      </button>
                    </p>
                  </form>
                </motion.div>
              ) : (
                /* ──── REGISTER FORM ──── */
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: lux }}
                >
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-center mb-6 tracking-wide text-ink">
                    CREATE ACCOUNT
                  </h1>

                  {formError && (
                    <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm flex items-center gap-2.5">
                      <AlertCircle size={15} className="shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2.5">
                      <ShieldCheck size={15} className="shrink-0 text-emerald-600" />
                      <span>{successMsg}</span>
                    </div>
                  )}
                  <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="reg-first"
                          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
                        >
                          First Name
                        </label>
                        <input
                          id="reg-first"
                          type="text"
                          required
                          value={regFirstName}
                          onChange={(e) => setRegFirstName(e.target.value)}
                          placeholder="John"
                          className="w-full border border-neutral-300 bg-white px-3.5 py-3 text-sm outline-none transition-colors focus:border-ink"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="reg-last"
                          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
                        >
                          Last Name
                        </label>
                        <input
                          id="reg-last"
                          type="text"
                          required
                          value={regLastName}
                          onChange={(e) => setRegLastName(e.target.value)}
                          placeholder="Doe"
                          className="w-full border border-neutral-300 bg-white px-3.5 py-3 text-sm outline-none transition-colors focus:border-ink"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reg-email"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        Email Address
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-ink"
                      />
                    </div>

                    <div className="relative">
                      <label
                        htmlFor="reg-pw"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="reg-pw"
                          type={showPw ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          onFocus={() => setIsPwFocused(true)}
                          onBlur={() => setIsPwFocused(false)}
                          placeholder="Enter your password"
                          className="w-full border border-neutral-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition-colors focus:border-ink"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          {allPwChecksMet && (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          )}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowPw(!showPw)}
                            aria-label={showPw ? 'Hide password' : 'Show password'}
                            className="text-neutral-400 transition-colors hover:text-ink cursor-pointer"
                          >
                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Tooltip / Popover Dinamis Syarat Password (Otomatis hilang jika semua syarat terpenuhi) */}
                      <AnimatePresence>
                        {isPwFocused && !allPwChecksMet && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            onMouseDown={(e) => e.preventDefault()}
                            className="absolute left-0 right-0 top-full mt-2 z-30 bg-white border border-neutral-200 rounded-lg p-3.5 shadow-xl"
                          >
                            {/* Arrow Pointer */}
                            <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-t border-l border-neutral-200 rotate-45" />

                            <div className="relative z-10">
                              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span>Syarat Password</span>
                                <span className={
                                  Object.values(pwChecks).every(Boolean)
                                    ? 'text-emerald-600 font-bold'
                                    : 'text-neutral-400 font-medium'
                                }>
                                  {Object.values(pwChecks).filter(Boolean).length}/4 Terpenuhi
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                {/* Item 1: Minimal 8 karakter */}
                                <div className="flex items-center gap-2 text-xs transition-colors">
                                  {pwChecks.minLength ? (
                                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 flex items-center justify-center shrink-0" />
                                  )}
                                  <span className={pwChecks.minLength ? 'text-emerald-700 font-medium' : 'text-neutral-500'}>
                                    Minimal 8 karakter
                                  </span>
                                </div>

                                {/* Item 2: Minimal 1 huruf besar (A-Z) */}
                                <div className="flex items-center gap-2 text-xs transition-colors">
                                  {pwChecks.hasUppercase ? (
                                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 flex items-center justify-center shrink-0" />
                                  )}
                                  <span className={pwChecks.hasUppercase ? 'text-emerald-700 font-medium' : 'text-neutral-500'}>
                                    Minimal 1 huruf besar (A-Z)
                                  </span>
                                </div>

                                {/* Item 3: Minimal 1 angka (0-9) */}
                                <div className="flex items-center gap-2 text-xs transition-colors">
                                  {pwChecks.hasNumber ? (
                                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 flex items-center justify-center shrink-0" />
                                  )}
                                  <span className={pwChecks.hasNumber ? 'text-emerald-700 font-medium' : 'text-neutral-500'}>
                                    Minimal 1 angka (0-9)
                                  </span>
                                </div>

                                {/* Item 4: Minimal 1 simbol khusus (e.g., @, #, $, !) */}
                                <div className="flex items-center gap-2 text-xs transition-colors">
                                  {pwChecks.hasSpecial ? (
                                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 flex items-center justify-center shrink-0" />
                                  )}
                                  <span className={pwChecks.hasSpecial ? 'text-emerald-700 font-medium' : 'text-neutral-500'}>
                                    Minimal 1 simbol khusus (e.g., @, #, $, !)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-ink py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {submitting && <Loader2 size={14} className="animate-spin" />}
                      <span>{submitting ? 'Send code' : 'Sign up'}</span>
                    </button>

                    <p className="mt-4 text-center text-xs text-neutral-500">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setFormError('');
                          setSuccessMsg('');
                          setAuthMode('login');
                        }}
                        className="font-bold text-ink underline underline-offset-4 transition-opacity hover:opacity-70 cursor-pointer"
                      >
                        Sign in
                      </button>
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
