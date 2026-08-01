"use client";

import { useState, useEffect } from "react";
import Wardrobe from "@/components/Wardrobe";
import AddClothingModal from "@/components/AddClothingModal";
import OutfitGenerator from "@/components/OutfitGenerator";
import Suggestions from "@/components/Suggestions";
import NearbyStores from "@/components/NearbyStores";
import Onboarding from "@/components/Onboarding";
import InstallPrompt from "@/components/InstallPrompt";

type Tab = "wardrobe" | "outfits" | "suggestions" | "stores";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("wardrobe");
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [prefs, setPrefs] = useState<{ gender: string; defaultStyle: string } | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setPrefs({ gender: data.gender, defaultStyle: data.defaultStyle }); })
      .finally(() => setPrefsLoaded(true));
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "wardrobe", label: "Closet", icon: <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="3" x2="12" y2="21" /><circle cx="9" cy="12" r="0.5" fill="currentColor" /><circle cx="15" cy="12" r="0.5" fill="currentColor" /></svg> },
    { id: "outfits", label: "Style", icon: <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg> },
    { id: "suggestions", label: "Shop", icon: <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg> },
    { id: "stores", label: "Near Me", icon: <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> },
  ];

  // Loading splash
  if (!prefsLoaded) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center gap-3">
        <span className="text-[20px] font-bold text-white tracking-tight">fitcheck</span>
        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Onboarding
  if (!prefs) {
    return <Onboarding onComplete={(gender, style) => setPrefs({ gender, defaultStyle: style })} />;
  }

  return (
    <div className="min-h-screen flex flex-col gradient-mesh">
      {/* Header */}
      <header className="glass border-b border-zinc-100/80 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-zinc-900">fitcheck</span>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="h-8 px-3.5 bg-zinc-900 text-white rounded-full text-[12px] font-medium hover:bg-zinc-800 active:scale-95 transition-all flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            Add
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 pt-5 pb-24">
        {activeTab === "wardrobe" && <Wardrobe key={refreshKey} onAddClick={() => setShowAddModal(true)} />}
        {activeTab === "outfits" && <OutfitGenerator key={refreshKey} defaultStyle={prefs.defaultStyle} gender={prefs.gender} />}
        {activeTab === "suggestions" && <Suggestions key={refreshKey} gender={prefs.gender} defaultStyle={prefs.defaultStyle} />}
        {activeTab === "stores" && <NearbyStores />}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="glass border-t border-zinc-100/80 fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto grid grid-cols-4">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center pt-2 pb-1.5 gap-0.5 transition-all relative ${
                  active ? "text-zinc-900" : "text-zinc-400"
                }`}>
                {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-zinc-900 rounded-full" />}
                {tab.icon}
                <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {showAddModal && (
        <AddClothingModal onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); setRefreshKey((k) => k + 1); }} />
      )}

      <InstallPrompt />
    </div>
  );
}
