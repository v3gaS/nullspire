"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { WEAPON_META } from "@/lib/game/constants";

export function GameHUD() {
  const health = useGameStore((s) => s.health);
  const armor = useGameStore((s) => s.armor);
  const nullEnergy = useGameStore((s) => s.nullEnergy);
  const activeWeapon = useGameStore((s) => s.activeWeapon);
  const weapons = useGameStore((s) => s.weapons);
  const objective = useGameStore((s) => s.objective);
  const checkpoint = useGameStore((s) => s.checkpoint);
  const invulnerableUntil = useGameStore((s) => s.invulnerableUntil);
  const [shieldActive, setShieldActive] = useState(false);
  const [spread, setSpread] = useState(0);

  useEffect(() => {
    const tick = () => setShieldActive(performance.now() < invulnerableUntil);
    tick();
    const id = window.setInterval(tick, 120);
    return () => window.clearInterval(id);
  }, [invulnerableUntil]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setSpread(useFxStore.getState().kick);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const weapon = weapons[activeWeapon];
  const meta = WEAPON_META[activeWeapon];
  const arm = 6 + spread * 10;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Crosshair — spreads on fire kick */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="absolute left-1/2 bg-cyan-100"
          style={{
            width: 2,
            height: 7,
            top: -arm,
            transform: "translateX(-50%)",
            boxShadow: "0 0 6px rgba(125,255,239,0.8)",
          }}
        />
        <div
          className="absolute left-1/2 bg-cyan-100"
          style={{
            width: 2,
            height: 7,
            bottom: -arm,
            transform: "translateX(-50%)",
            boxShadow: "0 0 6px rgba(125,255,239,0.8)",
          }}
        />
        <div
          className="absolute top-1/2 bg-cyan-100"
          style={{
            height: 2,
            width: 7,
            left: -arm,
            transform: "translateY(-50%)",
            boxShadow: "0 0 6px rgba(125,255,239,0.8)",
          }}
        />
        <div
          className="absolute top-1/2 bg-cyan-100"
          style={{
            height: 2,
            width: 7,
            right: -arm,
            transform: "translateY(-50%)",
            boxShadow: "0 0 6px rgba(125,255,239,0.8)",
          }}
        />
      </div>

      {/* Objective */}
      <div className="absolute left-1/2 top-6 max-w-lg -translate-x-1/2 rounded border border-teal-400/25 bg-black/50 px-4 py-2.5 text-center shadow-[0_0_24px_rgba(46,230,200,0.12)] backdrop-blur-sm">
        <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/80">
          Objective · CP {checkpoint.label}
        </p>
        <p className="text-sm font-medium text-zinc-50">{objective}</p>
      </div>

      {shieldActive && (
        <div className="absolute left-1/2 top-24 max-w-md -translate-x-1/2 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-300/90">
            Drop shield active
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            WASD move · click to fire · R reload · F ability
          </p>
        </div>
      )}

      {/* Vitals */}
      <div className="absolute bottom-6 left-6 w-56 space-y-2">
        <Bar
          label="Hull"
          value={health}
          max={100}
          color={health <= 30 ? "#ff3344" : "#ff6b7a"}
          pulse={health <= 30}
        />
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
        <p
          className={`mt-1 font-mono text-sm ${
            weapon.ammo <= 3 ? "animate-pulse text-orange-300" : "text-zinc-200"
          }`}
        >
          {weapon.ammo} <span className="text-zinc-500">/ {weapon.reserve}</span>
          {weapon.ammo <= 3 && weapon.reserve > 0 ? (
            <span className="ml-2 text-[10px] uppercase tracking-widest text-orange-400">
              reload
            </span>
          ) : null}
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
  pulse = false,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  pulse?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={pulse ? "animate-pulse" : undefined}>
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-sm bg-white/10">
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: pulse ? `0 0 12px ${color}` : undefined,
          }}
        />
      </div>
    </div>
  );
}
