"use client";

import { useEffect, useState } from "react";
import { useFxStore, type DamagePopup } from "@/stores/fxStore";
import { useGameStore } from "@/stores/gameStore";

/** Floating damage numbers near the crosshair on confirmed hits. */
export function DamageNumbers() {
  const screen = useGameStore((s) => s.screen);
  const [items, setItems] = useState<DamagePopup[]>([]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      setItems(
        useFxStore.getState().damagePopups.filter((p) => now - p.born < 700),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (screen !== "playing" || items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-[42%] z-[8] -translate-x-1/2">
      {items.map((p, i) => {
        const age = (performance.now() - p.born) / 700;
        return (
          <div
            key={p.id}
            className="absolute left-1/2 font-mono text-sm font-semibold text-amber-200"
            style={{
              transform: `translate(-50%, ${-age * 36 - i * 4}px)`,
              opacity: 1 - age,
              textShadow: "0 0 6px rgba(0,0,0,0.8)",
            }}
          >
            {p.damage}
          </div>
        );
      })}
    </div>
  );
}
