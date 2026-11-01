# Audit and skills

## 3. Repository audit

Inspected `/home/atharva-mahamuni/Desktop/project/online-slug-generator` on 2026-11-01.

| Finding | Evidence |
|---|---|
| Contents | `README.md` (one heading) and `.git` |
| Remote | `git@github.com:AtharvaMahamuni/online-slug-generator.git`, branch `main`, commit `1e1a36a` |
| package.json, Astro, tests, CSS, sitemap, robots | None |
| Reusable components | None in this repo |
| Technical debt | None yet. The risk is importing ToyTools' app architecture |

Workspace root `DESIGN.md` exists and is the visual source of truth for this workspace (`cursor-design`). It describes Cursor's marketing site: warm cream `#f7f7f4`, ink `#26251e`, orange `#f54e00`, hairline depth, 8px radius, display weight 400, 80px section rhythm, JetBrains Mono on code. CursorGothic is licensed. The file names **Inter** as the open-source substitute at weight 400 with slightly tighter tracking.

`ui-ux-pro-max` was queried for a new design system. It returned a navy/green dark "Trust & Authority" palette, Inter, and a sales-page pattern (logos, pricing, Contact Sales). That palette and page pattern are rejected. They fight `DESIGN.md` and they fight a tool that must be usable without scrolling. Kept from that search: minimal Swiss style, low motion, 4.5:1 contrast, visible focus, reduced motion, no emoji icons, no content hidden until scroll animations run.

Astro stack notes from the same skill say "use a framework component for interactivity" and "do not use inline scripts for complex state." That advice is rejected. The product constraint is no React, Vue, or other client framework. One vanilla module is the right island. Astro still ships zero JavaScript for guides, header, and footer.

ToyTools in the parent workspace has a slugify tool. It is a reference for behavior ideas only. Do not copy its registries, SEO engine, or component library into this repo.

### Architectural recommendation

Greenfield Astro static site inside this repository. No backend, no database, no slug API. GitHub Actions publishes `dist/` to GitHub Pages on the custom domain. Do not commit build output.

---
## 4. Skill execution matrix

| Skill | Read? | Used? | Purpose | Output |
|---|---|---|---|---|
| cursor-design | Yes | Yes | Tokens, type, hairlines, orange scarcity | Light theme is DESIGN.md. Dark theme is a paired inversion, not a second brand |
| ui-ux-pro-max | Yes | Yes | A11y, focus, touch, Astro islands, motion | Palette and sales-page pattern rejected. Craft rules kept |
| seo (hub) | Yes | Yes | Quality gates, FAQ/HowTo retirement, CWV uses INP | No FAQPage, no HowTo, no invented volumes |
| seo-plan | Yes | Yes | New-site plan. No live URL, so assessment of a current site was skipped. Template: generic utility, not `saas.md` (no pricing, trial, or accounts) | This roadmap. KPI table has methods, not fake traffic |
| seo-cluster | Yes | Partial | Intent clusters and internal links. Full pairwise SERP overlap was not run: no DataForSEO, and WebSearch samples are not a top-10 URL census | Clusters labeled intent-based, not overlap-verified. No cluster-map.html and no fake volumes |
| seo-sxo | Yes | Yes | Page type must match a tool SERP | Homepage is a tool, not a 2,500-word pillar. No live URL, so no SXO score |
| seo-technical | Yes, via hub rules | Yes | Crawl, canonical, static HTML, CWV, INP | Technical spec in section 16 |
| seo-content-brief | Yes, via hub + quality gates | Yes | Briefs for each indexable page | Section 16 page specs |
| seo-content | Yes, via quality gates | Yes | Word floors, unique copy, no doorway pages | Page kill-list |
| seo-schema | Yes | Yes | WebSite, WebApplication, Article, BreadcrumbList. FAQPage retired 2026-05-07. HowTo removed 2023-09 | Schema column in the sitemap |
| seo-sitemap | Yes | Yes | One sitemap, real URLs only, no thin URLs | Section 16 |
| seo-geo | Yes | Yes | Crawlers, passages, llms.txt weight = none for Google | Sections 17–18 |
| seo-agentic | Yes | Yes | P0 is static HTML, names, CLS. WebMCP is not a launch dependency. Do not claim agents read llms.txt | Section 18 |
| seo-programmatic | Skimmed via quality gates | Yes, to reject | Swapping "blog" and "product" in URLs is doorway-shaped | No programmatic pages |
| seo-competitor-pages | Not executed | No | No comparison URLs in V1. Competitor matrix is research, not a landing page |
| seo-images | Not executed as an audit | Partial | Almost no images in V1. Rules noted |
| seo-hreflang | Not executed | No | One language in V1. No hreflang |
| seo-google / seo-bing | Read at hub level | Planning only | No credentials, no live URL. Measurement plan only |
| seo-flow | Not executed | No | Would duplicate seo-plan prioritization |
| seo-audit / seo-page | Not executed | No | Nothing is deployed to audit |
| Local, maps, ecommerce, backlinks, drift | Not used | No | Wrong problem |

No installed skill covers product discovery, UX writing, WCAG auditing, Playwright, or visual regression as a dedicated workflow. Those are specified in this blueprint instead of inventing skills.

DataForSEO MCP is not connected. Keyword metrics below are qualitative.

---
