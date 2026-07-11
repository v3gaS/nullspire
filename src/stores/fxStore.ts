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
  killUntil: number;
  multiKillUntil: number;
  multiKillCount: number;
  overclockUntil: number;
  reloadUntil: number;
  shakeUntil: number;
  shakeAmp: number;
  damagePopups: DamagePopup[];
  pulseMuzzle: (color: string, ms?: number) => void;
  pulseHit: () => void;
  pulseKill: () => void;
  pulseOverclock: (ms?: number) => void;
  pulseReload: (ms?: number) => void;
  pulseShake: (amp?: number, ms?: number) => void;
  pushDamage: (damage: number) => void;
}

let popupId = 0;

export const useFxStore = create<FxState>((set, get) => ({
  muzzleUntil: 0,
  muzzleColor: "#7dffef",
  kick: 0,
  hitUntil: 0,
  killUntil: 0,
  multiKillUntil: 0,
  multiKillCount: 0,
  overclockUntil: 0,
  reloadUntil: 0,
  shakeUntil: 0,
  shakeAmp: 0,
  damagePopups: [],
  pulseMuzzle: (color, ms = 70) =>
    set({
      muzzleUntil: performance.now() + ms,
      muzzleColor: color,
      kick: 1,
    }),
  pulseHit: () => set({ hitUntil: performance.now() + 90 }),
  pulseKill: () => {
    const now = performance.now();
    const prev = get();
    const chain = now < prev.multiKillUntil ? prev.multiKillCount + 1 : 1;
    set({
      killUntil: now + 200,
      multiKillCount: chain,
      multiKillUntil: now + 2600,
      shakeUntil: now + (chain >= 3 ? 280 : 140),
      shakeAmp: Math.max(prev.shakeAmp, chain >= 3 ? 0.16 : 0.08),
    });
  },
  pulseOverclock: (ms = 3000) =>
    set({ overclockUntil: performance.now() + ms }),
  pulseReload: (ms = 900) => set({ reloadUntil: performance.now() + ms }),
  pulseShake: (amp = 0.12, ms = 280) =>
    set({
      shakeUntil: performance.now() + ms,
      shakeAmp: Math.max(get().shakeAmp, amp),
    }),
  pushDamage: (damage) => {
    const now = performance.now();
    const next = get()
      .damagePopups.filter((p) => now - p.born < 700)
      .concat({ id: ++popupId, damage, born: now })
      .slice(-8);
    set({ damagePopups: next });
  },
}));
