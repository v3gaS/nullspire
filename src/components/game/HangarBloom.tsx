"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useSettingsStore, qualityConfig } from "@/stores/settingsStore";

/** Soft hangar bloom — matches Quake/UT arena light wash without crushing FPS. */
export function HangarBloom() {
  const quality = useSettingsStore((s) => s.quality);
  if (quality === "low") return null;
  const cfg = qualityConfig(quality);
  const intensity = quality === "high" ? 0.95 : 0.65;
  return (
    <EffectComposer multisampling={cfg.antialias ? 2 : 0}>
      <Bloom
        luminanceThreshold={0.65}
        luminanceSmoothing={0.3}
        intensity={intensity}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.18} darkness={0.35} />
    </EffectComposer>
  );
}
