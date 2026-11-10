'use client';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, ArrowLeft, Heart } from 'lucide-react';
import { ProductItem, mapDbProductToItem } from '@/lib/catalogData';
import { useSavedArchive } from '@/context/SavedArchiveContext';

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSaved, toggleSave } = useSavedArchive();
  const query = (searchParams.get('q') || '').trim();

  const [dbResults, setDbResults] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  useEffect(() => {
    if (!query) {
      setDbResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/products?search=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          setDbResults(data.data.map(mapDbProductToItem));
        } else {
          setDbResults([]);
        }
      })
      .catch(() => setDbResults([]))
      .finally(() => setLoading(false));
  }, [query]);

  // Sort products
  const filteredProducts = useMemo(() => {
    return [...dbResults].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0; // featured default
    });
  }, [dbResults, sortBy]);

  return (
    <div className="min-h-screen bg-pearl pb-24">
      {/* Main Container */}
      <div className="mx-auto max-w-[1800px] px-5 pt-8 md:px-10">
        {/* Back Button -> Always returns to Home (Parent Tree) */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-ink transition-colors font-medium"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>
        </div>

        {/* Results Title */}
        <div className="pb-3">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-normal text-ink font-normal">
            {query ? `Results for “${searchParams.get('q')}”` : 'All Catalog Pieces'}
          </h1>
        </div>

        {/* Compact Sort Filter on the LEFT */}
        <div className="flex items-center justify-start pb-6 border-b border-black/10">
          <div className="relative inline-flex items-center border border-black/15 bg-white px-3 py-1.5 text-xs shadow-2xs">
            <ArrowUpDown size={12} className="mr-2 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-medium uppercase tracking-wider text-ink outline-none cursor-pointer pr-1 text-[11px]"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center py-16 text-center">
            <span className="font-display text-3xl text-neutral-400 font-normal">
              No creations found for &ldquo;{searchParams.get('q')}&rdquo;
            </span>
            <p className="mt-3 max-w-md text-sm text-neutral-500">
              We couldn&apos;t find any items matching your search. Try checking your spelling or explore our collections.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a href="/shop/men" className="btn-ink text-xs uppercase tracking-widest">
                Shop Men
              </a>
              <a href="/shop/women" className="btn-line text-xs uppercase tracking-widest">
                Shop Women
              </a>
              <a href="/shop/accessories" className="btn-line text-xs uppercase tracking-widest">
                Shop Accessories
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <a
                key={product.id}
                href={`/product/${product.slug}`}
                className="group flex flex-col cursor-pointer"
              >
                {/* Image Container with Luxury Hover */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F0EEEB] transition-all duration-700 ease-lux group-hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.25)]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition-transform duration-700 ease-lux group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Tag badge */}
                  {product.tag && (
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-ink px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase text-white">
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
                        image: product.image,
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
                    <div className="flex items-center justify-center bg-white/95 py-2.5 px-4 backdrop-blur-md shadow-lg">
                      <span className="text-center text-[10px] font-semibold tracking-widest text-ink uppercase">
                        View Piece &amp; Select Size
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Meta */}
                <div className="mt-3 sm:mt-4 flex flex-col">
                  {/* Color Swatch Dots */}
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                    {product.colors.map((c) => (
                      <span
                        key={c.name}
                        title={c.name}
                        className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                    <span className="ml-1 text-[10px] text-neutral-400">
                      {product.colors.length} {product.colors.length === 1 ? 'color' : 'colors'}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-display text-base sm:text-lg text-ink font-normal leading-snug group-hover:underline">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <span className="mt-1 font-sans text-xs sm:text-sm font-semibold tracking-normal text-ink">
                    ${product.price.toLocaleString('en-US')}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="font-display text-2xl tracking-widest text-neutral-400">
            LOADING SEARCH...
          </div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
