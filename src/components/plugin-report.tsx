import { AlertTriangle, Check, Package, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrackWaveRow } from "@/components/waveform";
import { pluginCompatibility } from "@/lib/ableton";
import { getPlugin } from "@/lib/plugins";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PluginReport({
  song,
  installedIds,
  title = "Plugin compatibility",
}: {
  song: Song;
  installedIds: string[];
  title?: string;
}) {
  const rows = pluginCompatibility(song, installedIds);
  const missing = rows.filter((r) => r.status === "missing").length;
  const frozen = rows.filter((r) => r.status === "frozen").length;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-tape" />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {missing > 0 ? (
            <Badge variant="warn">{missing} missing on open</Badge>
          ) : (
            <Badge variant="ok">Safe to open</Badge>
          )}
          {frozen > 0 && <Badge variant="signal">{frozen} frozen away</Badge>}
        </div>
      </div>
      <ul className="divide-y divide-border">
        {rows.map(({ plugin, status }) => (
          <li
            key={plugin.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-fg">{plugin.name}</div>
              <div className="truncate text-xs text-fg-subtle">
                {plugin.vendor} · {plugin.format}
                {plugin.version ? ` · v${plugin.version}` : ""} · {plugin.category}
              </div>
            </div>
            <StatusChip status={status} />
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-fg-subtle">
            No devices detected yet.
          </li>
        )}
      </ul>
    </div>
  );
}

function StatusChip({ status }: { status: "installed" | "missing" | "frozen" }) {
  if (status === "installed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ok">
        <Check className="size-3.5" />
        Installed
      </span>
    );
  }
  if (status === "frozen") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-signal">
        <Snowflake className="size-3.5" />
        Frozen
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-warn">
      <AlertTriangle className="size-3.5" />
      Missing
    </span>
  );
}

export function TrackList({ song }: { song: Song }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated overflow-hidden">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Tracks</h3>
        <span className="text-[11px] text-fg-subtle tabular-nums">
          {song.tracks.length} lanes
        </span>
      </div>
      <ul className="divide-y divide-border">
        {song.tracks.map((t) => (
          <li key={t.id} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <span
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{ background: t.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{t.name}</span>
                  <Badge variant="default" className="capitalize">
                    {t.kind}
                  </Badge>
                  <FreezeBadge status={t.freezeStatus} />
                  {t.durationBars != null && (
                    <span className="text-[11px] tabular-nums text-fg-subtle">
                      {t.durationBars} bars
                    </span>
                  )}
                </div>
                <TrackWaveRow track={t} className="mt-2" />
                {t.plugins.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.plugins.map((p) => {
                      const plug = getPlugin(p.pluginId);
                      return (
                        <span
                          key={`${t.id}-${p.slot}`}
                          className={cn(
                            "rounded-[var(--radius-xs)] border px-1.5 py-0.5 text-[11px]",
                            p.status === "missing" || p.status === "version-mismatch"
                              ? "border-warn/30 text-warn"
                              : p.status === "frozen-away"
                                ? "border-signal/30 text-signal"
                                : "border-border text-fg-subtle",
                          )}
                        >
                          {plug?.name ?? p.pluginId}
                        </span>
                      );
                    })}
                  </div>
                )}
                {t.notes && (
                  <p className="mt-1.5 text-xs text-fg-subtle">{t.notes}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FreezeBadge({ status }: { status: string }) {
  if (status === "frozen") return <Badge variant="signal">Frozen</Badge>;
  if (status === "stem") return <Badge variant="ok">Stem</Badge>;
  if (status === "missing-plugin") return <Badge variant="danger">Missing plug</Badge>;
  return <Badge variant="warn">Live</Badge>;
}

export function FileTree({ song }: { song: Song }) {
  const sorted = [...song.files].sort((a, b) => a.path.localeCompare(b.path));
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Project files</h3>
      </div>
      <ul className="divide-y divide-border font-mono text-xs">
        {sorted.map((f) => (
          <li
            key={f.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-fg-muted"
          >
            <span className="truncate text-fg">{f.path}</span>
            <span className="shrink-0 tabular-nums text-fg-subtle">
              {(f.sizeBytes / 1_000_000).toFixed(1)} MB · {f.kind}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
