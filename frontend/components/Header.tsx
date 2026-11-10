'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import DeepNav from './DeepNav';
import SearchOverlay from './SearchOverlay';
import { useCart } from '@/context/CartContext';
import { lux } from '@/lib/motion';

export interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = false }: HeaderProps) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count, openCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (path: string) => {
    setMenu(false);
    router.push(path);
  };

  // When transparent and not scrolled, use a transparent header with white text
  const isTransparent = transparent && !scrolled && !menu;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          isTransparent
            ? 'bg-transparent text-white'
            : 'bg-white text-ink border-b border-black/5 shadow-sm'
        }`}
      >
        {/* Top subtle announcement bar (LV aesthetic) */}
        <div
          className={`hidden border-b py-1.5 text-center text-[11px] tracking-widest sm:block transition-all duration-300 ${
            isTransparent
              ? 'border-white/10 bg-transparent text-white/70'
              : 'border-black/5 bg-[#FAFAF8] text-neutral-600'
          }`}
        >
          <span>COMPLIMENTARY WORLDWIDE EXPRESS SHIPPING ON ALL ORDERS OVER $150</span>
        </div>

        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-5 md:h-20 md:px-10">
          {/* Left: Nav Toggle (garis 3) + Brand Logo */}
          <div className="flex items-center gap-4 sm:gap-7">
            <button
              onClick={() => setMenu(!menu)}
              aria-label={menu ? 'Close menu' : 'Open menu'}
              aria-expanded={menu}
              className={`flex items-center gap-2.5 text-sm font-medium tracking-wider uppercase transition-opacity hover:opacity-70 ${
                isTransparent ? 'text-white' : 'text-ink'
              }`}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
              <span className="hidden sm:inline">{menu ? 'Close' : ''}</span>
            </button>

            <a
              href="/"
              className={`font-display text-2xl tracking-[0.3em] md:text-3xl transition-all hover:scale-[1.02] ${
                isTransparent ? 'text-white' : 'text-ink'
              }`}
            >
              LADRIM
            </a>
          </div>

          {/* Right: Actions (Search, Bag, and Login at the far right) */}
          <div className={`flex items-center gap-4 sm:gap-6 ${isTransparent ? 'text-white' : 'text-ink'}`}>
            <button
              onClick={() => setSearch(true)}
              aria-label="Search"
              className="transition-opacity hover:opacity-70"
            >
              <Search size={20} />
            </button>

            <button
              id="header-cart-btn"
              onClick={openCart}
              aria-label={`Cart, ${count} items`}
              className="relative transition-opacity hover:opacity-70"
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className={`absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold animate-pulse ${
                  isTransparent ? 'bg-white text-ink' : 'bg-ink text-white'
                }`}>
                  {count}
                </span>
              )}
            </button>

            <a
              href="/account"
              aria-label="Account / Login"
              className="transition-opacity hover:opacity-70"
            >
              <User size={20} />
            </a>
          </div>
        </div>

        {/* Navigation Dropdown Panel */}
        <AnimatePresence>
          {menu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: lux }}
              className="overflow-hidden border-t border-black/10 bg-white shadow-2xl"
            >
              <div className="mx-auto max-h-[82vh] max-w-[1800px] overflow-y-auto px-5 py-8 md:px-10">
                <DeepNav onNavigate={handleNavigate} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}
