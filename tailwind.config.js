/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chs: {
          'water-blue': '#0079A3',
          'teal-green': '#00A693',
          'bright-green': '#59B947',
          'deep-navy': '#003366',
          'light-aqua': '#6ED4FF',
          'light-gray': '#F4F6F7',
          'mid-gray': '#A3A9AC',
        },
      },
      backgroundImage: {
        'chs-gradient': 'linear-gradient(to right, #00A693, #0079A3)',
      },
    },
  },
  plugins: [],
}
