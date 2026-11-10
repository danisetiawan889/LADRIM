import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout LADRIM',
  description: 'Complete your purchase with LADRIM high-end sequential transaction pipeline.',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen py-3 px-4 sm:py-6 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="mx-auto max-w-6xl w-full min-w-0">
        <div className="mb-3 sm:mb-5">
          <a
            href="/"
            className="group inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-neutral-500 hover:text-ink transition-colors font-medium"
          >
            <span className="text-sm transition-transform group-hover:-translate-x-1">←</span>
            <span>Back to Store</span>
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}
