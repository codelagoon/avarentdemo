/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--g-color-line-generic)",
        input: "var(--g-color-base-generic)",
        ring: "var(--g-color-line-brand)",
        background: "var(--g-color-base-background)",
        foreground: "var(--g-color-text-primary)",
        primary: {
          DEFAULT: "var(--g-color-base-brand)",
          foreground: "var(--g-color-text-brand-contrast)",
        },
        secondary: {
          DEFAULT: "var(--g-color-base-generic)",
          foreground: "var(--g-color-text-complementary)",
        },
        destructive: {
          DEFAULT: "var(--status-fail-text)",
          foreground: "var(--g-color-text-primary)",
        },
        muted: {
          DEFAULT: "var(--g-color-base-generic-ultralight)",
          foreground: "var(--g-color-text-hint)",
        },
        accent: {
          DEFAULT: "var(--g-color-base-selection)",
          foreground: "var(--g-color-base-brand)",
        },
        popover: {
          DEFAULT: "var(--g-color-base-float)",
          foreground: "var(--g-color-text-primary)",
        },
        card: {
          DEFAULT: "var(--g-color-base-float)",
          foreground: "var(--g-color-text-primary)",
        },
        sidebar: {
          DEFAULT: "var(--meridian-sidebar-bg)",
          foreground: "var(--g-color-text-primary)",
          primary: "var(--g-color-base-brand)",
          "primary-foreground": "var(--g-color-text-brand-contrast)",
          accent: "var(--g-color-base-selection)",
          "accent-foreground": "var(--g-color-base-brand)",
          border: "var(--g-color-line-generic)",
          ring: "var(--g-color-line-brand)",
        },
        status: {
          pass: "var(--status-pass-text)",
          "pass-bg": "var(--status-pass-bg)",
          "pass-border": "var(--status-pass-border)",
          review: "var(--status-review-text)",
          "review-bg": "var(--status-review-bg)",
          "review-border": "var(--status-review-border)",
          fail: "var(--status-fail-text)",
          "fail-bg": "var(--status-fail-bg)",
          "fail-border": "var(--status-fail-border)",
          info: "var(--status-info)",
        },
        delta: {
          up: "var(--delta-up)",
          down: "var(--delta-down)",
        },
      },
      borderRadius: {
        lg: "var(--g-border-radius-l)",
        md: "var(--g-border-radius-m)",
        sm: "var(--g-border-radius-s)",
      },
      fontFamily: {
        sans: ["var(--g-text-body-font-family)"],
        mono: ["var(--g-text-code-font-family)"],
      },
      fontSize: {
        "g-body-1": ["var(--g-text-body-1-font-size)", { lineHeight: "var(--g-text-body-1-line-height)" }],
        "g-body-2": ["var(--g-text-body-2-font-size)", { lineHeight: "var(--g-text-body-2-line-height)" }],
        "g-caption": ["var(--g-text-caption-2-font-size)", { lineHeight: "var(--g-text-caption-2-line-height)" }],
        "g-header-1": ["var(--g-text-header-1-font-size)", { lineHeight: "var(--g-text-header-1-line-height)" }],
        "g-header-2": ["var(--g-text-header-2-font-size)", { lineHeight: "var(--g-text-header-2-line-height)" }],
        "g-subheader": ["var(--g-text-subheader-2-font-size)", { lineHeight: "var(--g-text-subheader-2-line-height)" }],
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-surface)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-elevated)",
        xl: "var(--shadow-overlay)",
        "2xl": "var(--shadow-overlay)",
        surface: "var(--shadow-surface)",
        elevated: "var(--shadow-elevated)",
        overlay: "var(--shadow-overlay)",
        nav: "var(--shadow-nav)",
        none: "none",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
