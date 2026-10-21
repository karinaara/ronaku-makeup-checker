import { useMemo, useState } from "react";
import { FACE_SHAPE_LABEL, type FaceShapeKey } from "../color/skin";
import type { Look, LipFinish } from "../render/tryon";
import { scoreFit } from "../rules/fit";
import { buildPalette } from "../rules/palette";
import { BLUSH_BY_SHAPE, BLUSH_STYLES, DEFAULT_BLUSH_PARAMS, type BlushStyleId } from "../rules/positionRules";
import type { Analysis, FitLabel, Swatch } from "../types";
import { FitBadge, FitBlock, Slider, Toast, TryOnCanvas, useToast } from "./components";
import { DebugPanel } from "./DebugPanel";

type Tab = "warna" | "posisi";
type Product = "lipstik" | "blush";
const FINISH: { id: LipFinish; label: string }[] = [
  { id: "matte", label: "Matte" },
  { id: "satin", label: "Satin" },
  { id: "glossy", label: "Glossy" },
];
const SHAPES = Object.keys(FACE_SHAPE_LABEL) as FaceShapeKey[];

function saveFeedback(entry: object) {
  // Hanya parameter (produk, warna, label, suara). Tidak ada gambar atau data wajah.
  try {
    const key = "ronaku.feedback";
    const list = JSON.parse(localStorage.getItem(key) ?? "[]");
    list.push({ ...entry, t: Date.now() });
    localStorage.setItem(key, JSON.stringify(list.slice(-200)));
  } catch {
    /* penyimpanan tidak tersedia: abaikan */
  }
}

export function TryOnScreen({ a, debug }: { a: Analysis; debug: boolean }) {
  const p = a.profile;
  const pal = useMemo(() => buildPalette(p), [p]);
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("warna");
  const [product, setProduct] = useState<Product>("lipstik");
  const [lip, setLip] = useState<Swatch>(pal.lipstik[0]);
  const [blush, setBlush] = useState<Swatch>(pal.blush[0]);
  const [finish, setFinish] = useState<LipFinish>("satin");
  const [lipInt, setLipInt] = useState(0.8);
  const [styleId, setStyleId] = useState<BlushStyleId>("apple");
  const [params, setParams] = useState(DEFAULT_BLUSH_PARAMS);
  const [shape, setShape] = useState<FaceShapeKey>(p.faceShape.key);
  const [hijab, setHijab] = useState(false);
  const [split, setSplit] = useState(50);
  const [compare, setCompare] = useState(false);
  const [picked, setPicked] = useState<Swatch[]>([]);

  const styles = BLUSH_STYLES.filter((s) => !(hijab && s.tergantungPelipis));
  const activeStyle = styles.some((s) => s.id === styleId) ? styleId : "apple";

  const look: Look = useMemo(
    () => ({
      lip: { hex: lip.hex, finish, intensity: lipInt },
      blush: { hex: blush.hex, style: activeStyle, tinggi: params.tinggi, sudut: params.sudut, ukuran: params.ukuran, intensitas: params.intensitas },
    }),
    [lip, blush, finish, lipInt, activeStyle, params],
  );
  const before: Look = useMemo(() => ({}), []);

  const current = product === "lipstik" ? lip : blush;
  const options: Swatch[] = product === "lipstik" ? pal.lipstik : pal.blush;
  const fit = useMemo(() => scoreFit(p, current.hex, product === "lipstik" ? "lip" : "blush"), [p, current, product]);
  const styleFit = BLUSH_BY_SHAPE[shape][activeStyle];

  const setCurrent = (s: Swatch) => (product === "lipstik" ? setLip(s) : setBlush(s));
  const toggleCompare = (s: Swatch) =>
    setPicked((list) => (list.some((x) => x.hex === s.hex) ? list.filter((x) => x.hex !== s.hex) : list.length >= 4 ? list : [...list, s]));
  const onChip = (s: Swatch) => (compare ? toggleCompare(s) : setCurrent(s));
  const vote = (v: "suka" | "kurang") => {
    saveFeedback({ produk: product, hex: current.hex, label: fit.label, suara: v, finish: product === "lipstik" ? finish : activeStyle });
    toast.show("Terima kasih, masukanmu membantu menyetel aturan.");
  };
  const lookFor = (s: Swatch): Look => (product === "lipstik" ? { ...look, lip: { ...look.lip!, hex: s.hex } } : { ...look, blush: { ...look.blush!, hex: s.hex } });

  return (
    <>
      <section className="stack">
        <h1>Coba di wajahmu</h1>
        <p className="muted">Geser garis putih untuk membandingkan sebelum dan sesudah.</p>
      </section>

      {compare && tab === "warna" ? (
        <section className="card">
          <div className="row between">
            <h2>Bandingkan {product}</h2>
            <small className="small">{picked.length}/4 dipilih</small>
          </div>
          {picked.length === 0 ? (
            <p className="note">Pilih 2 sampai 4 warna di bawah untuk melihatnya berdampingan.</p>
          ) : (
            <div className="grid2">
              {picked.map((s) => {
                const f = scoreFit(p, s.hex, product === "lipstik" ? "lip" : "blush");
                return (
                  <div className="cell" key={s.hex}>
                    <TryOnCanvas analysis={a} look={lookFor(s)} maxW={360} label={`Wajah dengan ${s.nama}`} />
                    <span className="small" style={{ fontWeight: 700 }}>{s.nama}</span>
                    <FitBadge label={f.label} />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <div className="stage">
          <TryOnCanvas analysis={a} look={look} label="Wajahmu dengan makeup" />
          <div className="layer" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
            <TryOnCanvas analysis={a} look={before} label="Wajahmu tanpa makeup" />
          </div>
          <span className="tag" style={{ left: 10 }}>Sebelum</span>
          <span className="tag" style={{ right: 10 }}>Sesudah</span>
          <div className="divider" style={{ left: `${split}%` }} />
          <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} aria-label="Geser untuk membandingkan sebelum dan sesudah" />
        </div>
      )}

      <div className="seg" role="tablist" aria-label="Jenis pengaturan">
        <button role="tab" aria-selected={tab === "warna"} onClick={() => setTab("warna")}>Warna</button>
        <button role="tab" aria-selected={tab === "posisi"} onClick={() => setTab("posisi")}>Posisi</button>
      </div>

      {tab === "warna" ? (
        <section className="card">
          <div className="seg" aria-label="Produk">
            <button aria-pressed={product === "lipstik"} onClick={() => setProduct("lipstik")}>Lipstik</button>
            <button aria-pressed={product === "blush"} onClick={() => setProduct("blush")}>Blush</button>
            <button disabled title="Segera hadir">Eyeshadow</button>
          </div>

          <div className="chips" role="group" aria-label="Pilih warna">
            {options.map((s) => {
              const on = compare ? picked.some((x) => x.hex === s.hex) : current.hex === s.hex;
              return (
                <button key={s.hex} className="chip" aria-pressed={on} onClick={() => onChip(s)}>
                  <span className="dot" style={{ background: s.hex }} />
                  {s.nama}
                </button>
              );
            })}
          </div>

          <div className="row">
            <label className="row" style={{ cursor: "pointer" }}>
              <input
                type="color"
                value={current.hex.toLowerCase()}
                onChange={(e) => {
                  const own = { nama: "Warna sendiri", hex: e.target.value.toUpperCase() };
                  if (compare) toggleCompare(own);
                  else setCurrent(own);
                }}
                aria-label="Pilih warna sendiri"
              />
              <span className="small" style={{ fontWeight: 600 }}>Warna sendiri</span>
            </label>
            <label className="check" style={{ marginLeft: "auto" }}>
              <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
              Bandingkan
            </label>
          </div>

          {product === "lipstik" && (
            <>
              <div className="seg" aria-label="Finish bibir">
                {FINISH.map((f) => (
                  <button key={f.id} aria-pressed={finish === f.id} onClick={() => setFinish(f.id)}>{f.label}</button>
                ))}
              </div>
              <Slider label="Intensitas" value={Math.round(lipInt * 100)} min={20} max={100} step={5} display={`${Math.round(lipInt * 100)}%`} onChange={(v) => setLipInt(v / 100)} />
            </>
          )}
          {product === "blush" && (
            <Slider label="Intensitas" value={Math.round(params.intensitas * 100)} min={10} max={100} step={5} display={`${Math.round(params.intensitas * 100)}%`} onChange={(v) => setParams((s) => ({ ...s, intensitas: v / 100 }))} />
          )}

          <div className="stack">
            <h3>{current.nama} <span className="muted small">{current.hex}</span></h3>
            <FitBlock fit={fit} debug={debug} />
            <div className="row">
              <button className="btn ghost small" onClick={() => vote("suka")}>👍 Suka hasilnya</button>
              <button className="btn ghost small" onClick={() => vote("kurang")}>👎 Kurang suka</button>
            </div>
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>Posisi blush</h2>
          <p>
            Wajahmu <b>cenderung {FACE_SHAPE_LABEL[shape]}</b> <span className="muted small">(perkiraan dari foto)</span>
          </p>
          <div className="field">
            <label htmlFor="shape"><span>Kurang pas? Koreksi bentuk wajah</span></label>
            <select id="shape" value={shape} onChange={(e) => setShape(e.target.value as FaceShapeKey)}>
              {SHAPES.map((k) => <option key={k} value={k}>{FACE_SHAPE_LABEL[k][0].toUpperCase() + FACE_SHAPE_LABEL[k].slice(1)}</option>)}
            </select>
          </div>
          <label className="check">
            <input type="checkbox" checked={hijab} onChange={(e) => setHijab(e.target.checked)} />
            Aku berhijab
          </label>
          {hijab && <p className="note">Gaya yang naik ke pelipis disembunyikan dulu sampai aturan untuk pengguna hijab selesai divalidasi.</p>}

          <div className="chips" role="group" aria-label="Gaya blush">
            {styles.map((s) => {
              const f: FitLabel = BLUSH_BY_SHAPE[shape][s.id].label;
              return (
                <button key={s.id} className="chip" aria-pressed={activeStyle === s.id} onClick={() => { setStyleId(s.id); setParams((x) => ({ ...x, tinggi: 0, sudut: 0, ukuran: 1 })); }}>
                  {s.nama} · {f}
                </button>
              );
            })}
          </div>
          <div className="stack">
            <div className="row"><FitBadge label={styleFit.label} /><small className="small">{BLUSH_STYLES.find((s) => s.id === activeStyle)?.deskripsi}</small></div>
            <ul className="reasons"><li>{styleFit.alasan}</li></ul>
          </div>

          <Slider label="Tinggi" value={Math.round(-params.tinggi * 100)} min={-25} max={25} step={1} display={params.tinggi < -0.005 ? "lebih tinggi" : params.tinggi > 0.005 ? "lebih rendah" : "bawaan"} onChange={(v) => setParams((s) => ({ ...s, tinggi: -v / 100 }))} />
          <Slider label="Sudut" value={params.sudut} min={-20} max={20} step={1} display={`${params.sudut > 0 ? "+" : ""}${params.sudut}°`} onChange={(v) => setParams((s) => ({ ...s, sudut: v }))} />
          <Slider label="Ukuran" value={Math.round(params.ukuran * 100)} min={60} max={150} step={5} display={`${Math.round(params.ukuran * 100)}%`} onChange={(v) => setParams((s) => ({ ...s, ukuran: v / 100 }))} />
          <Slider label="Intensitas" value={Math.round(params.intensitas * 100)} min={10} max={100} step={5} display={`${Math.round(params.intensitas * 100)}%`} onChange={(v) => setParams((s) => ({ ...s, intensitas: v / 100 }))} />
          <button className="btn ghost small" onClick={() => setParams(DEFAULT_BLUSH_PARAMS)}>Atur ulang</button>
          <p className="small muted">Ini saran, bukan aturan. Bentuk wajah dan makeup itu subjektif, pakai yang menurutmu paling nyaman. Highlighter, alis, dan eyeshadow akan menyusul.</p>
        </section>
      )}

      {debug && <DebugPanel a={a} />}
      <Toast text={toast.text} />
    </>
  );
}
