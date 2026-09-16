/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],

  darkMode: "class",

  theme: {
    extend: {
      colors: {
        panel: "#111827",
        panel2: "#1f2937",
        border: "#374151",

        critical: "#ef4444",
        high: "#f97316",
        medium: "#eab308",
        low: "#22c55e"
      }
    }
  },

  plugins: []
};