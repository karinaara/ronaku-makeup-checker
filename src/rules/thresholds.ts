// SEMUA ANGKA DI SINI ADALAH NILAI AWAL UNTUK DIKALIBRASI dengan set foto uji.
// Jangan dianggap benar. Ubah di file ini saja; komponen UI tidak menyimpan ambang.

export const SKIN = {
  /** Persentil yang dibuang dari piksel sampel (berdasarkan L*) sebelum median. */
  trim: { low: 0.15, high: 0.1 },
  /** Batas koreksi gray-world per kanal. */
  whiteBalance: { minGain: 0.85, maxGain: 1.2, /** koreksi hanya jika penyimpangan >= ini; cast kecil bisa cuma warna latar */ minDeviation: 0.08 },
  /** Dahi dibuang jika L* median-nya lebih gelap dari rata-rata pipi sebesar ini (indikasi rambut/hijab). */
  foreheadHairDeltaL: 12,
  /** Dahi dibuang jika L* median-nya lebih TERANG dari rata-rata pipi sebesar ini (kilap/highlight/paparan berlebih). */
  foreheadGlareDeltaL: 8,
  /** Area rahang dibuang jika L* median-nya lebih gelap dari rata-rata pipi sebesar ini (bayangan bawah rahang/leher). */
  jawShadowDeltaL: 12,
  /** Ukuran piksel minimum area sampel agar dianggap cukup. */
  minSamplePixels: 400,
};

export const FACE_CHECK = {
  /** Lebar wajah minimal terhadap lebar gambar. */
  minFaceWidthFrac: 0.22,
  /** Penyimpangan hidung dari tengah (0 = lurus, 0.5 = profil) sebelum dianggap menoleh. */
  maxYaw: 0.14,
  /** Kemiringan garis mata (derajat). */
  maxRollDeg: 25,
};

export const UNDERTONE = {
  /** Hue angle Lab (derajat) yang dipetakan ke skor 0 (cool) dan 1 (warm). */
  hueCool: 42,
  hueWarm: 66,
  /** Batas skor untuk label. */
  labels: [
    { max: 0.3, key: "cool", text: "Cool" },
    { max: 0.45, key: "netral", text: "Cenderung cool ke netral" },
    { max: 0.58, key: "netral", text: "Netral" },
    { max: 0.72, key: "warm", text: "Warm cenderung netral" },
    { max: 1.01, key: "warm", text: "Warm" },
  ] as const,
};

export const CONTRAST = {
  /** Selisih L* kulit terhadap rata-rata fitur alami (bibir dan alis). */
  lowBelow: 22,
  highAbove: 34,
};

export const CONFIDENCE = {
  /** [sedang, buruk] untuk tiap faktor. */
  meanL: { dark: [35, 25], bright: [88, 94] },
  spreadDeltaE: [7, 12],
  castGain: [0.12, 0.22],
  blurVar: [60, 25], // varians Laplacian pada crop 256 px; lebih kecil = lebih buram
  faceWidthFrac: [0.35, 0.25],
  /** Total poin (0 baik, 1 sedang, 2 buruk) untuk Sedang dan Rendah. */
  mediumAt: 1,
  lowAt: 3,
};

export const FACE_SHAPE = {
  /** Rasio-rasio dihitung dari landmark. Semua ambang awal. */
  longRatio: 1.5, // tinggi / lebar
  roundRatio: 1.32,
  squareJawToCheek: 0.86,
  heartForeheadToJaw: 1.2,
};

export const EYE_SHAPE_NOTE = "Bentuk mata dipilih manual (tebakan otomatis belum andal).";
