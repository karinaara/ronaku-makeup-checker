import type { Lab } from "./color/convert";
import type { ConfidenceLevel, Confidence, ContrastLevel, Depth, FaceShape, Undertone } from "./color/skin";

export type { ConfidenceLevel };

export type Pt = { x: number; y: number };

export type SkinProfile = {
  skinLab: Lab; // sudah dikoreksi pencahayaan
  skinHex: string;
  depth: Depth;
  undertone: Undertone;
  contrast: { level: ContrastLevel; delta: number };
  confidence: Confidence;
  faceShape: FaceShape;
};

export type DebugInfo = {
  regions: { name: string; polygon: Pt[]; used: boolean; lab: Lab | null; pixels: number }[];
  rawSkinLab: Lab;
  gains: [number, number, number];
  castDeviation: number;
  meanL: number;
  spreadDeltaE: number;
  blurVar: number;
  faceWidthFrac: number;
  lipL: number | null;
  browL: number | null;
  notes: string[];
};

export type Analysis = {
  photo: HTMLCanvasElement; // foto asli (tidak dikoreksi), hanya di memori
  landmarks: Pt[]; // piksel pada `photo`
  profile: SkinProfile;
  debug: DebugInfo;
};

export type FitLabel = "Selaras" | "Bisa dicoba" | "Kurang cocok";

export type FitResult = {
  label: FitLabel;
  reasons: string[];
  confidence: ConfidenceLevel;
  /** Hanya untuk mode debug. Tidak ditampilkan sebagai persentase di UI biasa. */
  debug: { harmoni: number; kontras: number; intensitas: number; total: number; hue: number; chroma: number };
};

export type Swatch = { nama: string; hex: string };
