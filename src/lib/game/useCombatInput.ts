"use client";

import { useEffect, useRef } from "react";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { WEAPON_ORDER } from "@/lib/game/constants";
import { playSfx } from "@/lib/game/audio";

const MAG_SIZE: Record<WeaponId, number> = {
  pulse_smg: 35,
  scatter_carbine: 9,
  arc_caster: 14,
  rail_lance: 6,
  void_launcher: 5,
};

function switchFlash(id: WeaponId): string {
  switch (id) {
    case "pulse_smg":
      return "#7dffef";
    case "scatter_carbine":
      return "#ff7a18";
    case "arc_caster":
      return "#60a5fa";
    case "rail_lance":
      return "#e879f9";
    case "void_launcher":
      return "#ff7a18";
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function cycleWeapon(dir: 1 | -1) {
  const state = useGameStore.getState();
  const unlocked = WEAPON_ORDER.filter((id) => state.weapons[id].unlocked);
  if (unlocked.length < 2) return;
  const cur = unlocked.indexOf(state.activeWeapon);
  const next = unlocked[(cur + dir + unlocked.length) % unlocked.length]!;
  useGameStore.getState().setActiveWeapon(next);
  useFxStore.getState().pulseMuzzle(switchFlash(next), 140);
  useFxStore.getState().pulseShake(0.06, 95);
  playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.5);
}

/** Keyboard: reload (R), weapon switch 1-5, scroll cycle. */
export function useCombatInput() {
  const reloading = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (state.screen !== "playing") return;

      if (e.code === "KeyR" && !reloading.current) {
        const weapon = state.weapons[state.activeWeapon];
        const mag = MAG_SIZE[state.activeWeapon];
        if (weapon.ammo >= mag || weapon.reserve <= 0) return;
        reloading.current = true;
        useFxStore.getState().pulseReload(650);
        useFxStore.getState().pulseShake(0.08, 120);
        playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.52);
        window.setTimeout(() => {
          const s = useGameStore.getState();
          const w = s.weapons[s.activeWeapon];
          const need = MAG_SIZE[s.activeWeapon] - w.ammo;
          const take = Math.min(need, w.reserve);
          useGameStore.setState({
            weapons: {
              ...s.weapons,
              [s.activeWeapon]: {
                ...w,
                ammo: w.ammo + take,
                reserve: w.reserve - take,
              },
            },
          });
          reloading.current = false;
          playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.45);
          useFxStore.getState().pulseMuzzle(switchFlash(s.activeWeapon), 110);
        }, 650);
      }

      if (e.code === "KeyQ") {
        // Last weapon — cycle backward
        cycleWeapon(-1);
        return;
      }

      const idx = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].indexOf(
        e.code,
      );
      if (idx >= 0) {
        const id = WEAPON_ORDER[idx];
        if (state.weapons[id].unlocked) {
          useGameStore.getState().setActiveWeapon(id);
          useFxStore.getState().pulseMuzzle(switchFlash(id), 140);
          useFxStore.getState().pulseShake(0.06, 95);
          playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.5);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (useGameStore.getState().screen !== "playing") return;
      if (Math.abs(e.deltaY) < 2) return;
      cycleWeapon(e.deltaY > 0 ? 1 : -1);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);
}
