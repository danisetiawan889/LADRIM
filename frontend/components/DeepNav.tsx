'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { taxonomy, Node } from '@/lib/taxonomy';
import { lux } from '@/lib/motion';

export default function DeepNav({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const router = useRouter();
  const [activePillar, setActivePillar] = useState<Node | null>(null);

  const navigateTo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  return (
    <nav aria-label="Shop navigation" className="w-full">
      <AnimatePresence mode="wait">
        {!activePillar ? (
          // Level 0: Pure Pillars (Men, Women, Accessories) - Clean minimal luxury
          <motion.ul
            key="pillars"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.35, ease: lux }}
            className="flex flex-col divide-y divide-black/5"
          >
            {taxonomy.map((pillar) => (
              <li key={pillar.slug}>
                <button
                  onClick={() => setActivePillar(pillar)}
                  className="group flex w-full items-center justify-between py-5 text-left transition-all duration-300 hover:translate-x-2"
                >
                  <span className="font-display text-4xl sm:text-5xl md:text-6xl tracking-normal text-ink transition-colors group-hover:text-neutral-500">
                    {pillar.name}
                  </span>
                  <ArrowRight
                    size={24}
                    className="opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                  />
                </button>
              </li>
            ))}
          </motion.ul>
        ) : (
          // Level 1: Clean Categories (Tops, Bags, Bottoms, Shoes) - No pills or subtitles
          <motion.div
            key={activePillar.slug}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.35, ease: lux }}
            className="flex flex-col"
          >
            {/* Top Navigation Bar with Back button and Active Section */}
            <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-4">
              <button
                onClick={() => setActivePillar(null)}
                className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-neutral-600 transition-colors hover:text-ink font-medium"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <span className="text-xs uppercase tracking-widest font-semibold text-neutral-400">
                {activePillar.name}
              </span>
            </div>

            {/* List of clean category items */}
            <ul className="flex flex-col divide-y divide-black/5">
              {activePillar.children?.map((category) => (
                <li key={category.slug}>
                  <button
                    onClick={() => navigateTo(`/shop/${activePillar.slug}/${category.slug}`)}
                    className="group flex w-full items-center justify-between py-5 text-left transition-all duration-300 hover:translate-x-2"
                  >
                    <span className="font-display text-3xl sm:text-4xl md:text-5xl tracking-normal text-ink transition-colors group-hover:text-neutral-500">
                      {category.name}
                    </span>
                    <ArrowRight
                      size={22}
                      className="opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
