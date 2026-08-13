import type { MusicalDiffEntry, Song, TakeSnapshot } from "./types";

export function snapshotSong(song: Song): TakeSnapshot {
  const frozenTrackIds = song.tracks
    .filter((t) => t.freezeStatus === "frozen" || t.freezeStatus === "stem")
    .map((t) => t.id);
  const bars = Math.max(0, ...song.tracks.map((t) => t.durationBars ?? 0));
  return {
    trackNames: song.tracks.map((t) => t.name),
    pluginIds: [...song.pluginIds],
    tempo: song.bpm,
    key: song.key,
    timeSignature: song.timeSignature,
    frozenTrackIds,
    clipCount: song.clips?.length ?? 0,
    arrangementBars: bars || 32,
  };
}

export function musicalDiff(before: TakeSnapshot, after: TakeSnapshot): MusicalDiffEntry[] {
  const out: MusicalDiffEntry[] = [];
  const beforeSet = new Set(before.trackNames);
  const afterSet = new Set(after.trackNames);

  for (const name of after.trackNames) {
    if (!beforeSet.has(name)) {
      out.push({ kind: "track-added", label: `Track added`, after: name });
    }
  }
  for (const name of before.trackNames) {
    if (!afterSet.has(name)) {
      out.push({ kind: "track-removed", label: `Track removed`, before: name });
    }
  }

  const beforePlugs = new Set(before.pluginIds);
  const afterPlugs = new Set(after.pluginIds);
  for (const id of after.pluginIds) {
    if (!beforePlugs.has(id)) {
      out.push({ kind: "device-added", label: "Device added", after: id });
    }
  }
  for (const id of before.pluginIds) {
    if (!afterPlugs.has(id)) {
      out.push({ kind: "device-removed", label: "Device removed", before: id });
    }
  }

  if (before.tempo !== after.tempo) {
    out.push({
      kind: "tempo",
      label: "Tempo",
      before: `${before.tempo} BPM`,
      after: `${after.tempo} BPM`,
    });
  }
  if (before.key !== after.key) {
    out.push({ kind: "key", label: "Key", before: before.key, after: after.key });
  }
  if (before.timeSignature !== after.timeSignature) {
    out.push({
      kind: "time-signature",
      label: "Time signature",
      before: before.timeSignature,
      after: after.timeSignature,
    });
  }
  if (before.frozenTrackIds.length !== after.frozenTrackIds.length) {
    out.push({
      kind: "freeze",
      label: "Frozen tracks",
      before: String(before.frozenTrackIds.length),
      after: String(after.frozenTrackIds.length),
    });
  }
  if (before.clipCount !== after.clipCount) {
    out.push({
      kind: "clips",
      label: "Clips",
      before: String(before.clipCount),
      after: String(after.clipCount),
    });
  }
  if (before.arrangementBars !== after.arrangementBars) {
    out.push({
      kind: "length",
      label: "Arrangement length",
      before: `${before.arrangementBars} bars`,
      after: `${after.arrangementBars} bars`,
    });
  }

  return out;
}
