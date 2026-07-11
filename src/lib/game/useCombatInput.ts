"use client";

import { useEffect, useRef } from "react";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { WEAPON_ORDER } from "@/lib/game/constants";
import { playSfx } from "@/lib/game/audio";

const MAG_SIZE: Record<WeaponId, number> = {
  pulse_smg: 35,
  scatter_carbine: 7,
  arc_caster: 14,
  rail_lance: 5,
  void_launcher: 4,
};

function switchFlash(id: WeaponId): string {
  switch (id) {
    case "pulse_smg":
      return "#7dffef";
    case "scatter_carbine":
      return "#ffb347";
    case "arc_caster":
      return "#60a5fa";
    case "rail_lance":
      return "#e879f9";
    case "void_launcher":
      return "#c084fc";
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

/** Keyboard: reload (R), weapon switch 1-5. */
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
        useFxStore.getState().pulseReload(750);
        playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.35);
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
        }, 750);
      }

      const idx = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].indexOf(
        e.code,
      );
      if (idx >= 0) {
        const id = WEAPON_ORDER[idx];
        if (state.weapons[id].unlocked) {
          useGameStore.getState().setActiveWeapon(id);
          useFxStore.getState().pulseMuzzle(switchFlash(id), 70);
          useFxStore.getState().pulseShake(0.03, 60);
          playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.4);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
