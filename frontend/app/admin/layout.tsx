'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  CreditCard,
  Truck,
  Ticket,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { AdminContext, AdminUser } from '@/context/AdminContext';
import { apiFetch } from '@/lib/api';

interface NavGroup {
  group: string;
  items: {
    label: string;
    href: string;
    icon: any;
    badge?: string | number;
    exact?: boolean;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    group: 'CATALOG',
    items: [
      {
        label: 'Products',
        href: '/admin/products',
        icon: Package,
      },
      {
        label: 'Categories',
        href: '/admin/categories',
        icon: Layers,
      },
    ],
  },
  {
    group: 'SALES & OPERATIONS',
    items: [
      {
        label: 'Orders',
        href: '/admin/orders',
        icon: ShoppingBag,
        badge: 12,
      },
      {
        label: 'Customers',
        href: '/admin/customers',
        icon: Users,
      },
      {
        label: 'Payments',
        href: '/admin/payments',
        icon: CreditCard,
      },
      {
        label: 'Shipping',
        href: '/admin/shipping',
        icon: Truck,
      },
    ],
  },
  {
    group: 'MARKETING & ANALYTICS',
    items: [
      {
        label: 'Vouchers & Promos',
        href: '/admin/vouchers',
        icon: Ticket,
      },
      {
        label: 'Sales Reports',
        href: '/admin/reports',
        icon: BarChart3,
      },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Authentication State
  const [adminUser, setAdminUser] = useState<AdminUser>({
    id: 'admin-super-1',
    name: 'Alexander R.',
    email: 'alexander.r@ladrim.com',
    role: 'Super Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Sync session with backend if available
  const checkSession = async () => {
    try {
      const res = await apiFetch('/api/admin/me');
      if (res?.authenticated && res?.admin) {
        setAdminUser({
          id: res.admin.id || 'admin-super-1',
          name: res.admin.name || 'Alexander R.',
          email: res.admin.email || 'alexander.r@ladrim.com',
          role: res.admin.role === 'super_admin' ? 'Super Admin' : (res.admin.role || 'Super Admin'),
          avatar: res.admin.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
        });
      }
    } catch {
      // Keep executive admin default profile
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setShowNotifications(false);
    setShowProfileMenu(false);
  }, [pathname]);

  const isItemActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <AdminContext.Provider
      value={{
        admin: adminUser,
        refreshAdmin: checkSession,
        openAuditDrawer: () => setIsAuditOpen(true),
        closeAuditDrawer: () => setIsAuditOpen(false),
      }}
    >
      <div className="min-h-screen bg-[#F8F9FA] text-[#111827] flex font-sans antialiased selection:bg-neutral-900 selection:text-white w-full max-w-full overflow-x-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200/90 shrink-0 sticky top-0 h-screen z-30 select-none">
          {/* Top Brand / Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs tracking-wider">
                L
              </div>
              <span className="font-bold text-base tracking-tight text-gray-950 group-hover:text-black">
                LADRIM
              </span>
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">
                Admin
              </span>
            </Link>
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            {NAV_GROUPS.map((group) => (
              <div key={group.group} className="space-y-1">
                <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const active = isItemActive(item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-black text-white font-semibold shadow-xs'
                          : 'text-gray-600 hover:text-black hover:bg-gray-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={active ? 'text-white' : 'text-gray-500'} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Settings Link */}
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/admin/settings"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                isItemActive('/admin/settings')
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100/70'
              }`}
            >
              <Settings size={18} className="text-gray-500" />
              <span>Store Settings</span>
            </Link>
          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAWER */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative flex flex-col w-72 bg-white h-full z-10 shadow-2xl">
              <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                <Link href="/admin" className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-black text-white flex items-center justify-center font-bold text-xs">
                    L
                  </div>
                  <span className="font-bold text-base tracking-tight text-gray-900">LADRIM</span>
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                {NAV_GROUPS.map((group) => (
                  <div key={group.group} className="space-y-1">
                    <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      {group.group}
                    </div>
                    {group.items.map((item) => {
                      const active = isItemActive(item.href, item.exact);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                            active
                              ? 'bg-black text-white font-semibold'
                              : 'text-gray-600 hover:text-black hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={18} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-700">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}

                <div className="pt-2 border-t border-gray-100">
                  <Link
                    href="/admin/settings"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium text-gray-600 hover:text-black hover:bg-gray-100"
                  >
                    <Settings size={18} />
                    <span>Store Settings</span>
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* TOP HEADER */}
          <header className="h-16 bg-white border-b border-gray-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
            {/* Mobile Toggle Button */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100"
                title="Toggle Menu"
              >
                <Menu size={20} />
              </button>
              <span className="font-bold text-base tracking-tight text-gray-900">LADRIM</span>
            </div>

            <div className="hidden lg:block">
              {/* Optional breadcrumb or search indicator if needed */}
            </div>

            {/* Right Header Controls (Notification + User Profile) */}
            <div className="flex items-center gap-3.5 ml-auto relative">
              {/* Notifications Icon Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 transition relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell size={18} />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="font-bold text-sm text-gray-900">Notifications</span>
                      <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        3 New
                      </span>
                    </div>
                    <div className="py-2 divide-y divide-gray-100 text-xs">
                      <div className="py-2.5 flex items-start gap-3 hover:bg-gray-50 rounded-lg px-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">New Order #ORD-9482</p>
                          <p className="text-gray-500 text-[11px]">Bambang Pamungkas made payment of $89.00 via Card</p>
                          <span className="text-[10px] text-gray-400">12 mins ago</span>
                        </div>
                      </div>
                      <div className="py-2.5 flex items-start gap-3 hover:bg-gray-50 rounded-lg px-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">5 Transfers Pending Review</p>
                          <p className="text-gray-500 text-[11px]">Verify manual payment receipts in the Payments section</p>
                          <span className="text-[10px] text-gray-400">35 mins ago</span>
                        </div>
                      </div>
                      <div className="py-2.5 flex items-start gap-3 hover:bg-gray-50 rounded-lg px-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">Low Stock Alert</p>
                          <p className="text-gray-500 text-[11px]">Heavyweight Linen Shirt has only 1 unit remaining</p>
                          <span className="text-[10px] text-gray-400">1 hour ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100/70 transition cursor-pointer"
                >
                  <img
                    src={adminUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}
                    alt={adminUser.name || 'Alexander R.'}
                    className="w-9 h-9 rounded-full object-cover border border-gray-200"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-gray-900 leading-tight">
                      {adminUser.name || 'Alexander R.'}
                    </p>
                    <p className="text-[11px] font-medium text-gray-500 leading-tight">
                      {adminUser.role || 'Super Admin'}
                    </p>
                  </div>
                </button>

                {/* Profile Menu Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-bold text-gray-900">{adminUser.name || 'Alexander R.'}</p>
                      <p className="text-gray-500 text-[11px] truncate">{adminUser.email || 'alexander.r@ladrim.com'}</p>
                    </div>
                    <Link
                      href="/"
                      target="_blank"
                      className="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                    >
                      <ExternalLink size={14} className="text-gray-400" />
                      <span>Open LADRIM Storefront</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Settings size={14} className="text-gray-400" />
                      <span>Profile Settings</span>
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={async () => {
                          try {
                            await apiFetch('/api/auth/logout', { method: 'POST' });
                          } catch {}
                          router.push('/');
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* MAIN PAGE CONTENT */}
          <main className="flex-1 p-4 sm:p-5 lg:p-6 xl:p-8 max-w-[1600px] w-full mx-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
