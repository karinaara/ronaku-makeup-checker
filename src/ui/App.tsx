import { useState } from "react";
import { LangProvider, t, useLang, type Lang } from "../i18n";
import type { Analysis } from "../types";
import { NavBar } from "./components";
import { FoundationScreen } from "./FoundationScreen";
import { PaletteScreen } from "./PaletteScreen";
import { ProfileScreen } from "./ProfileScreen";
import { SelfieScreen } from "./SelfieScreen";
import { TryOnScreen } from "./TryOnScreen";

export type Screen = "selfie" | "profil" | "tryon" | "foundation" | "palet";

export function App() {
  return (
    <LangProvider>
      <Shell />
    </LangProvider>
  );
}

function LangSwitch() {
  const { lang, setLang } = useLang();
  const opts: { id: Lang; label: string; name: string }[] = [
    { id: "id", label: "ID", name: "Bahasa Indonesia" },
    { id: "en", label: "EN", name: "English" },
  ];
  return (
    <div className="seg lang" role="group" aria-label={t("Bahasa")}>
      {opts.map((o) => (
        <button key={o.id} aria-pressed={lang === o.id} aria-label={o.name} lang={o.id} onClick={() => setLang(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Shell() {
  const { lang } = useLang();
  const [screen, setScreen] = useState<Screen>("selfie");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [debug, setDebug] = useState(() => new URLSearchParams(location.search).has("debug"));

  const retake = () => {
    setAnalysis(null); // foto hanya di memori; dibuang saat foto ulang
    setScreen("selfie");
  };

  // key={lang}: layar dibangun ulang saat bahasa berganti supaya semua teks dan hasil aturan dihitung ulang.
  // State utama (foto/analisis dan layar aktif) ada di Shell, jadi tetap terjaga.
  return (
    <div className="app" key={lang}>
      <header className="topbar">
        <div className="logo">
          Rona<span>.ku</span>
        </div>
        <div className="row" style={{ gap: 12 }}>
          <label className="check small" style={{ minHeight: 44 }}>
            <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
            {t("Mode debug")}
          </label>
          <LangSwitch />
        </div>
      </header>
      <main className="main">
        {screen === "selfie" || !analysis ? (
          <SelfieScreen
            onDone={(a) => {
              setAnalysis(a);
              setScreen("profil");
            }}
          />
        ) : screen === "profil" ? (
          <ProfileScreen a={analysis} debug={debug} onGo={setScreen} onRetake={retake} />
        ) : screen === "tryon" ? (
          <TryOnScreen a={analysis} debug={debug} />
        ) : screen === "foundation" ? (
          <FoundationScreen a={analysis} onRetake={retake} />
        ) : (
          <PaletteScreen a={analysis} />
        )}
      </main>
      {analysis && screen !== "selfie" && <NavBar current={screen} onGo={setScreen} />}
    </div>
  );
}
