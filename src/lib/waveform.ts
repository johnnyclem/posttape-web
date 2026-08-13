import type { FreezeStatus, ProjectTrack, TrackKind } from "./types";

/** FNV-1a style hash → stable seed for SSR-safe waveforms */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Round for stable SSR/client SVG attributes */
export function r3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Generate normalized peak samples (0–1) for a track.
 * Shape varies by kind so drums feel transient, pads smooth, MIDI stepped.
 */
export function generateWaveform(
  seed: string,
  samples = 64,
  kind: TrackKind = "audio",
): number[] {
  const rand = mulberry32(hashSeed(seed));
  const out: number[] = [];

  for (let i = 0; i < samples; i++) {
    const t = i / Math.max(1, samples - 1);
    let base: number;

    if (kind === "midi") {
      const step = Math.floor(t * 12) / 12;
      const gate = (Math.sin(step * Math.PI * 8 + rand() * 2) + 1) / 2;
      base = 0.25 + gate * 0.55 * (0.5 + rand() * 0.5);
      if (rand() > 0.72) base *= 0.15;
    } else if (kind === "group" || kind === "master") {
      base = 0.35 + Math.sin(t * Math.PI * 3) * 0.2 + rand() * 0.25;
    } else {
      const env = Math.sin(t * Math.PI) ** 0.6;
      const noise = rand();
      const beat = Math.abs(Math.sin(t * Math.PI * 16));
      base = env * (0.2 + noise * 0.55 + beat * 0.25);
    }

    if (i > 0) base = out[i - 1]! * 0.35 + base * 0.65;
    out.push(r3(Math.min(1, Math.max(0.04, base))));
  }

  return out;
}

/** Clip placement on arrangement: start bar, length in bars */
export function clipLayout(
  track: ProjectTrack,
  index: number,
  totalBars = 32,
): { start: number; length: number } {
  const rand = mulberry32(hashSeed(track.id + ":clip"));
  const bars = track.durationBars ?? 16 + Math.floor(rand() * 16);
  const length = Math.min(totalBars, Math.max(4, Math.round(bars / 3)));
  const start = Math.min(
    totalBars - length,
    Math.floor((index * 2 + rand() * 4) % Math.max(1, totalBars - length)),
  );
  return { start, length };
}

export function freezeTint(status: FreezeStatus): {
  opacity: number;
  dashed: boolean;
} {
  if (status === "frozen" || status === "stem") return { opacity: 0.55, dashed: false };
  if (status === "missing-plugin") return { opacity: 0.35, dashed: true };
  return { opacity: 0.9, dashed: false };
}

export function barsForSong(tracks: ProjectTrack[]): number {
  const max = tracks.reduce((m, t) => Math.max(m, t.durationBars ?? 16), 16);
  return Math.max(16, Math.min(64, Math.ceil(max / 8) * 8));
}
