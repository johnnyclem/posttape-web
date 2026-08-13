import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  Loader2,
  Snowflake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Waveform } from "@/components/waveform";
import { buildFreezePlan, verifyFreeze } from "@/lib/ableton";
import { GENERIC_LIVE_ID, listTargetEnvironments } from "@/lib/environment";
import { usePosttape } from "@/lib/store";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";

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
  const getEnvironment = usePosttape((s) => s.getEnvironment);
  const getArtist = usePosttape((s) => s.getArtist);
  const environments = usePosttape((s) => s.environments);
  const viewer = useCurrentUser();

  const targets = useMemo(
    () => listTargetEnvironments(song, environments, viewer?.id ?? null),
    [song, environments, viewer?.id],
  );

  const defaultTarget =
    targets.find((t) => t.userId === "u-taylor") ??
    targets.find((t) => t.userId !== GENERIC_LIVE_ID) ??
    targets[0]!;
  const [targetId, setTargetId] = useState(defaultTarget.userId);
  const target = getEnvironment(targetId);
  const plan = useMemo(() => buildFreezePlan(song, target), [song, target]);
  const actionable = plan.items.filter(
    (i) => i.action === "freeze" || i.action === "export-stem",
  );
  const [selected, setSelected] = useState<string[]>(() =>
    plan.items.filter((i) => i.defaultSelected).map((i) => i.trackId),
  );
  const [phase, setPhase] = useState<"plan" | "checklist" | "recording" | "done">(
    "plan",
  );
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [verified, setVerified] = useState<{ passed: boolean; remaining: string[] } | null>(
    null,
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function recordPackage() {
    setPhase("recording");
    setProgress(0);
    const steps = [
      "Writing freeze checklist…",
      "Recording selected tracks on a new take…",
      "Attaching freeze-file stubs…",
      "Re-analyzing against the target Environment…",
    ];
    for (let i = 0; i < steps.length; i++) {
      setStepLabel(steps[i]);
      setProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise((r) => setTimeout(r, 280));
    }
    runFreeze(song.id, selected, authorId, target.userId);
    const next = usePosttape.getState().getSongById(song.id);
    if (next) setVerified(verifyFreeze(next, target));
    setPhase("done");
  }

  if (phase === "done") {
    return (
      <div className="rounded-[var(--radius-xl)] border border-ok/30 bg-ok/5 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-ok" strokeWidth={1.5} />
        <h3 className="mt-3 font-display text-xl text-fg">
          {verified?.passed ? "Package verified" : "Package recorded — check remaining"}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
          A new take holds the freeze package. This prototype does not drive
          Ableton Live — a desktop Agent would. Verification re-ran the plan
          against {target.name}.
        </p>
        {verified && !verified.passed && (
          <p className="mx-auto mt-3 max-w-md text-sm text-warn">
            Still live for this machine: {verified.remaining.join(" · ")}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={onDone}>
            <Download className="size-4" />
            Back to song
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-6">
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Loader2 className="size-4 animate-spin text-signal" />
          Recording freeze package
        </div>
        <p className="mt-3 font-medium text-fg">{stepLabel}</p>
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

  if (phase === "checklist") {
    const rows = plan.items.filter((i) => selected.includes(i.trackId));
    return (
      <div className="space-y-5">
        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-bg-subtle text-signal">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl tracking-tight">
                Guided checklist
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                In production the Agent walks this list in Live. Here we record
                the same package onto a new take so the collaborator view
                updates.
              </p>
            </div>
          </div>
        </div>
        <ol className="space-y-2">
          {rows.map((item, i) => (
            <li
              key={item.trackId}
              className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated px-4 py-3"
            >
              <div className="text-[11px] font-mono text-tape">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-1 text-sm font-medium">{item.trackName}</div>
              <p className="mt-1 text-xs text-fg-muted">{item.reason}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button onClick={recordPackage} disabled={rows.length === 0}>
            <Snowflake className="size-4" />
            Record package on a new take
          </Button>
          <Button variant="secondary" onClick={() => setPhase("plan")}>
            Back to plan
          </Button>
        </div>
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
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl tracking-tight">
              Prepare for collaborator
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Plan is Take × Environment. Stock-only tracks stay live. Returns
              and master are flagged, not selected.
            </p>
            <label className="mt-4 block text-xs font-medium text-fg-subtle">
              Target machine
              <select
                className="mt-1 flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm text-fg"
                value={targetId}
                onChange={(e) => {
                  const next = e.target.value;
                  setTargetId(next);
                  const env = getEnvironment(next);
                  const nextPlan = buildFreezePlan(song, env);
                  setSelected(
                    nextPlan.items.filter((i) => i.defaultSelected).map((i) => i.trackId),
                  );
                }}
              >
                {targets.map((t) => {
                  const artist = getArtist(t.userId);
                  return (
                    <option key={t.userId} value={t.userId}>
                      {t.name}
                      {artist ? ` (@${artist.username})` : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat
            label="Tracks to freeze"
            value={String(actionable.length)}
            tone={actionable.length ? "warn" : "ok"}
          />
          <Stat
            label="Est. size / time"
            value={`~${plan.estimatedMb} MB · ${Math.round(plan.estimatedSeconds / 60)}m`}
            tone="default"
          />
          <Stat
            label={`Opens for ${target.name.split("·")[0]?.trim()}`}
            value={plan.collaboratorSafe ? "Clean" : "Needs freeze"}
            tone={plan.collaboratorSafe ? "ok" : "warn"}
          />
        </div>
      </div>

      {plan.warnings.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-warn/30 bg-warn/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-warn">
            <AlertTriangle className="size-4" />
            Routing that freeze will change
          </div>
          <ul className="mt-2 space-y-1 text-xs text-fg-muted">
            {plan.warnings.map((w) => (
              <li key={`${w.kind}-${w.trackId}`}>
                <span className="font-medium text-fg">{w.trackName}</span>
                {" — "}
                {w.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Freeze plan</h3>
          <Badge variant="signal">Take × Environment</Badge>
        </div>
        <ul className="divide-y divide-border">
          {plan.items.map((item) => {
            const canSelect =
              item.action === "freeze" ||
              item.action === "export-stem" ||
              item.action === "flagged-separately";
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
                    disabled={item.action === "already-frozen" || item.action === "skip-native"}
                    checked={
                      item.action === "already-frozen" ? true : canSelect ? checked : false
                    }
                    onChange={() => canSelect && toggle(item.trackId)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {track && (
                        <span
                          className="size-2 rounded-full"
                          style={{ background: track.color }}
                          aria-hidden
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

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setPhase("checklist")}
          disabled={actionable.length > 0 && selected.length === 0}
        >
          <ClipboardList className="size-4" />
          {selected.length
            ? `Review checklist (${selected.length})`
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
      <div className="text-[11px] uppercase tracking-wide text-fg-subtle">{label}</div>
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
  action: FreezePlanItemAction;
}) {
  if (action === "freeze") return <Badge variant="warn">Freeze</Badge>;
  if (action === "export-stem") return <Badge variant="warn">Export stem</Badge>;
  if (action === "already-frozen") return <Badge variant="ok">Done</Badge>;
  if (action === "flagged-separately") return <Badge variant="signal">Flagged</Badge>;
  return <Badge variant="default">Leave live</Badge>;
}

type FreezePlanItemAction =
  | "freeze"
  | "already-frozen"
  | "skip-native"
  | "export-stem"
  | "flagged-separately";
