# Posttape · Engineering Handoff

Companion to `docs/design/UI-UX-SPEC.md` and the interactive master sheet at `/design`.

## Stack

- TanStack Start + React 19 + Vite 8
- Tailwind v4 (`@theme` tokens in `src/styles.css`)
- Radix / shadcn-style primitives in `src/components/ui`
- Zustand + persist for song/project state (`src/lib/store.ts`)
- Better Auth (Google / X) via prewired `src/lib/auth`
- PGLite in preview · Neon when `DATABASE_URL` set

## Non-negotiables from design

1. **Token-only colour** — no raw hex in components.
2. **Freeze is a commit kind** — `runFreeze` updates tracks, files, commits, activity.
3. **Plugin compatibility is first-class UI** — `PluginReport` on song overview + plugins tab.
4. **Private by default** on create.
5. **Ableton + flat folders** — `detectDaw` / `scanPluginsFromUpload` in `src/lib/ableton.ts`.

## Key modules

| Module | Responsibility |
| --- | --- |
| `lib/types.ts` | Song, Track, Plugin, Commit, FreezePlan |
| `lib/plugins.ts` | Catalog + `needsFreeze` |
| `lib/ableton.ts` | DAW detect, scan, freeze plan/apply |
| `lib/seed.ts` | Demo collab graph (Postal Service story) |
| `lib/store.ts` | Client state API |
| `components/freeze-wizard.tsx` | Prepare UX |
| `components/plugin-report.tsx` | Compatibility + tracks + files |

## Preview contract

- Dev server: `0.0.0.0:8080` via `startup.sh` / `npm run dev`
- Production: `npm run build` (Vercel / nitro preset)

## Deferred (designed seat, not bolted-on)

- Real ALS gzip-XML device parse
- Binary package download of freeze stems
- Desktop helper / Max device that freezes pre-push
- Per-user plugin inventory (not just Taylor demo set)
- Light colourway
- Real multiplayer presence on a song

## Implement from redlines

Engineering implements screens from `/design` + this brief. Do not invent a second visual language when adding features — extend tokens and primitives first.
