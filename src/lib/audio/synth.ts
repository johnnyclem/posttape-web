import type { SampleVoice } from "@/lib/types";

/**
 * Procedural sample buffers for the multi-track player.
 * Lets the NLE play without shipping binary audio assets.
 */

const bufferCache = new Map<string, AudioBuffer>();

export async function getVoiceBuffer(
  ctx: AudioContext,
  voice: SampleVoice,
  seed: string = voice,
): Promise<AudioBuffer> {
  const key = `${ctx.sampleRate}:${voice}:${seed}`;
  const hit = bufferCache.get(key);
  if (hit) return hit;
  const buf = renderVoice(ctx, voice, seed);
  bufferCache.set(key, buf);
  return buf;
}

function renderVoice(
  ctx: AudioContext,
  voice: SampleVoice,
  seed: string,
): AudioBuffer {
  const sr = ctx.sampleRate;
  const dur = durationFor(voice);
  const n = Math.ceil(sr * dur);
  const buf = ctx.createBuffer(2, n, sr);
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  const rnd = mulberry(hash(seed));

  switch (voice) {
    case "kick":
      writeKick(L, R, sr, rnd);
      break;
    case "snare":
      writeSnare(L, R, sr, rnd);
      break;
    case "hat":
      writeHat(L, R, sr, rnd);
      break;
    case "perc":
      writePerc(L, R, sr, rnd);
      break;
    case "bass":
      writeBass(L, R, sr, rnd);
      break;
    case "lead":
      writeLead(L, R, sr, rnd);
      break;
    case "pad":
      writePad(L, R, sr, rnd);
      break;
    case "vox":
      writeVox(L, R, sr, rnd);
      break;
    case "noise":
      writeNoise(L, R, sr, rnd);
      break;
    case "chord":
      writeChord(L, R, sr, rnd);
      break;
    case "loop":
    default:
      writeLoop(L, R, sr, rnd);
      break;
  }
  return buf;
}

function durationFor(voice: SampleVoice): number {
  switch (voice) {
    case "kick":
    case "snare":
      return 0.45;
    case "hat":
      return 0.18;
    case "perc":
      return 0.25;
    case "bass":
      return 1.2;
    case "lead":
      return 1.0;
    case "pad":
      return 2.8;
    case "vox":
      return 1.1;
    case "noise":
      return 2.0;
    case "chord":
      return 1.6;
    case "loop":
      return 2.0;
  }
}

function writeKick(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  const n = L.length;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 9);
    const pitch = 120 * Math.exp(-t * 28) + 42;
    const click = Math.exp(-t * 80) * (rnd() * 2 - 1) * 0.35;
    const body = Math.sin(2 * Math.PI * pitch * t) * env;
    const s = (body + click) * 0.9;
    L[i] = s;
    R[i] = s * 0.98;
  }
}

function writeSnare(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 14);
    const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 18) * 0.4;
    const noise = (rnd() * 2 - 1) * env * 0.7;
    const s = tone + noise;
    L[i] = s;
    R[i] = s * (0.95 + rnd() * 0.05);
  }
}

function writeHat(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 45);
    const n = (rnd() * 2 - 1) * env;
    const hp = n - (L[i - 1] ?? 0) * 0.6;
    L[i] = hp * 0.55;
    R[i] = hp * 0.5;
  }
}

function writePerc(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 22);
    const s =
      Math.sin(2 * Math.PI * (680 + rnd() * 40) * t) * env * 0.5 +
      (rnd() * 2 - 1) * env * 0.15;
    L[i] = s;
    R[i] = s * 0.9;
  }
}

function writeBass(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  const f0 = 55 + rnd() * 8;
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const env = Math.min(1, t * 40) * Math.exp(-t * 1.4);
    const s =
      Math.sin(2 * Math.PI * f0 * t) * 0.7 +
      Math.sin(2 * Math.PI * f0 * 2 * t) * 0.2;
    L[i] = s * env * 0.7;
    R[i] = s * env * 0.68;
  }
}

function writeLead(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  const f0 = 440 * Math.pow(2, (rnd() * 7 - 3) / 12);
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const env = Math.min(1, t * 30) * Math.exp(-t * 2.2);
    const s =
      Math.sin(2 * Math.PI * f0 * t) * 0.5 +
      Math.sin(2 * Math.PI * f0 * 2.01 * t) * 0.25 +
      Math.sin(2 * Math.PI * f0 * 3 * t) * 0.1;
    L[i] = s * env * 0.55;
    R[i] = s * env * 0.5;
  }
}

function writePad(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  const f0 = 220;
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const env = Math.min(1, t * 1.5) * Math.exp(-t * 0.35);
    const s =
      Math.sin(2 * Math.PI * f0 * t) * 0.3 +
      Math.sin(2 * Math.PI * f0 * 1.5 * t) * 0.25 +
      Math.sin(2 * Math.PI * f0 * 2 * t + 0.3) * 0.2 +
      (rnd() * 2 - 1) * 0.02;
    L[i] = s * env * 0.45;
    R[i] = s * env * 0.42 * Math.sin(t * 0.7 + 1);
  }
}

function writeVox(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  const f0 = 220 + rnd() * 40;
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const env = Math.min(1, t * 12) * Math.exp(-t * 1.6);
    const form =
      Math.sin(2 * Math.PI * f0 * t) * 0.4 +
      Math.sin(2 * Math.PI * f0 * 2.1 * t) * 0.2 +
      Math.sin(2 * Math.PI * 800 * t) * 0.08 * env;
    const breath = (rnd() * 2 - 1) * 0.04 * env;
    L[i] = (form + breath) * env * 0.6;
    R[i] = (form + breath) * env * 0.55;
  }
}

function writeNoise(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const env = 0.15 + 0.05 * Math.sin(t * 3);
    const s = (rnd() * 2 - 1) * env * 0.25;
    L[i] = s;
    R[i] = (rnd() * 2 - 1) * env * 0.22;
  }
}

function writeChord(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  const root = 146.83;
  const ratios = [1, 5 / 4, 3 / 2, 15 / 8];
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const env = Math.min(1, t * 8) * Math.exp(-t * 1.1);
    let s = 0;
    for (const r of ratios) {
      s += Math.sin(2 * Math.PI * root * r * t) * 0.2;
    }
    s += (rnd() * 2 - 1) * 0.01;
    L[i] = s * env * 0.55;
    R[i] = s * env * 0.5;
  }
}

function writeLoop(
  L: Float32Array,
  R: Float32Array,
  sr: number,
  rnd: () => number,
) {
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const beat = (t * 4) % 1;
    let s = 0;
    if (beat < 0.05) {
      const k = beat / 0.05;
      s += Math.sin(2 * Math.PI * (90 - k * 40) * t) * Math.exp(-beat * 40) * 0.7;
    }
    if (beat > 0.48 && beat < 0.58) {
      s += (rnd() * 2 - 1) * Math.exp(-(beat - 0.48) * 30) * 0.5;
    }
    if (beat % 0.25 < 0.02) {
      s += (rnd() * 2 - 1) * 0.2 * Math.exp(-(beat % 0.25) * 80);
    }
    L[i] = s * 0.6;
    R[i] = s * 0.55;
  }
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One-shot preview of a voice (for Splice browser) */
export async function previewVoice(
  voice: SampleVoice,
  seed?: string,
): Promise<void> {
  if (typeof window === "undefined") return;
  const ctx = getSharedContext();
  if (ctx.state === "suspended") await ctx.resume();
  const buf = await getVoiceBuffer(ctx, voice, seed ?? voice);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = 0.7;
  src.connect(g);
  g.connect(ctx.destination);
  src.start();
}

let sharedCtx: AudioContext | null = null;

export function getSharedContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("AudioContext is browser-only");
  }
  if (!sharedCtx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    sharedCtx = new AC();
  }
  return sharedCtx;
}
