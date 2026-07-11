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
        useFxStore.getState().damagePopups.filter((p) => now - p.born < 850),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (screen !== "playing" || items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-[40%] z-[8] -translate-x-1/2">
      {items.map((p, i) => {
        const age = (performance.now() - p.born) / 850;
        const big = p.damage >= 40;
        const mid = p.damage >= 20;
        return (
          <div
            key={p.id}
            className="absolute left-1/2 font-mono font-black"
            style={{
              fontSize: big ? "1.65rem" : mid ? "1.35rem" : "1.1rem",
              transform: `translate(-50%, ${-age * 56 - i * 8}px) scale(${1 + (big ? 0.45 : mid ? 0.2 : 0)})`,
              opacity: 1 - age,
              color: big ? "#ff5533" : mid ? "#ffe066" : "#fde68a",
              textShadow: big
                ? "0 0 16px rgba(255,80,40,0.85), 0 2px 0 rgba(0,0,0,0.9)"
                : "0 0 10px rgba(0,0,0,0.9)",
            }}
          >
            {p.damage}
          </div>
        );
      })}
    </div>
  );
}
