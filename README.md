# Posttape

GitHub for songs. Musicians and producers share Ableton Live sets (and flat DAW folders), detect plugins, freeze tracks so collaborators can open a project without matching racks, and sketch arrangements in-browser — the modern version of mailing tapes back and forth.

## What this prototype does

- **Song repos** — public/private songs, collaborators, stars, commit history
- **Plugin awareness** — scan Ableton-style device chains; report what’s missing on the other machine
- **Prepare for send** — pre-commit freeze plan that prints third-party / Max chains to stems
- **Session editor** — multi-track NLE with play/pause, clip move/resize, mute/solo
- **Splice library** — connect a Sounds-style library and drop samples onto tracks
- **Design system** — `/design` master sheet (Studio Night)

This is a **functional web prototype**. Session audio is procedural (Web Audio), freeze is a real UX pipeline with simulated render, and Splice is a linked library (app sign-in is Google / X via the auth broker).

## Stack

React 19 · TypeScript · Vite 8 · TanStack Start · Tailwind v4 · Zustand · Better Auth · PGLite / Postgres

## Develop

```bash
npm install
npm run dev
```

App listens on `0.0.0.0:8080`.

```bash
npm run typecheck
npm run build
```

## Deploy

Vercel. `npm run build` emits a Nitro `vercel` preset. Optional env: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GROK_AUTH_*`.

Without `DATABASE_URL` the deploy uses embedded PGLite (auth + app data reset on cold start). For a persistent prototype, attach Neon and set `DATABASE_URL`.

## Product notes

| Flow | Where |
| --- | --- |
| Explore public songs | `/explore` |
| Your library | `/library` |
| New project | `/new` |
| Song + session + freeze | `/songs/:owner/:slug` → Session / Prepare for send |
| Design tokens | `/design` |

Collab-safe handoff is the core: freeze third-party plugs before you send the set, so the other side opens audio, not a missing-device wall.
