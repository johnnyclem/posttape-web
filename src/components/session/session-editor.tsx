import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pause,
  Play,
  Plus,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { SpliceBrowser, SpliceStatusChip } from "@/components/session/splice-browser";
import { Waveform } from "@/components/waveform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSessionEngine, type EngineSnapshot } from "@/lib/audio/engine";
import { ensureSongSession } from "@/lib/session";
import { usePosttape } from "@/lib/store";
import type { SessionClip, Song, SpliceSample } from "@/lib/types";
import { cn } from "@/lib/utils";

const PX_PER_BEAT = 14;
const HEADER_W = 148;
const TOTAL_BARS = 32;
const TOTAL_BEATS = TOTAL_BARS * 4;

export function SessionEditor({
  song,
  actorId,
}: {
  song: Song;
  actorId?: string;
}) {
  const ensureSession = usePosttape((s) => s.ensureSession);
  const updateClip = usePosttape((s) => s.updateClip);
  const deleteClip = usePosttape((s) => s.deleteClip);
  const setTrackMix = usePosttape((s) => s.setTrackMix);
  const addTrack = usePosttape((s) => s.addTrack);
  const addSpliceSampleToTrack = usePosttape((s) => s.addSpliceSampleToTrack);

  // Stable selector — return the song ref from the store, not a fresh ensure() object
  const rawSong = usePosttape((s) => s.songs.find((x) => x.id === song.id));
  const liveSong = useMemo(
    () => (rawSong ? ensureSongSession(rawSong) : ensureSongSession(song)),
    [rawSong, song],
  );
  const clips = liveSong.clips;

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    () => liveSong.tracks[0]?.id ?? null,
  );
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [engineSnap, setEngineSnap] = useState<EngineSnapshot>({
    state: "stopped",
    beat: 0,
    bpm: liveSong.bpm,
  });
  const [ready, setReady] = useState(false);

  const engineRef = useRef<ReturnType<typeof getSessionEngine> | null>(null);

  useEffect(() => {
    ensureSession(liveSong.id);
  }, [liveSong.id, ensureSession]);

  useEffect(() => {
    engineRef.current = getSessionEngine();
    setReady(true);
    const unsub = engineRef.current.subscribe(setEngineSnap);
    return () => {
      unsub();
      engineRef.current?.stop();
    };
  }, [liveSong.id]);

  useEffect(() => {
    engineRef.current?.load(clips, liveSong.tracks, liveSong.bpm);
  }, [clips, liveSong.tracks, liveSong.bpm]);

  const playheadPx = engineSnap.beat * PX_PER_BEAT;

  const togglePlay = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engineSnap.state === "playing") {
      engine.pause();
    } else {
      await engine.play(engineSnap.state === "paused" ? undefined : engineSnap.beat);
    }
  }, [engineSnap]);

  const handleAddSample = (sample: SpliceSample) => {
    if (!selectedTrackId) {
      toast.error("Select a track first");
      return;
    }
    const start = Math.floor(engineSnap.beat);
    const clip = addSpliceSampleToTrack(
      liveSong.id,
      selectedTrackId,
      sample.id,
      start,
      actorId,
    );
    if (clip) {
      setSelectedClipId(clip.id);
      toast.success(`Added “${sample.name}”`, {
        description: `Beat ${start} · ${sample.pack}`,
      });
    }
  };

  const clipsByTrack = useMemo(() => {
    const m = new Map<string, SessionClip[]>();
    for (const c of clips) {
      const arr = m.get(c.trackId) ?? [];
      arr.push(c);
      m.set(c.trackId, arr);
    }
    return m;
  }, [clips]);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-bg-elevated px-3 py-2.5">
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant={engineSnap.state === "playing" ? "signal" : "secondary"}
            onClick={togglePlay}
            disabled={!ready}
            aria-label={engineSnap.state === "playing" ? "Pause" : "Play"}
          >
            {engineSnap.state === "playing" ? (
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
          </Button>
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => engineRef.current?.stop()}
            aria-label="Stop"
          >
            <Square className="size-3.5" />
          </Button>
        </div>

        <div className="font-mono text-sm tabular-nums text-fg">
          {formatBeat(engineSnap.beat)}
        </div>
        <div className="text-xs text-fg-subtle tabular-nums">
          {liveSong.bpm} BPM · {liveSong.key} · {TOTAL_BARS} bars
        </div>

        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <SpliceStatusChip />

        {selectedClipId && (
          <Button
            size="sm"
            variant="ghost"
            className="text-danger"
            onClick={() => {
              deleteClip(liveSong.id, selectedClipId);
              setSelectedClipId(null);
            }}
          >
            <Trash2 className="size-3.5" />
            Delete clip
          </Button>
        )}

        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const id = addTrack(liveSong.id);
              if (id) {
                setSelectedTrackId(id);
                toast.success("Track added");
              }
            }}
          >
            <Plus className="size-3.5" />
            Track
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated">
          <div className="border-b border-border px-3 py-2 text-xs text-fg-subtle">
            Multi-track session · drag clips to move · drag right edge to resize ·
            click lane to select track
          </div>

          <div className="overflow-x-auto">
            <div style={{ minWidth: HEADER_W + TOTAL_BEATS * PX_PER_BEAT }}>
              <div className="flex border-b border-border bg-bg-subtle/40">
                <div
                  className="shrink-0 border-r border-border px-2 py-1.5 text-[10px] text-fg-subtle"
                  style={{ width: HEADER_W }}
                >
                  Track
                </div>
                <div
                  className="relative h-7"
                  style={{ width: TOTAL_BEATS * PX_PER_BEAT }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const beat = Math.max(0, x / PX_PER_BEAT);
                    engineRef.current?.seek(beat);
                  }}
                >
                  {Array.from({ length: TOTAL_BARS + 1 }, (_, bar) => (
                    <span
                      key={bar}
                      className="absolute top-1.5 -translate-x-1/2 font-mono text-[9px] text-fg-subtle tabular-nums"
                      style={{ left: bar * 4 * PX_PER_BEAT }}
                    >
                      {bar + 1}
                    </span>
                  ))}
                </div>
              </div>

              {liveSong.tracks.map((track) => {
                const trackClips = clipsByTrack.get(track.id) ?? [];
                const selected = selectedTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    className={cn(
                      "flex border-b border-border/80",
                      selected && "bg-signal/5",
                    )}
                  >
                    <div
                      className="flex shrink-0 flex-col justify-center gap-1 border-r border-border bg-bg-subtle/20 px-2 py-2"
                      style={{ width: HEADER_W }}
                      onClick={() => setSelectedTrackId(track.id)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: track.color }}
                        />
                        <span className="truncate text-xs font-medium">
                          {track.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                            track.muted
                              ? "bg-warn/20 text-warn"
                              : "bg-bg-subtle text-fg-subtle hover:text-fg",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackMix(liveSong.id, track.id, {
                              muted: !track.muted,
                            });
                          }}
                        >
                          {track.muted ? (
                            <VolumeX className="size-3" />
                          ) : (
                            <Volume2 className="size-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                            track.solo
                              ? "bg-ok/20 text-ok"
                              : "bg-bg-subtle text-fg-subtle hover:text-fg",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackMix(liveSong.id, track.id, {
                              solo: !track.solo,
                            });
                          }}
                        >
                          S
                        </button>
                        <Badge
                          variant="default"
                          className="ml-auto capitalize text-[9px]"
                        >
                          {track.kind}
                        </Badge>
                      </div>
                    </div>

                    <div
                      className="relative h-[56px] bg-bg/30"
                      style={{ width: TOTAL_BEATS * PX_PER_BEAT }}
                      onClick={() => setSelectedTrackId(track.id)}
                    >
                      {Array.from({ length: TOTAL_BARS }, (_, bar) => (
                        <div
                          key={bar}
                          className="absolute top-0 bottom-0 border-l border-border/40"
                          style={{ left: bar * 4 * PX_PER_BEAT }}
                        />
                      ))}

                      {trackClips.map((clip) => (
                        <ClipBlock
                          key={clip.id}
                          clip={clip}
                          selected={selectedClipId === clip.id}
                          color={clip.color ?? track.color}
                          onSelect={() => {
                            setSelectedClipId(clip.id);
                            setSelectedTrackId(track.id);
                          }}
                          onMove={(startBeat) =>
                            updateClip(liveSong.id, clip.id, { startBeat })
                          }
                          onResize={(lengthBeats) =>
                            updateClip(liveSong.id, clip.id, { lengthBeats })
                          }
                        />
                      ))}

                      <div
                        className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-accent"
                        style={{ left: playheadPx }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <SpliceBrowser
          selectedTrackId={selectedTrackId}
          onAdd={handleAddSample}
          className="min-h-[420px] xl:min-h-0"
        />
      </div>

      <p className="text-[11px] text-fg-subtle">
        In-browser multi-track player uses procedural voices (and Splice-tagged
        samples) so you can sketch arrangement before opening Ableton. Freeze
        still owns the collaborator-safe handoff for third-party plugs.
      </p>
    </div>
  );
}

function ClipBlock({
  clip,
  selected,
  color,
  onSelect,
  onMove,
  onResize,
}: {
  clip: SessionClip;
  selected: boolean;
  color: string;
  onSelect: () => void;
  onMove: (startBeat: number) => void;
  onResize: (lengthBeats: number) => void;
}) {
  const drag = useRef<{
    mode: "move" | "resize";
    startX: number;
    origStart: number;
    origLen: number;
  } | null>(null);

  useEffect(() => {
    const onMoveWin = (e: PointerEvent) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.startX;
      const dBeats = dx / PX_PER_BEAT;
      if (drag.current.mode === "move") {
        onMove(Math.max(0, Math.round((drag.current.origStart + dBeats) * 4) / 4));
      } else {
        onResize(
          Math.max(0.25, Math.round((drag.current.origLen + dBeats) * 4) / 4),
        );
      }
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", onMoveWin);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMoveWin);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onMove, onResize]);

  return (
    <div
      className={cn(
        "absolute top-1.5 bottom-1.5 overflow-hidden rounded-[var(--radius-xs)] border",
        selected ? "border-accent z-10 ring-1 ring-accent/40" : "border-black/25",
        clip.source === "splice" && "ring-1 ring-signal/30",
      )}
      style={{
        left: clip.startBeat * PX_PER_BEAT,
        width: Math.max(clip.lengthBeats * PX_PER_BEAT, 8),
        background: `linear-gradient(180deg, ${color}dd, ${color}99)`,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        drag.current = {
          mode: "move",
          startX: e.clientX,
          origStart: clip.startBeat,
          origLen: clip.lengthBeats,
        };
      }}
    >
      <Waveform
        seed={clip.spliceAssetId ?? clip.id}
        color="rgba(255,255,255,0.7)"
        kind={clip.voice === "bass" || clip.voice === "lead" ? "midi" : "audio"}
        samples={Math.max(16, Math.floor(clip.lengthBeats * 4))}
        height={36}
        mirror
        className="pointer-events-none opacity-90"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 truncate px-1 text-[9px] font-medium text-white/90 drop-shadow">
        {clip.source === "splice" ? "Sp · " : ""}
        {clip.name}
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/10 hover:bg-white/25"
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
          drag.current = {
            mode: "resize",
            startX: e.clientX,
            origStart: clip.startBeat,
            origLen: clip.lengthBeats,
          };
        }}
      />
    </div>
  );
}

function formatBeat(beat: number): string {
  const b = Math.max(0, beat);
  const bar = Math.floor(b / 4) + 1;
  const beatInBar = Math.floor(b % 4) + 1;
  const tick = Math.floor((b % 1) * 100)
    .toString()
    .padStart(2, "0");
  return `${String(bar).padStart(3, "0")}:${beatInBar}.${tick}`;
}
