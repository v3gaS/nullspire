"use client";

import dynamic from "next/dynamic";

const GameApp = dynamic(
  () => import("@/components/game/GameApp").then((m) => m.GameApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh w-dvw items-center justify-center bg-[#0b0614] text-cyan-200/80">
        <p className="animate-pulse text-sm uppercase tracking-[0.35em]">
          Calibrating Nullspire…
        </p>
      </div>
    ),
  },
);

export default function Home() {
  return <GameApp />;
}
