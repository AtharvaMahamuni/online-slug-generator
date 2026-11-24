#!/usr/bin/env node
/**
 * Sweep U+00A0..U+FFFF against the real pinned libraries and write compact
 * expected slugs for tests/slug/sweep.test.ts. Never hand-write outputs.
 *
 * Usage (from the repository root, after the fixture caches exist):
 *
 *     node scripts/gen-parity-fixtures/sweep-chars.mjs
 *
 * The written file is test-only. Do not import it from src/.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const cache = path.join(here, ".cache");
const versions = {
  wordpress: "7.1.5",
  django: "6.1.3",
  "python-slugify": "9.2.0",
  "npm-slugify": "1.6.9",
};

const START = 0x00a0;
const END = 0xffff;
const PREFIX = "xx";
const SUFFIX = "yy";
const TOKEN_PERCENT = "\u0001";
const TOKEN_PERCENT_LOWER = "\u0002";

function percentEncode(text) {
  return [...new TextEncoder().encode(text)]
    .map((byte) => (byte >= 128 ? `%${byte.toString(16).padStart(2, "0")}` : String.fromCharCode(byte)))
    .join("");
}

function midOf(slug, char) {
  if (slug.startsWith(PREFIX) && slug.endsWith(SUFFIX) && slug.length >= PREFIX.length + SUFFIX.length) {
    return slug.slice(PREFIX.length, slug.length - SUFFIX.length);
  }
  return `\u0000${slug}`;
}

function tokenFor(char, mid) {
  if (mid === percentEncode(char)) return TOKEN_PERCENT;
  if (mid === percentEncode(char.toLowerCase())) return TOKEN_PERCENT_LOWER;
  return mid;
}

function compact(chars, slugs) {
  const vocab = [];
  const index = new Map();
  const ids = [];
  for (let i = 0; i < chars.length; i += 1) {
    const token = tokenFor(chars[i], midOf(slugs[i], chars[i]));
    let id = index.get(token);
    if (id === undefined) {
      id = vocab.length;
      index.set(token, id);
      vocab.push(token);
    }
    ids.push(id);
  }
  const width = Math.max(0, ...ids) < 256 ? 1 : 2;
  const bytes = Buffer.alloc(ids.length * width);
  if (width === 1) {
    for (let i = 0; i < ids.length; i += 1) bytes[i] = ids[i];
  } else {
    for (let i = 0; i < ids.length; i += 1) bytes.writeUInt16LE(ids[i], i * 2);
  }
  return { v: vocab, w: width, i: bytes.toString("base64") };
}

mkdirSync(cache, { recursive: true });

const chars = [];
for (let cp = START; cp <= END; cp += 1) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  chars.push(String.fromCodePoint(cp));
}
const titles = chars.map((char) => `${PREFIX}${char}${SUFFIX}`);
const titleJson = JSON.stringify(titles);

const wpRoot = path.join(cache, "wordpress");
if (!existsSync(path.join(wpRoot, "wp-includes/formatting.php"))) {
  throw new Error("WordPress cache is missing. Run node scripts/gen-parity-fixtures/run.mjs first.");
}
const wordpress = JSON.parse(
  execFileSync("php", [path.join(here, "wordpress.php")], {
    input: titleJson,
    env: { ...process.env, WORDPRESS_ROOT: wpRoot },
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }),
);

const python = path.join(cache, "venv/bin/python");
if (!existsSync(python)) {
  throw new Error("Python venv is missing. Run node scripts/gen-parity-fixtures/run.mjs first.");
}
const pythonOut = JSON.parse(
  execFileSync(python, [path.join(here, "python_libs.py")], {
    input: titleJson,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }),
);

const npmDir = path.join(cache, "npm");
const require = createRequire(path.join(npmDir, "package.json"));
const slugify = require("slugify");
const npmSlugs = titles.map((title) => slugify(title, { lower: true, strict: true }));

if (pythonOut.django_version !== versions.django) {
  throw new Error(`Django version ${pythonOut.django_version} does not match pin ${versions.django}`);
}
if (pythonOut.python_slugify_version !== versions["python-slugify"]) {
  throw new Error(`python-slugify version ${pythonOut.python_slugify_version} does not match pin`);
}

const payload = {
  generated: "2026-11-24",
  versions,
  wrap: [PREFIX, SUFFIX],
  start: START,
  end: END,
  count: chars.length,
  presets: {
    wordpress: compact(chars, wordpress),
    django: compact(chars, pythonOut.django),
    "python-slugify": compact(chars, pythonOut.python_slugify),
    "npm-slugify": compact(chars, npmSlugs),
  },
};

const outPath = path.join(root, "tests/slug/fixtures/sweep-expected.json.gz");
const zipped = gzipSync(Buffer.from(`${JSON.stringify(payload)}\n`), { level: 9 });
writeFileSync(outPath, zipped);
console.log(`Wrote ${chars.length} characters to ${path.relative(root, outPath)} (${zipped.length} bytes gzipped)`);
