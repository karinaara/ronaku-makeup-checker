import { test } from "@playwright/test";

const FOTO = process.env.FOTO_UJI;
test.skip(!FOTO, "set FOTO_UJI untuk menjalankan");

// Hanya mencetak angka (ukuran foto, jumlah wajah, rasio lebar wajah). Tidak ada gambar yang disimpan atau dikirim.
test("ukur wajah pada foto uji", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').waitFor({ state: "attached" });
  const buf = (await import("node:fs")).readFileSync(FOTO!).toString("base64");
  const out = await page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes]), { imageOrientation: "from-image" });
    const { toCanvas } = await import("/src/vision/analyze.ts");
    const { getLandmarker } = await import("/src/vision/landmarker.ts");
    const cv = toCanvas(bmp, bmp.width, bmp.height);
    const lm = await getLandmarker();
    const r = lm.detect(cv);
    const f = r.faceLandmarks?.[0];
    if (!f) return { asli: [bmp.width, bmp.height], analisis: [cv.width, cv.height], wajah: 0 };
    const xs = f.map((p) => p.x), ys = f.map((p) => p.y);
    return {
      asli: [bmp.width, bmp.height],
      analisis: [cv.width, cv.height],
      wajah: r.faceLandmarks.length,
      lebarWajah234_454: Math.abs(f[454].x - f[234].x),
      bboxLebar: Math.max(...xs) - Math.min(...xs),
      bboxTinggi: Math.max(...ys) - Math.min(...ys),
    };
  }, buf);
  console.log("UKUR:", JSON.stringify(out));
});
