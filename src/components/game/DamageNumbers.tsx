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
              fontSize: big ? "2.65rem" : mid ? "1.95rem" : "1.55rem",
              transform: `translate(-50%, ${-age * 84 - i * 14}px) scale(${1 + (big ? 0.75 : mid ? 0.42 : 0.16)})`,
              opacity: 1 - age,
              color: big ? "#ff4422" : mid ? "#ff9f43" : "#f8fafc",
              textShadow: big
                ? "0 0 26px rgba(255,70,30,1), 0 2px 0 rgba(0,0,0,0.95)"
                : mid
                  ? "0 0 18px rgba(255,159,67,0.85), 0 1px 0 #000"
                  : "0 0 14px rgba(0,0,0,0.95), 0 1px 0 #000",
            }}
          >
            {p.damage}
          </div>
        );
      })}
    </div>
  );
}
