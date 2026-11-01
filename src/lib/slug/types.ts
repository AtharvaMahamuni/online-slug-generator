export type Separator = "-" | "_";
export type LetterPolicy = "latin-ascii" | "preserve";
export type PresetId = "readable" | "short" | "preserve" | "custom";
export type SupportedLocale = "en" | "es" | "de" | "fr" | "pt";

export type SlugConfig = {
  separator: Separator;
  lowercase: boolean;
  letterPolicy: LetterPolicy;
  stopWords: boolean;
  removeNumbers: boolean;
  ampersandToAnd: boolean;
  maxLength: number | null;
  locale: SupportedLocale;
};

export type SlugFlags = {
  truncated: boolean;
  transliterated: boolean;
  stopWordsRemoved: boolean;
  numbersRemoved: boolean;
  htmlStripped: boolean;
  empty: boolean;
};

export type SlugResult = {
  original: string;
  cleaned: string;
  slug: string;
  flags: SlugFlags;
};

export type BatchRow = SlugResult & {
  duplicate: boolean;
  lengthWarning: boolean;
};

export const SETTINGS_VERSION = 1;

export type StoredSettings = {
  version: typeof SETTINGS_VERSION;
  config: SlugConfig;
  preset: PresetId;
  urlPreview: boolean;
  urlPrefix: string;
};
