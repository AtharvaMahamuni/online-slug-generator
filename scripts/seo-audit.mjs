import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const publicDir = path.join(projectRoot, "public");

// Collect all HTML files
function getHtmlFiles(dir, base = "") {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const relPath = path.join(base, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath, relPath));
    } else if (file.endsWith(".html")) {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

const htmlFiles = getHtmlFiles(distDir);

function fileToRoute(relPath) {
  let route = "/" + relPath.replace(/\\/g, "/");
  if (route.endsWith("/index.html")) {
    route = route.slice(0, -"/index.html".length) || "/";
  } else if (route.endsWith(".html")) {
    route = route.slice(0, -".html".length);
  }
  return route;
}

const routeMap = new Map();
for (const f of htmlFiles) {
  const r = fileToRoute(f.relPath);
  routeMap.set(r, f);
}

function resolveUrlToRoute(urlStr) {
  try {
    const parsed = new URL(urlStr, "https://onlinesluggenerator.com");
    if (parsed.hostname !== "onlinesluggenerator.com") return null; // external
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return pathname;
  } catch (e) {
    return null;
  }
}

function routeExists(route) {
  if (routeMap.has(route)) return true;
  if (route === "/" && routeMap.has("/")) return true;
  const rel = route.startsWith("/") ? route.slice(1) : route;
  if (fs.existsSync(path.join(distDir, rel)) || fs.existsSync(path.join(publicDir, rel))) {
    return true;
  }
  return false;
}

// Audit results data structure
const auditReport = {
  totalPages: htmlFiles.length,
  pages: [],
  hreflangMatrix: {},
  sitemapIssues: [],
  discoveryFiles: {},
  summary: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }
};

// Check discovery files
const discoveryList = [
  "robots.txt",
  "robots-ai.txt",
  "sitemap.xml",
  "llms.txt",
  "llms-full.txt",
  "ai.txt",
  "ai.json",
  "brand.txt",
  "faq-ai.txt",
  "identity.json",
  "site.webmanifest",
  ".well-known/security.txt",
];

for (const df of discoveryList) {
  const p = path.join(publicDir, df);
  const exists = fs.existsSync(p);
  auditReport.discoveryFiles[df] = { exists, size: exists ? fs.statSync(p).size : 0 };
}

// Check sitemap.xml
const sitemapPath = path.join(publicDir, "sitemap.xml");
if (fs.existsSync(sitemapPath)) {
  const content = fs.readFileSync(sitemapPath, "utf-8");
  const locMatches = [...content.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  for (const loc of locMatches) {
    const route = resolveUrlToRoute(loc);
    if (!route || !routeExists(route)) {
      auditReport.sitemapIssues.push(`Sitemap lists non-existent URL: ${loc} (route: ${route})`);
    }
  }
  // Check hreflang in sitemap
  const urlBlocks = content.split("</url>");
  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>(.*?)<\/loc>/);
    if (!locMatch) continue;
    const pageLoc = locMatch[1];
    const alternates = [...block.matchAll(/<xhtml:link[^>]*rel="alternate"[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g)];
    for (const alt of alternates) {
      const hLang = alt[1];
      const hHref = alt[2];
      const altRoute = resolveUrlToRoute(hHref);
      if (!altRoute || !routeExists(altRoute)) {
        auditReport.sitemapIssues.push(`Sitemap block for ${pageLoc} has hreflang="${hLang}" pointing to non-existent ${hHref}`);
      }
    }
  }
}

// Now inspect every HTML file
const titles = new Map();
const descriptions = new Map();

for (const { fullPath, relPath } of htmlFiles) {
  const route = fileToRoute(relPath);
  const htmlContent = fs.readFileSync(fullPath, "utf-8");
  const window = new Window();
  const document = window.document;
  document.documentElement.innerHTML = htmlContent;

  const pageAudit = {
    route,
    file: relPath,
    lang: document.documentElement.getAttribute("lang") || null,
    dir: document.documentElement.getAttribute("dir") || null,
    title: document.querySelector("title")?.textContent?.trim() || null,
    description: document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || null,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim() || null,
    robots: document.querySelector('meta[name="robots"]')?.getAttribute("content")?.trim() || null,
    h1s: [...document.querySelectorAll("h1")].map(el => el.textContent.trim()),
    headings: [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map(el => ({ tag: el.tagName.toLowerCase(), text: el.textContent.trim() })),
    hreflangs: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(el => ({
      lang: el.getAttribute("hreflang"),
      href: el.getAttribute("href")
    })),
    openGraph: {
      title: document.querySelector('meta[property="og:title"]')?.getAttribute("content") || null,
      description: document.querySelector('meta[property="og:description"]')?.getAttribute("content") || null,
      url: document.querySelector('meta[property="og:url"]')?.getAttribute("content") || null,
      image: document.querySelector('meta[property="og:image"]')?.getAttribute("content") || null,
    },
    schemas: [],
    internalLinks: [],
    brokenLinks: [],
    issues: []
  };

  // Check title
  if (!pageAudit.title) {
    pageAudit.issues.push({ type: "Critical", category: "Metadata", message: "Missing <title> tag" });
  } else {
    if (pageAudit.title.length < 30 || pageAudit.title.length > 70) {
      pageAudit.issues.push({ type: "Low", category: "Metadata", message: `Title length is ${pageAudit.title.length} chars (target: 30-65 chars)` });
    }
    if (titles.has(pageAudit.title)) {
      pageAudit.issues.push({ type: "Medium", category: "Metadata", message: `Duplicate title tag: matches ${titles.get(pageAudit.title)}` });
    } else {
      titles.set(pageAudit.title, route);
    }
  }

  const isIndexable = !pageAudit.robots?.includes("noindex");

  // Check description
  if (isIndexable) {
    if (!pageAudit.description) {
      pageAudit.issues.push({ type: "Critical", category: "Metadata", message: "Missing meta description" });
    } else {
      const len = pageAudit.description.length;
      if (len < 120 || len > 160) {
        pageAudit.issues.push({ type: "High", category: "Metadata", message: `Meta description length ${len} chars outside target (120-160 chars)` });
      }
      if (descriptions.has(pageAudit.description)) {
        pageAudit.issues.push({ type: "High", category: "Metadata", message: `Duplicate meta description: matches ${descriptions.get(pageAudit.description)}` });
      } else {
        descriptions.set(pageAudit.description, route);
      }
    }
  }

  // Check canonical
  if (isIndexable) {
    if (!pageAudit.canonical) {
      pageAudit.issues.push({ type: "Critical", category: "Technical", message: "Missing rel=canonical link" });
    } else {
      const canonicalRoute = resolveUrlToRoute(pageAudit.canonical);
      if (canonicalRoute !== route) {
        pageAudit.issues.push({ type: "High", category: "Technical", message: `Canonical mismatch: canonical is ${pageAudit.canonical} (route: ${canonicalRoute}) but page route is ${route}` });
      }
    }
  }

  // Check H1
  if (isIndexable) {
    if (pageAudit.h1s.length === 0) {
      pageAudit.issues.push({ type: "Critical", category: "Content", message: "Missing <h1> tag" });
    } else if (pageAudit.h1s.length > 1) {
      pageAudit.issues.push({ type: "Medium", category: "Content", message: `Multiple <h1> tags found (${pageAudit.h1s.length})` });
    }
  }

  // Check Hreflang
  const validLocales = ["en", "es", "de", "fr", "pt", "x-default"];
  let hasSelfRef = false;
  let hasXDefault = false;

  for (const hl of pageAudit.hreflangs) {
    if (!validLocales.includes(hl.lang)) {
      pageAudit.issues.push({ type: "High", category: "Hreflang", message: `Invalid hreflang code: "${hl.lang}"` });
    }
    if (hl.lang === pageAudit.lang) {
      if (hl.href === pageAudit.canonical) {
        hasSelfRef = true;
      } else {
        pageAudit.issues.push({ type: "Critical", category: "Hreflang", message: `Self-referencing hreflang href "${hl.href}" does not match canonical "${pageAudit.canonical}"` });
      }
    }
    if (hl.lang === "x-default") {
      hasXDefault = true;
    }
    // Check if target URL exists in dist!
    const targetRoute = resolveUrlToRoute(hl.href);
    if (!targetRoute || !routeExists(targetRoute)) {
      pageAudit.issues.push({
        type: "Critical",
        category: "Hreflang",
        message: `Hreflang for "${hl.lang}" points to non-existent URL "${hl.href}" (404 target)`
      });
    }
  }

  if (pageAudit.hreflangs.length > 0) {
    if (!hasSelfRef) {
      pageAudit.issues.push({ type: "Critical", category: "Hreflang", message: `Missing self-referencing hreflang tag for language "${pageAudit.lang}"` });
    }
    if (!hasXDefault) {
      pageAudit.issues.push({ type: "Medium", category: "Hreflang", message: "Missing x-default hreflang tag" });
    }
  }

  // Record hreflang matrix
  auditReport.hreflangMatrix[route] = pageAudit.hreflangs;

  // Check Schema.org JSON-LD
  const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scriptTags) {
    try {
      const parsed = JSON.parse(s.textContent);
      pageAudit.schemas.push(parsed);
      // Check inLanguage
      if (parsed["@type"] === "WebApplication") {
        if (!parsed.inLanguage) {
          pageAudit.issues.push({ type: "Low", category: "Schema", message: `WebApplication schema missing inLanguage property` });
        } else if (parsed.inLanguage !== pageAudit.lang) {
          pageAudit.issues.push({ type: "Medium", category: "Schema", message: `WebApplication schema inLanguage "${parsed.inLanguage}" does not match page lang "${pageAudit.lang}"` });
        }
      }
    } catch (e) {
      pageAudit.issues.push({ type: "Critical", category: "Schema", message: `Invalid JSON-LD syntax: ${e.message}` });
    }
  }

  // Check internal links
  const links = document.querySelectorAll("a[href]");
  for (const a of links) {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (href.startsWith("http://") || href.startsWith("https://")) {
      const r = resolveUrlToRoute(href);
      if (r) {
        pageAudit.internalLinks.push({ href, text: a.textContent.trim(), route: r });
        if (!routeExists(r)) {
          pageAudit.brokenLinks.push({ href, text: a.textContent.trim(), targetRoute: r });
          pageAudit.issues.push({ type: "High", category: "Links", message: `Broken internal link to "${href}"` });
        }
      }
    } else if (href.startsWith("/")) {
      const r = resolveUrlToRoute(href);
      pageAudit.internalLinks.push({ href, text: a.textContent.trim(), route: r });
      if (!routeExists(r)) {
        pageAudit.brokenLinks.push({ href, text: a.textContent.trim(), targetRoute: r });
        pageAudit.issues.push({ type: "High", category: "Links", message: `Broken internal link to "${href}"` });
      }
    }
  }

  auditReport.pages.push(pageAudit);
}

// Check Reciprocal Hreflang (Return tags)
for (const [route, hreflangs] of Object.entries(auditReport.hreflangMatrix)) {
  for (const hl of hreflangs) {
    if (hl.lang === "x-default") continue;
    const targetRoute = resolveUrlToRoute(hl.href);
    if (!targetRoute || !routeExists(targetRoute)) continue; // already flagged
    const targetAlternates = auditReport.hreflangMatrix[targetRoute];
    if (!targetAlternates) {
      const p = auditReport.pages.find(x => x.route === route);
      p?.issues.push({
        type: "Critical",
        category: "Hreflang",
        message: `Target page ${targetRoute} has no hreflang tags to return link to ${route}`
      });
      continue;
    }
    const returnLink = targetAlternates.find(a => resolveUrlToRoute(a.href) === route);
    if (!returnLink) {
      const p = auditReport.pages.find(x => x.route === route);
      p?.issues.push({
        type: "Critical",
        category: "Hreflang",
        message: `Missing reciprocal return tag: ${route} links to ${targetRoute} (${hl.lang}), but ${targetRoute} does not link back to ${route}`
      });
    }
  }
}

// Compute summary counts
for (const p of auditReport.pages) {
  for (const iss of p.issues) {
    const k = iss.type.toLowerCase();
    if (k in auditReport.summary) auditReport.summary[k]++;
  }
}

console.log(JSON.stringify(auditReport, null, 2));
