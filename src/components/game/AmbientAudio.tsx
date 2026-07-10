"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";

/** Soft looping ambient via WebAudio oscillators (no external music file). */
export function AmbientAudio() {
  const muted = useGameStore((s) => s.muted);
  const screen = useGameStore((s) => s.screen);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (screen !== "playing" && screen !== "paused") {
      void ctxRef.current?.suspend();
      return;
    }
    if (muted) {
      if (gainRef.current) gainRef.current.gain.value = 0;
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!ctxRef.current) {
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = 0.035;
      master.connect(ctx.destination);
      gainRef.current = master;

      const freqs = [55, 82.5, 110];
      nodesRef.current = freqs.map((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i === 0 ? "sine" : "triangle";
        osc.frequency.value = f;
        g.gain.value = 0.4 / (i + 1);
        osc.connect(g);
        g.connect(master);
        osc.start();
        return osc;
      });
      ctxRef.current = ctx;
    } else {
      void ctxRef.current.resume();
      if (gainRef.current) gainRef.current.gain.value = 0.035;
    }

    return () => {
      /* keep context across pauses; cleaned on unmount below */
    };
  }, [muted, screen]);

  useEffect(() => {
    return () => {
      nodesRef.current.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      });
      void ctxRef.current?.close();
      ctxRef.current = null;
      nodesRef.current = [];
    };
  }, []);

  return null;
}
