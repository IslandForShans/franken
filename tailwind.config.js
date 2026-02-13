/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['Myriad Pro', 'Myriad', 'sans-serif'],
      serif: ['Myriad Pro', 'Myriad', 'sans-serif'],
      mono: ['Myriad Pro', 'Myriad', 'sans-serif'],
    },
    extend: {},
  },
  plugins: [],
}