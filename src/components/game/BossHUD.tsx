"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/stores/gameStore";

/** Compact boss HP readout when a boss is active. */
export function BossHUD({
  name,
  hp,
  maxHp,
  phase,
}: {
  name: string;
  hp: number;
  maxHp: number;
  phase: number;
}) {
  const screen = useGameStore((s) => s.screen);
  const prevPhase = useRef(phase);
  const [phaseFlash, setPhaseFlash] = useState(false);

  useEffect(() => {
    if (phase !== prevPhase.current) {
      prevPhase.current = phase;
      setPhaseFlash(true);
      const id = window.setTimeout(() => setPhaseFlash(false), 1100);
      return () => window.clearTimeout(id);
    }
  }, [phase]);

  if (screen !== "playing" && screen !== "paused") return null;
  if (hp <= 0) return null;
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className="pointer-events-none absolute left-1/2 top-20 z-10 w-[min(28rem,90vw)] -translate-x-1/2">
      <div
        className={`rounded bg-black/55 px-4 py-2.5 backdrop-blur-[2px] ${
          phaseFlash
            ? "shadow-[0_0_32px_rgba(255,122,24,0.45)] ring-1 ring-orange-300/70"
            : "ring-1 ring-white/10"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold tracking-wide text-white">
            {name}
          </p>
          <p
            className={`text-[10px] uppercase tracking-[0.25em] ${
              phaseFlash ? "animate-pulse text-orange-300" : "text-white/45"
            }`}
          >
            Phase {phase}
          </p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-sm bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-300 transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        {phaseFlash ? (
          <p className="mt-1 animate-pulse text-center text-[11px] font-bold uppercase tracking-[0.35em] text-orange-200">
            Phase shift — open fire
          </p>
        ) : null}
      </div>
    </div>
  );
}
