"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect } from "react";
import { PlayerController } from "./PlayerController";
import { PlayArena } from "./PlayArena";
import { FairEnemies } from "./FairEnemies";
import { GameHUD } from "./GameHUD";
import { TitleScreen } from "./TitleScreen";
import { PauseMenu } from "./PauseMenu";
import { WeaponSystem } from "./WeaponSystem";
import { WeaponViewmodel } from "./WeaponViewmodel";
import { CombatVfx } from "./CombatVfx";
import { DamageVignette } from "./DamageVignette";
import { MuzzleFlashOverlay } from "./MuzzleFlashOverlay";
import { OverclockOverlay } from "./OverclockOverlay";
import { MultiKillBanner } from "./MultiKillBanner";
import { HitMarker } from "./HitMarker";
import { DamageNumbers } from "./DamageNumbers";
import { AmbientAudio } from "./AmbientAudio";
import { WeaponPickup } from "./WeaponPickup";
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

/** First-principles playable world — arena + fair waves only. */
function World() {
  const runId = useGameStore((s) => s.runId);
  return (
    <Physics gravity={[0, -18, 0]}>
      <PlayArena />
      <PlayerController key={runId} />
      <Suspense fallback={null}>
        <FairEnemies key={runId} />
        <WeaponPickup id="scatter_carbine" position={[-5, 1.4, 4]} />
        <WeaponPickup id="rail_lance" position={[5, 1.4, 4]} />
        <WeaponSystem />
      </Suspense>
    </Physics>
  );
}

export function GameApp() {
  const screen = useGameStore((s) => s.screen);
  const quality = useSettingsStore((s) => s.quality);
  const cfg = qualityConfig(quality);
  useCombatInput();

  useEffect(() => {
    hydrateSettings();
    // Arena rebuild — force Low once more so old Medium caches don't fight
    if (!window.localStorage.getItem("nullspire_perf_v4")) {
      window.localStorage.setItem("nullspire_quality", "low");
      window.localStorage.setItem("nullspire_perf_v4", "1");
      useSettingsStore.getState().setQuality("low");
    }
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
            shadows={false}
            dpr={[0.55, Math.min(cfg.dpr, 1)]}
            camera={{ fov: 80, near: 0.1, far: 120, position: [0, 2, 8] }}
            gl={{
              antialias: false,
              powerPreference: "high-performance",
              alpha: false,
              preserveDrawingBuffer: false,
              stencil: false,
              depth: true,
            }}
            performance={{ min: 0.35 }}
            className="absolute inset-0"
          >
            <color attach="background" args={["#4e5964"]} />
            <fog attach="fog" args={["#6a7888", 28, 75]} />
            <ambientLight intensity={1.0} />
            <directionalLight intensity={1.05} position={[12, 40, 8]} color="#fff4e0" />
            <hemisphereLight args={["#efe4d0", "#2a3544", 0.65]} />
            <Suspense fallback={null}>
              <CombatVfx />
            </Suspense>
            <Suspense fallback={null}>
              <WeaponViewmodel />
            </Suspense>
            <Suspense fallback={<LoadingBeacon />}>
              <World />
            </Suspense>
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
        </>
      )}
      {screen === "paused" && <PauseMenu />}
      {screen === "victory" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,122,24,0.28)_0%,rgba(0,0,0,0.9)_62%)]">
          <p className="mb-2 text-xs uppercase tracking-[0.4em] text-orange-300/85">
            Arena Cleared
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-6xl tracking-[0.12em] text-[#ffb347] drop-shadow-[0_0_48px_rgba(255,122,24,0.7)] sm:text-7xl">
            Wave Hold
          </h2>
          <p className="mt-4 max-w-md px-6 text-center text-sm text-zinc-200">
            Three waves down. Guns feel good. Run it again hotter.
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
            Use cover. Watch the windup glow. Shoot the bright ones.
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
