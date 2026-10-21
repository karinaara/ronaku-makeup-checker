import { useMemo } from "react";
import { MONK_HEX } from "../data/monk";
import { buildPalette } from "../rules/palette";
import type { Analysis } from "../types";
import { ConfidenceBadge, FitBadge } from "./components";
import { DebugPanel } from "./DebugPanel";
import type { Screen } from "./App";

export function ProfileScreen({ a, debug, onGo, onRetake }: { a: Analysis; debug: boolean; onGo: (s: Screen) => void; onRetake: () => void }) {
  const p = a.profile;
  const pal = useMemo(() => buildPalette(p), [p]);
  const [d0, d1] = p.depth.levels;
  const lowConf = p.confidence.level === "Rendah";
  const contrastText = { rendah: "Warna kulit, bibir, dan alismu cukup senada, cocok dengan warna lembut.", sedang: "Ada perbedaan terang-gelap yang seimbang, fleksibel untuk banyak warna.", tinggi: "Perbedaan terang-gelap di wajahmu tegas, cocok dengan warna yang berani." }[p.contrast.level];

  return (
    <>
      <section className="stack">
        <h1>Profil warnamu</h1>
        <p className="muted">Ini estimasi dari fotomu, bukan angka pasti.</p>
      </section>

      <section className="card">
        <div className="row between">
          <ConfidenceBadge level={p.confidence.level} />
          <span className="row">
            <span className="dot" style={{ background: p.skinHex }} aria-hidden />
            <span className="small"><b>{p.skinHex}</b><br /><span className="muted">warna kulit (estimasi)</span></span>
          </span>
        </div>
        {p.confidence.reasons.length > 0 && (
          <>
            <p className="small muted">{lowConf ? "Hasilnya kurang bisa diandalkan karena:" : "Yang bisa memengaruhi hasil:"}</p>
            <ul className="reasons">{p.confidence.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </>
        )}
        {lowConf && <button className="btn primary block" onClick={onRetake}>Foto ulang</button>}
        {!lowConf && p.confidence.level === "Sedang" && <button className="btn block" onClick={onRetake}>Foto ulang untuk hasil lebih pasti</button>}
      </section>

      <section className="card">
        <h2>Kedalaman kulit: level {d0}–{d1}</h2>
        <div className="scale" role="img" aria-label={`Skala 1 sampai 10, level ${d0} dan ${d1} terpilih`}>
          {MONK_HEX.map((hex, i) => (
            <div key={hex} className={`s${i + 1 === d0 || i + 1 === d1 ? " on" : ""}`} style={{ background: hex, color: i < 5 ? "#1e1b22" : "#fff" }}>{i + 1}</div>
          ))}
        </div>
        <p className="small muted">1 = sangat terang, 10 = sangat gelap. Kisarannya dua level karena kulit ada di antara dua tingkat.</p>
      </section>

      <section className="card">
        <h2>Nuansa kulit: {p.undertone.label.toLowerCase()}</h2>
        <div className="track" role="img" aria-label={`Posisi nuansa kulit: ${p.undertone.label}`}>
          <span className="pin" style={{ left: `${Math.round(p.undertone.score * 90 + 5)}%` }} />
        </div>
        <div className="scale-lab"><span>Cool (kemerahan/kebiruan)</span><span>Warm (keemasan)</span></div>
        <p className="small muted">Nuansa halus di bawah warna kulit (undertone). Menentukan apakah warna peach atau berry terlihat menyatu denganmu.</p>
      </section>

      <section className="card">
        <h2>Kontras alami: {p.contrast.level}</h2>
        <div className="steps" aria-hidden>
          {(["rendah", "sedang", "tinggi"] as const).map((k) => <div key={k} className={k === p.contrast.level ? "on" : ""}>{k[0].toUpperCase() + k.slice(1)}</div>)}
        </div>
        <p className="small muted">{contrastText}</p>
      </section>

      <section className="card">
        <h2>Warna yang kemungkinan cocok</h2>
        <h3 className="small muted">Lipstik</h3>
        <div className="row">{pal.lipstik.slice(0, 4).map((c) => (
          <span key={c.hex} className="stack" style={{ width: 76, gap: 4 }}>
            <span className="dot sq" style={{ width: "100%", height: 40, background: c.hex }} />
            <span className="small" style={{ fontWeight: 700, lineHeight: 1.2 }}>{c.nama}</span>
            <FitBadge label={c.fit.label} />
          </span>
        ))}</div>
        <h3 className="small muted">Blush</h3>
        <div className="row">{pal.blush.slice(0, 4).map((c) => (
          <span key={c.hex} className="stack" style={{ width: 76, gap: 4 }}>
            <span className="dot sq" style={{ width: "100%", height: 40, background: c.hex }} />
            <span className="small" style={{ fontWeight: 700, lineHeight: 1.2 }}>{c.nama}</span>
            <FitBadge label={c.fit.label} />
          </span>
        ))}</div>
        <button className="btn primary block" onClick={() => onGo("tryon")}>Coba di wajahku</button>
        <button className="btn block" onClick={() => onGo("palet")}>Lihat palet lengkap</button>
      </section>

      {debug && <DebugPanel a={a} />}
    </>
  );
}
