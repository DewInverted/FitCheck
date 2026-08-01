/**
 * Image scanner — extracts color, pattern, category + enhances image.
 * Client-side canvas analysis.
 */

export interface ScanResult {
  dominantColor: string;
  suggestedCategory: string;
  suggestedName: string;
  suggestedPattern: string;
  enhancedImage: string; // enhanced + bg-removed version
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

/**
 * Enhanced image processing:
 * 1. Auto-contrast boost
 * 2. Background removal (make similar-to-corner pixels white)
 * 3. Slight sharpen
 */
function enhanceImage(sourceCanvas: HTMLCanvasElement, w: number, h: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(sourceCanvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  // Sample corners for background color
  const corners = [
    0, // top-left
    (w - 1) * 4, // top-right
    ((h - 1) * w) * 4, // bottom-left
    ((h - 1) * w + (w - 1)) * 4, // bottom-right
  ];

  let bgR = 0, bgG = 0, bgB = 0;
  for (const ci of corners) {
    bgR += d[ci]; bgG += d[ci + 1]; bgB += d[ci + 2];
  }
  bgR = Math.round(bgR / 4);
  bgG = Math.round(bgG / 4);
  bgB = Math.round(bgB / 4);

  // Find min/max brightness for auto-contrast
  let minB = 255, maxB = 0;
  for (let i = 0; i < d.length; i += 4) {
    const b = (d[i] + d[i + 1] + d[i + 2]) / 3;
    if (b < minB) minB = b;
    if (b > maxB) maxB = b;
  }
  const range = maxB - minB || 1;

  for (let i = 0; i < d.length; i += 4) {
    // Check if pixel is similar to background
    const diffR = Math.abs(d[i] - bgR);
    const diffG = Math.abs(d[i + 1] - bgG);
    const diffB = Math.abs(d[i + 2] - bgB);
    const totalDiff = diffR + diffG + diffB;

    if (totalDiff < 80) {
      // Background pixel → make white
      d[i] = 245; d[i + 1] = 245; d[i + 2] = 245;
    } else {
      // Auto-contrast stretch
      d[i] = Math.min(255, Math.round(((d[i] - minB) / range) * 245 + 10));
      d[i + 1] = Math.min(255, Math.round(((d[i + 1] - minB) / range) * 245 + 10));
      d[i + 2] = Math.min(255, Math.round(((d[i + 2] - minB) / range) * 245 + 10));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function detectPattern(data: Uint8ClampedArray, size: number): string {
  const margin = Math.floor(size * 0.2);
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
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  };

  const rowVar = variance(rowAvg);
  const colVar = variance(colAvg);

  // Be conservative — most clothes are solid
  // Only flag as patterned if variance is very high
  if (rowVar > 500 && colVar < 150) return "Striped";
  if (colVar > 500 && rowVar < 150) return "Striped";
  if (rowVar > 400 && colVar > 400) return "Plaid";

  // Count color clusters for graphic detection
  const colorBuckets = new Set<string>();
  for (let y = margin; y < size - margin; y += 5) {
    for (let x = margin; x < size - margin; x += 5) {
      const i = (y * size + x) * 4;
      colorBuckets.add(`${Math.floor(data[i] / 40)}-${Math.floor(data[i + 1] / 40)}-${Math.floor(data[i + 2] / 40)}`);
    }
  }

  if (colorBuckets.size > 80) return "Graphic";

  return "Solid";
}

export function scanImage(imageDataUrl: string): Promise<ScanResult> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Create analysis canvas (small)
      const aSize = 120;
      const aCanvas = document.createElement("canvas");
      aCanvas.width = aSize;
      aCanvas.height = aSize;
      const aCtx = aCanvas.getContext("2d")!;
      aCtx.drawImage(img, 0, 0, aSize, aSize);
      const aData = aCtx.getImageData(0, 0, aSize, aSize).data;

      // Center region color
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      const margin = 25;
      for (let y = margin; y < aSize - margin; y++) {
        for (let x = margin; x < aSize - margin; x++) {
          const i = (y * aSize + x) * 4;
          rSum += aData[i]; gSum += aData[i + 1]; bSum += aData[i + 2]; count++;
        }
      }
      const avgR = Math.round(rSum / count);
      const avgG = Math.round(gSum / count);
      const avgB = Math.round(bSum / count);
      const hsl = rgbToHsl(avgR, avgG, avgB);
      const colorName = mapToColorName(hsl.h, hsl.s, hsl.l);
      const avgBrightness = (avgR + avgG + avgB) / 3;
      const aspectRatio = img.height / img.width;

      // Category
      let category = "top";
      if (aspectRatio > 1.3) category = "bottom";
      else if (aspectRatio < 0.8) category = "shoes";
      else if (avgBrightness < 60) category = "outerwear";

      // Pattern
      const pattern = detectPattern(aData, aSize);

      const labels: Record<string, string> = { top: "Top", bottom: "Bottom", shoes: "Shoes", outerwear: "Outerwear" };

      // Create enhanced image (full size)
      const eCanvas = document.createElement("canvas");
      const maxDim = 600;
      let ew = img.width, eh = img.height;
      if (ew > eh) { if (ew > maxDim) { eh = (eh * maxDim) / ew; ew = maxDim; } }
      else { if (eh > maxDim) { ew = (ew * maxDim) / eh; eh = maxDim; } }
      eCanvas.width = ew;
      eCanvas.height = eh;
      const eCtx = eCanvas.getContext("2d")!;
      eCtx.drawImage(img, 0, 0, ew, eh);

      const enhancedImage = enhanceImage(eCanvas, ew, eh);

      resolve({
        dominantColor: colorName,
        suggestedCategory: category,
        suggestedName: `${colorName} ${labels[category] || "Item"}`,
        suggestedPattern: pattern,
        enhancedImage,
        confidence: 0.7,
        rawHsl: hsl,
      });
    };
    img.onerror = () => {
      resolve({
        dominantColor: "Gray", suggestedCategory: "top",
        suggestedName: "New Item", suggestedPattern: "Solid",
        enhancedImage: imageDataUrl,
        confidence: 0, rawHsl: { h: 0, s: 0, l: 50 },
      });
    };
    img.src = imageDataUrl;
  });
}
