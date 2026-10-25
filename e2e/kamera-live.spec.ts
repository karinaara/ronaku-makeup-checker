import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

// Kamera palsu: getUserMedia diganti dengan stream dari <canvas>. Tanpa FOTO_UJI, canvas berisi gambar tanpa wajah.
const FOTO = process.env.FOTO_UJI;

async function pasangKameraPalsu(page: import("@playwright/test").Page, b64: string | null) {
  await page.addInitScript((data) => {
    const c = document.createElement("canvas");
    c.width = 720;
    c.height = 960;
    const ctx = c.getContext("2d")!;
    const gambar = new Image();
    const gambar_siap = new Promise<void>((r) => (gambar.onload = () => r()));
    if (data) gambar.src = data; // data URL lengkap
    else ctx.fillStyle = "#888", ctx.fillRect(0, 0, c.width, c.height);
    const tick = () => {
      if (data && gambar.complete && gambar.naturalWidth) {
        const s = Math.max(c.width / gambar.naturalWidth, c.height / gambar.naturalHeight);
        ctx.drawImage(gambar, (c.width - gambar.naturalWidth * s) / 2, (c.height - gambar.naturalHeight * s) / 2, gambar.naturalWidth * s, gambar.naturalHeight * s);
      }
      requestAnimationFrame(tick);
    };
    void gambar_siap.then(tick);
    if (!data) tick();
    const stream = c.captureStream(15);
    navigator.mediaDevices.getUserMedia = async () => stream;
  }, b64);
}

test("kamera live tanpa wajah: tombol ambil foto nonaktif dan ada petunjuk", async ({ page }) => {
  await pasangKameraPalsu(page, null);
  await page.goto("/");
  await page.getByRole("button", { name: "Ambil foto" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Wajah belum terdeteksi" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Ambil foto sekarang" })).toBeDisabled();
  await expect(page.getByText(/foto diambil dalam/)).toHaveCount(0); // tanpa wajah, tidak ada hitung mundur
  await expect(page.getByLabel(/Ambil foto otomatis/)).toBeChecked();
  await page.getByRole("button", { name: "Batal" }).click();
  await expect(page.getByRole("heading", { name: "Temukan ronamu." })).toBeVisible();
});

test("kamera live dengan wajah: area kulit tergambar dan foto bisa diambil", async ({ page }) => {
  test.skip(!FOTO, "set FOTO_UJI (foto wajah lurus) untuk menjalankan");
  const mime = /\.png$/i.test(FOTO!) ? "image/png" : "image/jpeg";
  await pasangKameraPalsu(page, `data:${mime};base64,` + readFileSync(FOTO!).toString("base64"));
  await page.goto("/");
  await page.getByRole("button", { name: "Ambil foto" }).click();
  const tombol = page.getByRole("button", { name: "Ambil foto" });
  await expect(tombol).toBeEnabled({ timeout: 45_000 });
  await expect(page.getByRole("status").filter({ hasText: "Area hijau adalah kulit" })).toBeVisible();
  const piksel = await page.locator("canvas.guide").evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });
  expect(piksel).toBeGreaterThan(1000); // overlay benar-benar menggambar sesuatu
  // hitung mundur otomatis muncul lalu foto diambil tanpa klik
  await expect(page.getByText(/foto diambil dalam/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Profil warnamu" })).toBeVisible({ timeout: 60_000 });
});
