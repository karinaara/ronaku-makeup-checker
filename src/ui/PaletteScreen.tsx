import { useMemo, useState, type ReactNode } from "react";
import { t } from "../i18n";
import { buildPalette } from "../rules/palette";
import type { Analysis, Swatch } from "../types";
import { FitBadge, SwatchButton, Toast, useToast } from "./components";
import type { Ranked } from "../rules/palette";

export function PaletteScreen({ a }: { a: Analysis }) {
  const p = a.profile;
  const pal = useMemo(() => buildPalette(p), [p]);
  const toast = useToast();
  const [all, setAll] = useState<Record<string, boolean>>({});

  const Group = ({ id, title, hint, items, top }: { id: string; title: string; hint?: string; items: Swatch[] | Ranked[]; top?: number }) => {
    const expanded = !top || all[id];
    const shown = expanded ? items : items.slice(0, top);
    return (
      <section className="card">
        <div className="stack" style={{ gap: 2 }}>
          <h2>{t(title)}</h2>
          {hint && <p className="small muted">{t(hint)}</p>}
        </div>
        <div className="sw-grid">
          {shown.map((s) => (
            <SwatchButton key={s.nama + s.hex} s={s} onCopied={toast.show} extra={"fit" in s ? <FitBadge label={(s as Ranked).fit.label} /> : null} />
          ))}
        </div>
        {top && items.length > top && (
          <button className="btn ghost small" onClick={() => setAll((v) => ({ ...v, [id]: !v[id] }))}>
            {expanded ? t("Tampilkan lebih sedikit") : t("Lihat semua warna ({n})", { n: items.length })}
          </button>
        )}
      </section>
    );
  };
  const note: ReactNode = <p className="note">{t("Palet disusun dari profil warnamu (estimasi, keyakinan {level}). Ketuk warna untuk menyalin kode, lalu cari yang serupa di toko mana pun.", { level: t(p.confidence.level.toLowerCase()) })}</p>;

  return (
    <>
      <section className="stack">
        <h1>{t("Palet lengkap")}</h1>
        <p className="muted">{t("Semua kelompok warna dalam satu halaman, tanpa merek.")}</p>
      </section>
      {note}
      <Group id="foundation" title="Foundation" hint="Kisaran, bukan satu shade. Terang ke gelap." items={pal.foundation} />
      <Group id="contour" title="Contour" hint="Lebih gelap dari kulit, nuansa cokelat netral." items={pal.contour} />
      <Group id="bronzer" title="Bronzer" hint="Hangat dan sedikit lebih pekat dari kulit." items={pal.bronzer} />
      <Group id="blush" title="Blush" items={pal.blush} top={5} />
      <Group id="highlighter" title="Highlighter" hint="Diurutkan menurut nuansa kulitmu." items={pal.highlighter} />
      <Group id="eyeshadow" title="Eyeshadow" hint="Termasuk warna dingin dan berani, ada di “Lihat semua”." items={pal.eyeshadow} top={5} />
      <Group id="eyeliner" title="Eyeliner" items={pal.eyeliner} />
      <Group id="alis" title="Alis" hint="Pilih yang paling dekat dengan warna rambut alis alamimu." items={pal.alis} />
      <Group id="lipstik" title="Lipstik" hint="Termasuk berry, plum, dan merah di “Lihat semua”." items={pal.lipstik} top={6} />
      <section className="card">
        <h2>{t("Color corrector")}</h2>
        <p className="small muted">{t("Untuk menetralkan masalah warna tertentu sebelum foundation.")}</p>
        <div className="sw-grid">
          {pal.corrector.map((c) => <SwatchButton key={c.hex} s={c} onCopied={toast.show} extra={<span className="small muted">{t(c.guna)}</span>} />)}
        </div>
      </section>
      <Toast text={toast.text} />
    </>
  );
}
