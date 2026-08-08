import { defineConfig } from "@playwright/test";

// Local/CI e2e against a production build on a dedicated port. In the remote build
// environment the browser is pre-provisioned; PW_CHROMIUM_PATH overrides discovery.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3100",
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: "pnpm exec next build && pnpm exec next start -p 3100",
    url: "http://127.0.0.1:3100",
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
