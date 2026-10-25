import { expect, test } from "@playwright/test";

test.describe("browser berbahasa Indonesia", () => {
  test.use({ locale: "id-ID" });

  test("bawaan Indonesia, bisa pindah ke English, dan pilihan diingat setelah muat ulang", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Temukan ronamu." })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "id");

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "Find your glow." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Take photo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload photo" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.reload();
    await expect(page.getByRole("heading", { name: "Find your glow." })).toBeVisible();

    await page.getByRole("button", { name: "Bahasa Indonesia" }).click();
    await expect(page.getByRole("heading", { name: "Temukan ronamu." })).toBeVisible();
  });
});

test.describe("browser berbahasa Inggris", () => {
  test.use({ locale: "en-US" });

  test("bawaan English, kebijakan privasi dan galat tanpa wajah juga berbahasa Inggris", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Find your glow." })).toBeVisible();

    await page.getByText("Privacy policy").click();
    await expect(page.getByText("biometric data", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Deleting data")).toBeVisible();

    // foto tanpa wajah ditolak dengan pesan Inggris
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHkxgvgAAAABJRU5ErkJggg==",
      "base64",
    );
    await page.locator('input[type="file"]').setInputFiles({ name: "kosong.png", mimeType: "image/png", buffer: png });
    await expect(page.getByRole("alert")).toContainText(/No face detected|too small|couldn't be opened/i, { timeout: 30_000 });
  });

  test("tidak ada teks Indonesia yang tersisa di layar utama (kecuali tombol bahasa)", async ({ page }) => {
    await page.goto("/");
    const text = await page.locator("body").innerText();
    for (const kata of ["Temukan", "Ambil foto", "Unggah", "kulitmu", "wajahmu", "Kebijakan privasi"]) {
      expect(text, kata).not.toContain(kata);
    }
  });
});
