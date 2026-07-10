"use client";

import { useEffect, useState } from "react";
import { useFxStore } from "@/stores/fxStore";
import { useGameStore } from "@/stores/gameStore";

/** Center hit confirmation when a destructible is damaged. */
export function HitMarker() {
  const [on, setOn] = useState(false);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setOn(performance.now() < useFxStore.getState().hitUntil);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (screen !== "playing" || !on) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-[7] -translate-x-1/2 -translate-y-1/2">
      <div className="relative h-8 w-8">
        <div className="absolute left-1/2 top-0 h-2.5 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_#fff]" />
        <div className="absolute bottom-0 left-1/2 h-2.5 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_#fff]" />
        <div className="absolute left-0 top-1/2 h-0.5 w-2.5 -translate-y-1/2 bg-white shadow-[0_0_8px_#fff]" />
        <div className="absolute right-0 top-1/2 h-0.5 w-2.5 -translate-y-1/2 bg-white shadow-[0_0_8px_#fff]" />
      </div>
    </div>
  );
}
