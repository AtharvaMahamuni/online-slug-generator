import { cleanText } from "./clean";
import { assignDuplicates } from "./duplicates";
import { foldLatinAscii } from "./letters";
import { DEFAULT_CONFIG } from "./presets";
import { applyStopWords } from "./stopwords";
import type { BatchRow, SlugConfig, SlugFlags, SlugResult } from "./types";

function codePoints(value: string): string[] {
  return [...value];
}

export function applyMaxLength(
  slug: string,
  maxLength: number | null,
  separator: string,
): { slug: string; truncated: boolean } {
  if (maxLength === null || maxLength < 0 || !Number.isFinite(maxLength)) {
    return { slug, truncated: false };
  }
  const chars = codePoints(slug);
  if (chars.length <= maxLength) return { slug, truncated: false };
  if (maxLength === 0) return { slug: "", truncated: true };

  const slice = chars.slice(0, maxLength).join("");
  const next = chars[maxLength];
  const boundary = next === separator || slice.endsWith(separator);
  if (boundary) {
    const trimmed = slice.replace(new RegExp(`${escapeRegExp(separator)}+$`), "");
    return { slug: trimmed, truncated: true };
  }
  const lastSep = slice.lastIndexOf(separator);
  if (lastSep > 0) return { slug: slice.slice(0, lastSep), truncated: true };
  return { slug: slice, truncated: true };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function filterRuns(
  input: string,
  separator: string,
  removeNumbers: boolean,
): { slug: string; numbersRemoved: boolean } {
  let slug = "";
  let pending = false;
  let numbersRemoved = false;

  for (const ch of input) {
    if (/\p{L}/u.test(ch)) {
      if (pending && slug) slug += separator;
      pending = false;
      slug += ch;
      continue;
    }
    if (/\p{N}/u.test(ch)) {
      if (removeNumbers) {
        numbersRemoved = true;
        pending = true;
        continue;
      }
      if (pending && slug) slug += separator;
      pending = false;
      slug += ch;
      continue;
    }
    pending = true;
  }

  return { slug, numbersRemoved };
}

const AMPERSAND_MAP: Record<string, string> = {
  en: " and ",
  es: " y ",
  de: " und ",
  fr: " et ",
  pt: " e ",
};

export function slugify(
  original: string,
  config: SlugConfig = DEFAULT_CONFIG,
  extra?: { htmlStripped?: boolean },
): SlugResult {
  const separator = config.separator === "_" ? "_" : "-";
  const cleaned = cleanText(original);
  let working = cleaned;

  if (config.ampersandToAnd) {
    working = working.replaceAll("&", AMPERSAND_MAP[config.locale] ?? " and ");
  }

  let transliterated = false;
  if (config.letterPolicy === "latin-ascii") {
    const folded = foldLatinAscii(working, config.locale);
    working = folded.text;
    transliterated = folded.transliterated;
  }

  if (config.lowercase) {
    working = working.toLocaleLowerCase(config.locale);
  }

  const filtered = filterRuns(working, separator, config.removeNumbers);
  let tokens = filtered.slug ? filtered.slug.split(separator) : [];
  let stopWordsRemoved = false;
  if (config.stopWords && tokens.length) {
    const stopped = applyStopWords(tokens, config.locale);
    tokens = stopped.tokens;
    stopWordsRemoved = stopped.removed;
  }

  let slug = tokens.join(separator);
  const limited = applyMaxLength(slug, config.maxLength, separator);
  slug = limited.slug;

  const flags: SlugFlags = {
    truncated: limited.truncated,
    transliterated,
    stopWordsRemoved,
    numbersRemoved: filtered.numbersRemoved,
    htmlStripped: extra?.htmlStripped === true,
    empty: slug.length === 0,
  };

  return { original, cleaned, slug, flags };
}

export function slugifyBatch(
  inputs: string[],
  config: SlugConfig = DEFAULT_CONFIG,
  extras?: Array<{ htmlStripped?: boolean } | undefined>,
): BatchRow[] {
  const preliminary = inputs.map((input, index) => slugify(input, config, extras?.[index]));
  const assigned = assignDuplicates(
    preliminary.map((row) => row.slug),
    config.separator === "_" ? "_" : "-",
    config.maxLength,
  );
  return preliminary.map((row, index) => {
    const next = assigned[index] ?? { slug: row.slug, duplicate: false, lengthWarning: false };
    return {
      ...row,
      slug: next.slug,
      duplicate: next.duplicate,
      lengthWarning: next.lengthWarning,
      flags: {
        ...row.flags,
        empty: next.slug.length === 0,
      },
    };
  });
}

export function changeNote(result: Pick<SlugResult, "slug" | "flags"> & { preservedNonLatin?: boolean }): string {
  const notes: string[] = [];
  if (result.flags.htmlStripped) notes.push("HTML tags were removed");
  if (result.flags.transliterated) notes.push("Latin accents were folded to ASCII");
  if (result.flags.stopWordsRemoved) notes.push("stop words were removed");
  if (result.flags.numbersRemoved) notes.push("numbers were removed");
  if (result.flags.truncated) notes.push("the slug was shortened");
  if (result.preservedNonLatin) notes.push("non-Latin characters were kept");
  if (result.flags.empty && result.slug === "") notes.push("no letters or numbers were left to keep");
  if (!notes.length) return "";
  const sentence = notes.join(", ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}
