'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { lux } from '@/lib/motion';
import { catalogProducts, ProductItem, mapDbProductToItem } from '@/lib/catalogData';

const TRENDING = ['Polo', 'Tees', 'Bags', 'Loafers', 'Silk'];
const KEY = 'ladrim.recent';

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<ProductItem[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
    } catch {}
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => input.current?.focus(), 250);
    } else {
      setQ('');
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Live catalog instant search
  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) {
      setHits([]);
      return;
    }

    fetch(`/api/products?search=${encodeURIComponent(term)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          setHits(data.data.map(mapDbProductToItem).slice(0, 6));
        } else {
          setHits([]);
        }
      })
      .catch(() => setHits([]));
  }, [q]);

  const remember = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem(KEY);
  };

  const executeSearch = (searchTerm?: string) => {
    const term = (searchTerm ?? q).trim();
    if (!term) return;
    remember(term);
    onClose();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const typing = q.trim().length >= 2;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-white shadow-2xl"
        >
          <div className="mx-auto max-w-5xl px-5 pb-20 pt-6 md:px-10">
            {/* Search Input Bar with Submit Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSearch();
              }}
              className="flex items-center gap-2.5 sm:gap-3 border-b border-black pb-2.5"
            >
              <Search size={18} className="text-neutral-500 shrink-0" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search creations, materials, categories..."
                aria-label="Search products"
                className="w-full bg-transparent font-sans text-base sm:text-lg md:text-xl outline-none placeholder:text-neutral-400 text-ink"
              />

              {q.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setQ('');
                    input.current?.focus();
                  }}
                  aria-label="Clear input"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-ink transition-colors shrink-0"
                >
                  <X size={15} />
                </button>
              )}

              {/* Smaller, compact Search Action Button */}
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-ink px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] font-medium uppercase tracking-wider text-white shadow-xs transition-all hover:bg-neutral-800 active:scale-95 shrink-0"
              >
                <span>Search</span>
                <ArrowRight size={12} className="hidden sm:inline" />
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="p-1.5 text-neutral-500 hover:text-ink transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </form>

            {/* Results or Trending Content */}
            <AnimatePresence mode="wait">
              {typing ? (
                <motion.div
                  key="hits"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: lux }}
                  className="mt-8"
                >
                  <div className="mb-4 flex items-center justify-between text-xs tracking-wider text-neutral-500 uppercase">
                    <span>Live Suggestions ({hits.length})</span>
                    {hits.length > 0 && (
                      <button
                        onClick={() => executeSearch()}
                        className="font-semibold text-ink underline underline-offset-4 hover:opacity-70"
                      >
                        View all results →
                      </button>
                    )}
                  </div>

                  {hits.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="font-display text-2xl text-neutral-400">
                        No instant matches for &ldquo;{q}&rdquo;
                      </p>
                      <p className="mt-2 text-sm text-neutral-500">
                        Try searching with a broader keyword or check spelling.
                      </p>
                      <button
                        onClick={() => executeSearch()}
                        className="mt-6 inline-flex items-center gap-2 bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-neutral-800"
                      >
                        Search Full Catalog for &ldquo;{q}&rdquo;
                      </button>
                    </div>
                  ) : (
                    <>
                      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {hits.map((h) => (
                          <li key={h.id}>
                            <a
                              href={`/product/${h.slug}`}
                              onClick={() => {
                                remember(q.trim());
                                onClose();
                              }}
                              className="group flex items-center gap-4 bg-white/80 p-3 shadow-xs transition-all hover:bg-white hover:shadow-md"
                            >
                              <div
                                className="h-20 w-16 shrink-0 bg-neutral-200 bg-cover bg-center transition-transform group-hover:scale-105"
                                style={{ backgroundImage: `url(${h.image})` }}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                                  {h.pillar} · {h.category}
                                </span>
                                <p className="truncate text-sm font-medium text-ink group-hover:underline">
                                  {h.name}
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-ink">
                                  ${h.price.toLocaleString('en-US')}
                                </p>
                              </div>
                            </a>
                          </li>
                        ))}
                      </ul>

                      {/* View All Search Results Button */}
                      <div className="mt-8 flex justify-center">
                        <button
                          onClick={() => executeSearch()}
                          className="group flex items-center gap-3 border border-black bg-white px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink shadow-sm transition-all hover:bg-ink hover:text-white"
                        >
                          <span>Explore All Results for &ldquo;{q}&rdquo;</span>
                          <ArrowRight
                            size={14}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: lux }}
                  className="mt-8 grid gap-10 md:grid-cols-2"
                >
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <TrendingUp size={14} className="text-neutral-500" />
                      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                        Trending Searches
                      </h2>
                    </div>
                    <ul className="space-y-2.5">
                      {TRENDING.map((t) => (
                        <li key={t}>
                          <button
                            type="button"
                            onClick={() => {
                              setQ(t);
                              executeSearch(t);
                            }}
                            className="text-sm text-neutral-700 hover:text-ink hover:underline underline-offset-4 transition-colors cursor-pointer block text-left py-0.5"
                          >
                            {t}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-neutral-400" />
                        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                          Recent Searches
                        </h2>
                      </div>
                      {recent.length > 0 && (
                        <button
                          type="button"
                          onClick={clearRecent}
                          className="text-[11px] uppercase tracking-wider text-neutral-400 hover:text-ink underline underline-offset-4 cursor-pointer transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {recent.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-1">
                        Your recent search terms will appear here.
                      </p>
                    ) : (
                      <ul className="space-y-2.5">
                        {recent.map((r) => (
                          <li key={r}>
                            <button
                              type="button"
                              onClick={() => {
                                setQ(r);
                                executeSearch(r);
                              }}
                              className="text-sm text-neutral-700 hover:text-ink hover:underline underline-offset-4 transition-colors cursor-pointer block text-left py-0.5"
                            >
                              {r}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
