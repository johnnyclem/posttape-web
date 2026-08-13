import { envHas, genericLiveEnvironment } from "./environment";
import { getPlugin, needsFreeze, PLUGIN_CATALOG } from "./plugins";
import type {
  FreezePlan,
  FreezePlanItem,
  MachineEnvironment,
  PluginRef,
  ProjectFile,
  ProjectTrack,
  RoutingWarning,
  Song,
} from "./types";

const ALS_HINTS = [".als", "ableton", "live project", "live set"];
const FOLDER_DAW_HINTS: Record<string, string[]> = {
  logic: [".logicx", "logic project", "projectdata"],
  fl: [".flp", "fl studio"],
  reaper: [".rpp", "reaper"],
  folder: ["samples", "audio", "stems", "midi"],
};

export function detectDaw(paths: string[]): {
  daw: Song["daw"];
  projectFile?: string;
  confidence: number;
} {
  const lower = paths.map((p) => p.toLowerCase());
  const als = lower.find((p) => p.endsWith(".als"));
  if (als) {
    return { daw: "ableton", projectFile: paths[lower.indexOf(als)], confidence: 0.98 };
  }
  for (const [daw, hints] of Object.entries(FOLDER_DAW_HINTS)) {
    if (hints.some((h) => lower.some((p) => p.includes(h)))) {
      return { daw: daw as Song["daw"], confidence: 0.75 };
    }
  }
  void ALS_HINTS;
  return { daw: "folder", confidence: 0.5 };
}

export function scanPluginsFromUpload(
  paths: string[],
  textSnippets: string[] = [],
): { pluginIds: string[]; evidence: Record<string, string> } {
  const blob = [...paths, ...textSnippets].join("\n").toLowerCase();
  const pluginIds: string[] = [];
  const evidence: Record<string, string> = {};

  const patterns: Array<{ id: string; needles: string[] }> = [
    { id: "serum2", needles: ["serum 2", "serum2", "xfer serum"] },
    { id: "valhalla-vintageverb", needles: ["valhallavintageverb", "vintageverb"] },
    { id: "fabfilter-pro-q3", needles: ["pro-q 3", "pro-q3", "fabfilter pro-q"] },
    { id: "fabfilter-pro-c2", needles: ["pro-c 2", "pro-c2"] },
    { id: "soundtoys-echoboy", needles: ["echoboy"] },
    { id: "uad-1176", needles: ["1176", "uad-2"] },
    { id: "rc20", needles: ["rc-20", "rc20", "retro color"] },
    { id: "max-for-live-grain", needles: ["granulator", "granulator iii"] },
    { id: "max-for-live-lfo", needles: ["max for live", "m4l"] },
    { id: "ozone-imager", needles: ["ozone imager"] },
    { id: "kontakt", needles: ["kontakt"] },
    { id: "omnisphere", needles: ["omnisphere"] },
    { id: "decapitator", needles: ["decapitator"] },
    { id: "ableton-operator", needles: ["operator"] },
    { id: "ableton-wavetable", needles: ["wavetable"] },
    { id: "ableton-eq8", needles: ["eq eight", "eq8"] },
    { id: "ableton-drum-rack", needles: ["drum rack"] },
    { id: "ableton-simpler", needles: ["simpler"] },
  ];

  for (const { id, needles } of patterns) {
    for (const n of needles) {
      if (blob.includes(n)) {
        pluginIds.push(id);
        evidence[id] = n;
        break;
      }
    }
  }

  if (paths.some((p) => p.toLowerCase().endsWith(".als"))) {
    for (const id of ["ableton-eq8", "ableton-compressor"]) {
      if (!pluginIds.includes(id)) pluginIds.push(id);
    }
  }

  return { pluginIds: [...new Set(pluginIds)], evidence };
}

function liveMissing(track: ProjectTrack, env: MachineEnvironment): string[] {
  const ids: string[] = [];
  for (const p of track.plugins) {
    if (!p.enabled || p.status === "frozen-away") continue;
    if (!needsFreeze(p.pluginId)) continue;
    if (!envHas(env, p.pluginId)) ids.push(p.pluginId);
  }
  return ids;
}

export function computeRoutingWarnings(
  song: Song,
  targetedIds: Set<string>,
): RoutingWarning[] {
  const warnings: RoutingWarning[] = [];
  const byId = new Map(song.tracks.map((t) => [t.id, t]));

  for (const track of song.tracks) {
    if (track.sidechainFrom && targetedIds.has(track.sidechainFrom)) {
      const src = byId.get(track.sidechainFrom);
      warnings.push({
        kind: "sidechain",
        trackId: track.id,
        trackName: track.name,
        detail: `Sidechain key comes from ${src?.name ?? "another track"} — freezing that source changes this compressor.`,
      });
    }
    if (track.sendTo && targetedIds.has(track.sendTo)) {
      const dest = byId.get(track.sendTo);
      warnings.push({
        kind: "send-to-return",
        trackId: track.id,
        trackName: track.name,
        detail: `Sends to ${dest?.name ?? "a return"} which is targeted — freeze will flatten that bus for every sender.`,
      });
    }
    if (track.groupId && targetedIds.has(track.groupId)) {
      warnings.push({
        kind: "group",
        trackId: track.id,
        trackName: track.name,
        detail: "Parent group is targeted — flattening the group changes routing for every child.",
      });
    }
  }
  return warnings;
}

export function buildFreezePlan(
  song: Song,
  target: MachineEnvironment = genericLiveEnvironment(),
): FreezePlan {
  const items: FreezePlanItem[] = [];
  const missing: PluginRef[] = [];
  const missingIds = new Set<string>();
  const targeted = new Set<string>();

  for (const track of song.tracks) {
    const names = track.plugins
      .filter((p) => needsFreeze(p.pluginId))
      .map((p) => getPlugin(p.pluginId)?.name ?? p.pluginId);

    for (const tp of track.plugins) {
      if (!needsFreeze(tp.pluginId)) continue;
      if (envHas(target, tp.pluginId)) continue;
      const ref = getPlugin(tp.pluginId);
      if (ref && !missingIds.has(ref.id)) {
        missingIds.add(ref.id);
        missing.push(ref);
      }
    }

    if (track.kind === "return" || track.kind === "master") {
      const lacking = liveMissing(track, target);
      items.push({
        trackId: track.id,
        trackName: track.name,
        action: "flagged-separately",
        reason:
          lacking.length === 0
            ? `${track.kind === "master" ? "Master" : "Return"} chain is stock-safe for ${target.name} — left out of the default plan so the mix stays editable.`
            : `${track.kind === "master" ? "Master" : "Return"} uses devices ${target.name} lacks. Freezing it silently changes the mix for every track — override only if you mean to.`,
        plugins: names,
        defaultSelected: false,
      });
      continue;
    }

    if (track.freezeStatus === "frozen" || track.freezeStatus === "stem") {
      items.push({
        trackId: track.id,
        trackName: track.name,
        action: "already-frozen",
        reason:
          track.freezeStatus === "stem"
            ? "Exported as audio stem — plugins not required"
            : "Already frozen in the Live set",
        plugins: names,
        defaultSelected: false,
      });
      continue;
    }

    const lacking = liveMissing(track, target);
    if (lacking.length === 0) {
      items.push({
        trackId: track.id,
        trackName: track.name,
        action: "skip-native",
        reason: `Only devices ${target.name} already has — left live so they can still edit.`,
        plugins: track.plugins.map((p) => getPlugin(p.pluginId)?.name ?? p.pluginId),
        defaultSelected: false,
      });
      continue;
    }

    const lackNames = lacking.map((id) => getPlugin(id)?.name ?? id);
    const action = track.kind === "midi" ? "freeze" : "export-stem";
    targeted.add(track.id);
    items.push({
      trackId: track.id,
      trackName: track.name,
      action,
      reason:
        track.kind === "midi"
          ? `MIDI track uses ${lackNames.join(", ")} — ${target.name} cannot open this chain live.`
          : `Audio inserts ${lackNames.join(", ")} are missing on ${target.name} — print a frozen stem.`,
      plugins: lackNames,
      defaultSelected: true,
    });
  }

  const warnings = computeRoutingWarnings(song, targeted);
  const actionable = items.filter((i) => i.action === "freeze" || i.action === "export-stem");
  const estimatedMb = Math.max(8, actionable.length * 18 + song.tracks.length * 2);
  const estimatedSeconds = Math.max(20, actionable.length * 35);

  return {
    songId: song.id,
    targetUserId: target.userId,
    targetName: target.name,
    items,
    warnings,
    estimatedMb,
    estimatedSeconds,
    collaboratorSafe: actionable.length === 0,
    missingPlugins: missing,
  };
}

/** Record a freeze package onto tracks (prototype — does not drive Live). */
export function applyFreeze(song: Song, trackIds: string[]): Song {
  const tracks: ProjectTrack[] = song.tracks.map((t) => {
    if (!trackIds.includes(t.id)) return t;
    return {
      ...t,
      freezeStatus: t.kind === "midi" ? "frozen" : "stem",
      plugins: t.plugins.map((p) =>
        needsFreeze(p.pluginId) ? { ...p, status: "frozen-away" as const } : p,
      ),
      notes: t.notes
        ? `${t.notes} · freeze package recorded`
        : "Freeze package recorded — original device chain preserved on the source take",
    };
  });

  const freezeFiles: ProjectFile[] = trackIds.map((id) => {
    const t = song.tracks.find((x) => x.id === id)!;
    return {
      id: `freeze-${id}-${Date.now()}`,
      path: `Samples/Processed/Freeze/${t.name.replace(/\s+/g, "_")}_Freeze.wav`,
      kind: "freeze" as const,
      sizeBytes: 12_000_000 + Math.floor(Math.random() * 8_000_000),
    };
  });

  const allFrozen = tracks.every(
    (t) =>
      t.kind === "return" ||
      t.kind === "master" ||
      t.freezeStatus === "frozen" ||
      t.freezeStatus === "stem" ||
      !t.plugins.some((p) => needsFreeze(p.pluginId) && p.status !== "frozen-away"),
  );

  return {
    ...song,
    tracks,
    files: [...song.files, ...freezeFiles],
    freezeReady: allFrozen,
    updatedAt: new Date().toISOString(),
  };
}

export function pluginCompatibility(
  song: Song,
  installedPluginIds: string[],
): Array<{ plugin: PluginRef; status: "installed" | "missing" | "frozen" }> {
  return song.pluginIds.map((id) => {
    const plugin = getPlugin(id) ?? {
      id,
      name: id,
      vendor: "Unknown",
      format: "VST3" as const,
      category: "Unknown",
      deviceClass: "unknown" as const,
      licenseClass: "paid-perpetual" as const,
      identityKey: `unknown:${id}`,
    };
    const frozenAway = song.tracks.every((t) =>
      t.plugins
        .filter((p) => p.pluginId === id)
        .every((p) => p.status === "frozen-away" || t.freezeStatus !== "live"),
    );
    const usedLive = song.tracks.some(
      (t) =>
        t.freezeStatus === "live" &&
        t.plugins.some((p) => p.pluginId === id && p.enabled),
    );
    if (!usedLive || frozenAway) {
      return { plugin, status: "frozen" as const };
    }
    if (installedPluginIds.includes(id) || plugin.deviceClass === "stock") {
      return { plugin, status: "installed" as const };
    }
    return { plugin, status: "missing" as const };
  });
}

export function summarizeProject(song: Song): string {
  const third = song.pluginIds.filter((id) => needsFreeze(id)).length;
  const frozen = song.tracks.filter(
    (t) => t.freezeStatus === "frozen" || t.freezeStatus === "stem",
  ).length;
  return `${song.tracks.length} tracks · ${song.pluginIds.length} devices (${third} third-party) · ${frozen} frozen`;
}

export function verifyFreeze(song: Song, env: MachineEnvironment): {
  passed: boolean;
  remaining: string[];
} {
  const remaining: string[] = [];
  for (const track of song.tracks) {
    if (track.kind === "return" || track.kind === "master") continue;
    if (track.freezeStatus !== "live") continue;
    for (const p of track.plugins) {
      if (!p.enabled || p.status === "frozen-away") continue;
      if (needsFreeze(p.pluginId) && !envHas(env, p.pluginId)) {
        remaining.push(`${track.name}: ${getPlugin(p.pluginId)?.name ?? p.pluginId}`);
      }
    }
  }
  return { passed: remaining.length === 0, remaining };
}

export { PLUGIN_CATALOG };
