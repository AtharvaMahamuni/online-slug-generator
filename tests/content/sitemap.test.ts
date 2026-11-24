import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(".");
const publicDir = path.join(root, "public");
const pagesDir = path.join(root, "src/pages");
const distDir = path.join(root, "dist");
const SITE = "https://onlinesluggenerator.com";
const LOCALE = /\/(es|de|fr|pt)(?:\/|$)/;

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

function indexableFromSource(): string[] {
  return walk(pagesDir)
    .filter((file) => file.endsWith(".astro"))
    .map((file) => astroToPath(path.relative(pagesDir, file)))
    .filter((route) => route !== "/404" && !LOCALE.test(route))
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

  it("lists exactly the indexable source pages, with no .html or trailing-slash forms", () => {
    expect(locs).toHaveLength(11);
    expect(sitemap).not.toMatch(/hreflang|xmlns:xhtml/);
    for (const loc of locs) {
      expect(loc).not.toMatch(/https:\/\/onlinesluggenerator\.com\/(es|de|fr|pt)(?:\/|$)/);
      if (loc !== `${SITE}/`) {
        expect(loc.endsWith("/")).toBe(false);
        expect(loc.endsWith(".html")).toBe(false);
      }
    }
    expect([...locs].sort()).toEqual(indexableFromSource());
  });

  it("gives every loc a lastmod date, and only pages whose copy changed in PR 2 use 2026-11-24", () => {
    const blocks = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
    expect(blocks).toHaveLength(locs.length);
    for (const block of blocks) {
      const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
      const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
      expect(loc).toBeTruthy();
      expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (loc === `${SITE}/` || loc === `${SITE}/bulk-slug-generator`) {
        expect(lastmod).toBe("2026-11-24");
      } else {
        expect(lastmod).toBe("2026-11-01");
      }
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
      const expected =
        rel === "index.html"
          ? `${SITE}/`
          : `${SITE}/${rel.replace(/\.html$/, "")}`;
      expect(canonical, rel).toBe(expected);
    }
    const htmlHref = /href="[^"]*\.html"/;
    for (const file of walk(distDir)) {
      if (/\.(png|ico|woff2?|ttf|eot|jpg|jpeg|webp|gif|svg)$/i.test(file)) continue;
      const rel = path.relative(distDir, file).split(path.sep).join("/");
      expect(readFileSync(file, "utf8"), rel).not.toMatch(htmlHref);
    }
    },
  );
});
