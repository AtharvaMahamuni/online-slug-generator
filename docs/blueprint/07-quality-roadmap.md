# Quality, roadmap, and matrices

## 19. Testing

### Engine unit tests (must exist before the UI is called done)

| Case | Expect |
|---|---|
| `Hello World` | `hello-world` |
| leading and trailing space | trimmed |
| repeated spaces | one separator |
| `Hello, world!` | `hello-world` |
| `AT&T` | `at-and-t` when ampersand rule on |
| `Café` | `cafe` under latin-ascii |
| `Straße` | `strasse` |
| `Привет` | preserved, not deleted, under both V1 policies |
| `東京` | preserved |
| emoji only | empty slug, warning |
| empty | empty, no throw |
| `<b>Hi</b>` | `hi` after html text extract. Script body not included |
| 400-character title | full slug if maxLength null |
| maxLength 20 | cut on a separator |
| stop words on, `The Art of War` | `art-war` |
| stop words off | `the-art-of-war` |
| remove numbers on, `iPhone 17 Pro` | numbers gone. Default off keeps `iphone-17-pro` |
| duplicates `A`, `A` | `a`, `a-2` |
| underscore separator | `hello_world` |
| NBSP and zero-width | ignored as spaces or removed |
| same input twice | identical output |

### Config tests

Each flag flipped alone from defaults. Preset objects equal the table in section 8. Reset returns defaults. Version mismatch in stored JSON falls back.

### File tests

TXT lines. CSV with quotes and commas. Header on and off. Column select. Missing cell. Broken quotes reported, other rows kept. BOM. CRLF. Export round-trip keeps Product ID. Oversize rejected. 10,001st row dropped with a count.

### UI tests (Playwright)

Single type and copy (clipboard permission). Bulk paste, duplicate label, edit a cell. File import fixture. Column mapping appears only after a CSV, not before. Theme toggle persists across reload. Keyboard-only copy and keyboard open/close of Quick Answers. `prefers-reduced-motion`. Both color schemes.

Viewport suite, both themes, home and bulk, at 100% zoom: 1440×900, 1280×800, 1024×768, 390×844, 375×812, 360×800, 320×568. For each, assert the title field, slug field, and Copy are inside the layout viewport, document `scrollWidth` equals `clientWidth`, and the utility layer does not require `window` scroll to reach Copy. On bulk, assert Paste and Import do not show two empty input surfaces. Shrink the viewport height by 260px as a keyboard stand-in and assert Copy is still inside the visual area and the definition sentence is still in the DOM.

Also assert 200% CSS zoom at 1280×800 and 390×844: no horizontal page scroll, no clipped control, document scroll allowed.

Quick Answers: the three questions and their answers are in the response HTML before any click. Expanding one does not remove the others from the DOM.

### Accessibility pass

Axe in Playwright on home, bulk, and one guide, light and dark. Keyboard walk, including the advanced sheet and the mobile menu. Contrast spot-check of muted and error tokens. Screen reader: one manual pass with VoiceOver or NVDA on single and bulk, including a closed and an open Quick Answer. Record the date. Do not claim AAA.

Visual regression: screenshots of home and bulk, both themes, at every reference viewport above, committed as baselines after the first intentional UI. Not a cloud service. A passing Lighthouse score is not a substitute for looking at those shots.

---
## 20. Monetization

V1 is free, with no ads and no affiliate blocks. The tool is the product. Ads above the textarea would contradict the brief.

Revisit only after Search Console shows steady repeat use over a few months. Possible later options, none chosen: a single relevant affiliate disclosure far below the tool, or a paid API which this architecture refuses (no backend). Do not add accounts in order to charge.

No revenue forecast.

---
## 21. Implementation roadmap

Each phase is a PR-sized slice. Acceptance is testable. Exclusions are binding.

### Phase 0 — this document

Tasks: write the blueprint into `docs/blueprint/`. Dependencies: none. Deliverable: the markdown. Acceptance: an implementer can build without re-deciding V1 scope. Excludes: code.

### Phase 1 — design shell

Tasks: Astro scaffold, tokens, both themes, 48px header, empty workspace frame that matches the section 11 wireframes, guide layout. Dependencies: Phase 0. Acceptance: both themes, no flash, keyboard theme toggle, axe clean on the empty shell, and the empty title field, slug field, and Copy sit in the first viewport at every reference size in section 11. No client JS except the theme boot script. Excludes: slug logic.

### Phase 2 — engine

Tasks: `lib/slug` and unit tests. Dependencies: Phase 1's TypeScript setup. Acceptance: the test table passes. Excludes: UI.

### Phase 3 — single and bulk UI

Tasks: wire the engine, copy, edit-protection, duplicates, paging. Dependencies: Phase 2. Acceptance: Playwright single and bulk paste. Excludes: files.

### Phase 4 — files

Tasks: CSV parser, drop zone, export. Dependencies: Phase 3. Acceptance: file test matrix. Excludes: XLSX and JSON.

### Phase 5 — settings polish

Tasks: presets, advanced disclosure, localStorage, "what changed" line. Dependencies: Phase 3. Acceptance: preset table matches output. Excludes: custom maps.

### Phase 6 — pages and SEO files

Tasks: five guides, about, privacy, contact, metadata, JSON-LD, sitemap, robots, llms.txt, CNAME. Dependencies: Phase 1 layout. Can parallel Phase 2–5. Acceptance: view-source shows the guide text; schema validates; sitemap URLs return 200. Excludes: comparison pages.

### Phase 7 — launch

Tasks: GitHub Actions to Pages, real 404 check, axe, budgets, privacy read-through. Dependencies: 1–6. Acceptance: production URL serves HTML without JS for the guide text; tool works; Lighthouse performance and accessibility recorded; CWV lab budgets met or exceptions written down. Excludes: ads, analytics scripts.

### Phase 8 — learn

Tasks: Search Console, Bing, the seven-prompt log, only then consider V1.1. Dependencies: launch. Acceptance: a written note of queries and citations after 28 days. Excludes: new URLs unless the falsify test in section 16 hits.

---
## 22. Risk register

| Risk | Why it matters | Response |
|---|---|---|
| Domain not owned | Canonicals would be wrong | Confirm DNS before launch. Do not print the domain on third-party sites until it resolves |
| CursorGothic license | Cannot ship the marketing font | Inter, as DESIGN.md allows |
| Dark orange contrast | `#f54e00` with white may fail | Measure. Switch label to ink if needed |
| Preserving CJK while users expect ASCII | Some CMSs reject non-ASCII | Document it. Lazy-load a transliterator only in V1.1 |
| Stop-word default | Competitors turn it on and delete meaning | Default off |
| GitHub Pages soft 404 | Index bloat | Test a nonsense URL |
| Training-crawler choice | Owner may disagree | Confirm before `robots.txt` is final |
| Over-scoping developer mode | Delays the paste-and-copy job | V2 |
| Duplicate tool URLs | Doorway risk | Kill list in section 7 |
| any-ascii or similar in the first bundle | Breaks the JS budget | Not in V1 |
| Privacy overclaim | "100% secure" is false | Forbidden phrase |
| Invented ratings or authors | Schema and trust | Forbidden |
| 10k DOM rows | INP collapse | Page the table |

---
## 23. Open questions

1. Does the owner control `onlinesluggenerator.com`?
2. Public contact: email, GitHub issues, or both?
3. Confirm the training-crawler disallow before launch.
4. Is a legal entity name required on About, or is the site name enough?
5. GitHub Pages versus another static host. The plan assumes Pages because the repo is already on GitHub and cost must stay near zero.

Assumptions if unanswered: domain as given; contact via GitHub issues; training crawlers disallowed; no legal entity; GitHub Pages.

---
## 24. Definition of done for V1

- At the reference viewports in section 11, at 100% zoom, a new visitor sees the title field, the slug, Copy, and a way to reach core settings without scrolling the page.
- A visitor can import a CSV, pick the title column, edit a slug, see a duplicate suffix, and download a CSV that still has the other columns.
- Nothing in that flow sends the text to an application server.
- Light, dark, and system themes work without a flash.
- The five guides and three trust pages are real HTML, linked, and indexed on purpose.
- Engine tests and the Playwright flows pass.
- No second tool URL exists for "blog" or "product."
- No analytics script. No ads. No `FAQPage`. No `HowTo`.

---
## 25. Prioritized recommendations

1. Ship the homepage tool and the bulk file workflow before any extra article.
2. Keep one pipeline. Destructive options default off.
3. Preserve non-Latin text. Fold Latin accents only.
4. Follow DESIGN.md's light tokens and Inter substitute. Add the dark map in this document. Ignore the navy/green generator output.
5. Do not create keyword-swap landing pages.
6. Measure with Search Console and Bing, not with a tracker in V1.
7. Treat llms.txt and WebMCP as optional and non-ranking. Ship llms.txt. Defer WebMCP.

---
## 26. Matrices

### Audience priority

P0 single-title users and bulk file users. P1 retail catalogues, served by bulk CSV. P2 developers, served by settings and the Unicode guide until V2.

### Page priority

P0 `/` and `/bulk-slug-generator`. P0 trust: privacy. P1 five guides, about, contact. P2 everything in the kill list, which means not scheduled.

### Feature priority

P0: live single slug, copy, hyphen, lowercase, Latin fold, bulk paste, duplicate suffix, CSV in/out with other columns, both themes. P1: stop words, max length, number removal, underscore, URL prefix, presets, TXT. P2: custom maps, custom stop lists, JSON, broader transliteration chunk. P3: WebMCP, XLSX, developer fixture UI, ads.

### Launch checklist

- [ ] Domain resolves to the Pages site
- [ ] HTTPS
- [ ] Canonicals
- [ ] Sitemap and robots reviewed by the owner, including training bots
- [ ] View-source contains guide prose
- [ ] Nonsense URL returns 404
- [ ] Tool works with JS, guides work without the tool script
- [ ] axe and keyboard pass
- [ ] Both themes
- [ ] Privacy page matches actual requests (no beacons)
- [ ] Budgets recorded
- [ ] Search Console and Bing properties started
- [ ] llms.txt lists only real URLs

---
## 27. Skills for the implementation agent

Use `cursor-design` and root `DESIGN.md` for any UI. Use `ui-ux-pro-max` for accessibility and interaction checks, not for a new palette. Use `seo-schema`, `seo-sitemap`, `seo-content`, and `seo-technical` when writing pages and robots. Use `seo-geo` and `seo-agentic` when writing crawler policy, and re-read their vendor references that day. Do not run `seo-local`, `seo-maps`, or `seo-ecommerce`.

---
