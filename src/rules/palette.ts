// Palet dihasilkan dari profil user, bukan statis.
import { chroma, hueAngle, labToHex, type Lab } from "../color/convert";
import { ALIS, BLUSH, COLOR_CORRECTOR, EYELINER, EYESHADOW, HIGHLIGHTER, LIPSTIK } from "../data/catalog";
import type { FitResult, SkinProfile, Swatch } from "../types";
import { scoreFit } from "./fit";
import { FOUNDATION_RULES, SKIN_RELATIVE, type Product } from "./fitRules";

export type Ranked = Swatch & { fit: FitResult };

export function rank(catalog: Swatch[], product: Product, profile: SkinProfile): Ranked[] {
  return catalog
    .map((s) => ({ ...s, fit: scoreFit(profile, s.hex, product) }))
    .sort((a, b) => b.fit.debug.total - a.fit.debug.total);
}

export function foundationRange(profile: SkinProfile): Swatch[] {
  const { L, a, b } = profile.skinLab;
  return FOUNDATION_RULES.steps.map((st) => ({
    nama: st.nama,
    hex: labToHex({ L: L + st.dL, a, b: b + FOUNDATION_RULES.dB }),
  }));
}

function relativeToSkin(skin: Lab, items: { nama: string; dL: number; chromaScale: number }[], warmShift: number): Swatch[] {
  const h = (hueAngle(skin) + warmShift) * (Math.PI / 180);
  const c = chroma(skin);
  return items.map((it) => ({
    nama: it.nama,
    hex: labToHex({ L: skin.L + it.dL, a: Math.cos(h) * c * it.chromaScale, b: Math.sin(h) * c * it.chromaScale }),
  }));
}

export type FullPalette = {
  foundation: Swatch[];
  contour: Swatch[];
  bronzer: Swatch[];
  blush: Ranked[];
  highlighter: Swatch[];
  eyeshadow: Ranked[];
  eyeliner: Swatch[];
  alis: Swatch[];
  lipstik: Ranked[];
  corrector: typeof COLOR_CORRECTOR;
};

export function buildPalette(profile: SkinProfile): FullPalette {
  const s = profile.undertone.score;
  const warmShift = (s - 0.5) * 10; // undertone warm sedikit lebih ke oranye
  const hl = [...HIGHLIGHTER].sort((a, b) => (b.hangat ? s : 1 - s) - (a.hangat ? s : 1 - s));
  const darkSkin = profile.depth.nearest >= 7;
  const byDepth = <T extends { lembut: boolean }>(arr: T[]) =>
    [...arr].sort((a, b) => Number(darkSkin ? a.lembut : !a.lembut) - Number(darkSkin ? b.lembut : !b.lembut));
  return {
    foundation: foundationRange(profile),
    contour: relativeToSkin(profile.skinLab, SKIN_RELATIVE.contour, warmShift),
    bronzer: relativeToSkin(profile.skinLab, SKIN_RELATIVE.bronzer, warmShift + 4),
    blush: rank(BLUSH, "blush", profile),
    highlighter: hl,
    eyeshadow: rank(EYESHADOW, "eyeshadow", profile),
    eyeliner: byDepth(EYELINER),
    alis: byDepth(ALIS),
    lipstik: rank(LIPSTIK, "lip", profile),
    corrector: COLOR_CORRECTOR,
  };
}
