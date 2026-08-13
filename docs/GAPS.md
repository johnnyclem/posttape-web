# Posttape web prototype · PRD gap map

Source of record: [johnnyclem/posttape `docs/requirements.md`](https://github.com/johnnyclem/posttape/blob/claude/v1-0-implementation-hqdu3q/docs/requirements.md) (v0.1).

This app is the **web prototype**. The monorepo already implements most `M` requirements behind an Agent + API. Gaps below are relative to *this* codebase. Items marked **Agent/server** cannot be completed here without that stack.

Status: `done` in this prototype · `partial` · `gap` · `out` (Agent/server / explicitly not v1).

## Stance (PRD §0)

| Constraint | Prototype |
|---|---|
| Freeze cannot run on a server | Wizard **plans** and records a package. It does not claim to have driven Live. |
| Companion Agent is the product | Not in this repo. Manual Environment declaration stands in. |
| Real `.als` gzip-XML | Heuristic path/text scan only. |
| Content-addressed storage | Client Zustand persist. No chunking / quota. |

## v1 acceptance loop

| Step | Status |
|---|---|
| 1. Sign in (Google / X) | Partial — broker exists; no handle claim, no session list |
| 2. Pair Agent, private inventory | Out (Agent). Manual Environment in Settings is the stand-in. |
| 3. Private song + Take + bounce | Done (web) — create is you; rights checkbox; bounce flag on takes |
| 4. Plugin report with real IDs | Partial — catalog has identityKey + class; still name-keyed scan |
| 5. Invite collaborator, different plugs | Done (web) — Owner / Maintainer / Contributor / Listener |
| 6. Freeze wizard targeting them + routing | Done (web) — Take × Environment, stock-safe, returns/master, routing |
| 7. Execute + verify | Partial — guided checklist + re-check. No Live. |
| 8. Download, open, push Take 2 | Partial — package download is a text/JSON artifact; push + rights |
| 9. Musical diff, bounce, timecode comment | Done (web) |

## Must (`M`) — web-facing

| ID | Status | Notes |
|---|---|---|
| FR-A-01 | partial | Google/X via broker. Email/password still in stack. |
| FR-A-02–A-07 | gap / out | Handle reserve, sessions, deletion, pairing |
| FR-B-01 | done | Create song, slug, visibility — owner is the signed-in user |
| FR-B-02 | done | Private songs 404 to outsiders (song, feed, album, profile) |
| FR-B-03 | done | Public confirm names what becomes public; type `make public` |
| FR-B-04 | partial | Metadata yes; cover image no |
| FR-B-05 | done | Liner notes tab |
| FR-B-06 | partial | Star yes; starrer list no |
| FR-C-01–C-04 | partial | Commits exist; not content-addressed; bounce flag added |
| FR-C-05 | done | Musical diff between consecutive snapshots |
| FR-C-06 | partial | Package download (JSON/text), not a real `.als` |
| FR-D-* | partial | Heuristic ingest. No malware reject, no header inventory |
| FR-E-01–E-04 | partial | Class + license + identityKey on catalog (still name-keyed) |
| FR-E-05 | done | Plugin report vs named Environment |
| FR-F-01–F-07 | done | Plan vs named Environment; stock-safe; flagged returns/master |
| FR-G-01 | done (honest) | Web never claims to have executed Live |
| FR-G-02–G-05 | done | Checklist + verify + non-destructive package record |
| FR-H-01 | out | Agent scan |
| FR-H-02–H-05 | done | Inventories private; manual declare; Take × Env; collab summary |
| FR-I-01–I-03 | done | Owner / Maintainer / Contributor / Listener |
| FR-I-06 | gap | Audit log |
| FR-J-01–J-05 | done | Bounce play, comments, timecode + track |
| FR-K-03–K-05 | partial | Explore searches BPM/key; feed hides private |
| FR-L-* | out | Chunking, resume, quota |
| FR-M-* | gap | Notifications |
| FR-N-01 | done | Rights affirmation on create/push |
| FR-N-02–N-06 | gap / out | DMCA, malware, transparency |

## Explicitly not this prototype

Agent pairing, real freeze execution, CDC storage, signed object URLs, ALS golden corpus, email, DMCA ops, Windows/macOS scan. Those live in `johnnyclem/posttape`.

## Working order

1. Environments + freeze planning + roles + private access + liner notes + review loop — **done this pass**
2. Settings / sessions / handle / star list *(next)*
3. Notifications + legal pages
4. Wire to the monorepo API when you want the Agent in the loop
