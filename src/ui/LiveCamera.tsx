import { useEffect, useRef, useState } from "react";
import type { Pt } from "../types";
import { AnalysisError, sampleRegionDefs, validateFace } from "../vision/analyze";
import { contours, pick } from "../vision/contours";
import { getLandmarker } from "../vision/landmarker";

type Status = { ok: boolean; text: string };
const FRAME_MS = 120; // ~8 fps cukup untuk panduan, hemat baterai
const HOLD_MS = 1000; // posisi harus pas selama ini sebelum hitung mundur mulai
const COUNTDOWN_FROM = 3;

/**
 * Kamera dengan deteksi wajah langsung. Area kulit yang akan dibaca digambar di atas wajah,
 * tombol ambil foto aktif hanya saat posisi wajah memenuhi syarat. Semua di perangkat; tidak ada frame yang disimpan.
 */
export function LiveCamera({ onCapture, onCancel, onError }: { onCapture: (c: HTMLCanvasElement) => void; onCancel: () => void; onError: (msg: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const okRef = useRef(false);
  const [status, setStatus] = useState<Status>({ ok: false, text: "Memuat deteksi wajah…" });
  const [live, setLive] = useState(false); // deteksi benar-benar berjalan (bukan mode cadangan)
  const [auto, setAuto] = useState(true);
  const [count, setCount] = useState<number | null>(null);
  const snapRef = useRef<() => void>(() => {});

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;
    let last = 0;
    let lastText = "";

    const report = (s: Status) => {
      okRef.current = s.ok;
      if (s.text !== lastText) {
        lastText = s.text;
        setStatus(s);
      }
    };

    const draw = (pts: Pt[] | null, vw: number, vh: number, ok: boolean) => {
      const v = video.current;
      const c = overlay.current;
      if (!v || !c) return;
      const dpr = window.devicePixelRatio || 1;
      const bw = v.clientWidth, bh = v.clientHeight;
      if (c.width !== Math.round(bw * dpr) || c.height !== Math.round(bh * dpr)) {
        c.width = Math.round(bw * dpr);
        c.height = Math.round(bh * dpr);
      }
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, bw, bh);
      if (!pts) return;
      // object-fit: cover + cermin horizontal (sama dengan tampilan video)
      const s = Math.max(bw / vw, bh / vh);
      const ox = (bw - vw * s) / 2, oy = (bh - vh * s) / 2;
      const map = (p: Pt): Pt => ({ x: bw - (ox + p.x * s), y: oy + p.y * s });
      const path = (poly: Pt[]) => {
        ctx.beginPath();
        poly.map(map).forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
      };
      path(pick(pts, contours().faceOval));
      ctx.lineWidth = 3;
      ctx.strokeStyle = ok ? "rgba(255,255,255,.9)" : "rgba(255,170,90,.95)";
      ctx.stroke();
      if (ok) {
        ctx.fillStyle = "rgba(31,163,122,.30)";
        ctx.strokeStyle = "#1fa37a";
        ctx.lineWidth = 2;
        for (const r of sampleRegionDefs(pts)) {
          path(r.polygon);
          ctx.fill();
          ctx.stroke();
        }
      }
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const v = video.current;
      if (!v || v.readyState < 2 || t - last < FRAME_MS || !landmarker) return;
      last = t;
      const vw = v.videoWidth, vh = v.videoHeight;
      const raw = landmarker.detect(v).faceLandmarks?.[0];
      if (!raw) {
        draw(null, vw, vh, false);
        report({ ok: false, text: "Wajah belum terdeteksi. Hadapkan wajah ke kamera." });
        return;
      }
      const pts = raw.map((p) => ({ x: p.x * vw, y: p.y * vh }));
      try {
        validateFace(pts, vw, vh);
        draw(pts, vw, vh, true);
        report({ ok: true, text: "Posisi pas. Area hijau adalah kulit yang akan dibaca." });
      } catch (e) {
        draw(pts, vw, vh, false);
        report({ ok: false, text: e instanceof AnalysisError ? e.message.replace(" dan ambil foto lagi", "") : "Atur posisi wajahmu." });
      }
    };

    let landmarker: Awaited<ReturnType<typeof getLandmarker>> | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      } catch {
        if (!cancelled) onError("Izin kamera ditolak atau kamera tidak ditemukan. Kamu bisa mengunggah foto.");
        return;
      }
      if (cancelled) return stream.getTracks().forEach((t) => t.stop());
      if (video.current) {
        video.current.srcObject = stream;
        void video.current.play();
      }
      try {
        landmarker = await getLandmarker();
      } catch {
        if (!cancelled) report({ ok: true, text: "Deteksi langsung tidak tersedia. Kamu tetap bisa mengambil foto." });
        return;
      }
      if (!cancelled) {
        setLive(true);
        raf = requestAnimationFrame(loop);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snap = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0); // frame asli (tidak dicermin)
    onCapture(c);
  };
  snapRef.current = snap;

  // Hitung mundur otomatis: posisi pas selama 1 detik -> 3, 2, 1 -> foto. Batal otomatis jika posisi bergeser.
  useEffect(() => {
    if (!status.ok || !auto || !live) return;
    let n = COUNTDOWN_FROM;
    let iv = 0;
    const start = window.setTimeout(() => {
      setCount(n);
      iv = window.setInterval(() => {
        n -= 1;
        if (n <= 0) {
          window.clearInterval(iv);
          setCount(null);
          if (okRef.current) snapRef.current(); // pastikan posisi masih pas pada detik terakhir
        } else setCount(n);
      }, 1000);
    }, HOLD_MS);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(iv);
      setCount(null);
    };
  }, [status.ok, auto, live]);

  return (
    <div className="stack">
      <div className="camera">
        <video ref={video} playsInline muted aria-label="Pratinjau kamera" />
        <canvas ref={overlay} className="guide" aria-hidden />
        {count !== null && <div className="countdown" aria-hidden>{count}</div>}
      </div>
      <div className={status.ok ? "note" : "alert"} role="status" aria-live="polite" style={{ fontWeight: 600 }}>
        {count !== null ? `Tahan posisimu… foto diambil dalam ${count}` : status.text}
      </div>
      <label className="check">
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
        Ambil foto otomatis (hitung mundur 3 detik)
      </label>
      <div className="row">
        <button className="btn primary" style={{ flex: 1 }} onClick={snap} disabled={!status.ok}>Ambil foto sekarang</button>
        <button className="btn ghost" onClick={onCancel}>Batal</button>
      </div>
    </div>
  );
}
