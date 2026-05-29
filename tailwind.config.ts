import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Revspot Design System — Monochrome / Metallic
        surface: {
          DEFAULT: "#FFFFFF",
          page: "#FAFAFA",
          secondary: "#F5F5F5",
        },
        text: {
          primary: "#0A0A0A",
          secondary: "#6B6B6B",
          tertiary: "#9B9B9B",
        },
        border: {
          DEFAULT: "#E5E5E5",
          hover: "#D4D4D4",
          subtle: "#F0F0F0",
        },
        accent: {
          DEFAULT: "#1A1A1A",
          hover: "#333333",
          light: "#F0F0F0",
        },
        silver: {
          DEFAULT: "#A0A0A0",
          light: "#C8C8C8",
          dark: "#6B6B6B",
        },
        charcoal: {
          DEFAULT: "#1A1A1A",
          light: "#2D2D2D",
        },
        status: {
          success: "#22C55E",
          warning: "#F5A623",
          error: "#E53E3E",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "page-title": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "section-header": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "card-title": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        meta: ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "stat-lg": ["28px", { lineHeight: "36px", fontWeight: "600" }],
        "stat-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
      },
      borderRadius: {
        card: "8px",
        button: "6px",
        badge: "6px",
        input: "8px",
        metric: "12px",
      },
      spacing: {
        sidebar: "240px",
      },
      maxWidth: {
        content: "1200px",
      },
      boxShadow: {
        "card-hover": "0 1px 3px rgba(0,0,0,0.04)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
