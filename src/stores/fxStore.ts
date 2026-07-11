import { create } from "zustand";

export interface DamagePopup {
  id: number;
  damage: number;
  born: number;
}

export interface KillFeedEntry {
  id: number;
  text: string;
  born: number;
}

const KILL_VERBS = [
  "fragged",
  "splattered",
  "gibbed",
  "vaporized",
  "shredded",
] as const;

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
  killFeed: KillFeedEntry[];
  pulseMuzzle: (color: string, ms?: number) => void;
  pulseHit: () => void;
  pulseKill: (targetName?: string) => void;
  pulseOverclock: (ms?: number) => void;
  pulseReload: (ms?: number) => void;
  pulseShake: (amp?: number, ms?: number) => void;
  pushDamage: (damage: number) => void;
  pushFeed: (text: string) => void;
}

let popupId = 0;
let feedId = 0;

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
  killFeed: [],
  pulseMuzzle: (color, ms = 85) =>
    set({
      muzzleUntil: performance.now() + ms,
      muzzleColor: color,
      kick: 1,
    }),
  pulseHit: () => set({ hitUntil: performance.now() + 120 }),
  pulseKill: (targetName) => {
    const now = performance.now();
    const prev = get();
    const chain = now < prev.multiKillUntil ? prev.multiKillCount + 1 : 1;
    const verb = KILL_VERBS[Math.floor(Math.random() * KILL_VERBS.length)]!;
    const name = targetName?.trim() || "hostile";
    const recent = prev.killFeed[prev.killFeed.length - 1];
    const skipFeed = recent && now - recent.born < 140;
    const feed = skipFeed
      ? prev.killFeed
      : prev.killFeed
          .filter((e) => now - e.born < 4500)
          .concat({
            id: ++feedId,
            text: `You ${verb} ${name}`,
            born: now,
          })
          .slice(-6);
    set({
      killUntil: now + 280,
      multiKillCount: chain,
      multiKillUntil: now + 2800,
      shakeUntil: now + (chain >= 3 ? 320 : 160),
      shakeAmp: Math.max(prev.shakeAmp, chain >= 3 ? 0.18 : 0.1),
      killFeed: feed,
    });
  },
  pulseOverclock: (ms = 3000) =>
    set({ overclockUntil: performance.now() + ms }),
  pulseReload: (ms = 750) => set({ reloadUntil: performance.now() + ms }),
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
  pushFeed: (text) => {
    const now = performance.now();
    set({
      killFeed: get()
        .killFeed.filter((e) => now - e.born < 4500)
        .concat({ id: ++feedId, text, born: now })
        .slice(-6),
    });
  },
}));
