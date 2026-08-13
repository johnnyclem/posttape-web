import { AlertTriangle, Check, Package, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrackWaveRow } from "@/components/waveform";
import { pluginCompatibility } from "@/lib/ableton";
import { getPlugin, licenseWarning } from "@/lib/plugins";
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
        {rows.map(({ plugin, status }) => {
          const warn = licenseWarning(plugin.id);
          const tracks = song.tracks
            .filter((t) => t.plugins.some((p) => p.pluginId === plugin.id))
            .map((t) => t.name);
          return (
            <li
              key={plugin.id}
              className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-fg">{plugin.name}</span>
                  <Badge variant="default" className="capitalize">
                    {plugin.deviceClass.replace("-", " ")}
                  </Badge>
                  {plugin.licenseClass === "dongle" && (
                    <Badge variant="warn">Dongle</Badge>
                  )}
                  {plugin.licenseClass === "subscription" && (
                    <Badge variant="signal">Subscription</Badge>
                  )}
                </div>
                <div className="truncate text-xs text-fg-subtle">
                  {plugin.vendor} · {plugin.format}
                  {plugin.version ? ` · v${plugin.version}` : ""} ·{" "}
                  <span className="font-mono">{plugin.identityKey}</span>
                </div>
                {tracks.length > 0 && (
                  <div className="mt-1 text-[11px] text-fg-subtle">
                    {tracks.join(" · ")}
                  </div>
                )}
                {warn && (
                  <div className="mt-1 text-[11px] text-warn">{warn}</div>
                )}
              </div>
              <StatusChip status={status} />
            </li>
          );
        })}
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
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated">
      <ul className="divide-y divide-border">
        {song.tracks.map((track) => (
          <li key={track.id} className="px-3 py-2">
            <TrackWaveRow track={track} />
            <div className="mt-1 flex flex-wrap gap-1 px-1">
              {track.plugins.map((p) => {
                const plug = getPlugin(p.pluginId);
                return (
                  <Badge
                    key={`${track.id}-${p.slot}`}
                    variant={
                      p.status === "frozen-away"
                        ? "signal"
                        : p.status === "missing"
                          ? "warn"
                          : "default"
                    }
                    className={cn("text-[10px]")}
                  >
                    {plug?.name ?? p.pluginId}
                  </Badge>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FileTree({ song }: { song: Song }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated">
      <ul className="divide-y divide-border font-mono text-xs">
        {song.files.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2">
            <span className="truncate text-fg">{f.path}</span>
            <span className="shrink-0 text-fg-subtle">
              {(f.sizeBytes / 1_000_000).toFixed(1)} MB
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
