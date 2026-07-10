# Nullspire — Implementation TODO

Campaign build order. Check items as completed. Loop works top-down.

**Title:** Nullspire  
**Stack:** Next.js + R3F + Rapier + Zustand → Vercel  
**Loop mode:** continuous dynamic (self-paced) — keep building until user stops

---

## Phase 0 — Foundation
- [x] Scaffold Next.js (App Router, TS, Tailwind)
- [x] Install R3F, drei, rapier, zustand
- [x] Repo init + GitHub remote + first push
- [x] Vercel project link + first deploy
- [x] `AGENTS.md`, `GDD.md`, `CREDITS.md`, `LEARNINGS.md`
- [x] Base app shell: title screen → Play canvas

## Phase 1 — Core FPS feel
- [x] Pointer-lock mouse look
- [x] WASD move + sprint + jump (Rapier character / capsule)
- [x] Ground collision + basic test arena
- [x] Crosshair + simple HUD chrome
- [x] Pause (Esc) + sensitivity setting

## Phase 2 — Combat baseline
- [x] Hitscan / projectile fire + tracers
- [x] Ammo + reload
- [x] Damageable targets (dummy + health)
- [x] Hit feedback (flash / particles)
- [x] Death / respawn at checkpoint

## Phase 3 — Weapons (full set)
- [x] Pulse SMG + Overclock ability
- [x] Scatter Carbine + Shockwave
- [x] Arc Caster + Storm Nest
- [x] Rail Lance + Mark
- [x] Void Launcher + Singularity
- [x] Weapon switch 1–5 + pickup unlocks
- [x] Null Energy resource + regen rules

## Phase 4 — Enemies & AI
- [x] Drone Scout
- [x] Sentry Turret
- [x] Skitter
- [x] Spitter
- [x] Bastion Unit
- [x] Null Stalker
- [ ] Spawn waves / patrols / aggro ranges
- [x] Loot drops (shards, ammo, health)

## Phase 5 — World: large area + traversal
- [x] Modular kitbash sector geometry
- [x] Crash Rim sector layout
- [x] Rust Canyons + jump pads / gaps
- [ ] Biolume Vaults interiors
- [x] Hazards (acid / energy grids)
- [x] Objectives (beacons, terminals, nests)
- [ ] Checkpoints + sector gates

## Phase 6 — Bosses
- [x] Aegis Warden (phases + arena)
- [ ] Bloom Matriarch (vertical arena)
- [ ] Nullspire Primarch (final)
- [ ] Boss HUD + stingers / telegraphs

## Phase 7 — Game flow & polish
- [x] Title / settings / pause / death / victory screens
- [ ] Campaign progression save (localStorage)
- [ ] Audio (SFX + ambient) with mute
- [ ] Quality presets (low/med/high)
- [ ] Performance pass (instancing, culling, LODs)
- [ ] CREDITS screen + in-repo credits

## Phase 8 — Ship
- [x] Production Vercel deploy
- [x] Visual QA in browser (movement, combat, bosses)
- [ ] Fix ship blockers
- [ ] Tag release notes in LEARNINGS.md

---

## Loop rules
1. Always pick the **first unchecked** actionable item in the lowest incomplete phase.
2. After each meaningful chunk: update this file, append to `LEARNINGS.md`, commit, push, deploy when buildable.
3. **Continuous** — re-arm dynamic wakes; do not hard-stop unless the user says stop/pause.
4. Prefer playable increments over unfinished mega-features.

## Current focus
**Phase 4–6** — Bastion + Stalker, loot, Biolume Vaults, first boss (Aegis Warden)
