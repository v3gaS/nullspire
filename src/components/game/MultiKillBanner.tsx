"use client";

import { useEffect, useState } from "react";
import { useFxStore } from "@/stores/fxStore";
import { useGameStore } from "@/stores/gameStore";

const LABELS = ["", "KILL", "DOUBLE", "TRIPLE", "QUAD", "MEGA", "ULTRA", "GODLIKE"];

/** Quake-style multi-kill callout near the crosshair. */
export function MultiKillBanner() {
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(0);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const fx = useFxStore.getState();
      const now = performance.now();
      if (now < fx.multiKillUntil && fx.multiKillCount >= 2) {
        setCount(fx.multiKillCount);
        setPulse(1 - (fx.multiKillUntil - now) / 2200);
      } else {
        setCount(0);
        setPulse(0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (screen !== "playing" || count < 2) return null;

  const label = LABELS[Math.min(count, LABELS.length - 1)] ?? "GODLIKE";
  const hot = count >= 4;
  const scale = 1.08 + Math.max(0, 0.22 - pulse * 0.22);

  return (
    <div className="pointer-events-none absolute left-1/2 top-[32%] z-[8] -translate-x-1/2 text-center">
      <div
        className="text-6xl font-black tracking-[0.32em]"
        style={{
          color: hot ? "#ff4422" : "#ffb347",
          textShadow: hot
            ? "0 0 32px rgba(255, 70, 30, 1), 0 0 64px rgba(255, 120, 40, 0.7)"
            : "0 0 28px rgba(255, 160, 40, 1), 0 0 48px rgba(255, 122, 24, 0.45)",
          transform: `scale(${scale})`,
          transition: "transform 50ms linear",
        }}
      >
        {label}
      </div>
      <div
        className="mt-1.5 text-base font-bold tracking-[0.45em]"
        style={{ color: hot ? "#ffaa88" : "rgba(255,255,255,0.88)" }}
      >
        {count}x STREAK
      </div>
    </div>
  );
}
