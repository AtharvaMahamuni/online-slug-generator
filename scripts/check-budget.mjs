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

const localePage = /(?:^|\/)(es|de|fr|pt)(?:\.html|\/)/;
const hreflangAlternate = /rel="alternate"[^>]*hreflang=|hreflang="[^"]*"[^>]*rel="alternate"/;
const localeUrlInText = /https:\/\/onlinesluggenerator\.com\/(es|de|fr|pt)(?:\/|"|\s|$)/;
const factLine =
  "Spanish, German, French and Portuguese tool screens exist for visitors. They are not indexed yet.";

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

const localePages = [];
const indexableUrls = new Set();
for (const file of htmlFiles) {
  const rel = path.relative(dist, file).split(path.sep).join("/");
  const html = readFileSync(file, "utf8");
  if (hreflangAlternate.test(html)) {
    failures.push(`${rel} contains rel="alternate" hreflang.`);
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
  if (actual !== expected) {
    failures.push(`${rel} canonical is ${actual ?? "(missing)"}, expected ${expected}.`);
  }
  if (localePage.test(rel)) {
    localePages.push(rel);
    if (!html.includes('name="robots" content="noindex, follow"')) {
      failures.push(`${rel} is missing a noindex, follow robots meta tag.`);
    }
  }
  if (!robotsContent(html).includes("noindex")) {
    indexableUrls.add(expected);
  }
}
if (localePages.length !== 8) {
  failures.push(`Expected 8 locale HTML pages in dist, found ${localePages.length}.`);
}

const sitemapPath = path.join(dist, "sitemap.xml");
let sitemap = "";
try {
  sitemap = readFileSync(sitemapPath, "utf8");
} catch {
  failures.push("dist/sitemap.xml is missing.");
}
if (sitemap) {
  if (/hreflang|xmlns:xhtml/.test(sitemap)) {
    failures.push("Sitemap contains hreflang or xmlns:xhtml.");
  }
  const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  if (locs.length !== 11) {
    failures.push(`Sitemap has ${locs.length} loc URLs. Expected 11.`);
  }
  for (const loc of locs) {
    if (localeUrlInText.test(loc) || /\/(es|de|fr|pt)(?:\/|$)/.test(new URL(loc).pathname)) {
      failures.push(`Sitemap lists locale URL ${loc}.`);
    }
    if (loc !== "https://onlinesluggenerator.com/" && (loc.endsWith("/") || loc.endsWith(".html"))) {
      failures.push(`Sitemap loc ${loc} has a .html or trailing-slash form.`);
    }
  }
  const locSet = new Set(locs);
  for (const url of indexableUrls) {
    if (!locSet.has(url)) failures.push(`Indexable page ${url} is missing from the sitemap.`);
  }
  for (const loc of locSet) {
    if (!indexableUrls.has(loc)) {
      failures.push(`Sitemap lists ${loc} which is not an indexable built page.`);
    }
  }
}

for (const name of ["llms.txt", "llms-full.txt", "llms.html"]) {
  const full = path.join(dist, name);
  let body = "";
  try {
    body = readFileSync(full, "utf8");
  } catch {
    failures.push(`${name} is missing from dist.`);
    continue;
  }
  if (!body.includes(factLine)) {
    failures.push(`${name} is missing the "not indexed yet" fact line.`);
  }
  if (localeUrlInText.test(body)) {
    failures.push(`${name} lists a locale tool URL.`);
  }
}

const htmlHref = /href="[^"]*\.html"/;
for (const file of files) {
  if (/\.(png|ico|woff2?|ttf|eot|jpg|jpeg|webp|gif|svg)$/i.test(file)) continue;
  const rel = path.relative(dist, file).split(path.sep).join("/");
  if (htmlHref.test(readFileSync(file, "utf8"))) {
    failures.push(`${rel} contains an href that ends in .html.`);
  }
}

for (const line of notes) console.log(line);
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}
console.log("Budgets passed.");
