/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#feccaa",
          300: "#fdad74",
          400: "#fb8332",
          500: "#f8630f",
          600: "#e94a09",
          700: "#c1370a",
          800: "#992c10",
          900: "#7c2710",
        },
      },
    },
  },
  plugins: [],
}
