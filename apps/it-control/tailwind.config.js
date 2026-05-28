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
        // Dark zinc numbers = dark text; light zinc numbers = light surfaces.
        // bg-zinc-950 = Stripe page bg (#F6F9FC)
        // bg-zinc-900 = white card surface
        // text-zinc-50 = Stripe dark navy heading (#0A2540)
        zinc: {
          50:  '#0A2540',  // Stripe dark navy  (headings)
          100: '#1A2F45',
          200: '#2D4A6D',  // dark body text
          300: '#425466',  // Stripe body copy
          400: '#697386',  // Stripe secondary
          500: '#8898AA',  // Stripe muted
          600: '#9BABC0',  // dim labels
          700: '#C4D5E4',  // subtle borders / dividers
          800: '#E3EBF6',  // light borders / hover tints
          900: '#FFFFFF',  // card / surface white
          950: '#F6F9FC',  // Stripe page background
        },

        // ── Blue → Stripe violet (#635BFF) ────────────────────────────────
        // bg-blue-500 on white has 5.1:1 contrast (AA)
        blue: {
          50:  '#EDEAFF',
          100: '#DDD8FF',
          200: '#C3BDFF',
          300: '#9F98FF',
          400: '#635BFF',  // Stripe brand purple (accent text / icons)
          500: '#4F46E5',  // primary button background
          600: '#4338CA',  // button hover
          700: '#3730A3',
        },

        // ── Semantic colours (calibrated for light bg) ────────────────────
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
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Stripe's exact card shadow
        'card':    '0 1px 3px 0 rgba(60,66,87,.08), 0 0 0 1px rgba(60,66,87,.06)',
        'card-md': '0 4px 12px 0 rgba(60,66,87,.10), 0 0 0 1px rgba(60,66,87,.06)',
        'card-lg': '0 8px 24px 0 rgba(60,66,87,.12), 0 0 0 1px rgba(60,66,87,.06)',
        'btn':     '0 1px 2px 0 rgba(79,70,229,.3)',
      },
    },
  },
  plugins: [],
};
