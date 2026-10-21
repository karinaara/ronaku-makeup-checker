// Estimasi kulit: koreksi cahaya, median Lab, depth, undertone, kontras, keyakinan, bentuk wajah.
import { MONK_HEX } from "../data/monk";
import { CONFIDENCE, CONTRAST, FACE_SHAPE, SKIN, UNDERTONE } from "../rules/thresholds";
import { hexToLab, type Lab, type RGB } from "./convert";

export type ConfidenceLevel = "Tinggi" | "Sedang" | "Rendah";
export type UndertoneKey = "cool" | "netral" | "warm";
export type ContrastLevel = "rendah" | "sedang" | "tinggi";
export type FaceShapeKey = "oval" | "bulat" | "persegi" | "hati" | "panjang";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Gray-world dengan batas koreksi. `deviation` = penyimpangan mentah (sebelum dibatasi), sinyal color cast. */
export function grayWorldGains(mean: RGB): { gains: RGB; deviation: number } {
  const avg = (mean[0] + mean[1] + mean[2]) / 3;
  const raw = mean.map((m) => (m > 0 ? avg / m : 1));
  const { minGain, maxGain, minDeviation } = SKIN.whiteBalance;
  const deviation = Math.max(...raw.map((g) => Math.abs(g - 1)));
  const gains = (deviation < minDeviation ? [1, 1, 1] : raw.map((g) => clamp(g, minGain, maxGain))) as RGB;
  return { gains, deviation };
}

export function applyGains(rgb: RGB, gains: RGB): RGB {
  return [
    clamp(rgb[0] * gains[0], 0, 255),
    clamp(rgb[1] * gains[1], 0, 255),
    clamp(rgb[2] * gains[2], 0, 255),
  ];
}

/** Median Lab setelah membuang persentil bawah/atas berdasarkan L*. */
export function trimmedMedianLab(labs: Lab[], trim = SKIN.trim): Lab {
  if (labs.length === 0) return { L: 0, a: 0, b: 0 };
  const sorted = [...labs].sort((p, q) => p.L - q.L);
  const lo = Math.floor(sorted.length * trim.low);
  const hi = Math.ceil(sorted.length * (1 - trim.high));
  const kept = sorted.slice(lo, Math.max(hi, lo + 1));
  const med = (vals: number[]) => {
    const s = [...vals].sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  return { L: med(kept.map((k) => k.L)), a: med(kept.map((k) => k.a)), b: med(kept.map((k) => k.b)) };
}

export const MONK_LAB = MONK_HEX.map(hexToLab);

export type Depth = { levels: [number, number]; nearest: number };

/** Cocokkan L* ke skala Monk; keluarkan dua level bersebelahan (1-based). */
export function depthFromL(L: number): Depth {
  let best = 0;
  MONK_LAB.forEach((m, i) => {
    if (Math.abs(m.L - L) < Math.abs(MONK_LAB[best].L - L)) best = i;
  });
  const neighbors = [best - 1, best + 1].filter((i) => i >= 0 && i < MONK_LAB.length);
  const other = neighbors.reduce((p, q) =>
    Math.abs(MONK_LAB[q].L - L) < Math.abs(MONK_LAB[p].L - L) ? q : p,
  );
  const [a, b] = [best, other].sort((x, y) => x - y);
  return { levels: [a + 1, b + 1], nearest: best + 1 };
}

export type Undertone = { score: number; hue: number; key: UndertoneKey; label: string };

/** Skor kontinu 0 (cool) .. 1 (warm) dari hue angle Lab. */
export function undertoneFromHue(hue: number): Undertone {
  const { hueCool, hueWarm, labels } = UNDERTONE;
  const h = hue > 180 ? hue - 360 : hue; // 349° = -11°: sisi merah-ungu (cool), bukan "lebih warm dari 66°"
  const score = clamp((h - hueCool) / (hueWarm - hueCool), 0, 1);
  const hit = labels.find((l) => score < l.max) ?? labels[labels.length - 1];
  return { score, hue, key: hit.key, label: hit.text };
}

export function contrastFromL(skinL: number, featureL: number): { level: ContrastLevel; delta: number } {
  const delta = skinL - featureL;
  const level = delta < CONTRAST.lowBelow ? "rendah" : delta > CONTRAST.highAbove ? "tinggi" : "sedang";
  return { level, delta };
}

export type ConfidenceInput = {
  meanL: number;
  spreadDeltaE: number;
  castDeviation: number;
  blurVar: number;
  faceWidthFrac: number;
  samplePixels: number;
};

export type Confidence = {
  level: ConfidenceLevel;
  reasons: string[]; // alasan + saran foto ulang, Bahasa Indonesia
  points: number;
  factors: Record<string, 0 | 1 | 2>;
};

export function assessConfidence(i: ConfidenceInput): Confidence {
  const C = CONFIDENCE;
  const reasons: string[] = [];
  const grade = (v: number, mid: number, bad: number, lowerIsWorse: boolean): 0 | 1 | 2 => {
    const worse = (x: number) => (lowerIsWorse ? v <= x : v >= x);
    return worse(bad) ? 2 : worse(mid) ? 1 : 0;
  };
  const dark = grade(i.meanL, C.meanL.dark[0], C.meanL.dark[1], true);
  const bright = grade(i.meanL, C.meanL.bright[0], C.meanL.bright[1], false);
  const light: 0 | 1 | 2 = Math.max(dark, bright) as 0 | 1 | 2;
  const spread = grade(i.spreadDeltaE, C.spreadDeltaE[0], C.spreadDeltaE[1], false);
  const cast = grade(i.castDeviation, C.castGain[0], C.castGain[1], false);
  const blur = grade(i.blurVar, C.blurVar[0], C.blurVar[1], true);
  const size = grade(i.faceWidthFrac, C.faceWidthFrac[0], C.faceWidthFrac[1], true);
  const pix: 0 | 1 | 2 = i.samplePixels < SKIN.minSamplePixels ? 2 : 0;

  if (dark) reasons.push("Fotonya agak gelap. Coba menghadap jendela atau cahaya siang.");
  if (bright) reasons.push("Fotonya terlalu terang atau silau. Hindari cahaya langsung ke wajah.");
  if (spread) reasons.push("Warna kulit antar area wajah tidak seragam. Mungkin ada bayangan atau cahaya dari samping.");
  if (cast) reasons.push("Ada warna cahaya yang dominan (misalnya kekuningan). Coba cahaya putih atau cahaya alami.");
  if (blur) reasons.push("Fotonya kurang tajam. Tahan ponsel dengan stabil dan bersihkan lensa.");
  if (size) reasons.push("Wajah terlalu kecil di foto. Dekatkan wajah ke kamera.");
  if (pix) reasons.push("Area kulit yang terbaca terlalu sedikit. Pastikan dahi dan pipi tidak tertutup.");

  const factors = { cahaya: light, konsistensi: spread, colorCast: cast, blur, ukuran: size, areaSampel: pix };
  const points = Object.values(factors).reduce<number>((s, v) => s + v, 0);
  const anyBad = Object.values(factors).includes(2);
  const level: ConfidenceLevel =
    points >= C.lowAt || (anyBad && points >= 2) ? "Rendah" : points >= C.mediumAt ? "Sedang" : "Tinggi";
  return { level, reasons, points, factors };
}

export type FaceShape = { key: FaceShapeKey; ratios: { hw: number; jawCheek: number; foreheadJaw: number } };

export const FACE_SHAPE_LABEL: Record<FaceShapeKey, string> = {
  oval: "oval",
  bulat: "bulat",
  persegi: "persegi",
  hati: "hati",
  panjang: "panjang",
};

export function classifyFaceShape(r: { height: number; cheek: number; jaw: number; forehead: number }): FaceShape {
  const hw = r.height / r.cheek;
  const jawCheek = r.jaw / r.cheek;
  const foreheadJaw = r.forehead / r.jaw;
  const F = FACE_SHAPE;
  let key: FaceShapeKey = "oval";
  if (foreheadJaw > F.heartForeheadToJaw) key = "hati";
  else if (hw > F.longRatio) key = "panjang";
  else if (hw < F.roundRatio) key = jawCheek > F.squareJawToCheek ? "persegi" : "bulat";
  else if (jawCheek > F.squareJawToCheek + 0.04) key = "persegi";
  return { key, ratios: { hw, jawCheek, foreheadJaw } };
}
