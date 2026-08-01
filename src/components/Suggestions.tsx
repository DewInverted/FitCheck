"use client";

import { useState, useEffect } from "react";
import { STYLE_PRESETS } from "@/lib/colors";

interface ShoppingLink { store: string; url: string; icon: string; tag?: string; }
interface Product { id: string; image: string; alt: string; title: string; priceRange: string; shopUrl: string; soldCount: string; rating: string; badge: string; }
interface Suggestion {
  category: string;
  subcategory: string;
  colors: string[];
  reason: string;
  shoppingLinks: ShoppingLink[];
  pairingTip?: string;
  styleContext?: string;
  products?: Product[];
}

type ViewMode = "cards" | "list" | "grid";

export default function Suggestions({ gender, defaultStyle }: { gender?: string; defaultStyle?: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const stylePref = STYLE_PRESETS.find((s) => s.id === defaultStyle);

  useEffect(() => {
    // Fetch suggestions then fetch products for each
    fetch(`/api/suggestions?gender=${gender || ""}&style=${defaultStyle || ""}`)
      .then((r) => r.ok ? r.json() : [])
      .then(async (data: Suggestion[]) => {
        // Fetch products for each suggestion
        const withProducts = await Promise.all(
          data.map(async (s) => {
            try {
              const r = await fetch(`/api/products?subcategory=${encodeURIComponent(s.subcategory)}&color=${encodeURIComponent(s.colors[0])}&gender=${gender || "male"}`);
              if (r.ok) {
                const products = await r.json();
                return { ...s, products };
              }
            } catch {}
            return s;
          })
        );
        setSuggestions(withProducts);
      })
      .finally(() => setLoading(false));
  }, [gender, defaultStyle]);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl h-56 skeleton" />)}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center pt-16 animate-fade-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="text-[15px] font-semibold text-zinc-700">Wardrobe looks good</p>
        <p className="text-[13px] text-zinc-400 mt-1">Add more items to get personalized suggestions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">What to buy next</p>
          <p className="text-[13px] text-zinc-500">
            {suggestions.length} pieces
            {stylePref && <> · <strong className="text-zinc-600">{stylePref.label}</strong></>}
          </p>
        </div>
        <div className="flex bg-zinc-100 rounded-lg p-0.5">
          <button onClick={() => setViewMode("cards")} className={`p-1.5 rounded-md transition-all ${viewMode === "cards" ? "bg-white shadow-sm" : ""}`}>
            <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${viewMode === "cards" ? "text-zinc-900" : "text-zinc-400"}`} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /></svg>
          </button>
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}>
            <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${viewMode === "grid" ? "text-zinc-900" : "text-zinc-400"}`} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          </button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}>
            <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${viewMode === "list" ? "text-zinc-900" : "text-zinc-400"}`} fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
          </button>
        </div>
      </div>

      {/* ═══ CARDS VIEW ═══ */}
      {viewMode === "cards" && suggestions.map((s, i) => (
        <div key={i} className="rounded-2xl border border-zinc-100 overflow-hidden animate-pop-in bg-white" style={{ animationDelay: `${i * 50}ms` }}>
          {/* Product images scroll */}
          {s.products && s.products.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar p-3 pb-2">
              {s.products.map((p) => (
                <a key={p.id} href={p.shopUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 w-[140px] rounded-xl overflow-hidden border border-zinc-100 bg-white hover:shadow-md active:scale-[0.97] transition-all">
                  <div className="aspect-square bg-zinc-50 overflow-hidden relative">
                    <img src={p.image} alt={p.alt} className="w-full h-full object-cover" loading="lazy" />
                    <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-white/90 backdrop-blur-sm text-zinc-700 px-1.5 py-0.5 rounded-full">{p.badge}</span>
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-semibold text-zinc-800 truncate">{p.title}</p>
                    <p className="text-[12px] font-bold text-orange-500 mt-0.5">{p.priceRange}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] text-yellow-500">★</span>
                      <span className="text-[9px] text-zinc-500">{p.rating}</span>
                      <span className="text-[9px] text-zinc-300 ml-auto">{p.soldCount}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          <div className="px-4 pb-3 pt-1">
            <p className="text-[14px] font-semibold text-zinc-900 mb-1">{s.colors[0]} {s.subcategory}</p>
            <p className="text-[12px] text-zinc-500 leading-relaxed mb-2">{s.reason}</p>

            {s.pairingTip && (
              <div className="bg-zinc-50 rounded-xl p-2.5 mb-2">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">How to wear it</p>
                <p className="text-[11px] text-zinc-600 leading-relaxed">{s.pairingTip}</p>
              </div>
            )}

            {s.styleContext && <p className="text-[10px] text-zinc-400 italic mb-2">{s.styleContext}</p>}

            {/* Quick shop pills */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
              {s.shoppingLinks.slice(0, 4).map((l) => (
                <a key={l.store} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1 h-7 px-2.5 rounded-full bg-zinc-50 hover:bg-zinc-100 active:scale-95 transition-all text-[10px] font-medium text-zinc-600">
                  <span className="text-sm">{l.icon}</span> {l.store}
                </a>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* ═══ GRID VIEW ═══ */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((s, i) => {
            const img = s.products?.[0];
            return (
              <a key={i} href={img?.shopUrl || `https://shopee.ph/search?keyword=${encodeURIComponent(`${s.colors[0]} ${s.subcategory}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="rounded-2xl border border-zinc-100 overflow-hidden bg-white animate-pop-in active:scale-[0.97] transition-all"
                style={{ animationDelay: `${i * 40}ms` }}>
                <div className="aspect-square bg-zinc-50 overflow-hidden relative">
                  {img ? (
                    <img src={img.image} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">{catEmoji[s.category]}</div>
                  )}
                  {img && <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-white/90 backdrop-blur-sm text-zinc-700 px-1.5 py-0.5 rounded-full">{img.badge}</span>}
                </div>
                <div className="p-2.5">
                  <p className="text-[12px] font-semibold text-zinc-800 truncate">{s.colors[0]} {s.subcategory}</p>
                  {img && <p className="text-[12px] font-bold text-orange-500 mt-0.5">{img.priceRange}</p>}
                  <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{s.reason}</p>
                  {img && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] text-yellow-500">★ {img.rating}</span>
                      <span className="text-[9px] text-zinc-300 ml-auto">{img.soldCount}</span>
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* ═══ LIST VIEW ═══ */}
      {viewMode === "list" && (
        <div className="space-y-1">
          {suggestions.map((s, i) => {
            const img = s.products?.[0];
            return (
              <a key={i} href={img?.shopUrl || `https://shopee.ph/search?keyword=${encodeURIComponent(`${s.colors[0]} ${s.subcategory}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}>
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
                  {img ? (
                    <img src={img.image} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">{catEmoji[s.category]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-800">{s.colors[0]} {s.subcategory}</p>
                  {img && <p className="text-[12px] font-bold text-orange-500">{img.priceRange}</p>}
                  <p className="text-[10px] text-zinc-400 truncate">{s.reason}</p>
                </div>
                {img && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] text-yellow-500">★ {img.rating}</p>
                    <p className="text-[8px] text-zinc-300">{img.soldCount}</p>
                  </div>
                )}
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

const catEmoji: Record<string, string> = {
  top: "👕", bottom: "👖", shoes: "👟", outerwear: "🧥", accessory: "⌚",
};
