import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { INDEXED_LOCALES, getLocaleFromUrl } from "../../src/i18n/utils";
import { LOCALES } from "../../src/i18n/ui";

const root = path.resolve(".");
const publicDir = path.join(root, "public");
const pagesDir = path.join(root, "src/pages");
const distDir = path.join(root, "dist");
const SITE = "https://onlinesluggenerator.com";
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });

function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else found.push(full);
  }
  return found;
}

function sitemapLocs(source: string): string[] {
  return [...source.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
}

function astroToPath(relative: string): string {
  const withoutExt = relative.replace(/\.astro$/, "").split(path.sep).join("/");
  if (withoutExt === "index") return "/";
  if (withoutExt.endsWith("/index")) return `/${withoutExt.slice(0, -"/index".length)}`;
  return `/${withoutExt}`;
}

function isIndexableRoute(route: string): boolean {
  if (route === "/404") return false;
  return INDEXED_LOCALES.includes(getLocaleFromUrl(route));
}

function indexableFromSource(): string[] {
  return walk(pagesDir)
    .filter((file) => file.endsWith(".astro"))
    .map((file) => astroToPath(path.relative(pagesDir, file)))
    .filter(isIndexableRoute)
    .map((route) => (route === "/" ? `${SITE}/` : `${SITE}${route}`))
    .sort();
}

function robotsContent(html: string): string {
  const match =
    html.match(/<meta\b[^>]*\bname="robots"[^>]*\bcontent="([^"]+)"/i) ??
    html.match(/<meta\b[^>]*\bcontent="([^"]+)"[^>]*\bname="robots"/i);
  return match?.[1] ?? "";
}

function indexableFromDist(): string[] {
  return walk(distDir)
    .filter((file) => file.endsWith(".html"))
    .map((file) => {
      const rel = path.relative(distDir, file).split(path.sep).join("/");
      const html = readFileSync(file, "utf8");
      if (rel === "llms.html" || rel === "404.html") return null;
      if (robotsContent(html).includes("noindex")) return null;
      if (rel === "index.html") return `${SITE}/`;
      return `${SITE}/${rel.replace(/\.html$/, "")}`;
    })
    .filter((url): url is string => Boolean(url))
    .sort();
}

describe("sitemap", () => {
  const sitemap = readFileSync(path.join(publicDir, "sitemap.xml"), "utf8");
  const locs = sitemapLocs(sitemap);
  const expected = indexableFromSource();

  it("lists exactly the indexable source pages, with no .html or trailing-slash forms", () => {
    expect([...locs].sort()).toEqual(expected);
    if (INDEXED_LOCALES.length < 2) {
      expect(sitemap).not.toMatch(/hreflang|xmlns:xhtml/);
    }
    const unpublished = Object.keys(LOCALES).filter((locale) => !INDEXED_LOCALES.includes(locale as keyof typeof LOCALES));
    for (const loc of locs) {
      const first = new URL(loc).pathname.split("/").filter(Boolean)[0];
      if (first) expect(unpublished).not.toContain(first);
      if (loc !== `${SITE}/`) {
        expect(loc.endsWith("/")).toBe(false);
        expect(loc.endsWith(".html")).toBe(false);
      }
    }
  });

  it("gives every loc a lastmod date that is not in the future", () => {
    const blocks = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
    expect(blocks).toHaveLength(locs.length);
    for (const block of blocks) {
      const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
      const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
      expect(loc, "loc").toBeTruthy();
      expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(lastmod! <= today, `${loc} lastmod ${lastmod} is after today (${today})`).toBe(true);
    }
  });

  it.skipIf(!existsSync(path.join(distDir, "index.html")))(
    "matches the built indexable pages when dist is present",
    () => {
      const built = readFileSync(path.join(distDir, "sitemap.xml"), "utf8");
      expect(sitemapLocs(built).sort()).toEqual([...locs].sort());
      expect(indexableFromDist()).toEqual([...locs].sort());
      for (const file of walk(distDir).filter((item) => item.endsWith(".html"))) {
        const rel = path.relative(distDir, file).split(path.sep).join("/");
        const html = readFileSync(file, "utf8");
        const canonical =
          html.match(/<link\b[^>]*\brel="canonical"[^>]*\bhref="([^"]+)"/i)?.[1] ??
          html.match(/<link\b[^>]*\bhref="([^"]+)"[^>]*\brel="canonical"/i)?.[1] ??
          null;
        if (rel === "llms.html") {
          expect(canonical, rel).toBeNull();
          continue;
        }
        const expectedCanonical =
          rel === "index.html" ? `${SITE}/` : `${SITE}/${rel.replace(/\.html$/, "")}`;
        expect(canonical, rel).toBe(expectedCanonical);
      }
      const onSiteHtml = /href="(?:https:\/\/onlinesluggenerator\.com)?\/[^"]*\.html(?:[?#][^"]*)?"/;
      for (const file of walk(distDir)) {
        if (/\.(png|ico|woff2?|ttf|eot|jpg|jpeg|webp|gif|svg)$/i.test(file)) continue;
        const rel = path.relative(distDir, file).split(path.sep).join("/");
        expect(readFileSync(file, "utf8"), rel).not.toMatch(onSiteHtml);
      }
    },
  );
});
