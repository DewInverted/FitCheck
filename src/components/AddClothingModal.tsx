"use client";

import { useState, useRef, useCallback } from "react";
import {
  PREDEFINED_COLORS, CATEGORIES, SUBCATEGORIES,
  OCCASIONS, SEASONS, PATTERNS, FIT_TYPES,
} from "@/lib/colors";
import { scanImage } from "@/lib/scanner";

interface Props { onClose: () => void; onSaved: () => void; }

export default function AddClothingModal({ onClose, onSaved }: Props) {
  const [step, setStep] = useState(1);
  const [imageData, setImageData] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [pattern, setPattern] = useState("");
  const [fit, setFit] = useState("");
  const [season, setSeason] = useState("");
  const [occasion, setOccasion] = useState("");
  const [brand, setBrand] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const onImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 800;
        let { width: w, height: h } = img;
        if (w > h) { if (w > max) { h = (h * max) / w; w = max; } }
        else { if (h > max) { w = (w * max) / h; h = max; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setImageData(compressed);
        setScanning(true);
        scanImage(compressed).then((scan) => {
          setImageData(scan.enhancedImage);
          setPrimaryColor(scan.dominantColor);
          setCategory(scan.suggestedCategory);
          setName(scan.suggestedName);
          setPattern(scan.suggestedPattern);
          setScanning(false);
          setScanDone(true);
          setStep(2);
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = async () => {
    if (!imageData || !name || !category || !primaryColor) { setError("Fill in all required fields"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/clothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, category, subcategory, primaryColor,
          secondaryColor: secondaryColor || null,
          pattern: pattern || null,
          fit: fit || null,
          season: season || null,
          occasion: occasion || null,
          brand: brand || null,
          imageData, tags: [],
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  };

  const fitOptions = FIT_TYPES[category] || null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[92vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-zinc-300 mx-auto mt-3" />
          <div className="flex items-center justify-between px-5 py-3">
            <button onClick={onClose} className="text-[14px] text-zinc-400 font-medium">Cancel</button>
            <p className="text-[14px] font-semibold text-zinc-900">
              {step === 1 ? "Scan Item" : step === 2 ? "Details" : "Style & Fit"}
            </p>
            <span className="text-[12px] text-zinc-300 font-medium">{step}/3</span>
          </div>
          <div className="h-[2px] bg-zinc-100">
            <div className="h-full bg-zinc-900 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        <div className="p-5">
          {/* Step 1: Scan */}
          {step === 1 && !scanning && (
            <div className="space-y-4 animate-fade-up">
              <div className="text-center mb-2">
                <p className="text-[15px] font-semibold text-zinc-800">Take a photo of your item</p>
                <p className="text-[12px] text-zinc-400 mt-1">We&apos;ll detect color, pattern &amp; type</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => camRef.current?.click()}
                  className="aspect-square rounded-2xl border border-dashed border-zinc-300 flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 active:scale-95 transition-all">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="text-[13px] font-medium text-zinc-500">Camera</span>
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-2xl border border-dashed border-zinc-300 flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 active:scale-95 transition-all">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-[13px] font-medium text-zinc-500">Gallery</span>
                </button>
              </div>
              <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onImage} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImage} />
            </div>
          )}

          {/* Scanning */}
          {scanning && imageData && (
            <div className="text-center py-6 animate-fade-in">
              <div className="relative w-44 h-44 mx-auto mb-6">
                <img src={imageData} alt="" className="w-full h-full object-cover rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan-line" />
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/50 animate-pulse" />
              </div>
              <p className="text-[14px] font-semibold text-zinc-700">Scanning item...</p>
              <p className="text-[12px] text-zinc-400 mt-1">Detecting color, pattern &amp; type</p>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-up">
              {imageData && (
                <div className="flex gap-4 items-start">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
                    <img src={imageData} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => { setImageData(null); setStep(1); setScanDone(false); setFit(""); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/40 rounded-full flex items-center justify-center text-white text-[9px]">✕</button>
                  </div>
                  {scanDone && (
                    <div className="pt-0.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <span className="text-[11px] font-semibold text-green-600">Detected</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        <strong className="text-zinc-600">{primaryColor}</strong> · {pattern} · {CATEGORIES.find(c => c.value === category)?.label || category}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Black Oversized Tee"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-[14px] focus:outline-none focus:border-zinc-400 placeholder:text-zinc-300" />
              </div>

              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button key={c.value} onClick={() => { setCategory(c.value); setSubcategory(""); setFit(""); }}
                      className={`h-9 px-3.5 rounded-full text-[12px] font-medium transition-all active:scale-95 ${
                        category === c.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}>{c.label}</button>
                  ))}
                </div>
              </div>

              {category && SUBCATEGORIES[category] && (
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUBCATEGORIES[category].map((s) => (
                      <button key={s} onClick={() => setSubcategory(s)}
                        className={`h-8 px-3 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                          subcategory === s ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fit selector — shows for tops, bottoms, outerwear */}
              {fitOptions && (
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Fit</label>
                  <div className="flex flex-wrap gap-1.5">
                    {fitOptions.map((f) => (
                      <button key={f} onClick={() => setFit(fit === f ? "" : f)}
                        className={`h-8 px-3 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                          fit === f ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}>{f}</button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Brand (optional)</label>
                <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Nike, Uniqlo, Bench..."
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-[14px] focus:outline-none focus:border-zinc-400 placeholder:text-zinc-300" />
              </div>

              {error && <p className="text-[12px] text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setStep(1); setScanDone(false); }} className="flex-1 h-11 rounded-xl bg-zinc-100 text-zinc-600 text-[13px] font-medium active:scale-[0.97] transition-all">Back</button>
                <button onClick={() => {
                  if (!name || !category) { setError("Name and category required"); return; }
                  setError(""); setStep(3);
                }} className="flex-1 h-11 rounded-xl bg-zinc-900 text-white text-[13px] font-semibold active:scale-[0.97] transition-all">Next</button>
              </div>
            </div>
          )}

          {/* Step 3: Colors & Style */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-up">
              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">
                  Main color {scanDone && <span className="text-green-500 text-[10px] ml-1">● detected</span>}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_COLORS.map((cl) => (
                    <button key={cl} onClick={() => setPrimaryColor(cl)}
                      className={`h-8 px-3 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 active:scale-95 ${
                        primaryColor === cl ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}>
                      <span className="w-2.5 h-2.5 rounded-full border border-zinc-300" style={{ backgroundColor: colorHex(cl) }} />{cl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Second color (optional)</label>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSecondaryColor("")}
                    className={`h-8 px-3 rounded-full text-[11px] font-medium ${!secondaryColor ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500"}`}>None</button>
                  {PREDEFINED_COLORS.map((cl) => (
                    <button key={cl} onClick={() => setSecondaryColor(cl)}
                      className={`h-8 px-3 rounded-full text-[11px] font-medium transition-all ${
                        secondaryColor === cl ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}>{cl}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">
                  Pattern {scanDone && <span className="text-green-500 text-[10px] ml-1">● detected</span>}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PATTERNS.map((p) => (
                    <button key={p} onClick={() => setPattern(pattern === p ? "" : p)}
                      className={`h-8 px-3 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                        pattern === p ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}>{p}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Weather</label>
                  <select value={season} onChange={(e) => setSeason(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-[13px] bg-white focus:outline-none focus:border-zinc-400">
                    <option value="">Any</option>
                    {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Occasion</label>
                  <select value={occasion} onChange={(e) => setOccasion(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-[13px] bg-white focus:outline-none focus:border-zinc-400">
                    <option value="">Any</option>
                    {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {error && <p className="text-[12px] text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl bg-zinc-100 text-zinc-600 text-[13px] font-medium active:scale-[0.97] transition-all">Back</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-zinc-900 text-white text-[13px] font-semibold disabled:opacity-40 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5">
                  {saving ? (<><span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving</>) : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function colorHex(c: string): string {
  const m: Record<string, string> = {
    Black: "#1a1a1a", White: "#f5f5f5", Navy: "#1e3a5f", Gray: "#808080",
    Beige: "#d4c5a9", Brown: "#6b3a2a", Red: "#dc2626", Blue: "#3b82f6",
    Green: "#16a34a", Yellow: "#eab308", Orange: "#f97316", Pink: "#ec4899",
    Purple: "#9333ea", Olive: "#6b7c3f", Burgundy: "#722f37", Teal: "#0d9488",
    Cream: "#fffdd0", Khaki: "#c3b091", Denim: "#4a6fa5", Charcoal: "#36454f",
  };
  return m[c] || "#808080";
}
