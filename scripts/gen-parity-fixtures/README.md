# Parity fixture generator

This script runs the real libraries once and writes `tests/slug/fixtures/parity.json`.
Do not hand-write expected slugs. The Online Slug Generator presets are a set of
rules in the app bundle; they do not import these libraries at runtime.

## Pinned versions

- WordPress 7.1.5, `sanitize_title()` (default `save` context, which runs `remove_accents` and the default `sanitize_title_with_dashes` filter)
- Django 6.1.3, `django.utils.text.slugify` (default `allow_unicode=False`)
- python-slugify 9.2.0
- npm `slugify` 1.6.9 with `{ lower: true, strict: true }`

## Requirements

- Node 24, Python 3, PHP with `mbstring`
- Network on the first run, to download WordPress 7.1.5 and install the Python and npm packages into `.cache/` (gitignored)

## Regenerate

From the repository root:

```
node scripts/gen-parity-fixtures/run.mjs
```

The committed JSON is the source of truth for `tests/slug/parity.test.ts` and the home-page table.
