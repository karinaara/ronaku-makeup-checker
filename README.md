# Rona.ku

Temukan warna makeup yang cocok dan lihat hasilnya di wajah sebelum membeli. Web app mobile-first, tanpa backend, semua diproses di perangkat.

## Menjalankan
```bash
npm install
npm run dev        # http://localhost:5173 (tambahkan ?debug=1 untuk mode debug)
npm test           # Vitest: warna, aturan, palet
npm run e2e        # Playwright (memakai Chrome terpasang)
npm run build      # hasil di dist/
```

## Struktur
- `src/color/` konversi warna, CIEDE2000, depth, undertone, kontras, keyakinan
- `src/rules/` ambang dan bobot **sebagai data** (`thresholds.ts`, `fitRules.ts`, `positionRules.ts`). Semua nilai awal, untuk dikalibrasi
- `src/vision/` Face Landmarker, area sampel, pipeline analisis
- `src/render/` try-on Canvas 2D
- `src/data/` katalog warna dan skala Monk
- `src/ui/` layar dan komponen
- `docs/catatan-validasi.md` hasil uji dan keputusan terbuka

## Kalibrasi dengan foto uji
```powershell
$env:FOTO_UJI="C:\path\foto.jpg"; npx playwright test foto-uji
```
Mencetak angka mode debug. Foto hanya diproses di browser lokal. File gambar di root proyek diabaikan git; jangan menaruh foto wajah di `public/`.

## Privasi
Foto dan landmark tidak keluar dari perangkat dan tidak disimpan. Model Face Landmarker diunduh browser dari `storage.googleapis.com` (hanya model). Untuk offline penuh: taruh model di `public/models/` dan set `VITE_FACE_MODEL_URL=./models/face_landmarker.task`.

## Sebelum rilis
Cek domain (mis. `ronaku.id`) dan merek dagang (PDKI, kelas kosmetik); tinjau kebijakan privasi dengan ahli hukum (UU PDP); kalibrasi ambang dengan foto uji yang beragam, terutama kulit sawo matang dan gelap.
