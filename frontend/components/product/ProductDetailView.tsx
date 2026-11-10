'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Check,
  ChevronDown,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Ruler,
  Heart,
} from 'lucide-react';
import { ProductItem } from '@/lib/catalogData';
import { useCart } from '@/context/CartContext';
import { useSavedArchive } from '@/context/SavedArchiveContext';
import { lux } from '@/lib/motion';
import ProductReviews from './ProductReviews';

type Props = {
  product: ProductItem;
  relatedProducts: ProductItem[];
};

export default function ProductDetailView({ product, relatedProducts }: Props) {
  const router = useRouter();
  const { add, openCart } = useCart();
  const { isSaved, toggleSave } = useSavedArchive();

  // Active selections (Color, Size, Quantity)
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0] || { name: 'Standard', hex: '#111111' }
  );
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    image: string;
  } | null>(null);
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string>('details');

  // Helper function to check if color names match (supports exact, partial, and cross-lingual match)
  const isColorMatch = (tag: string, target: string) => {
    const a = (tag || '').toLowerCase().trim();
    const b = (target || '').toLowerCase().trim();
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    // Cross-lingual synonyms
    if ((a.includes('hitam') || a.includes('black') || a.includes('onyx') || a.includes('charcoal')) &&
        (b.includes('hitam') || b.includes('black') || b.includes('onyx') || b.includes('charcoal'))) return true;
    if ((a.includes('putih') || a.includes('white') || a.includes('optic') || a.includes('snow')) &&
        (b.includes('putih') || b.includes('white') || b.includes('optic') || b.includes('snow'))) return true;
    if ((a.includes('abu') || a.includes('grey') || a.includes('gray')) &&
        (b.includes('abu') || b.includes('grey') || b.includes('gray'))) return true;
    if ((a.includes('biru') || a.includes('blue') || a.includes('navy')) &&
        (b.includes('biru') || b.includes('blue') || b.includes('navy'))) return true;
    if ((a.includes('hijau') || a.includes('green') || a.includes('olive') || a.includes('sage')) &&
        (b.includes('hijau') || b.includes('green') || b.includes('olive') || b.includes('sage'))) return true;
    if ((a.includes('coklat') || a.includes('brown') || a.includes('tan') || a.includes('mocha')) &&
        (b.includes('coklat') || b.includes('brown') || b.includes('tan') || b.includes('mocha'))) return true;
    if ((a.includes('krem') || a.includes('cream') || a.includes('beige') || a.includes('sand')) &&
        (b.includes('krem') || b.includes('cream') || b.includes('beige') || b.includes('sand'))) return true;
    return false;
  };

  // Compute color gallery dynamically based on selectedColor
  const currentColorGallery = useMemo(() => {
    if (!selectedColor) return product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
    const targetName = selectedColor.name;

    // 1. Match in product.colorImages
    if (product.colorImages) {
      for (const [key, urls] of Object.entries(product.colorImages)) {
        if (isColorMatch(key, targetName) && Array.isArray(urls) && urls.length > 0) {
          return urls;
        }
      }
    }

    // 2. Match in product.images
    if (product.images && product.images.length > 0) {
      const matched = product.images
        .filter((img) => isColorMatch(img.colorTag || '', targetName))
        .map((img) => img.url);
      if (matched.length > 0) return matched;
    }

    // 3. Fallback to full gallery or product image
    return product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
  }, [selectedColor, product]);

  const [activeImage, setActiveImage] = useState<string>(() => {
    if (product.colorImages && product.colors[0]) {
      const colorName = product.colors[0].name;
      for (const [key, urls] of Object.entries(product.colorImages)) {
        if (isColorMatch(key, colorName) && Array.isArray(urls) && urls[0]) {
          return urls[0];
        }
      }
    }
    if (product.images && product.colors[0]) {
      const match = product.images.find((img) => isColorMatch(img.colorTag || '', product.colors[0].name));
      if (match?.url) return match.url;
    }
    return product.image;
  });

  // Switch color handler: updates color and automatically switches to the first image of that color
  const handleSelectColor = (color: { name: string; hex: string }) => {
    setSelectedColor(color);
    let newImage = '';
    if (product.colorImages) {
      for (const [key, urls] of Object.entries(product.colorImages)) {
        if (isColorMatch(key, color.name) && Array.isArray(urls) && urls.length > 0) {
          newImage = urls[0];
          break;
        }
      }
    }
    if (!newImage && product.images) {
      const match = product.images.find(
        (img) => isColorMatch(img.colorTag || '', color.name)
      );
      if (match) newImage = match.url;
    }
    if (!newImage) {
      newImage = product.gallery?.[0] || product.image;
    }
    setActiveImage(newImage);
  };

  // Sync activeImage if the current gallery changes and does not include activeImage
  useEffect(() => {
    if (currentColorGallery.length > 0 && !currentColorGallery.includes(activeImage)) {
      setActiveImage(currentColorGallery[0]);
    }
  }, [currentColorGallery, activeImage]);

  // Handle Add to Cart action: Graceful flying animation + checkmark, then open cart only after both finish
  const handleAddToCart = () => {
    if (addedSuccess || flyingItem) return;

    // 1. Calculate positions for flying thumbnail
    const btnRect = addToCartBtnRef.current?.getBoundingClientRect();
    const startX = btnRect ? btnRect.left + btnRect.width / 2 : window.innerWidth / 2;
    const startY = btnRect ? btnRect.top + btnRect.height / 2 : window.innerHeight / 2;

    const cartBtn = document.getElementById('header-cart-btn');
    const cartRect = cartBtn?.getBoundingClientRect();
    const targetX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 60;
    const targetY = cartRect ? cartRect.top + cartRect.height / 2 : 35;

    // 2. Trigger checkmark state & graceful flight animation simultaneously
    setAddedSuccess(true);
    setFlyingItem({
      startX,
      startY,
      targetX,
      targetY,
      image: activeImage,
    });

    const variantId = `${product.id}-${selectedColor.name.toLowerCase().replace(/\s+/g, '-')}-${selectedSize.toLowerCase()}`;

    // 3. Mini token reaches the cart bag at 950ms (pelan & elegan) -> add item to cart
    setTimeout(() => {
      add({
        variantId,
        name: `${product.name}`,
        price: product.price,
        qty: 1,
        image: activeImage,
        color: selectedColor.name,
        size: selectedSize,
        slug: product.slug,
      });
      setFlyingItem(null);
    }, 950);

    // 4. ONLY open cart drawer after both checkmark & flying animation have completely finished (~1150ms)
    setTimeout(() => {
      openCart();
    }, 1150);

    // 5. Reset button state after 3s
    setTimeout(() => {
      setAddedSuccess(false);
    }, 3000);
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? '' : id);
  };

  return (
    <div className="min-h-screen bg-pearl pb-24">
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 md:px-10 lg:pt-8">
        {/* Sleek Minimalist Back Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-ink transition-colors font-medium cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>
        </div>

        {/* Main Product Section: Split 2-Column Layout */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Editorial Gallery (7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col-reverse gap-4 md:flex-row">
            {/* Gallery Thumbnails List */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {currentColorGallery.map((img, idx) => (
                <button
                  key={`${img.slice(-20)}-${idx}`}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-20 w-16 sm:h-24 sm:w-20 flex-shrink-0 overflow-hidden bg-neutral-100 transition-all cursor-pointer rounded-sm ${
                    activeImage === img
                      ? 'ring-2 ring-ink ring-offset-2 opacity-100'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${selectedColor.name} view ${idx + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>

            {/* Main High-Resolution Display Image */}
            <div className="relative aspect-[3/4] w-full flex-1 overflow-hidden bg-[#F2F0EC] shadow-sm">
              <img
                src={activeImage}
                alt={product.name}
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-lux hover:scale-105"
              />

              {/* Tag Badge */}
              {product.tag && (
                <span className="absolute top-4 left-4 bg-ink px-3 py-1 text-[11px] font-semibold tracking-widest uppercase text-white shadow-md">
                  {product.tag}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Buy Box & Configuration (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Header / Title / Pricing */}
            <div className="border-b border-black/10 pb-6">
              <h1 className="font-display text-3xl sm:text-4xl text-ink font-normal tracking-normal">
                {product.name}
              </h1>

              <div className="mt-3">
                <span className="font-sans text-2xl font-semibold tracking-normal text-ink">
                  ${product.price.toLocaleString('en-US')}
                </span>
              </div>
            </div>

            {/* 1. Color Selector (Gymshark / Luxury Style) */}
            <div>
              <div className="flex items-center justify-between text-xs tracking-wider mb-2.5">
                <span className="text-neutral-500 uppercase">Color:</span>
                <span className="font-semibold text-ink capitalize">{selectedColor.name}</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => {
                  const isSelected = selectedColor.name.toLowerCase() === color.name.toLowerCase();
                  return (
                    <button
                      key={color.name}
                      onClick={() => handleSelectColor(color)}
                      className={`group flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-ink bg-neutral-50 font-semibold shadow-sm'
                          : 'border-black/15 bg-white text-neutral-700 hover:border-black/40'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/30 shadow-xs shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="capitalize">{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Size Selector (Gymshark Style) */}
            <div>
              <div className="flex items-center justify-between text-xs tracking-wider mb-2.5">
                <span className="text-neutral-500 uppercase">Select Size:</span>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="flex items-center gap-1 text-neutral-500 underline underline-offset-4 hover:text-ink transition-colors"
                >
                  <Ruler size={13} />
                  <span>Size Guide</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 rounded-sm border text-xs font-semibold uppercase tracking-wider transition-all ${
                        isSelected
                          ? 'border-ink bg-ink text-white shadow-md'
                          : 'border-black/15 bg-white text-neutral-800 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Button: Add to Cart */}
            <div className="pt-2 flex items-center gap-3">
              <button
                ref={addToCartBtnRef}
                onClick={handleAddToCart}
                disabled={addedSuccess}
                className={`btn-ink flex-1 flex items-center justify-center gap-3 py-4 text-xs font-semibold uppercase tracking-widest transition-all duration-300 ${
                  addedSuccess
                    ? 'bg-neutral-900 text-white shadow-lg'
                    : 'hover:scale-[1.01]'
                }`}
              >
                <AnimatePresence mode="wait">
                  {addedSuccess ? (
                    <motion.div
                      key="added"
                      initial={{ opacity: 0, scale: 0.6, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="flex items-center gap-2 text-white"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 20, delay: 0.05 }}
                      >
                        <Check size={18} className="text-emerald-400 stroke-[3]" />
                      </motion.div>
                      <span>Added to Cart!</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="flex items-center gap-2.5"
                    >
                      <ShoppingBag size={18} />
                      <span>Add to Cart</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <button
                type="button"
                onClick={() =>
                  toggleSave({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: activeImage,
                    slug: product.slug,
                    material: product.material,
                  })
                }
                className="h-[52px] w-[52px] rounded-sm border border-neutral-300 flex items-center justify-center hover:border-ink transition-colors cursor-pointer shrink-0 bg-white"
                aria-label={isSaved(product.id) ? 'Remove from saved archive' : 'Save to archive'}
                title={isSaved(product.id) ? 'Saved in Archive' : 'Save to Archive'}
              >
                <Heart
                  size={20}
                  className={`transition-colors ${
                    isSaved(product.id)
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-neutral-700 hover:text-ink'
                  }`}
                />
              </button>
            </div>

            {/* 5. Value Props (Shipping & Guarantee) */}
            <div className="rounded-sm border border-black/5 bg-[#FAFAF8] p-4 space-y-2.5 text-xs text-neutral-600">
              <div className="flex items-center gap-2.5">
                <Truck size={15} className="text-ink flex-shrink-0" />
                <span>Complimentary Standard Shipping on orders over $150</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw size={15} className="text-ink flex-shrink-0" />
                <span>30-Day Hassle-Free Returns &amp; Size Exchanges</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={15} className="text-ink flex-shrink-0" />
                <span>Guaranteed Authentic with Archival Dust Box</span>
              </div>
            </div>

            {/* 6. Expandable Accordions for Details & Materials */}
            <div className="border-t border-black/10 divide-y divide-black/10 pt-2">
              {/* Description */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('details')}
                  className="flex w-full items-center justify-between text-left text-xs uppercase tracking-widest font-semibold text-ink"
                >
                  <span>Design &amp; Silhouette</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${
                      openAccordion === 'details' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'details' && (
                  <div className="pt-3 text-xs leading-relaxed text-neutral-600">
                    <p>{product.description}</p>
                    <p className="mt-2 font-medium text-ink">Fit profile: {product.fit}</p>
                  </div>
                )}
              </div>

              {/* Material */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('material')}
                  className="flex w-full items-center justify-between text-left text-xs uppercase tracking-widest font-semibold text-ink"
                >
                  <span>Fabric &amp; Composition</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${
                      openAccordion === 'material' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'material' && (
                  <div className="pt-3 text-xs leading-relaxed text-neutral-600 space-y-1">
                    <p>• {product.material}</p>
                    <p>• Hand wash or delicate cold cycle (30°C max)</p>
                    <p>• Lay flat to dry in shade to preserve structural tension</p>
                  </div>
                )}
              </div>

              {/* Shipping & Delivery */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('shipping')}
                  className="flex w-full items-center justify-between text-left text-xs uppercase tracking-widest font-semibold text-ink"
                >
                  <span>Shipping &amp; Care</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${
                      openAccordion === 'shipping' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'shipping' && (
                  <div className="pt-3 text-xs leading-relaxed text-neutral-600 space-y-1.5">
                    <p>All pieces are shipped from our Jakarta atelier via tracked express courier with signature required on delivery.</p>
                    <p>Domestic delivery: 1–3 business days.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        <ProductReviews productId={product.id} productName={product.name} />

        {/* 7. Related Pieces / Complete The Look */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-black/10 pt-16">
            <div className="mb-8 flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-neutral-500">
                  Curated Essentials
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-ink font-normal mt-1">
                  Complete the Look
                </h2>
              </div>
              <a
                href={`/shop/${product.pillar}/${product.category}`}
                className="text-xs uppercase tracking-wider text-neutral-600 underline underline-offset-4 hover:text-ink flex items-center gap-1"
              >
                <span>View All {product.category}</span>
                <ArrowRight size={13} />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 md:grid-cols-4">
              {relatedProducts.map((item) => (
                <a
                  key={item.id}
                  href={`/product/${item.slug}`}
                  className="group flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F0EEEB] transition-all duration-700 ease-lux group-hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.25)]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-lux group-hover:scale-105"
                      loading="lazy"
                    />
                    {item.tag && (
                      <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-ink px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase text-white">
                        {item.tag}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSave({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: item.image,
                          slug: item.slug,
                          material: item.material,
                        });
                      }}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-2 rounded-full bg-white/85 hover:bg-white text-neutral-600 transition-all shadow-xs backdrop-blur-xs hover:scale-110 active:scale-95 cursor-pointer"
                      aria-label={isSaved(item.id) ? 'Remove from saved archive' : 'Add to saved archive'}
                    >
                      <Heart
                        size={15}
                        className={`transition-colors ${
                          isSaved(item.id)
                            ? 'fill-rose-500 text-rose-500'
                            : 'text-neutral-700 hover:text-ink'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col">
                    <h3 className="font-sans text-xs sm:text-sm font-medium tracking-normal text-ink group-hover:opacity-75 line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 text-[10px] sm:text-xs text-neutral-500 line-clamp-1">
                      {item.material}
                    </p>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="font-sans text-xs sm:text-sm font-semibold text-ink">
                        ${item.price.toLocaleString('en-US')}
                      </span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-neutral-500 underline underline-offset-4 group-hover:text-ink">
                        View
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {sizeGuideOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSizeGuideOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white p-6 sm:p-8 shadow-2xl rounded-sm max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <h3 className="font-display text-2xl text-ink">Sizing Guide</h3>
                <button
                  onClick={() => setSizeGuideOpen(false)}
                  className="rounded-full p-1.5 hover:bg-neutral-100"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="mt-4 text-xs text-neutral-600 space-y-4">
                <p>All measurements are listed in centimeters (cm). Our tops are designed with an architectural contemporary silhouette.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/20 text-ink font-semibold">
                        <th className="py-2">Size</th>
                        <th className="py-2">Chest</th>
                        <th className="py-2">Length</th>
                        <th className="py-2">Shoulder</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      <tr><td className="py-2 font-medium">S</td><td>96 - 100</td><td>70</td><td>47</td></tr>
                      <tr><td className="py-2 font-medium">M</td><td>102 - 106</td><td>72</td><td>49</td></tr>
                      <tr><td className="py-2 font-medium">L</td><td>108 - 112</td><td>74</td><td>51</td></tr>
                      <tr><td className="py-2 font-medium">XL</td><td>114 - 118</td><td>76</td><td>53</td></tr>
                      <tr><td className="py-2 font-medium">XXL</td><td>120 - 124</td><td>78</td><td>55</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 text-neutral-500">
                  <p>• If you prefer a tailored fit, choose your regular size.</p>
                  <p>• For an oversized runway drape, order one size up.</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Gymshark-Style Compact Flying Item to Cart */}
      <AnimatePresence>
        {flyingItem && (
          <motion.div
            initial={{
              position: 'fixed',
              left: flyingItem.startX,
              top: flyingItem.startY,
              x: '-50%',
              y: '-50%',
              scale: 0.9,
              opacity: 1,
              zIndex: 9999,
            }}
            animate={{
              left: flyingItem.targetX,
              top: flyingItem.targetY,
              scale: [0.9, 1.05, 0.7, 0.25],
              opacity: [1, 1, 1, 0.7, 0],
            }}
            transition={{
              duration: 0.95,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="pointer-events-none fixed z-[9999]"
          >
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-full border-2 border-white bg-white shadow-xl ring-1 ring-black/15">
              <img
                src={flyingItem.image}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
