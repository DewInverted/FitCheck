"use client";

import { useState } from "react";
import { STYLE_PRESETS } from "@/lib/colors";

interface Props {
  onComplete: (gender: string, style: string) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState("");
  const [style, setStyle] = useState("");
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, defaultStyle: style }),
      });
    } catch {}
    onComplete(gender, style);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900 flex flex-col overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-500/5 rounded-full blur-2xl" />
      </div>

      {/* Progress dots */}
      <div className="relative z-10 flex justify-center gap-2 pt-14 pb-4">
        {[0, 1, 2].map((s) => (
          <div key={s} className={`h-1 rounded-full transition-all duration-500 ${
            s <= step ? "bg-white w-8" : "bg-white/20 w-4"
          }`} />
        ))}
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div className="text-center animate-fade-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center animate-float">
              <svg viewBox="0 0 24 24" className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-[32px] font-bold text-white leading-tight mb-2">fitcheck</h1>
            <p className="text-[15px] text-white/50 mb-10 max-w-[280px]">
              Your wardrobe, styled. Take photos, build outfits, shop what&apos;s missing.
            </p>
            <button onClick={() => setStep(1)}
              className="w-full h-13 rounded-2xl bg-white text-zinc-900 text-[15px] font-semibold hover:bg-zinc-100 active:scale-[0.98] transition-all py-3.5">
              Get Started
            </button>
            <p className="text-[11px] text-white/30 mt-4">Works offline · Installable on your phone</p>
          </div>
        )}

        {/* ── Step 1: Gender ── */}
        {step === 1 && (
          <div className="w-full animate-fade-up">
            <p className="text-[13px] font-semibold text-white/40 uppercase tracking-widest mb-2">Step 1</p>
            <h1 className="text-[26px] font-bold text-white leading-tight mb-1">How do you dress?</h1>
            <p className="text-[14px] text-white/40 mb-8">So we can tailor everything for you</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button onClick={() => setGender("male")}
                className={`p-6 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                  gender === "male" ? "border-white bg-white/10" : "border-white/10 hover:border-white/20"
                }`}>
                <span className="text-4xl block mb-3">👔</span>
                <span className="text-[15px] font-semibold text-white">Men&apos;s</span>
              </button>
              <button onClick={() => setGender("female")}
                className={`p-6 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                  gender === "female" ? "border-white bg-white/10" : "border-white/10 hover:border-white/20"
                }`}>
                <span className="text-4xl block mb-3">👗</span>
                <span className="text-[15px] font-semibold text-white">Women&apos;s</span>
              </button>
            </div>

            <button onClick={() => { if (gender) setStep(2); }} disabled={!gender}
              className="w-full h-13 rounded-2xl bg-white text-zinc-900 text-[15px] font-semibold disabled:opacity-20 hover:bg-zinc-100 active:scale-[0.98] transition-all py-3.5">
              Continue
            </button>
          </div>
        )}

        {/* ── Step 2: Style ── */}
        {step === 2 && (
          <div className="w-full animate-fade-up">
            <p className="text-[13px] font-semibold text-white/40 uppercase tracking-widest mb-2">Step 2</p>
            <h1 className="text-[26px] font-bold text-white leading-tight mb-1">Pick your style</h1>
            <p className="text-[14px] text-white/40 mb-5">This will be your default vibe</p>

            <div className="grid grid-cols-2 gap-2 mb-6 max-h-[48vh] overflow-y-auto no-scrollbar pr-1">
              {STYLE_PRESETS.filter(s => s.gender === "all" || s.gender === gender).map((s, i) => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.97] animate-fade-up ${
                    style === s.id ? "border-white bg-white/10" : "border-white/10 hover:border-white/20"
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <span className="text-2xl block mb-1">{s.emoji}</span>
                  <span className="text-[13px] font-semibold text-white block">{s.label}</span>
                  <span className="text-[10px] text-white/40 leading-snug block mt-0.5">{s.description}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)}
                className="h-13 px-5 rounded-2xl border-2 border-white/20 text-white text-[14px] font-medium hover:bg-white/5 active:scale-[0.98] transition-all py-3.5">
                Back
              </button>
              <button onClick={finish} disabled={!style || saving}
                className="flex-1 h-13 rounded-2xl bg-white text-zinc-900 text-[15px] font-semibold disabled:opacity-20 hover:bg-zinc-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 py-3.5">
                {saving ? <><span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" /> Setting up...</> : "Let's go →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
