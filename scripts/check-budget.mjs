import { gzipSync } from "node:zlib";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const failures = [];
const notes = [];

function gzipLength(buffer) {
  return gzipSync(buffer).length;
}

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) found.push(...walk(full));
    else found.push(full);
  }
  return found;
}

function linkedAssets(html, extension) {
  const pattern =
    extension === "js"
      ? /<script\b[^>]*\bsrc="([^"]+\.js)"/g
      : /<link\b[^>]*\bhref="([^"]+\.css)"/g;
  const urls = [];
  for (const match of html.matchAll(pattern)) urls.push(match[1]);
  return urls;
}

function readDistUrl(url) {
  const relative = url.startsWith("/") ? url.slice(1) : url;
  return readFileSync(path.join(dist, relative));
}

const files = walk(dist);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const homePath = path.join(dist, "index.html");
const home = readFileSync(homePath, "utf8");

const homeGzip = gzipLength(Buffer.from(home));
notes.push(`home HTML gzip ${homeGzip} bytes`);
if (homeGzip > 40 * 1024) failures.push(`Home HTML is ${homeGzip} bytes gzipped. The limit is 40 KB.`);

const cssUrls = [...new Set(linkedAssets(home, "css"))];
let cssGzip = 0;
for (const url of cssUrls) cssGzip += gzipLength(readDistUrl(url));
notes.push(`home CSS gzip ${cssGzip} bytes across ${cssUrls.length} file(s)`);
if (cssGzip > 15 * 1024) failures.push(`CSS is ${cssGzip} bytes gzipped. The limit is 15 KB.`);

function collectJs(urls, seen = new Set()) {
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    const source = readDistUrl(url).toString("utf8");
    const specs = [...source.matchAll(/import\s*(?:[^'"\n]+from\s*)?["'](\.[^"']+\.js)["']/g)].map((match) => match[1]);
    const dir = path.posix.dirname(url);
    const next = specs.map((spec) => path.posix.normalize(path.posix.join(dir, spec)));
    collectJs(next, seen);
  }
  return seen;
}

const toolPages = ["index.html", "bulk-slug-generator.html"];
const entryJs = [];
for (const page of toolPages) {
  const html = readFileSync(path.join(dist, page), "utf8");
  entryJs.push(...linkedAssets(html, "js"));
}
const toolJs = collectJs(entryJs);
let jsGzip = 0;
for (const url of toolJs) jsGzip += gzipLength(readDistUrl(url));
notes.push(`tool JS gzip ${jsGzip} bytes across ${toolJs.size} file(s)`);
if (jsGzip > 30 * 1024) notes.push("Tool JS is over the 30 KB target.");
if (jsGzip > 45 * 1024) failures.push(`Tool JS is ${jsGzip} bytes gzipped. The build fails above 45 KB.`);

const forbidden = [
  "FAQPage",
  "HowTo",
  "aggregateRating",
  "completely secure",
  "google-analytics",
  "googletagmanager",
  "plausible.io",
];
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const token of forbidden) {
    if (html.includes(token)) failures.push(`${path.relative(dist, file)} contains ${token}.`);
  }
}

const notFound = htmlFiles.find((file) => path.basename(file) === "404.html");
if (!notFound) failures.push("dist/404.html is missing.");
else if (!readFileSync(notFound, "utf8").includes('name="robots" content="noindex"')) {
  failures.push("dist/404.html is missing a noindex robots meta tag.");
}

function readSource(relative) {
  return readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), relative), "utf8");
}

function readIndexedLocales() {
  const src = readSource("../src/i18n/utils.ts");
  const match = src.match(/export const INDEXED_LOCALES:\s*SupportedLocale\[\]\s*=\s*\[([^\]]*)\]/);
  if (!match) throw new Error("Could not read INDEXED_LOCALES from src/i18n/utils.ts");
  return [...match[1].matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
}

function readSupportedLocales() {
  const src = readSource("../src/i18n/ui.ts");
  const block = src.match(/export const LOCALES[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!block) throw new Error("Could not read LOCALES from src/i18n/ui.ts");
  return [...block[1].matchAll(/^\s*([a-z]{2,3}):/gm)].map((m) => m[1]);
}

const INDEXED_LOCALES = readIndexedLocales();
const SUPPORTED_LOCALES = readSupportedLocales();
const NONINDEXED_LOCALES = SUPPORTED_LOCALES.filter((locale) => !INDEXED_LOCALES.includes(locale));
const factLine =
  "Spanish, German, French and Portuguese tool screens exist for visitors. They are not indexed yet.";

function localeFromRel(rel) {
  const first = rel.split("/")[0].replace(/\.html$/, "");
  return SUPPORTED_LOCALES.includes(first) && first !== "en" ? first : null;
}

function routeFromRel(rel) {
  if (rel === "index.html") return "/";
  if (rel.endsWith(".html")) return `/${rel.slice(0, -".html".length)}`;
  return `/${rel}`;
}

function expectedCanonical(rel) {
  const route = routeFromRel(rel);
  if (route === "/") return "https://onlinesluggenerator.com/";
  return `https://onlinesluggenerator.com${route}`;
}

function robotsContent(html) {
  const match = html.match(/<meta\b[^>]*\bname="robots"[^>]*\bcontent="([^"]+)"/i)
    ?? html.match(/<meta\b[^>]*\bcontent="([^"]+)"[^>]*\bname="robots"/i);
  return match ? match[1] : "";
}

function canonicalHref(html) {
  const match = html.match(/<link\b[^>]*\brel="canonical"[^>]*\bhref="([^"]+)"/i)
    ?? html.match(/<link\b[^>]*\bhref="([^"]+)"[^>]*\brel="canonical"/i);
  return match ? match[1] : null;
}

function refreshTarget(html) {
  const match = html.match(/<meta\b[^>]*\bhttp-equiv="refresh"[^>]*\bcontent="([^"]+)"/i)
    ?? html.match(/<meta\b[^>]*\bcontent="([^"]+)"[^>]*\bhttp-equiv="refresh"/i);
  if (!match) return null;
  const urlMatch = match[1].match(/url\s*=\s*([^;\s]+)/i);
  return urlMatch ? urlMatch[1].trim() : null;
}

function resolveSiteUrl(target) {
  if (!target) return null;
  try {
    const url = new URL(target, "https://onlinesluggenerator.com/");
    if (url.origin !== "https://onlinesluggenerator.com") return null;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path === "/" ? "https://onlinesluggenerator.com/" : `https://onlinesluggenerator.com${path}`;
  } catch {
    return null;
  }
}

function movedDestination(html, selfUrl) {
  const dest = resolveSiteUrl(refreshTarget(html));
  const canon = canonicalHref(html);
  if (!dest || !canon || dest !== canon) return null;
  if (selfUrl && dest === selfUrl) return null;
  return dest;
}

function hreflangTags(html) {
  return [...html.matchAll(/<link\b[^>]*\brel="alternate"[^>]*\bhreflang="([^"]+)"[^>]*>/gi),
          ...html.matchAll(/<link\b[^>]*\bhreflang="([^"]+)"[^>]*\brel="alternate"[^>]*>/gi)]
    .map((m) => ({ lang: m[1], tag: m[0] }));
}

function localeUrlPattern(locales) {
  if (locales.length === 0) return null;
  const group = locales.map((locale) => locale.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return new RegExp(`https://onlinesluggenerator\\.com/(?:${group})(?:/|"|\\s|$)`);
}

const indexableUrls = new Set();
const movedPages = new Map();
for (const file of htmlFiles) {
  const rel = path.relative(dist, file).split(path.sep).join("/");
  const html = readFileSync(file, "utf8");
  const tags = hreflangTags(html);
  if (INDEXED_LOCALES.length < 2) {
    if (tags.length > 0) failures.push(`${rel} contains rel="alternate" hreflang.`);
  } else {
    for (const tag of tags) {
      if (tag.lang !== "x-default" && !INDEXED_LOCALES.includes(tag.lang)) {
        failures.push(`${rel} has hreflang="${tag.lang}" which is not in INDEXED_LOCALES.`);
      }
    }
  }
  if (rel === "llms.html") {
    if (!robotsContent(html).includes("noindex")) {
      failures.push("llms.html is missing a noindex robots meta tag.");
    }
    if (canonicalHref(html)) {
      failures.push("llms.html must not combine noindex with a canonical link.");
    }
    continue;
  }
  const expected = expectedCanonical(rel);
  const actual = canonicalHref(html);
  const movedTo = movedDestination(html, expected);
  if (movedTo) {
    if (actual !== movedTo) {
      failures.push(`${rel} moved page canonical is ${actual ?? "(missing)"}, expected ${movedTo}.`);
    }
    if (robotsContent(html).includes("noindex")) {
      failures.push(`${rel} combines noindex with a redirect canonical.`);
    }
  } else if (actual !== expected) {
    failures.push(`${rel} canonical is ${actual ?? "(missing)"}, expected ${expected}.`);
  }
  const pageLocale = localeFromRel(rel);
  const robots = robotsContent(html);
  if (pageLocale && !INDEXED_LOCALES.includes(pageLocale)) {
    if (!html.includes('name="robots" content="noindex, follow"')) {
      failures.push(`${rel} is missing a noindex, follow robots meta tag.`);
    }
  } else if (pageLocale && INDEXED_LOCALES.includes(pageLocale) && robots.includes("noindex")) {
    failures.push(`${rel} is in INDEXED_LOCALES but has a noindex robots meta tag.`);
  }
  if (!robots.includes("noindex") && !movedTo) {
    indexableUrls.add(expected);
  }
  if (movedTo) movedPages.set(routeFromRel(rel), rel);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const file of files) {
  const rel = path.relative(dist, file).split(path.sep).join("/");
  if (/\.(png|ico|woff2?|ttf|eot|jpg|jpeg|webp|gif|svg)$/i.test(rel)) continue;
  if ([...movedPages.values()].includes(rel)) continue;
  let body = "";
  try {
    body = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const [route] of movedPages) {
    const pathPattern = escapeRegExp(route);
    const hrefToMoved = new RegExp(
      `(?:href=["'](?:https://onlinesluggenerator\\.com)?${pathPattern}(?:["'?#]|$)|https://onlinesluggenerator\\.com${pathPattern}(?:["'\\s]|$))`,
    );
    if (hrefToMoved.test(body)) {
      failures.push(`${rel} links to moved URL ${route}.`);
    }
  }
}

const sitemapPath = path.join(dist, "sitemap.xml");
let sitemap = "";
try {
  sitemap = readFileSync(sitemapPath, "utf8");
} catch {
  failures.push("dist/sitemap.xml is missing.");
}
if (sitemap) {
  if (INDEXED_LOCALES.length < 2 && /hreflang|xmlns:xhtml/.test(sitemap)) {
    failures.push("Sitemap contains hreflang or xmlns:xhtml.");
  }
  const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const locSet = new Set(locs);
  for (const loc of locs) {
    let pathname = loc;
    try {
      pathname = new URL(loc).pathname;
    } catch {
      failures.push(`Sitemap loc ${loc} is not a valid URL.`);
      continue;
    }
    const first = pathname.split("/").filter(Boolean)[0];
    if (first && NONINDEXED_LOCALES.includes(first)) {
      failures.push(`Sitemap lists locale URL ${loc} which is not in INDEXED_LOCALES.`);
    }
    if (loc !== "https://onlinesluggenerator.com/" && (loc.endsWith("/") || loc.endsWith(".html"))) {
      failures.push(`Sitemap loc ${loc} has a .html or trailing-slash form.`);
    }
  }
  for (const url of indexableUrls) {
    if (!locSet.has(url)) failures.push(`Indexable page ${url} is missing from the sitemap.`);
  }
  for (const loc of locSet) {
    if (!indexableUrls.has(loc)) {
      failures.push(`Sitemap lists ${loc} which is not an indexable built page.`);
    }
  }
}

const unpublishedLocaleUrls = localeUrlPattern(NONINDEXED_LOCALES);
for (const name of ["llms.txt", "llms-full.txt", "llms.html"]) {
  const full = path.join(dist, name);
  let body = "";
  try {
    body = readFileSync(full, "utf8");
  } catch {
    failures.push(`${name} is missing from dist.`);
    continue;
  }
  if (NONINDEXED_LOCALES.length > 0 && !body.includes(factLine)) {
    failures.push(`${name} is missing the "not indexed yet" fact line.`);
  }
  if (unpublishedLocaleUrls && unpublishedLocaleUrls.test(body)) {
    failures.push(`${name} lists a locale tool URL that is not in INDEXED_LOCALES.`);
  }
}

function hasOnSiteHtmlHref(text) {
  for (const match of text.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    const local = href.startsWith("https://onlinesluggenerator.com")
      ? href.slice("https://onlinesluggenerator.com".length)
      : href;
    if (/^(?:\/|\.{0,2}\/)?[^:\s]+\.html(?:[?#]|$)/.test(local) || local.startsWith("/") && /\.html(?:[?#]|$)/.test(local)) {
      return href;
    }
  }
  return null;
}

for (const file of files) {
  if (/\.(png|ico|woff2?|ttf|eot|jpg|jpeg|webp|gif|svg)$/i.test(file)) continue;
  const rel = path.relative(dist, file).split(path.sep).join("/");
  const hit = hasOnSiteHtmlHref(readFileSync(file, "utf8"));
  if (hit) failures.push(`${rel} contains an on-site href that ends in .html: ${hit}`);
}

for (const line of notes) console.log(line);
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}
console.log("Budgets passed.");
