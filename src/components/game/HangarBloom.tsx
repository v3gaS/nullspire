"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useSettingsStore, qualityConfig } from "@/stores/settingsStore";

/** Soft hangar bloom — matches Quake/UT arena light wash without crushing FPS. */
export function HangarBloom() {
  const quality = useSettingsStore((s) => s.quality);
  if (quality === "low") return null;
  const cfg = qualityConfig(quality);
  const intensity = quality === "high" ? 1.15 : 0.78;
  return (
    <EffectComposer multisampling={cfg.antialias ? 2 : 0}>
      <Bloom
        luminanceThreshold={0.58}
        luminanceSmoothing={0.28}
        intensity={intensity}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.16} darkness={0.32} />
    </EffectComposer>
  );
}
