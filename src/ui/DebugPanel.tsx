import { useEffect, useRef } from "react";
import { drawDebugOverlay } from "../render/debugOverlay";
import type { Analysis } from "../types";

const f = (n: number, d = 1) => n.toFixed(d);

export function DebugPanel({ a }: { a: Analysis }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawDebugOverlay(ref.current, a);
  }, [a]);
  const { profile: p, debug: d } = a;
  const lab = (l: { L: number; a: number; b: number }) => `${f(l.L)} / ${f(l.a)} / ${f(l.b)}`;
  return (
    <section className="card debug" aria-label="Mode debug">
      <h3>Mode debug</h3>
      <canvas ref={ref} aria-label="Foto dengan area sampel. Hijau dipakai, merah dibuang" />
      <table>
        <tbody>
          <tr><th>L*a*b* kulit (terkoreksi)</th><td>{lab(p.skinLab)}</td></tr>
          <tr><th>L*a*b* kulit (mentah)</th><td>{lab(d.rawSkinLab)}</td></tr>
          <tr><th>Gain white balance R/G/B</th><td>{d.gains.map((g) => f(g, 3)).join(" / ")}</td></tr>
          <tr><th>Penyimpangan color cast</th><td>{f(d.castDeviation, 3)}</td></tr>
          <tr><th>Hue angle</th><td>{f(p.undertone.hue)}°</td></tr>
          <tr><th>Skor undertone (0 cool … 1 warm)</th><td>{f(p.undertone.score, 2)} → {p.undertone.label}</td></tr>
          <tr><th>Depth</th><td>level {p.depth.levels.join("–")} (terdekat {p.depth.nearest})</td></tr>
          <tr><th>Kontras</th><td>ΔL* {f(p.contrast.delta)} → {p.contrast.level} (bibir L* {d.lipL === null ? "-" : f(d.lipL)}, alis L* {d.browL === null ? "-" : f(d.browL)})</td></tr>
          <tr><th>L* rata-rata sampel</th><td>{f(d.meanL)}</td></tr>
          <tr><th>Selisih antar area (ΔE00 maks)</th><td>{f(d.spreadDeltaE)}</td></tr>
          <tr><th>Varians Laplacian (blur)</th><td>{f(d.blurVar)}</td></tr>
          <tr><th>Lebar wajah / lebar foto</th><td>{f(d.faceWidthFrac, 2)}</td></tr>
          <tr><th>Rasio wajah (t/l, rahang/pipi, dahi/rahang)</th><td>{f(p.faceShape.ratios.hw, 2)} / {f(p.faceShape.ratios.jawCheek, 2)} / {f(p.faceShape.ratios.foreheadJaw, 2)} → {p.faceShape.key}</td></tr>
          <tr><th>Keyakinan</th><td>{p.confidence.level} (poin {p.confidence.points}: {Object.entries(p.confidence.factors).map(([k, v]) => `${k}=${v}`).join(", ")})</td></tr>
        </tbody>
      </table>
      <h3>Area sampel</h3>
      <table>
        <tbody>
          {d.regions.map((r) => (
            <tr key={r.name}>
              <th>{r.name} {r.used ? "✓" : "✕ dibuang"}</th>
              <td>{r.lab ? lab(r.lab) : "-"} · {r.pixels}px</td>
            </tr>
          ))}
        </tbody>
      </table>
      {d.notes.map((n) => <p key={n} className="small muted">{n}</p>)}
      <p className="small muted">Ambang ada di src/rules/thresholds.ts dan src/rules/fitRules.ts. Semuanya nilai awal untuk dikalibrasi.</p>
    </section>
  );
}
