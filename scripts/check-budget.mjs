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

for (const line of notes) console.log(line);
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}
console.log("Budgets passed.");
