import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          primary: "#F06292",
          dark: "#E91E8C",
          light: "#FCE4EC",
        },
        bg: {
          page: "#FAFAFA",
          card: "#FFFFFF",
        },
        border: {
          DEFAULT: "#E5E7EB",
        },
        text: {
          primary: "#111827",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        badge: "20px",
        input: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
