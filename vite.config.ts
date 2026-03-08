import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800, // lucide-react includes all icons; expected to be large
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Data fetching & state
          "vendor-query": ["@tanstack/react-query"],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // Stripe
          "vendor-stripe": ["@stripe/stripe-js"],
          // UI library (shadcn primitives via radix)
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-accordion",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
          ],
          // Animation
          "vendor-motion": ["framer-motion"],
          // Date utilities
          "vendor-dates": ["date-fns", "react-day-picker"],
          // Charts
          "vendor-charts": ["recharts"],
          // Form handling
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Icons (large)
          "vendor-icons": ["lucide-react"],
          // Markdown / sanitization
          "vendor-markdown": ["marked", "dompurify"],
        },
      },
    },
  },
}));
