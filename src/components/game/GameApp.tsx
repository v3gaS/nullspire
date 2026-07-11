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
import { OverclockOverlay } from "./OverclockOverlay";
import { MultiKillBanner } from "./MultiKillBanner";
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
import { HangarBloom } from "./HangarBloom";
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
            color="#6a7580"
            roughness={0.85}
            metalness={0.14}
            emissive="#3a4550"
            emissiveIntensity={0.18}
          />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 0, 8]}>
        <CuboidCollider args={[8, 0.5, 8]} position={[0, -0.15, 0]} />
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[16, 0.4, 16]} />
          <meshStandardMaterial
            color="#7a8896"
            roughness={0.72}
            metalness={0.24}
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
          <WeaponPickup id="scatter_carbine" position={[-4, 1.6, -6]} />
          <WeaponPickup id="arc_caster" position={[-7, 3.0, -10]} />
          <WeaponPickup id="rail_lance" position={[2, 5.6, -16]} />
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
          camera={{ fov: 80, near: 0.08, far: 320, position: [0, 2, 8] }}
          gl={{
            antialias: cfg.antialias,
            powerPreference: "high-performance",
            alpha: false,
            preserveDrawingBuffer: true,
          }}
          className="absolute inset-0"
        >
          <color attach="background" args={["#627284"]} />
          <fog attach="fog" args={["#8494a4", 100, Math.max(cfg.fogFar, 150)]} />
          <ambientLight intensity={1.28} />
          <directionalLight
            castShadow={cfg.shadows}
            intensity={2.55}
            position={[18, 55, 12]}
            color="#fff4e0"
            shadow-mapSize={cfg.shadows ? [2048, 2048] : [512, 512]}
          />
          <hemisphereLight args={["#efe4d0", "#2a3544", 1.15]} />
          {/* Skylight wash — hangar bloom feel */}
          <pointLight
            position={[0, 48, -20]}
            intensity={4.8}
            color="#fff8ee"
            distance={130}
          />
          <pointLight
            position={[16, 12, -20]}
            intensity={2.6}
            color="#2ee6c8"
            distance={50}
          />
          <pointLight
            position={[0, 8, 8]}
            intensity={3.6}
            color="#f4a261"
            distance={48}
          />
          <pointLight
            position={[0, 10, -70]}
            intensity={2.2}
            color="#7dffef"
            distance={38}
          />
          <pointLight
            position={[0, 12, -130]}
            intensity={2.6}
            color="#a78bfa"
            distance={42}
          />
          <pointLight
            position={[0, 16, -46]}
            intensity={2.8}
            color="#fff4e0"
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
          <Suspense fallback={null}>
            <CombatVfx />
          </Suspense>
          <Suspense fallback={null}>
            <WeaponViewmodel />
          </Suspense>
          <Suspense fallback={<LoadingBeacon />}>
            <World showDressing={quality !== "low"} />
          </Suspense>
          <HangarBloom />
        </Canvas>
        </GameErrorBoundary>
      )}

      {screen === "title" && <TitleScreen />}
      {(screen === "playing" || screen === "paused") && (
        <>
          <DamageVignette />
          <OverclockOverlay />
          <MultiKillBanner />
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
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,122,24,0.28)_0%,rgba(0,0,0,0.9)_62%)]">
          <p className="mb-2 text-xs uppercase tracking-[0.4em] text-orange-300/85">
            Campaign Complete
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-7xl tracking-[0.12em] text-[#ffb347] drop-shadow-[0_0_48px_rgba(255,122,24,0.7)]">
            Nullspire Cleared
          </h2>
          <p className="mt-4 max-w-md px-6 text-center text-sm text-zinc-200">
            Primarch offline. Barrels emptied. Secrets found. Run it back hotter.
          </p>
          <button
            type="button"
            className="mt-8 rounded border border-orange-300/60 bg-orange-500/25 px-7 py-3.5 text-sm uppercase tracking-[0.22em] text-orange-50 shadow-[0_0_28px_rgba(255,122,24,0.3)] hover:bg-orange-400/35"
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
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(140,8,18,0.78)_0%,rgba(0,0,0,0.92)_68%)]">
          <p className="mb-2 text-xs uppercase tracking-[0.4em] text-red-400/90">
            Fragged
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-7xl tracking-[0.12em] text-[#ff4d5e] drop-shadow-[0_0_48px_rgba(255,60,70,0.8)]">
            Signal Lost
          </h2>
          <p className="mt-4 text-sm text-zinc-200">
            Fragged on Nullspire. Reboot and push again.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
            Last CP · {checkpointLabel}
          </p>
          <button
            type="button"
            className="mt-8 rounded border border-red-400/50 bg-red-500/25 px-7 py-3.5 text-sm uppercase tracking-[0.22em] text-red-100 shadow-[0_0_28px_rgba(255,60,70,0.28)] hover:bg-red-400/35"
            onClick={() => useGameStore.getState().resetRun()}
          >
            Reboot Drop
          </button>
        </div>
      )}
    </div>
  );
}
