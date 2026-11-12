import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./frontend/auth-e2e",
  fullyParallel: true,
  workers: 2,
  use: { baseURL: "http://localhost:8444", trace: "off", screenshot: "off", video: "off" },
  reporter: [["list"]],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8444",
    reuseExistingServer: false,
    env: {
      PORT: "8444",
      VITE_SUPABASE_URL: "https://auth-qa.supabase.co",
      VITE_SUPABASE_ANON_KEY: "public-test-key",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "ios", use: { ...devices["iPhone 13"] } },
  ],
});
