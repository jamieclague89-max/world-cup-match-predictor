/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          900: '#0a1628',
          800: '#0f2240',
          700: '#163058',
          600: '#1e4080',
        },
        gold: {
          400: '#f5c842',
          500: '#e8b800',
          600: '#c99a00',
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
