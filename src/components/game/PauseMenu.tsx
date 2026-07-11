"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import {
  useSettingsStore,
  type QualityPreset,
} from "@/stores/settingsStore";
import { CreditsScreen } from "./CreditsScreen";

export function PauseMenu() {
  const setScreen = useGameStore((s) => s.setScreen);
  const frags = useGameStore((s) => s.frags);
  const secretsFound = useGameStore((s) => s.secretsFound);
  const sensitivity = useGameStore((s) => s.mouseSensitivity);
  const setMouseSensitivity = useGameStore((s) => s.setMouseSensitivity);
  const muted = useGameStore((s) => s.muted);
  const setMuted = useGameStore((s) => s.setMuted);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const quality = useSettingsStore((s) => s.quality);
  const setQuality = useSettingsStore((s) => s.setQuality);
  const [credits, setCredits] = useState(false);

  if (credits) {
    return <CreditsScreen onBack={() => setCredits(false)} />;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(40,28,18,0.5)_0%,rgba(0,0,0,0.8)_70%)] backdrop-blur-sm">
      <div className="w-full max-w-sm rounded border border-orange-400/30 bg-[#141820]/95 p-6 shadow-[0_0_48px_rgba(255,122,24,0.16)]">
        <p className="text-[10px] uppercase tracking-[0.35em] text-orange-300/75">
          Nullspire
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[0.2em] text-orange-50">
          PAUSED
        </h2>
        <p className="mt-2 text-sm text-zinc-300">
          Frags <span className="font-bold text-white">{frags}</span>
          <span className="mx-2 text-zinc-600">·</span>
          Secrets <span className="font-bold text-amber-300">{secretsFound}</span>
        </p>
        <label className="mt-6 block text-xs uppercase tracking-[0.2em] text-zinc-400">
          Mouse sensitivity
          <input
            type="range"
            min={0.3}
            max={2.5}
            step={0.1}
            value={sensitivity}
            onChange={(e) => setMouseSensitivity(Number(e.target.value))}
            className="mt-2 w-full accent-orange-400"
          />
          <span className="mt-1 block text-zinc-300">{sensitivity.toFixed(1)}</span>
        </label>
        <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-zinc-400">
          Quality
          <select
            className="mt-2 w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-zinc-200"
            value={quality}
            onChange={(e) => setQuality(e.target.value as QualityPreset)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-zinc-400">
          SFX volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={sfxVolume}
            onChange={(e) => setSfxVolume(Number(e.target.value))}
            className="mt-2 w-full accent-orange-400"
          />
          <span className="mt-1 block text-zinc-300">
            {Math.round(sfxVolume * 100)}%
          </span>
        </label>
        <label className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-zinc-400">
          <input
            type="checkbox"
            checked={muted}
            onChange={(e) => setMuted(e.target.checked)}
            className="accent-orange-400"
          />
          Mute audio
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
            onClick={() => setCredits(true)}
          >
            Credits
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
