import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    // Force Supabase env to placeholder so tests never touch a real project
    // (the repo's .env holds live credentials; isSupabaseConfigured stays false).
    // Payment / social / policy vars are pinned to "" so a developer's real .env
    // can never make a provider look available inside a test.
    env: {
      VITE_SUPABASE_URL: "https://placeholder.supabase.co",
      VITE_SUPABASE_ANON_KEY: "placeholder-key",
      VITE_PAYMENT_BANK_NAME: "",
      VITE_PAYMENT_ACCOUNT_NUMBER: "",
      VITE_PAYMENT_ACCOUNT_NAME: "",
      VITE_SOCIAL_INSTAGRAM: "",
      VITE_SOCIAL_TIKTOK: "",
      VITE_SOCIAL_X: "",
      VITE_POLICY_PRIVACY_URL: "",
      VITE_POLICY_TERMS_URL: "",
      VITE_POLICY_COOKIES_URL: "",
    },
  },
});
