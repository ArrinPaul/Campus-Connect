import type { Config } from "tailwindcss"

/**
 * Campus Connect Design System
 *
 * All design tokens come from DESIGN.md (Meta/Facebook design system analysis).
 * Do NOT add tokens here that aren't in DESIGN.md.
 * If you need a new token, add it to DESIGN.md first, then mirror it here.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Typography ─────────────────────────────────────────────────────────
      // Font: Optimistic VF (Meta's variable face)
      // Fallbacks: Montserrat, Helvetica, Arial, Noto Sans
      fontFamily: {
        sans: [
          "Optimistic VF",
          "Montserrat",
          "Helvetica",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
        display: [
          "Optimistic VF",
          "Montserrat",
          "Helvetica",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },

      // ─── Colors (from DESIGN.md) ────────────────────────────────────────────
      colors: {
        // Brand & Accent
        primary: {
          DEFAULT: "#0064e0",    // {colors.primary} — Cobalt
          deep: "#0457cb",       // {colors.primary-deep}
          soft: "#0091ff",       // {colors.primary-soft}
          foreground: "#ffffff", // {colors.on-primary}
        },
        "fb-blue": "#1876f2",    // {colors.fb-blue}
        "meta-link": "#385898",  // {colors.meta-link}
        "oculus-purple": "#a121ce", // {colors.oculus-purple}

        // Semantic
        success: "#31a24c",      // {colors.success}
        "success-bg": "#24e400", // {colors.success-bg}
        attention: "#f2a918",    // {colors.attention}
        warning: "#f7b928",      // {colors.warning}
        "warning-bg": "#ffe200", // {colors.warning-bg}
        critical: "#e41e3f",     // {colors.critical}
        "critical-strong": "#f0284a", // {colors.critical-strong}

        // Surface
        canvas: {
          DEFAULT: "#ffffff",    // {colors.canvas}
          soft: "#f1f4f7",      // {colors.surface-soft}
        },
        "surface-soft": "#f1f4f7", // {colors.surface-soft}

        // Text
        "ink-deep": "#0a1317",   // {colors.ink-deep} — primary headlines
        ink: {
          DEFAULT: "#1c1e21",    // {colors.ink} — standard body
          button: "#000000",     // {colors.ink-button}
          muted: "#7a7a7a",      // legacy compat
        },
        charcoal: "#444950",     // {colors.charcoal}
        slate: "#4b4c4f",        // {colors.slate}
        steel: "#5d6c7b",        // {colors.steel}
        stone: "#8595a4",        // {colors.stone}

        // Hairlines
        hairline: {
          DEFAULT: "#ced0d4",    // {colors.hairline}
          soft: "#dee3e9",       // {colors.hairline-soft}
        },
        "disabled-text": "#bcc0c4", // {colors.disabled-text}

        // Legacy compat (map to new tokens)
        border: "#ced0d4",
        input: "#ced0d4",
        ring: "#0064e0",
        background: "#ffffff",
        foreground: "#0a1317",
      },

      // ─── Border Radius (from DESIGN.md) ─────────────────────────────────────
      borderRadius: {
        none: "0px",     // {rounded.none} — not in DESIGN.md but useful
        xs: "2px",       // {rounded.xs}
        sm: "4px",       // {rounded.sm}
        md: "6px",       // {rounded.md}
        lg: "8px",       // {rounded.lg}
        xl: "16px",      // {rounded.xl}
        xxl: "24px",     // {rounded.xxl}
        xxxl: "32px",    // {rounded.xxxl}
        feature: "40px", // {rounded.feature}
        full: "100px",   // {rounded.full} — pill buttons
        circle: "9999px",// {rounded.circle}
      },

      // ─── Spacing (from DESIGN.md) ───────────────────────────────────────────
      spacing: {
        xxs: "4px",      // {spacing.xxs}
        xs: "8px",       // {spacing.xs}
        sm: "10px",      // {spacing.sm}
        md: "12px",      // {spacing.md}
        base: "16px",    // {spacing.base}
        lg: "20px",      // {spacing.lg}
        xl: "24px",      // {spacing.xl}
        xxl: "32px",     // {spacing.xxl}
        xxxl: "40px",    // {spacing.xxxl}
        "section-sm": "48px", // {spacing.section-sm}
        section: "64px",      // {spacing.section}
        "section-lg": "80px", // {spacing.section-lg}
        hero: "120px",        // {spacing.hero}
      },

      // ─── Font Size (from DESIGN.md typography hierarchy) ─────────────────────
      fontSize: {
        "hero-display": ["64px", { lineHeight: "1.16", fontWeight: "500" }],
        "display-lg": ["48px", { lineHeight: "1.17", fontWeight: "500" }],
        "heading-lg": ["36px", { lineHeight: "1.28", fontWeight: "500" }],
        "heading-md": ["28px", { lineHeight: "1.21", fontWeight: "300" }],
        "heading-sm": ["24px", { lineHeight: "1.25", fontWeight: "500" }],
        "subtitle-lg": ["18px", { lineHeight: "1.44", fontWeight: "700" }],
        "subtitle-md": ["18px", { lineHeight: "1.44", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.50", letterSpacing: "-0.16px", fontWeight: "400" }],
        "body-md-bold": ["16px", { lineHeight: "1.50", letterSpacing: "-0.16px", fontWeight: "700" }],
        "body-sm": ["14px", { lineHeight: "1.43", letterSpacing: "-0.14px", fontWeight: "400" }],
        "body-sm-bold": ["14px", { lineHeight: "1.43", letterSpacing: "-0.14px", fontWeight: "700" }],
        "caption": ["12px", { lineHeight: "1.33", fontWeight: "400" }],
        "caption-bold": ["12px", { lineHeight: "1.33", fontWeight: "700" }],
        "button-md": ["14px", { lineHeight: "1.43", letterSpacing: "-0.14px", fontWeight: "700" }],
        "link-md": ["16px", { lineHeight: "1.50", letterSpacing: "-0.16px", fontWeight: "700" }],
      },

      // ─── Shadows (from DESIGN.md) ───────────────────────────────────────────
      boxShadow: {
        // Level 0: flat — no shadow (default cards)
        // Level 1: subtle — pill-tab activation
        subtle: "rgba(0, 0, 0, 0.2) 1px 1px 0px 0px",
        // Level 2: sticky panel — checkout summary, mobile bar
        "sticky-panel": "rgba(20, 22, 26, 0.3) 0px 1px 4px 0px",
        // Legacy compat
        product: "rgba(20, 22, 26, 0.3) 0px 1px 4px 0px",
      },

      // ─── Transitions ────────────────────────────────────────────────────────
      transitionProperty: {
        apple: "transform, background-color, border-color, color, opacity, box-shadow",
      },
    },
  },
  plugins: [],
}
export default config
