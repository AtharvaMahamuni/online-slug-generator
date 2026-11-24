# Parity fixtures

## `parity.json`

Regenerated from the real pinned libraries by
`node scripts/gen-parity-fixtures/run.mjs` at the repository root.
Do not hand-write expected slugs. See
`scripts/gen-parity-fixtures/README.md` for versions and requirements.

## `sweep-expected.json.gz`

Compact expected slugs for every character from U+00A0 to U+FFFF, plus
the emoji and supplementary ranges the harness covers (Linear B,
mathematical alphanumeric symbols, emoji, a CJK Ext B sample, and
tags), generated from the real libraries and wrapped as `xx{ch}yy`.
WordPress, Django and npm slugify values are stored as plaintext.
python-slugify expected slugs are stored only as the first 12 hex
characters of the SHA-256 of the expected slug, not as plaintext, so
this file does not commit text-unidecode-derived output. This file is
test-only. Do not import it from `src/`. Do not hand-write the expected
slugs. `tests/slug/sweep.test.ts` hashes the in-app python-slugify
preset output and compares that prefix; it fails on a silent mismatch
for all four presets. False flags are allowed. An empty slug hashes
like any other slug; a flagged mismatch is not silent.

### How to regenerate

From the repository root, after the fixture caches exist:

```
node scripts/gen-parity-fixtures/sweep-chars.mjs
```

That command writes this `sweep-expected.json.gz` file (BMP and
supplementary planes together).

Pinned library versions (the same pins as `parity.json`):

- WordPress 7.1.5, `sanitize_title()` (default `save` context)
- Django 6.1.3, `django.utils.text.slugify`
- python-slugify 9.2.0
- npm `slugify` 1.6.9 with `{ lower: true, strict: true }`

Requirements: Node (the repo pin, 22.23.4 or the README engine),
Python 3, and PHP with `mbstring`. The first run of
`node scripts/gen-parity-fixtures/run.mjs` downloads WordPress 7.1.5
and installs the Python and npm packages into
`scripts/gen-parity-fixtures/.cache/` (gitignored).
`sweep-chars.mjs` reuses that cache; it needs the WordPress tree, PHP
to run `sanitize_title`, and the Python venv with Django 6.1.3 and
python-slugify 9.2.0.
