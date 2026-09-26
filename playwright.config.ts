import { defineConfig } from "@playwright/test";

const qaAuth = Buffer.from("qa:trend-lab-qa").toString("base64");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    extraHTTPHeaders: { Authorization: `Basic ${qaAuth}` },
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "npm run dev -- -H 127.0.0.1",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      TRENDLAB_USER: "qa",
      TRENDLAB_PASSWORD: "trend-lab-qa"
    }
  }
});
