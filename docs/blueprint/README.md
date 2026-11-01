# Online Slug Generator blueprint

Planning document for the static site. It does not implement the site.

Read this page for the product decision, then the numbered parts.

| Part | Contents |
|---|---|
| This file | Product summary, positioning, decisions that must not drift |
| [01-audit-and-skills.md](01-audit-and-skills.md) | Repository audit and skill use |
| [02-market-audiences.md](02-market-audiences.md) | Competitors, audiences, jobs |
| [03-product-and-engine.md](03-product-and-engine.md) | Sitemap, features, pipeline, files |
| [04-ux-design-a11y.md](04-ux-design-a11y.md) | Viewport-first workspace, themes, components |
| [05-architecture.md](05-architecture.md) | Astro architecture and accessibility requirements |
| [06-seo-geo.md](06-seo-geo.md) | Search, AI crawlers, privacy |
| [07-quality-roadmap.md](07-quality-roadmap.md) | Tests, roadmap, risks, matrices |

Section 11 in the UX part overrides any earlier layout note that conflicts with it.


## 1. Executive summary

Build a free, static, privacy-first URL slug tool. One paste produces one slug. A list or a CSV produces a column of slugs without sending text anywhere.

V1 is one Astro site, one pure TypeScript pipeline, two screens (single and bulk), TXT/CSV in the browser, light and dark themes, and five guides. It is not a developer IDE, not a CMS, and not a page farm.

The homepage is a compact workspace: mode, input, slug, copy, and core settings fit the first viewport. Definitions, examples, and questions sit in a knowledge layer underneath and may scroll. Educational pages exist only where the question is different from "make me a slug." Product-handle and blog-permalink needs are presets and copy, not extra tool URLs.

Search volumes, keyword difficulty, and traffic forecasts are unknown. Do not invent them. Measure with Google Search Console and Bing Webmaster Tools after launch.

---
## 2. Product positioning

### Decisions

| Item | Decision |
|---|---|
| Product name | Online Slug Generator |
| Brand in the nav | Online Slug Generator |
| Homepage H1 | Turn text into a clean URL slug |
| Title tag | URL Slug Generator — Single and Bulk |
| Meta description | Paste one title or a whole list and copy clean URL slugs. Processing stays in your browser, including CSV files. |
| Short promise | Turn any text into clean, URL-ready slugs. One title or a thousand. |
| Nav labels | Single, Bulk, Guides, About |
| Positioning | A private slug tool for people who have a title now, or a list later. Plain language. "Slug" is defined on first use. "Slugify" is not the product name. |

Rejected names: "Slugify — Online Slug Generator" (jargon-first), "Free URL Slug Generator" as the only H1 (generic and identical to several competitors). The title tag may say "URL Slug Generator" because that is how people search. The H1 says what happens.

An exact-match domain is not treated as a ranking advantage.

"Slug" is explained in the first sentence under the H1: "A slug is the readable end of a URL, such as `how-to-prune-roses`."

### Brand voice

Utility, calm, specific. No "SEO-optimized slugs guaranteed." No scores that pretend to be rankings. Orange is the copy action, used once per view.

---
## 28. Final decisions (the ones that must not drift)

- **V1 contains:** static Astro site, single tool, bulk tool, TXT/CSV local import and export, the pipeline in section 9, three presets, light/dark/system, five guides, about, privacy, contact, sitemap, robots, llms.txt, Vitest, Playwright.
- **Deferred:** custom maps, custom stop lists, JSON, XLSX, developer mode, WebMCP, analytics events, ads, extra landing pages, hreflang, comparison pages.
- **Launch pages:** the ten URLs in section 7. Nothing else.
- **Visual direction:** a compact utility workspace, not a marketing hero. DESIGN.md cream, ink, and orange. Inter and JetBrains Mono, self-hosted. Dark tokens from section 12. Header 48px. Tool H1 22px/18px. Two columns on desktop, stack on mobile, Copy on the slug row. One settings row. Advanced in a popover or sheet. Quick Answers are closed `<details>` under the workspace. No navy/green system. No 72px or 36px tool heading. No shadows. No timeline pills.
- **Pipeline:** the twelve steps in section 9, not user-reorderable.
- **Themes:** `data-theme` plus CSS variables, system default, local override, boot script in head.
- **Files:** browser-only, owned CSV parser, 5 MB, 10,000 rows, original columns kept.
- **Architecture:** `src/lib/slug` pure functions, one `tool.ts`, static guides.
- **Organic measurement:** Search Console and Bing. Success is indexation and query-to-page fit, not a traffic number.
- **AI measurement:** quarterly manual prompts, logged. No citation is promised.
- **Biggest risks:** unconfirmed domain, soft 404s on Pages, overclaiming privacy or SEO, and splitting the tool into doorway URLs.
