/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5", // Indigo
        secondary: "#7C3AED", // Purple
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        background: "#F8FAFC",
        card: "#FFFFFF",
        textPrimary: "#0F172A",
        textSecondary: "#64748B",
      },
    },
  },
  plugins: [],
}
