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
          foreground: "var(--g-color-text-primary)",
        },
        destructive: {
          DEFAULT: "var(--g-color-base-danger-heavy)",
          foreground: "var(--g-color-text-light-primary)",
        },
        muted: {
          DEFAULT: "var(--g-color-base-generic-ultralight)",
          foreground: "var(--g-color-text-secondary)",
        },
        accent: {
          DEFAULT: "var(--g-color-base-selection)",
          foreground: "var(--g-color-text-primary)",
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
          DEFAULT: "var(--g-color-base-background)",
          foreground: "var(--g-color-text-primary)",
          primary: "var(--g-color-base-brand)",
          "primary-foreground": "var(--g-color-text-brand-contrast)",
          accent: "var(--g-color-base-selection)",
          "accent-foreground": "var(--g-color-text-primary)",
          border: "var(--g-color-line-generic)",
          ring: "var(--g-color-line-brand)",
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
    },
  },
  plugins: [require("tailwindcss-animate")],
}
