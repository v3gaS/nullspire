"use client";

import { create } from "zustand";

export interface DamagePopup {
  id: number;
  damage: number;
  born: number;
}

/** Ephemeral combat FX signals (not persisted). */
interface FxState {
  muzzleUntil: number;
  muzzleColor: string;
  kick: number;
  hitUntil: number;
  damagePopups: DamagePopup[];
  pulseMuzzle: (color: string, ms?: number) => void;
  pulseHit: () => void;
  pushDamage: (damage: number) => void;
}

let popupId = 0;

export const useFxStore = create<FxState>((set, get) => ({
  muzzleUntil: 0,
  muzzleColor: "#7dffef",
  kick: 0,
  hitUntil: 0,
  damagePopups: [],
  pulseMuzzle: (color, ms = 70) =>
    set({
      muzzleUntil: performance.now() + ms,
      muzzleColor: color,
      kick: 1,
    }),
  pulseHit: () => set({ hitUntil: performance.now() + 90 }),
  pushDamage: (damage) => {
    const now = performance.now();
    const next = get()
      .damagePopups.filter((p) => now - p.born < 700)
      .concat({ id: ++popupId, damage, born: now })
      .slice(-8);
    set({ damagePopups: next });
  },
}));
