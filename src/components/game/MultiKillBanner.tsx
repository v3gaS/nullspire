"use client";

import { useEffect, useState } from "react";
import { useFxStore } from "@/stores/fxStore";
import { useGameStore } from "@/stores/gameStore";

const LABELS = ["", "KILL", "DOUBLE", "TRIPLE", "QUAD", "MEGA"];

/** Quake-style multi-kill callout near the crosshair. */
export function MultiKillBanner() {
  const [count, setCount] = useState(0);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const fx = useFxStore.getState();
      if (performance.now() < fx.multiKillUntil && fx.multiKillCount >= 2) {
        setCount(fx.multiKillCount);
      } else {
        setCount(0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (screen !== "playing" || count < 2) return null;

  const label = LABELS[Math.min(count, LABELS.length - 1)] ?? "MEGA";

  return (
    <div className="pointer-events-none absolute left-1/2 top-[38%] z-[8] -translate-x-1/2 text-center">
      <div
        className="text-2xl font-black tracking-[0.2em]"
        style={{
          color: count >= 4 ? "#ff6644" : "#ffe066",
          textShadow: "0 0 18px rgba(255, 180, 60, 0.85)",
        }}
      >
        {label}
      </div>
      <div className="mt-1 text-xs tracking-widest text-white/70">
        {count}x STREAK
      </div>
    </div>
  );
}
