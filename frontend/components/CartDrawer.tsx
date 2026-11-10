'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, Plus, Minus, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { lux } from '@/lib/motion';

export default function CartDrawer() {
  const router = useRouter();
  const { lines, count, total, previousTotal, isOpen, closeCart, updateQty, remove } = useCart();

  const FREE_SHIPPING_THRESHOLD = 150; // $150 USD
  const [animatedTotal, setAnimatedTotal] = useState<number>(previousTotal ?? total);

  useEffect(() => {
    if (isOpen) {
      if (previousTotal !== total) {
        setAnimatedTotal(previousTotal);
        const timer = setTimeout(() => {
          setAnimatedTotal(total);
        }, 350);
        return () => clearTimeout(timer);
      } else {
        setAnimatedTotal(total);
      }
    }
  }, [isOpen, total, previousTotal]);

  const progressPercent = Math.min(100, Math.round((animatedTotal / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - animatedTotal);

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Slide-over Drawer (Gymshark style) */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: lux }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between border-b border-black/10 px-6">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <h2 className="font-display text-lg tracking-wider uppercase">
                  Your Cart ({count})
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="rounded-full p-2 transition-colors hover:bg-neutral-100"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* Free Shipping Progress Indicator (Gymshark Signature) */}
            <div className="border-b border-black/5 bg-[#FAFAF8] px-6 py-3.5">
              <div className="flex items-center gap-2 text-xs">
                <Truck size={14} className="text-ink" />
                {remainingForFree === 0 ? (
                  <span className="font-semibold text-ink">
                    You've unlocked <span className="underline">FREE Standard Delivery</span>!
                  </span>
                ) : (
                  <span className="text-neutral-600">
                    Add <span className="font-semibold text-ink">${remainingForFree.toLocaleString('en-US')}</span> more for Free Delivery
                  </span>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full bg-ink transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-12">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
                    <ShoppingBag size={28} />
                  </div>
                  <h3 className="font-display text-xl text-ink">Your cart is empty</h3>
                  <p className="mt-1 text-xs text-neutral-500 max-w-xs">
                    Discover our foundational pieces made to be worn for years.
                  </p>
                  <button
                    onClick={() => {
                      closeCart();
                      router.push('/shop/men/tops');
                    }}
                    className="btn-ink mt-6 text-xs uppercase tracking-widest py-3 px-6"
                  >
                    Explore Tops Collection
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-black/5">
                  {lines.map((item) => (
                    <div key={item.variantId} className="flex gap-3 sm:gap-4 py-4">
                      {/* Thumbnail with strict fixed size */}
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-neutral-100 border border-neutral-200/80">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=1000&q=80';
                            }}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                            LADRIM
                          </div>
                        )}
                      </div>

                      {/* Info & Controls (Strict min-w-0 flex containment) */}
                      <div className="flex flex-1 min-w-0 flex-col justify-between">
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-sans text-xs sm:text-sm font-medium tracking-normal text-ink line-clamp-2 leading-snug">
                              {item.name}
                            </h4>
                            <button
                              onClick={() => remove(item.variantId)}
                              className="text-neutral-400 hover:text-red-500 p-0.5 transition-colors shrink-0"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {(item.color || item.size) && (
                            <p className="mt-1 text-[11px] text-neutral-500 truncate">
                              {[item.color, item.size].filter(Boolean).join(' / ')}
                            </p>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          {/* Quantity selector */}
                          <div className="flex items-center rounded border border-black/15 bg-white shrink-0">
                            <button
                              onClick={() => updateQty(item.variantId, item.qty - 1)}
                              className="px-2 py-1 text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-7 text-center text-xs font-semibold">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.variantId, item.qty + 1)}
                              className="px-2 py-1 text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          {/* Line total price */}
                          <span className="font-sans text-xs sm:text-sm font-semibold text-ink shrink-0">
                            ${(item.price * item.qty).toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Subtotal & Checkout Button */}
            {lines.length > 0 && (
              <div className="border-t border-black/10 bg-[#FBFAF7] p-6 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Estimated Shipping</span>
                    <span className="font-medium text-ink">
                      {remainingForFree === 0 ? 'FREE' : 'Calculated at checkout'}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-base text-ink pt-1 border-t border-black/5">
                    <span>Subtotal</span>
                    <span>${total.toLocaleString('en-US')}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn-ink w-full flex items-center justify-center py-4 text-xs uppercase tracking-widest font-semibold"
                >
                  <span>Checkout</span>
                </button>

                <button
                  onClick={closeCart}
                  className="w-full text-center text-xs text-neutral-500 underline underline-offset-4 hover:text-ink transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
