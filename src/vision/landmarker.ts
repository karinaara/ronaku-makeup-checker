// MediaPipe Face Landmarker, berjalan penuh di browser. WASM dimuat dari origin sendiri (lihat scripts/copy-wasm.mjs).
// Model dimuat dari URL yang dipin versinya; untuk offline penuh, taruh file di public/models/ dan set
// VITE_FACE_MODEL_URL=./models/face_landmarker.task. Hanya file model yang diunduh; tidak ada data wajah yang dikirim.
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const MODEL_URL: string =
  import.meta.env.VITE_FACE_MODEL_URL ??
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let instance: Promise<FaceLandmarker> | null = null;

export function getLandmarker(): Promise<FaceLandmarker> {
  if (!instance) {
    instance = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(new URL("wasm", document.baseURI).href);
      const make = (delegate: "GPU" | "CPU") =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: "IMAGE",
          numFaces: 1,
        });
      try {
        return await make("GPU");
      } catch {
        return await make("CPU");
      }
    })();
    instance.catch(() => (instance = null)); // boleh dicoba lagi
  }
  return instance;
}

export { FaceLandmarker };
