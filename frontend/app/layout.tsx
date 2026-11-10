import type { Metadata, Viewport } from 'next';
import { Poppins, Lato } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { SavedArchiveProvider } from '@/context/SavedArchiveContext';
import ShellLayout from '@/components/ShellLayout';

const axiforma = localFont({
  src: [
    {
      path: '../public/fonts/axiforma/Axiforma-Light.woff',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/axiforma/Axiforma-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/axiforma/Axiforma-Medium.woff',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/axiforma/Axiforma-SemiBold.woff',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/axiforma/Axiforma-Bold.woff',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/axiforma/Axiforma-ExtraBold.woff',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/axiforma/Axiforma-Black.woff',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-axiforma',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  variable: '--font-lato',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LADRIM',
  description: 'Considered essentials for men, women and everything in between.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${axiforma.variable} ${poppins.variable} ${lato.variable}`}>
      <body className="font-sans text-ink antialiased">
        <CartProvider>
          <SavedArchiveProvider>
            <ShellLayout>{children}</ShellLayout>
          </SavedArchiveProvider>
        </CartProvider>
      </body>
    </html>
  );
}