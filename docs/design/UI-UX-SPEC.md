# Posttape · Design System of Record

**Product:** Posttape — GitHub for songs  
**Surface:** Web app (desktop + mobile) · dark industrial-studio colourway  
**Companion:** `docs/design/HANDOFF.md` (engineering brief)  
**Master sheet:** `/design` (interactive)  
**Version:** 1.0.0-rc.1 · 2026-08-09  
**Repo state:** app-builder workspace · design system formalized from shipped UI

---

## 0. Intent

Posttape is the modern tape-in-the-mail workflow for producers. The UI should feel like a **calm studio desk** crossed with a **version-control product** — editorial, precise, low-chroma. Not a DAW skin, not a social-media feed, not a neon “AI music” landing page.

**Inherit language from refined product chrome** (planes, hairline borders, concentric radii).  
**Do not** inherit Micro-Rangers / RK-00pi layouts — those are 320×240 hardware. Posttape is fluid web.

---

## 1. Design tokens

### 1.1 Colourway — Studio Night (default)

| Token | Hex | Role |
| --- | --- | --- |
| `bg` | `#0A0A0B` | Page field |
| `bg-elevated` | `#121214` | Cards, panels, header |
| `bg-subtle` | `#1A1A1E` | Nested wells, hover base |
| `bg-hover` | `#222228` | Interactive hover fill |
| `fg` | `#F4F4F5` | Primary text |
| `fg-muted` | `#A1A1AA` | Secondary body |
| `fg-subtle` | `#71717A` | Captions, meta |
| `border` | `#27272A` | Hairline rules |
| `border-strong` | `#3F3F46` | Emphasis rules / focus-adjacent |
| `accent` | `#E4E4E7` | Primary button fill (near-white) |
| `accent-fg` | `#0A0A0B` | On-accent text |
| `signal` | `#5B8DEF` | Focus, links, freeze signal |
| `tape` | `#8B9BB4` | Brand cool metal (icons, labels) |
| `ok` | `#3D9A6A` | Collab-safe, frozen stem, success |
| `warn` | `#C4922A` | Needs freeze, missing plug |
| `danger` | `#C45C5C` | Destructive / hard fail |

**Rules**

- Neutrals first: ≥90% of surface area is `bg` / elevated / text / border.
- One brand metal (`tape`) + one action light (`accent`) + one signal blue (`signal`).
- Status greens/ambers/reds only on badges, chips, and small indicators — never full panels.
- No purple, violet, magenta, gold, or neon aurora as brand fills.
- Cover hues on song cards may use low-chroma HSL gradients for identity only (≤22% saturation).

### 1.2 Typography

| Role | Family | Weight | Size | Notes |
| --- | --- | --- | --- | --- |
| Display | Fraunces | 500–600 | clamp 2rem–3.75rem | Hero + section titles; tracking −0.03em |
| Body | DM Sans | 400–500 | 15px base | Line-height 1.5 |
| Label | DM Sans | 500–600 | 11–13px | Uppercase micro labels optional |
| Mono | IBM Plex Mono | 400–500 | 11–12px | Paths, commit SHAs, BPM, sizes |

**Scale (CSS tokens)**

- `text-xs` · `text-sm` · `text-base` · `text-lg` · `text-xl` · `text-2xl` · `text-3xl`
- Display sizes use fluid `clamp()`; body stays fixed at 15px for product chrome.

### 1.3 Radius (concentric)

| Token | Value | Use |
| --- | --- | --- |
| `radius-xs` | 4px | Chips inside dense rows |
| `radius-sm` | 8px | Buttons, inputs |
| `radius-md` | 12px | Nested panels, tabs |
| `radius-lg` | 16px | Cards, list shells |
| `radius-xl` | 24px | Dialogs, hero panels |
| `radius-2xl` | 32px | Marketing feature blocks |

**Rule:** `outerRadius = innerRadius + padding` on that axis. Never same radius on parent and padded child. Pills (`9999px`) only for small filter chips / badges.

### 1.4 Spacing

4 / 8-based: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.  
Content max width: `72rem` (`max-w-6xl`). Readable prose: ~60–75ch.

### 1.5 Motion

| Token | Duration | Use |
| --- | --- | --- |
| `motion-micro` | 80ms | Tooltip out, micro offset |
| `motion-quick` | 150ms | Close, in-place swap |
| `motion-fast` | 250ms | Open, tab change, hover |
| `motion-slow` | 400ms | Panel / freeze progress |

Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (smooth-out).  
Animate `opacity` + `transform` only. Respect `prefers-reduced-motion`.  
No scale-from-zero; modals open from 0.96.

### 1.6 Elevation

One shadow recipe:

```css
--shadow-soft:
  0 1px 0 color-mix(in oklab, var(--fg) 6%, transparent),
  0 12px 40px -20px color-mix(in oklab, #000 70%, transparent);
```

Prefer hairline borders over stacked shadows.

---

## 2. Chrome geometry

| Region | Spec |
| --- | --- |
| Header | Sticky · `h-14` · `bg/90` + blur · border-b |
| Content | Fluid · horizontal `px-4 sm:px-6` · max `6xl` |
| Footer | Quiet · border-t · product one-liner |
| Mobile nav | Header collapse · hamburger · 44px targets |

No OS-style status bar. No scroll-jacking. Touch targets ≥ 44px on mobile.

---

## 3. Component inventory

All controls live under `src/components/ui/*` (shadcn/Radix + tokens) or product composites in `src/components/*`.

### 3.1 Primitives

| Component | Variants / notes |
| --- | --- |
| `Button` | `default` (accent fill) · `secondary` · `outline` · `ghost` · `danger` · `signal` · sizes sm/default/lg/icon |
| `Badge` | `default` · `accent` · `ok` · `warn` · `danger` · `signal` · `private` |
| `Input` / `Textarea` | `h-10` · border · elevated well · signal focus ring |
| `Card` | elevated + soft shadow · concentric pad |
| `Tabs` | pill list · active = elevated surface |
| `Dialog` | xl radius · backdrop 70% black |
| `Switch` | signal checked · 44px touch |
| `Progress` | freeze wizard · signal fill |
| `Separator` | 1px border |
| `Label` | medium weight |

### 3.2 Product composites

| Composite | Purpose |
| --- | --- |
| `AppHeader` / `AppShell` | Global chrome |
| `SongCard` | Explore/library tile · cover hue · freeze badge |
| `PluginReport` | Device compatibility list |
| `TrackList` | Track rows · freeze + plugin chips |
| `FileTree` | Mono project paths |
| `FreezeWizard` | Pre-commit freeze plan → progress → done |
| `Avatar` | Hue gradient initials |

### 3.3 Geometry & affordance rules

- Press = colour/opacity change, optional `scale(0.98)` — not bounce, not glow stack.
- Selection = stronger border or elevated fill — not soft purple outline.
- Caption-over-value for continuous params when shown (BPM, levels).
- Dim (opacity), never hide, for muted/disabled secondary state.
- Icons: Lucide stroke, monochrome / `currentColor` / `tape`. No emoji in chrome.

---

## 4. Interaction model

### 4.1 Primary verbs

| Verb | Meaning |
| --- | --- |
| **Push** | Commit a revision (message + files + plugin snapshot) |
| **Freeze** | Print third-party/Max chains to audio before send |
| **Prepare** | Open freeze wizard for a collaborator package |
| **Invite** | Add collaborator by username/role |
| **Star** | Bookmark a song |
| **Open package** | Download collab-safe .als + freeze stems (demo toast for now) |

### 4.2 Direct vs select-then-edit

- **Direct-action:** Star, Invite, Prepare, Push, filter chips, tab switches, freeze checkboxes, transport-like primary CTAs.
- **Select-then-edit:** Form fields, invite username, commit message.
- No drag-reorder required in v1. No infinite scroll inertia tricks.

### 4.3 Freeze as pre-commit hook

1. Scan tracks → classify native / third-party / Max / already frozen.
2. Present plan with checkboxes (default: all actionable selected).
3. Run staged progress (read set → map devices → render freeze → write Freeze/ → manifest).
4. Commit kind `freeze` + activity feed item.
5. Collaborator machine report flips Missing → Frozen.

### 4.4 Navigation

| Path | Role |
| --- | --- |
| `/` | Marketing + value + featured shelf |
| `/explore` | Public songs + filters |
| `/library` | Owned / collab / starred |
| `/activity` | Tape feed |
| `/new` | Upload + create |
| `/songs/:owner/:slug` | Song repo (tabs: overview, tracks, files, history, plugins) |
| `/songs/:owner/:slug/prepare` | Freeze wizard |
| `/albums/:owner/:slug` | Album shelf |
| `/u/:username` | Artist profile |
| `/login` | Auth |
| `/design` | Design system master sheet |

### 4.5 Responsive

- Mobile-first: stack headers, full-width CTAs, horizontal scroll only for tabs when needed.
- No horizontal page overflow at 390px.
- Song page: main column + aside collapses to stacked.

---

## 5. Open questions — decided

1. **Brand name** → Posttape (not Stemgit / Relay). Tape-mail metaphor is the product story.  
2. **Primary accent** → Near-white fill buttons + cool `tape` metal + `signal` blue for freeze/focus — not orange hardware accents (those are Micro-Rangers).  
3. **Freeze ownership** → Server of record is the song revision; freeze is a first-class commit kind, not a side export only.  
4. **Plugin scan** → Heuristic path/text scan for v1; real ALS gzip-XML parse is a follow-on. UI treats scan results as truth for demo.  
5. **Auth** → Real Google/X via Grok broker; demo content readable signed-out. Library demos Ben’s desk when guest.  
6. **Public default for new songs** → Private on create (safer for unfinished sessions).  
7. **DAW support** → Ableton deep; flat folders first-class; other DAWs via stems/MIDI paths.  
8. **Design system home** → `/design` interactive master sheet + this markdown as of-record.

---

## 6. Screen specifications

### 6.1 Landing `/`

- Hero: display type, one primary CTA (Start a song), one secondary (Open demo collab).
- Feature grid 4-up → Handoff steps 3-up → Song shelf → Ableton panel.
- Tape-grid background at low opacity; no blob gradients.

### 6.2 Explore `/explore`

- Search + filter chips: All · Ableton · Folder · Collab-safe · Needs freeze.
- Responsive card grid 1/2/3 columns.

### 6.3 Song repo `/songs/:o/:s`

- Identity strip: owner/slug, visibility, DAW, BPM/key, tags, stats.
- Actions: Star · Invite · Prepare for send.
- Tabs with TrackList, FileTree, History (push), dual PluginReports (Taylor vs author).
- Aside: collaborators, Open in Ableton, album link.

### 6.4 Prepare `/songs/:o/:s/prepare`

- FreezeWizard phases: plan → running → done.
- Plan rows: freeze / export-stem / already-frozen / skip-native.
- Stats: tracks to freeze · est. MB · collab-safe status.

### 6.5 New `/new`

- Drop zone for .als / stems / folder.
- Live analysis badges (DAW · devices · need freeze).
- Form: title, description, BPM, key, tags, private switch.

### 6.6 Library / Activity / Profile / Album / Login

- Library: grid of owned+collab+starred.
- Activity: chronological tape feed with actor avatars.
- Profile: bio, albums, songs.
- Album: cover wash + song grid.
- Login: centered card, provider buttons only (Google/X).

---

## 7. States matrix

| State | Visual |
| --- | --- |
| Empty pad/card | elevated surface, quiet border |
| Filled / has content | same + content hierarchy |
| Playing / active freeze | signal or orange-not-used → use **signal** progress |
| Collab-safe | `ok` badge + Snowflake |
| Needs freeze | `warn` badge |
| Private | `private` badge + Lock |
| Missing plugin | `warn` text + Alert icon |
| Frozen away | `signal` chip on device |
| Selected | stronger border / elevated |
| Disabled | opacity 50%, no pointer |
| Loading session | same-size skeleton (auth slot) |
| Error | danger text + optional toast |

---

## 8. Content tone

- Short, plain labels. Verbs for actions: Prepare for send, Freeze & package, Push, Invite.
- No emoji in chrome.
- Metaphor allowed in marketing copy only (“send songs like mail”); product chrome stays operational.

---

## 9. Anti-slop checklist

- [ ] No purple brand gradients  
- [ ] No emoji icons  
- [ ] Tokens only — no ad-hoc hex in JSX  
- [ ] Concentric radii  
- [ ] ≤5 colour families + status  
- [ ] Display + body pairing only  
- [ ] Mobile 390px no overflow  
- [ ] Freeze path demoable in ≤3 clicks from home  

---

## 10. File map

| Path | Role |
| --- | --- |
| `src/styles.css` | Token source |
| `src/components/ui/*` | Primitives |
| `src/components/*` | Composites |
| `src/routes/*` | Screens |
| `docs/design/UI-UX-SPEC.md` | This document |
| `docs/design/HANDOFF.md` | Engineering brief |
| `/design` | Interactive master sheet |
