"use client";

import { useGameStore } from "@/stores/gameStore";
import { WEAPON_META } from "@/lib/game/constants";

export function TitleScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const resetRun = useGameStore((s) => s.resetRun);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, #2a1850 0%, #0b0614 55%, #05030a 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(80,255,220,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(80,255,220,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />

      <p className="relative z-10 mb-3 text-xs uppercase tracking-[0.45em] text-cyan-300/80">
        Exoplanet Strike Protocol
      </p>
      <h1 className="relative z-10 font-[family-name:var(--font-display)] text-6xl font-bold tracking-[0.12em] text-transparent sm:text-7xl"
        style={{
          backgroundImage: "linear-gradient(180deg, #e8fff9 0%, #5dffd7 45%, #7a6bff 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        NULLSPIRE
      </h1>
      <p className="relative z-10 mt-4 max-w-md px-6 text-center text-sm leading-relaxed text-zinc-300/90">
        Survive the ruined research world. Master vertical ruins, alien packs, and
        tech remnants. Unlock five weapons. Bring down the Primarch.
      </p>

      <div className="relative z-10 mt-10 flex flex-col items-center gap-3">
        <button
          type="button"
          className="min-w-52 rounded border border-cyan-300/50 bg-cyan-400/15 px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-50 shadow-[0_0_40px_rgba(46,230,200,0.15)] transition hover:bg-cyan-300/25"
          onClick={() => {
            resetRun();
            setScreen("playing");
          }}
        >
          Deploy
        </button>
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          WASD · Mouse · Space · Shift · Esc
        </p>
      </div>

      <p className="relative z-10 mt-16 text-[10px] uppercase tracking-[0.3em] text-zinc-600">
        Free assets credited in-game · {WEAPON_META.pulse_smg.name} ready
      </p>
    </div>
  );
}
