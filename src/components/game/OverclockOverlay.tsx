"use client";

import { useEffect, useState } from "react";
import { useFxStore } from "@/stores/fxStore";
import { useGameStore } from "@/stores/gameStore";

/** Cyan edge pulse while Pulse SMG Overclock is live. */
export function OverclockOverlay() {
  const [on, setOn] = useState(false);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setOn(performance.now() < useFxStore.getState().overclockUntil);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (screen !== "playing" || !on) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[4]"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 55%, rgba(125, 255, 239, 0.18) 100%)",
        boxShadow: "inset 0 0 80px rgba(255, 224, 102, 0.25)",
      }}
    />
  );
}
