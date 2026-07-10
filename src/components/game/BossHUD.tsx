"use client";

import { useGameStore } from "@/stores/gameStore";

/** Compact boss HP readout when a boss is active in objective text. */
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
  if (screen !== "playing" && screen !== "paused") return null;
  if (hp <= 0) return null;
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className="pointer-events-none absolute left-1/2 top-20 z-10 w-[min(28rem,90vw)] -translate-x-1/2">
      <div className="rounded border border-fuchsia-400/30 bg-black/50 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] text-fuchsia-100">
            {name}
          </p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-fuchsia-300/80">
            Phase {phase}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-sm bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-600 to-cyan-400 transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
