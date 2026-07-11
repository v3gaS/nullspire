"use client";

import { useEffect, useState } from "react";
import { useFxStore } from "@/stores/fxStore";
import { useGameStore } from "@/stores/gameStore";

/** 2D muzzle bloom so fire is unmistakable even if 3D FX is subtle. */
export function MuzzleFlashOverlay() {
  const [alpha, setAlpha] = useState(0);
  const [color, setColor] = useState("#7dffef");
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const fx = useFxStore.getState();
      const remaining = Math.max(0, fx.muzzleUntil - performance.now());
      const t = remaining > 0 ? Math.min(1, remaining / 110) : 0;
      setAlpha(t * t * 1.15);
      setColor(fx.muzzleColor);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (screen !== "playing" || alpha <= 0.02) return null;

  const a1 = Math.round(alpha * 0xaa)
    .toString(16)
    .padStart(2, "0");
  const a2 = Math.round(alpha * 0x44)
    .toString(16)
    .padStart(2, "0");

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[6]"
      style={{
        background: `radial-gradient(circle at 62% 68%, ${color}${a1} 0%, ${color}${a2} 22%, transparent 48%)`,
        mixBlendMode: "screen",
      }}
    />
  );
}
