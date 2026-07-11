"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";

/** Low-HP edge + brief flash when the player takes damage. */
export function DamageVignette() {
  const health = useGameStore((s) => s.health);
  const screen = useGameStore((s) => s.screen);
  const lastDamagedAt = useGameStore((s) => s.lastDamagedAt);
  const [hitFlash, setHitFlash] = useState(0);

  useEffect(() => {
    if (!lastDamagedAt) return;
    setHitFlash(1);
    const id = window.setTimeout(() => setHitFlash(0), 420);
    return () => window.clearTimeout(id);
  }, [lastDamagedAt]);

  if (screen !== "playing" && screen !== "paused") return null;

  const lowHp = health < 25 ? 0.95 : health < 40 ? 0.72 : health < 60 ? 0.48 : 0.16;
  const intensity = Math.max(lowHp, hitFlash);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{
        background: `radial-gradient(ellipse at center, transparent 28%, rgba(190, 10, 20, ${intensity}) 100%)`,
        boxShadow:
          hitFlash > 0.4
            ? "inset 0 0 140px rgba(255, 40, 50, 0.65)"
            : health < 30
              ? "inset 0 0 96px rgba(200, 20, 30, 0.45)"
              : undefined,
        transition: hitFlash > 0 ? "none" : "background 200ms ease",
      }}
    />
  );
}
