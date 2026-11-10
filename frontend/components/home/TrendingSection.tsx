'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { catalogProducts, ProductItem, formatUSD, mapDbProductToItem } from '@/lib/catalogData';
import { useSavedArchive } from '@/context/SavedArchiveContext';
import { lux } from '@/lib/motion';

interface TrendingSectionProps {
  initialProducts?: ProductItem[];
}

export default function TrendingSection({ initialProducts = [] }: TrendingSectionProps) {
  const [activeGender, setActiveGender] = useState<'men' | 'women'>('men');
  const [dbTrending, setDbTrending] = useState<ProductItem[]>(initialProducts);

  useEffect(() => {
    fetch('/api/products?trending=true')
      .then((res) => res.json())
      .then(async (data) => {
        let items = data?.data || [];
        if (!Array.isArray(items) || items.length === 0) {
          const fallbackRes = await fetch('/api/products');
          const fallbackData = await fallbackRes.json();
          items = fallbackData?.data || [];
        }
        if (Array.isArray(items) && items.length > 0) {
          const mapped: ProductItem[] = items.map(mapDbProductToItem);
          if (mapped.length > 0) {
            setDbTrending(mapped);
          }
        }
      })
      .catch(() => {});
  }, []);

  const filtered = dbTrending.filter((p) => p.pillar === activeGender);
  const products = filtered.length > 0 ? filtered : dbTrending;
  const sectionRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '200px' });
  const { isSaved, toggleSave } = useSavedArchive();

  if (dbTrending.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth * 0.75;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-[1800px] px-5 py-20 md:px-10 md:py-28 lg:py-32"
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: lux }}
        className="mb-6 space-y-3.5 md:mb-8 md:space-y-4"
      >
        {/* Title */}
        <div>
          <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl md:text-4xl">
            Trending Now
          </h2>
        </div>

        {/* Action bar: Men/Women on the left, View All on the right (sejajar) */}
        <div className="flex items-center justify-between gap-4">
          {/* Men / Women Switcher */}
          <div className="flex items-center rounded-full border border-black/10 bg-white/80 p-0.5 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => {
                setActiveGender('men');
                sliderRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer sm:px-3.5 ${
                activeGender === 'men'
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-neutral-500 hover:text-ink'
              }`}
            >
              Men
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveGender('women');
                sliderRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer sm:px-3.5 ${
                activeGender === 'women'
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-neutral-500 hover:text-ink'
              }`}
            >
              Women
            </button>
          </div>

          {/* Right: Desktop arrows + View All */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden items-center gap-1.5 md:flex">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="grid h-8 w-8 place-items-center rounded-full border border-black/15 text-neutral-600 transition-all hover:border-ink hover:text-ink active:scale-95 cursor-pointer"
                aria-label="Previous items"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="grid h-8 w-8 place-items-center rounded-full border border-black/15 text-neutral-600 transition-all hover:border-ink hover:text-ink active:scale-95 cursor-pointer"
                aria-label="Next items"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <a
              href={`/shop/${activeGender}`}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600 underline underline-offset-4 decoration-neutral-400 transition-colors hover:text-ink hover:decoration-ink whitespace-nowrap"
            >
              View All
            </a>
          </div>
        </div>
      </motion.div>

      {/* Horizontally scrollable product carousel */}
      <div className="relative -mx-5 px-5 md:-mx-10 md:px-10">
        <div
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory sm:gap-5 md:gap-6"
        >
          {products.map((product, i) => (
            <motion.a
              key={product.id}
              href={`/product/${product.slug}`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: lux,
              }}
              className="group relative flex w-[68vw] max-w-[260px] min-w-[200px] flex-none snap-start flex-col sm:w-[240px] md:w-[270px] lg:w-[290px]"
            >
            {/* Image container */}
            <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-lux group-hover:scale-105"
                loading="lazy"
              />

              {/* Tag badge */}
              {product.tag && (
                <span className="absolute left-2 top-2 bg-ink px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
                  {product.tag}
                </span>
              )}

              {/* Heart / Favorite */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSave({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    slug: product.slug,
                    material: product.material,
                  });
                }}
                className="absolute right-2 top-2 z-10 rounded-full bg-white/85 p-2 text-neutral-600 shadow-xs backdrop-blur-xs transition-all hover:scale-110 hover:bg-white active:scale-95 sm:right-3 sm:top-3 cursor-pointer"
                aria-label={
                  isSaved(product.id) ? 'Remove from saved' : 'Save item'
                }
              >
                <Heart
                  size={15}
                  className={`transition-colors ${isSaved(product.id)
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-neutral-700 hover:text-ink'
                    }`}
                />
              </button>

              {/* Quick view on hover */}
              <div className="absolute inset-x-3 bottom-3 hidden translate-y-6 opacity-0 transition-all duration-400 ease-lux group-hover:translate-y-0 group-hover:opacity-100 sm:block">
                <div className="flex items-center justify-center bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
                  <span className="text-center text-[10px] font-semibold uppercase tracking-widest text-ink">
                    View Piece &amp; Select Size
                  </span>
                </div>
              </div>
            </div>

            {/* Product meta */}
            <div className="mt-3 flex flex-col sm:mt-4">
              {/* Name */}
              <h3 className="line-clamp-1 text-xs font-medium tracking-normal text-ink transition-opacity group-hover:opacity-75 sm:line-clamp-none sm:text-sm">
                {product.name}
              </h3>

              {/* Material */}
              <p className="mt-0.5 line-clamp-1 text-[10px] text-neutral-500 sm:text-xs">
                {product.material}
              </p>

              {/* Price & Add to Cart */}
              <div className="mt-1.5 flex items-center justify-between gap-2 sm:mt-2">
                <span className="text-xs font-semibold tracking-normal text-ink sm:text-sm">
                  {formatUSD(product.price)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 underline underline-offset-4 transition-colors group-hover:text-ink sm:text-xs">
                  Add to Cart
                </span>
              </div>
            </div>
          </motion.a>
        ))}
        </div>
      </div>
    </section>
  );
}
