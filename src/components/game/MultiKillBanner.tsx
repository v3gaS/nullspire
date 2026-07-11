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
  const scale = 1 + Math.max(0, 0.18 - pulse * 0.18);

  return (
    <div className="pointer-events-none absolute left-1/2 top-[36%] z-[8] -translate-x-1/2 text-center">
      <div
        className="text-3xl font-black tracking-[0.22em]"
        style={{
          color: hot ? "#ff5533" : "#ffe066",
          textShadow: hot
            ? "0 0 22px rgba(255, 80, 40, 0.95), 0 0 40px rgba(255, 120, 40, 0.55)"
            : "0 0 18px rgba(255, 180, 60, 0.85)",
          transform: `scale(${scale})`,
          transition: "transform 60ms linear",
        }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-xs font-bold tracking-[0.35em]"
        style={{ color: hot ? "#ffaa88" : "rgba(255,255,255,0.75)" }}
      >
        {count}x STREAK
      </div>
    </div>
  );
}
