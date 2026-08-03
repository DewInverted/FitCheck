"use client";

import { useState, useRef, useCallback } from "react";
import {
  PREDEFINED_COLORS, CATEGORIES, SUBCATEGORIES, SUBCATEGORIES_FEMALE,
  OCCASIONS, SEASONS, PATTERNS, FIT_TYPES,
} from "@/lib/colors";
import { scanImage } from "@/lib/scanner";

interface Props { onClose: () => void; onSaved: () => void; gender?: string; }

export default function AddClothingModal({ onClose, onSaved, gender }: Props) {
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
  const [removingBg, setRemovingBg] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const subs = gender === "female" ? SUBCATEGORIES_FEMALE : SUBCATEGORIES;

  const onImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setImageData(result);
        setStep(2);
        setScanning(true);
        scanImage(result).then((scanResult) => {
          setName(scanResult.suggestedName);
          setCategory(scanResult.suggestedCategory);
          setPrimaryColor(scanResult.dominantColor);
          setPattern(scanResult.suggestedPattern);
          setScanning(false);
          setScanDone(true);
        });
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const removeBg = async () => {
    if (!imageData) return;
    setRemovingBg(true);
    try {
      const r = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData }),
      });
      const data = await r.json();
      if (data.imageData) {
        setImageData(data.imageData);
        setBgRemoved(true);
      } else if (data.fallbackUrl) {
        window.open(data.fallbackUrl, "_blank");
      }
    } catch {} finally { setRemovingBg(false); }
  };

  const save = async () => {
    if (!name || !category || !primaryColor || !imageData) {
      setError("Fill in name, category, and color"); return;
    }
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/clothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, category, subcategory: subcategory || null,
          primaryColor, secondaryColor: secondaryColor || null,
          pattern: pattern || null, fit: fit || null,
          season: season || null, occasion: occasion || null,
          brand: brand || null, imageData, tags: [],
        }),
      });
      if (r.ok) onSaved();
      else { const d = await r.json(); setError(d.error || "Failed to save"); }
    } catch { setError("Something went wrong"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl animate-slide-up flex flex-col"
        style={{ maxHeight: "92vh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 rounded-t-3xl border-b border-zinc-100 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-300 mx-auto mt-2.5" />
          <div className="flex items-center justify-between px-4 py-2.5">
            <button onClick={step > 1 ? () => setStep(step - 1) : onClose}
              className="text-[14px] text-zinc-500 font-medium min-h-[44px] flex items-center">{step > 1 ? "← Back" : "Cancel"}</button>
            <span className="text-[13px] font-semibold text-zinc-900">
              {step === 1 ? "Add Item" : step === 2 ? "Review Photo" : "Details"}
            </span>
            <div className="min-w-[50px]" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Step 1: Photo */}
          {step === 1 && (
            <div className="px-5 py-6 space-y-4 animate-fade-up">
              <button onClick={() => camRef.current?.click()}
                className="w-full h-40 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 active:scale-[0.98] transition-all">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                <span className="text-[13px] font-medium text-zinc-400">Take a photo</span>
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-14 rounded-xl bg-zinc-100 text-zinc-600 text-[13px] font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                Upload from gallery
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onImage} className="hidden" />
              <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onImage} className="hidden" />
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && imageData && (
            <div className="px-5 py-4 space-y-4 animate-fade-up">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-zinc-100 relative">
                <img src={imageData} alt="Preview" className="w-full h-full object-cover" />
                {scanning && (
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-[12px] text-white font-medium">Scanning...</span>
                  </div>
                )}
                {scanDone && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-white/90 backdrop-blur rounded-xl p-2.5 animate-pop-in">
                      <p className="text-[11px] font-medium text-zinc-600">Detected: <strong>{primaryColor} {category}</strong></p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={removeBg} disabled={removingBg || bgRemoved}
                  className={`flex-1 h-11 rounded-xl text-[12px] font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                    bgRemoved ? "bg-green-50 text-green-600" : "bg-zinc-100 text-zinc-600"
                  } disabled:opacity-50`}>
                  {removingBg ? <><span className="w-3 h-3 border-2 border-zinc-400 border-t-zinc-700 rounded-full animate-spin" /> Removing...</>
                    : bgRemoved ? "✓ BG Removed" : "Remove background"}
                </button>
                <button onClick={() => { fileRef.current?.click(); }}
                  className="h-11 px-4 rounded-xl bg-zinc-100 text-zinc-600 text-[12px] font-medium active:scale-[0.98] transition-all">
                  Retake
                </button>
              </div>
              <button onClick={() => setStep(3)}
                className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-[14px] font-semibold active:scale-[0.98] transition-all">
                Continue
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onImage} className="hidden" />
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="px-5 pt-4 pb-8 space-y-5 animate-fade-up">
              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-2 block">Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-zinc-200 text-[14px] focus:outline-none focus:border-zinc-400" placeholder="e.g. Black T-Shirt" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => { setCategory(c.value); setSubcategory(""); }}
                      className={`h-10 px-4 rounded-full text-[12px] font-medium active:scale-95 transition-all ${
                        category === c.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}>{c.label}</button>
                  ))}
                </div>
              </div>
              {category && subs[category] && (
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-2 block">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {subs[category].map(s => (
                      <button key={s} onClick={() => setSubcategory(s)}
                        className={`h-10 px-4 rounded-full text-[12px] font-medium active:scale-95 transition-all ${
                          subcategory === s ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500"
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_COLORS.slice(0, 24).map(c => (
                    <button key={c} onClick={() => setPrimaryColor(c)}
                      className={`h-10 px-4 rounded-full text-[12px] font-medium active:scale-95 transition-all ${
                        primaryColor === c ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-2 block">Secondary Color <span className="text-zinc-300">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_COLORS.slice(0, 12).map(c => (
                    <button key={c} onClick={() => setSecondaryColor(secondaryColor === c ? "" : c)}
                      className={`h-10 px-4 rounded-full text-[12px] font-medium active:scale-95 transition-all ${
                        secondaryColor === c ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500"
                      }`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-2 block">Pattern</label>
                <div className="flex flex-wrap gap-2">
                  {PATTERNS.map(p => (
                    <button key={p} onClick={() => setPattern(pattern === p ? "" : p)}
                      className={`h-10 px-4 rounded-full text-[12px] font-medium active:scale-95 transition-all ${
                        pattern === p ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500"
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
              {FIT_TYPES[category] && (
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-2 block">Fit</label>
                  <div className="flex flex-wrap gap-2">
                    {FIT_TYPES[category].map(f => (
                      <button key={f} onClick={() => setFit(fit === f ? "" : f)}
                        className={`h-10 px-4 rounded-full text-[12px] font-medium active:scale-95 transition-all ${
                          fit === f ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500"
                        }`}>{f}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-2 block">Season</label>
                  <select value={season} onChange={e => setSeason(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border border-zinc-200 text-[13px] text-zinc-700 focus:outline-none">
                    <option value="">Any</option>
                    {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-2 block">Occasion</label>
                  <select value={occasion} onChange={e => setOccasion(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border border-zinc-200 text-[13px] text-zinc-700 focus:outline-none">
                    <option value="">Any</option>
                    {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-zinc-500 mb-2 block">Brand <span className="text-zinc-300">(optional)</span></label>
                <input value={brand} onChange={e => setBrand(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-zinc-200 text-[14px] focus:outline-none focus:border-zinc-400" placeholder="e.g. Uniqlo" />
              </div>
              {error && <p className="text-[12px] text-red-500 text-center">{error}</p>}
              <button onClick={save} disabled={saving}
                className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-[14px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving...</> : "Save to Closet"}
              </button>
              <div className="h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
