"use client";

import { useState, useRef } from "react";
import type { ClothingItem } from "@/db/schema";
import { OCCASIONS, SEASONS, STYLE_PRESETS } from "@/lib/colors";
import type { AccessorySuggestion } from "@/lib/colors";

interface OutfitResult {
  items: ClothingItem[];
  score: number;
  description: string;
  style: string;
  accessories: AccessorySuggestion[];
  inspoLinks: { pinterest: string; tiktok: string; instagram: string };
}

export default function OutfitGenerator({ defaultStyle = "", gender = "" }: { defaultStyle?: string; gender?: string }) {
  const [outfits, setOutfits] = useState<OutfitResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle);
  void gender; // used for future gender-aware filtering
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const [activeOutfit, setActiveOutfit] = useState(0);
  const [savedOutfits, setSavedOutfits] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const generate = async () => {
    setLoading(true);
    setError("");
    setSavedOutfits(new Set());
    setActiveOutfit(0);
    try {
      const res = await fetch("/api/outfits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion: occasion || undefined, season: season || undefined, styleId: selectedStyle || undefined, count: 6 }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("Server error. Reload and try again.");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate");
      if (!Array.isArray(data)) throw new Error("Unexpected response.");
      setOutfits(data);
      setGenerated(true);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  const save = async (outfit: OutfitResult, idx: number) => {
    try {
      const res = await fetch("/api/outfits/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${outfit.style} #${idx + 1}`, itemIds: outfit.items.map((i) => i.id), occasion: occasion || null, season: season || null }),
      });
      if (res.ok) setSavedOutfits((p) => new Set(p).add(idx));
    } catch {}
  };

  const current = outfits[activeOutfit];

  return (
    <div>
      {/* Style chips */}
      <div className="mb-5 animate-fade-up">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">Pick your vibe</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
          {STYLE_PRESETS.filter(s => s.gender === "all" || s.gender === gender).map((s) => (
            <button key={s.id} onClick={() => setSelectedStyle(selectedStyle === s.id ? "" : s.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all whitespace-nowrap active:scale-95 ${
                selectedStyle === s.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <button onClick={() => setShowFilters(!showFilters)}
        className="text-[12px] text-zinc-400 font-medium mb-3 flex items-center gap-1 hover:text-zinc-600 transition-colors">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
        </svg>
        {showFilters ? "Hide filters" : "Filters"}
      </button>
      {showFilters && (
        <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-up">
          <select value={occasion} onChange={(e) => setOccasion(e.target.value)}
            className="h-10 px-3 rounded-xl border border-zinc-200 text-[13px] text-zinc-700 bg-white focus:outline-none focus:border-zinc-400">
            <option value="">Any occasion</option>
            {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={season} onChange={(e) => setSeason(e.target.value)}
            className="h-10 px-3 rounded-xl border border-zinc-200 text-[13px] text-zinc-700 bg-white focus:outline-none focus:border-zinc-400">
            <option value="">Any weather</option>
            {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      <button onClick={generate} disabled={loading}
        className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-[14px] font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40 mb-6 flex items-center justify-center gap-2">
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Building fits...</>
        ) : "Generate Outfits"}
      </button>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-[13px] animate-fade-up">{error}</div>}

      {/* ── Results ── */}
      {generated && outfits.length > 0 && (
        <div ref={resultsRef} className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">{outfits.length} looks</p>
            <div className="flex gap-1.5">
              {outfits.map((_, i) => (
                <button key={i} onClick={() => setActiveOutfit(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === activeOutfit ? "bg-zinc-900 w-5" : "bg-zinc-200 w-2"}`} />
              ))}
            </div>
          </div>
          {current && (
            <OutfitCard key={activeOutfit} outfit={current} index={activeOutfit}
              saved={savedOutfits.has(activeOutfit)} onSave={() => save(current, activeOutfit)}
              onPrev={activeOutfit > 0 ? () => setActiveOutfit((p) => p - 1) : undefined}
              onNext={activeOutfit < outfits.length - 1 ? () => setActiveOutfit((p) => p + 1) : undefined}
              onSwap={(cat, newItem) => {
                setOutfits(prev => prev.map((o, i) => {
                  if (i !== activeOutfit) return o;
                  const newItems = o.items.map(item => item.category === cat ? newItem : item);
                  return { ...o, items: newItems, description: newItems.map(it => it.name).join(" + ") };
                }));
              }} />
          )}
        </div>
      )}

      {!generated && !loading && (
        <div className="text-center py-14 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-zinc-700 mb-1">Build your outfit</p>
          <p className="text-[13px] text-zinc-400 max-w-[240px] mx-auto">Pick a style and tap generate</p>
        </div>
      )}

      {generated && outfits.length === 0 && !error && (
        <div className="text-center py-14 animate-fade-up">
          <p className="text-[15px] font-semibold text-zinc-700 mb-1">No combinations found</p>
          <p className="text-[13px] text-zinc-400">Try a different style or add more items</p>
        </div>
      )}
    </div>
  );
}

/* ════════ Outfit Card ════════ */

function OutfitCard({ outfit, index, saved, onSave, onPrev, onNext, onSwap }: {
  outfit: OutfitResult; index: number; saved: boolean; onSave: () => void;
  onPrev?: () => void; onNext?: () => void;
  onSwap?: (category: string, newItem: ClothingItem) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [swapCategory, setSwapCategory] = useState<string | null>(null);
  const [swapOptions, setSwapOptions] = useState<ClothingItem[]>([]);
  const [loadingSwap, setLoadingSwap] = useState(false);

  const top = outfit.items.find((i) => i.category === "top");
  const bottom = outfit.items.find((i) => i.category === "bottom");
  const shoes = outfit.items.find((i) => i.category === "shoes");
  const outer = outfit.items.find((i) => i.category === "outerwear");
  const scoreLabel = outfit.score >= 90 ? "Perfect" : outfit.score >= 80 ? "Great" : outfit.score >= 65 ? "Good" : "OK";

  const openSwap = async (cat: string) => {
    setLoadingSwap(true);
    setSwapCategory(cat);
    try {
      const r = await fetch("/api/clothes");
      if (r.ok) {
        const all: ClothingItem[] = await r.json();
        const currentIds = new Set(outfit.items.map(i => i.id));
        setSwapOptions(all.filter(i => i.category === cat && !currentIds.has(i.id)));
      }
    } catch {} finally { setLoadingSwap(false); }
  };

  return (
    <div className="animate-scale-in">
      <div className="bg-zinc-50 rounded-3xl overflow-hidden relative">
        {/* Arrows */}
        {onPrev && (
          <button onClick={onPrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
        {onNext && (
          <button onClick={onNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-500 shadow-sm">Look {index + 1}</span>
        </div>
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm">{outfit.score} · {scoreLabel}</span>
        </div>

        {/* ── Stacked outfit with drop-in animation ── */}
        <div className="flex justify-center py-8 px-4">
          <div className="relative">
            {/* Outerwear — floats to the side */}
            {outer && (
              <div className="absolute -right-5 top-0 z-20 rotate-[8deg] animate-pop-in" style={{ animationDelay: "0.4s" }}>
                <div className="w-[60px] h-[60px] rounded-xl overflow-hidden border-[3px] border-white shadow-lg bg-white">
                  <img src={outer.imageData} alt={outer.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-[8px] text-zinc-400 text-center mt-1 font-medium w-[60px] truncate">{outer.name}</p>
              </div>
            )}

            <div className="flex flex-col items-center">
              {/* Top — tap to swap */}
              <button onClick={() => openSwap("top")} className="w-[160px] aspect-[4/5] rounded-2xl overflow-hidden border-[3px] border-white shadow-lg bg-white relative z-[1] animate-stack-drop group"
                style={{ animationDelay: "0.05s" }}>
                {top ? <img src={top.imageData} alt={top.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-400 text-[11px]">Top</div>}
                <div className="absolute inset-0 bg-black/0 group-active:bg-black/10 transition-colors flex items-end justify-center pb-2">
                  <span className="text-[8px] text-white/0 group-active:text-white/80 bg-black/40 px-2 py-0.5 rounded-full font-medium">tap to swap</span>
                </div>
              </button>

              {/* Bottom — tap to swap */}
              <button onClick={() => openSwap("bottom")} className="w-[144px] aspect-[3/4] rounded-2xl overflow-hidden border-[3px] border-white shadow-lg bg-white -mt-3 relative z-[2] animate-stack-drop group"
                style={{ animationDelay: "0.15s" }}>
                {bottom ? <img src={bottom.imageData} alt={bottom.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-400 text-[11px]">Bottom</div>}
                <div className="absolute inset-0 bg-black/0 group-active:bg-black/10 transition-colors flex items-end justify-center pb-2">
                  <span className="text-[8px] text-white/0 group-active:text-white/80 bg-black/40 px-2 py-0.5 rounded-full font-medium">tap to swap</span>
                </div>
              </button>

              {/* Shoes — tap to swap */}
              <button onClick={() => openSwap("shoes")} className="w-[108px] aspect-[5/4] rounded-xl overflow-hidden border-[3px] border-white shadow-md bg-white -mt-3 relative z-[3] animate-stack-drop group"
                style={{ animationDelay: "0.25s" }}>
                {shoes ? <img src={shoes.imageData} alt={shoes.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-400 text-[11px]">Shoes</div>}
                <div className="absolute inset-0 bg-black/0 group-active:bg-black/10 transition-colors flex items-end justify-center pb-1">
                  <span className="text-[8px] text-white/0 group-active:text-white/80 bg-black/40 px-2 py-0.5 rounded-full font-medium">tap to swap</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Item chips */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {outfit.items.map((item, i) => (
          <div key={item.id} className="flex-shrink-0 flex items-center gap-1.5 bg-zinc-50 rounded-full pl-0.5 pr-2.5 py-0.5 animate-fade-up"
            style={{ animationDelay: `${0.3 + i * 0.06}s` }}>
            <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-200 flex-shrink-0">
              <img src={item.imageData} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-medium text-zinc-600 whitespace-nowrap">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2 animate-fade-up" style={{ animationDelay: "0.35s" }}>
        <button onClick={onSave} disabled={saved}
          className={`flex-1 h-11 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 ${
            saved ? "bg-zinc-100 text-zinc-400" : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}>
          {saved ? (
            <><svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg> Saved</>
          ) : "Save Look"}
        </button>
        <button onClick={() => setShowDetails(!showDetails)}
          className="h-11 px-4 rounded-xl bg-zinc-100 text-zinc-600 text-[13px] font-medium hover:bg-zinc-200 active:scale-[0.97] transition-all">
          {showDetails ? "Less" : "Details"}
        </button>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="mt-4 space-y-4 animate-fade-up">
          {outfit.accessories.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Complete the look</p>
              <div className="space-y-1">
                {outfit.accessories.map((acc, i) => (
                  <a key={i} href={`https://shopee.ph/search?keyword=${encodeURIComponent(acc.shopQuery)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors group">
                    <span className="text-lg w-7 text-center">{acc.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-700">{acc.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{acc.reason}</p>
                    </div>
                    <span className="text-[10px] text-zinc-300 group-hover:text-zinc-500 flex-shrink-0">Shop →</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Style references</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "Pinterest", href: outfit.inspoLinks.pinterest, hover: "hover:bg-red-50 hover:text-red-600" },
                { label: "TikTok", href: outfit.inspoLinks.tiktok, hover: "hover:bg-zinc-100 hover:text-zinc-900" },
                { label: "Instagram", href: outfit.inspoLinks.instagram, hover: "hover:bg-purple-50 hover:text-purple-600" },
              ].map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  className={`h-10 rounded-xl bg-zinc-50 transition-all active:scale-95 flex items-center justify-center text-[12px] font-medium text-zinc-500 ${l.hover}`}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Swap picker */}
      {swapCategory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setSwapCategory(null); }}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[50vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white z-10 rounded-t-3xl">
              <div className="w-10 h-1 rounded-full bg-zinc-300 mx-auto mt-2.5" />
              <div className="flex items-center justify-between px-4 py-2">
                <button onClick={() => setSwapCategory(null)} className="text-[14px] text-zinc-400 font-medium">Cancel</button>
                <span className="text-[13px] font-semibold text-zinc-900">Swap {swapCategory}</span>
                <div className="w-12" />
              </div>
            </div>
            <div className="px-4 pb-4">
              {loadingSwap ? (
                <div className="flex justify-center py-8"><span className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" /></div>
              ) : swapOptions.length === 0 ? (
                <p className="text-center text-[13px] text-zinc-400 py-8">No other {swapCategory} items in your closet</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {swapOptions.map(item => (
                    <button key={item.id} onClick={() => { if (onSwap) onSwap(swapCategory, item); setSwapCategory(null); }}
                      className="aspect-square rounded-xl overflow-hidden bg-zinc-100 active:scale-95 transition-all relative">
                      <img src={item.imageData} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 pt-4">
                        <p className="text-[9px] font-medium text-white truncate">{item.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
