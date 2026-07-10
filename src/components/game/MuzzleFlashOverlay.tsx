"use client";

import { useEffect, useState } from "react";
import { useFxStore } from "@/stores/fxStore";
import { useGameStore } from "@/stores/gameStore";

/** 2D muzzle bloom so fire is unmistakable even if 3D FX is subtle. */
export function MuzzleFlashOverlay() {
  const [on, setOn] = useState(false);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const fx = useFxStore.getState();
      setOn(performance.now() < fx.muzzleUntil);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (screen !== "playing" || !on) return null;

  const color = useFxStore.getState().muzzleColor;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[6]"
      style={{
        background: `radial-gradient(circle at 58% 62%, ${color}88 0%, ${color}33 12%, transparent 38%)`,
      }}
    />
  );
}
