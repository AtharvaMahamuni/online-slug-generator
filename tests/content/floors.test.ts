import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pages = path.resolve("src/pages");

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

const guides = [
  "guides/what-is-a-url-slug.astro",
  "guides/how-to-create-url-slugs.astro",
  "guides/hyphens-vs-underscores-in-urls.astro",
  "guides/unicode-and-international-urls.astro",
  "guides/bulk-url-slug-generation.astro",
];

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
});
