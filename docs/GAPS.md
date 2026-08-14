# Posttape web prototype · PRD gap map

Source of record: [johnnyclem/posttape `docs/requirements.md`](https://github.com/johnnyclem/posttape/blob/claude/v1-0-implementation-hqdu3q/docs/requirements.md) (v0.1).

This app is the **web prototype**. The monorepo already implements most `M` requirements behind an Agent + API. Gaps below are relative to *this* codebase. Items marked **Agent/server** cannot be completed here without that stack.

Status: `done` in this prototype · `partial` · `gap` · `out` (Agent/server / explicitly not v1).

## Stance (PRD §0)

| Constraint | Prototype |
|---|---|
| Freeze cannot run on a server | Wizard **plans** and records a package. It does not claim to have driven Live. |
| Companion Agent is the product | Pairing UI + `/api/v1` client. Execution stays on the desktop Agent. |
| Real `.als` gzip-XML | Heuristic path/text scan only. |
| Content-addressed storage | Client Zustand persist. No chunking / quota. |

## v1 acceptance loop

| Step | Status |
|---|---|
| 1. Sign in (Google / X) | Partial — broker exists; handle claim + session list in Settings |
| 2. Pair Agent, private inventory | Partial — device code + approve stand-in. Real Agent is the monorepo. |
| 3. Private song + Take + bounce | Done (web) |
| 4. Plugin report with real IDs | Partial — catalog identityKey; scan still name-keyed |
| 5. Invite collaborator, different plugs | Done (web) |
| 6. Freeze wizard targeting them + routing | Done (web) |
| 7. Execute + verify | Partial — checklist + re-check. No Live. |
| 8. Download, open, push Take 2 | Partial — package is a text/JSON artifact |
| 9. Musical diff, bounce, timecode comment | Done (web) |

## Must (`M`) — web-facing

| ID | Status | Notes |
|---|---|---|
| FR-A-01 | partial | Google/X via broker |
| FR-A-02 | done | Handle claim, reserved/offensive block list |
| FR-A-03 | done | Profile + handle + links |
| FR-A-05 | done | Sessions listable/revocable (Better Auth + this-desk) |
| FR-A-06 | done | 30-day grace + anonymize (prototype wipe) |
| FR-A-07 | partial | Device-code pairing UI; Agent not in this repo |
| FR-B-01–B-03 | done | |
| FR-B-04 | partial | Metadata yes; cover image no |
| FR-B-05 | done | Liner notes |
| FR-B-06 | done | Star + public starrer list |
| FR-C-01–C-04 | partial | Commits exist; not content-addressed |
| FR-C-05 | done | Musical diff |
| FR-C-06 | partial | Package download (JSON/text) |
| FR-D-07 | done | Plugin binaries / executables rejected on upload |
| FR-D-* | partial | Heuristic ingest |
| FR-E-01–E-05 | partial | Class + license + identityKey; name-keyed scan |
| FR-F-01–F-07 | done | Take × Environment plan |
| FR-G-01–G-05 | done (honest) | Checklist + verify; never claims Live ran |
| FR-H-01 | out | Agent scan |
| FR-H-02–H-05 | done | Inventories private; manual / paired declare |
| FR-I-01–I-03 | done | Roles |
| FR-I-06 | done | Owner-visible audit log |
| FR-J-01–J-05 | done | Review loop |
| FR-K-03–K-05 | partial | Explore BPM/key; feed hides private |
| FR-L-* | out | Chunking, resume, quota |
| FR-M-01 | done | In-app inbox |
| FR-M-02 | partial | Email prefs stored; no mail sent |
| FR-M-03 | done | Per-song mute |
| FR-N-01 | done | Rights affirmation |
| FR-N-02 | done | DMCA form, agent, counter-notice, SLA copy |
| FR-N-03 | done | Takedown = legal hold, not delete |
| FR-N-04 | done | Report on public songs |
| FR-N-05 | partial | Binary reject; no AV engine |
| FR-N-06 | done | Transparency record |

## Explicitly not this prototype

Real freeze execution, CDC storage, signed object URLs, ALS golden corpus, outbound email, AV malware engine, Windows/macOS scan. Those live in `johnnyclem/posttape`. This app speaks `/api/v1` when you point Settings → Machines at a running server.

## Working order

1. Environments + freeze + roles + private + liner notes + review — **done**
2. Settings / sessions / handle / star list — **done**
3. Notifications + legal pages — **done**
4. Agent API client + pairing — **done (web half)**; wire a live monorepo URL when you have one
