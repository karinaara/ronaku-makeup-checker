import type { Analysis } from "../types";
import { browHulls, contours, pick } from "../vision/contours";

/** Gambar foto + area sampel + bibir/alis untuk mode debug. */
export function drawDebugOverlay(canvas: HTMLCanvasElement, a: Analysis) {
  canvas.width = a.photo.width;
  canvas.height = a.photo.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(a.photo, 0, 0);
  const stroke = (poly: { x: number; y: number }[], color: string, fill?: string) => {
    ctx.beginPath();
    poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, canvas.width / 400); ctx.stroke();
  };
  for (const r of a.debug.regions) stroke(r.polygon, r.used ? "#1FA37A" : "#D64545", r.used ? "rgba(31,163,122,.18)" : "rgba(214,69,69,.18)");
  const { lipsOuter, lipsInner, faceOval } = contours();
  stroke(pick(a.landmarks, lipsOuter), "#E9A23B");
  stroke(pick(a.landmarks, lipsInner), "#E9A23B");
  stroke(pick(a.landmarks, faceOval), "rgba(255,255,255,.7)");
  for (const h of browHulls(a.landmarks)) stroke(h, "#6AA9FF");
}
