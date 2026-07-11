"use client";

import { create } from "zustand";

export type QualityPreset = "low" | "medium" | "high";

interface SettingsState {
  quality: QualityPreset;
  setQuality: (q: QualityPreset) => void;
}

function loadQuality(): QualityPreset {
  if (typeof window === "undefined") return "low";
  const v = window.localStorage.getItem("nullspire_quality");
  // Force a safe default after perf incident — high was freezing systems
  if (v === "high") {
    window.localStorage.setItem("nullspire_quality", "low");
    return "low";
  }
  if (v === "low" || v === "medium") return v;
  return "low";
}

export const useSettingsStore = create<SettingsState>((set) => ({
  quality: "low",
  setQuality: (quality) => {
    set({ quality });
    if (typeof window !== "undefined") {
      window.localStorage.setItem("nullspire_quality", quality);
    }
  },
}));

export function hydrateSettings() {
  useSettingsStore.setState({ quality: loadQuality() });
}

export function qualityConfig(q: QualityPreset) {
  switch (q) {
    case "low":
      return {
        shadows: false,
        starCount: 0,
        dpr: 0.75,
        antialias: false,
        fogFar: 70,
        hdri: false,
        pbrFloor: false,
        worldLights: false,
        debris: false,
        dressing: false,
      };
    case "medium":
      return {
        shadows: false,
        starCount: 400,
        dpr: 1,
        antialias: false,
        fogFar: 100,
        hdri: false,
        pbrFloor: true,
        worldLights: false,
        debris: true,
        dressing: true,
      };
    case "high":
      return {
        shadows: true,
        starCount: 1200,
        dpr: 1.15,
        antialias: true,
        fogFar: 140,
        hdri: true,
        pbrFloor: true,
        worldLights: true,
        debris: true,
        dressing: true,
      };
    default: {
      const _exhaustive: never = q;
      return _exhaustive;
    }
  }
}
