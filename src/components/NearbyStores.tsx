"use client";

import { useState, useCallback } from "react";

interface Store { name: string; description: string; icon: string; directionsUrl: string; category: string; }
interface StoreData { googleMapsUrl: string; stores: Store[]; lat: number; lng: number; }

const CATS = [
  { id: "all", label: "All" },
  { id: "thrift", label: "Thrift" },
  { id: "budget", label: "Budget" },
  { id: "shoes", label: "Shoes" },
];

export default function NearbyStores() {
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hasLoc, setHasLoc] = useState(false);
  const [cat, setCat] = useState("all");

  const fetchStores = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/stores?lat=${lat}&lng=${lng}`);
      if (r.ok) setData(await r.json());
    } catch {} finally { setLoading(false); }
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setErr("Geolocation not supported"); return; }
    setLoading(true); setErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setHasLoc(true); fetchStores(pos.coords.latitude, pos.coords.longitude); },
      (e) => { setLoading(false); setErr(e.code === 1 ? "Location denied — enable in settings" : "Location unavailable"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchStores]);

  if (!hasLoc && !loading) {
    return (
      <div className="text-center pt-16 animate-fade-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-zinc-700 mb-1">Find cheap stores near you</p>
        <p className="text-[13px] text-zinc-400 max-w-[260px] mx-auto mb-5">
          Ukay-ukay, tiangge, surplus shops &amp; budget stores
        </p>
        <button onClick={locate}
          className="h-11 px-5 bg-zinc-900 text-white rounded-xl text-[13px] font-semibold hover:bg-zinc-800 active:scale-95 transition-all mx-auto flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          Enable location
        </button>
        {err && <p className="mt-4 text-[12px] text-red-500">{err}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        {[1,2,3,4,5].map((i) => <div key={i} className="h-16 rounded-xl skeleton" />)}
      </div>
    );
  }

  if (!data) return null;

  const stores = cat === "all" ? data.stores : data.stores.filter((s) => s.category === cat);

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`flex-shrink-0 h-8 px-3 rounded-full text-[12px] font-medium transition-all ${
              cat === c.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}>{c.label}</button>
        ))}
      </div>

      {/* Store list */}
      <div className="space-y-1">
        {stores.map((s, i) => (
          <a key={s.name} href={s.directionsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 transition-colors group animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}>
            <span className="text-xl w-8 text-center">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-zinc-800">{s.name}</p>
              <p className="text-[11px] text-zinc-400 truncate">{s.description}</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ))}
      </div>

      {/* Maps */}
      <a href={data.googleMapsUrl} target="_blank" rel="noopener noreferrer"
        className="block h-12 rounded-xl bg-zinc-900 text-white text-[13px] font-semibold flex items-center justify-center hover:bg-zinc-800 active:scale-[0.98] transition-all">
        View all on Google Maps
      </a>

      {/* Online budget shops */}
      <div>
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Shop online cheap</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { name: "Shopee", icon: "🧡", url: "https://shopee.ph/search?keyword=clothes+cheap", tag: "from ₱49" },
            { name: "TikTok Shop", icon: "🎵", url: "https://www.tiktok.com/shop/search?q=affordable+fashion", tag: "trending" },
            { name: "Lazada", icon: "💙", url: "https://www.lazada.com.ph/catalog/?q=cheap+clothes", tag: "flash sale" },
            { name: "Carousell", icon: "🔴", url: "https://www.carousell.ph/categories/mens-fashion-702/?sort_by=price&tab=all", tag: "preloved" },
            { name: "FB Market", icon: "📘", url: "https://www.facebook.com/marketplace/category/apparel", tag: "local sellers" },
            { name: "IG Shops", icon: "📸", url: "https://www.instagram.com/explore/tags/shopeefindsph/", tag: "finds" },
          ].map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 active:scale-95 transition-all">
              <span className="text-lg">{s.icon}</span>
              <span className="text-[11px] font-medium text-zinc-700">{s.name}</span>
              <span className="text-[9px] text-zinc-400">{s.tag}</span>
            </a>
          ))}
        </div>
      </div>

      <button onClick={locate}
        className="w-full h-10 rounded-xl text-[12px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors">
        Refresh location
      </button>
    </div>
  );
}
