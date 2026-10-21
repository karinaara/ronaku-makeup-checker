import { expect, test } from "@playwright/test";

// Jalankan dengan: $env:FOTO_UJI="C:\path\foto.png"; npx playwright test foto-uji
// Mencetak angka mode debug supaya ambang bisa dikalibrasi. Foto hanya diproses di browser lokal.
const FOTO = process.env.FOTO_UJI;

test.skip(!FOTO, "set FOTO_UJI untuk menjalankan");

test("foto uji: alur penuh dan angka debug", async ({ page }) => {
  await page.goto("/?debug=1");
  await page.locator('input[type="file"]').setInputFiles(FOTO!);
  const alert = page.getByRole("alert");
  const profil = page.getByRole("heading", { name: "Profil warnamu" });
  await expect(profil.or(alert)).toBeVisible({ timeout: 60_000 });
  if (await alert.isVisible()) {
    console.log("DITOLAK:", await alert.innerText());
    throw new Error("Foto ditolak");
  }
  console.log("DEBUG:\n" + (await page.locator("section.debug").innerText()));
  for (const nav of ["Coba", "Foundation", "Palet"]) {
    await page.getByRole("navigation").getByRole("button", { name: nav }).click();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
});
