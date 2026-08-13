import type { PluginRef } from "./types";

/** Known plugin catalog — used for intelligent ALS/project scanning */
export const PLUGIN_CATALOG: Record<string, PluginRef> = {
  "ableton-eq8": {
    id: "ableton-eq8",
    name: "EQ Eight",
    vendor: "Ableton",
    format: "Native",
    version: "12.0",
    category: "EQ",
  },
  "ableton-compressor": {
    id: "ableton-compressor",
    name: "Compressor",
    vendor: "Ableton",
    format: "Native",
    version: "12.0",
    category: "Dynamics",
  },
  "ableton-reverb": {
    id: "ableton-reverb",
    name: "Reverb",
    vendor: "Ableton",
    format: "Native",
    version: "12.0",
    category: "Space",
  },
  "ableton-operator": {
    id: "ableton-operator",
    name: "Operator",
    vendor: "Ableton",
    format: "Native",
    version: "12.0",
    category: "Synth",
  },
  "ableton-wavetable": {
    id: "ableton-wavetable",
    name: "Wavetable",
    vendor: "Ableton",
    format: "Native",
    version: "12.0",
    category: "Synth",
  },
  "ableton-simpler": {
    id: "ableton-simpler",
    name: "Simpler",
    vendor: "Ableton",
    format: "Native",
    version: "12.0",
    category: "Sampler",
  },
  "ableton-drum-rack": {
    id: "ableton-drum-rack",
    name: "Drum Rack",
    vendor: "Ableton",
    format: "Rack",
    version: "12.0",
    category: "Drums",
  },
  "serum2": {
    id: "serum2",
    name: "Serum 2",
    vendor: "Xfer Records",
    format: "VST3",
    version: "2.0.19",
    category: "Synth",
  },
  "valhalla-vintageverb": {
    id: "valhalla-vintageverb",
    name: "ValhallaVintageVerb",
    vendor: "Valhalla DSP",
    format: "VST3",
    version: "3.0.1",
    category: "Space",
  },
  "fabfilter-pro-q3": {
    id: "fabfilter-pro-q3",
    name: "Pro-Q 3",
    vendor: "FabFilter",
    format: "VST3",
    version: "3.26",
    category: "EQ",
  },
  "fabfilter-pro-c2": {
    id: "fabfilter-pro-c2",
    name: "Pro-C 2",
    vendor: "FabFilter",
    format: "VST3",
    version: "2.18",
    category: "Dynamics",
  },
  "soundtoys-echoboy": {
    id: "soundtoys-echoboy",
    name: "EchoBoy",
    vendor: "Soundtoys",
    format: "VST3",
    version: "5.4.1",
    category: "Delay",
  },
  "uad-1176": {
    id: "uad-1176",
    name: "1176 Classic Limiter",
    vendor: "Universal Audio",
    format: "VST3",
    version: "10.2",
    category: "Dynamics",
  },
  "rc20": {
    id: "rc20",
    name: "RC-20 Retro Color",
    vendor: "XLN Audio",
    format: "VST3",
    version: "1.3.2",
    category: "Color",
  },
  "max-for-live-grain": {
    id: "max-for-live-grain",
    name: "Granulator III",
    vendor: "Ableton",
    format: "Max",
    version: "1.0",
    category: "Experimental",
  },
  "max-for-live-lfo": {
    id: "max-for-live-lfo",
    name: "LFO",
    vendor: "Ableton",
    format: "Max",
    version: "1.0",
    category: "Mod",
  },
  "ozone-imager": {
    id: "ozone-imager",
    name: "Ozone Imager",
    vendor: "iZotope",
    format: "VST3",
    version: "2.2",
    category: "Imaging",
  },
  "kontakt": {
    id: "kontakt",
    name: "Kontakt 7",
    vendor: "Native Instruments",
    format: "VST3",
    version: "7.10",
    category: "Sampler",
  },
  "omnisphere": {
    id: "omnisphere",
    name: "Omnisphere",
    vendor: "Spectrasonics",
    format: "VST3",
    version: "2.8",
    category: "Synth",
  },
  "decapitator": {
    id: "decapitator",
    name: "Decapitator",
    vendor: "Soundtoys",
    format: "VST3",
    version: "5.4.1",
    category: "Saturation",
  },
};

export function getPlugin(id: string): PluginRef | undefined {
  return PLUGIN_CATALOG[id];
}

export function isThirdParty(pluginId: string): boolean {
  const p = PLUGIN_CATALOG[pluginId];
  if (!p) return true;
  return p.vendor !== "Ableton" || p.format === "Max" || p.format === "VST3" || p.format === "AU";
}

/** True if collaborator without this plugin can still open the session safely when frozen */
export function needsFreeze(pluginId: string): boolean {
  const p = PLUGIN_CATALOG[pluginId];
  if (!p) return true;
  if (p.format === "Max") return true;
  if (p.vendor !== "Ableton") return true;
  return false;
}
