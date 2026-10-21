import { useMemo } from "react";
import { foundationRange } from "../rules/palette";
import type { Analysis } from "../types";
import { ConfidenceBadge, SwatchButton, Toast, useToast } from "./components";

export function FoundationScreen({ a, onRetake }: { a: Analysis; onRetake: () => void }) {
  const p = a.profile;
  const range = useMemo(() => foundationRange(p), [p]);
  const toast = useToast();
  return (
    <>
      <section className="stack">
        <h1>Kisaran foundation</h1>
        <p className="muted">Bukan satu shade pasti. Coba empat warna ini di toko, lalu pilih yang paling menyatu di kulitmu.</p>
      </section>

      <section className="card">
        <div className="row between">
          <ConfidenceBadge level={p.confidence.level} />
          <small className="small">Terang → gelap</small>
        </div>
        <div className="strip" role="img" aria-label={`Kisaran foundation dari ${range[0].hex} sampai ${range[3].hex}`}>
          {range.map((s) => <div key={s.nama} style={{ background: s.hex }} />)}
        </div>
        <div className="sw-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {range.map((s) => <SwatchButton key={s.nama} s={s} onCopied={toast.show} />)}
        </div>
        <p className="small muted">Ketuk warna untuk menyalin kodenya. Layar tiap orang menampilkan warna sedikit berbeda, jadi kode ini hanya acuan.</p>
        {p.confidence.level !== "Tinggi" && (
          <>
            <ul className="reasons">{p.confidence.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            <button className="btn primary block" onClick={onRetake}>Foto ulang</button>
          </>
        )}
      </section>

      <section className="card">
        <h2>Tips tes di toko</h2>
        <ol className="reasons">
          <li>Oleskan ketiga shade tengah di rahang, bukan di punggung tangan. Wajah dan tangan sering beda warna.</li>
          <li>Tunggu 5–10 menit. Sebagian foundation berubah warna setelah menyatu dengan kulit.</li>
          <li>Lihat di dekat jendela atau pintu keluar supaya cahayanya alami, bukan lampu toko.</li>
          <li>Pilih yang paling “hilang” di kulit. Kalau ragu antara dua, ambil yang sedikit lebih terang lalu padukan dengan bronzer atau blush.</li>
        </ol>
        <p className="note">Foundation sengaja tidak disimulasikan di wajah karena pratinjau layar tidak cukup akurat untuk menentukan shade.</p>
        <button className="btn block" onClick={onRetake}>Foto ulang</button>
      </section>
      <Toast text={toast.text} />
    </>
  );
}
