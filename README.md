# Online Slug Generator

Free, static URL slug tool. Titles and files are processed in the browser. There is no account, no analytics script, and no ads.

The product decisions live in [docs/blueprint/](docs/blueprint/README.md). This file is how to run the site.

## Develop

```bash
npm install
npm run dev
```

Node 22.23.4 or newer. Astro 7.4.4 refuses to build on older 22.x releases. `npm install` can succeed on 22.23.1, and `astro build` will not.

## Test and build

```bash
npm test
npm run check
npm run build
npm run test:e2e
```

`npm test` runs Vitest for the slug pipeline, settings, files, content floors, and a 10,000-title batch. `npm run build` writes `dist/` and fails if the tool JavaScript exceeds 45 KB gzipped, the CSS exceeds 15 KB gzipped, or the home page exceeds 40 KB gzipped. The 30 KB JavaScript figure is a target. The build fails at 45 KB. `npm run test:e2e` needs a fresh `dist/` and Playwright Chromium. The preview command stays in the foreground (`--ignore-lock`) so the test runner can shut it down:

```bash
npx playwright install chromium
```

End-to-end coverage is the single and bulk flows, CSV column mapping, themes, keyboard, reduced motion, the reference viewports, 200% CSS zoom, axe on the home page, the bulk page, and one guide, and screenshot baselines for both tools.

## Lab checks (1 November 2026)

Measured on the production build, mobile Lighthouse 12.8.2, simulated slow 4G (150 ms RTT, 1,638 Kbps). Performance and accessibility both scored 100 on `/`, `/bulk-slug-generator`, and `/guides/what-is-a-url-slug`.

| Page | LCP | CLS | LCP element |
|---|---|---|---|
| Home | 1.5 s | 0.000 | Definition sentence, in the first HTML |
| Bulk | 1.1 s | 0.000 | Definition sentence, in the first HTML |
| What-is guide | 1.4 s | 0.009 | Opening paragraph, in the first HTML |

Budgets are LCP ≤ 2.5 s and CLS ≤ 0.1. Total blocking time was 0 ms on each page. Gzip sizes from the same build: tool JavaScript 8,161 bytes, CSS 3,962 bytes, home HTML 6,208 bytes.

Typing “How to prune roses in June” in Chromium produced a worst event duration of 16 ms. The interaction budget is 200 ms. Ten thousand typical titles finished in the Vitest batch in 93 ms. The budget is 2 seconds, and the table still renders 100 rows.

A manual VoiceOver or NVDA pass is not recorded. This machine has neither. Do not treat the axe or Lighthouse accessibility scores as that pass, and do not claim AAA.

## Deploy

GitHub Actions in `.github/workflows/pages.yml` tests, builds, and publishes `dist/` to GitHub Pages. `public/CNAME` is `onlinesluggenerator.com`. Do not commit `dist/` or `node_modules`.

Pages serves `about.html` at `/about`. The canonical form has no trailing slash. A trailing slash does not have a folder index and should 404. `404.html` is the real not-found page and is `noindex`. Confirm that on the host before calling the launch done. GitHub Pages has no WAF.

## Open assumptions

- The canonical host is `onlinesluggenerator.com`. Owning that DNS name is not something the repository can prove.
- Contact is GitHub issues on [AtharvaMahamuni/online-slug-generator](https://github.com/AtharvaMahamuni/online-slug-generator). There is no email address and no form.
- Training crawlers are disallowed in `robots.txt`: GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, and CCBot. Search crawlers stay allowed. The owner should confirm that split before launch. `robots.txt` does not block user-triggered fetches such as ChatGPT-User, Google-Agent, or Perplexity-User.
- No legal entity is named. The publisher is “Online Slug Generator”.
- `/guides` is in the sitemap. The architecture lists that hub. The launch table in the blueprint listed the five articles and not the hub. Shipping the hub, and listing it, is the choice so the header link is a real page.
- `llms.txt` lists real URLs only. It is not a ranking file. Google has said it does not help or hurt Google Search.
- Search volumes are not invented here. Measure with Search Console and Bing Webmaster Tools after the domain resolves.

## Multilingual & SEO Verification

The site supports 5 languages (English, Spanish, German, French, Portuguese) with localized slug engines (e.g. German umlauts `ä/ö/ü` -> `ae/oe/ue`, localized ampersand mapping, curated stop words) and bidirectional `hreflang` alternates across all tool endpoints.

Run the continuous automated SEO audit:
```bash
npm run audit:seo
```

## Not in this version

Custom character maps, custom stop lists, JSON, XLSX, accounts, ads, analytics, FAQ or HowTo schema, comparison pages, and WebMCP.
