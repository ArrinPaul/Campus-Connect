import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "SF Pro Text",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        display: [
          "SF Pro Display",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        border: "var(--hairline)",
        input: "var(--hairline)",
        ring: "var(--primary-focus)",
        background: "var(--canvas)",
        foreground: "var(--ink)",
        primary: {
          DEFAULT: "var(--primary)",
          focus: "var(--primary-focus)",
          dark: "var(--primary-on-dark)",
          foreground: "#ffffff",
        },
        ink: {
          DEFAULT: "#1d1d1f",
          muted: "#7a7a7a",
          80: "#333333",
        },
        canvas: {
          DEFAULT: "#ffffff",
          parchment: "#f5f5f7",
          pearl: "#fafafc",
        },
        tile: {
          1: "#272729",
          2: "#2a2a2c",
          3: "#252527",
          black: "#000000",
        },
        surface: {
          chip: "rgba(210, 210, 215, 0.64)",
        },
      },
      borderRadius: {
        none: "0px",
        xs: "5px",
        sm: "8px",
        md: "11px",
        lg: "18px",
        pill: "9999px",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "17px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "80px",
      },
      fontSize: {
        "hero-display": ["56px", { lineHeight: "1.07", letterSpacing: "-0.28px", fontWeight: "600" }],
        "display-lg": ["40px", { lineHeight: "1.1", letterSpacing: "0", fontWeight: "600" }],
        "display-md": ["34px", { lineHeight: "1.47", letterSpacing: "-0.374px", fontWeight: "600" }],
        "lead": ["28px", { lineHeight: "1.14", letterSpacing: "0.196px", fontWeight: "400" }],
        "lead-airy": ["24px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "300" }],
        "tagline": ["21px", { lineHeight: "1.19", letterSpacing: "0.231px", fontWeight: "600" }],
        "body-strong": ["17px", { lineHeight: "1.24", letterSpacing: "-0.374px", fontWeight: "600" }],
        "body": ["17px", { lineHeight: "1.47", letterSpacing: "-0.374px", fontWeight: "400" }],
        "caption": ["14px", { lineHeight: "1.43", letterSpacing: "-0.224px", fontWeight: "400" }],
        "caption-strong": ["14px", { lineHeight: "1.29", letterSpacing: "-0.224px", fontWeight: "600" }],
        "fine-print": ["12px", { lineHeight: "1.0", letterSpacing: "-0.12px", fontWeight: "400" }],
        "nav-link": ["12px", { lineHeight: "1.0", letterSpacing: "-0.12px", fontWeight: "400" }],
      },
      boxShadow: {
        product: "rgba(0, 0, 0, 0.22) 3px 5px 30px 0px",
      },
      transitionProperty: {
        'apple': 'transform, background-color, border-color, color, opacity, box-shadow',
      },
    },
  },
  plugins: [],
}
export default config
