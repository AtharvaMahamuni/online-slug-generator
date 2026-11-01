# SEO, GEO, and privacy

## 16. Traditional SEO

Primary sources to follow while writing, not slogans to stretch:

- Google, ecommerce URL structure (updated 2025-12-10): use descriptive words; the example path is hyphenated (`/product/black-t-shirt-with-a-white-collar`). https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites
- Google Search Central office hours, April 2024, Gary Illyes: keywords in URLs barely contribute to ranking; hyphens are clearer word separators than underscores. https://developers.google.com/search/help/office-hours/2024/april
- Google, AI optimization guide: generative AI search is still SEO; `llms.txt` is not needed for Google Search. https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Crawlable links must be `<a href>`. https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- FAQ rich results retired for all sites on 2026-05-07 (skill schema reference). Do not add `FAQPage` for a SERP feature.
- HowTo rich results removed September 2023.

Do not claim a slug length, stop-word removal, or schema markup produces rankings. The how-to page should say Google’s own spokesperson called URL keywords a small factor.

### Crawl and index

- Static HTML for all copy, examples, headings, and FAQ-style questions. The tool may be empty until JS runs. The definition and examples must not depend on JS.
- `robots.txt` allows `/` and points at the sitemap.
- Sitemap lists only the launch URLs. `lastmod` only when the page actually changes.
- Canonical on every page, https, no trailing slash, no parameters.
- One H1, unique title, unique description.
- Internal links as real anchors.
- No noindex on guides.
- 404 for unknown paths.
- Images: favicon SVG and, if a social image is made, one 1200×630 PNG or SVG-raster with a literal alt on the about page only. No decorative stock.

### Core Web Vitals

Lab targets in section 14. Field data does not exist yet. After launch, read CrUX or Search Console. INP, not FID.

### International URLs

The site is English-only. The tool's preserve-script behavior is documented so users do not think non-Latin slugs are "invalid." No hreflang.

### Measurement

| Question | How | What would falsify the page plan |
|---|---|---|
| Are we indexed? | URL Inspection, coverage report | Important URLs excluded |
| Which queries show the home vs bulk? | Search Console queries and pages | Bulk queries landing on home with poor engagement, or the reverse |
| Did a killed URL concept deserve a page? | Repeated queries with no matching page and a tool-like SERP | A query class with impressions and a different dominant page type |
| CWV | Search Console CWV report | Any URL outside "good" after the host is warm |
| Bing | Webmaster Tools, including AI performance if the property shows it | — |

No traffic targets. There is no baseline.

---
## 17. AI search and GEO

Crawlability is not citation. Google's guide says AI search optimization is SEO. Third-party statistics in the geo skill (AI Overview coverage, brand-mention correlations) are not repeated here as facts for this product.

### Crawler policy (owner must confirm before launch)

Recommended default, privacy-leaning, and reversible:

| User-agent | Purpose | V1 robots | Does not control |
|---|---|---|---|
| Googlebot | Google Search, AI Overviews, AI Mode | Allow | Training |
| Bingbot | Bing, Copilot's index | Allow | — |
| OAI-SearchBot | ChatGPT Search citations | Allow | Training |
| GPTBot | OpenAI training | Disallow | ChatGPT Search |
| Claude-SearchBot | Claude search citations | Allow | Training |
| ClaudeBot | Anthropic training | Disallow | Claude search |
| PerplexityBot | Perplexity search | Allow | — |
| Google-Extended | Gemini/Vertex training and grounding | Disallow | Google Search and AI Overviews |
| Applebot | Apple search surfaces | Allow | Apple Intelligence training |
| Applebot-Extended | Apple Intelligence training opt-out signal | Disallow | Siri/Spotlight/Safari search |
| CCBot | Common Crawl training | Disallow | — |
| ChatGPT-User, Google-Agent, Perplexity-User | User-triggered fetches | robots.txt may be ignored. Do not pretend it blocks them | — |

Sources for the split: OpenAI bot docs, Google crawler overview, Anthropic crawler article, Apple's Applebot-Extended article, as cited in the geo skill. Re-check those pages at implementation time. The skill says the vendor matrix goes stale.

Add Content-Signal `search=yes, ai-input=yes, ai-train=no` only as an experimental note inside the matching groups. It is not a Google ranking switch.

GitHub Pages has no WAF to configure. Say that. Do not claim bot authentication.

### Content shape for citation

Each guide opens with a direct answer in the first 60 words, then an example, then an exception, then a primary-source link. Question-style H2s where the H2 is a real question. Tables for before/after. Dates visible. No author biography that invents expertise. The tool itself is the original artifact.

### llms.txt

Ship a short `/llms.txt` that lists the tool and the five guides in one line each. Maintenance cost is low. Google says this file does not help or hurt Google Search. Do not describe it as an AI-ranking lever. Absence would also be acceptable. Shipping it is the choice because the file is tiny and the agentic skill treats a valid one as a P1 informational item, not a P0.

### WebMCP

Not in V1. The action is local and has no account or payment. A future `slugify` tool could wrap `pipeline()` and must not send text to a server. WebMCP is a draft, opposed by WebKit, and not a foundation. Revisit in V2 if agent use of the page is a real request.

### AI visibility tests (manual, quarterly)

Run the same seven prompts the brief lists, in ChatGPT search, Google AI Overviews or AI Mode, Perplexity, and Copilot. Record date, whether the site was named, which URL, which competitors were named, and whether the description of our privacy behavior was accurate. One success is not a trend. There is no automated GEO product in this plan. DataForSEO and Profound are not connected.

---
## 18. Analytics and privacy

V1 collects no product analytics. No Google Analytics, no Plausible, no event beacons. The privacy page can then say the site does not run a tracker.

Search measurement is Search Console and Bing Webmaster Tools, which the owner adds on the domain. Those are not scripts in the page.

If the owner later wants feature counts, use a cookieless counter and send only the event name from this allowed list: `single_used`, `bulk_used`, `slug_copied`, `copy_all`, `csv_imported`, `csv_exported`, `preset_selected`, `stop_words_on`, `duplicate_seen`, `theme_changed`. Never attach text, slugs, filenames, column headers, stop lists, or settings values that could encode a catalogue. That is a post-launch decision, not a V1 task.

No consent banner is required for V1 if no non-essential client storage is used for tracking. `localStorage` for theme and settings is functional. Mention it on the privacy page.

---
