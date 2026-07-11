"use client";

import { useEffect, useState } from "react";
import { useFxStore } from "@/stores/fxStore";
import { useGameStore } from "@/stores/gameStore";

/** Center hit confirmation — white on hit, hot kill X on gib. */
export function HitMarker() {
  const [mode, setMode] = useState<"off" | "hit" | "kill">("off");
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const fx = useFxStore.getState();
      const now = performance.now();
      if (now < fx.killUntil) setMode("kill");
      else if (now < fx.hitUntil) setMode("hit");
      else setMode("off");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (screen !== "playing" || mode === "off") return null;

  const kill = mode === "kill";
  const color = kill ? "#ff4422" : "#ffffff";
  const size = kill ? "h-16 w-16" : "h-9 w-9";
  const arm = kill ? "h-6 w-1.5" : "h-3 w-0.5";
  const armH = kill ? "h-1.5 w-6" : "h-0.5 w-3";

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-[7] -translate-x-1/2 -translate-y-1/2">
      <div
        className={`relative ${size}`}
        style={kill ? { transform: "rotate(45deg)" } : undefined}
      >
        <div
          className={`absolute left-1/2 top-0 ${arm} -translate-x-1/2`}
          style={{ background: color, boxShadow: `0 0 14px ${color}` }}
        />
        <div
          className={`absolute bottom-0 left-1/2 ${arm} -translate-x-1/2`}
          style={{ background: color, boxShadow: `0 0 14px ${color}` }}
        />
        <div
          className={`absolute left-0 top-1/2 ${armH} -translate-y-1/2`}
          style={{ background: color, boxShadow: `0 0 14px ${color}` }}
        />
        <div
          className={`absolute right-0 top-1/2 ${armH} -translate-y-1/2`}
          style={{ background: color, boxShadow: `0 0 14px ${color}` }}
        />
      </div>
    </div>
  );
}
