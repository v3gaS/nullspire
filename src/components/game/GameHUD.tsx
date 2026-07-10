"use client";

import { useGameStore } from "@/stores/gameStore";
import { WEAPON_META } from "@/lib/game/constants";

export function GameHUD() {
  const health = useGameStore((s) => s.health);
  const armor = useGameStore((s) => s.armor);
  const nullEnergy = useGameStore((s) => s.nullEnergy);
  const activeWeapon = useGameStore((s) => s.activeWeapon);
  const weapons = useGameStore((s) => s.weapons);
  const objective = useGameStore((s) => s.objective);

  const weapon = weapons[activeWeapon];
  const meta = WEAPON_META[activeWeapon];

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Crosshair */}
      <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-cyan-200/90" />
        <div className="absolute bottom-0 left-1/2 h-1.5 w-px -translate-x-1/2 bg-cyan-200/90" />
        <div className="absolute left-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-cyan-200/90" />
        <div className="absolute right-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-cyan-200/90" />
      </div>

      {/* Objective */}
      <div className="absolute left-1/2 top-6 max-w-lg -translate-x-1/2 rounded border border-white/10 bg-black/40 px-4 py-2 text-center backdrop-blur-sm">
        <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/70">
          Objective
        </p>
        <p className="text-sm text-zinc-100">{objective}</p>
      </div>

      {/* Vitals */}
      <div className="absolute bottom-6 left-6 w-56 space-y-2">
        <Bar label="Hull" value={health} max={100} color="#ff6b7a" />
        <Bar label="Armor" value={armor} max={100} color="#8ec5ff" />
        <Bar label="Null" value={nullEnergy} max={100} color="#5dffd7" />
      </div>

      {/* Weapon */}
      <div className="absolute bottom-6 right-6 min-w-48 rounded border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-sm">
        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Weapon · R reload · F ability · 1-5
        </p>
        <p className="text-lg text-cyan-100">{meta.name}</p>
        <p className="text-xs text-zinc-400">
          Ability: {meta.ability} (Null)
        </p>
        <p className="mt-1 font-mono text-sm text-zinc-200">
          {weapon.ammo} <span className="text-zinc-500">/ {weapon.reserve}</span>
        </p>
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-white/10">
        <div
          className="h-full transition-[width] duration-150"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
