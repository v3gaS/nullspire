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
  const secretsFound = useGameStore((s) => s.secretsFound);
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
  const arm = 7 + spread * 12;
  const slotIndex = WEAPON_ORDER.indexOf(activeWeapon) + 1;
  const feed = killFeed.filter((e) => now - e.born < 4500).slice(-5);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-sans">
      {/* Crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="absolute left-1/2 bg-white/95"
          style={{
            width: 2.5,
            height: 10,
            top: -arm,
            transform: "translateX(-50%)",
            boxShadow: "0 0 7px rgba(255,255,255,0.7)",
          }}
        />
        <div
          className="absolute left-1/2 bg-white/95"
          style={{
            width: 2.5,
            height: 10,
            bottom: -arm,
            transform: "translateX(-50%)",
            boxShadow: "0 0 7px rgba(255,255,255,0.7)",
          }}
        />
        <div
          className="absolute top-1/2 bg-white/95"
          style={{
            height: 2.5,
            width: 10,
            left: -arm,
            transform: "translateY(-50%)",
            boxShadow: "0 0 7px rgba(255,255,255,0.7)",
          }}
        />
        <div
          className="absolute top-1/2 bg-white/95"
          style={{
            height: 2.5,
            width: 10,
            right: -arm,
            transform: "translateY(-50%)",
            boxShadow: "0 0 7px rgba(255,255,255,0.7)",
          }}
        />
      </div>

      {/* Kill feed — top left */}
      <div className="absolute left-5 top-5 space-y-1">
        {feed.map((e) => (
          <p
            key={e.id}
            className="text-[14px] font-semibold tracking-wide text-orange-100/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          >
            {e.text}
          </p>
        ))}
      </div>

      {/* Frags — top right */}
      <div className="absolute right-5 top-5 rounded bg-black/55 px-3.5 py-2.5 text-right backdrop-blur-[2px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Frags
        </p>
        <p className="text-3xl font-black leading-none text-white">{frags}</p>
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-amber-300/80">
          Secrets {secretsFound}
        </p>
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
          <p className="animate-pulse text-xs font-bold uppercase tracking-[0.25em] text-orange-200">
            Drop shield active
          </p>
        </div>
      )}

      {/* Vitals — bottom left (HEALTH / ARMOR big numbers) */}
      <div className="absolute bottom-6 left-5 rounded bg-black/55 px-4 py-3 backdrop-blur-[2px]">
        <p
          className={`text-[42px] font-black leading-none tracking-wide ${
            health <= 30 ? "animate-pulse text-red-400" : "text-white"
          }`}
        >
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Health
          </span>
          {Math.round(health)}
        </p>
        <p className="mt-2 text-[32px] font-black leading-none tracking-wide text-sky-300">
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/55">
            Armor
          </span>
          {Math.round(armor)}
        </p>
        <p className="mt-2 text-[16px] font-bold text-teal-300/90">
          <span className="mr-2 text-[10px] uppercase tracking-[0.2em] text-teal-300/50">
            Null
          </span>
          {Math.round(nullEnergy)}
        </p>
      </div>

      {/* Weapon — bottom right */}
      <div className="absolute bottom-6 right-5 min-w-[240px] rounded bg-black/55 px-4 py-3 backdrop-blur-[2px]">
        <p className="text-[18px] font-bold text-white">
          <span className="mr-1.5 text-white/40">[{slotIndex}]</span>
          {meta.name}
        </p>
        <p
          className={`mt-1 font-mono text-lg ${
            weapon.ammo <= 3 ? "animate-pulse text-orange-300" : "text-white/90"
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
                className={`flex h-9 w-9 items-center justify-center rounded-sm text-sm font-bold ${
                  active
                    ? "bg-orange-400 text-black shadow-[0_0_16px_rgba(255,122,24,0.7)]"
                    : unlocked
                      ? "bg-white/15 text-white/85"
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
        1-5 weapons · scroll cycle · Q last · R reload · F ability · Esc pause
      </p>
    </div>
  );
}
