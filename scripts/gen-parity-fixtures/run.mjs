#!/usr/bin/env node
/**
 * Generate tests/slug/fixtures/parity.json from the real pinned libraries.
 * See README.md in this directory for versions and requirements.
 */
import { execFileSync, execSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

mkdirSync(cache, { recursive: true });

const titles = JSON.parse(readFileSync(path.join(here, "titles.json"), "utf8"));
if (!Array.isArray(titles) || titles.length < 25) {
  throw new Error("titles.json must list at least 25 titles");
}
const titleJson = JSON.stringify(titles);

const wpRoot = path.join(cache, "wordpress");
if (!existsSync(path.join(wpRoot, "wp-includes/formatting.php"))) {
  const tarball = path.join(cache, `wordpress-${versions.wordpress}.tar.gz`);
  execSync(`curl -fsSL -o ${JSON.stringify(tarball)} https://wordpress.org/wordpress-${versions.wordpress}.tar.gz`, {
    stdio: "inherit",
  });
  execSync(`tar -xzf ${JSON.stringify(tarball)} -C ${JSON.stringify(cache)}`, { stdio: "inherit" });
}

const wordpress = JSON.parse(
  execFileSync("php", [path.join(here, "wordpress.php")], {
    input: titleJson,
    env: { ...process.env, WORDPRESS_ROOT: wpRoot },
    encoding: "utf8",
  }),
);

const venv = path.join(cache, "venv");
const pip = path.join(venv, "bin/pip");
const python = path.join(venv, "bin/python");
if (!existsSync(python)) {
  execFileSync("python3", ["-m", "venv", venv], { stdio: "inherit" });
}
execFileSync(pip, ["install", "-q", "-r", path.join(here, "requirements.txt")], { stdio: "inherit" });
const pythonOut = JSON.parse(
  execFileSync(python, [path.join(here, "python_libs.py")], { input: titleJson, encoding: "utf8" }),
);

const npmDir = path.join(cache, "npm");
mkdirSync(npmDir, { recursive: true });
if (!existsSync(path.join(npmDir, "node_modules/slugify/package.json"))) {
  writeFileSync(path.join(npmDir, "package.json"), readFileSync(path.join(here, "package.json")));
  execFileSync("npm", ["install", "--silent"], { cwd: npmDir, stdio: "inherit" });
}
const require = createRequire(path.join(npmDir, "package.json"));
const slugify = require("slugify");
const npmPkg = require("slugify/package.json");
const npmSlugs = titles.map((title) => slugify(title, { lower: true, strict: true }));

if (pythonOut.django_version !== versions.django) {
  throw new Error(`Django version ${pythonOut.django_version} does not match pin ${versions.django}`);
}
if (pythonOut.python_slugify_version !== versions["python-slugify"]) {
  throw new Error(`python-slugify version ${pythonOut.python_slugify_version} does not match pin`);
}
if (npmPkg.version !== versions["npm-slugify"]) {
  throw new Error(`npm slugify version ${npmPkg.version} does not match pin`);
}

const rawRows = titles.map((title, index) => ({
  title,
  wordpress: wordpress[index],
  django: pythonOut.django[index],
  "python-slugify": pythonOut.python_slugify[index],
  "npm-slugify": npmSlugs[index],
}));

const annotatePath = path.join(here, "annotate.ts");
const rows = JSON.parse(
  execFileSync("npx", ["vite-node", annotatePath], {
    input: JSON.stringify(rawRows),
    encoding: "utf8",
    cwd: root,
  }),
);

const fixture = {
  generated: "2026-11-24",
  versions,
  libraries: {
    wordpress: "WordPress 7.1.5 sanitize_title (save context)",
    django: "Django 6.1.3 django.utils.text.slugify",
    "python-slugify": "python-slugify 9.2.0",
    "npm-slugify": "npm slugify 1.6.9 with { lower: true, strict: true }",
  },
  rows,
};

const outPath = path.join(root, "tests/slug/fixtures/parity.json");
writeFileSync(outPath, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`Wrote ${rows.length} rows to ${path.relative(root, outPath)}`);
