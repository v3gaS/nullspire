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
  const size = kill ? "h-24 w-24" : "h-12 w-12";
  const arm = kill ? "h-8 w-2.5" : "h-5 w-1.5";
  const armH = kill ? "h-2.5 w-8" : "h-1.5 w-5";

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-[7] -translate-x-1/2 -translate-y-1/2">
      <div
        className={`relative ${size}`}
        style={
          kill
            ? { transform: "rotate(45deg) scale(1.12)" }
            : { transform: "scale(1.08)" }
        }
      >
        <div
          className={`absolute left-1/2 top-0 ${arm} -translate-x-1/2`}
          style={{ background: color, boxShadow: `0 0 18px ${color}` }}
        />
        <div
          className={`absolute bottom-0 left-1/2 ${arm} -translate-x-1/2`}
          style={{ background: color, boxShadow: `0 0 18px ${color}` }}
        />
        <div
          className={`absolute left-0 top-1/2 ${armH} -translate-y-1/2`}
          style={{ background: color, boxShadow: `0 0 18px ${color}` }}
        />
        <div
          className={`absolute right-0 top-1/2 ${armH} -translate-y-1/2`}
          style={{ background: color, boxShadow: `0 0 18px ${color}` }}
        />
      </div>
    </div>
  );
}
