import { defineConfig, devices } from "@playwright/test";
const externalURL = process.env.E2E_BASE_URL;
const baseURL = externalURL || "http://localhost:8445";
export default defineConfig({
  testDir: "./frontend/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 30000,
  expect: { timeout: 7000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL,
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: externalURL
    ? undefined
    : {
        command: "npm run dev",
        env: {
          PORT: "8445",
          VITE_SUPABASE_URL: "https://auth-qa.supabase.co",
          VITE_SUPABASE_ANON_KEY: "public-test-key",
        },
        url: baseURL,
        reuseExistingServer: false,
        timeout: 30000,
        stdout: "ignore",
        stderr: "pipe",
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "android", use: { ...devices["Pixel 7"] } },
    { name: "ios", use: { ...devices["iPhone 13"] } },
  ],
});
