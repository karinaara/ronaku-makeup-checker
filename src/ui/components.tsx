import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Analysis, ConfidenceLevel, FitLabel, FitResult, Swatch } from "../types";
import { renderLook, type Look } from "../render/tryon";

export function FitBadge({ label }: { label: FitLabel }) {
  const cls = label === "Selaras" ? "ok" : label === "Bisa dicoba" ? "mid" : "bad";
  const mark = label === "Selaras" ? "✓" : label === "Bisa dicoba" ? "~" : "✕";
  return (
    <span className={`badge ${cls}`}>
      <span aria-hidden>{mark}</span>
      {label}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const cls = level === "Tinggi" ? "ok" : level === "Sedang" ? "mid" : "bad";
  return <span className={`badge ${cls}`}>Keyakinan {level.toLowerCase()}</span>;
}

export function FitBlock({ fit, debug }: { fit: FitResult; debug?: boolean }) {
  return (
    <div className="stack" aria-live="polite">
      <div className="row">
        <FitBadge label={fit.label} />
        <small className="small">estimasi, keyakinan {fit.confidence.toLowerCase()}</small>
      </div>
      <ul className="reasons">
        {fit.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {debug && (
        <small className="debug">
          harmoni {fit.debug.harmoni.toFixed(2)} · kontras {fit.debug.kontras.toFixed(2)} · intensitas{" "}
          {fit.debug.intensitas.toFixed(2)} · total {fit.debug.total.toFixed(2)} · hue {fit.debug.hue.toFixed(0)}° · C*{" "}
          {fit.debug.chroma.toFixed(0)}
        </small>
      )}
    </div>
  );
}

export function Toast({ text }: { text: string | null }) {
  return text ? (
    <div className="toast" role="status">
      {text}
    </div>
  ) : null;
}

export function useToast() {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<number>(0);
  const show = (t: string) => {
    setText(t);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setText(null), 1800);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { text, show };
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function SwatchButton({ s, onCopied, extra }: { s: Swatch; onCopied: (msg: string) => void; extra?: ReactNode }) {
  return (
    <button
      className="sw"
      onClick={async () => onCopied((await copyText(s.hex)) ? `${s.hex} disalin` : `Kode: ${s.hex}`)}
      aria-label={`${s.nama}, kode ${s.hex}. Ketuk untuk menyalin`}
    >
      <span className="block" style={{ background: s.hex }} />
      <span className="nm">{s.nama}</span>
      <span className="hx">{s.hex}</span>
      {extra}
    </button>
  );
}

export function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display?: string;
}) {
  const id = `sl-${props.label.replace(/\s/g, "")}`;
  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{props.label}</span>
        <span className="muted">{props.display ?? props.value}</span>
      </label>
      <input id={id} type="range" min={props.min} max={props.max} step={props.step} value={props.value} onChange={(e) => props.onChange(Number(e.target.value))} />
    </div>
  );
}

/** Canvas try-on. Merender ulang hanya saat look berubah. */
export function TryOnCanvas({ analysis, look, maxW = 720, label }: { analysis: Analysis; look: Look; maxW?: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) renderLook(ref.current, analysis.photo, analysis.landmarks, look, maxW);
  }, [analysis, look, maxW]);
  return <canvas ref={ref} role="img" aria-label={label} />;
}

const icons = {
  profil: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8c0-3.3 3.6-6 8-6s8 2.7 8 6" />,
  coba: <path d="M12 3c3 4 6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 3-6 6-10Z" />,
  foundation: <path d="M9 3h6v4H9zM7 7h10v14H7z" />,
  palet: <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.3.2-2.5 1.7-2.5H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5Z" />,
};

export function NavBar({ current, onGo }: { current: string; onGo: (s: "profil" | "tryon" | "foundation" | "palet") => void }) {
  const items = [
    { id: "profil", label: "Profil", icon: icons.profil },
    { id: "tryon", label: "Coba", icon: icons.coba },
    { id: "foundation", label: "Foundation", icon: icons.foundation },
    { id: "palet", label: "Palet", icon: icons.palet },
  ] as const;
  return (
    <nav className="nav" aria-label="Navigasi utama">
      <div className="nav-in">
        {items.map((it) => (
          <button key={it.id} aria-current={current === it.id ? "page" : undefined} onClick={() => onGo(it.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
              {it.icon}
            </svg>
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
