/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        card: '#121212',
        accent: '#98079d',
        safe: '#4ADE80',
        warning: '#FACC15',
        text: '#FFFFFF',
        muted: '#A3A3A3',
        border: '#262626'
      }
    },
  },
  plugins: [],
}
