'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TYPEWRITER_PHRASES = [
  'Timeless Style.',
  'Modern Luxury.',
  'Pure Elegance.',
  'Iconic Fashion.',
];

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Start typing after initial majestic entrance (1.4s delay)
    const startTimer = setTimeout(() => {
      setHasStartedTyping(true);
    }, 1400);
    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (!hasStartedTyping) return;

    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      if (charCount < currentPhrase.length) {
        timeout = setTimeout(() => {
          setCharCount((prev) => prev + 1);
        }, 85);
      } else {
        // Pause at the end of full phrase before deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2800);
      }
    } else {
      if (charCount > 0) {
        timeout = setTimeout(() => {
          setCharCount((prev) => prev - 1);
        }, 40);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
        timeout = setTimeout(() => {}, 400);
      }
    }

    return () => clearTimeout(timeout);
  }, [charCount, isDeleting, phraseIndex, hasStartedTyping]);

  const parallaxOffset = scrollY * 0.35;
  const overlayOpacity = Math.min(0.7 + scrollY * 0.0008, 0.9);

  const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
  const visibleChars = currentPhrase.slice(0, charCount).split('');

  return (
    <section className="relative h-[100vh] w-full overflow-hidden">
      {/* Background image with subtle ambient zoom & parallax */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.18 }}
        animate={{ scale: 1.08 }}
        transition={{ duration: 3.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ transform: `translateY(${parallaxOffset}px) scale(1.08)` }}
      >
        <img
          src="/images/hero-landing.jpg"
          alt="LADRIM essentials"
          className="h-full w-full object-cover object-center"
          loading="eager"
        />
      </motion.div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30 md:bg-gradient-to-r md:from-black/85 md:via-black/55 md:to-black/35"
        style={{ opacity: overlayOpacity }}
      />

      {/* Subtle grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

      {/* Content - Bottom-left corner on mobile, centered-left on desktop */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-start justify-end pb-10 sm:pb-16 md:justify-center md:pb-0 px-5 sm:px-10 md:px-14 lg:px-20 text-left">
        {/* Main heading: Line 1 Slow Majestic Reveal, Line 2 Dynamic Smooth Typewriter */}
        <h1 className="flex flex-col max-w-full overflow-hidden">
          <div className="overflow-hidden">
            <motion.span
              initial={{ y: '110%', opacity: 0, filter: 'blur(12px)' }}
              animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 2.0, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="block font-display text-[26px] xs:text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl leading-[1.1] text-white whitespace-nowrap truncate"
            >
              Premium Essentials,
            </motion.span>
          </div>

          {/* Typewriter Line with silky letter-by-letter entrance and luxury blinking cursor */}
          <div className="mt-1 sm:mt-2 min-h-[1.15em] flex items-center whitespace-nowrap overflow-hidden">
            <span className="font-display text-[26px] xs:text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl leading-[1.1] text-white italic font-light whitespace-nowrap inline-flex">
              {visibleChars.map((char, index) => (
                <motion.span
                  key={`${phraseIndex}-${index}`}
                  initial={{ opacity: 0, y: 7, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block"
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              className="inline-block w-[2.5px] sm:w-[4px] h-[0.7em] bg-white ml-1.5 sm:ml-3 align-middle shrink-0"
            />
          </div>
        </h1>

        {/* Subtitle with calm ambient entrance */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.6, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3.5 sm:mt-6 max-w-md md:max-w-xl text-xs sm:text-base md:text-lg leading-relaxed text-white/75 md:mt-8"
        >
          Curated luxury fashion. Premium cottons, structured silhouettes,
          and timeless craftsmanship — tailored to elevate your personal style.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 sm:mt-10 flex flex-row flex-wrap justify-start gap-2.5 sm:gap-4 md:mt-12"
        >
          <a
            href="/shop/men"
            className="group relative overflow-hidden border border-white bg-white px-6 sm:px-9 py-3 sm:py-4 text-[11px] sm:text-sm font-semibold uppercase tracking-[0.2em] text-ink transition-all duration-500 hover:bg-transparent hover:text-white"
          >
            <span className="relative z-10">Shop Men</span>
          </a>
          <a
            href="/shop/women"
            className="group border border-white/50 px-6 sm:px-9 py-3 sm:py-4 text-[11px] sm:text-sm font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm transition-all duration-500 hover:border-white hover:bg-white hover:text-ink"
          >
            Shop Women
          </a>
        </motion.div>
      </div>
    </section>
  );
}
