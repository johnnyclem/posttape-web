import { getSharedContext, getVoiceBuffer } from "./synth";
import type { ProjectTrack, SessionClip } from "@/lib/types";

export type TransportState = "stopped" | "playing" | "paused";

export type EngineSnapshot = {
  state: TransportState;
  /** current playhead in beats */
  beat: number;
  bpm: number;
};

type Listener = (s: EngineSnapshot) => void;

/**
 * Look-ahead multi-track scheduler.
 * Clips are scheduled in beats relative to song BPM.
 */
export class SessionEngine {
  private ctx: AudioContext | null = null;
  private bpm = 120;
  private state: TransportState = "stopped";
  private originCtx = 0;
  private originBeat = 0;
  private clips: SessionClip[] = [];
  private tracks = new Map<string, ProjectTrack>();
  private listeners = new Set<Listener>();
  private timer: number | null = null;
  private scheduled = new Set<string>();
  private masterGain: GainNode | null = null;
  private raf = 0;

  private ensureAudio() {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      this.ctx = getSharedContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);
    }
    return true;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => this.listeners.delete(fn);
  }

  snapshot(): EngineSnapshot {
    return { state: this.state, beat: this.currentBeat(), bpm: this.bpm };
  }

  private emit() {
    const s = this.snapshot();
    for (const fn of this.listeners) fn(s);
  }

  setBpm(bpm: number) {
    const beat = this.currentBeat();
    this.bpm = Math.max(40, Math.min(240, bpm));
    if (this.state === "playing" && this.ctx) {
      this.originCtx = this.ctx.currentTime;
      this.originBeat = beat;
    }
    this.emit();
  }

  load(clips: SessionClip[], tracks: ProjectTrack[], bpm: number) {
    this.clips = [...clips].sort((a, b) => a.startBeat - b.startBeat);
    this.tracks = new Map(tracks.map((t) => [t.id, t]));
    this.bpm = bpm;
    this.scheduled.clear();
    this.emit();
  }

  currentBeat(): number {
    if (this.state !== "playing" || !this.ctx) return this.originBeat;
    const elapsed = this.ctx.currentTime - this.originCtx;
    return this.originBeat + elapsed * (this.bpm / 60);
  }

  async play(fromBeat?: number) {
    if (!this.ensureAudio() || !this.ctx) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (fromBeat != null) this.originBeat = Math.max(0, fromBeat);
    this.originCtx = this.ctx.currentTime;
    this.state = "playing";
    this.scheduled.clear();
    this.scheduleAhead();
    this.startTimers();
    this.emit();
  }

  pause() {
    if (this.state !== "playing") return;
    this.originBeat = this.currentBeat();
    this.state = "paused";
    this.stopTimers();
    this.emit();
  }

  stop() {
    this.state = "stopped";
    this.originBeat = 0;
    if (this.ctx) this.originCtx = this.ctx.currentTime;
    this.scheduled.clear();
    this.stopTimers();
    this.emit();
  }

  seek(beat: number) {
    const wasPlaying = this.state === "playing";
    this.originBeat = Math.max(0, beat);
    if (this.ctx) this.originCtx = this.ctx.currentTime;
    this.scheduled.clear();
    if (wasPlaying) this.scheduleAhead();
    this.emit();
  }

  private startTimers() {
    this.stopTimers();
    if (typeof window === "undefined") return;
    this.timer = window.setInterval(() => this.scheduleAhead(), 50);
    const tick = () => {
      this.emit();
      if (this.state === "playing") this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stopTimers() {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private beatsToSeconds(beats: number) {
    return beats * (60 / this.bpm);
  }

  private async scheduleAhead() {
    if (this.state !== "playing" || !this.ctx || !this.masterGain) return;
    const lookAheadBeats = (this.bpm / 60) * 0.35;
    const nowBeat = this.currentBeat();
    const until = nowBeat + lookAheadBeats;

    const anySolo = [...this.tracks.values()].some((t) => t.solo);

    for (const clip of this.clips) {
      const track = this.tracks.get(clip.trackId);
      if (!track) continue;
      if (track.muted) continue;
      if (anySolo && !track.solo) continue;

      const key = `${clip.id}@${clip.startBeat}`;
      if (this.scheduled.has(key)) continue;
      if (clip.startBeat + clip.lengthBeats < nowBeat - 0.05) continue;
      if (clip.startBeat > until) continue;

      const startBeat = Math.max(clip.startBeat, nowBeat);
      if (startBeat > clip.startBeat + clip.lengthBeats) continue;

      this.scheduled.add(key);
      const when =
        this.originCtx + this.beatsToSeconds(startBeat - this.originBeat);
      const offsetBeats = startBeat - clip.startBeat;
      const remainBeats = clip.lengthBeats - offsetBeats;
      if (remainBeats <= 0.01) continue;

      try {
        const buf = await getVoiceBuffer(
          this.ctx,
          clip.voice,
          clip.spliceAssetId ?? clip.id,
        );
        if (this.state !== "playing" || !this.ctx || !this.masterGain) return;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const clipSec = this.beatsToSeconds(remainBeats);
        if (buf.duration < clipSec * 0.9 && clip.lengthBeats > 1) {
          src.loop = true;
        }
        const g = this.ctx.createGain();
        const trackVol = track.volume ?? 0.85;
        g.gain.value = clip.gain * trackVol;
        src.connect(g);
        g.connect(this.masterGain);
        const offsetSec = Math.min(
          buf.duration * 0.95,
          this.beatsToSeconds(offsetBeats) % Math.max(0.01, buf.duration),
        );
        src.start(Math.max(this.ctx.currentTime, when), offsetSec, clipSec + 0.05);
      } catch {
        /* ignore schedule races */
      }
    }
  }

  dispose() {
    this.stop();
    this.listeners.clear();
  }
}

let engineSingleton: SessionEngine | null = null;

export function getSessionEngine(): SessionEngine {
  if (!engineSingleton) engineSingleton = new SessionEngine();
  return engineSingleton;
}
