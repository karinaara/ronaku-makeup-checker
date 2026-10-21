import { defineConfig } from "@playwright/test";

// Memakai Chrome yang sudah terpasang (channel "chrome"); ganti ke "msedge" jika perlu.
export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: "http://localhost:5173",
    channel: "chrome",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
  webServer: { command: "npm run dev -- --port 5173", url: "http://localhost:5173", reuseExistingServer: true },
});
