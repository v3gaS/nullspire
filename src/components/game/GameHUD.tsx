"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { WEAPON_META, WEAPON_ORDER } from "@/lib/game/constants";

export function GameHUD() {
  const health = useGameStore((s) => s.health);
  const armor = useGameStore((s) => s.armor);
  const nullEnergy = useGameStore((s) => s.nullEnergy);
  const activeWeapon = useGameStore((s) => s.activeWeapon);
  const weapons = useGameStore((s) => s.weapons);
  const objective = useGameStore((s) => s.objective);
  const checkpoint = useGameStore((s) => s.checkpoint);
  const frags = useGameStore((s) => s.frags);
  const invulnerableUntil = useGameStore((s) => s.invulnerableUntil);
  const killFeed = useFxStore((s) => s.killFeed);
  const [shieldActive, setShieldActive] = useState(false);
  const [spread, setSpread] = useState(0);
  const [now, setNow] = useState(0);

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
      setNow(performance.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const weapon = weapons[activeWeapon];
  const meta = WEAPON_META[activeWeapon];
  const arm = 6 + spread * 10;
  const slotIndex = WEAPON_ORDER.indexOf(activeWeapon) + 1;
  const feed = killFeed.filter((e) => now - e.born < 4500).slice(-5);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-sans">
      {/* Crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="absolute left-1/2 bg-white/90"
          style={{
            width: 2,
            height: 8,
            top: -arm,
            transform: "translateX(-50%)",
            boxShadow: "0 0 5px rgba(255,255,255,0.55)",
          }}
        />
        <div
          className="absolute left-1/2 bg-white/90"
          style={{
            width: 2,
            height: 8,
            bottom: -arm,
            transform: "translateX(-50%)",
            boxShadow: "0 0 5px rgba(255,255,255,0.55)",
          }}
        />
        <div
          className="absolute top-1/2 bg-white/90"
          style={{
            height: 2,
            width: 8,
            left: -arm,
            transform: "translateY(-50%)",
            boxShadow: "0 0 5px rgba(255,255,255,0.55)",
          }}
        />
        <div
          className="absolute top-1/2 bg-white/90"
          style={{
            height: 2,
            width: 8,
            right: -arm,
            transform: "translateY(-50%)",
            boxShadow: "0 0 5px rgba(255,255,255,0.55)",
          }}
        />
      </div>

      {/* Kill feed — top left */}
      <div className="absolute left-5 top-5 space-y-1">
        {feed.map((e) => (
          <p
            key={e.id}
            className="text-[13px] font-medium tracking-wide text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
          >
            {e.text}
          </p>
        ))}
      </div>

      {/* Frags — top right */}
      <div className="absolute right-5 top-5 rounded bg-black/50 px-3 py-2 text-right backdrop-blur-[2px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Frags
        </p>
        <p className="text-2xl font-bold leading-none text-white">{frags}</p>
      </div>

      {/* Objective — top center, quieter */}
      <div className="absolute left-1/2 top-5 max-w-md -translate-x-1/2 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">
          {checkpoint.label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
          {objective}
        </p>
      </div>

      {shieldActive && (
        <div className="absolute left-1/2 top-20 -translate-x-1/2 text-center">
          <p className="animate-pulse text-xs font-bold uppercase tracking-[0.25em] text-teal-200">
            Drop shield active
          </p>
        </div>
      )}

      {/* Vitals — bottom left (HEALTH / ARMOR big numbers) */}
      <div className="absolute bottom-6 left-5 rounded bg-black/55 px-4 py-3 backdrop-blur-[2px]">
        <p
          className={`text-[28px] font-bold leading-none tracking-wide ${
            health <= 30 ? "animate-pulse text-red-400" : "text-white"
          }`}
        >
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Health
          </span>
          {Math.round(health)}
        </p>
        <p className="mt-2 text-[22px] font-bold leading-none tracking-wide text-sky-300">
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/55">
            Armor
          </span>
          {Math.round(armor)}
        </p>
        <p className="mt-2 text-[13px] font-semibold text-teal-300/90">
          <span className="mr-2 text-[10px] uppercase tracking-[0.2em] text-teal-300/50">
            Null
          </span>
          {Math.round(nullEnergy)}
        </p>
      </div>

      {/* Weapon — bottom right */}
      <div className="absolute bottom-6 right-5 min-w-[220px] rounded bg-black/55 px-4 py-3 backdrop-blur-[2px]">
        <p className="text-[15px] font-semibold text-white">
          <span className="mr-1.5 text-white/40">[{slotIndex}]</span>
          {meta.name}
        </p>
        <p
          className={`mt-1 font-mono text-sm ${
            weapon.ammo <= 3 ? "animate-pulse text-orange-300" : "text-white/85"
          }`}
        >
          <span className="mr-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
            Ammo
          </span>
          {weapon.ammo}{" "}
          <span className="text-white/35">/ {weapon.reserve}</span>
        </p>
        <div className="mt-2.5 flex gap-1.5">
          {WEAPON_ORDER.map((id, i) => {
            const unlocked = weapons[id].unlocked;
            const active = id === activeWeapon;
            return (
              <div
                key={id}
                className={`flex h-7 w-7 items-center justify-center rounded-sm text-xs font-bold ${
                  active
                    ? "bg-white text-black"
                    : unlocked
                      ? "bg-white/15 text-white/80"
                      : "bg-white/5 text-white/25"
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-white/35">
          F {meta.ability} · R reload · 1-5 guns
        </p>
      </div>

      {/* Controls hint — bottom center */}
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-white/30">
        1-5 weapons · scroll cycle · R reload · F ability · Esc pause
      </p>
    </div>
  );
}
