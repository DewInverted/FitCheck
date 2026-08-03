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

const CAT_ORDER = ["top", "bottom", "shoes", "outerwear", "accessory"];
const CAT_LABELS: Record<string, { label: string; emoji: string }> = {
  top: { label: "Tops", emoji: "👕" },
  bottom: { label: "Bottoms", emoji: "👖" },
  shoes: { label: "Shoes", emoji: "👟" },
  outerwear: { label: "Outerwear", emoji: "🧥" },
  accessory: { label: "Accessories", emoji: "⌚" },
};

export default function Suggestions({ gender, defaultStyle }: { gender?: string; defaultStyle?: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const stylePref = STYLE_PRESETS.find((s) => s.id === defaultStyle);

  useEffect(() => {
    fetch(`/api/suggestions?gender=${gender || ""}&style=${defaultStyle || ""}`)
      .then((r) => r.ok ? r.json() : [])
      .then(async (data: Suggestion[]) => {
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
        <div className="flex gap-2 mb-4">
          {[1,2,3,4].map(i => <div key={i} className="h-8 w-20 rounded-full skeleton" />)}
        </div>
        {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl h-40 skeleton" />)}
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

  // Group suggestions by category
  const byCategory: Record<string, Suggestion[]> = {};
  suggestions.forEach(s => {
    if (!byCategory[s.category]) byCategory[s.category] = [];
    byCategory[s.category].push(s);
  });

  const categories = CAT_ORDER.filter(c => byCategory[c]?.length > 0);
  const filtered = activeCategory === "all" ? suggestions : (byCategory[activeCategory] || []);

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">What to buy next</p>
        <p className="text-[14px] text-zinc-600">
          Based on your closet
          {stylePref && <> · <span className="font-semibold">{stylePref.emoji} {stylePref.label}</span></>}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 mb-5">
        <button onClick={() => setActiveCategory("all")}
          className={`flex-shrink-0 h-9 px-4 rounded-full text-[12px] font-medium transition-all ${
            activeCategory === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          }`}>
          All ({suggestions.length})
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 h-9 px-4 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 ${
              activeCategory === cat ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}>
            <span>{CAT_LABELS[cat]?.emoji}</span>
            {CAT_LABELS[cat]?.label} ({byCategory[cat]?.length || 0})
          </button>
        ))}
      </div>

      {/* Suggestions Grid */}
      <div className="space-y-6">
        {activeCategory === "all" ? (
          // Grouped view
          categories.map(cat => (
            <div key={cat} className="animate-fade-up">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{CAT_LABELS[cat]?.emoji}</span>
                <h3 className="text-[14px] font-semibold text-zinc-800">{CAT_LABELS[cat]?.label}</h3>
                <span className="text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{byCategory[cat]?.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {byCategory[cat]?.map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} compact />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Single category view - larger cards
          <div className="space-y-3">
            {filtered.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion: s, compact = false }: { suggestion: Suggestion; compact?: boolean }) {
  const img = s.products?.[0];
  const [showStores, setShowStores] = useState(false);

  if (compact) {
    // Compact grid card
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden animate-pop-in">
        <a href={img?.shopUrl || `https://shopee.ph/search?keyword=${encodeURIComponent(`${s.colors[0]} ${s.subcategory}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="block">
          <div className="aspect-square bg-zinc-50 overflow-hidden relative">
            {img ? (
              <img src={img.image} alt={img.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-200">
                {CAT_LABELS[s.category]?.emoji || "👕"}
              </div>
            )}
            {img?.badge && (
              <span className="absolute top-2 left-2 text-[9px] font-bold bg-white/90 backdrop-blur-sm text-zinc-700 px-2 py-0.5 rounded-full shadow-sm">
                {img.badge}
              </span>
            )}
          </div>
        </a>
        <div className="p-3">
          <p className="text-[13px] font-semibold text-zinc-800 truncate">{s.colors[0]} {s.subcategory}</p>
          {img && <p className="text-[13px] font-bold text-orange-500 mt-0.5">{img.priceRange}</p>}
          <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{s.reason}</p>
          {img && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-yellow-500">★ {img.rating}</span>
              <span className="text-[9px] text-zinc-300">{img.soldCount}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full card
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden animate-pop-in">
      {/* Product images row */}
      {s.products && s.products.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar p-3 pb-2 bg-zinc-50/50">
          {s.products.map((p) => (
            <a key={p.id} href={p.shopUrl} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 w-[120px] rounded-xl overflow-hidden border border-zinc-100 bg-white hover:shadow-md active:scale-[0.97] transition-all">
              <div className="aspect-square bg-zinc-50 overflow-hidden relative">
                <img src={p.image} alt={p.alt} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-white/90 backdrop-blur-sm text-zinc-700 px-1.5 py-0.5 rounded-full">{p.badge}</span>
              </div>
              <div className="p-2">
                <p className="text-[11px] font-bold text-orange-500">{p.priceRange}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] text-yellow-500">★ {p.rating}</span>
                  <span className="text-[8px] text-zinc-300">{p.soldCount}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-zinc-900">{s.colors[0]} {s.subcategory}</p>
            <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">{s.reason}</p>
          </div>
          <span className="text-2xl flex-shrink-0">{CAT_LABELS[s.category]?.emoji || "👕"}</span>
        </div>

        {/* Pairing tip */}
        {s.pairingTip && (
          <div className="mt-3 bg-zinc-50 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">💡 How to wear it</p>
            <p className="text-[11px] text-zinc-600 leading-relaxed">{s.pairingTip}</p>
          </div>
        )}

        {/* Shop buttons */}
        <div className="mt-3">
          <button onClick={() => setShowStores(!showStores)}
            className="w-full h-10 rounded-xl bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            {showStores ? "Hide stores" : "Where to buy"}
          </button>

          {showStores && (
            <div className="mt-2 grid grid-cols-3 gap-1.5 animate-fade-up">
              {s.shoppingLinks.slice(0, 6).map((l) => (
                <a key={l.store} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 active:scale-95 transition-all">
                  <span className="text-lg">{l.icon}</span>
                  <span className="text-[10px] font-medium text-zinc-600">{l.store}</span>
                  {l.tag && <span className="text-[8px] text-zinc-400">{l.tag}</span>}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CAT_LABELS_ALT: Record<string, string> = {
  top: "👕", bottom: "👖", shoes: "👟", outerwear: "🧥", accessory: "⌚",
};
