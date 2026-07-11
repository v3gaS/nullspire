"use client";

import { create } from "zustand";

export type QualityPreset = "low" | "medium" | "high";

interface SettingsState {
  quality: QualityPreset;
  setQuality: (q: QualityPreset) => void;
}

function loadQuality(): QualityPreset {
  if (typeof window === "undefined") return "medium";
  const v = window.localStorage.getItem("nullspire_quality");
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
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
        starCount: 1200,
        dpr: 1,
        antialias: false,
        fogFar: 110,
      };
    case "medium":
      return {
        shadows: true,
        starCount: 3500,
        dpr: 1.25,
        antialias: true,
        fogFar: 150,
      };
    case "high":
      return {
        shadows: true,
        starCount: 5500,
        dpr: 1.75,
        antialias: true,
        fogFar: 180,
      };
    default: {
      const _exhaustive: never = q;
      return _exhaustive;
    }
  }
}
