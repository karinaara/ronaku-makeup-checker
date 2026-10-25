// Pipeline: gambar -> landmark -> area sampel -> koreksi cahaya -> median Lab -> profil warna.
// Semua di perangkat. Tidak ada gambar atau landmark yang dikirim atau disimpan.
import { deltaE2000, hueAngle, labToHex, rgbToLab, type Lab, type RGB } from "../color/convert";
import {
  applyGains,
  assessConfidence,
  classifyFaceShape,
  contrastFromL,
  depthFromL,
  grayWorldGains,
  trimmedMedianLab,
  undertoneFromHue,
} from "../color/skin";
import { FACE_CHECK, SKIN } from "../rules/thresholds";
import type { Analysis, DebugInfo, Pt, SkinProfile } from "../types";
import { browHulls, contours, pick } from "./contours";
import { dist, ellipsePolygon, faceFrame, lerpPt, polygonBBox } from "./geometry";
import { getLandmarker } from "./landmarker";

export class AnalysisError extends Error {
  constructor(
    public code: "no-face" | "small" | "yaw" | "roll" | "load",
    message: string,
  ) {
    super(message);
  }
}

const MAX_DIM = 1024;

export function toCanvas(src: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

/** Ambil piksel RGB di dalam gabungan poligon (evenodd). */
function pixelsIn(photo: HTMLCanvasElement, polys: Pt[][]): RGB[] {
  const bb = polygonBBox(polys, 1);
  const x = Math.max(0, bb.x), y = Math.max(0, bb.y);
  const w = Math.min(photo.width - x, bb.w), h = Math.min(photo.height - y, bb.h);
  if (w <= 0 || h <= 0) return [];
  const mask = document.createElement("canvas");
  mask.width = w; mask.height = h;
  const mctx = mask.getContext("2d")!;
  mctx.fillStyle = "#fff";
  mctx.beginPath();
  for (const poly of polys) {
    poly.forEach((p, i) => (i ? mctx.lineTo(p.x - x, p.y - y) : mctx.moveTo(p.x - x, p.y - y)));
    mctx.closePath();
  }
  mctx.fill("evenodd");
  const m = mctx.getImageData(0, 0, w, h).data;
  const d = photo.getContext("2d")!.getImageData(x, y, w, h).data;
  const out: RGB[] = [];
  for (let i = 0; i < m.length; i += 4) if (m[i + 3] > 200) out.push([d[i], d[i + 1], d[i + 2]]);
  return out;
}

/** Rata-rata RGB piksel di luar wajah (untuk gray-world). Null jika terlalu sedikit latar. */
function backgroundMean(photo: HTMLCanvasElement, faceOval: Pt[]): RGB | null {
  const cx = faceOval.reduce((s, p) => s + p.x, 0) / faceOval.length;
  const cy = faceOval.reduce((s, p) => s + p.y, 0) / faceOval.length;
  const grown = faceOval.map((p) => ({ x: cx + (p.x - cx) * 1.35, y: cy + (p.y - cy) * 1.35 }));
  const c = document.createElement("canvas");
  c.width = photo.width; c.height = photo.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(photo, 0, 0);
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  grown.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.fill();
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) {
    if (d[i + 3] < 250) continue;
    const mx = Math.max(d[i], d[i + 1], d[i + 2]);
    if (mx < 25 || mx > 240) continue; // terlalu gelap/silau: tidak informatif
    r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
  }
  return n / (d.length / 16) < 0.12 ? null : [r / n, g / n, b / n];
}

function laplacianVariance(photo: HTMLCanvasElement, box: { x: number; y: number; w: number; h: number }): number {
  const W = 256;
  const H = Math.max(8, Math.round((W * box.h) / box.w));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(photo, box.x, box.y, box.w, box.h, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;
  const g = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  let sum = 0, sq = 0, n = 0;
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const v = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - W] - g[i + W];
      sum += v; sq += v * v; n++;
    }
  const mean = sum / n;
  return sq / n - mean * mean;
}

const labsOf = (px: RGB[], gains: RGB): Lab[] =>
  px.map((p) => {
    const c = applyGains(p, gains);
    return rgbToLab(c[0], c[1], c[2]);
  });

/** Validasi ukuran, arah hadap, dan kemiringan wajah. Melempar AnalysisError dengan pesan Bahasa Indonesia. */
export function validateFace(lm: Pt[], w: number, h: number) {
  const faceW = dist(lm[234], lm[454]);
  const faceWidthFrac = faceW / Math.min(w, h); // sisi terpendek, supaya foto landscape tidak salah dinilai
  if (faceWidthFrac < FACE_CHECK.minFaceWidthFrac)
    throw new AnalysisError("small", "Wajah terlalu kecil di foto. Dekatkan wajah ke kamera sampai memenuhi bingkai.");
  const t = ((lm[1].x - lm[234].x) * (lm[454].x - lm[234].x) + (lm[1].y - lm[234].y) * (lm[454].y - lm[234].y)) / (faceW * faceW);
  if (Math.abs(t - 0.5) > FACE_CHECK.maxYaw)
    throw new AnalysisError("yaw", "Wajah terlalu menoleh. Hadapkan wajah lurus ke kamera.");
  const frame = faceFrame(lm);
  if (Math.abs(frame.rollDeg) > FACE_CHECK.maxRollDeg)
    throw new AnalysisError("roll", "Kepala terlalu miring. Tegakkan kepala dan ambil foto lagi.");
  return { faceW, faceWidthFrac, frame };
}

/** Area sampel kulit: elips relatif terhadap landmark, skala dari jarak antar mata. */
export function sampleRegionDefs(lm: Pt[]) {
  const { ex, ey, ied } = faceFrame(lm);
  const patch = (name: string, c: Pt, rx: number, ry: number) => ({ name, polygon: ellipsePolygon(c, rx * ied, ry * ied, ex, ey) });
  const jaw = (side: 58 | 288) => lerpPt(lerpPt(lm[side], lm[152], 0.3), lm[side === 58 ? 61 : 291], 0.35);
  return [
    patch("Dahi", lerpPt(lm[10], lm[9], 0.5), 0.42, 0.14),
    patch("Pipi kiri foto", lm[50], 0.26, 0.2),
    patch("Pipi kanan foto", lm[280], 0.26, 0.2),
    patch("Rahang kiri foto", jaw(58), 0.2, 0.16),
    patch("Rahang kanan foto", jaw(288), 0.2, 0.16),
  ];
}

export async function analyzeImage(source: CanvasImageSource, w: number, h: number): Promise<Analysis> {
  const photo = toCanvas(source, w, h);
  let landmarker;
  try {
    landmarker = await getLandmarker();
  } catch {
    throw new AnalysisError("load", "Model deteksi wajah gagal dimuat. Cek koneksi internet lalu coba lagi.");
  }
  const res = landmarker.detect(photo);
  const raw = res.faceLandmarks?.[0];
  if (!raw) throw new AnalysisError("no-face", "Wajah tidak terdeteksi. Pastikan wajah terlihat jelas, tidak tertutup, dan menghadap kamera.");
  const lm: Pt[] = raw.map((p) => ({ x: p.x * photo.width, y: p.y * photo.height }));

  // 1) Validasi wajah, 2) area sampel kulit (juga dipakai live view kamera)
  const { faceW, faceWidthFrac } = validateFace(lm, photo.width, photo.height);
  const regionDefs = sampleRegionDefs(lm);

  // 3) Koreksi pencahayaan (gray-world dari area di luar wajah, dibatasi)
  const ovalPts = pick(lm, contours().faceOval);
  const bg = backgroundMean(photo, ovalPts);
  const notes: string[] = [];
  let gains: RGB = [1, 1, 1];
  let castDeviation = 0;
  if (bg) {
    const gw = grayWorldGains(bg);
    gains = gw.gains;
    castDeviation = gw.deviation;
  } else notes.push("Latar terlalu sedikit/tidak informatif: koreksi gray-world dilewati (gain = 1).");

  // 4) Warna kulit per area dan gabungan
  const perRegion = regionDefs.map((r) => {
    const px = pixelsIn(photo, [r.polygon]);
    const labs = labsOf(px, gains);
    return { ...r, labs, lab: labs.length ? trimmedMedianLab(labs) : null, pixels: px.length };
  });
  const cheekL = perRegion.filter((r) => r.name.startsWith("Pipi") && r.lab).map((r) => r.lab!.L);
  const cheekMean = cheekL.length ? cheekL.reduce((a, b) => a + b, 0) / cheekL.length : null;
  const used = perRegion.map((r) => {
    if (!r.lab || r.pixels < 30) return false;
    if (r.name === "Dahi" && cheekMean !== null) {
      if (cheekMean - r.lab.L > SKIN.foreheadHairDeltaL) {
        notes.push("Dahi dikeluarkan dari sampel: jauh lebih gelap dari pipi (kemungkinan tertutup rambut/hijab).");
        return false;
      }
      if (r.lab.L - cheekMean > SKIN.foreheadGlareDeltaL) {
        notes.push("Dahi dikeluarkan dari sampel: jauh lebih terang dari pipi (kemungkinan kilap atau paparan berlebih).");
        return false;
      }
    }
    if (r.name.startsWith("Rahang") && cheekMean !== null && cheekMean - r.lab.L > SKIN.jawShadowDeltaL) {
      notes.push(`${r.name} dikeluarkan dari sampel: jauh lebih gelap dari pipi (kemungkinan bayangan).`);
      return false;
    }
    return true;
  });
  const pooled = perRegion.flatMap((r, i) => (used[i] ? r.labs : []));
  if (pooled.length === 0) throw new AnalysisError("no-face", "Area kulit tidak terbaca. Pastikan wajah tidak tertutup dan cahaya cukup.");
  const skinLab = trimmedMedianLab(pooled);
  const rawPooled = trimmedMedianLab(perRegion.flatMap((r, i) => (used[i] ? labsOf(pixelsIn(photo, [r.polygon]), [1, 1, 1]) : [])));

  const meds = perRegion.filter((_, i) => used[i]).map((r) => r.lab!);
  let spread = 0;
  for (let i = 0; i < meds.length; i++) for (let j = i + 1; j < meds.length; j++) spread = Math.max(spread, deltaE2000(meds[i], meds[j]));

  // 5) Fitur alami untuk kontras: bibir dan alis (bagian paling gelap alis = rambut)
  const { lipsOuter, lipsInner } = contours();
  const lipLabs = labsOf(pixelsIn(photo, [pick(lm, lipsOuter), pick(lm, lipsInner)]), gains);
  const lipL = lipLabs.length > 20 ? trimmedMedianLab(lipLabs).L : null;
  const browLs = browHulls(lm).flatMap((hull) => labsOf(pixelsIn(photo, [hull]), gains).map((l) => l.L)).sort((a, b) => a - b);
  const browL = browLs.length > 20 ? browLs[Math.floor(browLs.length * 0.2)] : null;
  const feats = [lipL, browL].filter((v): v is number => v !== null);
  const featureL = feats.length ? feats.reduce((a, b) => a + b, 0) / feats.length : skinLab.L - 25;

  // 6) Blur, keyakinan, bentuk wajah
  const bb = polygonBBox([ovalPts]);
  const box = { x: Math.max(0, bb.x), y: Math.max(0, bb.y), w: Math.min(photo.width - Math.max(0, bb.x), bb.w), h: Math.min(photo.height - Math.max(0, bb.y), bb.h) };
  const blurVar = laplacianVariance(photo, box);
  const meanL = pooled.reduce((s, l) => s + l.L, 0) / pooled.length;
  const confidence = assessConfidence({ meanL, spreadDeltaE: spread, castDeviation, blurVar, faceWidthFrac, samplePixels: pooled.length });

  const profile: SkinProfile = {
    skinLab,
    skinHex: labToHex(skinLab),
    depth: depthFromL(skinLab.L),
    undertone: undertoneFromHue(hueAngle(skinLab)),
    contrast: contrastFromL(skinLab.L, featureL),
    confidence,
    faceShape: classifyFaceShape({
      height: dist(lm[10], lm[152]),
      cheek: faceW,
      jaw: dist(lm[58], lm[288]),
      forehead: dist(lm[54], lm[284]),
    }),
  };
  const debug: DebugInfo = {
    regions: perRegion.map((r, i) => ({ name: r.name, polygon: r.polygon, used: used[i], lab: r.lab, pixels: r.pixels })),
    rawSkinLab: rawPooled,
    gains,
    castDeviation,
    meanL,
    spreadDeltaE: spread,
    blurVar,
    faceWidthFrac,
    lipL,
    browL,
    notes,
  };
  return { photo, landmarks: lm, profile, debug };
}
