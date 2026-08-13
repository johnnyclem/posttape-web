import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyFreeze, buildFreezePlan, detectDaw, scanPluginsFromUpload } from "./ableton";
import { snapshotSong } from "./diff";
import { genericLiveEnvironment } from "./environment";
import { needsFreeze, STOCK_PLUGIN_IDS } from "./plugins";
import { canAccessSong, migrateRole } from "./roles";
import { ensureSongSession, newClipId, newTrackId } from "./session";
import { getSpliceSample } from "./splice/catalog";
import { ACTIVITY, ALBUMS, ARTISTS, ENVIRONMENTS, SONGS } from "./seed";
import type {
  ActivityItem,
  Album,
  Artist,
  CollaboratorRole,
  MachineEnvironment,
  SampleVoice,
  SessionClip,
  Song,
  SongCommit,
  SpliceConnection,
  TakeComment,
  Visibility,
} from "./types";
import { slugify } from "./utils";

function shortId() {
  return Math.random().toString(36).slice(2, 9);
}

type SongWithSession = Song & { clips: SessionClip[] };

interface PosttapeState {
  artists: Artist[];
  songs: Song[];
  albums: Album[];
  activity: ActivityItem[];
  environments: MachineEnvironment[];
  starredIds: string[];
  splice: SpliceConnection;
  hydrated: boolean;

  getArtist: (idOrUsername: string) => Artist | undefined;
  getSong: (owner: string, slug: string, viewerId?: string | null) => SongWithSession | undefined;
  getSongById: (id: string, viewerId?: string | null) => SongWithSession | undefined;
  getAlbum: (owner: string, slug: string) => Album | undefined;
  publicSongs: () => Song[];
  songsForUser: (userId: string) => Song[];
  getEnvironment: (userId: string) => MachineEnvironment;
  ensureArtist: (user: {
    id: string;
    displayName?: string | null;
    primaryEmail?: string | null;
  }) => Artist;

  toggleStar: (songId: string) => void;
  createSong: (input: {
    ownerId: string;
    title: string;
    description: string;
    visibility: Visibility;
    daw: Song["daw"];
    bpm: number;
    key: string;
    tags: string[];
    filePaths?: string[];
    linerNotes?: string;
    rightsAffirmed?: boolean;
  }) => Song;
  runFreeze: (songId: string, trackIds: string[], authorId: string, targetUserId?: string) => void;
  pushCommit: (
    songId: string,
    authorId: string,
    message: string,
    kind?: SongCommit["kind"],
    rightsAffirmed?: boolean,
  ) => void;
  inviteCollaborator: (
    songId: string,
    username: string,
    role: CollaboratorRole,
  ) => boolean;
  setVisibility: (songId: string, visibility: Visibility, confirmation?: string) => boolean;
  setLinerNotes: (songId: string, notes: string) => void;
  addComment: (
    songId: string,
    input: {
      authorId: string;
      body: string;
      takeId?: string;
      timecodeSec?: number;
      trackName?: string;
    },
  ) => void;
  resolveComment: (songId: string, commentId: string, resolved?: boolean) => void;
  toggleEnvPlugin: (userId: string, pluginId: string) => void;
  shareEnvironmentWithSong: (userId: string, songId: string, share: boolean) => void;
  updateProfile: (userId: string, patch: Partial<Pick<Artist, "displayName" | "bio" | "location" | "links">>) => void;
  analyzeUpload: (paths: string[], text?: string[]) => {
    daw: Song["daw"];
    pluginIds: string[];
    evidence: Record<string, string>;
  };
  freezePlanFor: (songId: string, targetUserId?: string) => ReturnType<typeof buildFreezePlan> | null;
  resetDemo: () => void;

  ensureSession: (songId: string) => void;
  updateClip: (songId: string, clipId: string, patch: Partial<SessionClip>) => void;
  deleteClip: (songId: string, clipId: string) => void;
  setTrackMix: (
    songId: string,
    trackId: string,
    patch: { muted?: boolean; solo?: boolean; volume?: number; name?: string },
  ) => void;
  addTrack: (songId: string, name?: string) => string | null;
  addSpliceSampleToTrack: (
    songId: string,
    trackId: string,
    sampleId: string,
    startBeat?: number,
    actorId?: string,
  ) => SessionClip | null;
  addSynthClip: (
    songId: string,
    trackId: string,
    voice: SampleVoice,
    startBeat: number,
    lengthBeats?: number,
  ) => SessionClip | null;

  connectSplice: (username?: string) => void;
  disconnectSplice: () => void;
}

function normalizeSong(s: Song): Song {
  return ensureSongSession({
    ...s,
    collaborators: s.collaborators.map((c) => ({ ...c, role: migrateRole(c.role) })),
    comments: s.comments ?? [],
    linerNotes: s.linerNotes ?? "",
  });
}

const initial = () => ({
  artists: ARTISTS,
  songs: SONGS.map((s) => normalizeSong({ ...s, starredByMe: false })),
  albums: ALBUMS,
  activity: ACTIVITY,
  environments: ENVIRONMENTS,
  starredIds: [] as string[],
  splice: { connected: false } as SpliceConnection,
});

function mapSong(
  songs: Song[],
  songId: string,
  fn: (s: SongWithSession) => Song,
): Song[] {
  return songs.map((s) => (s.id === songId ? fn(ensureSongSession(s)) : s));
}

export const usePosttape = create<PosttapeState>()(
  persist(
    (set, get) => ({
      ...initial(),
      hydrated: false,

      getArtist: (idOrUsername) => {
        const { artists } = get();
        return artists.find(
          (a) => a.id === idOrUsername || a.username === idOrUsername,
        );
      },

      getSong: (owner, slug, viewerId) => {
        const artist = get().getArtist(owner);
        if (!artist) return undefined;
        const song = get().songs.find(
          (s) => s.ownerId === artist.id && s.slug === slug,
        );
        if (!song) return undefined;
        if (!canAccessSong(song, viewerId ?? null) && viewerId !== undefined) {
          return undefined;
        }
        return ensureSongSession(song);
      },

      getSongById: (id, viewerId) => {
        const song = get().songs.find((s) => s.id === id);
        if (!song) return undefined;
        if (viewerId !== undefined && !canAccessSong(song, viewerId)) return undefined;
        return ensureSongSession(song);
      },

      getAlbum: (owner, slug) => {
        const artist = get().getArtist(owner);
        if (!artist) return undefined;
        return get().albums.find((a) => a.ownerId === artist.id && a.slug === slug);
      },

      publicSongs: () =>
        get()
          .songs.filter((s) => s.visibility === "public")
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),

      songsForUser: (userId) =>
        get().songs.filter(
          (s) =>
            s.ownerId === userId ||
            s.collaborators.some((c) => c.userId === userId),
        ),

      getEnvironment: (userId) => {
        if (userId === genericLiveEnvironment().userId) return genericLiveEnvironment();
        return (
          get().environments.find((e) => e.userId === userId) ?? {
            userId,
            name: "Untitled machine",
            kind: "manual" as const,
            pluginIds: [...STOCK_PLUGIN_IDS],
            liveVersion: "12",
            updatedAt: new Date().toISOString(),
            sharedSongIds: [],
          }
        );
      },

      ensureArtist: (user) => {
        const existing = get().artists.find((a) => a.id === user.id);
        if (existing) return existing;
        const base =
          slugify(user.displayName || user.primaryEmail?.split("@")[0] || "you") || "you";
        let username = base;
        let n = 2;
        while (get().artists.some((a) => a.username === username)) {
          username = `${base}${n++}`;
        }
        const artist: Artist = {
          id: user.id,
          username,
          displayName: user.displayName || username,
          bio: "",
          avatarHue: Math.floor(Math.random() * 360),
        };
        const env: MachineEnvironment = {
          userId: user.id,
          name: `${artist.displayName} · this browser`,
          kind: "manual",
          pluginIds: [...STOCK_PLUGIN_IDS],
          liveVersion: "12",
          updatedAt: new Date().toISOString(),
          sharedSongIds: [],
        };
        set((state) => ({
          artists: [...state.artists, artist],
          environments: [...state.environments, env],
        }));
        return artist;
      },

      toggleStar: (songId) => {
        set((state) => {
          const starred = state.starredIds.includes(songId);
          return {
            starredIds: starred
              ? state.starredIds.filter((id) => id !== songId)
              : [...state.starredIds, songId],
            songs: state.songs.map((s) =>
              s.id === songId
                ? {
                    ...s,
                    starCount: s.starCount + (starred ? -1 : 1),
                    starredByMe: !starred,
                  }
                : s,
            ),
          };
        });
      },

      createSong: (input) => {
        const paths = input.filePaths ?? [];
        const detected = paths.length
          ? detectDaw(paths)
          : { daw: input.daw, confidence: 1 };
        const scan = paths.length
          ? scanPluginsFromUpload(paths)
          : { pluginIds: ["ableton-eq8", "ableton-compressor"], evidence: {} };

        const slugBase = slugify(input.title) || "untitled-song";
        let slug = slugBase;
        let n = 2;
        while (
          get().songs.some((s) => s.ownerId === input.ownerId && s.slug === slug)
        ) {
          slug = `${slugBase}-${n++}`;
        }

        const id = `song-${shortId()}`;
        const now = new Date().toISOString();
        const tracks =
          paths.length === 0
            ? [
                {
                  id: `t-${shortId()}`,
                  name: "Track 1",
                  kind: "midi" as const,
                  color: "#64748b",
                  freezeStatus: "live" as const,
                  plugins: scan.pluginIds.slice(0, 2).map((pluginId, slot) => ({
                    pluginId,
                    slot,
                    enabled: true,
                    status: "ok" as const,
                  })),
                  muted: false,
                  solo: false,
                  volume: 0.85,
                },
              ]
            : paths
                .filter((p) => /\.(wav|aiff|flac|mp3|mid|als)$/i.test(p))
                .slice(0, 8)
                .map((p, i) => {
                  const name = p.split("/").pop()!.replace(/\.[^.]+$/, "");
                  const isMidi = /\.mid$/i.test(p);
                  const isAls = /\.als$/i.test(p);
                  if (isAls) {
                    return {
                      id: `t-${shortId()}`,
                      name: "Master Set",
                      kind: "group" as const,
                      color: "#a1a1aa",
                      freezeStatus: "live" as const,
                      plugins: scan.pluginIds.slice(0, 3).map((pluginId, slot) => ({
                        pluginId,
                        slot,
                        enabled: true,
                        status: "ok" as const,
                      })),
                      muted: false,
                      solo: false,
                      volume: 0.85,
                    };
                  }
                  return {
                    id: `t-${shortId()}`,
                    name,
                    kind: isMidi ? ("midi" as const) : ("audio" as const),
                    color: `hsl(${(i * 47) % 360} 22% 38%)`,
                    freezeStatus: "live" as const,
                    plugins: scan.pluginIds.slice(0, 1).map((pluginId, slot) => ({
                      pluginId,
                      slot,
                      enabled: true,
                      status: "ok" as const,
                    })),
                    muted: false,
                    solo: false,
                    volume: 0.85,
                  };
                });

        const draft = ensureSongSession({
          id,
          ownerId: input.ownerId,
          slug,
          title: input.title.trim() || "Untitled song",
          description: input.description.trim(),
          linerNotes: input.linerNotes ?? "",
          visibility: input.visibility,
          daw: detected.daw,
          bpm: input.bpm,
          key: input.key,
          timeSignature: "4/4",
          tags: input.tags,
          createdAt: now,
          updatedAt: now,
          starCount: 0,
          forkCount: 0,
          coverHue: Math.floor(Math.random() * 360),
          freezeReady: scan.pluginIds.every((p) => !needsFreeze(p)),
          pluginIds: scan.pluginIds,
          rightsAffirmedAt: input.rightsAffirmed ? now : undefined,
          collaborators: [
            { userId: input.ownerId, role: "owner", joinedAt: now },
          ],
          comments: [],
          tracks,
          files: paths.map((path) => ({
            id: `f-${shortId()}`,
            path,
            kind: path.endsWith(".als")
              ? ("project" as const)
              : /\.(wav|aiff|flac|mp3)$/i.test(path)
                ? ("audio" as const)
                : /\.mid$/i.test(path)
                  ? ("midi" as const)
                  : ("other" as const),
            sizeBytes: 1_000_000 + Math.floor(Math.random() * 20_000_000),
          })),
          commits: [],
          clips: [],
        });
        const initCommit: SongCommit = {
          id: `c-${shortId()}`,
          shortId: shortId().slice(0, 7),
          message: "Initial project upload",
          authorId: input.ownerId,
          createdAt: now,
          kind: "init",
          filesChanged: Math.max(1, paths.length),
          pluginsDetected: scan.pluginIds.length,
          tracksFrozen: 0,
          summary: `Detected ${detected.daw} · ${scan.pluginIds.length} devices`,
          hasBounce: true,
          snapshot: snapshotSong(draft),
        };
        const song = { ...draft, commits: [initCommit] };

        const activity: ActivityItem = {
          id: `a-${shortId()}`,
          kind: "push",
          actorId: input.ownerId,
          songId: id,
          message: `created ${song.title}`,
          createdAt: now,
        };

        set((state) => ({
          songs: [song, ...state.songs],
          activity: [activity, ...state.activity],
        }));
        return song;
      },

      runFreeze: (songId, trackIds, authorId, targetUserId) => {
        set((state) => {
          const song = state.songs.find((s) => s.id === songId);
          if (!song) return state;
          const base = ensureSongSession(song);
          const next = applyFreeze(base, trackIds);
          const now = new Date().toISOString();
          const target = targetUserId
            ? state.environments.find((e) => e.userId === targetUserId)
            : undefined;
          const commit: SongCommit = {
            id: `c-${shortId()}`,
            shortId: shortId().slice(0, 7),
            message: `Freeze package for ${target?.name ?? "collaborator"} (${trackIds.length} track${trackIds.length === 1 ? "" : "s"})`,
            authorId,
            createdAt: now,
            kind: "freeze",
            parentId: song.commits[0]?.id,
            filesChanged: trackIds.length,
            pluginsDetected: next.pluginIds.length,
            tracksFrozen: next.tracks.filter(
              (t) => t.freezeStatus === "frozen" || t.freezeStatus === "stem",
            ).length,
            summary:
              "Prototype freeze package recorded. A desktop Agent would drive Live; this take is non-destructive to the previous one.",
            hasBounce: true,
            snapshot: snapshotSong({ ...next, clips: base.clips }),
          };
          const updated: Song = {
            ...next,
            clips: base.clips,
            comments: base.comments ?? [],
            commits: [commit, ...next.commits],
          };
          const activity: ActivityItem = {
            id: `a-${shortId()}`,
            kind: "freeze",
            actorId: authorId,
            songId,
            message: `prepared freeze package on ${song.title}`,
            createdAt: now,
          };
          return {
            songs: state.songs.map((s) => (s.id === songId ? updated : s)),
            activity: [activity, ...state.activity],
          };
        });
      },

      pushCommit: (songId, authorId, message, kind = "push", rightsAffirmed) => {
        set((state) => {
          const song = state.songs.find((s) => s.id === songId);
          if (!song) return state;
          const now = new Date().toISOString();
          const live = ensureSongSession(song);
          const commit: SongCommit = {
            id: `c-${shortId()}`,
            shortId: shortId().slice(0, 7),
            message,
            authorId,
            createdAt: now,
            kind,
            parentId: song.commits[0]?.id,
            filesChanged: 1 + Math.floor(Math.random() * 4),
            pluginsDetected: song.pluginIds.length,
            tracksFrozen: song.tracks.filter(
              (t) => t.freezeStatus === "frozen" || t.freezeStatus === "stem",
            ).length,
            hasBounce: true,
            snapshot: snapshotSong(live),
          };
          return {
            songs: state.songs.map((s) =>
              s.id === songId
                ? {
                    ...s,
                    updatedAt: now,
                    rightsAffirmedAt: rightsAffirmed ? now : s.rightsAffirmedAt,
                    commits: [commit, ...s.commits],
                  }
                : s,
            ),
            activity: [
              {
                id: `a-${shortId()}`,
                kind: kind === "freeze" ? "freeze" : "push",
                actorId: authorId,
                songId,
                message: message.toLowerCase(),
                createdAt: now,
              },
              ...state.activity,
            ],
          };
        });
      },

      inviteCollaborator: (songId, username, role) => {
        const artist = get().getArtist(username);
        if (!artist) return false;
        set((state) => {
          const song = state.songs.find((s) => s.id === songId);
          if (!song) return state;
          if (song.collaborators.some((c) => c.userId === artist.id)) return state;
          const now = new Date().toISOString();
          return {
            songs: state.songs.map((s) =>
              s.id === songId
                ? {
                    ...s,
                    collaborators: [
                      ...s.collaborators,
                      { userId: artist.id, role: migrateRole(role), joinedAt: now },
                    ],
                    updatedAt: now,
                  }
                : s,
            ),
            activity: [
              {
                id: `a-${shortId()}`,
                kind: "invite",
                actorId: song.ownerId,
                songId,
                message: `invited ${artist.displayName} as ${role}`,
                createdAt: now,
              },
              ...state.activity,
            ],
          };
        });
        return true;
      },

      setVisibility: (songId, visibility, confirmation) => {
        const song = get().songs.find((s) => s.id === songId);
        if (!song) return false;
        if (song.visibility === "private" && visibility === "public") {
          if (confirmation?.trim().toLowerCase() !== "make public") return false;
        }
        set((state) => ({
          songs: state.songs.map((s) =>
            s.id === songId
              ? { ...s, visibility, updatedAt: new Date().toISOString() }
              : s,
          ),
        }));
        return true;
      },

      setLinerNotes: (songId, notes) => {
        set((state) => ({
          songs: state.songs.map((s) =>
            s.id === songId
              ? { ...s, linerNotes: notes, updatedAt: new Date().toISOString() }
              : s,
          ),
        }));
      },

      addComment: (songId, input) => {
        const body = input.body.trim();
        if (!body) return;
        set((state) => {
          const song = state.songs.find((s) => s.id === songId);
          if (!song) return state;
          const now = new Date().toISOString();
          const comment: TakeComment = {
            id: `cm-${shortId()}`,
            takeId: input.takeId ?? song.commits[0]?.id ?? "head",
            authorId: input.authorId,
            body,
            createdAt: now,
            timecodeSec: input.timecodeSec,
            trackName: input.trackName,
          };
          return {
            songs: state.songs.map((s) =>
              s.id === songId
                ? { ...s, comments: [comment, ...(s.comments ?? [])], updatedAt: now }
                : s,
            ),
            activity: [
              {
                id: `a-${shortId()}`,
                kind: "comment",
                actorId: input.authorId,
                songId,
                message: `commented on ${song.title}`,
                createdAt: now,
              },
              ...state.activity,
            ],
          };
        });
      },

      resolveComment: (songId, commentId, resolved = true) => {
        set((state) => ({
          songs: state.songs.map((s) =>
            s.id === songId
              ? {
                  ...s,
                  comments: (s.comments ?? []).map((c) =>
                    c.id === commentId ? { ...c, resolved } : c,
                  ),
                }
              : s,
          ),
        }));
      },

      toggleEnvPlugin: (userId, pluginId) => {
        set((state) => {
          const existing = state.environments.find((e) => e.userId === userId);
          const base = existing ?? get().getEnvironment(userId);
          const has = base.pluginIds.includes(pluginId);
          const next: MachineEnvironment = {
            ...base,
            pluginIds: has
              ? base.pluginIds.filter((id) => id !== pluginId)
              : [...base.pluginIds, pluginId],
            updatedAt: new Date().toISOString(),
          };
          return {
            environments: existing
              ? state.environments.map((e) => (e.userId === userId ? next : e))
              : [...state.environments, next],
          };
        });
      },

      shareEnvironmentWithSong: (userId, songId, share) => {
        set((state) => ({
          environments: state.environments.map((e) => {
            if (e.userId !== userId) return e;
            const has = e.sharedSongIds.includes(songId);
            if (share && !has) return { ...e, sharedSongIds: [...e.sharedSongIds, songId] };
            if (!share && has) {
              return { ...e, sharedSongIds: e.sharedSongIds.filter((id) => id !== songId) };
            }
            return e;
          }),
        }));
      },

      updateProfile: (userId, patch) => {
        set((state) => ({
          artists: state.artists.map((a) =>
            a.id === userId
              ? {
                  ...a,
                  ...patch,
                  links: patch.links ? patch.links.slice(0, 5) : a.links,
                }
              : a,
          ),
        }));
      },

      analyzeUpload: (paths, text = []) => {
        const { daw } = detectDaw(paths);
        const { pluginIds, evidence } = scanPluginsFromUpload(paths, text);
        return { daw, pluginIds, evidence };
      },

      freezePlanFor: (songId, targetUserId) => {
        const song = get().getSongById(songId);
        if (!song) return null;
        const env = targetUserId
          ? get().getEnvironment(targetUserId)
          : genericLiveEnvironment();
        return buildFreezePlan(song, env);
      },

      resetDemo: () => set({ ...initial(), hydrated: true }),

      ensureSession: (songId) => {
        set((state) => {
          const song = state.songs.find((s) => s.id === songId);
          if (!song) return state;
          const needs =
            !song.clips ||
            song.clips.length === 0 ||
            song.tracks.some((t) => t.volume == null);
          if (!needs) return state;
          return {
            songs: state.songs.map((s) =>
              s.id === songId ? ensureSongSession(s) : s,
            ),
          };
        });
      },

      updateClip: (songId, clipId, patch) => {
        set((state) => ({
          songs: mapSong(state.songs, songId, (s) => ({
            ...s,
            updatedAt: new Date().toISOString(),
            clips: s.clips.map((c) =>
              c.id === clipId
                ? {
                    ...c,
                    ...patch,
                    startBeat: Math.max(0, patch.startBeat ?? c.startBeat),
                    lengthBeats: Math.max(0.25, patch.lengthBeats ?? c.lengthBeats),
                    gain: Math.min(1, Math.max(0, patch.gain ?? c.gain)),
                  }
                : c,
            ),
          })),
        }));
      },

      deleteClip: (songId, clipId) => {
        set((state) => ({
          songs: mapSong(state.songs, songId, (s) => ({
            ...s,
            updatedAt: new Date().toISOString(),
            clips: s.clips.filter((c) => c.id !== clipId),
          })),
        }));
      },

      setTrackMix: (songId, trackId, patch) => {
        set((state) => ({
          songs: mapSong(state.songs, songId, (s) => ({
            ...s,
            tracks: s.tracks.map((t) =>
              t.id === trackId
                ? {
                    ...t,
                    ...patch,
                    volume:
                      patch.volume != null
                        ? Math.min(1, Math.max(0, patch.volume))
                        : t.volume,
                  }
                : t,
            ),
          })),
        }));
      },

      addTrack: (songId, name) => {
        const id = newTrackId();
        const colors = ["#c45c26", "#2f6fed", "#64748b", "#0d9488", "#e11d48", "#a1a1aa"];
        set((state) => {
          const song = state.songs.find((s) => s.id === songId);
          if (!song) return state;
          const s = ensureSongSession(song);
          const track = {
            id,
            name: name ?? `Track ${s.tracks.length + 1}`,
            kind: "audio" as const,
            color: colors[s.tracks.length % colors.length]!,
            freezeStatus: "live" as const,
            plugins: [] as Song["tracks"][0]["plugins"],
            muted: false,
            solo: false,
            volume: 0.85,
            durationBars: 32,
          };
          return {
            songs: state.songs.map((x) =>
              x.id === songId
                ? {
                    ...s,
                    tracks: [...s.tracks, track],
                    updatedAt: new Date().toISOString(),
                  }
                : x,
            ),
          };
        });
        return id;
      },

      addSpliceSampleToTrack: (songId, trackId, sampleId, startBeat = 0, actorId) => {
        const sample = getSpliceSample(sampleId);
        if (!sample) return null;
        const clip: SessionClip = {
          id: newClipId(),
          trackId,
          name: sample.name,
          startBeat: Math.max(0, startBeat),
          lengthBeats: sample.type === "loop" ? 8 : sample.type === "oneshot" ? 1 : 4,
          gain: 0.85,
          source: "splice",
          voice: sample.voice,
          spliceAssetId: sample.id,
          color: `hsl(${sample.hue} 22% 38%)`,
        };
        set((state) => {
          const song = state.songs.find((s) => s.id === songId);
          if (!song) return state;
          const s = ensureSongSession(song);
          if (!s.tracks.some((t) => t.id === trackId)) return state;
          const now = new Date().toISOString();
          const file = {
            id: `f-${shortId()}`,
            path: `Samples/Splice/${sample.pack.replace(/\s+/g, "_")}/${sample.name.replace(/\s+/g, "_")}.wav`,
            kind: "sample" as const,
            sizeBytes: Math.round(sample.durationMs * 90),
            source: "splice" as const,
            spliceAssetId: sample.id,
          };
          return {
            songs: state.songs.map((x) =>
              x.id === songId
                ? {
                    ...s,
                    clips: [...s.clips, clip],
                    files: [file, ...s.files],
                    updatedAt: now,
                  }
                : x,
            ),
            activity: actorId
              ? [
                  {
                    id: `a-${shortId()}`,
                    kind: "splice" as const,
                    actorId,
                    songId,
                    message: `added Splice sample “${sample.name}” to ${s.title}`,
                    createdAt: now,
                  },
                  ...state.activity,
                ]
              : state.activity,
          };
        });
        return clip;
      },

      addSynthClip: (songId, trackId, voice, startBeat, lengthBeats = 4) => {
        const clip: SessionClip = {
          id: newClipId(),
          trackId,
          name: voice,
          startBeat: Math.max(0, startBeat),
          lengthBeats,
          gain: 0.8,
          source: "synth",
          voice,
        };
        set((state) => ({
          songs: mapSong(state.songs, songId, (s) => {
            if (!s.tracks.some((t) => t.id === trackId)) return s;
            return {
              ...s,
              clips: [...s.clips, clip],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
        return clip;
      },

      connectSplice: (username = "you") => {
        set({
          splice: {
            connected: true,
            username,
            displayName: username.includes("@") ? username.split("@")[0] : username,
            plan: "Sounds+",
            connectedAt: new Date().toISOString(),
            sampleCount: 1284,
          },
        });
      },

      disconnectSplice: () => set({ splice: { connected: false } }),
    }),
    {
      name: "posttape-v3",
      partialize: (s) => ({
        songs: s.songs,
        albums: s.albums,
        activity: s.activity,
        artists: s.artists,
        environments: s.environments,
        starredIds: s.starredIds,
        splice: s.splice,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
          state.songs = state.songs.map((s) => normalizeSong(s as Song));
          if (!state.environments?.length) state.environments = ENVIRONMENTS;
          if (!state.artists?.length) state.artists = ARTISTS;
        }
      },
    },
  ),
);

if (typeof window !== "undefined") {
  setTimeout(() => {
    const s = usePosttape.getState();
    if (!s.hydrated) usePosttape.setState({ hydrated: true });
  }, 0);
}
