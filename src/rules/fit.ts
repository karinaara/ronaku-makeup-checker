// Penilaian kecocokan berbasis aturan (tanpa LLM, tanpa persentase di UI).
import { chroma, hexToLab, hueAngle } from "../color/convert";
import type { FitLabel, FitResult, SkinProfile } from "../types";
import { t } from "../i18n";
import { FIT_RULES, type Context, type Product } from "./fitRules";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const CONTEXT_TEXT: Record<Context, string> = {
  natural: "tampilan sehari-hari",
  kantor: "tampilan kantor",
  kondangan: "tampilan kondangan",
  glam: "tampilan glam",
};

/** Selisih sudut bertanda -180..180 */
const angleDiff = (a: number, b: number) => ((a - b + 540) % 360) - 180;

export function scoreFit(
  profile: SkinProfile,
  hex: string,
  product: Product,
  context: Context = FIT_RULES.defaultContext,
): FitResult {
  const R = FIT_RULES;
  const lab = hexToLab(hex);
  const hue = hueAngle(lab);
  const c = chroma(lab);
  const s = profile.undertone.score;

  // 1) Harmoni undertone
  const center = lerp(R.hueCenter.cool, R.hueCenter.warm, s);
  const tol = R.hueTolerance.base + R.hueTolerance.neutralBonus * (1 - Math.abs(2 * s - 1));
  const diff = angleDiff(hue, center);
  const d = Math.abs(diff);
  const hueScore = d <= tol / 2 ? 1 : clamp01(1 - (d - tol / 2) / tol);
  const harmoni = lerp(R.lowChroma.safeScore, hueScore, clamp01(c / R.lowChroma.below));

  // 2) Kontras terang-gelap terhadap kulit
  const dL = Math.abs(profile.skinLab.L - lab.L);
  const target = R.contrastTarget[product][profile.contrast.level];
  const kontras = clamp01(1 - Math.abs(dL - target) / R.contrastTolerance);

  // 3) Intensitas vs konteks, digeser menurut depth
  const [lo0, hi0] = R.chromaRange[product][context];
  const { terangMaxLevel, gelapMinLevel, amount } = R.depthChromaShift;
  const lvl = profile.depth.nearest;
  const shift = lvl <= terangMaxLevel ? -amount : lvl >= gelapMinLevel ? amount : 0;
  const lo = lo0 + shift;
  const hi = hi0 + shift;
  const out = c < lo ? lo - c : c > hi ? c - hi : 0;
  const intensitas = clamp01(1 - out / R.chromaTolerance);

  const total = R.weights.harmoni * harmoni + R.weights.kontras * kontras + R.weights.intensitas * intensitas;
  const label: FitLabel =
    total >= R.labelAt.selaras ? "Selaras" : total >= R.labelAt.bisaDicoba ? "Bisa dicoba" : "Kurang cocok";

  const ut = profile.undertone.key === "warm" ? "warm" : profile.undertone.key === "cool" ? "cool" : "netral";
  const texts = {
    harmoni:
      harmoni >= 0.75
        ? ut === "warm"
          ? t("Nuansanya hangat, senada dengan undertone kulitmu yang cenderung warm.")
          : ut === "cool"
            ? t("Nuansanya dingin, senada dengan undertone kulitmu yang cenderung cool.")
            : t("Nuansanya seimbang dan aman untuk undertone kulitmu yang cenderung netral.")
        : harmoni >= 0.45
          ? t("Nuansanya cukup dekat dengan undertone kulitmu, tapi bukan yang paling selaras.")
          : diff > 0
            ? t("Nuansanya terlalu hangat untuk undertone kulitmu, bisa terlihat kurang menyatu.")
            : t("Nuansanya terlalu dingin untuk undertone kulitmu, bisa membuat wajah terlihat pucat."),
    kontras:
      kontras >= 0.75
        ? t("Terang-gelapnya pas dengan kontras alami wajahmu yang {level}.", { level: t(profile.contrast.level) })
        : dL > target
          ? t("Agak terlalu gelap atau tegas dibanding kulitmu. Wajahmu berkontras {level}, jadi warna yang lebih senada akan terasa lebih natural.", { level: t(profile.contrast.level) })
          : t("Agak terlalu samar dibanding kulitmu. Wajahmu berkontras {level}, jadi warna ini bisa hilang di wajah.", { level: t(profile.contrast.level) }),
    intensitas:
      intensitas >= 0.75
        ? t("Kepekatannya pas untuk {konteks}.", { konteks: t(CONTEXT_TEXT[context]) })
        : c > hi
          ? t("Cukup pekat untuk {konteks}. Pakai tipis-tipis kalau mau lebih natural.", { konteks: t(CONTEXT_TEXT[context]) })
          : t("Agak lembut untuk {konteks}, hasilnya mungkin kurang terlihat.", { konteks: t(CONTEXT_TEXT[context]) }),
  };
  const scored = (["harmoni", "kontras", "intensitas"] as const)
    .map((k) => ({ k, v: { harmoni, kontras, intensitas }[k] }))
    .sort((a, b) => b.v - a.v);
  const reasons =
    label === "Selaras"
      ? [texts[scored[0].k], texts[scored[1].k]]
      : [texts[scored[2].k], texts[scored[0].k]];

  return {
    label,
    reasons,
    confidence: profile.confidence.level,
    debug: { harmoni, kontras, intensitas, total, hue, chroma: c },
  };
}
