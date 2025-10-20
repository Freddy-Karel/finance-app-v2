import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  // overall test timeout for a single test
  timeout: 180_000,
  retries: 0,
  // timeouts and test run options
    expect: { timeout: 20_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  workers: 1,
  // Force Playwright to start the dev server so that webServer.env (E2E_ROLE)
  // is applied consistently on Windows. Reusing an existing server can skip
  // setting env vars and cause auth redirects.
  webServer: { command: "pnpm dev", port: 3000, reuseExistingServer: true, env: { E2E_ROLE: "manager" } }
});
