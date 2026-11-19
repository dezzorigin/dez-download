import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8500",
  },
  webServer: {
    // Build static export + worker, lalu sajikan keduanya.
    // HANYA di CI; Chromium lokal tidak bisa start di VM dev.
    command: "npm run build && PORT=8500 node scripts/serve-worker.mjs",
    url: "http://127.0.0.1:8500/",
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Pixel 7 (Chromium) — JANGAN iPhone: butuh WebKit, CI hanya install Chromium.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
