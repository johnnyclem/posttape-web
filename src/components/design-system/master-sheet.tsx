import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Disc3,
  GitBranch,
  Lock,
  Package,
  Snowflake,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const TOC = [
  { id: "cover", label: "Cover" },
  { id: "tokens", label: "Tokens" },
  { id: "components", label: "Components" },
  { id: "interaction", label: "Interaction" },
  { id: "decisions", label: "Decisions" },
  { id: "screens", label: "Screens" },
  { id: "states", label: "States" },
] as const;

const COLORS: Array<{ name: string; token: string; hex: string; className: string }> = [
  { name: "bg", token: "bg", hex: "#0A0A0B", className: "bg-bg border border-border" },
  { name: "elevated", token: "bg-elevated", hex: "#121214", className: "bg-bg-elevated" },
  { name: "subtle", token: "bg-subtle", hex: "#1A1A1E", className: "bg-bg-subtle" },
  { name: "fg", token: "fg", hex: "#F4F4F5", className: "bg-fg" },
  { name: "muted", token: "fg-muted", hex: "#A1A1AA", className: "bg-fg-muted" },
  { name: "subtle text", token: "fg-subtle", hex: "#71717A", className: "bg-fg-subtle" },
  { name: "border", token: "border", hex: "#27272A", className: "bg-border" },
  { name: "accent", token: "accent", hex: "#E4E4E7", className: "bg-accent" },
  { name: "signal", token: "signal", hex: "#5B8DEF", className: "bg-signal" },
  { name: "tape", token: "tape", hex: "#8B9BB4", className: "bg-tape" },
  { name: "ok", token: "ok", hex: "#3D9A6A", className: "bg-ok" },
  { name: "warn", token: "warn", hex: "#C4922A", className: "bg-warn" },
  { name: "danger", token: "danger", hex: "#C45C5C", className: "bg-danger" },
];

export function DesignMasterSheet() {
  return (
    <div className="min-h-dvh bg-[#f4f2ec] text-[#1a1a1a]">
      {/* Light paper master-sheet shell — document, not product chrome */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f4f2ec]/95 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a]/80 hover:text-[#1a1a1a]"
          >
            <Disc3 className="size-4" />
            Posttape
          </Link>
          <span className="text-xs text-black/40">·</span>
          <span className="text-xs font-medium tracking-wide text-black/50 uppercase">
            Design system · Master sheet
          </span>
          <nav className="ml-auto hidden items-center gap-1 overflow-x-auto md:flex">
            {TOC.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="rounded-sm px-2 py-1 text-[11px] font-medium text-black/50 transition-colors hover:bg-black/5 hover:text-black"
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {/* ─── COVER ─── */}
        <section id="cover" className="scroll-mt-16">
          <SheetHeader
            page="01"
            kicker="POSTTAPE"
            title="Design System"
            subtitle="Master Sheet · Studio Night colourway · Web product"
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="font-display text-4xl tracking-tight text-[#0a0a0b] sm:text-5xl">
                Posttape
              </h1>
              <p className="mt-2 text-lg text-[#5b8def]">
                GitHub for songs · Design system of record
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-black/60">
                Versioned Ableton projects and DAW folders. Plugin-aware freeze so
                collaborators open working sets — the modern tape-in-the-mail handoff.
              </p>

              <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
                <Meta label="Of record" value="docs/design/UI-UX-SPEC.md" />
                <Meta label="Handoff" value="docs/design/HANDOFF.md" />
                <Meta label="Token source" value="src/styles.css @theme" />
                <Meta label="Version" value="1.0.0-rc.1 · 2026-08-09" />
                <Meta label="Surface" value="Web · dark studio · fluid" />
                <Meta label="Not" value="320×240 hardware · DAW skin" />
              </dl>
            </div>

            {/* Mini product chrome mock */}
            <div className="rounded-sm border border-black/15 bg-[#0a0a0b] p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[10px] text-white/50">
                <span className="text-[#8b9bb4]">LAUNCH · SONG</span>
                <span className="tabular-nums text-[#5b8def]">collab-safe</span>
                <span className="tabular-nums">120.0 BPM</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <span className="rounded-sm border border-white/15 bg-white/5 px-2 py-1 text-[10px] text-white/80">
                    Ableton
                  </span>
                  <span className="rounded-sm border border-[#c4922a]/40 bg-[#c4922a]/15 px-2 py-1 text-[10px] text-[#c4922a]">
                    Needs freeze
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {["KICK", "SNAR", "BASS", "LEAD"].map((t, i) => (
                    <div
                      key={t}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-sm border text-[9px] font-medium",
                        i === 3
                          ? "border-[#5b8def]/50 bg-[#5b8def]/20 text-[#5b8def]"
                          : i === 0
                            ? "border-[#3d9a6a]/40 bg-[#3d9a6a]/15 text-[#3d9a6a]"
                            : "border-white/10 bg-white/5 text-white/50",
                      )}
                    >
                      {t}
                    </div>
                  ))}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 bg-[#5b8def]" />
                </div>
                <p className="text-[9px] text-white/35">
                  Serum · UAD · Kontakt → freeze before send
                </p>
              </div>
            </div>
          </div>

          <p className="mt-10 border-t border-black/10 pt-4 text-xs text-black/45">
            Inherit refined product chrome language — not Micro-Rangers layouts.
            Engineering implements from this sheet + UI-UX-SPEC. No second visual language.
          </p>
        </section>

        <Rule />

        {/* ─── TOKENS ─── */}
        <section id="tokens" className="scroll-mt-16">
          <SheetHeader
            page="02"
            kicker="TOKENS & CHROME"
            title="Design tokens & geometry"
            subtitle="Studio Night · fixed scales · concentric radii"
          />

          <h3 className="mt-8 text-xs font-semibold tracking-widest text-black/45 uppercase">
            Colourway — Studio Night (default)
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
            {COLORS.map((c) => (
              <div key={c.token} className="text-center">
                <div className={cn("mx-auto size-14 rounded-sm border border-black/10", c.className)} />
                <div className="mt-1.5 text-[11px] font-medium">{c.name}</div>
                <div className="font-mono text-[10px] text-black/45">{c.hex}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold tracking-widest text-black/45 uppercase">
                Type scale
              </h3>
              <ul className="mt-3 space-y-3">
                <TypeRow family="Fraunces" role="Display / hero" sample="Send songs like mail" size="text-2xl" />
                <TypeRow family="DM Sans" role="Body 15px" sample="Plugin-aware freeze for collaborators" size="text-sm" />
                <TypeRow family="DM Sans" role="Label 11–13px" sample="THIRD-PARTY PLUGS · COLLAB-SAFE" size="text-xs font-medium tracking-wide" />
                <TypeRow family="IBM Plex Mono" role="Mono paths / SHA" sample="Samples/Processed/Freeze/Lead.wav" size="font-mono text-xs" />
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-widest text-black/45 uppercase">
                Radius · spacing · motion
              </h3>
              <div className="mt-3 space-y-2 text-sm text-black/70">
                <p>
                  <span className="font-medium text-black">Radius:</span> 4 · 8 · 12 · 16 · 24 · 32 — concentric
                  (`outer = inner + pad`)
                </p>
                <p>
                  <span className="font-medium text-black">Space:</span> 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64
                </p>
                <p>
                  <span className="font-medium text-black">Motion:</span> 80 / 150 / 250 / 400ms · smooth-out ·
                  opacity+transform
                </p>
                <p>
                  <span className="font-medium text-black">Chrome:</span> sticky header 56px · content max 72rem ·
                  hairline borders · one soft shadow
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-2">
                {[4, 8, 12, 16, 24, 32].map((r) => (
                  <div
                    key={r}
                    className="border-2 border-[#5b8def]/50 bg-white"
                    style={{ width: 40 + r, height: 40 + r / 2, borderRadius: r }}
                    title={`${r}px`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-sm border border-black/10 bg-white p-4 text-sm text-black/65">
            <strong className="text-black">Rules:</strong> Neutrals ≥90% of area. No purple/gold brand fills.
            Status colours only on badges. No ad-hoc hex in JSX — tokens in{" "}
            <code className="font-mono text-xs">src/styles.css</code>.
          </div>
        </section>

        <Rule />

        {/* ─── COMPONENTS ─── */}
        <section id="components" className="scroll-mt-16">
          <SheetHeader
            page="03"
            kicker="COMPONENT SHEET"
            title="Component sheet"
            subtitle="Primitives at product proportions · no shadows-as-affordance · no gradients"
          />

          {/* Live dark stage */}
          <div className="mt-8 overflow-hidden rounded-sm border border-black/20 bg-[#0a0a0b] p-5 text-[#f4f4f5] sm:p-6">
            <h4 className="text-[10px] font-medium tracking-widest text-white/40 uppercase">
              Buttons
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="secondary">
                Secondary
              </Button>
              <Button size="sm" variant="outline">
                Outline
              </Button>
              <Button size="sm" variant="ghost">
                Ghost
              </Button>
              <Button size="sm" variant="signal">
                <Snowflake className="size-3.5" />
                Freeze
              </Button>
              <Button size="sm" variant="danger">
                Danger
              </Button>
            </div>

            <h4 className="mt-6 text-[10px] font-medium tracking-widest text-white/40 uppercase">
              Badges · freeze states
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="default">Ableton</Badge>
              <Badge variant="private">
                <Lock className="size-3" />
                Private
              </Badge>
              <Badge variant="ok">
                <Snowflake className="size-3" />
                Collab-safe
              </Badge>
              <Badge variant="warn">Needs freeze</Badge>
              <Badge variant="signal">Frozen away</Badge>
              <Badge variant="danger">Missing plug</Badge>
            </div>

            <h4 className="mt-6 text-[10px] font-medium tracking-widest text-white/40 uppercase">
              Inputs · switch · progress
            </h4>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input placeholder="Commit message…" className="max-w-xs" defaultValue="Freeze lead for Taylor" />
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Switch defaultChecked />
                Private song
              </div>
              <div className="w-full max-w-[160px]">
                <Progress value={66} />
              </div>
            </div>

            <h4 className="mt-6 text-[10px] font-medium tracking-widest text-white/40 uppercase">
              Plugin chips · track row
            </h4>
            <div className="mt-3 flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-bg-elevated p-3">
              <span className="mt-1 size-2.5 shrink-0 rounded-full bg-[#db2777]" />
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">Lead_Heights</span>
                  <Badge variant="default">midi</Badge>
                  <Badge variant="warn">Live</Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className="rounded-[var(--radius-xs)] border border-warn/30 px-1.5 py-0.5 text-[11px] text-warn">
                    Serum 2
                  </span>
                  <span className="rounded-[var(--radius-xs)] border border-warn/30 px-1.5 py-0.5 text-[11px] text-warn">
                    EchoBoy
                  </span>
                  <span className="rounded-[var(--radius-xs)] border border-signal/30 px-1.5 py-0.5 text-[11px] text-signal">
                    Valhalla (frozen)
                  </span>
                </div>
              </div>
            </div>

            <h4 className="mt-6 text-[10px] font-medium tracking-widest text-white/40 uppercase">
              Compatibility row
            </h4>
            <div className="mt-3 divide-y divide-border rounded-[var(--radius-md)] border border-border">
              {[
                { name: "EQ Eight", status: "ok" as const, detail: "Ableton · Native" },
                { name: "Serum 2", status: "missing" as const, detail: "Xfer · VST3" },
                { name: "Omnisphere", status: "frozen" as const, detail: "Spectrasonics · VST3" },
              ].map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-[11px] text-fg-subtle">{r.detail}</div>
                  </div>
                  {r.status === "ok" && (
                    <span className="inline-flex items-center gap-1 text-xs text-ok">
                      <Check className="size-3.5" /> Installed
                    </span>
                  )}
                  {r.status === "missing" && (
                    <span className="inline-flex items-center gap-1 text-xs text-warn">
                      <AlertTriangle className="size-3.5" /> Missing
                    </span>
                  )}
                  {r.status === "frozen" && (
                    <span className="inline-flex items-center gap-1 text-xs text-signal">
                      <Snowflake className="size-3.5" /> Frozen
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <ul className="mt-6 space-y-1.5 text-sm text-black/65">
            <li>· Radius from token scale; concentric nesting on cards/dialogs.</li>
            <li>· Press affordance = fill/opacity (optional scale 0.98) — not glow, not bounce.</li>
            <li>· Direct-action CTAs ≥ 40px height; mobile tap ≥ 44px.</li>
            <li>· Lucide icons only; monochrome / tape / status — no emoji chrome.</li>
          </ul>
        </section>

        <Rule />

        {/* ─── INTERACTION ─── */}
        <section id="interaction" className="scroll-mt-16">
          <SheetHeader
            page="04"
            kicker="INTERACTION MODEL"
            title="Interaction model"
            subtitle="Product verbs · freeze hook · navigation · responsive"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <IxCard
              title="Direct action"
              body="Star, Invite, Prepare, Push, filter chips, freeze checkboxes, primary CTAs. Fire on press."
            />
            <IxCard
              title="Select-then-edit"
              body="Form fields, commit message, invite username, BPM/key. Focus then type."
            />
            <IxCard
              title="Freeze pre-commit"
              body="Scan → plan → render freeze stems → plugin manifest → commit kind freeze → activity item."
            />
            <IxCard
              title="No inertia chrome"
              body="No drag-reorder v1. No scroll-jacking. Tabs may overflow-x on mobile; page never does."
            />
          </div>

          <h3 className="mt-8 text-xs font-semibold tracking-widest text-black/45 uppercase">
            Primary verbs
          </h3>
          <div className="mt-3 overflow-hidden rounded-sm border border-black/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.03] text-[11px] tracking-wide text-black/50 uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Verb</th>
                  <th className="px-3 py-2 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {[
                  ["Push", "Commit revision + plugin snapshot"],
                  ["Freeze", "Print third-party/Max chains to audio"],
                  ["Prepare", "Open freeze wizard for collaborator package"],
                  ["Invite", "Add collaborator by username / role"],
                  ["Star", "Bookmark a song"],
                  ["Get package", "Download collab-safe set + freeze stems"],
                ].map(([v, m]) => (
                  <tr key={v}>
                    <td className="px-3 py-2 font-medium">{v}</td>
                    <td className="px-3 py-2 text-black/60">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Rule />

        {/* ─── DECISIONS ─── */}
        <section id="decisions" className="scroll-mt-16">
          <SheetHeader
            page="05"
            kicker="OPEN QUESTIONS — DECIDED"
            title="Open questions — decided"
            subtitle="Product + design lock for 1.0.0-rc.1"
          />

          <ol className="mt-8 space-y-5">
            {[
              {
                q: "Brand & metaphor",
                a: "Posttape. Tape-mail story is marketing + product language; chrome stays operational.",
              },
              {
                q: "Accent system",
                a: "Near-white primary buttons + tape metal + signal blue. Not Micro-Rangers orange hardware accents.",
              },
              {
                q: "Freeze ownership",
                a: "First-class commit kind on the song, not a side export only. Activity feed records freezes.",
              },
              {
                q: "Plugin scan depth",
                a: "v1 heuristic path/text scan. UI treats results as truth for demo; ALS XML parse deferred.",
              },
              {
                q: "Auth vs guest",
                a: "Real Google/X. Public demos readable signed-out. Library demos Ben’s desk for guests.",
              },
              {
                q: "Default visibility",
                a: "Private on create — unfinished sessions stay off the shelf.",
              },
              {
                q: "DAW support",
                a: "Ableton deep (.als + Freeze folders). Flat folders first-class. Other DAWs via stems/MIDI.",
              },
              {
                q: "Design system home",
                a: "/design interactive master sheet + docs/design/UI-UX-SPEC.md of record.",
              },
            ].map((d, i) => (
              <li key={d.q} className="flex gap-4">
                <span className="font-mono text-sm text-[#5b8def] tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-medium">{d.q}</div>
                  <p className="mt-1 text-sm text-black/60">{d.a}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <Rule />

        {/* ─── SCREENS ─── */}
        <section id="screens" className="scroll-mt-16">
          <SheetHeader
            page="06–12"
            kicker="SCREENS"
            title="Screen map & redlines"
            subtitle="Every product surface · implement from these contracts"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <ScreenCard
              name="Landing"
              path="/"
              bullets={[
                "Display hero + dual CTAs",
                "Feature 4-up · handoff 3-up",
                "Song shelf · Ableton panel",
                "Tape-grid low-opacity only",
              ]}
              icon={Disc3}
            />
            <ScreenCard
              name="Explore"
              path="/explore"
              bullets={[
                "Search + filter chips",
                "SongCard grid 1/2/3",
                "Collab-safe / needs freeze",
                "Public only",
              ]}
              icon={Package}
            />
            <ScreenCard
              name="Song repo"
              path="/songs/:o/:s"
              bullets={[
                "Identity strip + stats",
                "Tabs: tracks/files/history/plugins",
                "PluginReport dual machine",
                "Aside: collab · package · album",
              ]}
              icon={GitBranch}
            />
            <ScreenCard
              name="Prepare / freeze"
              path="/songs/:o/:s/prepare"
              bullets={[
                "Plan · running · done phases",
                "Checkbox freeze items",
                "Est. MB + collab-safe stat",
                "Writes freeze commit",
              ]}
              icon={Snowflake}
            />
            <ScreenCard
              name="New song"
              path="/new"
              bullets={[
                "Drop .als / folder / stems",
                "Live DAW + plugin analysis",
                "Private switch default on",
                "Redirect to song on create",
              ]}
              icon={Star}
            />
            <ScreenCard
              name="Library · Feed · Profile"
              path="/library · /activity · /u/:user"
              bullets={[
                "Owned + collab + starred",
                "Tape feed chronological",
                "Artist albums + songs",
                "Album cover wash + grid",
              ]}
              icon={Lock}
            />
          </div>

          <div className="mt-8 rounded-sm border border-black/10 bg-white p-4">
            <h3 className="text-xs font-semibold tracking-widest text-black/45 uppercase">
              Song repo redlines
            </h3>
            <ul className="mt-3 grid gap-2 text-sm text-black/65 sm:grid-cols-2">
              <li>· Header actions right-aligned; wrap on mobile</li>
              <li>· Stats: tracks · frozen · third-party · collab-safe</li>
              <li>· Prepare CTA always visible when not freezeReady</li>
              <li>· Taylor machine report is default overview pane</li>
              <li>· Commit list mono shortId · relative time · kind badge</li>
              <li>· File tree mono paths · size MB · kind</li>
            </ul>
          </div>
        </section>

        <Rule />

        {/* ─── STATES ─── */}
        <section id="states" className="scroll-mt-16 pb-16">
          <SheetHeader
            page="13–14"
            kicker="STATES & CHECKLIST"
            title="States matrix & finish bar"
            subtitle="Visual truth table · anti-slop · file map"
          />

          <div className="mt-8 overflow-hidden rounded-sm border border-black/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.03] text-[11px] tracking-wide text-black/50 uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">State</th>
                  <th className="px-3 py-2 font-medium">Visual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {[
                  ["Empty", "Elevated surface · quiet border"],
                  ["Collab-safe", "ok badge + Snowflake"],
                  ["Needs freeze", "warn badge"],
                  ["Private", "private badge + Lock"],
                  ["Missing plugin", "warn row + Alert icon"],
                  ["Frozen away", "signal chip on device"],
                  ["Live track", "warn Live badge"],
                  ["Stem / frozen track", "ok Stem · signal Frozen"],
                  ["Auth pending", "Same-size skeleton in auth slot"],
                  ["Disabled", "opacity 50% · no pointer"],
                ].map(([s, v]) => (
                  <tr key={s}>
                    <td className="px-3 py-2 font-medium">{s}</td>
                    <td className="px-3 py-2 text-black/60">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-10 text-xs font-semibold tracking-widest text-black/45 uppercase">
            Anti-slop checklist
          </h3>
          <ul className="mt-3 grid gap-2 text-sm text-black/65 sm:grid-cols-2">
            {[
              "No purple brand gradients",
              "No emoji in chrome",
              "Tokens only — no ad-hoc hex in JSX",
              "Concentric radii",
              "≤5 colour families + status",
              "Display + body pairing only",
              "Mobile 390px no overflow",
              "Freeze path ≤3 clicks from home",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-[#3d9a6a]" />
                {item}
              </li>
            ))}
          </ul>

          <h3 className="mt-10 text-xs font-semibold tracking-widest text-black/45 uppercase">
            File map
          </h3>
          <div className="mt-3 font-mono text-xs leading-relaxed text-black/60">
            <div>src/styles.css — token source</div>
            <div>src/components/ui/* — primitives</div>
            <div>src/components/* — product composites</div>
            <div>src/routes/* — screens</div>
            <div>docs/design/UI-UX-SPEC.md — of record</div>
            <div>docs/design/HANDOFF.md — engineering brief</div>
            <div>/design — this master sheet</div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-6">
            <p className="text-xs text-black/45">
              Posttape design system · 1.0.0-rc.1 · implement from redlines
            </p>
            <Button asChild size="sm" className="bg-[#0a0a0b] text-[#f4f4f5] hover:bg-[#0a0a0b]/90">
              <Link to="/">Back to product</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SheetHeader({
  page,
  kicker,
  title,
  subtitle,
}: {
  page: string;
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-b border-black/10 pb-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-[#5b8def] uppercase">
          {kicker}
        </p>
        <p className="font-mono text-[10px] text-black/35 tabular-nums">{page}</p>
      </div>
      <h2 className="mt-2 font-display text-2xl tracking-tight text-[#0a0a0b] sm:text-3xl">
        {title}
      </h2>
      <p className="mt-1 text-sm text-black/50">{subtitle}</p>
    </div>
  );
}

function Rule() {
  return <hr className="my-14 border-0 border-t border-black/10" />;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold tracking-wide text-black/40 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-xs text-black/70">{value}</dd>
    </div>
  );
}

function TypeRow({
  family,
  role,
  sample,
  size,
}: {
  family: string;
  role: string;
  sample: string;
  size: string;
}) {
  return (
    <li className="border-b border-black/5 pb-2">
      <div className="text-[10px] text-black/40">
        {family} · {role}
      </div>
      <div className={cn("mt-0.5 text-black", size)}>{sample}</div>
    </li>
  );
}

function IxCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-sm border border-black/10 bg-white p-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-1.5 text-sm text-black/60">{body}</p>
    </div>
  );
}

function ScreenCard({
  name,
  path,
  bullets,
  icon: Icon,
}: {
  name: string;
  path: string;
  bullets: string[];
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-sm border border-black/10 bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-[#5b8def]" />
        <h4 className="text-sm font-semibold">{name}</h4>
      </div>
      <p className="mt-1 font-mono text-[11px] text-black/40">{path}</p>
      <ul className="mt-3 space-y-1 text-xs text-black/60">
        {bullets.map((b) => (
          <li key={b}>· {b}</li>
        ))}
      </ul>
    </div>
  );
}
