import type { Pt } from "../types";

type Conn = { start: number; end: number };

/** Susun rangkaian titik berurutan dari daftar koneksi (kontur tertutup atau rantai terbuka). */
export function loopsFromConnections(conns: Conn[]): number[][] {
  const adj = new Map<number, number[]>();
  for (const { start, end } of conns) {
    (adj.get(start) ?? adj.set(start, []).get(start)!).push(end);
    (adj.get(end) ?? adj.set(end, []).get(end)!).push(start);
  }
  const seen = new Set<number>();
  const walk = (from: number) => {
    const chain = [from];
    seen.add(from);
    let cur = from;
    for (;;) {
      const next = (adj.get(cur) ?? []).find((n) => !seen.has(n));
      if (next === undefined) break;
      chain.push(next);
      seen.add(next);
      cur = next;
    }
    return chain;
  };
  const out: number[][] = [];
  for (const [n, nb] of adj) if (nb.length === 1 && !seen.has(n)) out.push(walk(n)); // rantai terbuka
  for (const n of adj.keys()) if (!seen.has(n)) out.push(walk(n)); // kontur tertutup
  return out;
}

export const uniqueIndices = (conns: Conn[]): number[] => [...new Set(conns.flatMap((c) => [c.start, c.end]))];

export function convexHull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Kerangka wajah lokal: ex = arah kanan-gambar sepanjang garis mata, ey = ke bawah, ied = jarak sudut luar mata. */
export function faceFrame(lm: Pt[]) {
  const a = lm[33];
  const b = lm[263];
  const ied = dist(a, b);
  const ex = { x: (b.x - a.x) / ied, y: (b.y - a.y) / ied };
  const ey = { x: -ex.y, y: ex.x };
  return { ex, ey, ied, rollDeg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
}

export function ellipsePolygon(c: Pt, rx: number, ry: number, ex: Pt, ey: Pt, n = 28): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const u = Math.cos(t) * rx;
    const v = Math.sin(t) * ry;
    return { x: c.x + ex.x * u + ey.x * v, y: c.y + ex.y * u + ey.y * v };
  });
}

export function polygonBBox(polys: Pt[][], pad = 0) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const poly of polys) for (const p of poly) {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  }
  return { x: Math.floor(x0 - pad), y: Math.floor(y0 - pad), w: Math.ceil(x1 - x0 + pad * 2), h: Math.ceil(y1 - y0 + pad * 2) };
}
