import { describe, expect, it } from "vitest";
import { BLUSH_BY_SHAPE, BLUSH_STYLES, EYE_BY_SHAPE, EYE_SHAPES, EYE_STYLES } from "./positionRules";

describe("aturan posisi sebagai data", () => {
  it("setiap bentuk mata punya rekomendasi untuk setiap gaya, dengan label dan alasan", () => {
    for (const shape of EYE_SHAPES) {
      for (const style of EYE_STYLES) {
        const entry = EYE_BY_SHAPE[shape.id][style.id];
        expect(["Selaras", "Bisa dicoba", "Kurang cocok"]).toContain(entry.label);
        expect(entry.alasan.length).toBeGreaterThan(10);
      }
    }
  });
  it("hooded memakai kelopak lebih tinggi daripada monolid (supaya warna tetap terlihat)", () => {
    const h = (id: string) => EYE_SHAPES.find((s) => s.id === id)!.lidHeight;
    expect(h("hooded")).toBeGreaterThan(h("almond"));
    expect(h("monolid")).toBeLessThanOrEqual(h("almond"));
  });
  it("setiap bentuk wajah punya rekomendasi untuk setiap gaya blush", () => {
    for (const shape of Object.values(BLUSH_BY_SHAPE)) for (const s of BLUSH_STYLES) expect(shape[s.id].alasan).toBeTruthy();
  });
});
