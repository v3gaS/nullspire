# Nullspire

Single-player sci-fi FPS in the browser. Survive a ruined exoplanet research world — parkour ruins, alien/tech enemies, five unique weapons, and boss fights.

**Play:** deploy on Vercel or run locally.

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- React Three Fiber + Drei + Rapier
- Zustand

## Docs
- [GDD.md](./GDD.md) — full game design
- [TODO.md](./TODO.md) — implementation phases
- [AGENTS.md](./AGENTS.md) — agent / loop rules
- [CREDITS.md](./CREDITS.md) — free asset licenses
- [LEARNINGS.md](./LEARNINGS.md) — build diary

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — click **Deploy**, click the canvas for pointer lock.

## Controls
| Input | Action |
|-------|--------|
| WASD | Move |
| Mouse | Look |
| Space | Jump |
| Shift | Sprint |
| Esc | Pause |
| 1–5 | Weapons (as unlocked) |

## License
Game code: MIT (unless noted). Third-party assets: see `CREDITS.md` (mostly CC0 Kenney packs).
