import type { PresetId, SlugConfig } from "./types";

export const DEFAULT_CONFIG: SlugConfig = {
  separator: "-",
  lowercase: true,
  letterPolicy: "latin-ascii",
  stopWords: false,
  removeNumbers: false,
  ampersandToAnd: true,
  maxLength: null,
  locale: "en",
};

export const PRESETS: Record<Exclude<PresetId, "custom">, SlugConfig> = {
  readable: { ...DEFAULT_CONFIG },
  short: {
    ...DEFAULT_CONFIG,
    stopWords: true,
    maxLength: 60,
  },
  preserve: {
    ...DEFAULT_CONFIG,
    letterPolicy: "preserve",
    lowercase: true,
  },
};

export function presetMatches(config: SlugConfig): PresetId {
  const keys = Object.keys(PRESETS) as Array<Exclude<PresetId, "custom">>;
  for (const key of keys) {
    if (sameConfig(config, PRESETS[key])) return key;
  }
  return "custom";
}

export function sameConfig(a: SlugConfig, b: SlugConfig): boolean {
  return (
    a.separator === b.separator &&
    a.lowercase === b.lowercase &&
    a.letterPolicy === b.letterPolicy &&
    a.stopWords === b.stopWords &&
    a.removeNumbers === b.removeNumbers &&
    a.ampersandToAnd === b.ampersandToAnd &&
    a.maxLength === b.maxLength &&
    a.locale === b.locale
  );
}
