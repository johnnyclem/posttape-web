export type Visibility = "public" | "private";
export type DawKind = "ableton" | "folder" | "logic" | "fl" | "reaper" | "other";
export type TrackKind = "audio" | "midi" | "group" | "return" | "master";
export type FreezeStatus = "live" | "frozen" | "stem" | "missing-plugin";
export type PluginStatus = "ok" | "missing" | "version-mismatch" | "frozen-away";
export type CommitKind = "push" | "freeze" | "merge" | "init" | "comment";

/** Procedural voice used by the in-browser multi-track player */
export type SampleVoice =
  | "kick"
  | "snare"
  | "hat"
  | "perc"
  | "bass"
  | "lead"
  | "pad"
  | "vox"
  | "noise"
  | "loop"
  | "chord";

export type ClipSource = "session" | "splice" | "upload" | "synth";

export interface Artist {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarHue: number;
  location?: string;
  daw?: string;
}

export interface PluginRef {
  id: string;
  name: string;
  vendor: string;
  format: "VST3" | "AU" | "Max" | "Native" | "Rack";
  version?: string;
  category: string;
}

export interface TrackPlugin {
  pluginId: string;
  slot: number;
  enabled: boolean;
  status: PluginStatus;
}

export interface ProjectTrack {
  id: string;
  name: string;
  kind: TrackKind;
  color: string;
  freezeStatus: FreezeStatus;
  plugins: TrackPlugin[];
  durationBars?: number;
  notes?: string;
  muted?: boolean;
  solo?: boolean;
  /** 0–1 */
  volume?: number;
}

/** Timeline clip on a session track (beats-based NLE) */
export interface SessionClip {
  id: string;
  trackId: string;
  name: string;
  /** Start position in beats (quarter notes) */
  startBeat: number;
  /** Length in beats */
  lengthBeats: number;
  /** 0–1 gain */
  gain: number;
  source: ClipSource;
  voice: SampleVoice;
  /** Splice catalog asset id when source is splice */
  spliceAssetId?: string;
  color?: string;
}

export interface ProjectFile {
  id: string;
  path: string;
  kind: "project" | "audio" | "midi" | "sample" | "freeze" | "other";
  sizeBytes: number;
  mimeHint?: string;
  source?: ClipSource;
  spliceAssetId?: string;
}

export interface SongCommit {
  id: string;
  shortId: string;
  message: string;
  authorId: string;
  createdAt: string;
  kind: CommitKind;
  parentId?: string;
  filesChanged: number;
  pluginsDetected: number;
  tracksFrozen: number;
  summary?: string;
}

export interface Collaborator {
  userId: string;
  role: "owner" | "producer" | "writer" | "mixer" | "viewer";
  joinedAt: string;
}

export interface Song {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  description: string;
  visibility: Visibility;
  daw: DawKind;
  bpm: number;
  key: string;
  timeSignature: string;
  albumId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  starCount: number;
  forkCount: number;
  starredByMe?: boolean;
  collaborators: Collaborator[];
  tracks: ProjectTrack[];
  files: ProjectFile[];
  commits: SongCommit[];
  /** Editable multi-track session clips (in-browser NLE) */
  clips?: SessionClip[];
  /** Plugin ids referenced anywhere in the project */
  pluginIds: string[];
  freezeReady: boolean;
  coverHue: number;
}

export interface Album {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  description: string;
  visibility: Visibility;
  songIds: string[];
  coverHue: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  kind: "push" | "freeze" | "invite" | "star" | "album" | "comment" | "splice";
  actorId: string;
  songId?: string;
  albumId?: string;
  message: string;
  createdAt: string;
}

export interface FreezePlanItem {
  trackId: string;
  trackName: string;
  action: "freeze" | "already-frozen" | "skip-native" | "export-stem";
  reason: string;
  plugins: string[];
}

export interface FreezePlan {
  songId: string;
  items: FreezePlanItem[];
  estimatedMb: number;
  collaboratorSafe: boolean;
  missingPlugins: PluginRef[];
}

/** Linked Splice library account (not primary app login) */
export interface SpliceConnection {
  connected: boolean;
  username?: string;
  displayName?: string;
  plan?: string;
  connectedAt?: string;
  sampleCount?: number;
}

export interface SpliceSample {
  id: string;
  name: string;
  artist: string;
  pack: string;
  type: "oneshot" | "loop" | "midi";
  bpm?: number;
  key?: string;
  durationMs: number;
  tags: string[];
  voice: SampleVoice;
  popularity: number;
  hue: number;
}
