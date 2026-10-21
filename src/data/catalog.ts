// Katalog warna kandidat (nilai awal). Palet pengguna dihasilkan dengan menilai katalog ini terhadap profilnya.
// Tanpa brand: hanya nama warna dan kode hex.
import type { Swatch } from "../types";

export const LIPSTIK: Swatch[] = [
  { nama: "Nude karamel", hex: "#B87A62" },
  { nama: "Nude pink", hex: "#C58C8A" },
  { nama: "Peach", hex: "#E9967A" },
  { nama: "Coral hangat", hex: "#D9694F" },
  { nama: "Bata muda", hex: "#C95F55" },
  { nama: "Terakota", hex: "#B5584B" },
  { nama: "Rose cokelat", hex: "#A3485A" },
  { nama: "Rose", hex: "#C9677E" },
  { nama: "Pink dingin", hex: "#D6708F" },
  { nama: "Mauve", hex: "#A8607A" },
  { nama: "Berry", hex: "#8E2A55" },
  { nama: "Plum", hex: "#6E2A4A" },
  { nama: "Merah klasik", hex: "#C0282D" },
  { nama: "Merah hangat", hex: "#C8402B" },
  { nama: "Merah anggur", hex: "#7A1C32" },
];

export const BLUSH: Swatch[] = [
  { nama: "Peach", hex: "#E9967A" },
  { nama: "Apricot", hex: "#E8A06A" },
  { nama: "Coral", hex: "#D9694F" },
  { nama: "Rose hangat", hex: "#D4707A" },
  { nama: "Terakota", hex: "#B5584B" },
  { nama: "Pink lembut", hex: "#E7A0B0" },
  { nama: "Rose", hex: "#CC6B85" },
  { nama: "Mauve", hex: "#B5748C" },
  { nama: "Berry", hex: "#9C3C62" },
  { nama: "Plum", hex: "#7C3A5C" },
];

export const EYESHADOW: Swatch[] = [
  { nama: "Taupe cokelat", hex: "#8A6A55" },
  { nama: "Bronze", hex: "#A8754D" },
  { nama: "Tembaga", hex: "#B87333" },
  { nama: "Emas", hex: "#D6A64F" },
  { nama: "Zaitun hangat", hex: "#6B6F5A" },
  { nama: "Mauve", hex: "#8F6A7C" },
  { nama: "Plum", hex: "#5E3552" },
  { nama: "Taupe dingin", hex: "#7D7176" },
  { nama: "Abu", hex: "#6C6C74" },
  { nama: "Biru", hex: "#3F5F9A" },
  { nama: "Teal", hex: "#1F6B6E" },
  { nama: "Navy", hex: "#23305A" },
];

export const HIGHLIGHTER: (Swatch & { hangat: boolean })[] = [
  { nama: "Champagne", hex: "#F3E3C3", hangat: true },
  { nama: "Emas", hex: "#E8C77A", hangat: true },
  { nama: "Peach-gold", hex: "#F0C9A8", hangat: true },
  { nama: "Rose gold", hex: "#E8B7A8", hangat: false },
  { nama: "Perak mutiara", hex: "#E6E4EA", hangat: false },
  { nama: "Pink mutiara", hex: "#EEC9D4", hangat: false },
];

/** Eyeliner dan alis: urutan menurut depth (terang -> yang lembut dulu). `lembut` = cocok untuk depth terang/sedang. */
export const EYELINER: (Swatch & { lembut: boolean })[] = [
  { nama: "Cokelat tua", hex: "#4A2F24", lembut: true },
  { nama: "Burgundy", hex: "#5A1F2D", lembut: true },
  { nama: "Hijau botol", hex: "#1E4A3A", lembut: true },
  { nama: "Hitam", hex: "#1E1B22", lembut: false },
];

export const ALIS: (Swatch & { lembut: boolean })[] = [
  { nama: "Cokelat sedang", hex: "#6B4A35", lembut: true },
  { nama: "Cokelat keabuan", hex: "#5E5348", lembut: true },
  { nama: "Cokelat tua", hex: "#4A3328", lembut: false },
  { nama: "Hitam", hex: "#2B2320", lembut: false },
];

export const COLOR_CORRECTOR: (Swatch & { guna: string })[] = [
  { nama: "Hijau", hex: "#9DBB8F", guna: "Menetralkan kemerahan (jerawat, iritasi)" },
  { nama: "Peach / oranye", hex: "#F0B48F", guna: "Menetralkan lingkar mata gelap kebiruan" },
  { nama: "Kuning", hex: "#EFD98A", guna: "Menetralkan warna ungu atau kebiruan ringan" },
  { nama: "Lavender", hex: "#C3B2DC", guna: "Menetralkan kulit yang terlihat kekuningan" },
];
