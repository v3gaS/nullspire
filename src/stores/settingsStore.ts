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
  quality: "medium",
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
        starCount: 400,
        dpr: 1,
        antialias: false,
        fogFar: 90,
      };
    case "medium":
      return {
        shadows: false,
        starCount: 1200,
        dpr: 1,
        antialias: false,
        fogFar: 120,
      };
    case "high":
      return {
        shadows: true,
        starCount: 2500,
        dpr: 1.25,
        antialias: true,
        fogFar: 150,
      };
    default: {
      const _exhaustive: never = q;
      return _exhaustive;
    }
  }
}
