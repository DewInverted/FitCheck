"use client";

import { useState, useEffect } from "react";

interface StoreResult {
  name: string;
  description: string;
  icon: string;
  directionsUrl: string;
  category: string;
}

export default function NearbyStores() {
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(`/api/stores?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          const data = await r.json();
          setStores(data.stores || []);
          setMapsUrl(data.googleMapsUrl || "");
        } catch {
          setError("Failed to load stores");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Please enable location access to find stores near you");
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl h-20 skeleton" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center pt-16 animate-fade-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-zinc-700 mb-1">Location needed</p>
        <p className="text-[13px] text-zinc-400 max-w-[260px] mx-auto">{error}</p>
      </div>
    );
  }

  const categories = [...new Set(stores.map((s) => s.category))];

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Stores near you</p>
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="text-[12px] text-blue-500 font-medium hover:underline">
            Open in Google Maps →
          </a>
        )}
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            {cat === "thrift" ? "🏷️ Thrift & Budget" : cat === "budget" ? "🛍️ Affordable" : "👟 Shoes"}
          </p>
          <div className="space-y-1.5">
            {stores
              .filter((s) => s.category === cat)
              .map((store, i) => (
                <a key={i} href={store.directionsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-100 hover:bg-zinc-50 active:scale-[0.98] transition-all">
                  <span className="text-2xl w-8 text-center">{store.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-800">{store.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{store.description}</p>
                  </div>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
