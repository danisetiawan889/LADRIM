'use client';
import { usePathname } from 'next/navigation';
import Header from './Header';
import CartDrawer from './CartDrawer';
import Footer from './Footer';

// Routes where the global Header & main padding should be hidden
const CHROMELESS_PREFIXES = ['/account', '/checkout', '/admin'];

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const chromeless = CHROMELESS_PREFIXES.some((p) => pathname.startsWith(p));
  const isHomepage = pathname === '/';

  if (chromeless) {
    return (
      <>
        {children}
        <CartDrawer />
      </>
    );
  }

  return (
    <>
      <Header transparent={isHomepage} />
      <main className={isHomepage ? '' : 'pt-16 md:pt-20'}>{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
