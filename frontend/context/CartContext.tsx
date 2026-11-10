'use client';
import { createContext, useContext, useEffect, useMemo, useState, useRef, ReactNode } from 'react';

export type CartLine = {
  variantId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  color?: string;
  size?: string;
  slug?: string;
};

type Ctx = {
  lines: CartLine[];
  add: (l: CartLine) => void;
  updateQty: (variantId: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  total: number;
  previousTotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [previousTotal, setPreviousTotal] = useState<number>(0);

  // 1. Load cart from localStorage only once on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ladrim.cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((item) => {
            if (item.image && item.image.includes('1625910513413-562a14e91ceb')) {
              return {
                ...item,
                image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=1000&q=80',
              };
            }
            return item;
          });
          setLines(sanitized);
          const initialTotal = sanitized.reduce((n: number, l: any) => n + (l.price || 0) * (l.qty || 1), 0);
          setPreviousTotal(initialTotal);
        }
      }
    } catch (e) {
      console.error('Error reading cart from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Persist to localStorage only AFTER initial load has completed
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('ladrim.cart', JSON.stringify(lines));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [lines, isLoaded]);

  const total = useMemo(() => lines.reduce((n, l) => n + l.price * l.qty, 0), [lines]);

  const value = useMemo<Ctx>(() => ({
    lines,
    count: lines.length, // Number of products in bag
    total,
    previousTotal,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => {
      setPreviousTotal(total);
      setIsOpen(false);
    },
    add: (l) => {
      setPreviousTotal(total);
      setLines((p) =>
        p.some((x) => x.variantId === l.variantId)
          ? p.map((x) => (x.variantId === l.variantId ? { ...x, qty: x.qty + l.qty } : x))
          : [...p, l]
      );
    },
    updateQty: (variantId, qty) => {
      if (qty <= 0) {
        setLines((p) => p.filter((x) => x.variantId !== variantId));
      } else {
        setLines((p) => p.map((x) => (x.variantId === variantId ? { ...x, qty } : x)));
      }
    },
    remove: (id) => setLines((p) => p.filter((x) => x.variantId !== id)),
    clear: () => {
      setPreviousTotal(0);
      setLines([]);
    },
  }), [lines, total, previousTotal, isOpen]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error('CartProvider missing');
  return c;
};
