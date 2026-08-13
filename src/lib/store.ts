import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyFreeze, buildFreezePlan, detectDaw, scanPluginsFromUpload } from "./ableton";
import { needsFreeze } from "./plugins";
import { ensureSongSession, newClipId, newTrackId } from "./session";
import { getSpliceSample } from "./splice/catalog";
import { ACTIVITY, ALBUMS, ARTISTS, SONGS, TAYLOR_INSTALLED } from "./seed";
import type {
  ActivityItem,
  Album,
  Artist,
  SampleVoice,
  SessionClip,
  Song,
  SongCommit,
  SpliceConnection,
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
  taylorPlugins: string[];
  starredIds: string[];
  splice: SpliceConnection;
  hydrated: boolean;

  getArtist: (idOrUsername: string) => Artist | undefined;
  getSong: (owner: string, slug: string) => SongWithSession | undefined;
  getSongById: (id: string) => SongWithSession | undefined;
  getAlbum: (owner: string, slug: string) => Album | undefined;
  publicSongs: () => Song[];
  songsForUser: (userId: string) => Song[];

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
  }) => Song;
  runFreeze: (songId: string, trackIds: string[], authorId: string) => void;
  pushCommit: (
    songId: string,
    authorId: string,
    message: string,
    kind?: SongCommit["kind"],
  ) => void;
  inviteCollaborator: (
    songId: string,
    username: string,
    role: Song["collaborators"][0]["role"],
  ) => boolean;
  analyzeUpload: (paths: string[], text?: string[]) => {
    daw: Song["daw"];
    pluginIds: string[];
    evidence: Record<string, string>;
  };
  freezePlanFor: (songId: string) => ReturnType<typeof buildFreezePlan> | null;
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

const initial = () => ({
  artists: ARTISTS,
  songs: SONGS.map((s) => ensureSongSession({ ...s, starredByMe: false })),
  albums: ALBUMS,
  activity: ACTIVITY,
  taylorPlugins: TAYLOR_INSTALLED,
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

      getSong: (owner, slug) => {
        const artist = get().getArtist(owner);
        if (!artist) return undefined;
        const song = get().songs.find(
          (s) => s.ownerId === artist.id && s.slug === slug,
        );
        return song ? ensureSongSession(song) : undefined;
      },

      getSongById: (id) => {
        const song = get().songs.find((s) => s.id === id);
        return song ? ensureSongSession(song) : undefined;
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
                  color: "#6366f1",
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
                    color: `hsl(${(i * 47) % 360} 60% 45%)`,
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

        const song = ensureSongSession({
          id,
          ownerId: input.ownerId,
          slug,
          title: input.title.trim() || "Untitled song",
          description: input.description.trim(),
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
          collaborators: [
            { userId: input.ownerId, role: "owner", joinedAt: now },
          ],
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
          commits: [
            {
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
            },
          ],
          clips: [],
        });

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

      runFreeze: (songId, trackIds, authorId) => {
        set((state) => {
          const song = state.songs.find((s) => s.id === songId);
          if (!song) return state;
          const base = ensureSongSession(song);
          const next = applyFreeze(base, trackIds);
          const now = new Date().toISOString();
          const commit: SongCommit = {
            id: `c-${shortId()}`,
            shortId: shortId().slice(0, 7),
            message: `Freeze ${trackIds.length} track${trackIds.length === 1 ? "" : "s"} for collaborator-safe send`,
            authorId,
            createdAt: now,
            kind: "freeze",
            parentId: song.commits[0]?.id,
            filesChanged: trackIds.length,
            pluginsDetected: next.pluginIds.length,
            tracksFrozen: next.tracks.filter(
              (t) => t.freezeStatus === "frozen" || t.freezeStatus === "stem",
            ).length,
            summary: "Pre-commit freeze hook — third-party devices printed to audio",
          };
          const updated: Song = {
            ...next,
            clips: base.clips,
            commits: [commit, ...next.commits],
          };
          const activity: ActivityItem = {
            id: `a-${shortId()}`,
            kind: "freeze",
            actorId: authorId,
            songId,
            message: `froze ${trackIds.length} tracks on ${song.title}`,
            createdAt: now,
          };
          return {
            songs: state.songs.map((s) => (s.id === songId ? updated : s)),
            activity: [activity, ...state.activity],
          };
        });
      },

      pushCommit: (songId, authorId, message, kind = "push") => {
        set((state) => {
          const song = state.songs.find((s) => s.id === songId);
          if (!song) return state;
          const now = new Date().toISOString();
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
          };
          return {
            songs: state.songs.map((s) =>
              s.id === songId
                ? {
                    ...s,
                    updatedAt: now,
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
                      { userId: artist.id, role, joinedAt: now },
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

      analyzeUpload: (paths, text = []) => {
        const { daw } = detectDaw(paths);
        const { pluginIds, evidence } = scanPluginsFromUpload(paths, text);
        return { daw, pluginIds, evidence };
      },

      freezePlanFor: (songId) => {
        const song = get().getSongById(songId);
        if (!song) return null;
        return buildFreezePlan(song);
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
        const colors = ["#c45c26", "#2f6fed", "#7c3aed", "#0d9488", "#e11d48", "#a1a1aa"];
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
          color: `hsl(${sample.hue} 55% 45%)`,
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
      name: "posttape-v2",
      partialize: (s) => ({
        songs: s.songs,
        albums: s.albums,
        activity: s.activity,
        starredIds: s.starredIds,
        taylorPlugins: s.taylorPlugins,
        splice: s.splice,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
          state.songs = state.songs.map((s) => ensureSongSession(s as Song));
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
