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
    setHitFlash(0.72);
    const id = window.setTimeout(() => setHitFlash(0), 280);
    return () => window.clearTimeout(id);
  }, [lastDamagedAt]);

  if (screen !== "playing" && screen !== "paused") return null;

  const lowHp = health < 35 ? 0.55 : health < 60 ? 0.28 : 0.08;
  const intensity = Math.max(lowHp, hitFlash);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{
        background: `radial-gradient(ellipse at center, transparent 42%, rgba(140, 18, 28, ${intensity}) 100%)`,
        transition: hitFlash > 0 ? "none" : "background 200ms ease",
      }}
    />
  );
}
