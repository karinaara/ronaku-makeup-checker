# Catatan validasi Rona.ku

Semua ambang di `src/rules/thresholds.ts` dan `src/rules/fitRules.ts` adalah **nilai awal**, belum dikalibrasi. Dokumen ini disusun ulang dari hasil sesi uji; angka di bawah berasal dari foto milik pemilik produk (delapan foto, satu kelompok kecil).

## Sudah diuji
- Unit test (`npm test`, 26 tes): konversi sRGB/Lab, CIEDE2000 (data Sharma et al.), depth, undertone (termasuk wrap hue), kontras, keyakinan, bentuk wajah, kecocokan, palet, koreksi cahaya.
- Playwright (`npm run e2e`, viewport 390 px): layar selfie tanpa scroll horizontal, target sentuh >= 44 px, kebijakan privasi, penolakan foto tanpa wajah, tidak ada request non-GET saat analisis.
- Face Landmarker + WASM termuat di browser. Kontur dari konstanta MediaPipe: bibir luar 20 titik, bibir dalam 20, oval wajah 36.
- Render try-on dan semua layar diuji dengan landmark sintetis (bukan wajah nyata).
- Area sampel jatuh di kulit (dikonfirmasi pemilik pada foto uji pertama).

## Belum diuji
1. Tampilan try-on lipstik/blush pada wajah nyata, dan performa di HP kelas menengah.
2. Kulit sawo matang dan gelap (belum ada foto uji). Wajib sebelum rilis.
3. Foto dengan hijab; aturan hijab belum divalidasi.
4. Akurasi undertone terhadap label "benar" (belum ada label dari tes eksternal).
5. Kebijakan privasi masih draf, perlu tinjauan ahli hukum (UU PDP).

## Perubahan aturan hasil pengujian
| Perubahan | Alasan | Nilai awal |
|---|---|---|
| Ukuran wajah dibandingkan dengan sisi terpendek foto | Foto landscape 1920x1080 ditolak "terlalu kecil" padahal wajah ~42% tinggi foto | `FACE_CHECK.minFaceWidthFrac` 0.22 |
| Hue di-wrap (> 180° dianggap negatif) | Hue 349° terbaca "warm 1.00" | `UNDERTONE.hueCool/hueWarm` 42/66 |
| Gray-world hanya jika penyimpangan >= 0.08 | AKU2: cast 0.059 menggeser b* 27.8 -> 35.2 (latar kebiruan dikira cahaya) | `SKIN.whiteBalance.minDeviation` 0.08 |
| Dahi dibuang jika > 8 L* lebih terang dari pipi | Kilap/paparan berlebih (selisih area 13.2 -> 5.7) | `SKIN.foreheadGlareDeltaL` 8 |
| Rahang dibuang jika > 12 L* lebih gelap dari pipi | Bayangan bawah rahang hampir selalu menaikkan selisih area | `SKIN.jawShadowDeltaL` 12 |

Dahi lebih gelap dari pipi > 12 L* (rambut/hijab) sudah dibuang sejak awal (`foreheadHairDeltaL`). Foto wajah menoleh tetap ditolak (keputusan pemilik: memang tidak boleh menoleh).

## Hasil foto uji (setelah semua perubahan di atas)
Catatan: `foto3.jpg` ditimpa di tengah sesi; baris "AKU", "AKU2", dan foto2–7 di bawah adalah hasil akhir.

| Foto | L*/a*/b* | Hue | Undertone | Depth | Selisih area | Keyakinan | Catatan |
|---|---|---|---|---|---|---|---|
| AKU (1920x1080) | 67.3/9.6/0.6 | 3° | 0.00 cool | 5–6 | 10.3 | Sedang | b* sangat rendah, curiga filter/cahaya campuran; rahang kanan dibuang |
| AKU2 (800x1200) | 77.4/8.8/27.8 | 72° | 1.00 warm | 4–5 | 8.0 | Sedang | skor undertone jenuh (hue > hueWarm) |
| foto1 | ditolak: wajah menoleh | | | | | | |
| foto2 | 70.5/15.5/23.7 | 57° | 0.62 warm cenderung netral | 5–6 | 21.1 | Rendah | cahaya dari samping (pipi 81 vs 54) |
| foto3 | 82.6/4.3/1.6 | 20° | 0.00 cool | 4–5 | 8.5 | Sedang | cast 0.131 dikoreksi |
| foto4 | 68.7/4.5/3.0 | 33° | 0.00 cool | 5–6 | 12.9 | Rendah | dahi dan rahang kiri dibuang, cast |
| foto5 | 81.5/8.2/12.7 | 57° | 0.63 warm cenderung netral | 4–5 | 6.4 | **Tinggi** | tajam (blur 203) |
| foto6 | 63.9/7.1/13.0 | 61° | 0.80 warm | 5–6 | 3.8 | Sedang | cast 0.151, blur 55 |
| foto7 | 81.3/11.7/14.9 | 52° | 0.41 cenderung cool ke netral | 4–5 | 9.2 | Sedang | label bergeser dari netral setelah rahang dibuang |

## Fitur setelah finalisasi
- **Live view kamera:** deteksi wajah terus-menerus, area sampel tergambar di wajah, tombol aktif saat posisi pas, hitung mundur otomatis 3 detik (`HOLD_MS`, `COUNTDOWN_FROM` di `src/ui/LiveCamera.tsx`). Diuji dengan kamera palsu dari foto uji pemilik: lulus.
- **Try-on eyeshadow** (wash dan gradient; bentuk mata dipilih manual: almond, bulat, hooded, monolid). Data di `src/rules/positionRules.ts`, renderer di `src/render/eyeshadow.ts`. Diuji dengan landmark sintetis: bukaan mata 0 dari 1482 piksel berubah pada 8 kombinasi bentuk x gaya; tinggi bayangan hooded > almond > monolid; gradient memudar ke atas. **Belum diuji pada wajah nyata**; nilai `lidHeight`, `wing`, dan alpha (multiply 0.55, color 0.5) adalah nilai awal.

## Temuan terbuka untuk kalibrasi
- **Undertone:** skor jenuh di 0 dan 1 untuk hue di luar 42°–66°. Foto dekat batas mudah berpindah label (foto7: 55° -> 52°). Perlu rentang hue lebih lebar dan label "benar" dari tes eksternal.
- **Foto cool (AKU, foto3, foto4):** b* sangat rendah (-0.2 sampai 3) untuk kulit. Kemungkinan filter atau cahaya berwarna; belum bisa dipastikan tanpa foto pembanding.
- **Blur:** varians Laplacian dihitung pada crop 256 px; foto kecil/terkompresi berat (foto3 lama: 23) dinilai buram. Ambang 60/25 perlu diuji lagi pada foto dari kamera ponsel resolusi normal.
- **Kontras:** memakai bibir dan alis; alis terang atau berwarna menurunkan nilai. Ambang 22/34 belum divalidasi.

## Keputusan yang dikonfirmasi pemilik
- Model Face Landmarker diunduh browser dari `storage.googleapis.com` (pinned versi 1). Hanya model, tidak ada data wajah terkirim. Offline penuh: taruh di `public/models/` dan set `VITE_FACE_MODEL_URL`.
- Tombol suka/tidak hanya menyimpan parameter (produk, hex, label, suara) di localStorage perangkat.
- Gaya blush draping/diagonal disembunyikan saat toggle hijab aktif sampai aturan hijab divalidasi.
- Foto uji tidak boleh masuk repositori atau build (`.gitignore` mengabaikan gambar di root).
