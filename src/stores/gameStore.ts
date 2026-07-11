import { create } from "zustand";
import { playerPhysics } from "@/lib/game/playerPhysics";

export type GameScreen = "title" | "playing" | "paused" | "dead" | "victory";

export type WeaponId =
  | "pulse_smg"
  | "scatter_carbine"
  | "arc_caster"
  | "rail_lance"
  | "void_launcher";

export interface WeaponState {
  id: WeaponId;
  unlocked: boolean;
  ammo: number;
  reserve: number;
}

export interface Checkpoint {
  x: number;
  y: number;
  z: number;
  label: string;
}

export interface BossHudState {
  name: string;
  hp: number;
  maxHp: number;
  phase: number;
  active: boolean;
}

export interface GameState {
  screen: GameScreen;
  /** Bumps on every Deploy/Reboot so the player RigidBody remounts at the pad. */
  runId: number;
  health: number;
  armor: number;
  nullEnergy: number;
  mouseSensitivity: number;
  muted: boolean;
  sfxVolume: number;
  activeWeapon: WeaponId;
  weapons: Record<WeaponId, WeaponState>;
  objective: string;
  invulnerableUntil: number;
  lastDamagedAt: number;
  checkpoint: Checkpoint;
  boss: BossHudState;
  frags: number;
  secretsFound: number;
  setScreen: (screen: GameScreen) => void;
  setHealth: (health: number) => void;
  setArmor: (armor: number) => void;
  setNullEnergy: (energy: number) => void;
  setMouseSensitivity: (value: number) => void;
  setMuted: (muted: boolean) => void;
  setSfxVolume: (value: number) => void;
  setActiveWeapon: (id: WeaponId) => void;
  setObjective: (text: string) => void;
  setCheckpoint: (cp: Checkpoint) => void;
  setBoss: (boss: Partial<BossHudState>) => void;
  clearBoss: () => void;
  addFrag: () => void;
  addSecret: () => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  spendNullEnergy: (amount: number) => boolean;
  resetRun: () => void;
}

const defaultWeapons: Record<WeaponId, WeaponState> = {
  pulse_smg: { id: "pulse_smg", unlocked: true, ammo: 35, reserve: 140 },
  scatter_carbine: {
    id: "scatter_carbine",
    unlocked: false,
    ammo: 7,
    reserve: 28,
  },
  arc_caster: { id: "arc_caster", unlocked: false, ammo: 14, reserve: 42 },
  rail_lance: { id: "rail_lance", unlocked: false, ammo: 5, reserve: 15 },
  void_launcher: {
    id: "void_launcher",
    unlocked: false,
    ammo: 4,
    reserve: 12,
  },
};

const defaultBoss: BossHudState = {
  name: "",
  hp: 0,
  maxHp: 1,
  phase: 1,
  active: false,
};

const startCheckpoint: Checkpoint = {
  x: 0,
  y: 2,
  z: 8,
  label: "Drop Zone",
};

function loadSens(): number {
  if (typeof window === "undefined") return 1;
  const v = Number(window.localStorage.getItem("nullspire_sens"));
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function loadSfxVolume(): number {
  if (typeof window === "undefined") return 1;
  const v = Number(window.localStorage.getItem("nullspire_sfx"));
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: "title",
  runId: 0,
  health: 100,
  armor: 50,
  nullEnergy: 100,
  mouseSensitivity: 1,
  muted: false,
  sfxVolume: 1,
  activeWeapon: "pulse_smg",
  weapons: defaultWeapons,
  objective: "Reach the Crash Rim beacon",
  invulnerableUntil: 0,
  lastDamagedAt: 0,
  checkpoint: startCheckpoint,
  boss: defaultBoss,
  frags: 0,
  secretsFound: 0,
  setScreen: (screen) => set({ screen }),
  setHealth: (health) => set({ health }),
  setArmor: (armor) => set({ armor }),
  setNullEnergy: (nullEnergy) => set({ nullEnergy }),
  setMouseSensitivity: (mouseSensitivity) => {
    set({ mouseSensitivity });
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nullspire_sens", String(mouseSensitivity));
    }
  },
  setMuted: (muted) => set({ muted }),
  setSfxVolume: (sfxVolume) => {
    const v = Math.max(0, Math.min(1, sfxVolume));
    set({ sfxVolume: v });
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nullspire_sfx", String(v));
    }
  },
  setActiveWeapon: (activeWeapon) => set({ activeWeapon }),
  setObjective: (objective) => set({ objective }),
  setCheckpoint: (checkpoint) => set({ checkpoint }),
  setBoss: (partial) => set({ boss: { ...get().boss, ...partial, active: true } }),
  clearBoss: () => set({ boss: { ...defaultBoss } }),
  addFrag: () => set({ frags: get().frags + 1 }),
  addSecret: () => set({ secretsFound: get().secretsFound + 1 }),
  damagePlayer: (amount) => {
    if (performance.now() < get().invulnerableUntil) return;
    const { armor, health } = get();
    let remaining = amount;
    let nextArmor = armor;
    if (nextArmor > 0) {
      const absorbed = Math.min(nextArmor, remaining);
      nextArmor -= absorbed;
      remaining -= absorbed;
    }
    const nextHealth = Math.max(0, health - remaining);
    set({
      armor: nextArmor,
      health: nextHealth,
      lastDamagedAt: performance.now(),
    });
    playerPhysics.punch(0.055 + amount * 0.004, (Math.random() - 0.5) * 0.02);
    playerPhysics.pushKnock(
      (Math.random() - 0.5) * 1.2,
      0.4,
      (Math.random() - 0.5) * 1.2,
    );
    if (nextHealth <= 0) set({ screen: "dead" });
  },
  healPlayer: (amount) =>
    set({ health: Math.min(100, get().health + amount) }),
  spendNullEnergy: (amount) => {
    const { nullEnergy } = get();
    if (nullEnergy < amount) return false;
    set({ nullEnergy: nullEnergy - amount });
    return true;
  },
  resetRun: () =>
    set({
      screen: "playing",
      runId: get().runId + 1,
      health: 100,
      armor: 50,
      nullEnergy: 100,
      activeWeapon: "pulse_smg",
      weapons: structuredClone(defaultWeapons),
      objective: "Reach the Crash Rim beacon",
      invulnerableUntil: performance.now() + 8000,
      checkpoint: startCheckpoint,
      boss: defaultBoss,
      frags: 0,
      secretsFound: 0,
      mouseSensitivity: loadSens(),
    }),
}));
