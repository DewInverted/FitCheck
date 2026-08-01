"use client";

import { useState, useEffect } from "react";
import type { ClothingItem } from "@/db/schema";

interface Props {
  onAddClick: () => void;
}

const CAT_LABELS: Record<string, string> = {
  all: "All", top: "Tops", bottom: "Bottoms",
  shoes: "Shoes", outerwear: "Layers", accessory: "Accessories",
};

export default function Wardrobe({ onAddClick }: Props) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<ClothingItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/clothes");
      if (res.ok) setItems(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clothes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((p) => p.filter((i) => i.id !== id));
        setSelected(null);
        setConfirmDelete(false);
      }
    } catch {} finally { setDeleting(false); }
  };

  const toggleFav = async (item: ClothingItem) => {
    try {
      const res = await fetch(`/api/clothes/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !item.isFavorite }),
      });
      if (res.ok) {
        const u = await res.json();
        setItems((p) => p.map((i) => (i.id === u.id ? u : i)));
        if (selected?.id === item.id) setSelected(u);
      }
    } catch {}
  };

  const closeSheet = () => { setSelected(null); setConfirmDelete(false); };

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);
  const cats = ["all", ...Array.from(new Set(items.map((i) => i.category)))];

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1.5 animate-fade-in">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl skeleton" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center pt-20 animate-fade-up">
        <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <p className="text-[17px] font-semibold text-zinc-800 mb-1">Your closet is empty</p>
        <p className="text-[13px] text-zinc-400 text-center max-w-[240px] mb-6">
          Take a photo of your clothes to get started
        </p>
        <button onClick={onAddClick}
          className="h-11 px-6 bg-zinc-900 text-white rounded-full text-[13px] font-semibold hover:bg-zinc-800 active:scale-95 transition-all">
          Add your first item
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 mb-4">
        {cats.map((c) => {
          const count = c === "all" ? items.length : items.filter((i) => i.category === c).length;
          return (
            <button key={c} onClick={() => setFilter(c)}
              className={`flex-shrink-0 h-8 px-3 rounded-full text-[12px] font-medium transition-all flex items-center gap-1 ${
                filter === c ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}>
              {CAT_LABELS[c] || c} <span className="text-[10px] opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {filtered.map((item, i) => (
          <button key={item.id} onClick={() => { setSelected(item); setConfirmDelete(false); }}
            className="aspect-square rounded-xl overflow-hidden relative group bg-zinc-100 animate-pop-in"
            style={{ animationDelay: `${i * 40}ms` }}>
            <img src={item.imageData} alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {item.isFavorite && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-[10px]">♥</div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-6">
              <p className="text-[10px] font-medium text-white truncate">{item.name}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Detail Sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) closeSheet(); }}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[88vh] overflow-y-auto animate-slide-up">
            <div className="w-10 h-1 rounded-full bg-zinc-300 mx-auto mt-3 mb-2" />
            <div className="aspect-[4/3] bg-zinc-50 overflow-hidden">
              <img src={selected.imageData} alt={selected.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[17px] font-semibold text-zinc-900">{selected.name}</p>
                  <p className="text-[13px] text-zinc-400 mt-0.5">
                    {selected.subcategory || selected.category}
                    {selected.brand && ` · ${selected.brand}`}
                  </p>
                </div>
                <button onClick={() => toggleFav(selected)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    selected.isFavorite ? "bg-red-50 text-red-500" : "bg-zinc-100 text-zinc-400"
                  }`}>
                  {selected.isFavorite ? "♥" : "♡"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[selected.primaryColor, selected.secondaryColor, selected.pattern, (selected as Record<string, unknown>).fit as string | undefined, selected.season, selected.occasion]
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={tag} className="h-7 px-2.5 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-medium flex items-center">{tag}</span>
                  ))}
              </div>

              {/* Two-step delete */}
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="w-full h-11 rounded-xl text-[13px] font-medium text-red-500 bg-red-50 hover:bg-red-100 active:scale-[0.98] transition-all">
                  Remove item
                </button>
              ) : (
                <div className="space-y-2 animate-fade-up">
                  <p className="text-[12px] text-zinc-500 text-center">Are you sure? This can&apos;t be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)}
                      className="flex-1 h-11 rounded-xl text-[13px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] transition-all">
                      Cancel
                    </button>
                    <button onClick={() => remove(selected.id)} disabled={deleting}
                      className="flex-1 h-11 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                      {deleting ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Removing</>
                      ) : "Yes, remove"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
