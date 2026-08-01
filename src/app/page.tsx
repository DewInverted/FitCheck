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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setPrefs({ gender: data.gender, defaultStyle: data.defaultStyle }); })
      .finally(() => setPrefsLoaded(true));

    // Load theme
    const saved = localStorage.getItem("fitcheck-dark");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("fitcheck-dark", String(darkMode));
  }, [darkMode]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "wardrobe", label: "Closet", icon: <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="3" x2="12" y2="21" /><circle cx="9" cy="12" r="0.5" fill="currentColor" /><circle cx="15" cy="12" r="0.5" fill="currentColor" /></svg> },
    { id: "outfits", label: "Style", icon: <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg> },
    { id: "suggestions", label: "Shop", icon: <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg> },
    { id: "stores", label: "Near Me", icon: <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> },
  ];

  if (!prefsLoaded) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center gap-3">
        <span className="text-[20px] font-bold text-white tracking-tight">fitcheck</span>
        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!prefs) {
    return <Onboarding onComplete={(gender, style) => setPrefs({ gender, defaultStyle: style })} />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? "bg-zinc-950" : "gradient-mesh"}`}>
      {/* Header — safe area aware */}
      <header className={`${darkMode ? "bg-zinc-900/90" : "glass"} border-b ${darkMode ? "border-zinc-800" : "border-zinc-100/80"} sticky top-0 z-40 pt-[env(safe-area-inset-top)]`}>
        <div className="max-w-lg mx-auto px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${darkMode ? "bg-white" : "bg-zinc-900"} flex items-center justify-center`}>
              <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${darkMode ? "text-zinc-900" : "text-white"}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
              </svg>
            </div>
            <span className={`text-[15px] font-bold tracking-tight ${darkMode ? "text-white" : "text-zinc-900"}`}>fitcheck</span>
          </div>
          {/* Theme toggle */}
          <button onClick={() => setDarkMode(!darkMode)}
            className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all ${darkMode ? "bg-zinc-800 text-yellow-400" : "bg-zinc-100 text-zinc-500"}`}>
            {darkMode ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 pt-5 pb-28">
        {activeTab === "wardrobe" && <Wardrobe key={refreshKey} onAddClick={() => setShowAddModal(true)} darkMode={darkMode} />}
        {activeTab === "outfits" && <OutfitGenerator key={refreshKey} defaultStyle={prefs.defaultStyle} gender={prefs.gender} />}
        {activeTab === "suggestions" && <Suggestions key={refreshKey} gender={prefs.gender} defaultStyle={prefs.defaultStyle} />}
        {activeTab === "stores" && <NearbyStores />}
      </main>

      {/* Floating Add Button */}
      <div className="fixed z-50 flex justify-center left-0 right-0" style={{ bottom: "calc(70px + env(safe-area-inset-bottom))" }}>
        <button onClick={() => setShowAddModal(true)}
          className={`w-14 h-14 rounded-full ${darkMode ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"} shadow-lg shadow-zinc-900/25 flex items-center justify-center active:scale-90 transition-all`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Bottom Tab Bar */}
      <nav className={`${darkMode ? "bg-zinc-900/90 border-zinc-800" : "glass border-zinc-100/80"} border-t fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]`}>
        <div className="max-w-lg mx-auto grid grid-cols-4">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center pt-2 pb-1.5 gap-0.5 transition-all relative ${
                  active ? (darkMode ? "text-white" : "text-zinc-900") : (darkMode ? "text-zinc-600" : "text-zinc-400")
                }`}>
                {active && <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 ${darkMode ? "bg-white" : "bg-zinc-900"} rounded-full`} />}
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
