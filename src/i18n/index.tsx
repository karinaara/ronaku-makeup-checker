// Dua bahasa (Indonesia, English). Teks Indonesia adalah sumber; t() mencari terjemahannya di kamus EN.
// Teks yang belum ada di kamus tampil apa adanya (Indonesia), dan tes memeriksa agar tidak ada yang terlewat.
import { createContext, useContext, useState, type ReactNode } from "react";
import { EN } from "./en";

export type Lang = "id" | "en";
const KEY = "ronaku.lang";

let current: Lang = "id";

export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "id" || stored === "en") return stored;
  } catch {
    /* penyimpanan tidak tersedia */
  }
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("id") ? "id" : "en";
}

export const getLang = () => current;
export const setCurrentLang = (l: Lang) => {
  current = l;
  if (typeof document !== "undefined") {
    document.documentElement.lang = l;
    document.title = t("Rona.ku — Temukan ronamu");
  }
};

/** Terjemahkan teks sumber (Indonesia). Parameter `{nama}` diisi dari `params`. */
export function t(text: string, params?: Record<string, string | number>): string {
  const s = current === "en" ? (EN[text] ?? text) : text;
  return params ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m)) : s;
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "id", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const l = detectLang();
    setCurrentLang(l); // sinkron, sebelum anak-anaknya dirender
    return l;
  });
  const setLang = (l: Lang) => {
    setCurrentLang(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* abaikan */
    }
    setLangState(l);
  };
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
