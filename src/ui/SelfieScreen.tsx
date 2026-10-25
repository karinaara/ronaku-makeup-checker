import { useRef, useState } from "react";
import type { Analysis } from "../types";
import { AnalysisError, analyzeImage } from "../vision/analyze";
import { LiveCamera } from "./LiveCamera";
import { PrivacyPolicy } from "./PrivacyPolicy";

type Mode = "idle" | "camera" | "busy";

export function SelfieScreen({ onDone }: { onDone: (a: Analysis) => void }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const run = async (src: CanvasImageSource, w: number, h: number) => {
    setMode("busy");
    setError(null);
    try {
      onDone(await analyzeImage(src, w, h));
    } catch (e) {
      setError(e instanceof AnalysisError ? e.message : "Terjadi masalah saat membaca foto. Coba foto lain.");
      setMode("idle");
    }
  };

  const openCamera = () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Kamera tidak tersedia di browser ini. Kamu bisa mengunggah foto.");
      return;
    }
    setMode("camera");
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const bmp = await createImageBitmap(f, { imageOrientation: "from-image" });
      await run(bmp, bmp.width, bmp.height);
      bmp.close();
    } catch {
      setError("File tidak bisa dibuka sebagai gambar. Coba format JPG atau PNG.");
    }
    if (file.current) file.current.value = "";
  };

  if (mode === "busy")
    return (
      <div className="card" role="status" aria-live="polite" style={{ alignItems: "center", padding: 40 }}>
        <div className="spinner" />
        <h2>Membaca warna kulitmu…</h2>
        <p className="muted small">Diproses di perangkatmu. Pertama kali bisa agak lama karena model deteksi wajah dimuat.</p>
      </div>
    );

  return (
    <>
      <section className="stack">
        <h1>Temukan ronamu.</h1>
        <p className="muted">Dari satu selfie, kami perkirakan warna kulitmu lalu kamu bisa mencoba warna makeup sebelum membeli.</p>
      </section>

      {error && <div className="alert" role="alert">{error}</div>}

      {mode === "camera" ? (
        <LiveCamera
          onCapture={(c) => void run(c, c.width, c.height)}
          onCancel={() => setMode("idle")}
          onError={(msg) => {
            setError(msg);
            setMode("idle");
          }}
        />
      ) : (
        <>
          <div className="card">
            <div className="camera" style={{ background: "var(--accent-soft)" }}>
              <svg viewBox="0 0 300 380" style={{ width: "100%", display: "block" }} aria-hidden>
                <Guide inline />
              </svg>
            </div>
            <ul className="reasons" style={{ color: "var(--text)" }}>
              <li>Kamera mendeteksi wajahmu langsung dan menandai kulit yang dibaca. Tombol foto aktif saat posisimu pas.</li>
              <li>Hadapkan wajah lurus ke kamera, rambut dan hijab tidak menutupi dahi dan pipi.</li>
              <li>Cari cahaya alami (dekat jendela), hindari lampu kuning atau cahaya dari samping.</li>
              <li>Tanpa filter dan tanpa efek beauty. Lebih baik tanpa makeup di pipi dan dahi.</li>
            </ul>
            <button className="btn primary block" onClick={openCamera}>Ambil foto</button>
            <button className="btn block" onClick={() => file.current?.click()}>Unggah foto</button>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          </div>
          <p className="note">🔒 Fotomu diproses di perangkat ini saja. Tidak diunggah, tidak disimpan, dan hilang saat halaman ditutup.</p>
          <PrivacyPolicy />
        </>
      )}
    </>
  );
}

function Guide({ inline }: { inline?: boolean }) {
  const body = (
    <>
      <ellipse cx="150" cy="190" rx="95" ry="130" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="8 7" style={{ mixBlendMode: "normal" }} />
      <g fill="rgba(31,163,122,.28)" stroke="#1fa37a" strokeWidth="2">
        <ellipse cx="150" cy="105" rx="45" ry="14" />
        <ellipse cx="108" cy="195" rx="24" ry="20" />
        <ellipse cx="192" cy="195" rx="24" ry="20" />
        <ellipse cx="112" cy="268" rx="20" ry="15" />
        <ellipse cx="188" cy="268" rx="20" ry="15" />
      </g>
      <text x="150" y="360" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">Area hijau = bagian kulit yang dibaca</text>
    </>
  );
  return inline ? (
    <>
      <rect width="300" height="380" fill="#6b2a55" opacity=".9" />
      {body}
    </>
  ) : (
    <svg className="guide" viewBox="0 0 300 380" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {body}
    </svg>
  );
}
