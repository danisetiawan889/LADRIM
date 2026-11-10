import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',            // pitch black: buttons, icons, type, controls only
        pearl: '#FBFAF7',          // soft off-white
        frost: '#E8EBEE',          // icy silver-gray
        cream: '#F3EFE8',          // creamy glow
      },
      fontFamily: {
        heading: ['var(--font-axiforma)', "'Axiforma'", 'sans-serif'],
        display: ['var(--font-axiforma)', "'Axiforma'", 'sans-serif'],
        sans: ['var(--font-axiforma)', "'Axiforma'", 'sans-serif'],
        axiforma: ['var(--font-axiforma)', "'Axiforma'", 'sans-serif'],
        lato: ['var(--font-lato)', 'Lato', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      transitionTimingFunction: { lux: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      screens: { '3xl': '1920px' },
    },
  },
  plugins: [],
} satisfies Config;
