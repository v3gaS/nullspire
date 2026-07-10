import { useGameStore } from "@/stores/gameStore";

const cache = new Map<string, HTMLAudioElement>();

export function playSfx(path: string, volume = 0.35) {
  if (typeof window === "undefined") return;
  const { muted, sfxVolume } = useGameStore.getState();
  if (muted) return;
  let audio = cache.get(path);
  if (!audio) {
    audio = new Audio(path);
    cache.set(path, audio);
  }
  const node = audio.cloneNode(true) as HTMLAudioElement;
  node.volume = Math.max(0, Math.min(1, volume * sfxVolume));
  node.playbackRate = 0.96 + Math.random() * 0.08;
  void node.play().catch(() => {
    /* autoplay may block until gesture — ignore */
  });
}
