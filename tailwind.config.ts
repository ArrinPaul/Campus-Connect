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
      // â”€â”€â”€ Typography â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Inter", "system-ui", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter", "system-ui", "sans-serif"],
      },

      // â”€â”€â”€ Colors (from DESIGN.md) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

        // Legacy Compat â€” maps old/shadcn/stale tokens â†’ Apple Minimal values
        border: "rgb(var(--hairline) / <alpha-value>)",
        input: "rgb(var(--hairline) / <alpha-value>)",
        ring: "rgb(var(--primary) / <alpha-value>)",
        background: "rgb(var(--canvas) / <alpha-value>)",
        foreground: "rgb(var(--ink-deep) / <alpha-value>)",

        // Canvas soft alias
        "canvas-soft": "rgb(var(--canvas) / <alpha-value>)",

        // Muted (shadcn compat)
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },

        // Card (shadcn compat)
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },

        // Destructive (shadcn compat â†’ critical)
        destructive: {
          DEFAULT: "rgb(var(--critical) / <alpha-value>)",
          foreground: "rgb(var(--on-primary) / <alpha-value>)",
        },

        // Accent (shadcn compat)
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },

        // Secondary (shadcn compat)
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },

        // Popover (shadcn compat)
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
      },

      // â”€â”€â”€ Border Radius (from DESIGN.md) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€â”€ Spacing (from DESIGN.md) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€â”€ Typography (from DESIGN.md) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€â”€ Shadows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      boxShadow: {
        subtle:          "0 1px 2px rgba(0,0,0,0.06)",
        sm:              "0 1px 4px rgba(0,0,0,0.08)",
        DEFAULT:         "0 2px 8px rgba(0,0,0,0.10)",
        md:              "0 4px 12px rgba(0,0,0,0.10)",
        lg:              "0 8px 24px rgba(0,0,0,0.12)",
        xl:              "0 16px 40px rgba(0,0,0,0.14)",
        // Named aliases used by components
        product:         "0 2px 8px rgba(0,0,0,0.08)",
        elevated:        "0 4px 16px rgba(0,0,0,0.10)",
        float:           "0 8px 32px rgba(0,0,0,0.12)",
        "sticky-panel":  "0 1px 4px rgba(20,22,26,0.18)",
        "dialog":        "0 20px 60px rgba(0,0,0,0.20)",
        none:            "none",
      },
    },
  },
  plugins: [],
}
export default config

