// Salin WASM MediaPipe ke public/ supaya dimuat dari origin sendiri (tanpa CDN pihak ketiga).
import { cpSync, mkdirSync, existsSync } from "node:fs";

const src = "node_modules/@mediapipe/tasks-vision/wasm";
if (!existsSync(src)) {
  console.warn("[copy-wasm] folder wasm tidak ditemukan, lewati.");
} else {
  mkdirSync("public/wasm", { recursive: true });
  cpSync(src, "public/wasm", { recursive: true });
  console.log("[copy-wasm] selesai");
}
