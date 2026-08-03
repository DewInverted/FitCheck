/**
 * Enhanced image scanner — detects color, pattern, category from a clothing photo.
 * Better color detection with expanded color vocabulary.
 */

export interface ScanResult {
  dominantColor: string;
  suggestedCategory: string;
  suggestedName: string;
  suggestedPattern: string;
  confidence: number;
  rawHsl: { h: number; s: number; l: number };
}

const COLOR_MAP: { name: string; hMin: number; hMax: number; sMin: number; sMax: number; lMin: number; lMax: number }[] = [
  // Reds
  { name: "Red", hMin: 350, hMax: 360, sMin: 40, sMax: 100, lMin: 25, lMax: 55 },
  { name: "Red", hMin: 0, hMax: 12, sMin: 40, sMax: 100, lMin: 25, lMax: 55 },
  { name: "Crimson", hMin: 348, hMax: 360, sMin: 60, sMax: 100, lMin: 35, lMax: 55 },
  { name: "Burgundy", hMin: 340, hMax: 360, sMin: 30, sMax: 80, lMin: 12, lMax: 30 },
  { name: "Maroon", hMin: 0, hMax: 15, sMin: 30, sMax: 80, lMin: 10, lMax: 25 },
  { name: "Rust", hMin: 10, hMax: 25, sMin: 40, sMax: 80, lMin: 20, lMax: 40 },
  { name: "Coral", hMin: 5, hMax: 20, sMin: 50, sMax: 100, lMin: 55, lMax: 75 },
  { name: "Salmon", hMin: 5, hMax: 20, sMin: 40, sMax: 80, lMin: 60, lMax: 80 },
  // Oranges
  { name: "Orange", hMin: 20, hMax: 38, sMin: 50, sMax: 100, lMin: 35, lMax: 65 },
  { name: "Terracotta", hMin: 15, hMax: 28, sMin: 30, sMax: 60, lMin: 25, lMax: 45 },
  { name: "Peach", hMin: 20, hMax: 35, sMin: 40, sMax: 80, lMin: 65, lMax: 85 },
  // Yellows
  { name: "Yellow", hMin: 45, hMax: 62, sMin: 50, sMax: 100, lMin: 45, lMax: 80 },
  { name: "Mustard", hMin: 38, hMax: 50, sMin: 40, sMax: 90, lMin: 30, lMax: 55 },
  { name: "Gold", hMin: 40, hMax: 52, sMin: 50, sMax: 100, lMin: 35, lMax: 55 },
  { name: "Cream", hMin: 35, hMax: 55, sMin: 15, sMax: 45, lMin: 75, lMax: 92 },
  { name: "Champagne", hMin: 35, hMax: 50, sMin: 20, sMax: 50, lMin: 70, lMax: 88 },
  // Greens
  { name: "Lime", hMin: 68, hMax: 85, sMin: 40, sMax: 100, lMin: 35, lMax: 65 },
  { name: "Green", hMin: 85, hMax: 150, sMin: 25, sMax: 100, lMin: 20, lMax: 60 },
  { name: "Sage", hMin: 80, hMax: 140, sMin: 10, sMax: 35, lMin: 45, lMax: 70 },
  { name: "Mint", hMin: 140, hMax: 170, sMin: 25, sMax: 70, lMin: 55, lMax: 80 },
  { name: "Forest Green", hMin: 100, hMax: 150, sMin: 30, sMax: 80, lMin: 10, lMax: 30 },
  { name: "Olive", hMin: 60, hMax: 95, sMin: 15, sMax: 55, lMin: 20, lMax: 45 },
  { name: "Emerald", hMin: 140, hMax: 165, sMin: 40, sMax: 100, lMin: 25, lMax: 50 },
  { name: "Teal", hMin: 170, hMax: 195, sMin: 25, sMax: 100, lMin: 20, lMax: 55 },
  // Blues
  { name: "Sky Blue", hMin: 195, hMax: 210, sMin: 35, sMax: 80, lMin: 60, lMax: 82 },
  { name: "Blue", hMin: 200, hMax: 235, sMin: 30, sMax: 100, lMin: 30, lMax: 60 },
  { name: "Cobalt", hMin: 220, hMax: 240, sMin: 50, sMax: 100, lMin: 30, lMax: 55 },
  { name: "Navy", hMin: 210, hMax: 250, sMin: 25, sMax: 100, lMin: 8, lMax: 28 },
  { name: "Royal Blue", hMin: 225, hMax: 245, sMin: 50, sMax: 100, lMin: 35, lMax: 55 },
  { name: "Denim", hMin: 200, hMax: 230, sMin: 15, sMax: 55, lMin: 30, lMax: 55 },
  { name: "Powder Blue", hMin: 200, hMax: 220, sMin: 25, sMax: 60, lMin: 70, lMax: 88 },
  // Purples
  { name: "Indigo", hMin: 250, hMax: 270, sMin: 30, sMax: 80, lMin: 15, lMax: 40 },
  { name: "Purple", hMin: 265, hMax: 295, sMin: 25, sMax: 100, lMin: 20, lMax: 55 },
  { name: "Lavender", hMin: 265, hMax: 290, sMin: 20, sMax: 60, lMin: 60, lMax: 82 },
  { name: "Plum", hMin: 290, hMax: 320, sMin: 20, sMax: 60, lMin: 15, lMax: 40 },
  { name: "Mauve", hMin: 290, hMax: 340, sMin: 15, sMax: 40, lMin: 45, lMax: 65 },
  // Pinks
  { name: "Pink", hMin: 320, hMax: 350, sMin: 25, sMax: 100, lMin: 50, lMax: 82 },
  { name: "Hot Pink", hMin: 320, hMax: 340, sMin: 60, sMax: 100, lMin: 40, lMax: 60 },
  { name: "Blush", hMin: 340, hMax: 360, sMin: 20, sMax: 50, lMin: 70, lMax: 88 },
  { name: "Rose", hMin: 340, hMax: 355, sMin: 30, sMax: 70, lMin: 45, lMax: 65 },
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
  // Achromatic checks first
  if (s < 8) {
    if (l < 10) return "Black";
    if (l < 20) return "Charcoal";
    if (l < 35) return "Slate";
    if (l < 50) return "Gray";
    if (l < 65) return "Silver";
    if (l > 92) return "White";
    if (l > 82) return "Ivory";
    return "Gray";
  }
  
  // Very dark = black-ish
  if (l < 8) return "Black";
  if (l > 93) return "White";
  
  // Low sat neutrals
  if (s < 15) {
    if (l < 15) return "Charcoal";
    if (l < 30) return "Slate";
    if (l > 80) return "Ivory";
    if (l > 65) return "Cream";
    return "Gray";
  }
  
  // Brown / beige / khaki / tan / sand / taupe
  if (h >= 20 && h <= 50 && s < 45) {
    if (l > 75) return "Cream";
    if (l > 65) return "Sand";
    if (l > 55) return "Beige";
    if (l > 45) return "Tan";
    if (l > 35) return "Khaki";
    if (l > 25) return "Brown";
    return "Brown";
  }
  if (h >= 10 && h <= 30 && s >= 20 && s < 55 && l >= 15 && l <= 45) return "Brown";
  if (h >= 25 && h <= 55 && s >= 10 && s < 35 && l >= 55 && l <= 75) return "Beige";
  if (h >= 35 && h <= 55 && s < 30 && l >= 40 && l <= 60) return "Khaki";
  if (h >= 15 && h <= 40 && s >= 15 && s < 55 && l > 20 && l < 40) return "Brown";
  if (h >= 20 && h <= 40 && s >= 12 && s < 35 && l >= 40 && l < 60) return "Taupe";
  if (h >= 10 && h <= 30 && s >= 15 && s < 50 && l >= 10 && l < 25) return "Espresso";
  if (h >= 15 && h <= 35 && s >= 20 && s < 50 && l >= 30 && l < 50) return "Camel";
  
  // Check detailed color map
  for (const c of COLOR_MAP) {
    const hInRange = c.hMin <= c.hMax 
      ? (h >= c.hMin && h <= c.hMax) 
      : (h >= c.hMin || h <= c.hMax);
    if (hInRange && s >= c.sMin && s <= c.sMax && l >= c.lMin && l <= c.lMax) {
      return c.name;
    }
  }
  
  // Fallback by hue ranges
  if (l < 20) return "Black";
  if (l > 78) return "White";
  
  if (h < 15 || h >= 350) return "Red";
  if (h < 40) return "Orange";
  if (h < 65) return "Yellow";
  if (h < 170) return "Green";
  if (h < 200) return "Teal";
  if (h < 250) return "Blue";
  if (h < 300) return "Purple";
  return "Pink";
}

function detectPattern(data: Uint8ClampedArray, size: number): string {
  const margin = Math.floor(size * 0.25);
  const regionSize = size - margin * 2;
  if (regionSize <= 0) return "Solid";

  const rowAvg: number[] = [];
  const colAvg: number[] = [];
  for (let y = margin; y < size - margin; y++) {
    let sum = 0;
    for (let x = margin; x < size - margin; x++) {
      const i = (y * size + x) * 4;
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    rowAvg.push(sum / regionSize);
  }
  for (let x = margin; x < size - margin; x++) {
    let sum = 0;
    for (let y = margin; y < size - margin; y++) {
      const i = (y * size + x) * 4;
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    colAvg.push(sum / regionSize);
  }

  const variance = (arr: number[]) => {
    if (!arr.length) return 0;
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  };
  const rowVar = variance(rowAvg);
  const colVar = variance(colAvg);

  if (rowVar > 600 && colVar < 200) return "Striped";
  if (colVar > 600 && rowVar < 200) return "Striped";
  if (rowVar > 500 && colVar > 500) return "Plaid";

  const colorBuckets = new Set<string>();
  for (let y = margin; y < size - margin; y += 6) {
    for (let x = margin; x < size - margin; x += 6) {
      const i = (y * size + x) * 4;
      colorBuckets.add(
        `${Math.floor(data[i] / 48)}-${Math.floor(data[i + 1] / 48)}-${Math.floor(data[i + 2] / 48)}`
      );
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
      const size = 150; // slightly larger for better accuracy
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Use k-means-like approach: sample center region and find dominant cluster
      const margin = 35;
      const samples: { r: number; g: number; b: number }[] = [];
      
      for (let y = margin; y < size - margin; y += 2) {
        for (let x = margin; x < size - margin; x += 2) {
          const i = (y * size + x) * 4;
          const a = data[i + 3];
          if (a < 128) continue; // skip transparent
          samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
      }

      if (samples.length === 0) {
        resolve({
          dominantColor: "Gray",
          suggestedCategory: "top",
          suggestedName: "New Item",
          suggestedPattern: "Solid",
          confidence: 0,
          rawHsl: { h: 0, s: 0, l: 50 },
        });
        return;
      }

      // Weighted average favoring center pixels
      let rSum = 0, gSum = 0, bSum = 0, wSum = 0;
      const cx = (size - 2 * margin) / 2;
      const cy = (size - 2 * margin) / 2;
      
      for (let idx = 0; idx < samples.length; idx++) {
        const sx = idx % Math.floor((size - 2 * margin) / 2);
        const sy = Math.floor(idx / Math.floor((size - 2 * margin) / 2));
        const dx = sx - cx;
        const dy = sy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const w = 1 / (1 + dist * 0.02);
        rSum += samples[idx].r * w;
        gSum += samples[idx].g * w;
        bSum += samples[idx].b * w;
        wSum += w;
      }

      const avgR = Math.round(rSum / wSum);
      const avgG = Math.round(gSum / wSum);
      const avgB = Math.round(bSum / wSum);
      const hsl = rgbToHsl(avgR, avgG, avgB);
      const colorName = mapToColorName(hsl.h, hsl.s, hsl.l);
      const avgBrightness = (avgR + avgG + avgB) / 3;
      const aspectRatio = img.height / img.width;

      let category = "top";
      if (aspectRatio > 1.3) category = "bottom";
      else if (aspectRatio < 0.8) category = "shoes";
      else if (avgBrightness < 55) category = "outerwear";

      const pattern = detectPattern(data, size);
      const labels: Record<string, string> = {
        top: "Top",
        bottom: "Bottom",
        shoes: "Shoes",
        outerwear: "Outerwear",
      };

      resolve({
        dominantColor: colorName,
        suggestedCategory: category,
        suggestedName: `${colorName} ${labels[category] || "Item"}`,
        suggestedPattern: pattern,
        confidence: 0.75,
        rawHsl: hsl,
      });
    };
    img.onerror = () => {
      resolve({
        dominantColor: "Gray",
        suggestedCategory: "top",
        suggestedName: "New Item",
        suggestedPattern: "Solid",
        confidence: 0,
        rawHsl: { h: 0, s: 0, l: 50 },
      });
    };
    img.src = imageDataUrl;
  });
}
