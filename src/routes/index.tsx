import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  GitBranch,
  Lock,
  Mail,
  Package,
  Snowflake,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { SongCard } from "@/components/song-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePosttape } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const publicSongs = usePosttape((s) => s.publicSongs);
  const featured = publicSongs().slice(0, 3);

  return (
    <AppShell>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 tape-grid opacity-50" />
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, hsl(210 30% 40%), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Badge variant="signal" className="mb-5">
            <Mail className="size-3" />
            The modern tape exchange
          </Badge>
          <h1 className="font-display max-w-3xl text-4xl leading-[1.1] tracking-tight text-fg sm:text-5xl md:text-6xl text-balance">
            Send songs like mail.
            <span className="text-fg-muted"> Open them without the plugs.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-fg-muted sm:text-lg">
            Posttape is GitHub for musicians — versioned Ableton projects and
            DAW folders, public or private, with an intelligent freeze step so
            your collaborator gets a working session, not a missing-plugin wall.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/new">
                Start a song
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/songs/$owner/$slug" params={{ owner: "ben", slug: "such-great-heights" }}>
                Open demo collab
              </Link>
            </Button>
          </div>
          <p className="mt-6 max-w-lg text-sm text-fg-subtle">
            Inspired by how The Postal Service made their first album — tracks
            shipped back and forth — rebuilt for Live sets, stems, and Max
            devices.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={Package}
            title="Plugin-aware"
            body="Scans Ableton sets and folders for VST3, AU, Max for Live, and native devices."
          />
          <Feature
            icon={Snowflake}
            title="Freeze before send"
            body="Pre-commit hook freezes third-party chains so Taylor opens your project cold."
          />
          <Feature
            icon={GitBranch}
            title="Versioned songs"
            body="Commits, history, and collaborators — not a mystery zip from last Tuesday."
          />
          <Feature
            icon={Lock}
            title="Public or private"
            body="Share a public demo or keep a private album between two machines."
          />
        </div>
      </section>

      <section className="border-y border-border bg-bg-elevated/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
                How a handoff works
              </h2>
              <p className="mt-2 max-w-lg text-sm text-fg-muted">
                You finish a pass in Ableton. Posttape freezes what they lack.
                They pull, open, keep working.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link
                to="/songs/$owner/$slug/prepare"
                params={{ owner: "ben", slug: "such-great-heights" }}
              >
                Try freeze wizard
              </Link>
            </Button>
          </div>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            <Step
              n="01"
              title="Upload Live set or folder"
              body="Drop a .als project with Samples/, or any flat folder of stems from Logic, FL, Reaper."
            />
            <Step
              n="02"
              title="Review plugin report"
              body="See which devices are native, third-party, Max, or already frozen. Invite collaborators."
            />
            <Step
              n="03"
              title="Freeze & send"
              body="One hook prints risky tracks to audio. Your partner pulls a collab-safe revision."
            />
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl tracking-tight">On the shelf</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/explore">
              Explore all
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-bg-elevated">
          <div className="grid md:grid-cols-2">
            <div className="p-6 sm:p-10">
              <Waves className="size-6 text-tape" />
              <h2 className="mt-4 font-display text-2xl tracking-tight">
                Ableton first. Every other DAW welcome.
              </h2>
              <p className="mt-3 text-sm text-fg-muted leading-relaxed">
                Deep support for Ableton Live project layout — .als, Freeze
                folders, Backup sets, Max devices. For everything else, drop a
                flat folder of stems and MIDI; Posttape still tracks versions,
                visibility, and collaborators.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-fg-muted">
                <li className="flex gap-2">
                  <span className="text-signal">·</span>
                  Detect Serum, FabFilter, UAD, Kontakt, Omnisphere, Valhalla…
                </li>
                <li className="flex gap-2">
                  <span className="text-signal">·</span>
                  Max for Live chains auto-flagged for freeze
                </li>
                <li className="flex gap-2">
                  <span className="text-signal">·</span>
                  Compatibility view from your collaborator's machine
                </li>
              </ul>
            </div>
            <div
              className="relative min-h-48 border-t border-border p-6 sm:min-h-0 sm:border-l sm:border-t-0 sm:p-10"
              style={{
                background:
                  "linear-gradient(160deg, hsl(210 18% 12%), hsl(220 14% 8%))",
              }}
            >
              <div className="font-mono text-xs text-fg-subtle">
                <div className="text-tape">// pre-commit freeze</div>
                <div className="mt-3 text-fg-muted">scan tracks.devices</div>
                <div className="text-fg-muted">if third_party or max_for_live:</div>
                <div className="pl-4 text-fg">freeze → Samples/Processed/Freeze/</div>
                <div className="text-fg-muted">write plugin_manifest.json</div>
                <div className="mt-3 text-ok">// collaborator can open without plugs</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5">
      <Icon className="size-5 text-tape" strokeWidth={1.5} />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-fg-muted">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="rounded-[var(--radius-lg)] border border-border bg-bg p-5">
      <span className="font-mono text-xs text-tape">{n}</span>
      <h3 className="mt-2 font-medium">{title}</h3>
      <p className="mt-1.5 text-sm text-fg-muted">{body}</p>
    </li>
  );
}
