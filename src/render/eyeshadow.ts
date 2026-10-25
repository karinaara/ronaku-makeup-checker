// Eyeshadow: poligon kelopak dari kontur mata MediaPipe, dipotong di garis bulu mata (bola mata tidak tertutup).
import { hexToRgb } from "../color/convert";
import { EYE_SHAPES, type EyeShapeId, type EyeStyleId } from "../rules/positionRules";
import type { Pt } from "../types";
import { contours, pick } from "../vision/contours";
import { faceFrame } from "../vision/geometry";

export type EyeLook = { hex: string; style: EyeStyleId; shape: EyeShapeId; intensitas: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function drawEyeshadow(ctx: CanvasRenderingContext2D, lm: Pt[], e: EyeLook) {
  if (e.intensitas <= 0) return;
  const shape = EYE_SHAPES.find((s) => s.id === e.shape) ?? EYE_SHAPES[0];
  const { ex, ey } = faceFrame(lm);
  const nose = lm[1];
  for (const loop of contours().eyes) {
    if (loop.length < 6) continue;
    const eye = pick(lm, loop);
    const c = { x: eye.reduce((s, p) => s + p.x, 0) / eye.length, y: eye.reduce((s, p) => s + p.y, 0) / eye.length };
    const px = (p: Pt) => (p.x - c.x) * ex.x + (p.y - c.y) * ex.y; // sepanjang garis mata
    const py = (p: Pt) => (p.x - c.x) * ey.x + (p.y - c.y) * ey.y; // ke bawah
    const xs = eye.map(px);
    const minX = Math.min(...xs), eyeW = Math.max(...xs) - minX;
    if (eyeW < 4) continue;
    const upper = eye.filter((p) => py(p) <= 0.05 * eyeW).sort((a, b) => px(a) - px(b));
    if (upper.length < 3) continue;
    const side = Math.sign((c.x - nose.x) * ex.x + (c.y - nose.y) * ex.y) || 1; // arah luar wajah

    const top = upper.map((p) => {
      const t = clamp((px(p) - minX) / eyeW, 0, 1);
      const outer = side > 0 ? t : 1 - t;
      const h = shape.lidHeight * eyeW * Math.pow(Math.sin(Math.PI * t), 0.7) + 0.05 * eyeW;
      const w = shape.wing * eyeW * outer * outer;
      return { x: p.x - ey.x * h + ex.x * side * w, y: p.y - ey.y * h + ex.y * side * w };
    });
    const lidPoly = [...upper, ...top.reverse()];

    const feather = Math.max(1.5, eyeW * 0.07);
    const layer = (hex: string) => {
      const L = document.createElement("canvas");
      L.width = ctx.canvas.width;
      L.height = ctx.canvas.height;
      const l = L.getContext("2d")!;
      l.filter = `blur(${feather}px)`;
      l.fillStyle = hex;
      l.beginPath();
      lidPoly.forEach((p, i) => (i ? l.lineTo(p.x, p.y) : l.moveTo(p.x, p.y)));
      l.closePath();
      l.fill();
      l.filter = "none";
      // memudar ke atas: gradient pekat di garis bulu mata, wash lebih rata
      const A = { x: c.x - ey.x * 0.05 * eyeW, y: c.y - ey.y * 0.05 * eyeW };
      const reach = shape.lidHeight * eyeW * 1.1;
      const B = { x: c.x - ey.x * reach, y: c.y - ey.y * reach };
      const g = l.createLinearGradient(A.x, A.y, B.x, B.y);
      if (e.style === "gradient") {
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.5, "rgba(0,0,0,0.65)");
        g.addColorStop(1, "rgba(0,0,0,0)");
      } else {
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.8, "rgba(0,0,0,0.9)");
        g.addColorStop(1, "rgba(0,0,0,0.35)");
      }
      l.globalCompositeOperation = "destination-in";
      l.fillStyle = g;
      l.fillRect(0, 0, L.width, L.height);
      // bukaan mata tidak boleh tertutup
      l.globalCompositeOperation = "destination-out";
      l.fillStyle = "#000"; // penuh, bukan gradient: bukaan mata harus bersih 100%
      l.strokeStyle = "#000";
      l.lineWidth = 2; // sedikit diperlebar agar tepi blur tidak bocor ke bola mata
      l.filter = "none";
      l.beginPath();
      eye.forEach((p, i) => (i ? l.lineTo(p.x, p.y) : l.moveTo(p.x, p.y)));
      l.closePath();
      l.fill();
      l.stroke();
      return L;
    };

    const [r, g, b] = hexToRgb(e.hex);
    const soft = `rgb(${Math.round(r + (255 - r) * 0.35)},${Math.round(g + (255 - g) * 0.35)},${Math.round(b + (255 - b) * 0.35)})`;
    ctx.save();
    ctx.globalCompositeOperation = "multiply"; // kedalaman
    ctx.globalAlpha = 0.55 * e.intensitas;
    ctx.drawImage(layer(soft), 0, 0);
    ctx.globalCompositeOperation = "color"; // pigmen, tekstur kulit tetap terlihat
    ctx.globalAlpha = 0.5 * e.intensitas;
    ctx.drawImage(layer(e.hex), 0, 0);
    ctx.restore();
  }
}
