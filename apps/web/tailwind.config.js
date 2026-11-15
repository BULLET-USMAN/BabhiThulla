/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#06080C',
          900: '#0B0E14',
          850: '#10141D',
          800: '#161B26',
          700: '#232A3B',
          600: '#333D52',
        },
        felt: {
          950: '#04150E',
          900: '#072418',
          850: '#0A2E1F',
          800: '#0E3826',
          700: '#144B34',
          600: '#1C6346',
          500: '#27805B',
        },
        gold: {
          100: '#FCF7E8',
          200: '#F7ECC5',
          300: '#F0DD9E',
          400: '#E5C76E',
          500: '#D4AF37', // primary gold accent
          600: '#BA9427',
          700: '#947219',
          800: '#6E5211',
          900: '#473308',
        },
        ruby: {
          500: '#DC2626',
          600: '#B91C1C',
          700: '#8B1E1E',
          800: '#701717',
          900: '#4D0E0E',
        },
        cream: {
          50: '#FDFCFB',
          100: '#FAF8F5',
          200: '#F4F0E8',
          300: '#EAE3D5',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.35)',
        'felt-inset': 'inset 0 0 80px rgba(0, 0, 0, 0.65)',
        'card-lift': '0 12px 24px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
