import { create } from "zustand";

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

export interface GameState {
  screen: GameScreen;
  health: number;
  armor: number;
  nullEnergy: number;
  mouseSensitivity: number;
  activeWeapon: WeaponId;
  weapons: Record<WeaponId, WeaponState>;
  objective: string;
  setScreen: (screen: GameScreen) => void;
  setHealth: (health: number) => void;
  setArmor: (armor: number) => void;
  setNullEnergy: (energy: number) => void;
  setMouseSensitivity: (value: number) => void;
  setActiveWeapon: (id: WeaponId) => void;
  setObjective: (text: string) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  spendNullEnergy: (amount: number) => boolean;
  resetRun: () => void;
}

const defaultWeapons: Record<WeaponId, WeaponState> = {
  pulse_smg: { id: "pulse_smg", unlocked: true, ammo: 30, reserve: 120 },
  scatter_carbine: {
    id: "scatter_carbine",
    unlocked: false,
    ammo: 6,
    reserve: 24,
  },
  arc_caster: { id: "arc_caster", unlocked: false, ammo: 12, reserve: 36 },
  rail_lance: { id: "rail_lance", unlocked: false, ammo: 4, reserve: 12 },
  void_launcher: {
    id: "void_launcher",
    unlocked: false,
    ammo: 3,
    reserve: 9,
  },
};

export const useGameStore = create<GameState>((set, get) => ({
  screen: "title",
  health: 100,
  armor: 0,
  nullEnergy: 100,
  mouseSensitivity: 1,
  activeWeapon: "pulse_smg",
  weapons: defaultWeapons,
  objective: "Reach the Crash Rim beacon",
  setScreen: (screen) => set({ screen }),
  setHealth: (health) => set({ health }),
  setArmor: (armor) => set({ armor }),
  setNullEnergy: (nullEnergy) => set({ nullEnergy }),
  setMouseSensitivity: (mouseSensitivity) => set({ mouseSensitivity }),
  setActiveWeapon: (activeWeapon) => set({ activeWeapon }),
  setObjective: (objective) => set({ objective }),
  damagePlayer: (amount) => {
    const { armor, health } = get();
    let remaining = amount;
    let nextArmor = armor;
    if (nextArmor > 0) {
      const absorbed = Math.min(nextArmor, remaining);
      nextArmor -= absorbed;
      remaining -= absorbed;
    }
    const nextHealth = Math.max(0, health - remaining);
    set({ armor: nextArmor, health: nextHealth });
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
      health: 100,
      armor: 0,
      nullEnergy: 100,
      activeWeapon: "pulse_smg",
      weapons: structuredClone(defaultWeapons),
      objective: "Reach the Crash Rim beacon",
    }),
}));
