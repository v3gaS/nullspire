"use client";

import { create } from "zustand";

/** Ephemeral combat FX signals (not persisted). */
interface FxState {
  muzzleUntil: number;
  muzzleColor: string;
  kick: number;
  hitUntil: number;
  pulseMuzzle: (color: string, ms?: number) => void;
  pulseHit: () => void;
}

export const useFxStore = create<FxState>((set) => ({
  muzzleUntil: 0,
  muzzleColor: "#7dffef",
  kick: 0,
  hitUntil: 0,
  pulseMuzzle: (color, ms = 70) =>
    set({
      muzzleUntil: performance.now() + ms,
      muzzleColor: color,
      kick: 1,
    }),
  pulseHit: () => set({ hitUntil: performance.now() + 90 }),
}));
