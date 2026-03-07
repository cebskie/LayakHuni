/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1a3a6b',
          600: '#152f58',
          700: '#0f2444',
          800: '#0a1930',
          900: '#050e1a',
        },
        gold: {
          400: '#d4a843',
          500: '#c49a35',
          600: '#b08a28',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
