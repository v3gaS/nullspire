"use client";

import { useGameStore } from "@/stores/gameStore";

/** Low-HP / hit feedback vignette. */
export function DamageVignette() {
  const health = useGameStore((s) => s.health);
  const screen = useGameStore((s) => s.screen);
  if (screen !== "playing" && screen !== "paused") return null;

  const intensity = health < 35 ? 0.55 : health < 60 ? 0.28 : 0.08;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{
        background: `radial-gradient(ellipse at center, transparent 45%, rgba(120, 10, 30, ${intensity}) 100%)`,
        transition: "background 200ms ease",
      }}
    />
  );
}
