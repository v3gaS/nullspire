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
            className="absolute left-1/2 font-black tracking-tight"
            style={{
              fontSize: big ? "2rem" : mid ? "1.55rem" : "1.25rem",
              transform: `translate(-50%, ${-age * 64 - i * 10}px) scale(${1 + (big ? 0.55 : mid ? 0.28 : 0.08)})`,
              opacity: 1 - age,
              color: big ? "#ff4422" : mid ? "#ff9f43" : "#f8fafc",
              textShadow: big
                ? "0 0 18px rgba(255,70,30,0.9), 0 2px 0 rgba(0,0,0,0.95)"
                : "0 0 12px rgba(0,0,0,0.95), 0 1px 0 #000",
            }}
          >
            {p.damage}
          </div>
        );
      })}
    </div>
  );
}
