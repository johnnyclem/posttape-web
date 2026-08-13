import { getPlugin, licenseWarning, needsFreeze, STOCK_PLUGIN_IDS } from "./plugins";
import type {
  CompatibilityIssue,
  CompatibilityReport,
  MachineEnvironment,
  Song,
} from "./types";

export const GENERIC_LIVE_ID = "env-generic-live";

export function genericLiveEnvironment(): MachineEnvironment {
  return {
    userId: GENERIC_LIVE_ID,
    name: "Generic Live user",
    kind: "preset",
    pluginIds: [...STOCK_PLUGIN_IDS],
    liveVersion: "12",
    updatedAt: new Date(0).toISOString(),
    sharedSongIds: [],
  };
}

export function envHas(env: MachineEnvironment, pluginId: string): boolean {
  const p = getPlugin(pluginId);
  if (p?.deviceClass === "stock") return true;
  return env.pluginIds.includes(pluginId);
}

export function canSeeEnvironment(
  env: MachineEnvironment,
  viewerId: string | null | undefined,
  songId?: string,
): boolean {
  if (env.userId === GENERIC_LIVE_ID) return true;
  if (!viewerId) return false;
  if (env.userId === viewerId) return true;
  if (songId && env.sharedSongIds.includes(songId)) return true;
  return false;
}

/** Environments a viewer may plan a freeze against. Inventories stay private. */
export function listTargetEnvironments(
  song: Song,
  environments: MachineEnvironment[],
  viewerId: string | null | undefined,
): MachineEnvironment[] {
  const generic = genericLiveEnvironment();
  const out: MachineEnvironment[] = [generic];
  const seen = new Set<string>([generic.userId, song.ownerId]);

  for (const env of environments) {
    if (seen.has(env.userId)) continue;
    const onSong = song.collaborators.some((c) => c.userId === env.userId);
    if (!onSong && env.userId !== viewerId) continue;
    if (!canSeeEnvironment(env, viewerId, song.id)) continue;
    seen.add(env.userId);
    out.push(env);
  }
  return out;
}

export function computeCompatibility(
  song: Song,
  env: MachineEnvironment,
): CompatibilityReport {
  const issues: CompatibilityIssue[] = [];

  for (const pluginId of song.pluginIds) {
    const plugin = getPlugin(pluginId);
    const liveTracks = song.tracks.filter(
      (t) =>
        t.freezeStatus === "live" &&
        t.plugins.some((p) => p.pluginId === pluginId && p.enabled && p.status !== "frozen-away"),
    );
    const frozenTracks = song.tracks.filter((t) =>
      t.plugins.some(
        (p) =>
          p.pluginId === pluginId &&
          (p.status === "frozen-away" || t.freezeStatus === "frozen" || t.freezeStatus === "stem"),
      ),
    );

    if (liveTracks.length === 0) {
      if (frozenTracks.length > 0 && needsFreeze(pluginId)) {
        issues.push({
          pluginId,
          trackIds: frozenTracks.map((t) => t.id),
          kind: "frozen",
          remedies: ["Already printed to audio — no install needed to open."],
        });
      }
      continue;
    }

    if (plugin?.deviceClass === "stock" || envHas(env, pluginId)) {
      if (plugin?.licenseClass === "dongle" && envHas(env, pluginId)) {
        const warn = licenseWarning(pluginId);
        if (warn) {
          issues.push({
            pluginId,
            trackIds: liveTracks.map((t) => t.id),
            kind: "license-blocked",
            remedies: [warn, "Freeze the track if the dongle will not be present."],
          });
        }
      }
      continue;
    }

    const remedies = [
      `Install ${plugin?.name ?? pluginId}`,
      plugin?.licenseClass === "dongle" ? "Authorize the dongle / iLok" : `Obtain a ${plugin?.licenseClass ?? "paid"} license`,
      "Sender freezes this track (unilateral)",
    ];
    issues.push({
      pluginId,
      trackIds: liveTracks.map((t) => t.id),
      kind: "missing",
      remedies,
    });
  }

  const blocking = issues.filter((i) => i.kind === "missing" || i.kind === "license-blocked");
  return {
    targetUserId: env.userId,
    targetName: env.name,
    issues,
    opensCleanly: blocking.length === 0,
  };
}

export function summarizeCollaborators(
  song: Song,
  envs: MachineEnvironment[],
): { clean: number; total: number } {
  const others = song.collaborators.filter((c) => c.userId !== song.ownerId);
  let clean = 0;
  for (const c of others) {
    const env = envs.find((e) => e.userId === c.userId) ?? genericLiveEnvironment();
    if (computeCompatibility(song, env).opensCleanly) clean += 1;
  }
  return { clean, total: others.length };
}
