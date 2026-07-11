"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useSettingsStore } from "@/stores/settingsStore";

/** Soft bloom on high only — postprocessing is expensive. */
export function HangarBloom() {
  const quality = useSettingsStore((s) => s.quality);
  if (quality !== "high") return null;
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.75}
        luminanceSmoothing={0.4}
        intensity={0.45}
        mipmapBlur
      />
    </EffectComposer>
  );
}
