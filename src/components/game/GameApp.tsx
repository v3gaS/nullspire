"use client";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";
import { PlayerController } from "./PlayerController";
import { CrashRimSector } from "./CrashRimSector";
import { GameHUD } from "./GameHUD";
import { TitleScreen } from "./TitleScreen";
import { PauseMenu } from "./PauseMenu";
import { WeaponSystem } from "./WeaponSystem";
import { TargetDummies } from "./TargetDummies";
import { DroneSquad } from "./DroneScout";
import { EnemyPack } from "./EnemyPack";
import { EliteAndLoot } from "./EliteAndLoot";
import { AegisWarden } from "./AegisWarden";
import { BiolumeVaults } from "./BiolumeVaults";
import { BloomMatriarch } from "./BloomMatriarch";
import { WeaponPickup } from "./WeaponPickup";
import { useGameStore } from "@/stores/gameStore";
import { useCombatInput } from "@/lib/game/useCombatInput";

function World() {
  return (
    <Physics gravity={[0, -18, 0]}>
      <PlayerController />
      <CrashRimSector />
      <BiolumeVaults />
      <TargetDummies />
      <DroneSquad />
      <EnemyPack />
      <EliteAndLoot />
      <AegisWarden />
      <BloomMatriarch />
      <WeaponPickup id="scatter_carbine" position={[-4, 1.8, -6]} />
      <WeaponPickup id="arc_caster" position={[-7, 3.2, -10]} />
      <WeaponPickup id="rail_lance" position={[2, 5.8, -16]} />
      <WeaponPickup id="void_launcher" position={[0, 1.2, -70]} />
      <WeaponSystem />
    </Physics>
  );
}

export function GameApp() {
  const screen = useGameStore((s) => s.screen);
  useCombatInput();

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#0b0614]">
      {(screen === "playing" || screen === "paused" || screen === "dead") && (
        <Canvas
          shadows
          camera={{ fov: 75, near: 0.1, far: 300, position: [0, 2, 8] }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          className="absolute inset-0"
        >
          <color attach="background" args={["#0a0618"]} />
          <fog attach="fog" args={["#0a0618", 35, 100]} />
          <ambientLight intensity={0.28} />
          <directionalLight
            castShadow
            intensity={0.85}
            position={[20, 35, 8]}
            color="#c4b5fd"
            shadow-mapSize={[2048, 2048]}
          />
          <hemisphereLight args={["#4c1d95", "#0f0a1a", 0.55]} />
          <pointLight position={[16, 12, -20]} intensity={2.2} color="#2ee6c8" distance={40} />
          <Stars
            radius={140}
            depth={50}
            count={5500}
            factor={3.5}
            fade
            speed={0.35}
          />
          <Suspense fallback={null}>
            <World />
          </Suspense>
        </Canvas>
      )}

      {screen === "title" && <TitleScreen />}
      {(screen === "playing" || screen === "paused") && <GameHUD />}
      {screen === "paused" && <PauseMenu />}
      {screen === "victory" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70">
          <h2 className="font-[family-name:var(--font-display)] text-4xl tracking-wide text-[#5dffd7]">
            Sector Cleared
          </h2>
          <p className="mt-2 max-w-md px-6 text-center text-sm text-zinc-300">
            Aegis Warden is offline. Deeper Nullspire sectors await.
          </p>
          <button
            type="button"
            className="mt-8 rounded border border-cyan-400/40 bg-cyan-500/20 px-6 py-3 text-sm uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/30"
            onClick={() => useGameStore.getState().resetRun()}
          >
            Run Again
          </button>
          <button
            type="button"
            className="mt-3 rounded border border-white/15 px-6 py-2 text-xs uppercase tracking-[0.2em] text-zinc-400 hover:bg-white/5"
            onClick={() => useGameStore.getState().setScreen("title")}
          >
            Title
          </button>
        </div>
      )}
      {screen === "dead" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70">
          <h2 className="font-[family-name:var(--font-display)] text-4xl tracking-wide text-[#ff6b7a]">
            Signal Lost
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            You were overrun on Nullspire.
          </p>
          <button
            type="button"
            className="mt-8 rounded border border-cyan-400/40 bg-cyan-500/20 px-6 py-3 text-sm uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/30"
            onClick={() => useGameStore.getState().resetRun()}
          >
            Reboot Drop
          </button>
        </div>
      )}
    </div>
  );
}
