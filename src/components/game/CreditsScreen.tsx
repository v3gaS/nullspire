"use client";

import { useGameStore } from "@/stores/gameStore";

export function CreditsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-auto bg-[#0b0614]/95 p-8">
      <div className="w-full max-w-lg rounded border border-white/15 bg-[#120a1f] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[0.2em] text-cyan-100">
          CREDITS
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Nullspire — free / open assets only.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-zinc-200">
          <li>
            <span className="text-cyan-300">Kenney</span> — Space Kit, Starter
            Kit FPS (models, SFX, sprites) · CC0 · kenney.nl
          </li>
          <li>
            <span className="text-cyan-300">Google Fonts</span> — Orbitron, Exo
            2 · OFL
          </li>
          <li>
            <span className="text-cyan-300">Engine</span> — Next.js, React Three
            Fiber, Rapier, Drei, Zustand
          </li>
        </ul>
        <p className="mt-6 text-xs text-zinc-500">
          Full license table in repo CREDITS.md
        </p>
        <button
          type="button"
          className="mt-6 rounded border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-sm uppercase tracking-[0.2em] text-cyan-50 hover:bg-cyan-400/30"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="ml-3 rounded border border-white/15 px-4 py-2 text-sm uppercase tracking-[0.2em] text-zinc-400 hover:bg-white/5"
          onClick={() => useGameStore.getState().setScreen("title")}
        >
          Title
        </button>
      </div>
    </div>
  );
}
