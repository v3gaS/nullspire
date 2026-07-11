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
        className={`rounded border bg-black/50 px-4 py-2 backdrop-blur-sm ${
          phaseFlash
            ? "border-amber-300/80 shadow-[0_0_32px_rgba(251,191,36,0.5)]"
            : "border-teal-400/30"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] text-teal-50">
            {name}
          </p>
          <p
            className={`text-[10px] uppercase tracking-[0.25em] ${
              phaseFlash ? "animate-pulse text-amber-200" : "text-amber-200/80"
            }`}
          >
            Phase {phase}
          </p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-sm bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-teal-400 transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        {phaseFlash ? (
          <p className="mt-1 animate-pulse text-center text-[11px] font-bold uppercase tracking-[0.35em] text-amber-100">
            Phase shift — open fire
          </p>
        ) : null}
      </div>
    </div>
  );
}
