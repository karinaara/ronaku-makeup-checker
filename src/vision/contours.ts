// Kontur dari konstanta koneksi MediaPipe (bukan daftar indeks yang disalin manual).
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import { convexHull, loopsFromConnections, uniqueIndices } from "./geometry";
import type { Pt } from "../types";

let cache: { lipsOuter: number[]; lipsInner: number[]; faceOval: number[]; brows: number[] } | null = null;

export function contours() {
  if (cache) return cache;
  const lipLoops = loopsFromConnections(FaceLandmarker.FACE_LANDMARKS_LIPS);
  // landmark 0 = tengah bibir atas luar; 13 = tengah bibir atas dalam
  const lipsOuter = lipLoops.find((l) => l.includes(0)) ?? [];
  const lipsInner = lipLoops.find((l) => l.includes(13)) ?? [];
  const faceOval = loopsFromConnections(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL).sort((a, b) => b.length - a.length)[0] ?? [];
  const brows = [
    ...uniqueIndices(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW),
    ...uniqueIndices(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW),
  ];
  cache = { lipsOuter, lipsInner, faceOval, brows };
  return cache;
}

export const pick = (lm: Pt[], idx: number[]): Pt[] => idx.map((i) => lm[i]);
export const browHulls = (lm: Pt[]): Pt[][] => {
  const { brows } = contours();
  // dua alis: bagi menurut posisi x relatif terhadap tengah wajah
  const mid = (lm[33].x + lm[263].x) / 2;
  const left = brows.filter((i) => lm[i].x < mid);
  const right = brows.filter((i) => lm[i].x >= mid);
  return [convexHull(pick(lm, left)), convexHull(pick(lm, right))];
};
