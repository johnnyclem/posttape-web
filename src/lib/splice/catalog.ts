import type { SampleVoice, SpliceSample } from "@/lib/types";

/**
 * Demo Splice library — mirrors the shape of a connected Splice Sounds account.
 * Real OAuth would fetch the user's licensed samples; platform auth only supports
 * Google/X as identity, so Splice is a linked library service.
 */
export const SPLICE_CATALOG: SpliceSample[] = [
  {
    id: "sp-kick-808",
    name: "808 Kick Deep",
    artist: "Origin Sound",
    pack: "Tape Room Drums",
    type: "oneshot",
    durationMs: 420,
    tags: ["kick", "808", "bass"],
    voice: "kick",
    popularity: 98,
    hue: 12,
  },
  {
    id: "sp-kick-acoustic",
    name: "Acoustic Kick Room",
    artist: "Cymatics",
    pack: "Studio Kit Vol 3",
    type: "oneshot",
    durationMs: 380,
    tags: ["kick", "acoustic", "room"],
    voice: "kick",
    popularity: 84,
    hue: 24,
  },
  {
    id: "sp-snare-crisp",
    name: "Snare Crisp Pop",
    artist: "Splice Originals",
    pack: "Indie Electronic",
    type: "oneshot",
    durationMs: 280,
    tags: ["snare", "pop"],
    voice: "snare",
    popularity: 91,
    hue: 32,
  },
  {
    id: "sp-snare-rim",
    name: "Rimshot Dry",
    artist: "Black Octopus",
    pack: "Perco Loco",
    type: "oneshot",
    durationMs: 160,
    tags: ["rim", "snare", "dry"],
    voice: "snare",
    popularity: 72,
    hue: 40,
  },
  {
    id: "sp-hat-closed",
    name: "Closed Hat Tight",
    artist: "Sample Magic",
    pack: "Minimal Tools",
    type: "oneshot",
    durationMs: 90,
    tags: ["hat", "closed"],
    voice: "hat",
    popularity: 88,
    hue: 48,
  },
  {
    id: "sp-hat-open",
    name: "Open Hat Airy",
    artist: "Sample Magic",
    pack: "Minimal Tools",
    type: "oneshot",
    durationMs: 520,
    tags: ["hat", "open"],
    voice: "hat",
    popularity: 80,
    hue: 55,
  },
  {
    id: "sp-perc-shaker",
    name: "Shaker Loop 16ths",
    artist: "Native Instruments",
    pack: "World Percussion",
    type: "loop",
    bpm: 120,
    durationMs: 2000,
    tags: ["shaker", "perc", "loop"],
    voice: "perc",
    popularity: 76,
    hue: 70,
  },
  {
    id: "sp-perc-clave",
    name: "Clave Wood",
    artist: "Native Instruments",
    pack: "World Percussion",
    type: "oneshot",
    durationMs: 120,
    tags: ["clave", "wood"],
    voice: "perc",
    popularity: 65,
    hue: 78,
  },
  {
    id: "sp-bass-sub",
    name: "Sub Bass Wob",
    artist: "ADSRsounds",
    pack: "Bass Lab",
    type: "loop",
    bpm: 140,
    key: "A minor",
    durationMs: 1714,
    tags: ["bass", "sub", "wobble"],
    voice: "bass",
    popularity: 93,
    hue: 210,
  },
  {
    id: "sp-bass-pluck",
    name: "Analog Pluck Bass",
    artist: "Output",
    pack: "Analog Essentials",
    type: "oneshot",
    key: "D minor",
    durationMs: 600,
    tags: ["bass", "pluck", "analog"],
    voice: "bass",
    popularity: 81,
    hue: 220,
  },
  {
    id: "sp-lead-pluck",
    name: "Pluck Lead Bright",
    artist: "Splice Originals",
    pack: "Indie Electronic",
    type: "loop",
    bpm: 175,
    key: "D major",
    durationMs: 1371,
    tags: ["lead", "pluck", "indie"],
    voice: "lead",
    popularity: 89,
    hue: 280,
  },
  {
    id: "sp-lead-arp",
    name: "Arp Cascade 1/16",
    artist: "KSHMR",
    pack: "Worlds",
    type: "loop",
    bpm: 128,
    key: "F minor",
    durationMs: 1875,
    tags: ["arp", "lead", "cascade"],
    voice: "lead",
    popularity: 95,
    hue: 300,
  },
  {
    id: "sp-pad-cloud",
    name: "Cloud Pad Wide",
    artist: "Lansdowne",
    pack: "Atmosphere",
    type: "loop",
    bpm: 90,
    key: "C major",
    durationMs: 5333,
    tags: ["pad", "ambient", "wide"],
    voice: "pad",
    popularity: 87,
    hue: 170,
  },
  {
    id: "sp-pad-swell",
    name: "Swell Pad Rise",
    artist: "Lansdowne",
    pack: "Atmosphere",
    type: "oneshot",
    key: "G major",
    durationMs: 3200,
    tags: ["pad", "swell", "rise"],
    voice: "pad",
    popularity: 74,
    hue: 185,
  },
  {
    id: "sp-vox-ah",
    name: "Vocal Ah Soft",
    artist: "Voices of",
    pack: "Session Vocals",
    type: "oneshot",
    key: "A minor",
    durationMs: 1100,
    tags: ["vox", "ah", "soft"],
    voice: "vox",
    popularity: 82,
    hue: 350,
  },
  {
    id: "sp-vox-chop",
    name: "Vocal Chop Phrase",
    artist: "Voices of",
    pack: "Session Vocals",
    type: "loop",
    bpm: 100,
    key: "E minor",
    durationMs: 2400,
    tags: ["vox", "chop", "phrase"],
    voice: "vox",
    popularity: 90,
    hue: 340,
  },
  {
    id: "sp-noise-tape",
    name: "Tape Hiss Bed",
    artist: "RC-20 Pack",
    pack: "Analog Dirt",
    type: "loop",
    durationMs: 4000,
    tags: ["noise", "tape", "hiss"],
    voice: "noise",
    popularity: 70,
    hue: 0,
  },
  {
    id: "sp-loop-drums",
    name: "Breakbeat Dusty 90",
    artist: "Boom Bap Labs",
    pack: "Vinyl Breaks",
    type: "loop",
    bpm: 90,
    durationMs: 2667,
    tags: ["drums", "break", "loop"],
    voice: "loop",
    popularity: 94,
    hue: 18,
  },
  {
    id: "sp-chord-maj7",
    name: "Maj7 Guitar Strum",
    artist: "Fingerstyle Co",
    pack: "Acoustic Chords",
    type: "oneshot",
    key: "D major",
    durationMs: 1800,
    tags: ["chord", "guitar", "maj7"],
    voice: "chord",
    popularity: 78,
    hue: 40,
  },
  {
    id: "sp-chord-synth",
    name: "Synth Stab Minor",
    artist: "Output",
    pack: "Analog Essentials",
    type: "oneshot",
    key: "A minor",
    durationMs: 900,
    tags: ["chord", "synth", "stab"],
    voice: "chord",
    popularity: 85,
    hue: 260,
  },
];

export function getSpliceSample(id: string): SpliceSample | undefined {
  return SPLICE_CATALOG.find((s) => s.id === id);
}

export function searchSplice(
  query: string,
  opts?: { type?: SpliceSample["type"] | "all"; voice?: SampleVoice | "all" },
): SpliceSample[] {
  const q = query.trim().toLowerCase();
  return SPLICE_CATALOG.filter((s) => {
    if (opts?.type && opts.type !== "all" && s.type !== opts.type) return false;
    if (opts?.voice && opts.voice !== "all" && s.voice !== opts.voice) return false;
    if (!q) return true;
    const hay = `${s.name} ${s.artist} ${s.pack} ${s.tags.join(" ")} ${s.key ?? ""}`.toLowerCase();
    return hay.includes(q);
  }).sort((a, b) => b.popularity - a.popularity);
}

export function voiceForTrackName(name: string): SampleVoice {
  const n = name.toLowerCase();
  if (/kick|kit|drum/.test(n)) return "kick";
  if (/snare/.test(n)) return "snare";
  if (/hat|hh/.test(n)) return "hat";
  if (/bass/.test(n)) return "bass";
  if (/lead|synth/.test(n)) return "lead";
  if (/pad|cloud/.test(n)) return "pad";
  if (/vox|vocal|harm/.test(n)) return "vox";
  if (/noise|hiss|tape/.test(n)) return "noise";
  if (/perc|shaker/.test(n)) return "perc";
  return "loop";
}
