import { expect, test } from "@playwright/test";

import { deflateSync } from "node:zlib";

// PNG abu-abu polos 64x64 (tanpa wajah) untuk menguji penolakan foto.
function pngPolos(size: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b: Buffer) => {
    let c = 0xffffffff;
    for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // grayscale
  const raw = Buffer.alloc((size + 1) * size, 128);
  for (let y = 0; y < size; y++) raw[y * (size + 1)] = 0; // filter byte
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const PNG_TANPA_WAJAH = pngPolos(64);

test("layar selfie: judul, panduan, catatan privasi, tanpa scroll horizontal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Temukan ronamu." })).toBeVisible();
  await expect(page.getByText("diproses di perangkat ini saja")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ambil foto" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unggah foto" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("kebijakan privasi bisa dibuka dan menyebut biometrik serta penghapusan data", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Kebijakan privasi").click();
  await expect(page.getByText("data biometrik")).toBeVisible();
  await expect(page.getByText("Menghapus data")).toBeVisible();
});

test("target sentuh tombol utama minimal 44px", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Ambil foto", "Unggah foto"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test("foto tanpa wajah ditolak dengan pesan jelas dan tidak lanjut ke profil", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({ name: "kosong.png", mimeType: "image/png", buffer: PNG_TANPA_WAJAH });
  await expect(page.getByRole("alert")).toContainText(/Wajah tidak terdeteksi|terlalu kecil/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Profil warnamu" })).toHaveCount(0);
});

test("tidak ada permintaan jaringan yang membawa gambar wajah", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") posts.push(r.url());
  });
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({ name: "kosong.png", mimeType: "image/png", buffer: PNG_TANPA_WAJAH });
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 30_000 });
  expect(posts).toEqual([]);
});
