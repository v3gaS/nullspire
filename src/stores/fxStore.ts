"use client";

import { create } from "zustand";

/** Ephemeral combat FX signals (not persisted). */
interface FxState {
  muzzleUntil: number;
  muzzleColor: string;
  kick: number;
  pulseMuzzle: (color: string, ms?: number) => void;
}

export const useFxStore = create<FxState>((set) => ({
  muzzleUntil: 0,
  muzzleColor: "#7dffef",
  kick: 0,
  pulseMuzzle: (color, ms = 70) =>
    set({
      muzzleUntil: performance.now() + ms,
      muzzleColor: color,
      kick: 1,
    }),
}));
