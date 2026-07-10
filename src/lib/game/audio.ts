import { useGameStore } from "@/stores/gameStore";

const cache = new Map<string, HTMLAudioElement>();

export function playSfx(path: string, volume = 0.35) {
  if (typeof window === "undefined") return;
  if (useGameStore.getState().muted) return;
  let audio = cache.get(path);
  if (!audio) {
    audio = new Audio(path);
    cache.set(path, audio);
  }
  const node = audio.cloneNode(true) as HTMLAudioElement;
  node.volume = volume;
  void node.play().catch(() => {
    /* autoplay may block until gesture — ignore */
  });
}
