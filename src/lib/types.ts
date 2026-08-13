export type Visibility = "public" | "private";
export type DawKind = "ableton" | "folder" | "logic" | "fl" | "reaper" | "other";
export type TrackKind = "audio" | "midi" | "group" | "return" | "master";
export type FreezeStatus = "live" | "frozen" | "stem" | "missing-plugin";
export type PluginStatus = "ok" | "missing" | "version-mismatch" | "frozen-away";
export type CommitKind = "push" | "freeze" | "merge" | "init" | "comment";
export type CollaboratorRole = "owner" | "maintainer" | "contributor" | "listener";
export type DeviceClass = "stock" | "max-for-live" | "third-party" | "unknown";
export type LicenseClass = "free" | "paid-perpetual" | "subscription" | "dongle";
export type EnvironmentKind = "manual" | "preset" | "agent";

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
  links?: string[];
}

export interface PluginRef {
  id: string;
  name: string;
  vendor: string;
  format: "VST3" | "AU" | "Max" | "Native" | "Rack";
  version?: string;
  category: string;
  deviceClass: DeviceClass;
  licenseClass: LicenseClass;
  /** Stable-ish identity — VST3 class id / AU triple stand-in (not display name). */
  identityKey: string;
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
  groupId?: string;
  /** Return / bus this track sends to */
  sendTo?: string;
  /** Track providing a sidechain key */
  sidechainFrom?: string;
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

export interface TakeSnapshot {
  trackNames: string[];
  pluginIds: string[];
  tempo: number;
  key: string;
  timeSignature: string;
  frozenTrackIds: string[];
  clipCount: number;
  arrangementBars: number;
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
  snapshot?: TakeSnapshot;
  /** Prototype: a playable reference mix exists for this take */
  hasBounce?: boolean;
}

export interface TakeComment {
  id: string;
  takeId: string;
  authorId: string;
  body: string;
  createdAt: string;
  timecodeSec?: number;
  trackName?: string;
  resolved?: boolean;
  parentId?: string;
}

export interface Collaborator {
  userId: string;
  role: CollaboratorRole;
  joinedAt: string;
}

export interface Song {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  description: string;
  /** Markdown liner notes (README) */
  linerNotes?: string;
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
  comments?: TakeComment[];
  /** Editable multi-track session clips (in-browser NLE) */
  clips?: SessionClip[];
  /** Plugin ids referenced anywhere in the project */
  pluginIds: string[];
  freezeReady: boolean;
  coverHue: number;
  rightsAffirmedAt?: string;
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
  action: "freeze" | "already-frozen" | "skip-native" | "export-stem" | "flagged-separately";
  reason: string;
  plugins: string[];
  defaultSelected: boolean;
}

export interface RoutingWarning {
  kind: "sidechain" | "send-to-return" | "group" | "master-or-return";
  trackId: string;
  trackName: string;
  detail: string;
}

export interface FreezePlan {
  songId: string;
  targetUserId: string;
  targetName: string;
  items: FreezePlanItem[];
  warnings: RoutingWarning[];
  estimatedMb: number;
  estimatedSeconds: number;
  collaboratorSafe: boolean;
  missingPlugins: PluginRef[];
}

export interface MachineEnvironment {
  userId: string;
  name: string;
  kind: EnvironmentKind;
  pluginIds: string[];
  liveVersion?: string;
  updatedAt: string;
  /** Song ids this inventory is shared with (never public). */
  sharedSongIds: string[];
}

export interface CompatibilityIssue {
  pluginId: string;
  trackIds: string[];
  kind: "missing" | "version-mismatch" | "license-blocked" | "frozen";
  remedies: string[];
}

export interface CompatibilityReport {
  targetUserId: string;
  targetName: string;
  issues: CompatibilityIssue[];
  opensCleanly: boolean;
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

export interface MusicalDiffEntry {
  kind:
    | "track-added"
    | "track-removed"
    | "track-renamed"
    | "device-added"
    | "device-removed"
    | "tempo"
    | "key"
    | "time-signature"
    | "freeze"
    | "clips"
    | "length";
  label: string;
  before?: string;
  after?: string;
}
