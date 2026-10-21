import { describe, expect, it } from "vitest";
import { deltaE2000, hexToLab, hexToRgb, hueAngle, labToRgb, rgbToHex, rgbToLab } from "./convert";
import {
  assessConfidence,
  classifyFaceShape,
  contrastFromL,
  depthFromL,
  grayWorldGains,
  trimmedMedianLab,
  undertoneFromHue,
} from "./skin";

describe("konversi warna", () => {
  it("putih, hitam, abu-abu", () => {
    expect(rgbToLab(255, 255, 255).L).toBeCloseTo(100, 1);
    expect(rgbToLab(0, 0, 0).L).toBeCloseTo(0, 5);
    expect(rgbToLab(128, 128, 128).L).toBeCloseTo(53.585, 1);
  });
  it("hex <-> rgb", () => {
    expect(hexToRgb("#A07E56")).toEqual([160, 126, 86]);
    expect(rgbToHex([160, 126, 86])).toBe("#A07E56");
  });
  it("Lab -> RGB bolak-balik", () => {
    for (const hex of ["#C29A74", "#E9967A", "#292420", "#F6EDE4"]) {
      const back = rgbToHex(labToRgb(hexToLab(hex)));
      const d = hexToRgb(hex).map((v, i) => Math.abs(v - hexToRgb(back)[i]));
      expect(Math.max(...d)).toBeLessThanOrEqual(1);
    }
  });
  it("sRGB merah -> Lab sesuai referensi", () => {
    const lab = rgbToLab(255, 0, 0);
    expect(lab.L).toBeCloseTo(53.24, 1);
    expect(lab.a).toBeCloseTo(80.09, 0);
    expect(lab.b).toBeCloseTo(67.2, 0);
  });
  it("hue angle", () => {
    expect(hueAngle({ L: 50, a: 10, b: 10 })).toBeCloseTo(45, 5);
    expect(hueAngle({ L: 50, a: 10, b: -10 })).toBeCloseTo(315, 5);
  });
});

describe("CIEDE2000 (data uji Sharma et al.)", () => {
  const de = (a: number[], b: number[]) =>
    deltaE2000({ L: a[0], a: a[1], b: a[2] }, { L: b[0], a: b[1], b: b[2] });
  it("pasangan 1", () => expect(de([50, 2.6772, -79.7751], [50, 0, -82.7485])).toBeCloseTo(2.0425, 3));
  it("pasangan 2", () => expect(de([50, 3.1571, -77.2803], [50, 0, -82.7485])).toBeCloseTo(2.8615, 3));
  it("pasangan 25", () => expect(de([60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387])).toBeCloseTo(1.2644, 3));
  it("simetris dan nol untuk warna sama", () => {
    const a = hexToLab("#C29A74");
    const b = hexToLab("#B08863");
    expect(deltaE2000(a, a)).toBe(0);
    expect(deltaE2000(a, b)).toBeCloseTo(deltaE2000(b, a), 6);
  });
});

describe("analisis kulit", () => {
  it("depth: dua level bersebelahan", () => {
    const d = depthFromL(hexToLab("#A07E56").L);
    expect(d.nearest).toBe(6);
    expect(d.levels[1] - d.levels[0]).toBe(1);
    expect(d.levels).toContain(6);
  });
  it("depth: terang dan gelap ekstrem", () => {
    expect(depthFromL(95).levels[0]).toBeLessThanOrEqual(3);
    expect(depthFromL(15).levels[1]).toBe(10);
  });
  it("undertone: skor kontinu dan monoton", () => {
    expect(undertoneFromHue(30).score).toBe(0);
    expect(undertoneFromHue(90).score).toBe(1);
    expect(undertoneFromHue(55).score).toBeGreaterThan(undertoneFromHue(48).score);
    expect(undertoneFromHue(349).score).toBe(0); // hue di sisi merah-ungu harus cool, bukan warm
    expect(undertoneFromHue(30).key).toBe("cool");
    expect(undertoneFromHue(90).key).toBe("warm");
  });
  it("kontras", () => {
    expect(contrastFromL(60, 55).level).toBe("rendah");
    expect(contrastFromL(60, 32).level).toBe("sedang");
    expect(contrastFromL(70, 25).level).toBe("tinggi");
  });
  it("median terpangkas tahan outlier", () => {
    const labs = Array.from({ length: 100 }, () => ({ L: 60, a: 15, b: 20 }));
    labs.push({ L: 5, a: 0, b: 0 }, { L: 99, a: 0, b: 0 });
    const m = trimmedMedianLab(labs);
    expect(m.L).toBeCloseTo(60, 5);
  });
  it("gray-world dibatasi dan mendeteksi cast", () => {
    const { gains, deviation } = grayWorldGains([200, 150, 90]);
    expect(Math.max(...gains)).toBeLessThanOrEqual(1.2);
    expect(Math.min(...gains)).toBeGreaterThanOrEqual(0.85);
    expect(deviation).toBeGreaterThan(0.2);
  });
  it("cast kecil tidak dikoreksi, tetap dilaporkan", () => {
    const { gains, deviation } = grayWorldGains([130, 128, 120]);
    expect(gains).toEqual([1, 1, 1]);
    expect(deviation).toBeGreaterThan(0.02);
  });
});

describe("keyakinan", () => {
  const good = { meanL: 62, spreadDeltaE: 3, castDeviation: 0.04, blurVar: 150, faceWidthFrac: 0.55, samplePixels: 5000 };
  it("foto bagus -> Tinggi", () => expect(assessConfidence(good).level).toBe("Tinggi"));
  it("gelap + cast kuat + buram -> Rendah dengan alasan", () => {
    const c = assessConfidence({ ...good, meanL: 20, castDeviation: 0.3, blurVar: 10 });
    expect(c.level).toBe("Rendah");
    expect(c.reasons.length).toBeGreaterThanOrEqual(3);
  });
  it("satu masalah ringan -> Sedang", () => {
    expect(assessConfidence({ ...good, spreadDeltaE: 8 }).level).toBe("Sedang");
  });
});

describe("bentuk wajah", () => {
  it("rasio panjang -> panjang, lebar -> bulat", () => {
    expect(classifyFaceShape({ height: 200, cheek: 120, jaw: 90, forehead: 100 }).key).toBe("panjang");
    expect(classifyFaceShape({ height: 150, cheek: 120, jaw: 95, forehead: 100 }).key).toBe("bulat");
    expect(classifyFaceShape({ height: 165, cheek: 120, jaw: 95, forehead: 100 }).key).toBe("oval");
  });
});
