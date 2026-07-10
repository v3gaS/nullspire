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
7. **Hard pause every 1 hour** of active loop for human review — stop, summarize, wait.

## Loop protocol
- Mode: **continuous dynamic** (self-paced wake).
- On each wake: read `TODO.md` + `LEARNINGS.md`, implement next items, update docs, push/deploy.
- Sentinel / wake prompts carry the build continuation instruction.
- Do **not** start a new hour block after a review pause until the user says continue.

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
