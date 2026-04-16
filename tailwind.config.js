/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        'primary-light': '#EDE9FE',
        accent: '#F59E0B',
        success: '#10B981',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
