# Nullspire — Game Design Document

**Working title:** Nullspire  
**Genre:** Single-player sci-fi FPS  
**Platform:** Web (desktop), hosted on Vercel  
**Engine stack:** Next.js (App Router) + React Three Fiber + Three.js + Rapier physics  
**Input:** Mouse look + WASD (+ Space jump, Shift sprint, 1–5 weapons, R reload, E interact, Esc pause)  
**Target:** Full finished single-player campaign loop — explore, fight, platform, boss, win/lose, replay

---

## 1. High concept

You are a stranded strike operative on **Nullspire**, a ruined exoplanet research world where alien biomass and abandoned human tech fused into something hostile. Clear sectors, survive bot patrols and alien packs, master movement through vertical ruins, unlock weapons with distinct firepower and abilities, and bring down sector bosses to shut down the planetary null-core.

**One-line pitch:** A browser-native sci-fi FPS with parkour ruins, alien/tech enemies, unique weapons, and boss fights — playable in one tab, deployed on Vercel.

---

## 2. Pillars

1. **Readable combat** — Clear silhouettes, hit feedback, distinct weapon fantasy.
2. **Vertical playground** — Jumps, gaps, ledges, pads, and risk/reward routes.
3. **Enemy variety** — Tech bots, alien fauna, hybrids, and memorable bosses.
4. **Weapon identity** — Every gun has a unique primary + ability, not just DPS skins.
5. **Session completeness** — Boot → fight → progress → boss → ending without multiplayer infra.

---

## 3. Setting & tone

- **World:** Nullspire — arid violet skies, rusted megastructures, bioluminescent growth, orbital debris haze.
- **Tone:** Tense, kinetic, slightly eerie; not comedy, not ultra-grimdark.
- **Factions / threats:**
  - **Aegis Remnants** — abandoned security drones / turrets / mechs.
  - **Xenoflora** — alien creatures adapted to the ruins.
  - **Null-touched** — corrupted hybrids near the core.

---

## 4. Player fantasy & progression

### 4.1 Core loop
1. Drop into a **sector** (large connected area).
2. Explore structures, platforming routes, and combat arenas.
3. Defeat enemies → collect **Null Shards** + ammo / health / weapon unlocks.
4. Clear **objectives** (terminals, beacons, nests).
5. Unlock the **boss gate**.
6. Defeat boss → open next sector / ending.

### 4.2 Player stats (MVP → full)
| Stat | Notes |
|------|--------|
| Health | 100 base; pickups restore |
| Armor | Optional buffer from pickups |
| Stamina | Sprint / jump budget (regen) |
| Ammo | Per-weapon magazines + reserves |
| Null Energy | Resource for weapon **abilities** |

### 4.3 Movement
- Walk / sprint / crouch (optional polish)
- Jump + coyote time + short air control
- Mantle / ledge grab (phase stretch goal → target for full game)
- Jump pads / launchers / moving platforms
- Fall damage above threshold
- Soft landing zones (alien moss) reduce fall damage

---

## 5. Combat design

### 5.1 Feel targets
- Hitscan or fast projectiles with visible tracers
- Recoil / bloom kept mild for browser readability
- Enemy hit flashes + damage numbers (toggleable)
- Headshot multiplier on humanoid bots; weak-point glow on aliens/bosses

### 5.2 Weapons (full set)

| # | Weapon | Primary | Ability (Null Energy) | Role |
|---|--------|---------|------------------------|------|
| 1 | **Pulse SMG** | High RoF hitscan, low damage | **Overclock** — 3s fire-rate surge | Close/mid clear |
| 2 | **Rail Lance** | Chargeable piercing shot | **Mark** — reveal + bonus damage on marked target | Precision / elites |
| 3 | **Scatter Carbine** | Pellet shotgun | **Shockwave** — short knockback blast | Panic / doors |
| 4 | **Arc Caster** | Chain lightning projectile | **Storm Nest** — deploy temporary zap zone | Crowds |
| 5 | **Void Launcher** | Slow explosive orb | **Singularity** — pull then detonate | Boss / clustered |

Unlock order: SMG start → Carbine → Arc → Rail → Void (or find in world).

### 5.3 Enemy roster

| Enemy | Type | Behavior | Notes |
|-------|------|----------|-------|
| **Drone Scout** | Tech bot | Strafe + burst fire | Intro fodder |
| **Sentry Turret** | Tech | Fixed / slow rotate | Area denial |
| **Skitter** | Alien | Rush + leap | Pack hunter |
| **Spitter** | Alien | Ranged acid arcs | Keep distance |
| **Bastion Unit** | Tech elite | Shield + heavy shots | Flank required |
| **Null Stalker** | Hybrid | Cloak blink melee | Audio cue |
| **Bosses** | Unique | See §6 | One per major sector |

### 5.4 Difficulty curve
- Sector 1: drones + skitters, teach movement + SMG
- Sector 2: turrets + spitters + platforming intensity
- Sector 3: elites + stalkers + multi-path arenas
- Final: hybrid packs + final boss gauntlet

---

## 6. Bosses

### Boss A — **Aegis Warden** (Sector 1)
- Arena: circular plaza with cover pillars + jump rings
- Phases: (1) missile volleys (2) shield + drone adds (3) ground slam shockwaves
- Weak point: exposed core when shield drops

### Boss B — **Bloom Matriarch** (Sector 2)
- Arena: vertical greenhouse shaft
- Phases: (1) spitters from walls (2) vine grab zones (3) acid rain + mobile weak sacs
- Movement check: ascending platforms while DPS

### Boss C — **Nullspire Primarch** (Final)
- Arena: core chamber with collapsing bridges
- Phases: (1) dual weapon modes (2) singularity wells (3) enrage + add waves
- Requires using multiple weapons / abilities

---

## 7. World / level design

### 7.1 Structure
One continuous **campaign map** composed of linked sectors (streaming/visibility culling by distance), not tiny disconnected deathmatch boxes.

**Sectors:**
1. **Crash Rim** — landing wreckage, tutorial combat, first boss gate
2. **Rust Canyons** — industrial trenches, jump puzzles, second boss
3. **Biolume Vaults** — alien overgrowth interiors
4. **Null Core** — final approach + Primarch

### 7.2 Traversal set pieces
- Broken bridges / timed platforms
- Gravity pads
- Hazard floors (acid, energy grids)
- Optional high routes with better loot
- Locked doors opened by terminals or shard cost

### 7.3 Objectives
- Activate 2–3 beacons per sector
- Destroy nest nodes
- Survive optional holdouts for better rewards
- Reach boss gate with key signal

---

## 8. UI / UX

- **HUD:** crosshair, health/armor, ammo, Null Energy, weapon strip, minimap or compass, objective hint
- **Menus:** title, settings (mouse sens, volume, graphics quality), pause, death, victory
- **Feedback:** damage vignette, low-HP pulse, ability ready cue, pickup toasts
- **Accessibility:** sens slider, colorblind-safe hit markers, reduce motion option (particles)

---

## 9. Audio (free / procedural fallback)

- Weapon fire / reload / ability one-shots
- Enemy alerts / death
- Ambient wind + alien drones + industrial hum
- Boss stingers
- UI clicks

If licensed music packs are thin, use CC0 loops + synthesized SFX; credit all sources in `CREDITS.md`.

---

## 10. Technical design (Vercel-best)

| Layer | Choice | Why |
|-------|--------|-----|
| App | Next.js App Router | Vercel-native, static/SSR hybrid |
| 3D | `@react-three/fiber` + `drei` | Idiomatic React Three.js |
| Physics | `@react-three/rapier` | Colliders, characters, sensors |
| Input | Pointer lock + keyboard map | Standard FPS |
| State | Zustand | Lightweight game state |
| Assets | GLB/GLTF + compressed textures in `/public` | CDN-friendly |
| Deploy | Vercel production | Preview + prod URLs |
| Perf | Instancing, LODs, baked lighting where possible, quality presets | Browser FPS |

**Non-goals for v1:** authoritative multiplayer, accounts, payments, mobile touch primary controls.

---

## 11. Art direction & assets

- Low-to-mid poly sci-fi + alien kits (Kenney, Poly Pizza, OpenGameArt, Quaternius, etc.)
- Palette: deep indigo sky, copper ruins, toxic teal biolume, white/cyan weapon FX
- Prefer kitbash modular walls/floors for large areas
- All third-party assets listed in `CREDITS.md` with license + URL

---

## 12. Success criteria (definition of done)

A player can:
1. Load the Vercel URL, click Play, pointer-lock, move/look/jump.
2. Fight mixed enemies across a large multi-sector map with obstacles and jumps.
3. Use **all five weapons** with distinct primary + ability.
4. Defeat **three bosses** with readable phases.
5. Die / retry / finish campaign with victory screen.
6. See credits for assets and a stable deploy.

---

## 13. Documentation practice

While building:
- Update `TODO.md` checkboxes per phase
- Append learnings to `LEARNINGS.md` (perf, asset pitfalls, deploy notes)
- Keep `AGENTS.md` current for agent/loop conventions
- Pause every **1 hour** of active build loop for human review

---

## 14. Title lock

**Nullspire** — locked for repo, UI, and deploy project naming (`nullspire`).
