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
        // Custom brand colors
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
      boxShadow: {
        /* Design-system shadow tokens */
        soft: "0 2px 8px -2px hsl(var(--foreground) / 0.06)",
        medium: "0 8px 24px -4px hsl(var(--foreground) / 0.08)",
        elevated: "0 16px 48px -8px hsl(var(--foreground) / 0.12)",
        /* Glassmorphism */
        glass: "var(--glass-shadow)",
        "glass-lg": "var(--glass-shadow-hover)",
        /* Glow effects */
        glow: "0 0 20px -4px hsl(var(--primary) / 0.15)",
        "glow-gold": "0 0 24px -4px hsl(var(--accent) / 0.25)",
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
        "weather-sun": {
          "0%, 100%": { transform: "scale(1) rotate(0deg)" },
          "50%": { transform: "scale(1.1) rotate(15deg)" },
        },
        "weather-cloud": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(4px)" },
        },
        "weather-rain": {
          "0%, 100%": { transform: "translateY(0)", opacity: "1" },
          "50%": { transform: "translateY(2px)", opacity: "0.7" },
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
        "weather-sun": "weather-sun 3s ease-in-out infinite",
        "weather-cloud": "weather-cloud 4s ease-in-out infinite",
        "weather-rain": "weather-rain 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
