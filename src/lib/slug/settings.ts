import { DEFAULT_CONFIG, presetMatches } from "./presets";
import { SETTINGS_VERSION, type PresetId, type SlugConfig, type StoredSettings, type SupportedLocale } from "./types";

export function defaultSettings(): StoredSettings {
  return {
    version: SETTINGS_VERSION,
    config: { ...DEFAULT_CONFIG },
    preset: "readable",
    urlPreview: false,
    urlPrefix: "",
  };
}

export function parseStoredSettings(raw: unknown): StoredSettings {
  if (!raw || typeof raw !== "object") return defaultSettings();
  const record = raw as Record<string, unknown>;
  if (record.version !== SETTINGS_VERSION) return defaultSettings();
  const config = parseConfig(record.config);
  if (!config) return defaultSettings();
  const preset = parsePreset(record.preset, config);
  return {
    version: SETTINGS_VERSION,
    config,
    preset,
    urlPreview: record.urlPreview === true,
    urlPrefix: typeof record.urlPrefix === "string" ? record.urlPrefix.slice(0, 200) : "",
  };
}

export function parseStoredJson(text: string | null): StoredSettings {
  if (!text) return defaultSettings();
  try {
    return parseStoredSettings(JSON.parse(text));
  } catch {
    return defaultSettings();
  }
}

function parseConfig(value: unknown): SlugConfig | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const separator = record.separator === "_" ? "_" : record.separator === "-" ? "-" : null;
  const letterPolicy = record.letterPolicy === "preserve" || record.letterPolicy === "latin-ascii" ? record.letterPolicy : null;
  if (!separator || !letterPolicy) return null;
  if (typeof record.lowercase !== "boolean") return null;
  if (typeof record.stopWords !== "boolean") return null;
  if (typeof record.removeNumbers !== "boolean") return null;
  if (typeof record.ampersandToAnd !== "boolean") return null;
  const isSupportedLocale = (loc: unknown): loc is SupportedLocale =>
    loc === "en" || loc === "es" || loc === "de" || loc === "fr" || loc === "pt";
  if (!isSupportedLocale(record.locale)) return null;
  let maxLength: number | null = null;
  if (record.maxLength !== null) {
    if (typeof record.maxLength !== "number" || !Number.isFinite(record.maxLength) || record.maxLength < 0) return null;
    maxLength = Math.floor(record.maxLength);
  }
  return {
    separator,
    lowercase: record.lowercase,
    letterPolicy,
    stopWords: record.stopWords,
    removeNumbers: record.removeNumbers,
    ampersandToAnd: record.ampersandToAnd,
    maxLength,
    locale: "en",
  };
}

function parsePreset(value: unknown, config: SlugConfig): PresetId {
  const matched = presetMatches(config);
  if (value === "readable" || value === "short" || value === "preserve") {
    return value === matched ? value : matched;
  }
  return matched;
}
