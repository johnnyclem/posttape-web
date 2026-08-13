import { getPlugin, needsFreeze, PLUGIN_CATALOG } from "./plugins";
import type {
  FreezePlan,
  FreezePlanItem,
  PluginRef,
  ProjectFile,
  ProjectTrack,
  Song,
} from "./types";

const ALS_HINTS = [".als", "ableton", "live project", "live set"];
const FOLDER_DAW_HINTS: Record<string, string[]> = {
  logic: [".logicx", "logic project", "projectdata"],
  fl: [".flp", "fl studio"],
  reaper: [".rpp", "reaper"],
  folder: ["samples", "audio", "stems", "midi"],
};

/**
 * Detect DAW kind from uploaded file names / paths.
 * Ableton Live sets are gzip-compressed XML (.als); we treat any .als
 * as Ableton and walk sibling Sample / Freeze / Backup folders.
 */
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
  return { daw: "folder", confidence: 0.5 };
}

/**
 * Heuristic plugin scan from file paths + optional text peek.
 * Real ALS is gzip XML; in-browser we match known plugin identifiers
 * from filenames, freeze folders, and any readable text chunks.
 */
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

  // Ableton projects always imply core native devices when .als present
  if (paths.some((p) => p.toLowerCase().endsWith(".als"))) {
    for (const id of ["ableton-eq8", "ableton-compressor"]) {
      if (!pluginIds.includes(id)) pluginIds.push(id);
    }
  }

  return { pluginIds: [...new Set(pluginIds)], evidence };
}

export function buildFreezePlan(song: Song): FreezePlan {
  const items: FreezePlanItem[] = [];
  const missing: PluginRef[] = [];
  const missingIds = new Set<string>();

  for (const track of song.tracks) {
    const thirdParty = track.plugins.filter((p) => needsFreeze(p.pluginId));
    const names = thirdParty
      .map((p) => getPlugin(p.pluginId)?.name ?? p.pluginId)
      .filter(Boolean) as string[];

    for (const tp of thirdParty) {
      if (tp.status === "missing" || tp.status === "version-mismatch") {
        const ref = getPlugin(tp.pluginId);
        if (ref && !missingIds.has(ref.id)) {
          missingIds.add(ref.id);
          missing.push(ref);
        }
      }
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
      });
      continue;
    }

    if (thirdParty.length === 0) {
      items.push({
        trackId: track.id,
        trackName: track.name,
        action: "skip-native",
        reason: "Only Ableton native devices — safe without freeze",
        plugins: track.plugins.map((p) => getPlugin(p.pluginId)?.name ?? p.pluginId),
      });
      continue;
    }

    // MIDI with synths → freeze; audio with insert FX → freeze or stem
    if (track.kind === "midi") {
      items.push({
        trackId: track.id,
        trackName: track.name,
        action: "freeze",
        reason: `MIDI track uses ${names.join(", ")} — freeze before send so your collaborator can open without those plugs`,
        plugins: names,
      });
    } else {
      items.push({
        trackId: track.id,
        trackName: track.name,
        action: "export-stem",
        reason: `Audio track has third-party inserts (${names.join(", ")}) — export a frozen stem`,
        plugins: names,
      });
    }
  }

  const actionable = items.filter(
    (i) => i.action === "freeze" || i.action === "export-stem",
  );
  const estimatedMb = Math.max(12, actionable.length * 18 + song.tracks.length * 2);

  return {
    songId: song.id,
    items,
    estimatedMb,
    collaboratorSafe: actionable.length === 0,
    missingPlugins: missing,
  };
}

/** Apply freeze plan results onto tracks (demo simulation) */
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
        ? `${t.notes} · frozen for collab`
        : "Frozen for collab — original device chain preserved offline",
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
    if (installedPluginIds.includes(id) || plugin.vendor === "Ableton") {
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

export { PLUGIN_CATALOG };
