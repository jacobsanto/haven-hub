import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Custom Arivia Villas brand colors
        "navy-blue": "hsl(var(--navy-blue))",
        "primary-blue": "hsl(var(--primary-blue))",
        "gold-accent": "hsl(var(--gold-accent))",
        "sand-brown": "hsl(var(--sand-brown))",
        "light-blue": "hsl(var(--light-blue))",
        "pale-blue": "hsl(var(--pale-blue))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
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
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "float-diagonal-1": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(15px, -20px)" },
          "50%": { transform: "translate(25px, 10px)" },
          "75%": { transform: "translate(-10px, 20px)" },
        },
        "float-diagonal-2": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(-20px, 15px)" },
          "50%": { transform: "translate(10px, 25px)" },
          "75%": { transform: "translate(20px, -10px)" },
        },
        "float-diagonal-3": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "33%": { transform: "translate(18px, 18px)" },
          "66%": { transform: "translate(-15px, 12px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "float-1": "float-diagonal-1 20s ease-in-out infinite",
        "float-2": "float-diagonal-2 25s ease-in-out infinite",
        "float-3": "float-diagonal-3 18s ease-in-out infinite",
      },
      boxShadow: {
        organic: "0 4px 6px -1px hsl(244 42% 28% / 0.05), 0 10px 15px -3px hsl(244 42% 28% / 0.08)",
        "organic-lg": "0 20px 25px -5px hsl(244 42% 28% / 0.08), 0 8px 10px -6px hsl(244 42% 28% / 0.05)",
        "organic-xl": "0 25px 50px -12px hsl(244 42% 28% / 0.15)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
