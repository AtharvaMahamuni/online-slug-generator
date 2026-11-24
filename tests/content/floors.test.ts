import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pages = path.resolve("src/pages");
const publicDir = path.resolve("public");
const srcDir = path.resolve("src");

function read(relative: string): string {
  return readFileSync(path.join(pages, relative), "utf8");
}

function template(source: string): string {
  return source.replace(/^---[\s\S]*?---/, "");
}

function words(text: string): number {
  const plain = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\{[^}]*\}/g, " ");
  return plain.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word)).length;
}

function description(source: string): string {
  const match = source.match(/const description =\s*"([^"]*)"/);
  if (!match) throw new Error("Missing description");
  return match[1] ?? "";
}

function title(source: string): string {
  const match = source.match(/const title = "([^"]*)"/);
  if (!match) throw new Error("Missing title");
  return match[1] ?? "";
}

const retitled = [
  "index.astro",
  "bulk-slug-generator.astro",
  "about.astro",
  "guides/index.astro",
  "guides/what-is-a-url-slug.astro",
  "guides/how-to-create-url-slugs.astro",
  "guides/hyphens-vs-underscores-in-urls.astro",
  "guides/unicode-and-international-urls.astro",
];

function sourceDeclaresNoindex(source: string): boolean {
  return (
    /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(source) ||
    /content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(source)
  );
}

function liveGuides(): string[] {
  return readdirSync(path.join(pages, "guides"))
    .filter((file) => file.endsWith(".astro") && file !== "index.astro")
    .filter((file) => !sourceDeclaresNoindex(read(`guides/${file}`)))
    .map((file) => `guides/${file}`)
    .sort();
}

const guides = liveGuides();

function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else found.push(full);
  }
  return found;
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

describe("content floors", () => {
  it("keeps the home knowledge layer at 500 words or more", () => {
    const body = template(read("index.astro"));
    const countable = body.slice(body.indexOf("data-countable"));
    expect(words(countable)).toBeGreaterThanOrEqual(500);
  });

  it("keeps the about page at 400 words or more", () => {
    expect(words(template(read("about.astro")))).toBeGreaterThanOrEqual(400);
  });

  it("keeps each guide at 1,200 words or more", () => {
    for (const guide of guides) {
      expect(words(template(read(guide))), guide).toBeGreaterThanOrEqual(1200);
    }
  });
});

describe("metadata", () => {
  const files = readdirSync(pages, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".astro") && !file.endsWith("404.astro"));

  it("keeps retitled English pages to 60 or fewer characters, with no dashes and no bare ampersand", () => {
    for (const file of retitled) {
      const value = title(read(file));
      expect(value.length, file).toBeLessThanOrEqual(60);
      expect(value, file).not.toMatch(/\u2013|\u2014/);
      expect(value, file).not.toContain("&");
    }
  });

  it("uses a unique description of 120 to 160 characters on every indexable page", () => {
    const descriptions = files.map((file) => description(read(file)));
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const value of descriptions) {
      expect(value.length).toBeGreaterThanOrEqual(120);
      expect(value.length).toBeLessThanOrEqual(160);
    }
  });

  it("does not emit retired or invented schema, or a tracker", () => {
    const source = files.map((file) => read(file)).join("\n");
    expect(source).not.toContain("FAQPage");
    expect(source).not.toContain("HowTo");
    expect(source).not.toContain("aggregateRating");
    expect(source.toLocaleLowerCase("en")).not.toContain("completely secure");
    expect(source).not.toContain("googletagmanager");
    expect(source).not.toContain("google-analytics");
  });

  it("keeps every page title free of em and en dashes", () => {
    for (const file of files) {
      const value = title(read(file));
      expect(value, file).not.toMatch(/\u2013|\u2014/);
    }
  });
});

describe("guide inventory", () => {
  const countWord = NUMBER_WORDS[guides.length];
  const wrongCount = new RegExp(
    `\\b(?:${NUMBER_WORDS.filter((word) => word !== countWord).join("|")})\\s+(?:core\\s+)?(?:HTML\\s+)?(?:references?|guides?)\\b`,
    "i",
  );
  const copyFiles = [
    path.join(publicDir, "llms.txt"),
    path.join(publicDir, "llms-full.txt"),
    path.join(publicDir, "llms.html"),
    path.join(pages, "about.astro"),
    path.join(pages, "404.astro"),
    path.join(pages, "guides/index.astro"),
  ];

  it("keeps published copy in sync with the live guide list", () => {
    expect(guides.length).toBeGreaterThan(0);
    expect(countWord, "missing number word for guide count").toBeTruthy();
    for (const file of copyFiles) {
      const body = readFileSync(file, "utf8");
      expect(body, path.relative(".", file)).not.toMatch(wrongCount);
    }
  });

  it("links each live guide to the homepage and to exactly one sibling guide", () => {
    for (const guide of guides) {
      const body = template(read(guide));
      expect(body, guide).toMatch(/href="\/"/);
      const hrefs = [...body.matchAll(/href="(\/guides\/[^"]+)"/g)].map((match) => match[1]);
      const siblings = [...new Set(hrefs)].filter((href) => href !== "/guides");
      expect(siblings, guide).toHaveLength(1);
    }
  });

  it("does not point internal links at a moved noindex guide URL", () => {
    const moved = walk(path.join(pages, "guides"))
      .filter((file) => file.endsWith(".astro"))
      .filter((file) => sourceDeclaresNoindex(readFileSync(file, "utf8")))
      .map((file) => {
        const route = "/" + path.relative(pages, file).replace(/\.astro$/, "").split(path.sep).join("/");
        return route.endsWith("/index") ? route.slice(0, -"/index".length) : route;
      });
    const skip = new Set(
      walk(path.join(pages, "guides"))
        .filter((file) => file.endsWith(".astro") && sourceDeclaresNoindex(readFileSync(file, "utf8"))),
    );
    const filesToScan = [
      ...walk(srcDir).filter((file) => file.endsWith(".astro") || file.endsWith(".ts") || file.endsWith(".js")),
      ...walk(publicDir).filter((file) => /\.(txt|html|xml|json)$/.test(file)),
    ].filter((file) => !skip.has(file));
    for (const file of filesToScan) {
      const body = readFileSync(file, "utf8");
      for (const route of moved) {
        expect(body, path.relative(".", file)).not.toMatch(
          new RegExp(`(?:href=["']|https://onlinesluggenerator\\.com)${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:["'\s]|$)`),
        );
      }
    }
  });
});
