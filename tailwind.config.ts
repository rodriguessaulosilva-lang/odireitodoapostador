import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#26324E",
          50: "#EEF1F6",
          100: "#DCE3EF",
          600: "#2E3C5D",
          700: "#1F2940",
          800: "#161E30",
        },
        brass: { DEFAULT: "#8A6D2B", 600: "#75591F" },
        ink: "#14171D",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,25,34,.05), 0 6px 18px rgba(20,25,34,.06)",
      },
    },
  },
  plugins: [],
};
export default config;
