import type { Config } from "tailwindcss"

/**
 * Campus Connect Design System
 *
 * Implements the exact tokens from DESIGN.md (Meta/Facebook design system).
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
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },

      // ─── Colors (from DESIGN.md) ────────────────────────────────────────────
      colors: {
        // Brand & Accent
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          deep: "rgb(var(--primary-deep) / <alpha-value>)",
          soft: "rgb(var(--primary-soft) / <alpha-value>)",
        },
        "on-primary": "rgb(var(--on-primary) / <alpha-value>)",
        
        "ink-button": "rgb(var(--ink-button) / <alpha-value>)",
        "on-ink-button": "rgb(var(--on-ink-button) / <alpha-value>)",
        
        "fb-blue": "rgb(var(--fb-blue) / <alpha-value>)",
        "meta-link": "rgb(var(--meta-link) / <alpha-value>)",
        "oculus-purple": "rgb(var(--oculus-purple) / <alpha-value>)",

        // Semantic
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          bg: "rgb(var(--success-bg) / <alpha-value>)",
        },
        attention: "rgb(var(--attention) / <alpha-value>)",
        warning: {
          DEFAULT: "rgb(var(--warning) / <alpha-value>)",
          bg: "rgb(var(--warning-bg) / <alpha-value>)",
        },
        critical: {
          DEFAULT: "rgb(var(--critical) / <alpha-value>)",
          strong: "rgb(var(--critical-strong) / <alpha-value>)",
        },

        // Surface
        canvas: {
          DEFAULT: "rgb(var(--canvas) / <alpha-value>)",    
        },
        "surface-soft": "rgb(var(--surface-soft) / <alpha-value>)", 

        // Text
        "ink-deep": "rgb(var(--ink-deep) / <alpha-value>)",   
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",         
        },
        charcoal: "rgb(var(--charcoal) / <alpha-value>)",     
        slate: "rgb(var(--slate) / <alpha-value>)",        
        steel: "rgb(var(--steel) / <alpha-value>)",        
        stone: "rgb(var(--stone) / <alpha-value>)",        

        // Borders
        hairline: {
          DEFAULT: "rgb(var(--hairline) / <alpha-value>)",    
          soft: "rgb(var(--hairline-soft) / <alpha-value>)",       
        },
        "disabled-text": "rgb(var(--disabled-text) / <alpha-value>)", 

        // Legacy Compat
        border: "rgb(var(--hairline) / <alpha-value>)",
        input: "rgb(var(--hairline) / <alpha-value>)",
        ring: "rgb(var(--primary) / <alpha-value>)",
        background: "rgb(var(--canvas) / <alpha-value>)",
        foreground: "rgb(var(--ink) / <alpha-value>)",
      },

      // ─── Border Radius (from DESIGN.md) ─────────────────────────────────────
      borderRadius: {
        none: "0px",
        xs: "2px",       
        sm: "4px",       
        md: "6px",       
        lg: "8px",       
        xl: "16px",      
        xxl: "24px",     
        xxxl: "32px",    
        feature: "40px", 
        full: "100px",   
        circle: "9999px",
      },

      // ─── Spacing (from DESIGN.md) ───────────────────────────────────────────
      spacing: {
        xxs: "4px",      
        xs: "8px",       
        sm: "10px",      
        md: "12px",      
        base: "16px",    
        lg: "20px",      
        xl: "24px",      
        xxl: "32px",     
        xxxl: "40px",    
        "section-sm": "48px", 
        section: "64px",      
        "section-lg": "80px", 
        hero: "120px",        
      },

      // ─── Typography (from DESIGN.md) ─────────────────────────────────────────
      fontSize: {
        "hero-display": ["64px", { lineHeight: "1.16", fontWeight: "500", letterSpacing: "0px" }],
        "display-lg": ["48px", { lineHeight: "1.17", fontWeight: "500", letterSpacing: "0px" }],
        "heading-lg": ["36px", { lineHeight: "1.28", fontWeight: "500", letterSpacing: "0px" }],
        "heading-md": ["28px", { lineHeight: "1.21", fontWeight: "300", letterSpacing: "0px" }],
        "heading-sm": ["24px", { lineHeight: "1.25", fontWeight: "500", letterSpacing: "0px" }],
        "subtitle-lg": ["18px", { lineHeight: "1.44", fontWeight: "700", letterSpacing: "0px" }],
        "subtitle-md": ["18px", { lineHeight: "1.44", fontWeight: "400", letterSpacing: "0px" }],
        "body-md-bold": ["16px", { lineHeight: "1.50", letterSpacing: "-0.16px", fontWeight: "700" }],
        "body-md": ["16px", { lineHeight: "1.50", letterSpacing: "-0.16px", fontWeight: "400" }],
        "body-sm-bold": ["14px", { lineHeight: "1.43", letterSpacing: "-0.14px", fontWeight: "700" }],
        "body-sm": ["14px", { lineHeight: "1.43", letterSpacing: "-0.14px", fontWeight: "400" }],
        "caption-bold": ["12px", { lineHeight: "1.33", fontWeight: "700", letterSpacing: "0px" }],
        "caption": ["12px", { lineHeight: "1.33", fontWeight: "400", letterSpacing: "0px" }],
        "button-md": ["14px", { lineHeight: "1.43", letterSpacing: "-0.14px", fontWeight: "700" }],
        "link-md": ["16px", { lineHeight: "1.50", letterSpacing: "-0.16px", fontWeight: "700" }],
      },

      // ─── Shadows (from DESIGN.md) ───────────────────────────────────────────
      boxShadow: {
        subtle: "rgba(0, 0, 0, 0.2) 1px 1px 0px 0px",
        "sticky-panel": "rgba(20, 22, 26, 0.3) 0px 1px 4px 0px",
      },
    },
  },
  plugins: [],
}
export default config
