# Nullspire — Implementation TODO

Campaign build order. Check items as completed. Loop works top-down.

**Title:** Nullspire  
**Stack:** Next.js + R3F + Rapier + Zustand → Vercel  
**Loop mode:** continuous — wake every **2 hours**; self-evaluate play + visuals each tick

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
- [x] Spawn waves / patrols / aggro ranges
- [x] Loot drops (shards, ammo, health)

## Phase 5 — World: large area + traversal
- [x] Modular kitbash sector geometry
- [x] Crash Rim sector layout
- [x] Rust Canyons + jump pads / gaps
- [x] Biolume Vaults interiors
- [x] Hazards (acid / energy grids)
- [x] Objectives (beacons, terminals, nests)
- [x] Checkpoints + sector gates

## Phase 6 — Bosses
- [x] Aegis Warden (phases + arena)
- [x] Bloom Matriarch (vertical arena)
- [x] Nullspire Primarch (final)
- [x] Boss HUD + stingers / telegraphs

## Phase 7 — Game flow & polish
- [x] Title / settings / pause / death / victory screens
- [x] Campaign progression save (localStorage)
- [x] Audio (SFX + ambient) with mute
- [x] Quality presets (low/med/high)
- [x] Performance pass (instancing, culling, LODs)
- [x] CREDITS screen + in-repo credits

## Phase 8 — Ship
- [x] Production Vercel deploy
- [x] Visual QA in browser (movement, combat, bosses)
- [x] Fix ship blockers
- [x] Tag release notes in LEARNINGS.md

## Phase 9 — Feel & readability (post-ship)
- [x] Hitscan through dressing / skipHit
- [x] Damage numbers + hit flash + enemy beams
- [x] Arid lighting + de-purple accents
- [x] Drop shield HUD + early aggro soften
- [x] Movement gun bob + muzzle fade + SFX volume
- [x] Footsteps / land / jump pad audio
- [x] More boss telegraph beams
- [x] LOD / draw-distance pass
- [x] Weapon pickup world models polish
- [x] Physics feel (knockback, debris, pad sensors, camera punch)

## Phase 10 — DOOM / Quake juice (active 2h block)
- [x] Faster move / air control / camera punch
- [x] Enemy stagger honored + gib spray
- [x] Barrel chain clusters + bigger blast knock
- [x] Secret caches + SECRET FOUND juice
- [x] Open Drop Zone plaza / gate gap / shrunk pickups
- [x] Rail pierce + kill marker + chunkier impacts/booms
- [ ] More readable mid-canyon combat arenas
- [ ] Boss telegraph readability pass
- [ ] Audio mix: louder booms, quieter ambience under fire

---

## Loop rules
1. Always pick the **first unchecked** actionable item in the lowest incomplete phase.
2. After each meaningful chunk: update this file, append to `LEARNINGS.md`, commit, push, deploy when buildable.
3. **Continuous every 2 hours (wall-clock)** — code through the block; self-evaluate play + visuals as you go; stop only if user says stop.
4. Prefer playable increments over unfinished mega-features.

## Current focus
**2h continuous block armed** — DOOM/Quake feel: weapons, explosions, secrets, readable Drop Zone
