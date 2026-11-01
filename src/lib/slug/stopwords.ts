export const ENGLISH_STOP_WORDS = [
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "from",
  "in",
  "into",
  "nor",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
] as const;

export const SPANISH_STOP_WORDS = [
  "a",
  "al",
  "con",
  "de",
  "del",
  "el",
  "en",
  "la",
  "las",
  "los",
  "o",
  "para",
  "por",
  "un",
  "una",
  "y",
] as const;

export const GERMAN_STOP_WORDS = [
  "am",
  "an",
  "aus",
  "das",
  "der",
  "die",
  "ein",
  "eine",
  "einer",
  "für",
  "im",
  "in",
  "mit",
  "oder",
  "und",
  "von",
  "zu",
] as const;

export const FRENCH_STOP_WORDS = [
  "au",
  "aux",
  "avec",
  "d",
  "dans",
  "de",
  "des",
  "du",
  "en",
  "et",
  "l",
  "la",
  "le",
  "les",
  "ou",
  "pour",
  "sur",
  "un",
  "une",
] as const;

export const PORTUGUESE_STOP_WORDS = [
  "a",
  "as",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "no",
  "o",
  "os",
  "ou",
  "para",
  "por",
  "um",
  "uma",
] as const;

const STOP_MAP: Record<string, ReadonlySet<string>> = {
  en: new Set<string>(ENGLISH_STOP_WORDS),
  es: new Set<string>(SPANISH_STOP_WORDS),
  de: new Set<string>(GERMAN_STOP_WORDS),
  fr: new Set<string>(FRENCH_STOP_WORDS),
  pt: new Set<string>(PORTUGUESE_STOP_WORDS),
};

export function getStopWords(locale: string = "en"): ReadonlySet<string> {
  return STOP_MAP[locale] ?? STOP_MAP.en;
}

export function applyStopWords(tokens: string[], locale: string = "en"): { tokens: string[]; removed: boolean } {
  const set = getStopWords(locale);
  const kept = tokens.filter((token) => !set.has(token));
  if (kept.length === 0) return { tokens, removed: false };
  return { tokens: kept, removed: kept.length !== tokens.length };
}
