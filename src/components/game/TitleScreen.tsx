"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import {
  useSettingsStore,
  type QualityPreset,
} from "@/stores/settingsStore";
import { CreditsScreen } from "./CreditsScreen";

export function TitleScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const resetRun = useGameStore((s) => s.resetRun);
  const quality = useSettingsStore((s) => s.quality);
  const setQuality = useSettingsStore((s) => s.setQuality);
  const [showCredits, setShowCredits] = useState(false);

  if (showCredits) {
    return <CreditsScreen onBack={() => setShowCredits(false)} />;
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-95"
        style={{
          background:
            "radial-gradient(ellipse at 50% 18%, #3d4a5c 0%, #1a2433 48%, #0d141c 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(46,230,200,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(201,166,107,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />

      <p className="relative z-10 mb-3 text-xs uppercase tracking-[0.45em] text-teal-300/80">
        Exoplanet Strike Protocol
      </p>
      <h1
        className="relative z-10 font-[family-name:var(--font-display)] text-6xl font-bold tracking-[0.12em] text-transparent sm:text-7xl"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #f5efe3 0%, #2ee6c8 50%, #c9a66b 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        NULLSPIRE
      </h1>
      <p className="relative z-10 mt-4 max-w-md px-6 text-center text-sm leading-relaxed text-zinc-300/90">
        Fast guns. Fat explosions. Secret caches off the main line. Chain the
        barrels, rocket-jump the pads, and melt the Primarch.
      </p>

      <div className="relative z-10 mt-10 flex flex-col items-center gap-3">
        <button
          type="button"
          className="min-w-52 rounded border border-teal-300/50 bg-teal-400/15 px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-teal-50 shadow-[0_0_40px_rgba(46,230,200,0.12)] transition hover:bg-teal-300/25"
          onClick={() => {
            resetRun();
            setScreen("playing");
          }}
        >
          Deploy
        </button>
        <label className="flex min-w-52 items-center justify-between gap-3 rounded border border-white/10 bg-black/25 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
          Quality
          <select
            className="rounded border border-white/15 bg-black/50 px-2 py-1 text-zinc-200"
            value={quality}
            onChange={(e) => setQuality(e.target.value as QualityPreset)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <button
          type="button"
          className="min-w-52 rounded border border-white/15 px-8 py-2 text-xs uppercase tracking-[0.25em] text-zinc-400 transition hover:bg-white/5"
          onClick={() => setShowCredits(true)}
        >
          Credits
        </button>
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          WASD · Mouse · Space · Shift · Esc
        </p>
      </div>

      <p className="relative z-10 mt-16 max-w-lg px-6 text-center text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        Assets: Kenney Space Kit + Starter Kit FPS (CC0) · see CREDITS.md
      </p>
    </div>
  );
}
