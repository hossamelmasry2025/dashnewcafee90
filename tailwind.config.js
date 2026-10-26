/** @type {import('tailwindcss').Config} */

// One typeface for the whole dashboard (Arabic + Latin), with tabular numbers.
const UI_FONT = ['"IBM Plex Sans Arabic"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'];

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FCF8EF',
          100: '#F8EFD9',
          200: '#F0DDB0',
          300: '#E6C682',
          400: '#DBAE58',
          500: '#C9973A', // Brand Primary Gold
          600: '#AE7D27',
          700: '#8C621E',
          800: '#6B4A19',
          900: '#4A3312',
        },
        chocolate: {
          50: '#F8F5F3',
          100: '#EFE8E3',
          200: '#DCCEC5',
          300: '#C2AC9E',
          400: '#977565',
          500: '#6C4D3D',
          600: '#4F3427',
          700: '#3B261B', // Brand Deep Brown
          800: '#2A1B13',
          900: '#1E130D', // Deepest Espresso
          950: '#140C08',
        },
        cream: {
          50: '#FBFAF8',
          100: '#F6F3EF',
          200: '#ECE6DE',
          300: '#DED4C7',
        },
        // Neutral surface scale used by the app shell
        canvas: '#F5F3F0',
      },
      fontFamily: {
        sans: UI_FONT,
        cairo: UI_FONT,
        tajawal: UI_FONT,
        // Numbers used to be rendered in a monospace font; keep the class but use the UI font with tabular figures.
        mono: UI_FONT,
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        '2xs': '0 1px 1px 0 rgba(30, 19, 13, 0.04)',
        'xs': '0 1px 2px 0 rgba(30, 19, 13, 0.05)',
        'card': '0 1px 2px rgba(30, 19, 13, 0.04), 0 1px 3px rgba(30, 19, 13, 0.03)',
        'luxury': '0 1px 2px rgba(30, 19, 13, 0.04), 0 8px 24px -6px rgba(30, 19, 13, 0.10)',
        'gold-glow': '0 1px 2px rgba(140, 98, 30, 0.25), 0 4px 14px -4px rgba(201, 151, 58, 0.45)',
        'pop': '0 12px 32px -8px rgba(30, 19, 13, 0.18), 0 2px 6px rgba(30, 19, 13, 0.06)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
