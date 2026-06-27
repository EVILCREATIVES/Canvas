import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: "#0b0c10",
          panel: "#15171c",
          border: "#2a2d36",
          accent: "#7c5cff",
        },
      },
      borderRadius: {
        rail: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
