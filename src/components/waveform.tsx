import { useMemo } from "react";
import {
  barsForSong,
  clipLayout,
  freezeTint,
  generateWaveform,
  r3,
} from "@/lib/waveform";
import type { ProjectTrack, Song } from "@/lib/types";
import { cn } from "@/lib/utils";

type WaveformProps = {
  seed: string;
  color?: string;
  kind?: ProjectTrack["kind"];
  samples?: number;
  height?: number;
  className?: string;
  dimmed?: boolean;
  mirror?: boolean;
  playhead?: number;
};

export function Waveform({
  seed,
  color = "var(--color-signal)",
  kind = "audio",
  samples = 64,
  height = 40,
  className,
  dimmed = false,
  mirror = true,
  playhead,
}: WaveformProps) {
  const peaks = useMemo(
    () => generateWaveform(seed, samples, kind),
    [seed, samples, kind],
  );

  const mid = height / 2;
  const barW = 100 / samples;
  const gap = 0.15;

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={cn("block w-full", className)}
      style={{ height }}
      aria-hidden
    >
      {mirror && (
        <line
          x1={0}
          y1={r3(mid)}
          x2={100}
          y2={r3(mid)}
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={0.4}
        />
      )}
      {peaks.map((p, i) => {
        const h = r3(mirror ? p * (height * 0.42) : p * (height * 0.85));
        const x = r3(i * barW + gap);
        const w = r3(Math.max(0.2, barW - gap * 2));
        const y = r3(mirror ? mid - h : height - h - 1);
        const opacity = r3(dimmed ? 0.35 : 0.55 + p * 0.4);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height={mirror ? r3(h * 2) : h}
            rx={0.15}
            fill={color}
            opacity={opacity}
          />
        );
      })}
      {playhead != null && (
        <line
          x1={r3(playhead * 100)}
          y1={0}
          x2={r3(playhead * 100)}
          y2={height}
          stroke="var(--color-accent)"
          strokeWidth={0.5}
          strokeOpacity={0.7}
        />
      )}
    </svg>
  );
}

export function MiniArrangement({
  song,
  className,
  lanes = 5,
}: {
  song: Song;
  className?: string;
  lanes?: number;
}) {
  const tracks = song.tracks.slice(0, lanes);
  const totalBars = 16;

  return (
    <div
      className={cn(
        "flex flex-col justify-center gap-[3px] px-3 py-2",
        className,
      )}
      aria-hidden
    >
      {tracks.map((t, i) => {
        const { start, length } = clipLayout(t, i, totalBars);
        const left = r3((start / totalBars) * 100);
        const width = r3((length / totalBars) * 100);
        const tint = freezeTint(t.freezeStatus);
        return (
          <div key={t.id} className="relative h-[9px] w-full">
            <div className="absolute inset-0 rounded-[1px] bg-black/25" />
            <div
              className="absolute top-0 h-full overflow-hidden rounded-[1px]"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: t.color,
                opacity: tint.opacity,
              }}
            >
              <Waveform
                seed={t.id}
                color="rgba(255,255,255,0.55)"
                kind={t.kind}
                samples={24}
                height={9}
                mirror={false}
                className="opacity-90"
              />
            </div>
          </div>
        );
      })}
      {tracks.length === 0 && (
        <div className="h-8 rounded-sm bg-black/20" />
      )}
    </div>
  );
}

export function ArrangementView({
  song,
  className,
}: {
  song: Song;
  className?: string;
}) {
  const totalBars = barsForSong(song.tracks);
  const barMarks = useMemo(() => {
    const marks: number[] = [];
    for (let b = 0; b <= totalBars; b += 4) marks.push(b);
    return marks;
  }, [totalBars]);

  const playheadPct = 0.28;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-medium">Arrangement</h3>
          <p className="text-xs text-fg-subtle">
            {song.tracks.length} tracks · {totalBars} bars · {song.bpm} BPM ·{" "}
            {song.key}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-fg-subtle">
          <LegendDot color="var(--color-warn)" label="Live" />
          <LegendDot color="var(--color-signal)" label="Frozen" />
          <LegendDot color="var(--color-ok)" label="Stem" />
        </div>
      </div>

      <div className="relative border-b border-border bg-bg-subtle/40">
        <div className="flex pl-[7.5rem] pr-2">
          <div className="relative h-6 w-full font-mono text-[9px] text-fg-subtle">
            {barMarks.map((b) => (
              <span
                key={b}
                className="absolute top-1.5 -translate-x-1/2 tabular-nums"
                style={{ left: `${r3((b / totalBars) * 100)}%` }}
              >
                {b + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="pointer-events-none absolute inset-0 pl-[7.5rem] pr-2">
          <div className="relative h-full w-full min-w-[320px]">
            {barMarks.map((b) => (
              <div
                key={b}
                className="absolute top-0 bottom-0 w-px bg-border/60"
                style={{ left: `${r3((b / totalBars) * 100)}%` }}
              />
            ))}
            <div
              className="absolute top-0 bottom-0 w-px bg-accent/70"
              style={{ left: `${r3(playheadPct * 100)}%` }}
            >
              <div className="absolute -top-0 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-accent" />
            </div>
          </div>
        </div>

        <ul className="divide-y divide-border/80 min-w-[320px]">
          {song.tracks.map((track, index) => (
            <ArrangementLane
              key={track.id}
              track={track}
              index={index}
              totalBars={totalBars}
            />
          ))}
        </ul>
      </div>

      <div className="border-t border-border px-4 py-2 text-[11px] text-fg-subtle">
        Waveforms are session fingerprints (deterministic from track id) — not
        audio previews. Frozen lanes render dimmer so you can see what ships
        collab-safe.
      </div>
    </div>
  );
}

function ArrangementLane({
  track,
  index,
  totalBars,
}: {
  track: ProjectTrack;
  index: number;
  totalBars: number;
}) {
  const { start, length } = clipLayout(track, index, totalBars);
  const tint = freezeTint(track.freezeStatus);
  const left = r3((start / totalBars) * 100);
  const width = r3((length / totalBars) * 100);
  const isFrozen =
    track.freezeStatus === "frozen" || track.freezeStatus === "stem";

  return (
    <li className="flex min-h-[52px] items-stretch">
      <div className="flex w-[7.5rem] shrink-0 items-center gap-2 border-r border-border bg-bg-subtle/30 px-2.5">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: track.color }}
        />
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">{track.name}</div>
          <div className="truncate text-[10px] capitalize text-fg-subtle">
            {track.kind}
            {isFrozen ? " · frozen" : " · live"}
          </div>
        </div>
      </div>

      <div className="relative min-w-0 flex-1 px-2 py-2">
        <div className="relative h-full min-h-[36px] w-full rounded-[var(--radius-xs)] bg-bg/40">
          <div
            className={cn(
              "absolute top-0.5 bottom-0.5 overflow-hidden rounded-[var(--radius-xs)] border",
              tint.dashed ? "border-dashed border-warn/40" : "border-black/20",
            )}
            style={{
              left: `${left}%`,
              width: `${Math.max(width, 6)}%`,
              background: `linear-gradient(180deg, ${track.color}cc, ${track.color}88)`,
              opacity: tint.opacity,
              boxShadow: isFrozen
                ? "inset 0 0 0 1px color-mix(in oklab, var(--color-signal) 35%, transparent)"
                : undefined,
            }}
          >
            <Waveform
              seed={track.id}
              color="rgba(255,255,255,0.75)"
              kind={track.kind}
              samples={Math.max(32, length * 3)}
              height={34}
              mirror
              dimmed={isFrozen}
              className="px-0.5"
            />
            {track.freezeStatus === "live" &&
              track.plugins.some((p) => p.status !== "frozen-away") && (
                <span className="absolute right-1 top-0.5 rounded-[2px] bg-black/40 px-1 text-[8px] font-medium uppercase tracking-wide text-warn">
                  live
                </span>
              )}
            {isFrozen && (
              <span className="absolute right-1 top-0.5 rounded-[2px] bg-black/40 px-1 text-[8px] font-medium uppercase tracking-wide text-signal">
                {track.freezeStatus === "stem" ? "stem" : "frz"}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function TrackWaveRow({
  track,
  className,
}: {
  track: ProjectTrack;
  className?: string;
}) {
  const isFrozen =
    track.freezeStatus === "frozen" || track.freezeStatus === "stem";
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-sm)] border border-border/80 bg-bg/50",
        className,
      )}
    >
      <Waveform
        seed={track.id}
        color={track.color}
        kind={track.kind}
        samples={80}
        height={36}
        mirror
        dimmed={isFrozen}
        playhead={isFrozen ? undefined : 0.22}
      />
    </div>
  );
}
