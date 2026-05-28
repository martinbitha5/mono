/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Zinc scale → Stripe's blue-gray light palette (INVERTED) ──────
        zinc: {
          50:  '#0A2540',
          100: '#1A2F45',
          200: '#2D4A6D',
          300: '#425466',
          400: '#697386',
          500: '#8898AA',
          600: '#9BABC0',
          700: '#C4D5E4',
          800: '#E3EBF6',
          900: '#FFFFFF',
          950: '#F6F9FC',
        },
        // ── Orange accent for Technical service ───────────────────────────
        blue: {
          50:  '#EDEAFF',
          100: '#DDD8FF',
          200: '#C3BDFF',
          300: '#9F98FF',
          400: '#635BFF',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
        },
        emerald: {
          400: '#10B981',
          500: '#059669',
          600: '#047857',
        },
        amber: {
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
        },
        red: {
          400: '#EF4444',
          500: '#DC2626',
          600: '#B91C1C',
        },
        purple: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        orange: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(60,66,87,.08), 0 0 0 1px rgba(60,66,87,.06)',
        'card-md': '0 4px 12px 0 rgba(60,66,87,.10), 0 0 0 1px rgba(60,66,87,.06)',
        'card-lg': '0 8px 24px 0 rgba(60,66,87,.12), 0 0 0 1px rgba(60,66,87,.06)',
        'btn':     '0 1px 2px 0 rgba(79,70,229,.3)',
      },
    },
  },
  plugins: [],
};
