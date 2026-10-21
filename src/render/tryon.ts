// Try-on Canvas 2D. Semua dihitung relatif terhadap landmark; foto asli tidak ditimpa penuh (tekstur dipertahankan).
import { hexToRgb, labToRgb, rgbToLab, hexToLab } from "../color/convert";
import { BLUSH_STYLES, type BlushStyleId } from "../rules/positionRules";
import type { Pt } from "../types";
import { contours, pick } from "../vision/contours";
import { faceFrame, polygonBBox } from "../vision/geometry";

export type LipFinish = "matte" | "satin" | "glossy";
export type LipLook = { hex: string; finish: LipFinish; intensity: number };
export type BlushLook = {
  hex: string;
  style: BlushStyleId;
  tinggi: number; // geser vertikal (satuan IED)
  sudut: number; // tambahan derajat
  ukuran: number; // pengali
  intensitas: number; // 0..1
};
export type Look = { lip?: LipLook; blush?: BlushLook };

const FINISH = {
  matte: { opacity: 0.8, texture: 0.95, spec: 0 },
  satin: { opacity: 0.72, texture: 1.0, spec: 0.25 },
  glossy: { opacity: 0.64, texture: 1.1, spec: 0.7 },
} satisfies Record<LipFinish, { opacity: number; texture: number; spec: number }>;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function renderLook(canvas: HTMLCanvasElement, photo: HTMLCanvasElement, landmarks: Pt[], look: Look, maxW = 720) {
  const scale = Math.min(1, maxW / photo.width);
  canvas.width = Math.round(photo.width * scale);
  canvas.height = Math.round(photo.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
  const lm = landmarks.map((p) => ({ x: p.x * scale, y: p.y * scale }));
  if (look.blush) drawBlush(ctx, lm, look.blush);
  if (look.lip) drawLips(ctx, lm, look.lip);
}

function drawBlush(ctx: CanvasRenderingContext2D, lm: Pt[], b: BlushLook) {
  const style = BLUSH_STYLES.find((s) => s.id === b.style);
  if (!style || b.intensitas <= 0) return;
  const { ex, ey, ied } = faceFrame(lm);
  const [r, g, bl] = hexToRgb(b.hex);
  const soft = [r + (255 - r) * 0.45, g + (255 - g) * 0.45, bl + (255 - bl) * 0.45].map(Math.round);

  const oval = pick(lm, contours().faceOval);
  ctx.save();
  ctx.beginPath();
  oval.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();

  for (const side of [-1, 1] as const) {
    const eye = lm[side === -1 ? 33 : 263];
    const mouth = lm[side === -1 ? 61 : 291];
    const nose = lm[1];
    const mid = { x: eye.x + (mouth.x - eye.x) * 0.55, y: eye.y + (mouth.y - eye.y) * 0.55 };
    const anchor = { x: mid.x + (nose.x - mid.x) * 0.15, y: mid.y + (nose.y - mid.y) * 0.15 };
    const out = { x: ex.x * side, y: ex.y * side }; // arah keluar wajah
    const dx = style.offsetX * ied;
    const dy = (style.offsetY + b.tinggi) * ied;
    const cx = anchor.x + out.x * dx + ey.x * dy;
    const cy = anchor.y + out.y * dx + ey.y * dy;
    const th = ((style.angle + b.sudut) * Math.PI) / 180;
    const ux = out.x * Math.cos(th) - ey.x * Math.sin(th);
    const uy = out.y * Math.cos(th) - ey.y * Math.sin(th);

    const paint = (rgb: number[], op: GlobalCompositeOperation, alpha: number) => {
      ctx.save();
      ctx.globalCompositeOperation = op;
      ctx.translate(cx, cy);
      ctx.rotate(Math.atan2(uy, ux));
      ctx.scale(style.rx * ied * b.ukuran, style.ry * ied * b.ukuran);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      const col = `${rgb[0]},${rgb[1]},${rgb[2]}`;
      grad.addColorStop(0, `rgba(${col},${alpha})`);
      grad.addColorStop(clamp(1 - style.feather, 0.05, 0.9), `rgba(${col},${alpha * 0.55})`);
      grad.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    };
    paint(soft, "multiply", 0.85 * b.intensitas); // memberi kedalaman
    paint([r, g, bl], "color", 0.5 * b.intensitas); // memberi pigmen tanpa menghapus tekstur kulit
  }
  ctx.restore();
}

function drawLips(ctx: CanvasRenderingContext2D, lm: Pt[], look: LipLook) {
  const { lipsOuter, lipsInner } = contours();
  const outer = pick(lm, lipsOuter);
  const inner = pick(lm, lipsInner);
  const bb = polygonBBox([outer], 4);
  const x = Math.max(0, bb.x), y = Math.max(0, bb.y);
  const w = Math.min(ctx.canvas.width - x, bb.w), h = Math.min(ctx.canvas.height - y, bb.h);
  if (w <= 0 || h <= 0) return;

  const mask = document.createElement("canvas");
  mask.width = w; mask.height = h;
  const mctx = mask.getContext("2d")!;
  mctx.filter = "blur(1.1px)"; // tepi lembut; diabaikan di browser yang tidak mendukung
  mctx.fillStyle = "#fff";
  mctx.beginPath();
  for (const poly of [outer, inner]) {
    poly.forEach((p, i) => (i ? mctx.lineTo(p.x - x, p.y - y) : mctx.moveTo(p.x - x, p.y - y)));
    mctx.closePath();
  }
  mctx.fill("evenodd");
  const m = mctx.getImageData(0, 0, w, h).data;
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;

  // rata-rata L* asli bibir, supaya bayangan dan tekstur asli bibir tetap terlihat
  let sumL = 0, sumW = 0;
  const origL = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = m[i * 4 + 3] / 255;
    const L = rgbToLab(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]).L;
    origL[i] = L;
    sumL += L * a; sumW += a;
  }
  if (sumW < 1) return;
  const meanL = sumL / sumW;

  const t = hexToLab(look.hex);
  const F = FINISH[look.finish];
  const strength = clamp(look.intensity * 1.25, 0, 1);
  for (let i = 0; i < w * h; i++) {
    const a = m[i * 4 + 3] / 255;
    if (a < 0.01) continue;
    const o = rgbToLab(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
    const rel = o.L - meanL;
    const newL = clamp(t.L + rel * F.texture + F.spec * Math.max(0, rel - 2) * 1.2, 0, 100);
    const k = clamp(a * F.opacity * strength, 0, 0.95);
    const rgb = labToRgb({ L: o.L + (newL - o.L) * k, a: o.a + (t.a - o.a) * k, b: o.b + (t.b - o.b) * k });
    d[i * 4] = rgb[0]; d[i * 4 + 1] = rgb[1]; d[i * 4 + 2] = rgb[2];
  }
  ctx.putImageData(img, x, y);
}
