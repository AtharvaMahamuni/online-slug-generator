# Product and engine

## 7. Sitemap and page specifications

### Launch (index)

| URL | Intent | Cluster | H1 | Title | Index | Phase |
|---|---|---|---|---|---|---|
| `/` | Do it now | Tool | Turn text into a clean URL slug | URL Slug Generator — Single and Bulk | index | V1 |
| `/bulk-slug-generator` | Do a list or file | Bulk tool | Generate slugs for a list | Bulk URL Slug Generator | index | V1 |
| `/guides/what-is-a-url-slug` | Define | Concept | What a URL slug is | What Is a URL Slug? | index | V1 |
| `/guides/how-to-create-url-slugs` | How, including length, stop words, lowercase | Practice | How to create a URL slug | How to Create a URL Slug | index | V1 |
| `/guides/hyphens-vs-underscores-in-urls` | Compare separators | Separators | Hyphens and underscores in URLs | Hyphens vs Underscores in URLs | index | V1 |
| `/guides/unicode-and-international-urls` | Non-English text | Unicode | International characters in URL slugs | Unicode and URL Slugs | index | V1 |
| `/guides/bulk-url-slug-generation` | Many rows, duplicates, files | Bulk practice | How to generate slugs in bulk | Bulk URL Slug Generation | index | V1 |
| `/about` | Who operates this | Trust | About this tool | About Online Slug Generator | index | V1 |
| `/privacy` | What leaves the browser | Trust | Privacy | Privacy | index | V1 |
| `/contact` | Reach a human | Trust | Contact | Contact | index | V1 |

Meta descriptions are written at implementation time to the quality-gate shape: 120–160 characters, unique, not a restatement of the title, no shared stock ending. Drafts:

- Home: "Paste one title or a whole list and copy clean URL slugs. Processing stays in your browser, including CSV files."
- Bulk: "Turn a pasted list or a CSV into slugs without dropping the other columns. Duplicates are marked. Files stay on your device."
- What is: "A URL slug is the readable last part of an address. See a before-and-after, and which characters do not belong in one."
- How to: "Make a slug from a title: lowercase, hyphens, and what to do with accents, numbers, and very long headlines."
- Hyphens: "Google has said hyphens separate words more clearly than underscores. Here is what that does and does not mean for an existing site."
- Unicode: "Accented letters can be folded to ASCII. Other scripts can stay as they are. Both are valid choices, for different CMSs."
- Bulk guide: "Use a list or a spreadsheet when you have more than a handful of titles, and decide what to do when two slugs match."
- About: "Online Slug Generator is a free static tool. Slugs are computed in your browser. There is no account."
- Privacy: "Text, files, and slugs are not uploaded by this site. What the host and your browser still do is spelled out here."
- Contact: "How to reach the maintainer of Online Slug Generator. This page does not accept uploaded titles."

### H2 outlines

Home knowledge layer, below the workspace: a compact Quick Answers group (questions and answers in the initial HTML, closed `<details>`), then a worked example, what stays on this device, when to use Bulk, and guides. Not FAQ schema. The knowledge layer must not push the workspace below the first viewport.

Bulk page, below the tool: Paste or import. Which column is the title. What duplicate slugs mean. Export. A shop-catalogue example and a docs example, same component.

What is: definition in the first 60 words. Where it sits in a URL. Good and bad examples. What it does not do (it is not a redirect manager). Link to the tool and to the how-to.

How to: steps, then sections for case, hyphens, stop words (default off, and why), length (no magic number), numbers, changing a slug that is already public. Cite Google's ecommerce URL guide for "descriptive words," not for a character limit.

Hyphens: quote Gary Illyes, April 2024 office hours: keywords in URLs barely contribute, and hyphens are clearer separators. Quote the 2011 German Search Central post only as history, and say it is old. Tell readers not to migrate underscores if the site already works. Link Matt Cutts-era posts as history, not as current policy.

Unicode: NFC vs ASCII folding. Latin accents. Scripts without a Latin equivalent. IRI vs percent-encoding in one short explanation. Preserve is the default for non-Latin. Transliterate is an option when the CMS demands ASCII.

Bulk guide: one row vs a file. Duplicate suffixes. Why not to delete the source column. Link to the bulk tool.

About: what the site is, what it refuses to do, link to privacy and the GitHub repository. No invented company, team, or years of experience.

Privacy: local processing, no analytics in V1, GitHub Pages logs may exist at the host, contact mail is the only intentional outbound message, no file contents in that message because there is no upload form.

Contact: a mailto or a link to GitHub issues. No form backend. If the owner has not named an email, the page links to the repository issues only. Do not invent an address.

### Schema

| Page | JSON-LD |
|---|---|
| Home | `WebSite` plus `WebApplication` with `offers.price` = 0, `browserRequirements` = requires JavaScript for the tool. Visible text must match |
| Guides | `Article` with headline, datePublished, dateModified. `BreadcrumbList` |
| About, privacy, contact | `BreadcrumbList` only |
| All | No `FAQPage`. No `HowTo`. No `aggregateRating`. No fake `Person` credentials. No `Organization` address |

Publisher name is "Online Slug Generator" until a legal entity exists. Do not add `sameAs` links that were not created.

### Internal links

Every guide links to `/` and to one sibling guide in the body. Home links to Bulk and to all five guides. Bulk links to the bulk guide and to Unicode. Header links Single, Bulk, Guides, About. Footer links Privacy and Contact. No orphans. Anchors are the page's topic, not "click here."

### Killed pages

| Candidate | Decision |
|---|---|
| `/slugify` | No. It would rank by repeating the homepage. Mention the verb once in the how-to |
| `/product-slug-generator` | No. Same tool, retail example lives on Bulk |
| `/blog-slug-generator` | No. Same tool |
| `/guides/url-slug-best-practices` | Folded into the how-to. A second best-practices URL would cannibalize it |
| `/guides/should-you-remove-stop-words` | A section of the how-to. Not enough unique procedure for its own URL in V1 |
| `/guides/duplicate-url-slugs` | A section of the bulk guide |
| `/terms` | Deferred until there is an account, ad, or paid feature. Privacy covers the data story |
| Comparison pages | Deferred. No first-hand testing protocol yet |
| Programmatic "slug generator for {niche}" | Rejected. Doorway pattern in the quality gates |
| hreflang variants | Rejected for V1 |

Quality-gate word floors to hit without padding: home supporting copy at least 500 words including the visible explanation (the tool UI does not count); each guide at least 1,200 words of useful prose, examples, and exceptions (the skill's blog floor is 1,500; these are narrower references, so 1,200 is the floor and stuffing to 1,500 is forbidden); about at least 400.

### Future, only with evidence

Add a page only if Search Console shows a query cluster that the current page does not satisfy, and a SERP sample is mostly a different page type. First candidates, in order: stop words, duplicates, a real comparison after hands-on notes. Not before.

---
## 8. Feature specification

### Single (V1)

- Textarea, autofocus on desktop only. On mobile, do not autofocus. That would open the keyboard and cover the slug.
- Slug appears as the user types. Debounce 50ms. No Generate button.
- Output is an editable field in JetBrains Mono. Desktop: the right column. Mobile: directly under the source.
- Copy sits on the output, not below a fold. Success text "Copied" in a live region. If the clipboard fails, select the field and say "Select the slug and copy it."
- Clear sits with the source.
- URL preview is off until the user turns it on. It is one compact row, not a second panel. Empty prefix. Preview is `{prefix}/{slug}` or just the slug. On a short screen it stays inside the tool and must not push Copy off the visual viewport.
- Counts sit on the field labels: source characters, slug characters. No separate stats card.
- Core settings are a single inline row of segmented controls, visible without opening a panel: Separator (`-` or `_`), Lowercase, Letters (Latin accents to ASCII, or keep original), Maximum length (empty = none).
- Advanced opens a popover on desktop and a bottom sheet on mobile. It contains stop-word removal (off), number removal (off), `&` to `and` (on), and Reset. Custom maps and custom stop lists are not in V1. The trigger is always visible. The panel is not.
- Reset settings restores the defaults in section 9.
- If the user edits the slug, then edits the source, keep their slug and show "Update slug from title" rather than overwriting.

### Bulk (V1)

- Single and Bulk are navigation, in the header, on both pages. Choosing Bulk goes to `/bulk-slug-generator` and carries the current single title in `sessionStorage` under `osg.handoff` (one string). Choosing Single goes to `/`.
- Paste and Import are a second segmented control. Show one surface at a time. Paste is the default. Do not show an empty textarea and an empty drop zone together.
- One title per non-empty line for TXT and paste. Empty lines are skipped and counted ("3 empty lines skipped").
- Results are a table: row number, source, slug, state. State is ok, empty, duplicate, truncated, or edited.
- Slug cells are editable.
- Duplicate detection is case-sensitive on the final slug within the batch. The first occurrence stays. Later ones get `-2`, `-3`, unless that suffix already exists, then the next free integer. The user can edit any cell. Re-check after edit.
- Copy row, Copy all slugs, Copy TSV.
- Export CSV and TXT. CSV includes source columns plus `slug`.
- Clear asks for confirmation when more than 20 rows or a file is loaded.
- Render 100 rows per page. Processing computes the full batch. Do not mount 10,000 inputs.

### Not in the V1 screen

Developer mode, custom replacement tables, custom stop-word editor, JSON, XLSX, accounts, saved presets in the cloud, history of past slugs, SEO score, "keyword density."

### Presets (V1) — three, and they only set the basic controls

| Preset | Separator | Lowercase | Letters | Stop words | Numbers | Max length | `&` |
|---|---|---|---|---|---|---|---|
| Readable URL (default) | `-` | on | Latin accents to ASCII | off | keep | none | and |
| Short permalink | `-` | on | Latin accents to ASCII | on | keep | 60, at a word boundary | and |
| Keep original script | `-` | on if the script has case | keep | off | keep | none | and |

The preset control shows this table in plain text. Switching presets does not claim an SEO benefit. "Short permalink" warns: "Stop words and shortening can drop words you may want."

Underscore is a separator choice, not a fourth preset. There is no e-commerce preset: the default already keeps model numbers, which is the retail requirement.

### Later

- V1.1: custom character map, custom stop-word list, local preset save (`localStorage` only).
- V2: developer fixture panel, JSON export, broader transliteration chunk, WebMCP.

Users cannot reorder pipeline stages. Order is fixed because reordering changes meaning in ways the UI cannot explain honestly.

---
## 9. Slug engine and cleaning pipeline

One pure function. UI, CSV, and tests call it. No DOM inside the engine except a separate HTML-to-text helper that uses `DOMParser` and never assigns user HTML to `innerHTML` of the document.

### Configuration object

```ts
type SlugConfig = {
  separator: "-" | "_";          // V1 UI. Engine also accepts a single custom char in V1.1
  lowercase: boolean;            // default true
  letterPolicy: "latin-ascii" | "preserve"; // default latin-ascii
  stopWords: boolean;            // default false
  removeNumbers: boolean;        // default false
  ampersandToAnd: boolean;       // default true
  maxLength: number | null;      // code points, default null
  locale: "en";                  // stop list only
};
```

Defaults match Readable URL.

### Order (fixed)

1. **Parse.** Single mode: one string. Bulk paste/TXT: split on `\n` after normalizing CRLF to LF. CSV: parsed rows, chosen column. Do not slugify the whole file as one string.
2. **Clean, always.** Trim. Replace NBSP and other Unicode spaces with a normal space. Remove zero-width characters (`U+200B`, `U+200C`, `U+200D`, `U+FEFF`). Collapse whitespace. If the string contains `<` and `>`, extract text with `DOMParser` and drop `script` and `style` contents. Do not execute anything. Decode the entities the parser decodes. This step is not a checkbox. It is correctness.
3. **Unicode normalize.** NFC before any mapping, so `é` is one code point when we mean "accented e."
4. **Ampersand.** If enabled, replace `&` with ` and ` before punctuation stripping.
5. **Letter policy.** `latin-ascii`: NFKD, strip combining marks, then the small exception map: `ß→ss`, `Æ/æ→ae`, `Œ/œ→oe`, `Ø/ø→o`, `Ł/ł→l`, `Đ/đ→d`, `Þ/þ→th`, `Ð/ð→d`. Characters that are still non-Latin stay. `preserve`: skip this step. Do not load a multi-script dictionary in the first paint.
6. **Case.** Lowercase with `String.prototype.toLocaleLowerCase("en")` when enabled. This does not lowercase scripts that have no case.
7. **Filter.** Keep letters (Unicode `L`), numbers (`N`) unless `removeNumbers`, and turn every other run into one separator. Do not use a naive `a-z` class when policy is `preserve`.
8. **Stop words.** If enabled, drop tokens that are in the English list and are not the only remaining token. List: `a, an, and, as, at, but, by, for, from, in, into, nor, of, on, or, the, to, with`. Do not drop numbers. Do not use a multilingual list in V1.
9. **Separators.** Collapse repeats. Trim ends. Apply the chosen separator.
10. **Length.** If `maxLength` is set, cut at the last separator that fits. If the first token alone is longer, hard-cut that token. Set a truncated warning. Never leave a trailing separator.
11. **Batch duplicates.** After every row has a slug, assign suffixes. Suffixes use the same separator and count toward a second length pass only as a warning, not a silent second truncation that could re-collide. If the suffixed slug exceeds `maxLength`, surface a warning and keep the suffix. Uniqueness beats the length cap.
12. **Serialize.** CSV or TXT as in section 10.

### Before/after preview

Not a second panel on first load. A disclosure "What changed" shows: original, cleaned, slug, flags (truncated, transliterated, stop words removed, numbers removed, html stripped). For ordinary users the flags are enough: a one-line note under the slug when any destructive option is on.

### Determinism

Same config and same input always produce the same slug. No clock, no randomness, no locale other than `en` for the stop list and lowercase. Tests pin this.

### Dependency decision

No slug library. Latin folding is small and owned. A full transliterator such as `any-ascii` is a large data table and stays out of the initial bundle. V1.1 may lazy-load one if users ask for Cyrillic and Greek folding. Until then, those letters pass through under both policies, and the Unicode guide says so. This is a deliberate limit, not an accident.

---
## 10. Files

All parsing and serialization run in the browser.

| | V1 | Later |
|---|---|---|
| Import | TXT, CSV | JSON in V1.1 if requested. XLSX only if a real demand shows up. SheetJS is too heavy to add speculatively |
| Export | CSV, TXT, clipboard | JSON with the CSV columns in V1.1 |

### Import UX

- Drop zone and a file button. `accept=".txt,.csv,text/plain,text/csv"`.
- Reject above 5 MB with a specific message. Do not read the file.
- Above 10,000 data rows, process the first 10,000 and say how many were left out.
- TXT: each line is a source. No column picker.
- CSV: a real parser, not `split(",")`. Support quoted fields, commas inside quotes, `""` escapes, CRLF, LF, and a leading UTF-8 BOM. Header row if the first row is unique short strings and the user can override "this file has headers."
- Column picker lists header names or "Column 1". Default is the first column whose header matches `/name|title|handle/i`, else column 1.
- Other columns stay in memory and in the export.
- Malformed rows: keep the raw line in an error list with the line number. Do not throw away the good rows.
- Replace file and Clear are separate. Replace confirms.

### Export

- CSV filename `slugs.csv`. UTF-8 with BOM so Excel opens accents. Header row. Original headers preserved. Generated header is `slug` unless that name exists, then `slug_2`.
- TXT filename `slugs.txt`. One slug per line, same order, no extras.
- Quote fields that contain commas, quotes, or newlines.

### Privacy copy on the drop zone

"This file is read on your device. It is not uploaded." Do not say "completely secure." The privacy page explains host logs, extensions, and shared computers.

---
