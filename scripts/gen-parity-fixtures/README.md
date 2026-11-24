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

## Unsupported rows

After the real libraries write their outputs, `annotate.ts` compares them to
the in-app rules and lists a preset in `unsupported` when the two differ.
Do not hand-edit those flags.

## WordPress list probe

`probe-wp-lists.py` records the special-case and encoded replacement lists used
by the WordPress preset. It calls WordPress 7.1.5 `remove_accents` and
`sanitize_title` on individual characters. It does not read WordPress PHP
tables.

```
WORDPRESS_ROOT=scripts/gen-parity-fixtures/.cache/wordpress \
  python3 scripts/gen-parity-fixtures/probe-wp-lists.py --count-fixture
```

`--count-fixture` reports how many recorded entries are exercised by
`tests/slug/fixtures/parity.json`.

## WordPress unfolded letters

`probe-wp-lists.py --write` also records Latin-script letters that
`remove_accents` leaves unchanged but that Unicode NFD would fold, plus
characters JavaScript lowercases that WordPress 7.1.5 does not. Those
lists are committed as `src/lib/slug/parity-wp-unfolded.json` and are
what the WordPress preset consults. The script does not read WordPress
PHP tables.

```
WORDPRESS_ROOT=scripts/gen-parity-fixtures/.cache/wordpress \
  python3 scripts/gen-parity-fixtures/probe-wp-lists.py --write --count-fixture
```

## python-slugify cheap maps

`gen-python-cheap.py` records text-unidecode outputs (the backend
python-slugify 9.2.0 uses here) for Latin Extended-B/C/D/E, IPA and
phonetic extensions, spacing modifiers (ʹ ʺ ˆ), currency (₦),
directional isolates, U+180E, and a few format/variation characters.
Keys are stored as one string so the built bundle does not emit bare
Unicode identifiers. The preset flags any other character whose output
it does not know, rather than guessing.

```
scripts/gen-parity-fixtures/.cache/venv/bin/python \
  scripts/gen-parity-fixtures/gen-python-cheap.py
```

## Single-character sweep

`sweep-chars.mjs` runs the real pinned libraries on every character from
U+00A0 to U+FFFF (as `xx{ch}yy`) and writes compact expected slugs to
`tests/slug/fixtures/sweep-expected.json.gz`. That file is test-only; do
not import it from `src/`. Do not hand-write the expected slugs.

```
node scripts/gen-parity-fixtures/sweep-chars.mjs
```
