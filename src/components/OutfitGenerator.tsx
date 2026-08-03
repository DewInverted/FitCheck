"use client";

import { useState, useRef, useEffect } from "react";
import type { ClothingItem } from "@/db/schema";
import { OCCASIONS, SEASONS, STYLE_PRESETS } from "@/lib/colors";
import type { AccessorySuggestion } from "@/lib/colors";
import type { SuggestedPiece } from "@/lib/outfit-generator";

interface OutfitResult {
  items: ClothingItem[];
  score: number;
  description: string;
  style: string;
  source: "closet" | "suggested" | "mixed";
  accessories: AccessorySuggestion[];
  suggestedPieces: SuggestedPiece[];
  inspoLinks: { pinterest: string; tiktok: string; instagram: string };
}

interface Props {
  defaultStyle?: string;
  gender?: string;
  showSuggested?: boolean;
  onToggleSuggested?: (val: boolean) => void;
}

const SUGGEST_CATEGORIES = [
  { id: "top", label: "Tops", emoji: "👕" },
  { id: "bottom", label: "Bottoms", emoji: "👖" },
  { id: "shoes", label: "Shoes", emoji: "👟" },
  { id: "outerwear", label: "Layers", emoji: "🧥" },
  { id: "accessory", label: "Accessories", emoji: "⌚" },
];

export default function OutfitGenerator({ defaultStyle = "", gender = "", showSuggested = true, onToggleSuggested }: Props) {
  const [outfits, setOutfits] = useState<OutfitResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const [activeOutfit, setActiveOutfit] = useState(0);
  const [savedOutfits, setSavedOutfits] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [suggestionsOn, setSuggestionsOn] = useState(showSuggested);
  const [suggestCategories, setSuggestCategories] = useState<Set<string>>(new Set(["top", "bottom", "shoes", "accessory"]));
  const resultsRef = useRef<HTMLDivElement>(null);

  // Exclude items
  const [allItems, setAllItems] = useState<ClothingItem[]>([]);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [showExclude, setShowExclude] = useState(false);
  const [showSuggestOptions, setShowSuggestOptions] = useState(false);

  const filteredPresets = STYLE_PRESETS.filter(s => s.gender === "all" || s.gender === gender);

  useEffect(() => {
    fetch("/api/clothes")
      .then(r => r.ok ? r.json() : [])
      .then(setAllItems)
      .catch(() => {});
  }, []);

  const toggleExclude = (id: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSuggestCategory = (cat: string) => {
    setSuggestCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const generate = async () => {
    setLoading(true);
    setError("");
    setSavedOutfits(new Set());
    setActiveOutfit(0);
    try {
      const res = await fetch("/api/outfits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: occasion || undefined,
          season: season || undefined,
          styleId: selectedStyle || undefined,
          count: 10,
          gender,
          showSuggested: suggestionsOn,
          suggestCategories: [...suggestCategories],
          excludeIds: [...excludedIds],
        }),
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
        body: JSON.stringify({
          name: `${outfit.style} #${idx + 1}`,
          itemIds: outfit.items.map((i) => i.id),
          occasion: occasion || null,
          season: season || null,
          style: outfit.style,
          source: outfit.source,
        }),
      });
      if (res.ok) setSavedOutfits((p) => new Set(p).add(idx));
    } catch {}
  };

  const toggleSuggestions = () => {
    const newVal = !suggestionsOn;
    setSuggestionsOn(newVal);
    if (onToggleSuggested) onToggleSuggested(newVal);
    fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showSuggested: newVal }),
    }).catch(() => {});
  };

  // Filter outfits based on suggestions toggle
  const displayedOutfits = suggestionsOn
    ? outfits
    : outfits.filter(o => o.source === "closet");

  const current = displayedOutfits[activeOutfit];

  // Count by source
  const closetCount = outfits.filter(o => o.source === "closet").length;
  const suggestedCount = outfits.filter(o => o.source === "suggested" || o.source === "mixed").length;

  return (
    <div>
      {/* Style chips */}
      <div className="mb-5 animate-fade-up">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">Pick your vibe</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
          {filteredPresets.map((s) => (
            <button key={s.id} onClick={() => setSelectedStyle(selectedStyle === s.id ? "" : s.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all whitespace-nowrap active:scale-95 ${
                selectedStyle === s.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options Row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button onClick={() => { setShowFilters(!showFilters); setShowExclude(false); setShowSuggestOptions(false); }}
          className={`text-[11px] font-medium flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
            showFilters ? "bg-zinc-900 text-white" : "text-zinc-500 bg-zinc-100 hover:bg-zinc-200"
          }`}>
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
          </svg>
          Filters
        </button>
        <button onClick={() => { setShowExclude(!showExclude); setShowFilters(false); setShowSuggestOptions(false); }}
          className={`text-[11px] font-medium flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
            showExclude ? "bg-zinc-900 text-white" : (excludedIds.size > 0 ? "bg-red-100 text-red-600" : "text-zinc-500 bg-zinc-100 hover:bg-zinc-200")
          }`}>
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" />
          </svg>
          Exclude{excludedIds.size > 0 && ` (${excludedIds.size})`}
        </button>

        <div className="flex-1" />

        {/* Suggestions Toggle + Options */}
        <div className="flex items-center gap-1">
          <button onClick={() => { setShowSuggestOptions(!showSuggestOptions); setShowFilters(false); setShowExclude(false); }}
            className={`text-[11px] font-medium px-2 py-1.5 rounded-l-full transition-colors ${
              showSuggestOptions ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
            }`}>
            ⚙️
          </button>
          <button onClick={toggleSuggestions}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-r-full transition-colors ${
              suggestionsOn ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-400"
            }`}>
            {suggestionsOn ? "✓ Suggestions" : "Suggestions OFF"}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-4 p-3 bg-zinc-50 rounded-2xl animate-fade-up">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">Occasion</label>
              <select value={occasion} onChange={(e) => setOccasion(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-[13px] text-zinc-700 bg-white focus:outline-none">
                <option value="">Any</option>
                {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">Weather</label>
              <select value={season} onChange={(e) => setSeason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-[13px] text-zinc-700 bg-white focus:outline-none">
                <option value="">Any</option>
                {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Exclude Items Panel */}
      {showExclude && (
        <div className="mb-4 p-3 bg-zinc-50 rounded-2xl animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Tap items to exclude</p>
            {excludedIds.size > 0 && (
              <button onClick={() => setExcludedIds(new Set())} className="text-[11px] text-red-500 font-medium">Clear</button>
            )}
          </div>
          {allItems.length === 0 ? (
            <p className="text-[12px] text-zinc-400 text-center py-4">No items in closet</p>
          ) : (
            <div className="grid grid-cols-6 gap-1 max-h-[160px] overflow-y-auto">
              {allItems.map(item => {
                const isExcluded = excludedIds.has(item.id);
                return (
                  <button key={item.id} onClick={() => toggleExclude(item.id)}
                    className={`aspect-square rounded-lg overflow-hidden relative transition-all ${
                      isExcluded ? "ring-2 ring-red-500 opacity-40" : ""
                    }`}>
                    <img src={item.imageData} alt={item.name} className="w-full h-full object-cover" />
                    {isExcluded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-red-500 text-lg font-bold">✕</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Suggest Options Panel */}
      {showSuggestOptions && (
        <div className="mb-4 p-3 bg-green-50 rounded-2xl animate-fade-up">
          <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wider mb-2">What should we suggest?</p>
          <div className="flex flex-wrap gap-2">
            {SUGGEST_CATEGORIES.map(cat => {
              const isOn = suggestCategories.has(cat.id);
              return (
                <button key={cat.id} onClick={() => toggleSuggestCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                    isOn ? "bg-green-600 text-white" : "bg-white text-zinc-500 border border-zinc-200"
                  }`}>
                  <span>{cat.emoji}</span>
                  {cat.label}
                  {isOn && <span>✓</span>}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-green-600 mt-2">
            We&apos;ll suggest items in these categories that match your style
          </p>
        </div>
      )}

      <button onClick={generate} disabled={loading}
        className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-[14px] font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40 mb-6 flex items-center justify-center gap-2">
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Building fits...</>
        ) : "Generate Outfits"}
      </button>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-[13px] animate-fade-up">{error}</div>}

      {/* Results */}
      {generated && displayedOutfits.length > 0 && (
        <div ref={resultsRef} className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">{displayedOutfits.length} looks</p>
              {outfits.length > 0 && (
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {closetCount} from closet{suggestedCount > 0 && ` · ${suggestedCount} with suggestions`}
                </p>
              )}
            </div>
            <div className="flex gap-1.5">
              {displayedOutfits.map((_, i) => (
                <button key={i} onClick={() => setActiveOutfit(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === activeOutfit ? "bg-zinc-900 w-5" : "bg-zinc-200 w-2"}`} />
              ))}
            </div>
          </div>
          {current && (
            <OutfitCard key={activeOutfit} outfit={current} index={activeOutfit}
              saved={savedOutfits.has(activeOutfit)} onSave={() => save(current, activeOutfit)}
              onPrev={activeOutfit > 0 ? () => setActiveOutfit((p) => p - 1) : undefined}
              onNext={activeOutfit < displayedOutfits.length - 1 ? () => setActiveOutfit((p) => p + 1) : undefined}
              onSwap={(cat, newItem) => {
                setOutfits(prev => prev.map((o, i) => {
                  if (i !== activeOutfit) return o;
                  const newItems = o.items.map(item => item.category === cat ? newItem : item);
                  return { ...o, items: newItems, description: newItems.map(it => it.name).join(" + ") };
                }));
              }}
              gender={gender} />
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

      {generated && displayedOutfits.length === 0 && !error && (
        <div className="text-center py-14 animate-fade-up">
          <p className="text-[15px] font-semibold text-zinc-700 mb-1">No combinations found</p>
          <p className="text-[13px] text-zinc-400">
            {!suggestionsOn ? "Turn on suggestions to see more options" : "Try a different style or add more items"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ════════ Outfit Card ════════ */

function OutfitCard({ outfit, index, saved, onSave, onPrev, onNext, onSwap, gender }: {
  outfit: OutfitResult; index: number; saved: boolean; onSave: () => void;
  onPrev?: () => void; onNext?: () => void;
  onSwap?: (category: string, newItem: ClothingItem) => void;
  gender?: string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [swapCategory, setSwapCategory] = useState<string | null>(null);
  const [swapOptions, setSwapOptions] = useState<ClothingItem[]>([]);
  const [loadingSwap, setLoadingSwap] = useState(false);
  const [productImages, setProductImages] = useState<Record<string, { image: string; shopUrl: string }>>({});
  void gender;

  // Fetch product images for suggested pieces
  useEffect(() => {
    if (outfit.suggestedPieces.length === 0) return;
    
    const fetchImages = async () => {
      const images: Record<string, { image: string; shopUrl: string }> = {};
      for (const piece of outfit.suggestedPieces) {
        try {
          const r = await fetch(`/api/products?subcategory=${encodeURIComponent(piece.subcategory)}&color=${encodeURIComponent(piece.color)}&gender=${gender || "male"}`);
          if (r.ok) {
            const products = await r.json();
            if (products[0]) {
              images[`${piece.category}-${piece.subcategory}`] = {
                image: products[0].image,
                shopUrl: products[0].shopUrl,
              };
            }
          }
        } catch {}
      }
      setProductImages(images);
    };
    fetchImages();
  }, [outfit.suggestedPieces, gender]);

  const top = outfit.items.find((i) => i.category === "top");
  const bottom = outfit.items.find((i) => i.category === "bottom");
  const shoes = outfit.items.find((i) => i.category === "shoes");
  const outer = outfit.items.find((i) => i.category === "outerwear");
  const scoreLabel = outfit.score >= 90 ? "Perfect" : outfit.score >= 80 ? "Great" : outfit.score >= 65 ? "Good" : "OK";

  const sourceLabel = outfit.source === "closet" ? "From your closet" : outfit.source === "suggested" ? "Suggested outfit" : "Mixed";
  const sourceBg = outfit.source === "closet" ? "bg-green-100 text-green-700" : outfit.source === "suggested" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700";

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
        {onPrev && (
          <button onClick={onPrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
        {onNext && (
          <button onClick={onNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}

        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          <span className="bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-500 shadow-sm">Look {index + 1}</span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm ${sourceBg}`}>{sourceLabel}</span>
        </div>
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm">{outfit.score} · {scoreLabel}</span>
        </div>

        <div className="flex justify-center py-8 px-4">
          <div className="relative">
            {outer && (
              <div className="absolute -right-5 top-0 z-20 rotate-[8deg] animate-pop-in" style={{ animationDelay: "0.4s" }}>
                <button onClick={() => openSwap("outerwear")} className="group">
                  <div className="w-[60px] h-[60px] rounded-xl overflow-hidden border-[3px] border-white shadow-lg bg-white">
                    <img src={outer.imageData} alt={outer.name} className="w-full h-full object-cover" />
                  </div>
                </button>
              </div>
            )}

            <div className="flex flex-col items-center">
              <button onClick={() => openSwap("top")} className="w-[160px] aspect-[4/5] rounded-2xl overflow-hidden border-[3px] border-white shadow-lg bg-white relative z-[1] animate-stack-drop group">
                {top ? <img src={top.imageData} alt={top.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-400 text-[11px]">Top</div>}
              </button>

              <button onClick={() => openSwap("bottom")} className="w-[144px] aspect-[3/4] rounded-2xl overflow-hidden border-[3px] border-white shadow-lg bg-white -mt-3 relative z-[2] animate-stack-drop group">
                {bottom ? <img src={bottom.imageData} alt={bottom.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-400 text-[11px]">Bottom</div>}
              </button>

              <button onClick={() => openSwap("shoes")} className="w-[108px] aspect-[5/4] rounded-xl overflow-hidden border-[3px] border-white shadow-md bg-white -mt-3 relative z-[3] animate-stack-drop group">
                {shoes ? <img src={shoes.imageData} alt={shoes.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-400 text-[11px]">Shoes</div>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested pieces with REAL product images */}
      {outfit.suggestedPieces.length > 0 && (
        <div className="mt-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-3 border border-orange-100 animate-fade-up">
          <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-widest mb-2">
            🛒 Buy these to complete the look
          </p>
          <div className="grid grid-cols-2 gap-2">
            {outfit.suggestedPieces.map((piece, i) => {
              const key = `${piece.category}-${piece.subcategory}`;
              const product = productImages[key];
              return (
                <a key={i} href={product?.shopUrl || piece.shopUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-xl bg-white hover:shadow-md transition-all active:scale-[0.98]">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex-shrink-0 overflow-hidden">
                    {product?.image ? (
                      <img src={product.image} alt={piece.subcategory} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        {piece.category === "top" ? "👕" : piece.category === "bottom" ? "👖" : piece.category === "shoes" ? "👟" : piece.category === "accessory" ? "⌚" : "🧥"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-800 truncate">{piece.color} {piece.subcategory}</p>
                    <p className="text-[9px] text-zinc-400 truncate">{piece.reason}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Item chips */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {outfit.items.map((item, i) => (
          <div key={item.id} className="flex-shrink-0 flex items-center gap-1.5 bg-zinc-50 rounded-full pl-0.5 pr-2.5 py-0.5">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-200 flex-shrink-0">
              <img src={item.imageData} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-medium text-zinc-600 whitespace-nowrap">{item.name}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={onSave} disabled={saved}
          className={`flex-1 h-11 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 ${
            saved ? "bg-zinc-100 text-zinc-400" : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}>
          {saved ? "✓ Saved" : "Save Look"}
        </button>
        <button onClick={() => setShowDetails(!showDetails)}
          className="h-11 px-4 rounded-xl bg-zinc-100 text-zinc-600 text-[13px] font-medium hover:bg-zinc-200 active:scale-[0.97]">
          {showDetails ? "Less" : "More"}
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-4 animate-fade-up">
          {outfit.accessories.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Accessories</p>
              <div className="space-y-1">
                {outfit.accessories.map((acc, i) => (
                  <a key={i} href={`https://shopee.ph/search?keyword=${encodeURIComponent(acc.shopQuery)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
                    <span className="text-lg">{acc.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-700">{acc.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{acc.reason}</p>
                    </div>
                    <span className="text-[10px] text-zinc-300">→</span>
                  </a>
                ))}
              </div>
            </div>
          )}
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
                <button onClick={() => setSwapCategory(null)} className="text-[14px] text-zinc-400 font-medium min-h-[44px] flex items-center">Cancel</button>
                <span className="text-[13px] font-semibold text-zinc-900">Swap {swapCategory}</span>
                <div className="w-12" />
              </div>
            </div>
            <div className="px-4 pb-4">
              {loadingSwap ? (
                <div className="flex justify-center py-8"><span className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" /></div>
              ) : swapOptions.length === 0 ? (
                <p className="text-center text-[13px] text-zinc-400 py-8">No other {swapCategory} items</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {swapOptions.map(item => (
                    <button key={item.id} onClick={() => { if (onSwap) onSwap(swapCategory, item); setSwapCategory(null); }}
                      className="aspect-square rounded-xl overflow-hidden bg-zinc-100 active:scale-95 relative">
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
