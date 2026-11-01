# Architecture

## 14. Technical architecture

### Stack

- Astro, current stable at implementation time, `output: 'static'`. The skill's CSV mentioned Astro 7.1.6 on 2026-08-13. Pin whatever `npm view astro version` says when building. Do not copy that CSV date into package.json blindly.
- TypeScript strict.
- CSS variables. No Tailwind, unless implementation discovers a strong reason. DESIGN.md maps cleanly to variables. A utility framework is an extra dependency.
- Vitest for the engine.
- Playwright for the two tool flows.
- No React, Vue, Svelte, or slug SaaS SDK.

### Folder structure

```
online-slug-generator/
  astro.config.ts
  package.json
  tsconfig.json
  public/
    favicon.svg
    robots.txt
    CNAME
  src/
    pages/
      index.astro
      bulk-slug-generator.astro
      about.astro
      privacy.astro
      contact.astro
      guides/
        index.astro
        what-is-a-url-slug.astro
        how-to-create-url-slugs.astro
        hyphens-vs-underscores-in-urls.astro
        unicode-and-international-urls.astro
        bulk-url-slug-generation.astro
      404.astro
    layouts/BaseLayout.astro
    components/
    styles/tokens.css
    styles/global.css
    lib/slug/
      types.ts
      pipeline.ts
      clean.ts
      letters.ts
      stopwords.ts
      duplicates.ts
      csv.ts
      export.ts
    scripts/theme-boot.ts   # inlined at build, not a module request
    scripts/tool.ts
  tests/slug/
  tests/e2e/
  docs/blueprint/
```

`site` is `https://onlinesluggenerator.com`. `trailingSlash: 'never'`. Canonicals have no trailing slash. GitHub Pages must redirect the slash variant to the canonical or serve one only. Prefer an Astro-generated 404, and confirm Pages does not rewrite unknown URLs to `index.html` (that would soft-404). If the host cannot emit a real 404, record it as a launch defect.

### Module rules

- `lib/slug/*` imports no Astro, no DOM, no `localStorage`. `clean.ts` HTML extraction that needs `DOMParser` lives in `scripts/html-text.ts` and is applied before `pipeline` on the client. Tests feed already-extracted strings, plus a separate DOMParser test in Playwright or happy-dom.
- `tool.ts` is the only hydrated logic. Guides have no client script.
- Settings persistence: `localStorage` key `osg.settings` with a version field. Unknown versions are ignored and replaced with defaults.

### Performance budgets

| Metric | Budget |
|---|---|
| Tool JS, compressed | ≤ 30 KB. Fail the build if the tool chunk exceeds 45 KB |
| CSS, compressed | ≤ 15 KB |
| Home HTML | ≤ 40 KB compressed |
| LCP | ≤ 2.5s on a mid mobile profile in lab. The LCP element should be the H1 or the textarea, which is in HTML |
| INP | ≤ 200ms while typing a normal title. Bulk: input stays responsive; heavy batches yield every 500 rows via `setTimeout(0)` |
| CLS | ≤ 0.1. No late fonts that reflow: `size-adjust` fallbacks, `font-display: swap` only if a metric override exists. Otherwise block on the small self-hosted fonts |
| Batch | 10,000 rows of typical titles complete in under 2 seconds on a laptop, without mounting 10,000 inputs |
| Worker | Not in V1. Add one only if a profile shows a long task over 200ms that yielding does not fix |

### Large-batch rule

Compute all slugs in memory. Render 100. Export from memory.

---
## 15. Accessibility

Target WCAG 2.2 AA.

- One H1 per page. Guide headings do not skip levels.
- Every control has a visible label. Placeholders are not labels.
- Skip link "Skip to the tool" on tool pages, "Skip to content" on guides.
- Touch targets at least 44×44px for copy, theme, file, and pager.
- File input has a label. Drag-and-drop is extra, not the only path.
- Color is not the only duplicate signal. Use the word "Duplicate" plus a suffix.
- Contrast checked in both themes, including muted and error text.
- Keyboard: the entire tool works with Tab, Shift+Tab, Enter, and Space. No trap.
- `prefers-reduced-motion` honored.
- Language `lang="en"`.
- Do not disable zoom.

Test scenarios are in section 19.

---
