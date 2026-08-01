"use client";

import { useState, useEffect } from "react";
import type { ClothingItem } from "@/db/schema";
import { PREDEFINED_COLORS, CATEGORIES, SUBCATEGORIES, FIT_TYPES } from "@/lib/colors";

interface Props { onAddClick: () => void; darkMode?: boolean; }

const CAT_LABELS: Record<string, string> = {
  all: "All", top: "Tops", bottom: "Bottoms",
  shoes: "Shoes", outerwear: "Layers", accessory: "Accessories",
};

export default function Wardrobe({ onAddClick, darkMode }: Props) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<ClothingItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSubcategory, setEditSubcategory] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editFit, setEditFit] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  // Select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const r = await fetch("/api/clothes"); if (r.ok) setItems(await r.json()); }
    catch {} finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    setDeleting(true);
    try { const r = await fetch(`/api/clothes/${id}`, { method: "DELETE" }); if (r.ok) { setItems(p => p.filter(i => i.id !== id)); setSelected(null); setConfirmDelete(false); } }
    catch {} finally { setDeleting(false); }
  };

  const bulkRemove = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => fetch(`/api/clothes/${id}`, { method: "DELETE" })));
      setItems(p => p.filter(i => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
      setSelectMode(false);
      setBulkConfirm(false);
    } catch {} finally { setBulkDeleting(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleFav = async (item: ClothingItem) => {
    try {
      const r = await fetch(`/api/clothes/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFavorite: !item.isFavorite }) });
      if (r.ok) { const u = await r.json(); setItems(p => p.map(i => i.id === u.id ? u : i)); if (selected?.id === item.id) setSelected(u); }
    } catch {}
  };

  const startEdit = () => {
    if (!selected) return;
    setEditName(selected.name); setEditCategory(selected.category); setEditSubcategory(selected.subcategory || "");
    setEditColor(selected.primaryColor); setEditFit((selected as Record<string, unknown>).fit as string || ""); setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSavingEdit(true);
    try {
      const r = await fetch(`/api/clothes/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName, category: editCategory, subcategory: editSubcategory, primaryColor: editColor, fit: editFit || null }) });
      if (r.ok) { const u = await r.json(); setItems(p => p.map(i => i.id === u.id ? u : i)); setSelected(u); setEditing(false); }
    } catch {} finally { setSavingEdit(false); }
  };

  const closeSheet = () => { setSelected(null); setConfirmDelete(false); setEditing(false); };
  const filtered = filter === "all" ? items : items.filter(i => i.category === filter);
  const cats = ["all", ...Array.from(new Set(items.map(i => i.category)))];
  const d = darkMode;

  if (loading) return <div className="grid grid-cols-3 gap-1.5 animate-fade-in">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-square rounded-xl skeleton" />)}</div>;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center pt-20 animate-fade-up">
        <div className={`w-20 h-20 rounded-2xl ${d ? "bg-zinc-800" : "bg-zinc-100"} flex items-center justify-center mb-5`}>
          <svg viewBox="0 0 24 24" className={`w-8 h-8 ${d ? "text-zinc-600" : "text-zinc-300"}`} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
        </div>
        <p className={`text-[17px] font-semibold ${d ? "text-white" : "text-zinc-800"} mb-1`}>Your closet is empty</p>
        <p className={`text-[13px] ${d ? "text-zinc-500" : "text-zinc-400"} text-center max-w-[240px] mb-6`}>Tap the + button to add your first item</p>
        <button onClick={onAddClick} className={`h-11 px-6 ${d ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"} rounded-full text-[13px] font-semibold active:scale-95 transition-all`}>Add your first item</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Top bar: filters + select mode toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1 mr-2">
          {cats.map(c => {
            const count = c === "all" ? items.length : items.filter(i => i.category === c).length;
            return (
              <button key={c} onClick={() => setFilter(c)}
                className={`flex-shrink-0 h-8 px-3 rounded-full text-[12px] font-medium transition-all flex items-center gap-1 ${
                  filter === c ? (d ? "bg-white text-zinc-900" : "bg-zinc-900 text-white") : (d ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500")
                }`}>{CAT_LABELS[c] || c} <span className="text-[10px] opacity-60">{count}</span></button>
            );
          })}
        </div>
        <button onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); setBulkConfirm(false); }}
          className={`flex-shrink-0 h-8 px-3 rounded-full text-[11px] font-medium transition-all ${
            selectMode ? "bg-red-500 text-white" : (d ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500")
          }`}>
          {selectMode ? "Cancel" : "Select"}
        </button>
      </div>

      {/* Bulk delete bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="mb-3 animate-fade-up">
          {!bulkConfirm ? (
            <button onClick={() => setBulkConfirm(true)}
              className="w-full h-10 rounded-xl bg-red-500 text-white text-[13px] font-semibold active:scale-[0.98] transition-all">
              Remove {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""}
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setBulkConfirm(false)} className="flex-1 h-10 rounded-xl bg-zinc-100 text-zinc-600 text-[13px] font-medium">Cancel</button>
              <button onClick={bulkRemove} disabled={bulkDeleting}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
                {bulkDeleting ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Removing</> : `Yes, remove ${selectedIds.size}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {filtered.map((item, i) => (
          <button key={item.id}
            onClick={() => {
              if (selectMode) { toggleSelect(item.id); }
              else { setSelected(item); setConfirmDelete(false); setEditing(false); }
            }}
            className={`aspect-square rounded-xl overflow-hidden relative group bg-zinc-100 animate-pop-in ${
              selectMode && selectedIds.has(item.id) ? "ring-2 ring-red-500 ring-offset-1" : ""
            }`}
            style={{ animationDelay: `${i * 30}ms` }}>
            <img src={item.imageData} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {/* Select checkbox */}
            {selectMode && (
              <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                selectedIds.has(item.id) ? "bg-red-500 text-white" : "bg-black/30 backdrop-blur text-white/70"
              }`}>
                {selectedIds.has(item.id) ? "✓" : ""}
              </div>
            )}
            {!selectMode && item.isFavorite && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-[10px]">♥</div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-6">
              <p className="text-[10px] font-medium text-white truncate">{item.name}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Detail Sheet */}
      {selected && !selectMode && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) closeSheet(); }}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[55vh] overflow-y-auto animate-slide-up">
            {/* Handle + close */}
            <div className="sticky top-0 bg-white z-10 rounded-t-3xl">
              <div className="w-10 h-1 rounded-full bg-zinc-300 mx-auto mt-2.5" />
              <div className="flex items-center justify-between px-4 py-1.5">
                <button onClick={closeSheet} className="text-[14px] text-zinc-400 font-medium">Close</button>
                <span className="text-[13px] font-semibold text-zinc-900">{editing ? "Edit" : "Details"}</span>
                <div className="w-10" />
              </div>
            </div>

            {!editing ? (
              <>
                {/* Image + info side by side */}
                <div className="px-4 pb-2 flex gap-3">
                  <div className="w-24 h-24 flex-shrink-0 bg-zinc-50 overflow-hidden rounded-xl">
                    <img src={selected.imageData} alt={selected.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-[16px] font-semibold text-zinc-900 truncate">{selected.name}</p>
                    <p className="text-[12px] text-zinc-400 mt-0.5">{selected.subcategory || selected.category}{selected.brand && ` · ${selected.brand}`}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[selected.primaryColor, (selected as Record<string, unknown>).fit as string | undefined, selected.pattern]
                        .filter(Boolean).map(tag => (
                          <span key={tag} className="h-5 px-2 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-medium flex items-center">{tag}</span>
                        ))}
                    </div>
                  </div>
                  <button onClick={() => toggleFav(selected)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 transition-all active:scale-90 ${selected.isFavorite ? "bg-red-50 text-red-500" : "bg-zinc-100 text-zinc-400"}`}>
                    {selected.isFavorite ? "♥" : "♡"}
                  </button>
                </div>
                <div className="px-4 pb-4 space-y-2">
                  <button onClick={startEdit} className="w-full h-10 rounded-xl text-[13px] font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] transition-all">Edit details</button>
                  {!confirmDelete ? (
                    <button onClick={() => setConfirmDelete(true)} className="w-full h-11 rounded-xl text-[13px] font-medium text-red-500 bg-red-50 hover:bg-red-100 active:scale-[0.98] transition-all">Remove item</button>
                  ) : (
                    <div className="space-y-2 animate-fade-up">
                      <p className="text-[12px] text-zinc-500 text-center">Are you sure? This can&apos;t be undone.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDelete(false)} className="flex-1 h-11 rounded-xl text-[13px] font-medium text-zinc-600 bg-zinc-100 active:scale-[0.98] transition-all">Cancel</button>
                        <button onClick={() => remove(selected.id)} disabled={deleting}
                          className="flex-1 h-11 rounded-xl text-[13px] font-semibold text-white bg-red-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                          {deleting ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Removing</> : "Yes, remove"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="px-5 pb-5 space-y-4 animate-fade-up">
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Name</label>
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-[14px] focus:outline-none focus:border-zinc-400" />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(c => (
                      <button key={c.value} onClick={() => { setEditCategory(c.value); setEditSubcategory(""); }}
                        className={`h-8 px-3 rounded-full text-[11px] font-medium active:scale-95 transition-all ${editCategory === c.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>{c.label}</button>
                    ))}
                  </div>
                </div>
                {editCategory && SUBCATEGORIES[editCategory] && (
                  <div>
                    <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {SUBCATEGORIES[editCategory].map(s => (
                        <button key={s} onClick={() => setEditSubcategory(s)}
                          className={`h-8 px-3 rounded-full text-[11px] font-medium active:scale-95 transition-all ${editSubcategory === s ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500"}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PREDEFINED_COLORS.map(c => (
                      <button key={c} onClick={() => setEditColor(c)}
                        className={`h-8 px-3 rounded-full text-[11px] font-medium active:scale-95 transition-all ${editColor === c ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>{c}</button>
                    ))}
                  </div>
                </div>
                {FIT_TYPES[editCategory] && (
                  <div>
                    <label className="text-[12px] font-medium text-zinc-500 mb-1.5 block">Fit</label>
                    <div className="flex flex-wrap gap-1.5">
                      {FIT_TYPES[editCategory].map(f => (
                        <button key={f} onClick={() => setEditFit(editFit === f ? "" : f)}
                          className={`h-8 px-3 rounded-full text-[11px] font-medium active:scale-95 transition-all ${editFit === f ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500"}`}>{f}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditing(false)} className="flex-1 h-11 rounded-xl bg-zinc-100 text-zinc-600 text-[13px] font-medium active:scale-[0.97] transition-all">Cancel</button>
                  <button onClick={saveEdit} disabled={savingEdit}
                    className="flex-1 h-11 rounded-xl bg-zinc-900 text-white text-[13px] font-semibold active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {savingEdit ? <><span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving</> : "Save changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
