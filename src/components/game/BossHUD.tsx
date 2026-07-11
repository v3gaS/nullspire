"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/stores/gameStore";

/** Compact boss HP readout — reads store itself so Canvas never re-renders on HP ticks. */
export function BossHUD() {
  const screen = useGameStore((s) => s.screen);
  const active = useGameStore((s) => s.boss.active);
  const name = useGameStore((s) => s.boss.name);
  const hp = useGameStore((s) => s.boss.hp);
  const maxHp = useGameStore((s) => s.boss.maxHp);
  const phase = useGameStore((s) => s.boss.phase);
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

  if (!active) return null;
  if (screen !== "playing" && screen !== "paused") return null;
  if (hp <= 0) return null;
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className="pointer-events-none absolute left-1/2 top-20 z-10 w-[min(32rem,92vw)] -translate-x-1/2">
      <div
        className={`rounded bg-black/60 px-5 py-3 backdrop-blur-[2px] ${
          phaseFlash
            ? "shadow-[0_0_40px_rgba(255,122,24,0.55)] ring-1 ring-orange-300/80"
            : "shadow-[0_0_24px_rgba(255,122,24,0.2)]"
        }`}
      >
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.18em] text-orange-100">
            {name}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-orange-300/80">
            Phase {phase}
          </p>
        </div>
        <div className="h-2.5 overflow-hidden rounded bg-zinc-900/80">
          <div
            className="h-full rounded bg-gradient-to-r from-orange-600 to-amber-300 transition-[width] duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-right text-[10px] tabular-nums text-zinc-400">
          {Math.ceil(hp)} / {maxHp}
        </p>
      </div>
    </div>
  );
}
