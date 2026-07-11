"use client";

import { Environment } from "@react-three/drei";

/** Poly Haven industrial sunset HDRI — mood + reflections without light spam. */
export function ArenaAtmosphere() {
  return (
    <Environment
      files="/assets/env/industrial_sunset_1k.hdr"
      background
      blur={0.4}
    />
  );
}
