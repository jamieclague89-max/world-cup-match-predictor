/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // CSS-variable driven so dark ↔ light flips without touching components
        pitch: {
          900: 'rgb(var(--pitch-900) / <alpha-value>)',
          800: 'rgb(var(--pitch-800) / <alpha-value>)',
          700: 'rgb(var(--pitch-700) / <alpha-value>)',
          600: 'rgb(var(--pitch-600) / <alpha-value>)',
        },
        gold: {
          400: 'rgb(var(--gold-400) / <alpha-value>)',
          500: 'rgb(var(--gold-500) / <alpha-value>)',
          600: 'rgb(var(--gold-600) / <alpha-value>)',
        },
        emerald: {
          custom: '#00b34a',
        },
      },
      fontFamily: {
        display: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
