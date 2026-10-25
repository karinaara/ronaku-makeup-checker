import { defineConfig } from "@playwright/test";

// Port khusus supaya tidak bentrok dengan aplikasi lain di 5173.
// Memakai Chrome yang sudah terpasang (channel "chrome"); ganti ke "msedge" jika perlu.
const PORT = 5180;

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
  webServer: { command: `npm run dev -- --port ${PORT} --strictPort`, url: `http://localhost:${PORT}`, reuseExistingServer: true },
});
