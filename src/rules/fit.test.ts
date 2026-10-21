import { describe, expect, it } from "vitest";
import { hexToLab } from "../color/convert";
import { assessConfidence, depthFromL, undertoneFromHue } from "../color/skin";
import type { SkinProfile } from "../types";
import { buildPalette, foundationRange } from "./palette";
import { scoreFit } from "./fit";

function profile(hue: number, skinHex = "#C29A74"): SkinProfile {
  const lab = hexToLab(skinHex);
  return {
    skinLab: lab,
    skinHex,
    depth: depthFromL(lab.L),
    undertone: undertoneFromHue(hue),
    contrast: { level: "sedang", delta: 28 },
    confidence: assessConfidence({ meanL: 60, spreadDeltaE: 3, castDeviation: 0.03, blurVar: 150, faceWidthFrac: 0.5, samplePixels: 4000 }),
    faceShape: { key: "oval", ratios: { hw: 1.4, jawCheek: 0.8, foreheadJaw: 1 } },
  };
}

describe("kecocokan", () => {
  it("warm: peach lebih selaras daripada berry dingin", () => {
    const p = profile(70);
    const peach = scoreFit(p, "#E9967A", "lip");
    const berry = scoreFit(p, "#8E2A55", "lip");
    expect(peach.debug.harmoni).toBeGreaterThan(berry.debug.harmoni);
    expect(peach.debug.total).toBeGreaterThan(berry.debug.total);
  });
  it("cool: berry lebih selaras daripada terakota", () => {
    const p = profile(38);
    expect(scoreFit(p, "#8E2A55", "lip").debug.harmoni).toBeGreaterThan(scoreFit(p, "#B5584B", "lip").debug.harmoni);
  });
  it("hasil punya label, alasan Indonesia, tanpa angka persen", () => {
    const r = scoreFit(profile(60), "#D9694F", "blush");
    expect(["Selaras", "Bisa dicoba", "Kurang cocok"]).toContain(r.label);
    expect(r.reasons.length).toBe(2);
    expect(r.reasons.join(" ")).not.toMatch(/%/);
  });
  it("keyakinan dibawa dari profil", () => {
    expect(scoreFit(profile(60), "#D9694F", "lip").confidence).toBe("Tinggi");
  });
});

describe("palet", () => {
  it("foundation: empat warna dari terang ke gelap, paling dekat = kulit", () => {
    const p = profile(60);
    const f = foundationRange(p);
    expect(f.map((x) => x.nama)).toEqual(["Terang", "Paling dekat", "Sedikit gelap", "Gelap"]);
    const L = f.map((x) => hexToLab(x.hex).L);
    expect(L[0]).toBeGreaterThan(L[1]);
    expect(L[1]).toBeGreaterThan(L[2]);
    expect(L[2]).toBeGreaterThan(L[3]);
  });
  it("palet berbeda untuk undertone berbeda", () => {
    const warm = buildPalette(profile(75)).lipstik.slice(0, 3).map((x) => x.nama);
    const cool = buildPalette(profile(36)).lipstik.slice(0, 3).map((x) => x.nama);
    expect(warm).not.toEqual(cool);
  });
});
