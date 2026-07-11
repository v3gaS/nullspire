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
    setHitFlash(0.85);
    const id = window.setTimeout(() => setHitFlash(0), 320);
    return () => window.clearTimeout(id);
  }, [lastDamagedAt]);

  if (screen !== "playing" && screen !== "paused") return null;

  const lowHp = health < 25 ? 0.82 : health < 40 ? 0.58 : health < 60 ? 0.34 : 0.1;
  const intensity = Math.max(lowHp, hitFlash);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{
        background: `radial-gradient(ellipse at center, transparent 36%, rgba(180, 8, 18, ${intensity}) 100%)`,
        boxShadow:
          hitFlash > 0.4
            ? "inset 0 0 100px rgba(255, 40, 50, 0.45)"
            : health < 30
              ? "inset 0 0 70px rgba(200, 20, 30, 0.32)"
              : undefined,
        transition: hitFlash > 0 ? "none" : "background 200ms ease",
      }}
    />
  );
}
