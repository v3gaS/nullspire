"use client";

import { Canvas } from "@react-three/fiber";
import { Sky, Stars } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";
import { PlayerController } from "./PlayerController";
import { CrashRimSector } from "./CrashRimSector";
import { GameHUD } from "./GameHUD";
import { TitleScreen } from "./TitleScreen";
import { PauseMenu } from "./PauseMenu";
import { WeaponSystem } from "./WeaponSystem";
import { TargetDummies } from "./TargetDummies";
import { useGameStore } from "@/stores/gameStore";

function World() {
  return (
    <Physics gravity={[0, -18, 0]}>
      <PlayerController />
      <CrashRimSector />
      <TargetDummies />
      <WeaponSystem />
    </Physics>
  );
}

export function GameApp() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#0b0614]">
      {(screen === "playing" || screen === "paused" || screen === "dead") && (
        <Canvas
          shadows
          camera={{ fov: 75, near: 0.1, far: 300, position: [0, 2, 8] }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          className="absolute inset-0"
        >
          <color attach="background" args={["#140c22"]} />
          <fog attach="fog" args={["#140c22", 40, 110]} />
          <ambientLight intensity={0.35} />
          <directionalLight
            castShadow
            intensity={1.2}
            position={[30, 40, 10]}
            shadow-mapSize={[2048, 2048]}
          />
          <hemisphereLight args={["#6b5cff", "#1a1028", 0.4]} />
          <Sky
            distance={450000}
            sunPosition={[40, 8, -20]}
            inclination={0.48}
            azimuth={0.25}
            mieCoefficient={0.01}
            rayleigh={1.2}
          />
          <Stars radius={120} depth={40} count={4000} factor={3} fade speed={0.4} />
          <Suspense fallback={null}>
            <World />
          </Suspense>
        </Canvas>
      )}

      {screen === "title" && <TitleScreen />}
      {(screen === "playing" || screen === "paused") && <GameHUD />}
      {screen === "paused" && <PauseMenu />}
      {screen === "dead" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70">
          <h2 className="font-[family-name:var(--font-display)] text-4xl tracking-wide text-[#ff6b7a]">
            Signal Lost
          </h2>
          <p className="mt-2 text-sm text-zinc-300">You were overrun on Nullspire.</p>
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
