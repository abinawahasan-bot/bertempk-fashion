import { defineConfig } from "vite";
console.log("BUILD ENV VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL);
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "motion-vendor": ["motion"],
        },
      },
    },
  },
});
