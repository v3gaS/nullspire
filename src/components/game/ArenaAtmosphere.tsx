"use client";

import { Environment } from "@react-three/drei";
import { useSettingsStore } from "@/stores/settingsStore";

/** Poly Haven HDRI — high only. PMREM generation freezes Low/Medium. */
export function ArenaAtmosphere() {
  const hdri = useSettingsStore((s) => s.quality === "high");
  if (!hdri) return null;
  return (
    <Environment
      files="/assets/env/industrial_sunset_1k.hdr"
      background
      blur={0.45}
    />
  );
}
