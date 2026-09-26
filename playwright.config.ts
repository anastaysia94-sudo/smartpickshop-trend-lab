import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    httpCredentials: { username: "qa", password: "trend-lab-qa" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "npm run dev -- -H 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      TRENDLAB_USER: "qa",
      TRENDLAB_PASSWORD: "trend-lab-qa"
    }
  }
});
