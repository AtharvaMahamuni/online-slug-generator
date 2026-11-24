import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assignDuplicates } from "../../src/lib/slug/duplicates";
import { slugify } from "../../src/lib/slug/pipeline";
import { PRESETS } from "../../src/lib/slug/presets";
import type { SlugConfig } from "../../src/lib/slug/types";

const pagesDir = path.resolve("src/pages");

function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else found.push(full);
  }
  return found;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parseJsStringArray(source: string): string[] {
  const items: string[] = [];
  const re = /"((?:\\.|[^"\\])*)"/g;
  for (const match of source.matchAll(re)) {
    items.push(JSON.parse(`"${match[1]}"`));
  }
  return items;
}

type PublishedExample = {
  file: string;
  title: string;
  slug: string;
  config: SlugConfig;
  via?: "duplicate";
};

function examplesFromExampleTables(source: string, file: string): PublishedExample[] {
  const found: PublishedExample[] = [];
  const tableRe = /<ExampleTable\b[\s\S]*?headers=\{\[([^\]]*)\]\}[\s\S]*?rows=\{\[([\s\S]*?)\]\s*\}/g;
  for (const match of source.matchAll(tableRe)) {
    const headers = parseJsStringArray(match[1]);
    const rowChunks = [...match[2].matchAll(/\[[^\]]*\]/g)].map((row) => parseJsStringArray(row[0]));
    const titleIndex = headers.findIndex((header) => /^(title|page title|product name)$/i.test(header));
    const readableIndex = headers.findIndex((header) => /readable url|generated slug|^slug$/i.test(header));
    const shortIndex = headers.findIndex((header) => /short permalink/i.test(header));
    const keepIndex = headers.findIndex((header) => /keep original script/i.test(header));
    const asciiIndex = headers.findIndex((header) => /latin accents to ascii/i.test(header));
    for (const row of rowChunks) {
      const title = titleIndex >= 0 ? row[titleIndex] : undefined;
      if (!title) continue;
      if (readableIndex >= 0 && row[readableIndex]) {
        found.push({ file, title, slug: row[readableIndex], config: PRESETS.readable });
      }
      if (shortIndex >= 0 && row[shortIndex]) {
        found.push({ file, title, slug: row[shortIndex], config: PRESETS.short });
      }
      if (asciiIndex >= 0 && row[asciiIndex]) {
        found.push({ file, title, slug: row[asciiIndex], config: PRESETS.readable });
      }
      if (keepIndex >= 0 && row[keepIndex]) {
        found.push({ file, title, slug: row[keepIndex], config: PRESETS.preserve });
      }
    }
  }
  return found;
}

function examplesFromHtmlTables(source: string, file: string): PublishedExample[] {
  const found: PublishedExample[] = [];
  const tableRe = /<table\b[\s\S]*?<\/table>/g;
  for (const table of source.matchAll(tableRe)) {
    const headerCells = [...table[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((cell) =>
      decodeEntities(cell[1].replace(/<[^>]+>/g, "").trim()),
    );
    if (headerCells.length === 0) continue;
    const titleIndex = headerCells.findIndex((header) => /^(title|page title)$/i.test(header));
    if (titleIndex < 0) continue;
    const readableIndex = headerCells.findIndex((header) =>
      /^(slug|latin accents to ascii)$/i.test(header),
    );
    const keepIndex = headerCells.findIndex((header) => /keep original script/i.test(header));
    for (const row of table[0].matchAll(/<tr>[\s\S]*?<\/tr>/g)) {
      if (/<th scope="col">/.test(row[0])) continue;
      const cells = [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((cell) =>
        decodeEntities(cell[1].replace(/<\/?code>/g, "").replace(/<[^>]+>/g, "").trim()),
      );
      const title = cells[titleIndex];
      if (!title) continue;
      if (readableIndex >= 0 && cells[readableIndex]) {
        found.push({ file, title, slug: cells[readableIndex], config: PRESETS.readable });
      }
      if (keepIndex >= 0 && cells[keepIndex]) {
        found.push({ file, title, slug: cells[keepIndex], config: PRESETS.preserve });
      }
    }
  }
  return found;
}

function presetFromContext(context: string): { config: SlugConfig; via?: "duplicate" } {
  const lower = context.toLowerCase();
  if (/duplicate|identical name appears again|second .+ becomes/.test(lower) && /-\d+$/.test(lower) === false) {
    // handled by caller when slug ends with -2
  }
  if (lower.includes("ampersand option is off") || lower.includes("ampersand has been expanded") === false && lower.includes("option off")) {
    if (lower.includes("with the option off") || lower.includes("ampersand option off") || lower.includes("ampersand is punctuation")) {
      return { config: { ...PRESETS.readable, ampersandToAnd: false } };
    }
  }
  if (
    lower.includes("short permalink") ||
    lower.includes("stop words on") ||
    lower.includes("stop list") ||
    lower.includes("turn the option on") ||
    lower.includes("that preset can drop")
  ) {
    return { config: PRESETS.short };
  }
  if (lower.includes("keep original script") || /\bkeep control\b/.test(lower) || lower.includes("keep leaves")) {
    return { config: PRESETS.preserve };
  }
  return { config: PRESETS.readable };
}

function examplesFromProse(source: string, file: string): PublishedExample[] {
  const found: PublishedExample[] = [];
  const body = source.replace(/^---[\s\S]*?---/, "");
  const pattern =
    /(?:[“"]|<em>)([^”"<]+)(?:[”"]|<\/em>)\s+(?:becomes|stays)\s+<code>([^<]+)<\/code>/g;
  for (const match of body.matchAll(pattern)) {
    const title = decodeEntities(match[1].trim());
    const slug = decodeEntities(match[2].trim());
    if (slug.includes("%")) continue;
    const sentenceStart = Math.max(0, body.lastIndexOf(".", match.index) + 1);
    const after = body.indexOf(".", match.index + match[0].length);
    const sentenceEnd = after === -1 ? body.length : after + 1;
    const sentence = body.slice(sentenceStart, sentenceEnd);
    if (/does not become/i.test(sentence)) continue;
    if (/-\d+$/.test(slug) && /duplicate|identical name|second /i.test(sentence)) {
      found.push({ file, title, slug, config: PRESETS.readable, via: "duplicate" });
      continue;
    }
    const verb = /stays\s+<code>/.test(match[0]) ? "stays" : "becomes";
    const prevStart = Math.max(0, body.lastIndexOf(".", sentenceStart - 2) + 1);
    const context = verb === "stays" ? sentence : body.slice(prevStart, sentenceEnd);
    const config =
      verb === "stays" && !/short permalink|stop words on|keep original script/i.test(sentence)
        ? PRESETS.readable
        : presetFromContext(context).config;
    found.push({ file, title, slug, config });
  }

  // Unquoted forms such as "Straße becomes <code>strasse</code>" and "Café becomes <code>cafe</code>".
  const unquoted =
    /(?<![“"\w])(Straße|Café|Ærø|Привет|東京|iPhone 17 Pro|AT&amp;T)(?: au lait)? becomes <code>([^<]+)<\/code>/g;
  for (const match of body.matchAll(unquoted)) {
    const rawTitle = decodeEntities(match[1] + (match[0].includes(" au lait") ? " au lait" : ""));
    const slug = decodeEntities(match[2]);
    const start = Math.max(0, match.index - 200);
    const context = body.slice(start, match.index + match[0].length);
    found.push({ file, title: rawTitle, slug, config: presetFromContext(context).config });
  }
  return found;
}

function actualSlug(example: PublishedExample): string {
  if (example.via === "duplicate") {
    const base = slugify(example.title, example.config).slug;
    return assignDuplicates([base, base], example.config.separator, example.config.maxLength)[1]?.slug ?? "";
  }
  return slugify(example.title, example.config).slug;
}

describe("published examples", () => {
  it("matches the home table", () => {
    const rows: Array<[string, string, string]> = [
      ["How to Prune Roses in June", "how-to-prune-roses-in-june", "how-prune-roses-june"],
      ["Café au lait, 12 oz", "cafe-au-lait-12-oz", "cafe-au-lait-12-oz"],
      ["AT&T fiber plans & pricing", "at-and-t-fiber-plans-and-pricing", "t-fiber-plans-pricing"],
    ];
    for (const [title, readable, short] of rows) {
      expect(slugify(title, PRESETS.readable).slug).toBe(readable);
      expect(slugify(title, PRESETS.short).slug).toBe(short);
    }
  });

  it("matches the unicode guide table", () => {
    expect(slugify("Café", PRESETS.readable).slug).toBe("cafe");
    expect(slugify("Café", PRESETS.preserve).slug).toBe("café");
    expect(slugify("Straße", PRESETS.readable).slug).toBe("strasse");
    expect(slugify("Straße", PRESETS.preserve).slug).toBe("straße");
    expect(slugify("Привет", PRESETS.readable).slug).toBe("привет");
    expect(slugify("Привет", PRESETS.preserve).slug).toBe("привет");
    expect(slugify("東京", PRESETS.readable).slug).toBe("東京");
    expect(slugify("東京", PRESETS.preserve).slug).toBe("東京");
    expect(slugify("Café au lait", PRESETS.preserve).slug).toBe("café-au-lait");
    expect(slugify("Café in 東京, 12", PRESETS.readable).slug).toBe("cafe-in-東京-12");
  });

  it("turns an ampersand into a separator when the and-rule is off", () => {
    const config: SlugConfig = { ...PRESETS.readable, ampersandToAnd: false };
    expect(slugify("AT&T fiber plans", config).slug).toBe("at-t-fiber-plans");
    expect(slugify("AT&T", PRESETS.readable).slug).toBe("at-and-t");
  });

  it("matches every slug shown in ExampleTables and page copy under the stated preset", () => {
    const files = walk(pagesDir).filter((file) => file.endsWith(".astro"));
    const examples: PublishedExample[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const rel = path.relative(pagesDir, file).split(path.sep).join("/");
      examples.push(
        ...examplesFromExampleTables(source, rel),
        ...examplesFromHtmlTables(source, rel),
        ...examplesFromProse(source, rel),
      );
    }
    expect(examples.length).toBeGreaterThan(20);
    const seen = new Set<string>();
    for (const example of examples) {
      const key = `${example.file}::${example.title}::${example.slug}::${example.config.letterPolicy}::${example.config.stopWords}::${example.via ?? "slugify"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      expect(actualSlug(example), key).toBe(example.slug);
    }
  });

  it("documents the bulk page apostrophe example against the default preset", () => {
    expect(slugify("Men's Trail Running Shoes (Navy / Size 10)", PRESETS.readable).slug).toBe(
      "men-s-trail-running-shoes-navy-size-10",
    );
    expect(slugify("Men's Trail Running Shoes (Navy / 10)", PRESETS.readable).slug).toBe(
      "men-s-trail-running-shoes-navy-10",
    );
  });
});
