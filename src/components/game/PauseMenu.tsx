"use client";

import { useGameStore } from "@/stores/gameStore";

export function PauseMenu() {
  const setScreen = useGameStore((s) => s.setScreen);
  const sensitivity = useGameStore((s) => s.mouseSensitivity);
  const setMouseSensitivity = useGameStore((s) => s.setMouseSensitivity);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded border border-white/15 bg-[#120a1f]/95 p-6 shadow-2xl">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[0.2em] text-cyan-100">
          PAUSED
        </h2>
        <label className="mt-6 block text-xs uppercase tracking-[0.2em] text-zinc-400">
          Mouse sensitivity
          <input
            type="range"
            min={0.3}
            max={2.5}
            step={0.1}
            value={sensitivity}
            onChange={(e) => setMouseSensitivity(Number(e.target.value))}
            className="mt-2 w-full accent-cyan-400"
          />
          <span className="mt-1 block text-zinc-300">{sensitivity.toFixed(1)}</span>
        </label>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            className="rounded border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-sm uppercase tracking-[0.2em] text-cyan-50 hover:bg-cyan-400/30"
            onClick={() => setScreen("playing")}
          >
            Resume
          </button>
          <button
            type="button"
            className="rounded border border-white/15 px-4 py-2 text-sm uppercase tracking-[0.2em] text-zinc-300 hover:bg-white/5"
            onClick={() => setScreen("title")}
          >
            Abort to Title
          </button>
        </div>
      </div>
    </div>
  );
}
