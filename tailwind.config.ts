import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        blue: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      // Add RTL support utilities
      textAlign: {
        start: "start",
        end: "end",
      },
      margin: {
        start: "margin-inline-start",
        end: "margin-inline-end",
      },
      padding: {
        start: "padding-inline-start",
        end: "padding-inline-end",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Add RTL plugin
    ({ addUtilities }) => {
      const newUtilities = {
        ".text-start": {
          "text-align": "start",
        },
        ".text-end": {
          "text-align": "end",
        },
        ".ms-auto": {
          "margin-inline-start": "auto",
        },
        ".me-auto": {
          "margin-inline-end": "auto",
        },
        ".ps-0": {
          "padding-inline-start": "0",
        },
        ".ps-1": {
          "padding-inline-start": "0.25rem",
        },
        ".ps-2": {
          "padding-inline-start": "0.5rem",
        },
        ".ps-3": {
          "padding-inline-start": "0.75rem",
        },
        ".ps-4": {
          "padding-inline-start": "1rem",
        },
        ".pe-0": {
          "padding-inline-end": "0",
        },
        ".pe-1": {
          "padding-inline-end": "0.25rem",
        },
        ".pe-2": {
          "padding-inline-end": "0.5rem",
        },
        ".pe-3": {
          "padding-inline-end": "0.75rem",
        },
        ".pe-4": {
          "padding-inline-end": "1rem",
        },
      }
      addUtilities(newUtilities)
    },
  ],
} satisfies Config

export default config
