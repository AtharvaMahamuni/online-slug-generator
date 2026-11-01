# Market and audiences

## 5. Competitor analysis

Observed on 2026-11-01 by fetching the pages. "Observed" means the fetched HTML or text showed it. "Documented" means the page's own copy claimed it and the control was not independently exercised. Nothing here is a traffic or user-count claim.

### Feature matrix

| Capability | slugify.online | achromatic.dev | appdevtools.com | convertcase.net | tersmitten.nl/slugify |
|---|---|---|---|---|---|
| Instant single result | Button plus options. Not clearly live-only | Documented live options; sample input shown | Observed "as you type" | Observed live multiline | Button: Go |
| Bulk, one title per line | Not observed | Not observed | Not observed | Observed | Not observed |
| CSV import that keeps other columns | Not observed | Not observed | Not observed | Not observed | Not observed |
| Separator | Dash or underscore | `-`, `_`, `.` | Spaces to underscore, optional | `-` or `_` | Dashes described |
| Lowercase | Examples are lowercase. Toggle not clearly listed | Toggle observed in options | Toggle observed | Documented | Documented |
| Transliteration | Examples rewrite `$` to `dollar`. Latin map not fully shown | Toggle `é → e`. Example `São Paulo` → `sao-paulo` | Not in the options list | Documented: Latin, Cyrillic, Greek; CJK/Arabic/Hindi kept | Documented diacritics to Latin |
| Stop words | Toggle | Toggle | Not observed | Not observed | Described as common practice, not a visible control |
| Remove numbers | Toggle | Not observed | Not observed | Not observed | Not observed |
| Max length | Not observed | Field, 0 = unlimited | Not observed | Setting, word-boundary truncation documented | Described, not a control |
| Editable output | Not observed | Not observed | Not observed | Not observed | Not observed |
| Duplicate suffix | Not observed | Not observed | Not observed | Not observed | Not observed |
| File import | Not observed | Not observed | Not observed | Not observed | Not observed |
| Copy | Observed | Observed, plus copy as path | Observed | Not in the fetched tool chrome | Observed |
| Privacy claim | Not established. A third-party page (filefluxer.com) claims this site POSTs each conversion. That claim was not verified with a network log in this pass. Treat as unverified | Not stated as local-only in the fetch | "in the browser" | Not explicitly proven | Not stated |
| Theme toggle | Not observed | Not observed | Not observed | Not observed | Not observed |
| Ads | Not in the fetched tool area | Not observed | Promo banner to another product | Ko-fi / remove-ads links | An ads heading is in the HTML |

Other tools found in search, not in the required set, and only lightly inspected: slugify.org (live, bulk, unicode, separator), en.inithtml.com (bulk, Vietnamese, duplicate suffixes, CSV, client-side — documented), keygrow.co (batch, CSV, stop words, transliteration — documented), stackonlinetools.com (txt/csv line import, ASCII-only rules — documented), bulkconverter.org (TXT drop, several case modes). These show the bulk-and-CSV idea is already in market. The gap that is still sharp is a CSV that preserves Product ID and Category and appends a slug column, with row-level duplicate warnings and editable cells.

### UX comparison

slugify.online is a form: fill, click Slugify, read output, then a definition, a five-row example table, library ads, and two blog posts. It teaches, and it makes the user press a button. Achromatic is the closest single-slug UX: input, output, examples, FAQ, options including length and stop words. It is still one string. AppDevTools is one string inside a large tool directory, with a promotional banner. Convert Case is the best bulk paste UX in the required set, and it is wrapped in an account-adjacent "remove ads" pattern. Tersmitten is a minimal Go/Reset/Copy page whose article text repeats and then drifts into unrelated slugify snippets. It does not look maintained as a product.

### Underserved workflow

People with a catalogue do this in a spreadsheet today: formula, copy, fix duplicates by hand, lose the row when they paste into a slug box. None of the five required competitors showed a column picker plus original-column preservation. That is the V1 differentiator. Editable output and in-batch duplicate suffixes are the second. Configurable cleaning matters only if defaults are safe: stop-word removal and number removal are destructive and must be off.

### Positioning recommendation

Do not try to out-blog slugify.online. Do not add a 40-tool directory. Win the job "I have titles, I need slugs, I need the rest of my row back, and I do not want this uploaded."

### Inferences, labeled

- Hyphens-as-word-separators is still what Google said in 2024, not a 2026 ranking lever. See section 16.
- "Client-side" claims on other sites were not proven by watching their network panels, except where their own copy says so (AppDevTools, Convert Case's description of local transliteration is copy, not a trace).

---
## 6. Audiences and jobs

Priority is the order of the interface, not a claim about market size.

| Audience | Priority | Distinct URL in V1? | Why |
|---|---|---|---|
| Anyone with one title (bloggers included) | P0 | `/` | This is the SERP and the first-run path |
| Bulk content managers | P0 | `/bulk-slug-generator` | Different job: list, duplicates, export. Same engine |
| E-commerce operators | P1 | No | Same bulk job plus "do not drop the SKU." A preset and the CSV column model cover it. A separate product-slug URL would repeat the tool |
| Developers | P2 | No | Underscore, ASCII, and deterministic rules fall out of settings. A test-case console is V2 |

### A. Bloggers and publishers

- Job: turn a headline into a permalink they can paste into WordPress, Ghost, or similar.
- Queries they are likely to type: "url slug generator", "slugify", "blog post url slug". Volumes unknown.
- Expectation: paste, see lowercase hyphenated text, copy.
- Pain: fear of breaking an existing URL; confusion about stop words.
- Alternatives: the CMS itself. WordPress `sanitize_title` already slugifies. The tool must say that changing a live slug needs a redirect. It must not imply the tool updates WordPress.
- Features: single mode, copy, optional path preview, stop words off.
- Landing page: the homepage. A blog-only page is a doorway.

### B. E-commerce operators

- Job: product title to handle, with SKU and category untouched.
- Queries: "product url handle generator", "shopify handle generator". Volumes unknown. Shopify's own admin already creates handles. Say so on the bulk page in one sentence.
- Pain: model numbers deleted by "remove numbers"; variants collapsing to one slug.
- Features: CSV column select, keep numbers (default), duplicate suffix, export.
- Landing page: bulk page, with one retail example. Not `/product-slug-generator`.

### C. Bulk content managers

- Job: hundreds of rows, consistent rules, a file back.
- Pain: tools that output only the slug column; silent duplicate overwrite; 10,000 DOM nodes freezing the tab.
- Features: paste or file, paged review, edit, warnings, CSV and TXT export.
- Landing page: `/bulk-slug-generator`.

### D. Developers

- Job: a deterministic kebab-case or snake_case identifier, including Unicode policy.
- Pain: libraries that disagree (`slugify`, `python-slugify`, Django `slugify`, WordPress).
- V1 answer: the same engine, separator choice, preserve-script choice, and a guide that shows inputs and outputs.
- V2: a visible rule list and fixture runner. Not a third mode in the header.

---
