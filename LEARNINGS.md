# LEARNINGS.md — Nullspire

Build diary. Newest entries at the top.

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
