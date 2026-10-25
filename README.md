# 💄 Rona.ku — Find Your Makeup Shade, Try It Before You Buy It

🌐 **English** | [Bahasa Indonesia](README.id.md)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ronaku.netlify.app-00C7B7?logo=netlify&logoColor=white)](https://ronaku.netlify.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Landmarker-4285F4?logo=google&logoColor=white)](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)
[![Vitest](https://img.shields.io/badge/Vitest-unit%20tests-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-e2e-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

A mobile-first web app that helps women find makeup colors that suit them and **see the result on their own face before buying**. From a single selfie it estimates a color profile (skin depth, undertone, natural contrast), lets you try lipstick, blush and eyeshadow, and hands you hex codes you can take to any store. Everything runs **on-device**: the photo never leaves the browser.

🚀 **Live Demo: [ronaku.netlify.app](https://ronaku.netlify.app/)** — open it on your phone or laptop and try it with your own selfie (processed on your device only).

> 🌐 The app is **bilingual: Indonesian and English**. Use the `ID | EN` switch at the top; it defaults to your browser language and remembers your choice. The primary audience is Indonesian women (including hijab wearers), so Indonesian is the source language.

> 🔒 **Status:** MVP plus eyeshadow try-on. All thresholds are **starting values that still need calibration** with a diverse photo set. See [Known Limitations](#-known-limitations).

## 📌 Table of Contents

* [Overview](#-overview)
* [Live Demo & Preview](#-live-demo--preview)
* [Key Features](#-key-features)
* [How It Works](#-how-it-works)
* [Color Analysis Pipeline](#-color-analysis-pipeline)
* [Fit Scoring Engine](#-fit-scoring-engine)
* [Try-On Rendering](#-try-on-rendering)
* [Tech Stack](#-tech-stack)
* [Project Structure](#-project-structure)
* [Privacy & Data Architecture](#-privacy--data-architecture)
* [Getting Started Locally](#-getting-started-locally)
* [Testing & Calibration](#-testing--calibration)
* [Known Limitations](#-known-limitations)
* [Roadmap](#-roadmap)
* [License](#-license)

## 📖 Overview

Buying the wrong foundation shade, or not knowing which lipstick and blush will actually look good, is a common problem, especially for tan and *sawo matang* (golden-brown) skin tones that generic tools often handle poorly. Rona.ku replaces guesswork with **traceable color-theory rules** instead of a black box:

* **No brands.** Output is always colors (hex code + description), never products.
* **Honest about uncertainty.** Results are estimates with a confidence level; foundation is always a **range**, never one "perfect" shade.
* **Rules, not a black box.** Fit is computed with explicit rules. An LLM is never used to decide a score.
* **Labels with reasons.** No "87% match". You get *Selaras* / *Bisa dicoba* / *Kurang cocok* plus a one- or two-sentence reason.
* **Privacy first.** A face photo is biometric data, so all processing stays on your device.
* **Suggestions, not laws.** Face shape and makeup are subjective, so every recommendation can be corrected by the user.

## 📸 Live Demo & Preview

🌐 **Try the finished app: [https://ronaku.netlify.app/](https://ronaku.netlify.app/)**

Tips for the demo: use natural light, face the camera straight on, no filters. The camera needs HTTPS (the demo has it). Add `?debug=1` to the URL to see the sample regions and the numbers behind the result.

<!--
  Add screenshots here. Use synthetic or consenting-model images only: face photos are biometric data
  and should not be committed to the repository.
  Example: <img width="390" alt="Profile screen" src="docs/screenshots/profile.png" />
-->
_Screenshots to be added._

## 🌟 Key Features

* 📷 **Live-View Selfie Capture:** The camera detects your face in real time and draws the exact skin areas that will be read (forehead, cheeks, jaw). The capture button only activates when your position is valid, and an optional 3-2-1 auto-capture countdown fires once you hold still. You can also upload a photo instead.
* 🎨 **Color Profile:** Skin depth shown as a two-level range on the 10-level Monk Skin Tone scale, a continuous undertone score (cool → warm) with a label, natural contrast (low / medium / high), and an overall confidence level with specific retake advice (too dark, yellow light, blur, uneven lighting…).
* 💋 **Lipstick Try-On:** Matte, satin and glossy finishes that preserve the natural lip texture and shadows (not a flat paint-over).
* 🌸 **Blush Try-On & Placement:** Four styles (apple, draping, sunburn, diagonal) with height / angle / size / intensity sliders, face-shape tendency (user-correctable) and a hijab toggle that hides styles depending on covered areas.
* 👁️ **Eyeshadow Try-On:** Wash and gradient styles clipped to the eyelid so the eye opening stays clean; eye shape (almond, round, hooded, monolid) is chosen manually because automatic detection is not reliable yet.
* 🔀 **Before / After & Side-by-Side Compare:** Drag a divider to compare, or view 2–4 colors next to each other, because that is where users actually decide.
* 🧴 **Foundation Range:** A four-shade range (lighter → darker) with in-store testing tips. Foundation is intentionally **not** simulated on the face.
* 🗂️ **Full Palette:** Foundation, contour, bronzer, blush, highlighter, eyeshadow, eyeliner, brows, lipstick and color correctors on one page. The palette is generated from your profile (not static), and "show all" reveals cool and bold shades too.
* 🌐 **Bilingual UI (ID / EN):** Every screen, the fit reasons, color names, error messages and the privacy policy are available in both languages. A test checks that no source string is left untranslated. Shows sample regions (used / discarded), L\*a\*b\* values, hue, depth, undertone score, per-component fit scores and confidence factors, so rules can be tuned without a makeup artist.
* 👍 **Like / Dislike Signal:** Stores only parameters (product, hex, label, vote) locally, as an early signal for tuning rules later.

## 🔄 How It Works

1. **Take a Selfie:** Follow the live guide; the app validates face size, orientation and tilt before letting you capture.
2. **Review Your Profile:** See depth, undertone, contrast and confidence. A low confidence asks for a retake with the specific reason.
3. **Try Colors & Placement:** Switch between lipstick, blush and eyeshadow; check the fit label and reasons; compare before/after and several shades side by side.
4. **Check Foundation & Palette:** Get a foundation range and a full palette, then copy the hex codes to any store.

## 🔬 Color Analysis Pipeline

All numeric thresholds live in [`src/rules/thresholds.ts`](src/rules/thresholds.ts) and are **initial values to calibrate**.

1. **Face detection** with MediaPipe Face Landmarker (478 landmarks). Reject photos with no face, a face that is too small, turned away, or tilted.
2. **Skin sample regions:** ellipses anchored to landmarks (forehead, both cheeks, both jaw areas), scaled by the distance between the outer eye corners.
3. **Lighting correction:** gray-world estimated from pixels **outside the face** (so skin does not bias it), clamped to a gain of 0.85–1.2, and skipped entirely for small casts (< 0.08 deviation) that may just be background color.
4. **Region sanity rules:** the forehead is dropped if it is much darker (hair / hijab) or much brighter (shine / over-exposure) than the cheeks; jaw areas are dropped when they are in shadow.
5. **Skin color estimate:** trimmed **median in CIELAB** over the kept regions.
6. **Depth:** L\* matched to the Monk 10-level scale, shown as two adjacent levels (e.g. "Level 5–6").
7. **Undertone:** hue angle `h = atan2(b*, a*)` mapped to a continuous 0–1 score (with wrap-around handling), plus a label.
8. **Natural contrast:** L\* difference between skin and natural features (lips, brows).
9. **Confidence:** from average luminance, color consistency across regions (CIEDE2000), color cast, blur (Laplacian variance) and face size. A low score asks for a retake with a specific reason.

## ⚖️ Fit Scoring Engine

Every chosen color is scored from rule-based components, then translated into a label and reasons. Weights and thresholds are data in [`src/rules/fitRules.ts`](src/rules/fitRules.ts):

| Component | Idea | Weight |
|---|---|---|
| Undertone harmony | How close the color's hue is to the ideal hue interpolated between cool and warm for the user's undertone score; tolerance widens for neutral undertones | 0.50 |
| Contrast | Light/dark difference to the skin vs. what the user's natural contrast calls for (per product) | 0.25 |
| Intensity vs. context | Chroma against a product- and context-specific range, shifted by depth (lighter skin → softer, deeper skin → richer) | 0.25 |

Total ≥ 0.70 → **Selaras**, ≥ 0.45 → **Bisa dicoba**, otherwise **Kurang cocok**. Reasons are templated Indonesian sentences picked from the strongest and weakest components. Foundation is generated as a range via L\* offsets from the measured skin color rather than scored.

## 🖌️ Try-On Rendering

Canvas 2D, with every shape defined **relative to landmarks** (units of inter-eye distance) so it follows any face:

* **Lips:** polygon from the lip contours; per-pixel recoloring in CIELAB that keeps the original lip luminance variation (texture and shadow). Finish controls opacity and specular highlight.
* **Blush:** directional ellipse with a radial gradient and feather, composited with *multiply* + *color* blending and clipped to the face oval.
* **Eyeshadow:** eyelid polygon extruded above the upper lash line, feathered, faded (gradient style), and cut by the eye opening.
* Only the changed layers are re-rendered; render sizes are capped for mid-range phones.

## 🛠️ Tech Stack

* **UI:** React 19, TypeScript (strict), Vite 8, plain CSS with design tokens (light + dark via `prefers-color-scheme`), Plus Jakarta Sans via `@fontsource`
* **Vision:** `@mediapipe/tasks-vision` Face Landmarker, running in the browser (WASM served from the app's own origin)
* **Color science:** custom sRGB ↔ linear ↔ XYZ ↔ CIELAB conversions and CIEDE2000, with unit tests against the Sharma et al. reference data
* **Rendering:** Canvas 2D
* **Testing:** Vitest (unit), Playwright (mobile viewport e2e)
* **Backend / accounts / analytics:** none by design

## 📁 Project Structure

```
src/
  color/      # color conversions, CIEDE2000, depth, undertone, contrast, confidence, face shape
  rules/      # thresholds, fit weights, palette generation, position rules (all tunable data)
  vision/     # MediaPipe setup, landmark contours, sample regions, analysis pipeline
  render/     # try-on canvas: lips, blush, eyeshadow, debug overlay
  data/       # color catalog, Monk scale
  ui/         # screens and components (selfie, profile, try-on, foundation, palette)
e2e/          # Playwright specs
docs/         # validation notes and test results
scripts/      # copy-wasm.mjs
```

## 🗄️ Privacy & Data Architecture

* The photo and landmarks are processed **on the device only**: nothing is uploaded, and no image or face data goes to analytics, logs or error trackers (none are used).
* The photo lives in memory only and is discarded on "retake" or when the page closes.
* The only things persisted in `localStorage` are your language choice and the optional like/dislike signal (product, hex, label and vote), with **no image**.
* The browser downloads the Face Landmarker **model file** from `storage.googleapis.com` (pinned version). Only the model is fetched. For fully offline use, put it in `public/models/` and set `VITE_FACE_MODEL_URL=./models/face_landmarker.task`.
* An in-app privacy policy draft covers biometric data and deletion. It should be reviewed by a legal professional (Indonesia's PDP Law) before any public release.
* Test photos contain faces: `.gitignore` excludes images in the project root. **Never commit face photos.**

## 🚀 Getting Started Locally

Requirements: a recent Node.js (developed on Node 24) and a modern browser (camera access needs `https` or `localhost`).

1. **Clone the repository**

```bash
git clone https://github.com/<your-username>/ronaku-makeup-checker.git
cd ronaku-makeup-checker
```

2. **Install dependencies** (the `predev` / `prebuild` scripts copy the MediaPipe WASM to `public/wasm` automatically)

```bash
npm install
```

3. **Run the dev server**

```bash
npm run dev
```

Open the printed URL (usually `http://localhost:5173`). Append `?debug=1` to enable debug mode.

4. **Build for production**

```bash
npm run build      # type-checks, then outputs to dist/
npm run preview
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server (copies WASM first) |
| `npm run build` | Type-check + production build |
| `npm test` | Vitest unit tests |
| `npm run e2e` | Playwright e2e (uses your installed Chrome, dev server on port 5180) |

## 🧪 Testing & Calibration

```bash
npm test           # color math, CIEDE2000, depth / undertone / contrast, confidence, fit, palette, position rules
npm run e2e        # selfie screen, touch targets, privacy policy, no-face rejection, no non-GET requests
```

Run Playwright **from the project folder** (it needs `playwright.config.ts`). Some specs use a real face photo and are skipped unless you provide one:

```powershell
$env:FOTO_UJI="C:\path\to\photo.jpg"
npx playwright test foto-uji      # prints debug numbers (L*a*b*, hue, depth, undertone, confidence, regions)
npx playwright test kamera-live   # fake camera from the photo: live overlay + countdown + capture
```

To calibrate thresholds, collect consented photos across Indonesian skin tones, lighting conditions and devices (with and without makeup), record results in `docs/`, and tune `src/rules/*`. Findings so far are in [`docs/catatan-validasi.md`](docs/catatan-validasi.md).

## ⚠️ Known Limitations

* **Thresholds are uncalibrated.** They were adjusted using only a handful of photos from one person's set; undertone labels flip easily near boundaries.
* **No deep-skin test data yet.** Tan and dark skin tones must be validated before release, since general algorithms tend to be biased toward light skin.
* **Try-on on real faces is only partly verified.** Rendering was checked on synthetic landmarks and a few photos; eyelid height, blush position and alpha values are initial.
* **Eye shape is manual.** Automatic detection is not reliable enough.
* **Hijab rules are not validated.** Styles that depend on covered areas are hidden when the hijab toggle is on.
* **Lighting is hard.** Mixed or colored light, filters and beauty modes lower confidence by design and ask for a retake.

## 🗺️ Roadmap

* **Next:** per-point highlighter, brows, side-by-side compare refinements, cheek placement validation.
* **Later:** contour, bronzer, winged eyeliner, per-occasion suggestions (office, formal event), dedicated hijab rules, cut-crease eyeshadow.
* **Before release:** domain and trademark check (e.g. `ronaku.id`, PDKI cosmetics class), legal review of the privacy policy, calibration with a diverse photo set.

## 📄 License

Private repository. No license has been chosen yet; all rights reserved by the author until one is added.
