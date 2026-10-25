import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALIS, BLUSH, COLOR_CORRECTOR, EYELINER, EYESHADOW, HIGHLIGHTER, LIPSTIK } from "../data/catalog";
import { FACE_SHAPE_LABEL } from "../color/skin";
import { BLUSH_BY_SHAPE, BLUSH_STYLES, EYE_BY_SHAPE, EYE_SHAPES, EYE_STYLES } from "../rules/positionRules";
import { FOUNDATION_RULES, SKIN_RELATIVE } from "../rules/fitRules";
import { EYE_SHAPE_NOTE, UNDERTONE } from "../rules/thresholds";
import { EN } from "./en";
import { getLang, setCurrentLang, t } from ".";

const SRC = join(__dirname, "..");
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.(ts|tsx)$/.test(f) && !/\.test\.|[\\/]i18n[\\/]/.test(p) ? [p] : [];
  });
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("i18n", () => {
  it("setiap teks t(\"...\") di kode punya terjemahan Inggris", () => {
    const missing = new Set<string>();
    for (const f of sourceFiles(SRC)) {
      const code = readFileSync(f, "utf8");
      for (const m of code.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) if (!(m[1] in EN)) missing.add(m[1]);
    }
    expect([...missing]).toEqual([]);
  });

  it("alasan keyakinan (skin.ts) dan data aturan/katalog punya terjemahan", () => {
    const skin = readFileSync(join(SRC, "color", "skin.ts"), "utf8");
    const reasons = [...skin.matchAll(/reasons\.push\("((?:[^"\\]|\\.)*)"\)/g)].map((m) => m[1]);
    expect(reasons.length).toBe(7);

    const data: string[] = [
      ...reasons,
      ...[LIPSTIK, BLUSH, EYESHADOW, HIGHLIGHTER, EYELINER, ALIS].flat().map((s) => s.nama),
      ...COLOR_CORRECTOR.flatMap((c) => [c.nama, c.guna]),
      ...FOUNDATION_RULES.steps.map((s) => s.nama),
      ...[...SKIN_RELATIVE.contour, ...SKIN_RELATIVE.bronzer].map((s) => s.nama),
      ...UNDERTONE.labels.map((l) => l.text),
      EYE_SHAPE_NOTE,
      ...Object.values(FACE_SHAPE_LABEL),
      ...BLUSH_STYLES.flatMap((s) => [s.nama, s.deskripsi]),
      ...Object.values(BLUSH_BY_SHAPE).flatMap((m) => Object.values(m).map((e) => e.alasan)),
      ...EYE_SHAPES.map((s) => s.nama),
      ...EYE_STYLES.flatMap((s) => [s.nama, s.deskripsi]),
      ...Object.values(EYE_BY_SHAPE).flatMap((m) => Object.values(m).map((e) => e.alasan)),
      // teks yang dikirim lewat props / kamus kecil
      "Selaras", "Bisa dicoba", "Kurang cocok", "rendah", "sedang", "tinggi",
      "tampilan sehari-hari", "tampilan kantor", "tampilan kondangan", "tampilan glam",
      "Contour", "Bronzer", "Highlighter", "Eyeliner", "Alis", "Blush", "Eyeshadow", "Lipstik", "Foundation",
      "Kisaran, bukan satu shade. Terang ke gelap.", "Lebih gelap dari kulit, nuansa cokelat netral.",
      "Hangat dan sedikit lebih pekat dari kulit.", "Diurutkan menurut nuansa kulitmu.",
      "Termasuk warna dingin dan berani, ada di “Lihat semua”.",
      "Pilih yang paling dekat dengan warna rambut alis alamimu.", "Termasuk berry, plum, dan merah di “Lihat semua”.",
      "Rona.ku — Temukan ronamu", "lipstik", "blush", "eyeshadow",
    ];
    expect([...new Set(data.filter((s) => !(s in EN)))]).toEqual([]);
  });

  it("placeholder {…} sama persis di teks sumber dan terjemahan", () => {
    for (const [id, en] of Object.entries(EN)) expect(placeholders(en), id).toBe(placeholders(id));
  });

  it("t() mengisi parameter dan beralih bahasa", () => {
    const before = getLang();
    setCurrentLang("en");
    expect(t("Keyakinan {level}", { level: t("tinggi") })).toBe("high confidence");
    expect(t("tidak ada di kamus")).toBe("tidak ada di kamus"); // fallback aman
    setCurrentLang("id");
    expect(t("Keyakinan {level}", { level: t("tinggi") })).toBe("Keyakinan tinggi");
    setCurrentLang(before);
  });

  it("hasil aturan berganti bahasa (alasan kecocokan)", async () => {
    const { scoreFit } = await import("../rules/fit");
    const { hexToLab, hueAngle } = await import("../color/convert");
    const { assessConfidence, depthFromL, undertoneFromHue } = await import("../color/skin");
    const lab = hexToLab("#C29A74");
    const profile = {
      skinLab: lab,
      skinHex: "#C29A74",
      depth: depthFromL(lab.L),
      undertone: undertoneFromHue(hueAngle(lab)),
      contrast: { level: "sedang" as const, delta: 28 },
      confidence: assessConfidence({ meanL: 60, spreadDeltaE: 3, castDeviation: 0.03, blurVar: 150, faceWidthFrac: 0.5, samplePixels: 4000 }),
      faceShape: { key: "oval" as const, ratios: { hw: 1.4, jawCheek: 0.8, foreheadJaw: 1 } },
    };
    setCurrentLang("id");
    const id = scoreFit(profile, "#E9967A", "lip").reasons.join(" ");
    setCurrentLang("en");
    const en = scoreFit(profile, "#E9967A", "lip").reasons.join(" ");
    setCurrentLang("id");
    expect(id).not.toBe(en);
    expect(en).toMatch(/[Tt]one|intensity|contrast/);
    expect(en).not.toMatch(/Nuansanya|kulitmu|kontras alami/);
  });
});
