"use client";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Suspense, useEffect } from "react";
import { PlayerController } from "./PlayerController";
import { CrashRimSector } from "./CrashRimSector";
import { GameHUD } from "./GameHUD";
import { TitleScreen } from "./TitleScreen";
import { PauseMenu } from "./PauseMenu";
import { WeaponSystem } from "./WeaponSystem";
import { WeaponViewmodel } from "./WeaponViewmodel";
import { CombatVfx } from "./CombatVfx";
import { KenneyWorldDressing } from "./KenneyWorldDressing";
import { DamageVignette } from "./DamageVignette";
import { MuzzleFlashOverlay } from "./MuzzleFlashOverlay";
import { HitMarker } from "./HitMarker";
import { DamageNumbers } from "./DamageNumbers";
import { BossHUD } from "./BossHUD";
import { AmbientAudio } from "./AmbientAudio";
import { TargetDummies } from "./TargetDummies";
import { DroneSquad } from "./DroneScout";
import { EnemyPack } from "./EnemyPack";
import { EliteAndLoot } from "./EliteAndLoot";
import { AegisWarden } from "./AegisWarden";
import { BiolumeVaults } from "./BiolumeVaults";
import { BloomMatriarch } from "./BloomMatriarch";
import { NullspirePrimarch } from "./NullspirePrimarch";
import { CheckpointGates } from "./CheckpointGates";
import { WeaponPickup } from "./WeaponPickup";
import { PhysicsDebris } from "./PhysicsDebris";
import { ExplosiveBarrels } from "./ExplosiveBarrels";
import { SecretCaches } from "./SecretCaches";
import { GameErrorBoundary } from "./GameErrorBoundary";
import { useGameStore } from "@/stores/gameStore";
import { useCombatInput } from "@/lib/game/useCombatInput";
import {
  hydrateSettings,
  qualityConfig,
  useSettingsStore,
} from "@/stores/settingsStore";

function LoadingBeacon() {
  return (
    <mesh position={[0, 2, 5]}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshBasicMaterial color="#2ee6c8" />
    </mesh>
  );
}

function World({ showDressing }: { showDressing: boolean }) {
  const runId = useGameStore((s) => s.runId);
  return (
    <Physics gravity={[0, -18, 0]}>
      <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
        <CuboidCollider args={[90, 1.2, 90]} position={[0, -1.2, 0]} />
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[180, 1, 180]} />
          <meshStandardMaterial
            color="#2a3548"
            roughness={0.92}
            metalness={0.08}
          />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 0, 8]}>
        <CuboidCollider args={[8, 0.5, 8]} position={[0, -0.15, 0]} />
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[16, 0.4, 16]} />
          <meshStandardMaterial
            color="#4a5d6e"
            roughness={0.8}
            metalness={0.2}
            emissive="#2ee6c8"
            emissiveIntensity={0.35}
          />
        </mesh>
      </RigidBody>
      <PlayerController key={runId} />

      <Suspense fallback={null}>
        {showDressing && <KenneyWorldDressing />}
        <CrashRimSector />
        <BiolumeVaults />
        <CheckpointGates />
        <TargetDummies />
        <DroneSquad />
        <EnemyPack />
        <EliteAndLoot />
        <AegisWarden />
        <BloomMatriarch />
        <NullspirePrimarch />
        <WeaponPickup id="scatter_carbine" position={[-4, 1.8, -6]} />
        <WeaponPickup id="arc_caster" position={[-7, 3.2, -10]} />
        <WeaponPickup id="rail_lance" position={[2, 5.8, -16]} />
        <WeaponPickup id="void_launcher" position={[0, 1.2, -70]} />
        <PhysicsDebris />
        <ExplosiveBarrels />
        <SecretCaches />
        <WeaponSystem />
      </Suspense>
    </Physics>
  );
}

export function GameApp() {
  const screen = useGameStore((s) => s.screen);
  const boss = useGameStore((s) => s.boss);
  const quality = useSettingsStore((s) => s.quality);
  const cfg = qualityConfig(quality);
  const checkpointLabel = useGameStore((s) => s.checkpoint.label);
  useCombatInput();

  useEffect(() => {
    hydrateSettings();
    useGameStore.setState({
      mouseSensitivity: Number(window.localStorage.getItem("nullspire_sens")) || 1,
      sfxVolume: (() => {
        const v = Number(window.localStorage.getItem("nullspire_sfx"));
        return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
      })(),
    });
  }, []);

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#0b0614]">
      <AmbientAudio />
      {(screen === "playing" ||
        screen === "paused" ||
        screen === "dead" ||
        screen === "victory") && (
        <GameErrorBoundary
          onReset={() => useGameStore.getState().resetRun()}
        >
        <Canvas
          shadows={cfg.shadows}
          dpr={[1, cfg.dpr]}
          camera={{ fov: 75, near: 0.08, far: 320, position: [0, 2, 8] }}
          gl={{
            antialias: cfg.antialias,
            powerPreference: "high-performance",
            alpha: false,
            preserveDrawingBuffer: true,
          }}
          className="absolute inset-0"
        >
          <color attach="background" args={["#4a6d8c"]} />
          <fog attach="fog" args={["#5a7d9c", 90, cfg.fogFar]} />
          <ambientLight intensity={1.1} />
          <directionalLight
            castShadow={cfg.shadows}
            intensity={1.8}
            position={[30, 42, 8]}
            color="#fff0d0"
            shadow-mapSize={cfg.shadows ? [2048, 2048] : [512, 512]}
          />
          <hemisphereLight args={["#ffe0b0", "#1e2d3d", 0.85]} />
          <pointLight
            position={[16, 12, -20]}
            intensity={2.5}
            color="#2ee6c8"
            distance={45}
          />
          <pointLight
            position={[0, 8, 8]}
            intensity={3}
            color="#f4a261"
            distance={40}
          />
          <Stars
            radius={140}
            depth={50}
            count={cfg.starCount}
            factor={3.5}
            fade
            speed={0.35}
          />
          <mesh position={[0, 1.5, 4]}>
            <boxGeometry args={[3, 2, 1]} />
            <meshBasicMaterial color="#ff4d6d" toneMapped={false} />
          </mesh>
          <Suspense fallback={null}>
            <CombatVfx />
          </Suspense>
          <Suspense fallback={null}>
            <WeaponViewmodel />
          </Suspense>
          <Suspense fallback={<LoadingBeacon />}>
            <World showDressing={quality !== "low"} />
          </Suspense>
        </Canvas>
        </GameErrorBoundary>
      )}

      {screen === "title" && <TitleScreen />}
      {(screen === "playing" || screen === "paused") && (
        <>
          <DamageVignette />
          <MuzzleFlashOverlay />
          <HitMarker />
          <DamageNumbers />
          <GameHUD />
          {boss.active && (
            <BossHUD
              name={boss.name}
              hp={boss.hp}
              maxHp={boss.maxHp}
              phase={boss.phase}
            />
          )}
        </>
      )}
      {screen === "paused" && <PauseMenu />}
      {screen === "victory" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70">
          <h2 className="font-[family-name:var(--font-display)] text-4xl tracking-wide text-[#5dffd7]">
            Nullspire Cleared
          </h2>
          <p className="mt-2 max-w-md px-6 text-center text-sm text-zinc-300">
            The Primarch is offline. The exoplanet falls silent — for now.
          </p>
          <button
            type="button"
            className="mt-8 rounded border border-teal-400/40 bg-teal-500/20 px-6 py-3 text-sm uppercase tracking-[0.2em] text-teal-100 hover:bg-teal-400/30"
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
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Last CP · {checkpointLabel}
          </p>
          <button
            type="button"
            className="mt-8 rounded border border-teal-400/40 bg-teal-500/20 px-6 py-3 text-sm uppercase tracking-[0.2em] text-teal-100 hover:bg-teal-400/30"
            onClick={() => useGameStore.getState().resetRun()}
          >
            Reboot Drop
          </button>
        </div>
      )}
    </div>
  );
}
