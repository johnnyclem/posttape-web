import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Loader2,
  Snowflake,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Waveform } from "@/components/waveform";
import { buildFreezePlan } from "@/lib/ableton";
import { usePosttape } from "@/lib/store";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FreezeWizard({
  song,
  authorId,
  onDone,
}: {
  song: Song;
  authorId: string;
  onDone?: () => void;
}) {
  const runFreeze = usePosttape((s) => s.runFreeze);
  const plan = useMemo(() => buildFreezePlan(song), [song]);
  const actionable = plan.items.filter(
    (i) => i.action === "freeze" || i.action === "export-stem",
  );
  const [selected, setSelected] = useState<string[]>(() =>
    actionable.map((i) => i.trackId),
  );
  const [phase, setPhase] = useState<"plan" | "running" | "done">("plan");
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function run() {
    if (selected.length === 0) {
      setPhase("done");
      return;
    }
    setPhase("running");
    setProgress(0);
    const steps = [
      "Reading Live set structure…",
      "Mapping device chains…",
      "Rendering freeze audio…",
      "Writing Samples/Processed/Freeze…",
      "Updating plugin manifest…",
      "Preparing collaborator package…",
    ];
    for (let i = 0; i < steps.length; i++) {
      setStepLabel(steps[i]);
      setProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise((r) => setTimeout(r, 380));
    }
    runFreeze(song.id, selected, authorId);
    setPhase("done");
  }

  if (phase === "done") {
    return (
      <div className="rounded-[var(--radius-xl)] border border-ok/30 bg-ok/5 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-ok" strokeWidth={1.5} />
        <h3 className="mt-3 font-display text-xl text-fg">Ready to send</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
          Selected tracks are frozen or printed as stems. Your collaborator can
          open this project without matching third-party plugs — the modern
          tape-in-the-mail handoff.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={onDone}>
            <Download className="size-4" />
            Back to song
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-6">
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Loader2 className="size-4 animate-spin text-signal" />
          Pre-commit freeze hook
        </div>
        <p className="mt-3 font-medium text-fg">{stepLabel}</p>
        {/* animating freeze waveform strip */}
        <div className="mt-4 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-bg">
          <Waveform
            seed={`freeze-progress-${Math.floor(progress / 10)}`}
            color="var(--color-signal)"
            samples={72}
            height={48}
            mirror
            playhead={progress / 100}
          />
        </div>
        <Progress value={progress} className="mt-4" />
        <p className="mt-2 text-xs tabular-nums text-fg-subtle">{progress}%</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-bg-subtle text-signal">
            <Snowflake className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-xl tracking-tight">
              Prepare for collaborator
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Posttape scans device chains and freezes anything your partner
              might not have — Serum, UAD, Max for Live, Kontakt libraries —
              so they open a working set, not a wall of missing plugs.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat
            label="Tracks to freeze"
            value={String(actionable.length)}
            tone={actionable.length ? "warn" : "ok"}
          />
          <Stat
            label="Est. freeze size"
            value={`~${plan.estimatedMb} MB`}
            tone="default"
          />
          <Stat
            label="Status"
            value={plan.collaboratorSafe ? "Already safe" : "Needs freeze"}
            tone={plan.collaboratorSafe ? "ok" : "warn"}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Freeze plan</h3>
          <Badge variant="signal">
            <Sparkles className="size-3" />
            Pre-commit hook
          </Badge>
        </div>
        <ul className="divide-y divide-border">
          {plan.items.map((item) => {
            const canSelect =
              item.action === "freeze" || item.action === "export-stem";
            const checked = selected.includes(item.trackId);
            const track = song.tracks.find((t) => t.id === item.trackId);
            return (
              <li key={item.trackId}>
                <label
                  className={cn(
                    "flex cursor-pointer gap-3 px-4 py-3 transition-colors",
                    canSelect ? "hover:bg-bg-subtle/50" : "opacity-80",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-[var(--color-signal)]"
                    disabled={!canSelect}
                    checked={canSelect ? checked : item.action === "already-frozen"}
                    onChange={() => canSelect && toggle(item.trackId)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {track && (
                        <span
                          className="size-2 rounded-full"
                          style={{ background: track.color }}
                        />
                      )}
                      <span className="text-sm font-medium">{item.trackName}</span>
                      <ActionBadge action={item.action} />
                    </div>
                    {track && (
                      <div className="mt-2 overflow-hidden rounded-[var(--radius-xs)] border border-border/70 bg-bg/40">
                        <Waveform
                          seed={track.id}
                          color={track.color}
                          kind={track.kind}
                          samples={56}
                          height={28}
                          mirror
                          dimmed={
                            item.action === "already-frozen" ||
                            item.action === "skip-native"
                          }
                        />
                      </div>
                    )}
                    <p className="mt-1.5 text-xs text-fg-muted">{item.reason}</p>
                    {item.plugins.length > 0 && (
                      <p className="mt-1 text-[11px] text-fg-subtle">
                        {item.plugins.join(" · ")}
                      </p>
                    )}
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {plan.missingPlugins.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
          Note: {plan.missingPlugins.map((p) => p.name).join(", ")} marked
          missing on this machine — freeze still prints audio for the other side.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={run}
          disabled={actionable.length > 0 && selected.length === 0}
        >
          <Snowflake className="size-4" />
          {selected.length
            ? `Freeze ${selected.length} track${selected.length === 1 ? "" : "s"} & package`
            : "Mark as collab-safe"}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "default";
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-bg-subtle/40 px-3 py-3">
      <div className="text-[11px] uppercase tracking-wide text-fg-subtle">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-medium tabular-nums",
          tone === "ok" && "text-ok",
          tone === "warn" && "text-warn",
          tone === "default" && "text-fg",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ActionBadge({
  action,
}: {
  action: "freeze" | "already-frozen" | "skip-native" | "export-stem";
}) {
  if (action === "freeze") return <Badge variant="warn">Freeze</Badge>;
  if (action === "export-stem") return <Badge variant="warn">Export stem</Badge>;
  if (action === "already-frozen") return <Badge variant="ok">Done</Badge>;
  return <Badge variant="default">Native OK</Badge>;
}
