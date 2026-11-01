# International SEO & Hreflang Findings

## Implementation Architecture
- **Language Set**: English (`en`), Español (`es`), Deutsch (`de`), Français (`fr`), Português (`pt`), plus `x-default`.
- **Targeting Method**: Combined HTML `<link rel="alternate" hreflang="...">` tags and `<xhtml:link rel="alternate">` in `sitemap.xml`.

## Validation Matrix
- **ISO 639-1 Compliance**: All language tags are valid 2-letter codes.
- **Self-Referencing**: Every page in the alternate cluster includes an exact self-referencing tag.
- **Return Tags (Bidirectional)**:
  - `en` <-> `es`
  - `en` <-> `de`
  - `en` <-> `fr`
  - `en` <-> `pt`
  - All alternates link back to every other alternate in the set.
- **Non-Localized Pages Safeguard**:
  - Unlocalized pages (`/about`, `/contact`, `/privacy`, `/guides/*`) do not emit hreflang tags to prevent Google crawl errors on non-existent localized URLs.
  - 404 error page cleanly omits hreflang.
