import { useState } from "react";
import type { Analysis } from "../types";
import { NavBar } from "./components";
import { FoundationScreen } from "./FoundationScreen";
import { PaletteScreen } from "./PaletteScreen";
import { ProfileScreen } from "./ProfileScreen";
import { SelfieScreen } from "./SelfieScreen";
import { TryOnScreen } from "./TryOnScreen";

export type Screen = "selfie" | "profil" | "tryon" | "foundation" | "palet";

export function App() {
  const [screen, setScreen] = useState<Screen>("selfie");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [debug, setDebug] = useState(() => new URLSearchParams(location.search).has("debug"));

  const retake = () => {
    setAnalysis(null); // foto hanya di memori; dibuang saat foto ulang
    setScreen("selfie");
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          Rona<span>.ku</span>
        </div>
        <label className="check small" style={{ minHeight: 44 }}>
          <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
          Mode debug
        </label>
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
