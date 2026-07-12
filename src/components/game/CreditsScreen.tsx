"use client";

import { useGameStore } from "@/stores/gameStore";

export function CreditsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-auto bg-[radial-gradient(ellipse_at_center,#1a2433_0%,#0d141c_70%)] p-8">
      <div className="w-full max-w-lg rounded border border-teal-400/25 bg-[#121820]/95 p-6 shadow-[0_0_32px_rgba(46,230,200,0.1)]">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[0.2em] text-teal-50">
          CREDITS
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Nullspire — free / open assets only.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-zinc-200">
          <li>
            <span className="text-teal-300">Kenney</span> — Blaster Kit, Space
            Station Kit, Space Kit · CC0 · kenney.nl
          </li>
          <li>
            <span className="text-teal-300">Poly Haven</span> — Sunset sky,
            concrete floor, plaster walls, metal plates/grate, crates · CC0 ·
            polyhaven.com
          </li>
          <li>
            <span className="text-teal-300">AmbientCG</span> — Painted metal,
            tiles, rust, concrete · CC0 · ambientcg.com
          </li>
          <li>
            <span className="text-teal-300">Google Fonts</span> — Orbitron, Exo
            2 · OFL
          </li>
          <li>
            <span className="text-teal-300">Engine</span> — Next.js, React Three
            Fiber, Rapier, Drei, Zustand
          </li>
        </ul>
        <p className="mt-6 text-xs text-zinc-500">
          Full license table in repo CREDITS.md
        </p>
        <button
          type="button"
          className="mt-6 rounded border border-teal-400/40 bg-teal-500/20 px-4 py-2 text-sm uppercase tracking-[0.2em] text-teal-50 hover:bg-teal-400/30"
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
