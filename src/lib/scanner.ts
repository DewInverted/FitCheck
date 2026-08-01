/**
 * Image scanner — detects color, pattern, category from a clothing photo.
 * No image manipulation — keeps the original photo clean.
 */

export interface ScanResult {
  dominantColor: string;
  suggestedCategory: string;
  suggestedName: string;
  suggestedPattern: string;
  confidence: number;
  rawHsl: { h: number; s: number; l: number };
}

const COLOR_MAP: { name: string; hMin: number; hMax: number; sMin: number; lMin: number; lMax: number }[] = [
  { name: "Red",      hMin: 345, hMax: 360, sMin: 25, lMin: 15, lMax: 70 },
  { name: "Red",      hMin: 0,   hMax: 15,  sMin: 25, lMin: 15, lMax: 70 },
  { name: "Orange",   hMin: 15,  hMax: 40,  sMin: 30, lMin: 25, lMax: 75 },
  { name: "Yellow",   hMin: 40,  hMax: 65,  sMin: 30, lMin: 25, lMax: 80 },
  { name: "Green",    hMin: 65,  hMax: 170, sMin: 15, lMin: 15, lMax: 70 },
  { name: "Teal",     hMin: 170, hMax: 195, sMin: 15, lMin: 15, lMax: 65 },
  { name: "Blue",     hMin: 195, hMax: 240, sMin: 20, lMin: 15, lMax: 65 },
  { name: "Navy",     hMin: 210, hMax: 250, sMin: 20, lMin: 8,  lMax: 30 },
  { name: "Purple",   hMin: 260, hMax: 300, sMin: 15, lMin: 15, lMax: 70 },
  { name: "Pink",     hMin: 300, hMax: 345, sMin: 20, lMin: 30, lMax: 80 },
  { name: "Burgundy", hMin: 340, hMax: 360, sMin: 25, lMin: 10, lMax: 35 },
  { name: "Olive",    hMin: 60,  hMax: 100, sMin: 10, lMin: 20, lMax: 45 },
  { name: "Denim",    hMin: 200, hMax: 230, sMin: 15, lMin: 30, lMax: 55 },
];

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function mapToColorName(h: number, s: number, l: number): string {
  if (s < 10) {
    if (l < 15) return "Black";
    if (l < 35) return "Charcoal";
    if (l > 85) return "White";
    if (l > 70) return "Cream";
    return "Gray";
  }
  if (l < 12) return "Black";
  if (l > 88) return "White";
  if (h >= 25 && h <= 50 && s < 40 && l > 55 && l < 85) return "Beige";
  if (h >= 30 && h <= 50 && s < 35 && l > 40 && l < 60) return "Khaki";
  if (h >= 15 && h <= 40 && s < 50 && l > 20 && l < 45) return "Brown";
  for (const c of COLOR_MAP) {
    if (h >= c.hMin && h <= c.hMax && s >= c.sMin && l >= c.lMin && l <= c.lMax) return c.name;
  }
  if (l < 25) return "Black";
  if (l > 75) return "White";
  return "Gray";
}

function detectPattern(data: Uint8ClampedArray, size: number): string {
  const margin = Math.floor(size * 0.25);
  const regionSize = size - margin * 2;
  if (regionSize <= 0) return "Solid";

  const rowAvg: number[] = [];
  const colAvg: number[] = [];
  for (let y = margin; y < size - margin; y++) {
    let sum = 0;
    for (let x = margin; x < size - margin; x++) { const i = (y * size + x) * 4; sum += (data[i] + data[i + 1] + data[i + 2]) / 3; }
    rowAvg.push(sum / regionSize);
  }
  for (let x = margin; x < size - margin; x++) {
    let sum = 0;
    for (let y = margin; y < size - margin; y++) { const i = (y * size + x) * 4; sum += (data[i] + data[i + 1] + data[i + 2]) / 3; }
    colAvg.push(sum / regionSize);
  }

  const variance = (arr: number[]) => { if (!arr.length) return 0; const m = arr.reduce((a, b) => a + b, 0) / arr.length; return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length; };
  const rowVar = variance(rowAvg);
  const colVar = variance(colAvg);

  // Very conservative — most clothes are solid
  if (rowVar > 600 && colVar < 200) return "Striped";
  if (colVar > 600 && rowVar < 200) return "Striped";
  if (rowVar > 500 && colVar > 500) return "Plaid";

  const colorBuckets = new Set<string>();
  for (let y = margin; y < size - margin; y += 6) {
    for (let x = margin; x < size - margin; x += 6) {
      const i = (y * size + x) * 4;
      colorBuckets.add(`${Math.floor(data[i] / 48)}-${Math.floor(data[i + 1] / 48)}-${Math.floor(data[i + 2] / 48)}`);
    }
  }
  if (colorBuckets.size > 100) return "Graphic";

  return "Solid";
}

export function scanImage(imageDataUrl: string): Promise<ScanResult> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = 120;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      const margin = 30;
      for (let y = margin; y < size - margin; y++) {
        for (let x = margin; x < size - margin; x++) {
          const i = (y * size + x) * 4;
          rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2]; count++;
        }
      }
      const avgR = Math.round(rSum / count), avgG = Math.round(gSum / count), avgB = Math.round(bSum / count);
      const hsl = rgbToHsl(avgR, avgG, avgB);
      const colorName = mapToColorName(hsl.h, hsl.s, hsl.l);
      const avgBrightness = (avgR + avgG + avgB) / 3;
      const aspectRatio = img.height / img.width;

      let category = "top";
      if (aspectRatio > 1.3) category = "bottom";
      else if (aspectRatio < 0.8) category = "shoes";
      else if (avgBrightness < 55) category = "outerwear";

      const pattern = detectPattern(data, size);
      const labels: Record<string, string> = { top: "Top", bottom: "Bottom", shoes: "Shoes", outerwear: "Outerwear" };

      resolve({ dominantColor: colorName, suggestedCategory: category, suggestedName: `${colorName} ${labels[category] || "Item"}`, suggestedPattern: pattern, confidence: 0.7, rawHsl: hsl });
    };
    img.onerror = () => {
      resolve({ dominantColor: "Gray", suggestedCategory: "top", suggestedName: "New Item", suggestedPattern: "Solid", confidence: 0, rawHsl: { h: 0, s: 0, l: 50 } });
    };
    img.src = imageDataUrl;
  });
}
