# LEARNINGS.md — Nullspire

Build diary. Newest entries at the top.

## 2026-07-10 — Quake juice: pierce, kill X, chunkier FX
- Rail Lance pierces up to 2 extra lined-up targets; Scatter/Void kick harder
- Kill hit-marker (hot X) + bigger gib spray / impact sprites / boom spheres
- Drop Zone runway chevrons; denser barrel chain nests; Phase 10 tracked in TODO
- Mid-canyon cover pocket + denser pack; boss yellow windup beams before strike
- Audio: louder boom SFX; ambience ducks under muzzle/shake
- Loop: **code continuously for 2h**, pause only for build/deploy/QA — not the reverse

## 2026-07-10 — Open Drop Zone + 2h loop
- Spawn was a kitbash wall soup in the player's face (Kenney walls/props at z≈3–8)
- Cleared plaza: dressing/debris/barrels pushed to flanks and forward lane toward beacon
- Loop protocol moved from 30m → **2 hours** (`AGENTS.md` + `/tmp/nullspire_realtime_block_hours.txt`)
- Live: https://nullspire-amber.vercel.app

## 2026-07-10 — DOOM/QUAKE fun pass
- Quake speeds (8.5/14), screen shake, fat boom spheres, gibbier kills
- Explosive barrels (chain), secret caches with objective hints
- Void launcher buff + soft rocket-jump; shockwave/singularity booms
- Visual QA: spawn was void-dying before colliders loaded — spawn protect + CCD + longer invuln
- Cleared barrels/debris from camera cone; gun silhouette visible again

## 2026-07-10 — Crash: RigidBody outside Physics
- Deploy blanked with "This page couldn't load"
- Console: `useRapier must be used within <Physics />!`
- Cause: `KenneyWorldDressing` (has barrel `RigidBody`) rendered outside `<Physics>`
- Fix: move dressing under Physics; keep viewmodel/VFX outside; add GameErrorBoundary
- Follow-up: safe `intersectScene` raycasts (Rapier-detached meshes → matrixWorld null spam)
- Jump buffer + release-to-cut + debris shoulder bumps shipped in same loop

## 2026-07-10 — Physics feel pass
- Shared `playerPhysics` impulse/knock/camera-punch layer (survives wishdir overwrites)
- Jump uses Rapier `applyImpulse`; pads are sensors + proximity fallback
- Dynamic shootable debris crates near spawn; shockwave/singularity pull+blast
- Hits stagger mesh enemies; debris flies with torque; damage punches the camera

## 2026-07-10 — Realtime 30m block COMPLETE (wall-clock)
- Start `1783711253` → end `1783713053` (14:20:53–14:50:53 CDT) — tracked via `/tmp/nullspire_realtime_block_start.txt`
- Shipped across the hour: hitscan fix, damage numbers/flash, arid lighting, drop shield, enemy/boss beams, gun bob, muzzle fade, SFX volume, footsteps/land/pads, Kenney pickups, distance cull, loot/gate lights, de-purple UI
- Live: https://nullspire-amber.vercel.app · commits on `main` through this block
- Next loop: re-arm another 30m wall-clock block; Phase 9 mostly done — pick new feel/balance targets

## 2026-07-10 — Realtime 30m block (wall-clock)
- Block start unix `1783711253` → end `1783713053` (14:20:53–14:50:53 CDT)
- Hitscan prefers destructibles; dressing `skipHit`; spawn walls off center lane
- Damage numbers + hit flash vignette; longer fading beams; enemy→player beams
- Arid dusk lighting; drop-shield HUD; turret relocated; drones idle during invuln
- Crosshair kick spread; ground raycast; movement-linked gun bob; muzzle fade
- Title quality picker + warm palette; SFX volume + pitch jitter; acid/beacon/pad juice
- Cursor browser WebGL often blacks out after Deploy — assets (colormap/GLBs) still 200 OK

## 2026-07-10 — Release notes (ship polish)
- Quality presets (low/med/high), credits screen, ambient drones, hit markers
- Hitscan prefers destructibles; Kenney dressing marked `skipHit` so props no longer eat shots
- Arid dusk lighting (warm key / cool fill / teal accent) replaces purple sky
- Damage flash vignette + floating damage numbers; longer fading beams
- Drop-shield HUD hint; spawn turret moved off drop zone; drones idle during invuln

## 2026-07-10 — Why assets were invisible
- Kenney GLBs reference `Textures/colormap.png` next to the models — we never copied it (404) so meshes looked broken/empty
- Viewmodel used `camera.add()` which R3F can detach — switched to world-space camera follow
- Fire VFX: fat beams + 2D muzzle bloom overlay; thicker longer-lived tracers

## 2026-07-10 — Visible assets + fire VFX
- User: free assets not obvious; fire heard but not seen
- Added `KenneyWorldDressing` (walls, platforms, blasters, alien/robot/craft OBJs near spawn)
- Replaced thin Line tracers with fat cylinder beams + muzzle pointlight + Kenney hit/burst sprites
- Viewmodel now uses Kenney blaster GLBs with barrel glow/recoil kick

## 2026-07-10 — World-space aggro fix
- Bosses/elites used `mesh.position` (local) so Primarch engaged at Drop Zone
- Added `distToCam` / `worldPos` helper; bosses no longer snipe from z=-130 at spawn

## 2026-07-10 — 30m loop + play/visual self-eval
- Loop cadence set to **30 minutes** (pid in `/tmp/nullspire_loop.pid`)
- Eval: spawn melted in seconds (Hull→death) — nerfed enemy DPS/range, +3.5s spawn invuln, start armor 25
- Eval: world too dark/flat — brighter lights, fog push, emissive ground grid
- Added: viewmodel, damage vignette, boss HUD, mute, checkpoints/gates, Primarch final boss
- Campaign no longer ends on Aegis; victory only after Primarch

## 2026-07-10 — Continuous resume (user override)
- User asked to keep looping; removed hard 1h stop from TODO/AGENTS
- Prior wake PIDs had exited without a follow-up agent turn — re-armed continuous wakes
- Shipped: full 5-weapon abilities, turrets/skitters/spitters, bastion/stalker, loot, Rust Canyons + pads/acid, Aegis Warden + victory, dark sky fix

## 2026-07-10 — Live deploy + combat loop
- Production alias: https://nullspire-amber.vercel.app
- Team project: `rockstar-investments-projects/nullspire` (GitHub connected)
- Added reload (R), Overclock (F), Null regen, fall/void damage, Drone Scout AI
- Scatter Carbine world pickup on teal jump pad; Shockwave ability (F)
- Visual QA: title → Deploy works; HUD + Crash Rim + drones live; Hull drops from drone fire (expected)
- drei `Sky` reads washed-out on prod — consider custom sky/fog palette next
- Dynamic loop armed: continue wake ~10m; hard review pause at ~1h from kickoff
- Next: Arc Caster, more enemies, expand Crash Rim with Kenney OBJ kitbash

## 2026-07-10 — Phase 0–2 bootstrap
- `create-next-app` rejects capital folder names; scaffolded via `nullspire-tmp` then moved up
- Next template overwrote `AGENTS.md` — restored custom agent rules
- Kenney.nl direct zip URLs often 404/HTML; OpenGameArt + GitHub `KenneyNL/Starter-Kit-FPS` are reliable
- Rapier + R3F must load client-only (`dynamic(..., { ssr: false })`)
- Grounded detection via `|vy| < 0.15` is crude; plan raycast ground check next
- Hitscan via `Raycaster` against scene works for dummies; need layer filters so props aren't false hits
- GitHub repo: https://github.com/v3gaS/nullspire

## 2026-07-10 — Kickoff
- Title locked: **Nullspire**
- Stack locked: Next.js + R3F + Rapier + Zustand → Vercel
- Vercel CLI present (54.18.2); logged in as `v3gas-8977`
- GitHub CLI authenticated as `v3gaS`
- Loop: continuous dynamic; **hard pause every 1 hour** for review
- Empty workspace at start; GDD / TODO / AGENTS authored before scaffold
