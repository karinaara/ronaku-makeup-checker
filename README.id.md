# 💄 Rona.ku — Temukan Warna Makeup yang Cocok, Coba Dulu Sebelum Membeli

🌐 [English](README.md) | **Bahasa Indonesia**

[![Demo Langsung](https://img.shields.io/badge/Demo%20Langsung-ronaku.netlify.app-00C7B7?logo=netlify&logoColor=white)](https://ronaku.netlify.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Landmarker-4285F4?logo=google&logoColor=white)](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)
[![Vitest](https://img.shields.io/badge/Vitest-tes%20unit-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-e2e-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

Aplikasi web *mobile-first* yang membantu perempuan menemukan warna makeup yang cocok dan **melihat hasilnya di wajah sendiri sebelum membeli**. Dari satu selfie, aplikasi memperkirakan profil warna (kedalaman kulit, undertone, kontras alami), memungkinkan kamu mencoba lipstik, blush, dan eyeshadow, lalu memberi kode hex yang bisa dibawa ke toko mana pun. Semua berjalan **di perangkatmu**: foto tidak pernah keluar dari browser.

🚀 **Demo langsung: [ronaku.netlify.app](https://ronaku.netlify.app/)** — buka di ponsel atau laptop dan coba dengan selfie-mu sendiri (diproses hanya di perangkatmu).

> 🌐 Aplikasi ini **dwibahasa: Indonesia dan English**. Pakai pengalih `ID | EN` di bagian atas; bawaannya mengikuti bahasa browser dan pilihanmu diingat. Pengguna utamanya perempuan Indonesia (termasuk pengguna hijab), jadi bahasa Indonesia adalah bahasa sumber.

> 🔒 **Status:** MVP ditambah try-on eyeshadow. Semua ambang masih **nilai awal yang perlu dikalibrasi** dengan set foto yang beragam. Lihat [Keterbatasan](#-keterbatasan).

## 📌 Daftar Isi

* [Ikhtisar](#-ikhtisar)
* [Demo Langsung & Pratinjau](#-demo-langsung--pratinjau)
* [Fitur Utama](#-fitur-utama)
* [Cara Kerja](#-cara-kerja)
* [Pipeline Analisis Warna](#-pipeline-analisis-warna)
* [Mesin Penilaian Kecocokan](#-mesin-penilaian-kecocokan)
* [Rendering Try-On](#-rendering-try-on)
* [Tech Stack](#-tech-stack)
* [Struktur Proyek](#-struktur-proyek)
* [Privasi & Arsitektur Data](#-privasi--arsitektur-data)
* [Menjalankan Secara Lokal](#-menjalankan-secara-lokal)
* [Pengujian & Kalibrasi](#-pengujian--kalibrasi)
* [Keterbatasan](#-keterbatasan)
* [Roadmap](#-roadmap)
* [Lisensi](#-lisensi)

## 📖 Ikhtisar

Salah beli shade foundation, atau bingung lipstik dan blush mana yang benar-benar cocok, adalah masalah yang umum. Terutama untuk kulit sawo matang dan tan, yang sering tidak ditangani baik oleh alat umum. Rona.ku mengganti tebakan dengan **aturan teori warna yang bisa ditelusuri**, bukan kotak hitam:

* **Tanpa merek.** Output selalu berupa warna (kode hex dan deskripsi), bukan produk.
* **Jujur soal ketidakpastian.** Hasil adalah estimasi dengan tingkat keyakinan. Foundation selalu berupa **kisaran**, bukan satu shade "paling pas".
* **Aturan, bukan kotak hitam.** Kecocokan dihitung dengan aturan eksplisit. LLM tidak pernah dipakai untuk menentukan skor.
* **Label dengan alasan.** Tidak ada "cocok 87%". Kamu mendapat *Selaras* / *Bisa dicoba* / *Kurang cocok* beserta alasan satu-dua kalimat.
* **Privasi dulu.** Foto wajah adalah data biometrik, jadi semua pemrosesan tetap di perangkatmu.
* **Saran, bukan hukum.** Bentuk wajah dan makeup itu subjektif, jadi setiap rekomendasi bisa dikoreksi pengguna.

## 📸 Demo Langsung & Pratinjau

🌐 **Coba aplikasi jadinya: [https://ronaku.netlify.app/](https://ronaku.netlify.app/)**

Tips untuk demo: pakai cahaya alami, hadapkan wajah lurus ke kamera, tanpa filter. Kamera membutuhkan HTTPS (demo sudah memakainya). Tambahkan `?debug=1` di URL untuk melihat area sampel dan angka di balik hasilnya.

<!--
  Tambahkan tangkapan layar di sini. Pakai gambar sintetis atau model yang setuju saja: foto wajah adalah
  data biometrik dan tidak boleh di-commit ke repositori.
  Contoh: <img width="390" alt="Layar profil" src="docs/screenshots/profil.png" />
-->
_Tangkapan layar menyusul._

## 🌟 Fitur Utama

* 📷 **Selfie dengan Live View:** Kamera mendeteksi wajahmu secara langsung dan menggambar area kulit yang akan dibaca (dahi, pipi, rahang). Tombol ambil foto hanya aktif saat posisimu valid, dan hitung mundur 3-2-1 opsional mengambil foto otomatis setelah kamu diam sebentar. Kamu juga bisa mengunggah foto.
* 🎨 **Profil Warna:** Kedalaman kulit sebagai kisaran dua level pada skala Monk Skin Tone 10 level, skor undertone kontinu (cool → warm) dengan label, kontras alami (rendah / sedang / tinggi), dan tingkat keyakinan dengan saran foto ulang yang spesifik (terlalu gelap, cahaya kuning, buram, cahaya tidak merata…).
* 💋 **Try-On Lipstik:** Finish matte, satin, dan glossy yang mempertahankan tekstur dan bayangan bibir asli (bukan sekadar menimpa warna).
* 🌸 **Try-On dan Posisi Blush:** Empat gaya (apple, draping, sunburn, diagonal) dengan slider tinggi / sudut / ukuran / intensitas, kecenderungan bentuk wajah (bisa dikoreksi), dan toggle hijab yang menyembunyikan gaya yang bergantung pada area tertutup.
* 👁️ **Try-On Eyeshadow:** Gaya wash dan gradient yang dipotong mengikuti kelopak sehingga bukaan mata tetap bersih. Bentuk mata (almond, bulat, hooded, monolid) dipilih manual karena deteksi otomatisnya belum andal.
* 🔀 **Sebelum/Sesudah dan Bandingkan Berdampingan:** Geser pembatas untuk membandingkan, atau lihat 2–4 warna berdampingan, karena di situlah pengguna benar-benar memutuskan.
* 🧴 **Kisaran Foundation:** Empat shade (lebih terang → lebih gelap) dengan tips tes di toko. Foundation sengaja **tidak** disimulasikan di wajah.
* 🗂️ **Palet Lengkap:** Foundation, contour, bronzer, blush, highlighter, eyeshadow, eyeliner, alis, lipstik, dan color corrector dalam satu halaman. Palet dihasilkan dari profilmu (tidak statis), dan "Lihat semua" menampilkan warna dingin dan berani juga.
* 🌐 **Tampilan Dwibahasa (ID / EN):** Setiap layar, alasan kecocokan, nama warna, pesan galat, dan kebijakan privasi tersedia dalam kedua bahasa. Sebuah tes memeriksa agar tidak ada teks sumber yang terlewat diterjemahkan. Menampilkan area sampel (dipakai / dibuang), nilai L\*a\*b\*, hue, depth, skor undertone, skor tiap komponen kecocokan, dan faktor keyakinan, sehingga aturan bisa disetel tanpa makeup artist.
* 👍 **Sinyal Suka / Tidak:** Hanya menyimpan parameter (produk, hex, label, suara) secara lokal, sebagai sinyal awal untuk menyetel aturan nanti.

## 🔄 Cara Kerja

1. **Ambil Selfie:** Ikuti panduan live; aplikasi memeriksa ukuran, arah hadap, dan kemiringan wajah sebelum kamu bisa mengambil foto.
2. **Lihat Profilmu:** Cek depth, undertone, kontras, dan keyakinan. Keyakinan rendah meminta foto ulang dengan alasan spesifik.
3. **Coba Warna dan Posisi:** Pindah antara lipstik, blush, dan eyeshadow; cek label kecocokan dan alasannya; bandingkan sebelum/sesudah dan beberapa shade berdampingan.
4. **Cek Foundation dan Palet:** Dapatkan kisaran foundation dan palet lengkap, lalu salin kode hex untuk dibawa ke toko mana pun.

## 🔬 Pipeline Analisis Warna

Semua ambang numerik ada di [`src/rules/thresholds.ts`](src/rules/thresholds.ts) dan merupakan **nilai awal untuk dikalibrasi**.

1. **Deteksi wajah** dengan MediaPipe Face Landmarker (478 landmark). Foto ditolak jika tidak ada wajah, wajah terlalu kecil, menoleh, atau miring.
2. **Area sampel kulit:** elips yang berjangkar pada landmark (dahi, kedua pipi, kedua area rahang), diskalakan dari jarak antar sudut luar mata.
3. **Koreksi pencahayaan:** gray-world dihitung dari piksel **di luar wajah** (agar kulit tidak membiaskan hasil), dibatasi gain 0,85–1,2, dan dilewati sama sekali untuk cast kecil (penyimpangan < 0,08) yang mungkin hanya warna latar.
4. **Aturan kewarasan area:** dahi dibuang jika jauh lebih gelap (rambut / hijab) atau jauh lebih terang (kilap / paparan berlebih) daripada pipi; area rahang dibuang jika berbayang.
5. **Estimasi warna kulit:** **median terpangkas di CIELAB** dari area yang dipakai.
6. **Depth:** L\* dicocokkan ke skala Monk 10 level, ditampilkan sebagai dua level bersebelahan (contoh "Level 5–6").
7. **Undertone:** hue angle `h = atan2(b*, a*)` dipetakan ke skor kontinu 0–1 (dengan penanganan wrap-around), ditambah label.
8. **Kontras alami:** selisih L\* antara kulit dan fitur alami (bibir, alis).
9. **Keyakinan:** dari luminansi rata-rata, konsistensi warna antar area (CIEDE2000), color cast, blur (varians Laplacian), dan ukuran wajah. Skor rendah meminta foto ulang dengan alasan spesifik.

## ⚖️ Mesin Penilaian Kecocokan

Setiap warna yang dipilih dinilai dari komponen berbasis aturan, lalu diterjemahkan menjadi label dan alasan. Bobot dan ambang berupa data di [`src/rules/fitRules.ts`](src/rules/fitRules.ts):

| Komponen | Gagasan | Bobot |
|---|---|---|
| Harmoni undertone | Seberapa dekat hue warna dengan hue ideal yang diinterpolasi antara cool dan warm menurut skor undertone user; toleransi melebar untuk undertone netral | 0,50 |
| Kontras | Selisih terang-gelap terhadap kulit dibanding yang dibutuhkan kontras alami user (per produk) | 0,25 |
| Intensitas vs konteks | Chroma terhadap rentang khusus produk dan konteks, digeser menurut depth (kulit terang → lebih lembut, kulit gelap → lebih pekat) | 0,25 |

Total ≥ 0,70 → **Selaras**, ≥ 0,45 → **Bisa dicoba**, selain itu **Kurang cocok**. Alasan berupa kalimat templat berbahasa Indonesia yang dipilih dari komponen terkuat dan terlemah. Foundation dihasilkan sebagai kisaran lewat selisih L\* dari warna kulit terukur, bukan dinilai.

## 🖌️ Rendering Try-On

Canvas 2D, dengan setiap bentuk didefinisikan **relatif terhadap landmark** (satuan jarak antar mata) agar mengikuti wajah siapa pun:

* **Bibir:** poligon dari kontur bibir; pewarnaan ulang per piksel di CIELAB yang mempertahankan variasi luminansi bibir asli (tekstur dan bayangan). Finish mengatur opasitas dan highlight.
* **Blush:** elips terarah dengan gradien radial dan feather, dicampur dengan blending *multiply* + *color*, dipotong mengikuti oval wajah.
* **Eyeshadow:** poligon kelopak yang diekstrusi di atas garis bulu mata atas, di-feather, dipudarkan (gaya gradient), dan dipotong oleh bukaan mata.
* Hanya layer yang berubah yang dirender ulang; ukuran render dibatasi untuk HP kelas menengah.

## 🛠️ Tech Stack

* **UI:** React 19, TypeScript (strict), Vite 8, CSS biasa dengan design token (terang + gelap lewat `prefers-color-scheme`), Plus Jakarta Sans lewat `@fontsource`
* **Visi:** `@mediapipe/tasks-vision` Face Landmarker, berjalan di browser (WASM disajikan dari origin aplikasi sendiri)
* **Sains warna:** konversi sRGB ↔ linear ↔ XYZ ↔ CIELAB dan CIEDE2000 buatan sendiri, diuji terhadap data referensi Sharma et al.
* **Rendering:** Canvas 2D
* **Pengujian:** Vitest (unit), Playwright (e2e viewport mobile)
* **Backend / akun / analytics:** tidak ada, sengaja

## 📁 Struktur Proyek

```
src/
  color/      # konversi warna, CIEDE2000, depth, undertone, kontras, keyakinan, bentuk wajah
  rules/      # ambang, bobot kecocokan, pembuatan palet, aturan posisi (semua data yang bisa disetel)
  vision/     # setup MediaPipe, kontur landmark, area sampel, pipeline analisis
  render/     # canvas try-on: bibir, blush, eyeshadow, overlay debug
  data/       # katalog warna, skala Monk
  ui/         # layar dan komponen (selfie, profil, try-on, foundation, palet)
e2e/          # spec Playwright
docs/         # catatan validasi dan hasil uji
scripts/      # copy-wasm.mjs
```

## 🗄️ Privasi & Arsitektur Data

* Foto dan landmark diproses **hanya di perangkat**: tidak ada yang diunggah, dan tidak ada gambar atau data wajah yang masuk ke analytics, log, atau pelacak error (semuanya tidak dipakai).
* Foto hanya ada di memori dan dibuang saat "Foto ulang" atau saat halaman ditutup.
* Yang disimpan di `localStorage` hanya pilihan bahasa dan sinyal suka/tidak opsional (produk, hex, label, dan suara), **tanpa gambar**.
* Browser mengunduh **file model** Face Landmarker dari `storage.googleapis.com` (versi dipin). Hanya modelnya yang diambil. Untuk offline penuh, taruh di `public/models/` dan set `VITE_FACE_MODEL_URL=./models/face_landmarker.task`.
* Draf kebijakan privasi di dalam aplikasi mencakup data biometrik dan penghapusan data. Perlu ditinjau ahli hukum (UU PDP) sebelum rilis publik.
* Foto uji berisi wajah: `.gitignore` mengabaikan gambar di root proyek. **Jangan pernah meng-commit foto wajah.**

## 🚀 Menjalankan Secara Lokal

Kebutuhan: Node.js yang cukup baru (dikembangkan dengan Node 24) dan browser modern (kamera membutuhkan `https` atau `localhost`).

1. **Clone repositori**

```bash
git clone https://github.com/<username-kamu>/ronaku-makeup-checker.git
cd ronaku-makeup-checker
```

2. **Pasang dependensi** (skrip `predev` / `prebuild` menyalin WASM MediaPipe ke `public/wasm` secara otomatis)

```bash
npm install
```

3. **Jalankan server pengembangan**

```bash
npm run dev
```

Buka URL yang tercetak (biasanya `http://localhost:5173`). Tambahkan `?debug=1` untuk mengaktifkan mode debug.

4. **Build untuk produksi**

```bash
npm run build      # cek tipe, lalu hasil di dist/
npm run preview
```

| Skrip | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan (menyalin WASM dulu) |
| `npm run build` | Cek tipe + build produksi |
| `npm test` | Tes unit Vitest |
| `npm run e2e` | e2e Playwright (memakai Chrome terpasang, dev server di port 5180) |

## 🧪 Pengujian & Kalibrasi

```bash
npm test           # matematika warna, CIEDE2000, depth / undertone / kontras, keyakinan, kecocokan, palet, aturan posisi
npm run e2e        # layar selfie, target sentuh, kebijakan privasi, penolakan tanpa wajah, tidak ada request non-GET
```

Jalankan Playwright **dari folder proyek** (butuh `playwright.config.ts`). Beberapa spec memakai foto wajah asli dan dilewati kecuali kamu menyediakannya:

```powershell
$env:FOTO_UJI="C:\path\ke\foto.jpg"
npx playwright test foto-uji      # mencetak angka debug (L*a*b*, hue, depth, undertone, keyakinan, area)
npx playwright test kamera-live   # kamera palsu dari foto: overlay live + hitung mundur + ambil foto
```

Untuk mengkalibrasi ambang, kumpulkan foto dengan izin dari berbagai skin tone Indonesia, kondisi cahaya, dan perangkat (dengan dan tanpa makeup), catat hasilnya di `docs/`, lalu setel `src/rules/*`. Temuan sejauh ini ada di [`docs/catatan-validasi.md`](docs/catatan-validasi.md).

## ⚠️ Keterbatasan

* **Ambang belum dikalibrasi.** Disetel dengan hanya segelintir foto dari satu set milik satu orang; label undertone mudah berpindah di dekat batas.
* **Belum ada data uji kulit gelap.** Warna kulit tan dan gelap harus divalidasi sebelum rilis, karena algoritma umum cenderung bias ke kulit terang.
* **Try-on di wajah nyata baru sebagian terverifikasi.** Rendering diperiksa dengan landmark sintetis dan beberapa foto; tinggi kelopak, posisi blush, dan nilai alpha masih nilai awal.
* **Bentuk mata manual.** Deteksi otomatis belum cukup andal.
* **Aturan hijab belum divalidasi.** Gaya yang bergantung pada area tertutup disembunyikan saat toggle hijab aktif.
* **Cahaya itu sulit.** Cahaya campuran atau berwarna, filter, dan mode beauty menurunkan keyakinan secara sengaja dan meminta foto ulang.

## 🗺️ Roadmap

* **Berikutnya:** highlighter per titik, alis, penyempurnaan bandingkan berdampingan, validasi posisi pipi.
* **Lanjutan:** contour, bronzer, eyeliner winged, saran per konteks (kantor, kondangan), aturan khusus hijab, eyeshadow cut crease.
* **Sebelum rilis:** cek domain dan merek dagang (mis. `ronaku.id`, PDKI kelas kosmetik), tinjauan hukum kebijakan privasi, kalibrasi dengan set foto yang beragam.

## 📄 Lisensi

Repositori privat. Belum ada lisensi yang dipilih; semua hak dipegang penulis sampai lisensi ditambahkan.
