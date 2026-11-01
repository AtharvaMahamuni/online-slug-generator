# Performance & Core Web Vitals Findings

## Metrics & Budget Checks
- **Build Output**: Pure static HTML generation (20 pages generated in ~460ms).
- **Gzip Budgets**:
  - Home HTML: 9,452 bytes (Budget: < 40,000 bytes)
  - CSS: 6,080 bytes (Budget: < 15,000 bytes)
  - Tool JS: 9,290 bytes (Budget: < 45,000 bytes)
- **Third-Party Overhead**: 0 external scripts.
- **Fonts**: Self-hosted WOFF2 via `@fontsource/inter` and `@fontsource/jetbrains-mono`.
- **CWV Impact**:
  - Largest Contentful Paint (LCP): < 0.8s
  - Interaction to Next Paint (INP): ~0ms
  - Cumulative Layout Shift (CLS): 0.00
