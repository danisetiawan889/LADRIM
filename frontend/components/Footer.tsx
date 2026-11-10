'use client';

import React from 'react';

export default function GymsharkStyleFooter() {
  return (
    <footer className="w-full bg-white text-ink border-t border-neutral-200">
      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-14 space-y-7 text-center">
        {/* Subtle Brand Tag */}
        <div className="font-display font-bold text-sm tracking-[0.35em] text-neutral-400 uppercase select-none">
          LADRIM
        </div>

        {/* Social Icons Row */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-neutral-700 flex-wrap">
          {/* Discord */}
          <a
            href="#"
            aria-label="Discord"
            className="p-2.5 rounded-full hover:bg-neutral-100 hover:text-ink transition-all hover:scale-110"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>
          {/* Facebook */}
          <a
            href="#"
            aria-label="Facebook"
            className="p-2.5 rounded-full hover:bg-neutral-100 hover:text-ink transition-all hover:scale-110"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          {/* Pinterest */}
          <a
            href="#"
            aria-label="Pinterest"
            className="p-2.5 rounded-full hover:bg-neutral-100 hover:text-ink transition-all hover:scale-110"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
            </svg>
          </a>
          {/* YouTube */}
          <a
            href="#"
            aria-label="YouTube"
            className="p-2.5 rounded-full hover:bg-neutral-100 hover:text-ink transition-all hover:scale-110"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
          {/* Instagram */}
          <a
            href="#"
            aria-label="Instagram"
            className="p-2.5 rounded-full hover:bg-neutral-100 hover:text-ink transition-all hover:scale-110"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          {/* X / Twitter */}
          <a
            href="#"
            aria-label="X"
            className="p-2.5 rounded-full hover:bg-neutral-100 hover:text-ink transition-all hover:scale-110"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          {/* TikTok */}
          <a
            href="#"
            aria-label="TikTok"
            className="p-2.5 rounded-full hover:bg-neutral-100 hover:text-ink transition-all hover:scale-110"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          </a>
        </div>

        {/* Legal Links (Refined Desktop Horizontal Row) */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-neutral-600 font-medium pt-2">
          <a href="#" className="hover:text-ink transition-colors">Terms and Conditions</a>
          <span className="text-neutral-300 hidden sm:inline">•</span>
          <a href="#" className="hover:text-ink transition-colors">Terms of Use</a>
          <span className="text-neutral-300 hidden sm:inline">•</span>
          <a href="#" className="hover:text-ink transition-colors">Privacy Notice</a>
          <span className="text-neutral-300 hidden sm:inline">•</span>
          <a href="#" className="hover:text-ink transition-colors">Cookie Policy</a>
          <span className="text-neutral-300 hidden sm:inline">•</span>
          <a href="#" className="hover:text-ink transition-colors">Modern Slavery</a>
        </div>

        {/* Payment Badges (Clean Centered Row) */}
        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          {/* Visa */}
          <div className="h-6 px-2.5 bg-[#1A1F71] text-white text-[9px] font-black italic rounded flex items-center justify-center tracking-wider shadow-2xs">
            VISA
          </div>
          {/* Mastercard */}
          <div className="h-6 px-2 bg-neutral-900 rounded flex items-center justify-center gap-0.5 shadow-2xs">
            <span className="w-3 h-3 rounded-full bg-[#EB001B] inline-block -mr-1" />
            <span className="w-3 h-3 rounded-full bg-[#F79E1B] inline-block opacity-90" />
          </div>
          {/* Amex */}
          <div className="h-6 px-2 bg-[#006FCF] text-white text-[9px] font-black rounded flex items-center justify-center tracking-tighter shadow-2xs">
            AMEX
          </div>
          {/* PayPal */}
          <div className="h-6 px-2.5 bg-[#003087] text-white text-[9px] font-extrabold italic rounded flex items-center justify-center tracking-wider shadow-2xs">
            PayPal
          </div>
          {/* Apple Pay */}
          <div className="h-6 px-2.5 bg-black text-white text-[9px] font-bold rounded flex items-center justify-center gap-1 shadow-2xs">
            <span>Pay</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-2">
          <p className="text-[11px] text-neutral-400 font-normal tracking-wide">
            &copy; 2026 LADRIM Limited. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
