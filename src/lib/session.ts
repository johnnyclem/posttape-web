import { voiceForTrackName } from "@/lib/splice/catalog";
import type { ProjectTrack, SessionClip, Song } from "@/lib/types";
import { clipLayout } from "@/lib/waveform";

function shortId() {
  return Math.random().toString(36).slice(2, 9);
}

/** Build initial editable clips from track metadata / arrangement layout */
export function buildDefaultClips(tracks: ProjectTrack[], totalBars = 32): SessionClip[] {
  return tracks.map((t, i) => {
    const { start, length } = clipLayout(t, i, totalBars);
    const voice = voiceForTrackName(t.name);
    return {
      id: `clip-${t.id}`,
      trackId: t.id,
      name: t.name,
      startBeat: start * 4,
      lengthBeats: Math.max(4, length * 4),
      gain: 0.85,
      source: t.freezeStatus === "stem" || t.freezeStatus === "frozen" ? "session" : "synth",
      voice,
      color: t.color,
    } satisfies SessionClip;
  });
}

export function ensureSongSession(song: Song): Song & { clips: SessionClip[] } {
  const tracks = song.tracks.map((t) => ({
    ...t,
    muted: t.muted ?? false,
    solo: t.solo ?? false,
    volume: t.volume ?? 0.85,
  }));
  const clips =
    song.clips && song.clips.length > 0
      ? song.clips
      : buildDefaultClips(tracks, 32);
  return { ...song, tracks, clips };
}

export function newClipId() {
  return `clip-${shortId()}`;
}

export function newTrackId() {
  return `t-${shortId()}`;
}
