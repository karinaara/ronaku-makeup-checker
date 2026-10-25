// Gaya blush dan rekomendasi posisi menurut bentuk wajah. NILAI AWAL, untuk divalidasi.
// Geometri relatif terhadap landmark: satuan = jarak antar sudut luar mata (IED).
import type { FaceShapeKey } from "../color/skin";
import type { FitLabel } from "../types";

export type BlushStyleId = "apple" | "draping" | "sunburn" | "diagonal";

export type BlushStyle = {
  id: BlushStyleId;
  nama: string;
  deskripsi: string;
  /** offset dari titik jangkar pipi: x ke arah luar wajah, y ke bawah */
  offsetX: number;
  offsetY: number;
  angle: number; // derajat, positif = ujung luar naik
  rx: number;
  ry: number;
  feather: number; // 0..1
  /** Bergantung pada area pelipis yang bisa tertutup hijab. */
  tergantungPelipis: boolean;
};

export const BLUSH_STYLES: BlushStyle[] = [
  { id: "apple", nama: "Apple", deskripsi: "Bulat di bagian pipi yang menonjol saat tersenyum.", offsetX: 0, offsetY: 0.04, angle: 0, rx: 0.3, ry: 0.27, feather: 0.65, tergantungPelipis: false },
  { id: "draping", nama: "Draping", deskripsi: "Memanjang dari pipi naik ke arah pelipis.", offsetX: 0.22, offsetY: -0.12, angle: 24, rx: 0.52, ry: 0.2, feather: 0.7, tergantungPelipis: true },
  { id: "sunburn", nama: "Sunburn", deskripsi: "Melintang tipis di pipi, terasa seperti terkena matahari.", offsetX: -0.02, offsetY: -0.1, angle: 6, rx: 0.56, ry: 0.18, feather: 0.7, tergantungPelipis: false },
  { id: "diagonal", nama: "Diagonal", deskripsi: "Menyerong naik, memberi kesan wajah terangkat.", offsetX: 0.12, offsetY: -0.02, angle: 32, rx: 0.5, ry: 0.2, feather: 0.65, tergantungPelipis: true },
];

type Entry = { label: FitLabel; alasan: string };

const BISA = "Pilihan ini lebih subjektif untuk bentuk wajahmu, silakan coba dan lihat sendiri.";

const rec = (selaras: Partial<Record<BlushStyleId, string>>, kurang: Partial<Record<BlushStyleId, string>>) =>
  Object.fromEntries(
    BLUSH_STYLES.map((s) => [
      s.id,
      selaras[s.id]
        ? { label: "Selaras", alasan: selaras[s.id] }
        : kurang[s.id]
          ? { label: "Kurang cocok", alasan: kurang[s.id] }
          : { label: "Bisa dicoba", alasan: BISA },
    ]),
  ) as Record<BlushStyleId, Entry>;

export const BLUSH_BY_SHAPE: Record<FaceShapeKey, Record<BlushStyleId, Entry>> = {
  oval: rec(
    { draping: "Wajah oval fleksibel, draping menambah dimensi di tulang pipi.", apple: "Bentuk wajah oval cocok dengan hampir semua gaya, apple memberi kesan segar." },
    {},
  ),
  bulat: rec(
    { diagonal: "Garis diagonal yang naik membantu wajah bulat terlihat lebih terangkat." },
    { apple: "Blush bulat di pipi bisa menambah kesan bulat pada wajahmu." },
  ),
  panjang: rec(
    { sunburn: "Blush melintang membantu membagi tampilan wajah panjang jadi lebih seimbang.", apple: "Blush di pipi apel memberi kesan lebih lebar pada wajah panjang." },
    { diagonal: "Garis menyerong naik bisa menambah kesan memanjang pada wajahmu." },
  ),
  persegi: rec(
    { apple: "Bentuk lembut dan bulat membantu melembutkan sudut rahang." },
    {},
  ),
  hati: rec(
    { apple: "Blush di pipi bawah menyeimbangkan dahi yang lebih lebar dari dagu." },
    { diagonal: "Garis menyerong ke pelipis bisa menegaskan dahi yang sudah lebar." },
  ),
};

// ---- Eyeshadow (NILAI AWAL, untuk divalidasi). Ukuran relatif terhadap lebar mata. ----
export type EyeShapeId = "almond" | "bulat" | "hooded" | "monolid";
export type EyeStyleId = "wash" | "gradient";

export const EYE_SHAPES: { id: EyeShapeId; nama: string; lidHeight: number; wing: number }[] = [
  { id: "almond", nama: "Almond", lidHeight: 0.5, wing: 0.18 },
  { id: "bulat", nama: "Bulat", lidHeight: 0.55, wing: 0.3 }, // diperpanjang ke luar supaya mata terlihat lebih lonjong
  { id: "hooded", nama: "Hooded (kelopak tertutup lipatan)", lidHeight: 0.72, wing: 0.15 }, // naik lebih tinggi agar warna tetap terlihat
  { id: "monolid", nama: "Monolid (kelopak rata)", lidHeight: 0.45, wing: 0.2 },
];

export const EYE_STYLES: { id: EyeStyleId; nama: string; deskripsi: string }[] = [
  { id: "wash", nama: "Wash", deskripsi: "Satu warna tipis merata di seluruh kelopak." },
  { id: "gradient", nama: "Gradient", deskripsi: "Paling pekat di garis bulu mata, memudar ke atas." },
];

const eye = (wash: Entry, gradient: Entry) => ({ wash, gradient });
export const EYE_BY_SHAPE: Record<EyeShapeId, Record<EyeStyleId, Entry>> = {
  almond: eye(
    { label: "Selaras", alasan: "Mata almond fleksibel, wash tipis menjaga tampilan tetap natural." },
    { label: "Selaras", alasan: "Mata almond cocok dengan gradasi, hasilnya memberi dimensi tanpa berlebihan." },
  ),
  bulat: eye(
    { label: "Bisa dicoba", alasan: BISA },
    { label: "Selaras", alasan: "Gradasi yang lebih pekat di sudut luar membantu memanjangkan mata bulat." },
  ),
  hooded: eye(
    { label: "Selaras", alasan: "Wash tipis tetap terlihat saat mata terbuka. Warna pekat di kelopak bisa tertutup lipatan." },
    { label: "Bisa dicoba", alasan: BISA },
  ),
  monolid: eye(
    { label: "Bisa dicoba", alasan: BISA },
    { label: "Selaras", alasan: "Gradasi dari garis bulu mata memberi dimensi pada kelopak yang rata." },
  ),
};

export const DEFAULT_BLUSH_PARAMS = { tinggi: 0, sudut: 0, ukuran: 1, intensitas: 0.6 };
