import type { DeviceClass, LicenseClass, PluginRef } from "./types";

function plug(
  id: string,
  name: string,
  vendor: string,
  format: PluginRef["format"],
  version: string,
  category: string,
  deviceClass: DeviceClass,
  licenseClass: LicenseClass,
  identityKey: string,
): PluginRef {
  return {
    id,
    name,
    vendor,
    format,
    version,
    category,
    deviceClass,
    licenseClass,
    identityKey,
  };
}

/** Known plugin catalog — identity is never display-name alone (FR-E-01). */
export const PLUGIN_CATALOG: Record<string, PluginRef> = {
  "ableton-eq8": plug(
    "ableton-eq8",
    "EQ Eight",
    "Ableton",
    "Native",
    "12.0",
    "EQ",
    "stock",
    "paid-perpetual",
    "live:eq8",
  ),
  "ableton-compressor": plug(
    "ableton-compressor",
    "Compressor",
    "Ableton",
    "Native",
    "12.0",
    "Dynamics",
    "stock",
    "paid-perpetual",
    "live:compressor",
  ),
  "ableton-reverb": plug(
    "ableton-reverb",
    "Reverb",
    "Ableton",
    "Native",
    "12.0",
    "Space",
    "stock",
    "paid-perpetual",
    "live:reverb",
  ),
  "ableton-operator": plug(
    "ableton-operator",
    "Operator",
    "Ableton",
    "Native",
    "12.0",
    "Synth",
    "stock",
    "paid-perpetual",
    "live:operator",
  ),
  "ableton-wavetable": plug(
    "ableton-wavetable",
    "Wavetable",
    "Ableton",
    "Native",
    "12.0",
    "Synth",
    "stock",
    "paid-perpetual",
    "live:wavetable",
  ),
  "ableton-simpler": plug(
    "ableton-simpler",
    "Simpler",
    "Ableton",
    "Native",
    "12.0",
    "Sampler",
    "stock",
    "paid-perpetual",
    "live:simpler",
  ),
  "ableton-drum-rack": plug(
    "ableton-drum-rack",
    "Drum Rack",
    "Ableton",
    "Rack",
    "12.0",
    "Drums",
    "stock",
    "paid-perpetual",
    "live:drum-rack",
  ),
  serum2: plug(
    "serum2",
    "Serum 2",
    "Xfer Records",
    "VST3",
    "2.0.19",
    "Synth",
    "third-party",
    "paid-perpetual",
    "vst3:XFER:Sr2 ",
  ),
  "valhalla-vintageverb": plug(
    "valhalla-vintageverb",
    "ValhallaVintageVerb",
    "Valhalla DSP",
    "VST3",
    "3.0.1",
    "Space",
    "third-party",
    "paid-perpetual",
    "vst3:VALH:VvVb",
  ),
  "fabfilter-pro-q3": plug(
    "fabfilter-pro-q3",
    "Pro-Q 3",
    "FabFilter",
    "VST3",
    "3.26",
    "EQ",
    "third-party",
    "paid-perpetual",
    "vst3:FabF:PrQ3",
  ),
  "fabfilter-pro-c2": plug(
    "fabfilter-pro-c2",
    "Pro-C 2",
    "FabFilter",
    "VST3",
    "2.18",
    "Dynamics",
    "third-party",
    "paid-perpetual",
    "vst3:FabF:PrC2",
  ),
  "soundtoys-echoboy": plug(
    "soundtoys-echoboy",
    "EchoBoy",
    "Soundtoys",
    "VST3",
    "5.4.1",
    "Delay",
    "third-party",
    "paid-perpetual",
    "vst3:SToy:EcBy",
  ),
  "uad-1176": plug(
    "uad-1176",
    "1176 Classic Limiter",
    "Universal Audio",
    "VST3",
    "10.2",
    "Dynamics",
    "third-party",
    "dongle",
    "vst3:UAD :1176",
  ),
  rc20: plug(
    "rc20",
    "RC-20 Retro Color",
    "XLN Audio",
    "VST3",
    "1.3.2",
    "Color",
    "third-party",
    "paid-perpetual",
    "vst3:XLNA:RC20",
  ),
  "max-for-live-grain": plug(
    "max-for-live-grain",
    "Granulator III",
    "Ableton",
    "Max",
    "1.0",
    "Experimental",
    "max-for-live",
    "paid-perpetual",
    "m4l:granulator-iii",
  ),
  "max-for-live-lfo": plug(
    "max-for-live-lfo",
    "LFO",
    "Ableton",
    "Max",
    "1.0",
    "Mod",
    "max-for-live",
    "paid-perpetual",
    "m4l:lfo",
  ),
  "ozone-imager": plug(
    "ozone-imager",
    "Ozone Imager",
    "iZotope",
    "VST3",
    "2.2",
    "Imaging",
    "third-party",
    "subscription",
    "vst3:iZtp:OzIm",
  ),
  kontakt: plug(
    "kontakt",
    "Kontakt 7",
    "Native Instruments",
    "VST3",
    "7.10",
    "Sampler",
    "third-party",
    "paid-perpetual",
    "vst3:Ni  :Ko7 ",
  ),
  omnisphere: plug(
    "omnisphere",
    "Omnisphere",
    "Spectrasonics",
    "VST3",
    "2.8",
    "Synth",
    "third-party",
    "paid-perpetual",
    "vst3:Spct:Omni",
  ),
  decapitator: plug(
    "decapitator",
    "Decapitator",
    "Soundtoys",
    "VST3",
    "5.4.1",
    "Saturation",
    "third-party",
    "paid-perpetual",
    "vst3:SToy:Dcpt",
  ),
};

export const STOCK_PLUGIN_IDS = Object.values(PLUGIN_CATALOG)
  .filter((p) => p.deviceClass === "stock")
  .map((p) => p.id);

export function getPlugin(id: string): PluginRef | undefined {
  return PLUGIN_CATALOG[id];
}

export function pluginClass(pluginId: string): DeviceClass {
  return PLUGIN_CATALOG[pluginId]?.deviceClass ?? "unknown";
}

export function isThirdParty(pluginId: string): boolean {
  const cls = pluginClass(pluginId);
  return cls === "third-party" || cls === "max-for-live" || cls === "unknown";
}

/** True if a collaborator without this plugin needs a freeze to open the set. */
export function needsFreeze(pluginId: string): boolean {
  return isThirdParty(pluginId);
}

export function licenseWarning(pluginId: string): string | null {
  const p = PLUGIN_CATALOG[pluginId];
  if (!p) return null;
  if (p.licenseClass === "dongle") {
    return "Dongle / iLok — having the file is not having access.";
  }
  if (p.licenseClass === "subscription") {
    return "Subscription — access can lapse without uninstalling.";
  }
  return null;
}
