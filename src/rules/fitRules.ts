// Bobot dan ambang penilaian kecocokan. NILAI AWAL, untuk disetel pemilik produk.

export type Product = "lip" | "blush" | "eyeshadow";
export type Context = "natural" | "kantor" | "kondangan" | "glam";

export const FIT_RULES = {
  weights: { harmoni: 0.5, kontras: 0.25, intensitas: 0.25 },
  /** total >= selaras -> "Selaras"; >= bisaDicoba -> "Bisa dicoba"; selain itu "Kurang cocok". */
  labelAt: { selaras: 0.7, bisaDicoba: 0.45 },

  /** Pusat hue ideal (derajat, Lab) untuk undertone cool dan warm; di antaranya diinterpolasi. */
  hueCenter: { cool: 5, warm: 50 },
  /** Toleransi hue: dasar + bonus saat undertone netral (netral = lebih luas). */
  hueTolerance: { base: 24, neutralBonus: 36 },
  /** Warna dengan chroma di bawah ini hue-nya tidak tegas (nude/taupe), harmoni ditarik ke nilai aman. */
  lowChroma: { below: 20, safeScore: 0.8 },

  /** Selisih terang-gelap |L_kulit - L_warna| yang diinginkan menurut kontras alami, per produk. */
  contrastTarget: {
    lip: { rendah: 6, sedang: 12, tinggi: 20 },
    blush: { rendah: 4, sedang: 9, tinggi: 15 },
    eyeshadow: { rendah: 10, sedang: 18, tinggi: 28 },
  } satisfies Record<Product, Record<"rendah" | "sedang" | "tinggi", number>>,
  contrastTolerance: 18,

  /** Rentang chroma yang pas per produk dan konteks. */
  chromaRange: {
    lip: { natural: [18, 40], kantor: [25, 48], kondangan: [35, 65], glam: [45, 80] },
    blush: { natural: [14, 34], kantor: [18, 40], kondangan: [26, 52], glam: [32, 62] },
    eyeshadow: { natural: [8, 28], kantor: [12, 34], kondangan: [20, 48], glam: [28, 60] },
  } satisfies Record<Product, Record<Context, [number, number]>>,
  chromaTolerance: 18,
  /** Pergeseran rentang chroma menurut depth: terang lebih lembut, gelap lebih pekat. */
  depthChromaShift: { terangMaxLevel: 3, gelapMinLevel: 7, amount: 8 },

  defaultContext: "kantor" as Context,
} as const;

/** Rentang kisaran foundation, relatif terhadap kulit terukur. */
export const FOUNDATION_RULES = {
  steps: [
    { nama: "Terang", dL: 4 },
    { nama: "Paling dekat", dL: 0 },
    { nama: "Sedikit gelap", dL: -4 },
    { nama: "Gelap", dL: -8 },
  ],
  /** Foundation umumnya sedikit lebih hangat dari foto kulit: geser b* sedikit. */
  dB: 1.5,
};

/** Warna turunan dari kulit (bukan katalog). dL dan skala chroma terhadap kulit. */
export const SKIN_RELATIVE = {
  contour: [
    { nama: "Sawo", dL: -12, chromaScale: 1.0 },
    { nama: "Cokelat hangat", dL: -18, chromaScale: 1.0 },
    { nama: "Cokelat tua", dL: -25, chromaScale: 0.95 },
  ],
  bronzer: [
    { nama: "Keemasan", dL: -7, chromaScale: 1.3 },
    { nama: "Terakota", dL: -11, chromaScale: 1.55 },
    { nama: "Kuningan", dL: -15, chromaScale: 1.3 },
  ],
};
