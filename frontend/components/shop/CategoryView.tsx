'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  X,
  Check,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Filter,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Node } from '@/lib/taxonomy';
import { ProductItem, CategoryHeroInfo, getColorHex } from '@/lib/catalogData';
import { useCart } from '@/context/CartContext';
import { useSavedArchive } from '@/context/SavedArchiveContext';
import { lux } from '@/lib/motion';

type Props = {
  pillar: Node;
  category?: Node;
  subCategory?: Node;
  hero: CategoryHeroInfo;
  initialProducts: ProductItem[];
  allSubCategories: Node[];
};

export default function CategoryView({
  pillar,
  category,
  subCategory,
  hero,
  initialProducts,
  allSubCategories,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { add } = useCart();
  const { isSaved, toggleSave } = useSavedArchive();

  // Active subcategory from URL query or path
  const querySub = searchParams.get('sub');
  const [activeSub, setActiveSub] = useState<string>(
    subCategory?.slug || querySub || 'view-all'
  );

  // Filter drawer state
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'newest' | 'price-asc' | 'price-desc'>('recommended');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(500); // Max $500 USD

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Horizontal subcategories carousel state (< > navigation)
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [allSubCategories]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollDistance = 280;
      const current = tabsRef.current.scrollLeft;
      const max = tabsRef.current.scrollWidth - tabsRef.current.clientWidth;
      const target = direction === 'left'
        ? Math.max(0, current - scrollDistance)
        : Math.min(max, current + scrollDistance);

      tabsRef.current.scrollTo({
        left: target,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 350);
    }
  };

  // Sync state if URL search param changes
  useEffect(() => {
    if (querySub) {
      setActiveSub(querySub);
    } else if (subCategory?.slug) {
      setActiveSub(subCategory.slug);
    } else {
      setActiveSub('view-all');
    }
  }, [querySub, subCategory]);

  // Handle switching subcategory tabs
  const handleTabClick = (subSlug: string) => {
    setActiveSub(subSlug);
    const basePath = `/shop/${pillar.slug}${category ? `/${category.slug}` : ''}`;
    if (subSlug === 'view-all') {
      router.push(basePath, { scroll: false });
    } else {
      router.push(`${basePath}?sub=${subSlug}`, { scroll: false });
    }
  };

  // Available filter options derived from current catalog
  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    initialProducts.forEach((p) => {
      p.colors.forEach((c) => {
        if (!map.has(c.name)) map.set(c.name, c.hex);
      });
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [initialProducts]);

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      p.sizes.forEach((s) => set.add(s));
    });
    return Array.from(set);
  }, [initialProducts]);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Subcategory filter
    if (activeSub && activeSub !== 'view-all') {
      result = result.filter(
        (p) => p.subCategory.toLowerCase() === activeSub.toLowerCase()
      );
    }

    // Color filter
    if (selectedColors.length > 0) {
      result = result.filter((p) =>
        p.colors.some((c) => selectedColors.includes(c.name))
      );
    }

    // Size filter
    if (selectedSizes.length > 0) {
      result = result.filter((p) =>
        p.sizes.some((s) => selectedSizes.includes(s))
      );
    }

    // Price filter
    result = result.filter((p) => p.price <= priceRange);

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.tag === 'New In' ? 1 : 0) - (a.tag === 'New In' ? 1 : 0));
    }

    return result;
  }, [initialProducts, activeSub, selectedColors, selectedSizes, priceRange, sortBy]);

  // Add product to cart
  const handleAddToCart = (product: ProductItem, size?: string) => {
    const chosenSize = size || product.sizes[0] || 'Default';
    add({
      variantId: `${product.id}-${chosenSize}`,
      name: `${product.name} (${chosenSize})`,
      price: product.price,
      qty: 1,
    });

    setToastMessage(`Added to cart: ${product.name}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const resetFilters = () => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange(500);
    setSortBy('recommended');
  };

  const hasActiveFilters =
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    priceRange < 500 ||
    sortBy !== 'recommended';

  return (
    <div className="min-h-screen bg-pearl pb-24">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-5 z-50 flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-xs tracking-wider text-white shadow-2xl backdrop-blur-md"
          >
            <Check size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
            <a
              href="/checkout"
              className="ml-2 font-semibold underline underline-offset-4 hover:text-neutral-300"
            >
              Checkout
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Category Header & Navigation Bar (Louis Vuitton Style) */}
      <div className="mx-auto max-w-[1800px] px-5 pt-8 md:px-10">
        {/* Minimal Back Button -> Returns to Home */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/')}
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-ink transition-colors font-medium"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>
        </div>

        {/* Large Page Title */}
        <div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-normal text-ink font-normal">
            {category ? category.name : pillar.name}
          </h1>
        </div>

        {/* 2. Subcategory Horizontal Tabs (LV Inspired Bar with < > navigation) */}
        {allSubCategories.length > 0 && (
          <div className="relative mt-8 border-b border-black/10">
            {/* Left Navigation Arrow (<) - Louis Vuitton Style */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-[1px] z-10 flex items-center pr-5 bg-gradient-to-r from-pearl via-pearl/95 to-transparent">
                <button
                  type="button"
                  onClick={() => scrollTabs('left')}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-neutral-300 bg-white/95 text-ink shadow-md flex items-center justify-center hover:bg-ink hover:text-white hover:border-ink hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  aria-label="Previous categories"
                  title="Previous categories"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            )}

            <div
              ref={tabsRef}
              onScroll={checkScroll}
              onWheel={(e) => {
                if (Math.abs(e.deltaX) > 0) {
                  e.preventDefault();
                }
              }}
              className="no-scrollbar flex items-center gap-8 overflow-x-hidden pb-4 text-sm whitespace-nowrap scroll-smooth px-2 touch-pan-y select-none"
            >
              {/* "View All" Tab */}
              <button
                onClick={() => handleTabClick('view-all')}
                className={`relative pb-3 font-medium transition-colors cursor-pointer shrink-0 ${
                  activeSub === 'view-all'
                    ? 'text-ink font-semibold'
                    : 'text-neutral-500 hover:text-ink'
                }`}
              >
                View All
                {activeSub === 'view-all' && (
                  <motion.div
                    layoutId="activeSubUnderline"
                    className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-ink"
                    transition={{ duration: 0.35, ease: lux }}
                  />
                )}
              </button>

              {/* Subcategory Specific Tabs */}
              {allSubCategories.map((sub) => {
                const isActive = activeSub === sub.slug;
                return (
                  <button
                    key={sub.slug}
                    onClick={() => handleTabClick(sub.slug)}
                    className={`relative pb-3 transition-colors cursor-pointer shrink-0 ${
                      isActive
                        ? 'text-ink font-semibold'
                        : 'text-neutral-500 hover:text-ink'
                    }`}
                  >
                    {sub.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeSubUnderline"
                        className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-ink"
                        transition={{ duration: 0.35, ease: lux }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Navigation Arrow (>) - Louis Vuitton Style */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-[1px] z-10 flex items-center pl-5 bg-gradient-to-l from-pearl via-pearl/95 to-transparent">
                <button
                  type="button"
                  onClick={() => scrollTabs('right')}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-neutral-300 bg-white/95 text-ink shadow-md flex items-center justify-center hover:bg-ink hover:text-white hover:border-ink hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  aria-label="Next categories"
                  title="Next categories"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Luxury Editorial Hero Banner with Floating Filter Button */}
      <div className="relative mx-auto mt-6 max-w-[1800px] px-5 md:px-10">
        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-sm bg-neutral-200 shadow-sm sm:aspect-[21/9]">
          <img
            src={hero.bannerImage}
            alt={`${hero.pillarName} ${hero.title} Campaign`}
            className="h-full w-full object-cover object-center transition-transform duration-1000 ease-lux hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

          {/* Floating Pill: Filter & Sort by (Matches LV screenshot) */}
          <div className="absolute inset-x-0 bottom-6 flex justify-center">
            <button
              onClick={() => setFilterOpen(true)}
              className="group flex items-center gap-3 rounded-full bg-ink/90 px-7 py-3 text-xs font-medium tracking-wider text-white backdrop-blur-md shadow-2xl transition-all duration-300 hover:bg-ink hover:scale-105 active:scale-95"
            >
              <SlidersHorizontal
                size={14}
                className="transition-transform group-hover:rotate-90 duration-300"
              />
              <span className="uppercase tracking-widest">Filter &amp; Sort by</span>
              {hasActiveFilters && (
                <span className="grid h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Luxury Product Grid - 2 columns on mobile, responsive up to 4 */}
      <div className="mx-auto max-w-[1800px] px-3 sm:px-5 pt-6 sm:pt-10 md:px-10">
        {filteredProducts.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center py-16 text-center">
            <span className="font-display text-2xl text-neutral-400">
              No matching pieces found in this selection.
            </span>
            <p className="mt-2 text-sm text-neutral-500">
              Try adjusting your filters or browsing all subcategories.
            </p>
            <button
              onClick={() => {
                resetFilters();
                handleTabClick('view-all');
              }}
              className="btn-ink mt-6 text-xs uppercase tracking-widest"
            >
              Show All {category?.name || pillar.name}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                toggleSave={toggleSave}
                isSaved={isSaved}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. Filter & Sort Slide-over Drawer */}
      <AnimatePresence>
        {filterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilterOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.5, ease: lux }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex h-20 items-center justify-between border-b border-black/10 px-6">
                <div>
                  <h2 className="font-display text-2xl tracking-normal">Filter &amp; Sort</h2>
                  <p className="text-xs text-neutral-500">
                    Refine {category ? category.name : pillar.name} collection
                  </p>
                </div>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="rounded-full p-2 transition-colors hover:bg-neutral-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 divide-y divide-black/10">
                {/* Sort Option */}
                <div className="pb-6">
                  <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3 font-semibold">
                    Sort By
                  </h3>
                  <div className="space-y-2">
                    {[
                      { id: 'recommended', label: 'Curated / Recommended' },
                      { id: 'newest', label: 'Newest Additions' },
                      { id: 'price-asc', label: 'Price: Low to High' },
                      { id: 'price-desc', label: 'Price: High to Low' },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center justify-between rounded-lg p-2.5 text-sm transition-colors hover:bg-neutral-50 cursor-pointer"
                      >
                        <span className={sortBy === item.id ? 'font-semibold text-ink' : 'text-neutral-700'}>
                          {item.label}
                        </span>
                        <input
                          type="radio"
                          name="sort"
                          checked={sortBy === item.id}
                          onChange={() => setSortBy(item.id as any)}
                          className="accent-black h-4 w-4"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Subcategory selection */}
                {allSubCategories.length > 0 && (
                  <div className="py-6">
                    <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3 font-semibold">
                      Category
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleTabClick('view-all')}
                        className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
                          activeSub === 'view-all'
                            ? 'bg-ink text-white'
                            : 'border border-black/10 bg-neutral-50 text-neutral-800 hover:border-black'
                        }`}
                      >
                        All Categories
                      </button>
                      {allSubCategories.map((sub) => (
                        <button
                          key={sub.slug}
                          onClick={() => handleTabClick(sub.slug)}
                          className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
                            activeSub === sub.slug
                              ? 'bg-ink text-white'
                              : 'border border-black/10 bg-neutral-50 text-neutral-800 hover:border-black'
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors Filter */}
                {availableColors.length > 0 && (
                  <div className="py-6">
                    <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3 font-semibold">
                      Color Palette
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {availableColors.map((color) => {
                        const isSelected = selectedColors.includes(color.name);
                        return (
                          <button
                            key={color.name}
                            onClick={() => {
                              setSelectedColors(
                                isSelected
                                  ? selectedColors.filter((c) => c !== color.name)
                                  : [...selectedColors, color.name]
                              );
                            }}
                            className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs text-left transition-colors ${
                              isSelected
                                ? 'border-black bg-neutral-50 font-semibold'
                                : 'border-black/10 hover:border-black/30'
                            }`}
                          >
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="truncate">{color.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes Filter */}
                {availableSizes.length > 0 && (
                  <div className="py-6">
                    <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3 font-semibold">
                      Size
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => {
                        const isSelected = selectedSizes.includes(size);
                        return (
                          <button
                            key={size}
                            onClick={() => {
                              setSelectedSizes(
                                isSelected
                                  ? selectedSizes.filter((s) => s !== size)
                                  : [...selectedSizes, size]
                              );
                            }}
                            className={`min-w-10 rounded-md border py-2 px-3 text-xs font-medium transition-colors ${
                              isSelected
                                ? 'border-black bg-ink text-white'
                                : 'border-black/15 bg-white text-neutral-800 hover:border-black'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Price Filter */}
                <div className="py-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
                      Maximum Price
                    </h3>
                    <span className="text-xs font-semibold text-ink">
                      ${priceRange.toLocaleString('en-US')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="500"
                    step="10"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
                    <span>$30</span>
                    <span>$500+</span>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex items-center gap-3 border-t border-black/10 p-6 bg-pearl">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-3 text-xs uppercase tracking-widest text-neutral-600 underline underline-offset-4 hover:text-ink"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="btn-ink flex-[2] text-xs uppercase tracking-widest py-3"
                >
                  View {filteredProducts.length} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StorefrontProductCardProps {
  product: ProductItem;
  toggleSave: (item: any) => void;
  isSaved: (id: string) => boolean;
}

function StorefrontProductCard({ product, toggleSave, isSaved }: StorefrontProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0] || { name: 'Standard', hex: '#18181b' }
  );

  // Helper function to check if color names match
  const isColorMatch = (tag: string, target: string) => {
    const a = (tag || '').toLowerCase().trim();
    const b = (target || '').toLowerCase().trim();
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    if ((a.includes('hitam') || a.includes('black')) && (b.includes('hitam') || b.includes('black'))) return true;
    if ((a.includes('putih') || a.includes('white')) && (b.includes('putih') || b.includes('white'))) return true;
    if ((a.includes('abu') || a.includes('grey') || a.includes('gray')) && (b.includes('abu') || b.includes('grey') || b.includes('gray'))) return true;
    if ((a.includes('biru') || a.includes('blue') || a.includes('navy')) && (b.includes('biru') || b.includes('blue') || b.includes('navy'))) return true;
    if ((a.includes('hijau') || a.includes('green') || a.includes('olive')) && (b.includes('hijau') || b.includes('green') || b.includes('olive'))) return true;
    if ((a.includes('coklat') || a.includes('brown')) && (b.includes('coklat') || b.includes('brown'))) return true;
    if ((a.includes('krem') || a.includes('cream') || a.includes('beige')) && (b.includes('krem') || b.includes('cream') || b.includes('beige'))) return true;
    return false;
  };

  // Compute image based on selectedColor
  const activeImage = useMemo(() => {
    if (!selectedColor) return product.image;
    const targetName = selectedColor.name;

    if (product.colorImages) {
      for (const [key, urls] of Object.entries(product.colorImages)) {
        if (isColorMatch(key, targetName) && Array.isArray(urls) && urls.length > 0) {
          return urls[0];
        }
      }
    }

    if (product.images && product.images.length > 0) {
      const match = product.images.find((img) => isColorMatch(img.colorTag || '', targetName));
      if (match?.url) return match.url;
    }

    return product.image;
  }, [selectedColor, product]);

  return (
    <a
      href={`/product/${product.slug}`}
      className="group flex flex-col cursor-pointer"
    >
      {/* Image Container with Luxury Hover */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F0EEEB] transition-all duration-700 ease-lux group-hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.25)]">
        <img
          src={activeImage}
          alt={`${product.name} - ${selectedColor.name}`}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-lux group-hover:scale-105"
          loading="lazy"
        />

        {/* Tag badge */}
        {product.tag && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded-none bg-ink px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase text-white">
            {product.tag}
          </span>
        )}

        {/* Heart / Favorite Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSave({
              id: product.id,
              name: product.name,
              price: product.price,
              image: activeImage,
              slug: product.slug,
              material: product.material,
            });
          }}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-2 rounded-full bg-white/85 hover:bg-white text-neutral-600 transition-all shadow-xs backdrop-blur-xs hover:scale-110 active:scale-95 cursor-pointer"
          aria-label={isSaved(product.id) ? 'Remove from saved archive' : 'Add to saved archive'}
        >
          <Heart
            size={15}
            className={`transition-colors ${
              isSaved(product.id)
                ? 'fill-rose-500 text-rose-500'
                : 'text-neutral-700 hover:text-ink'
            }`}
          />
        </button>

        {/* Quick view indicator on hover (desktop) */}
        <div className="hidden sm:block absolute inset-x-3 bottom-3 translate-y-6 opacity-0 transition-all duration-400 ease-lux group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center justify-center rounded-none bg-white/95 py-2.5 px-4 backdrop-blur-md shadow-lg">
            <span className="text-center text-[10px] font-semibold tracking-widest text-ink uppercase">
              View Piece &amp; Select Size
            </span>
          </div>
        </div>
      </div>

      {/* Product Meta */}
      <div className="mt-3 sm:mt-4 flex flex-col">
        {/* Color Swatch Dots on Card if more than 1 color */}
        {product.colors && product.colors.length > 1 && (
          <div className="flex items-center gap-1.5 mb-1.5">
            {product.colors.slice(0, 6).map((c) => {
              const isSelected = selectedColor.name.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(c);
                  }}
                  onMouseEnter={() => setSelectedColor(c)}
                  className={`w-3 h-3 rounded-full border transition-transform cursor-pointer ${
                    isSelected ? 'ring-2 ring-black scale-115' : 'border-black/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              );
            })}
            {product.colors.length > 6 && (
              <span className="text-[10px] text-neutral-400">+{product.colors.length - 6}</span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-sans text-xs sm:text-sm font-medium tracking-normal text-ink transition-opacity group-hover:opacity-75 line-clamp-1 sm:line-clamp-none">
          {product.name}
        </h3>

        {/* Material & silhouette note */}
        <p className="mt-0.5 text-[10px] sm:text-xs text-neutral-500 line-clamp-1">
          {product.material}
        </p>

        {/* Price and Add to Cart link */}
        <div className="mt-1.5 sm:mt-2 flex items-center justify-between gap-2">
          <span className="font-sans text-xs sm:text-sm font-semibold tracking-normal text-ink">
            ${product.price.toLocaleString('en-US')}
          </span>
          <span
            className="text-[10px] sm:text-xs uppercase tracking-wider text-neutral-500 underline underline-offset-4 group-hover:text-ink transition-colors"
          >
            Add to Cart
          </span>
        </div>
      </div>
    </a>
  );
}

