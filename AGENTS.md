# AGENTS.md — Nullspire

Guidance for Cursor agents building this game.

## Mission
Ship a **complete single-player browser FPS** (Nullspire) on Vercel: large sci-fi planetary map, parkour/obstacles, bots/aliens, five unique weapons + abilities, three bosses. See `GDD.md` and `TODO.md`.

## Stack (do not swap without reason)
- Next.js App Router + TypeScript + Tailwind
- `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`
- Zustand for game state
- Assets in `/public` with licenses in `CREDITS.md`

## Working rules
1. Follow `TODO.md` phase order; check items off when done.
2. Keep the game **bootable** after each phase chunk (title → play).
3. Document surprises in `LEARNINGS.md` (short bullets).
4. Free assets only; always credit URL + license in `CREDITS.md`.
5. Commit in logical chunks; push; deploy to Vercel when the app builds.
6. Visually inspect via browser tools when UI/feel claims need proof.
7. Keep shipping playable increments; only pause if the user says stop/pause.

## Loop protocol
- Mode: **continuous**, wake every **2 hours**.
- On each wake: self-evaluate play + visuals (browser if needed), implement next TODO + feel/art fixes, update docs, push/deploy.
- Track wall-clock via `/tmp/nullspire_realtime_block_start.txt` and `/tmp/nullspire_realtime_block_hours.txt` (hours=2).
- Re-arm the sleeper until the user says stop.

## Code conventions
- Imports at top of files (no inline imports).
- Exhaustive `switch` defaults with `never` for unions/enums.
- Prefer small modules: `components/game/*`, `lib/game/*`, `stores/*`.
- No secrets in repo. No multiplayer netcode in v1.

## Deploy
- Project name: `nullspire` (or closest available)
- Production URL should be recorded in `LEARNINGS.md` when live

## Out of scope
- Accounts, payments, mobile-primary controls, authoritative multiplayer
