#!/usr/bin/env python3
"""Probe python-slugify 9.2.0 behaviour on individual characters.

This script does not read or copy text-unidecode or Unidecode tables.
It calls python-slugify 9.2.0 on wrap strings (xx{ch}yy) and records the
observed mid-slug. Values observed from python-slugify 9.2.0 output per
character; no table copied from text-unidecode or Unidecode.

Usage (from the repository root, after the fixture venv exists):

    scripts/gen-parity-fixtures/.cache/venv/bin/python \\
      scripts/gen-parity-fixtures/probe-pyslugify-chars.py --write
"""

from __future__ import annotations

import argparse
import json
import sys
import unicodedata
from pathlib import Path

from slugify import slugify as python_slugify
import slugify as slugify_module

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
OUT = REPO / "src/lib/slug/parity-python-observed.json"
PINNED = "9.2.0"
PREFIX = "xx"
SUFFIX = "yy"

# Cheap, common ranges plus the Latin, Cyrillic and punctuation characters
# the preset already has to match on the published fixture. Other scripts
# are left unmapped and flagged as not matched.
RANGES = [
    (0x00A0, 0x024F),
    (0x0250, 0x02FF),
    (0x0300, 0x036F),
    (0x0400, 0x04FF),
    (0x1D00, 0x1DBF),
    (0x1E00, 0x1EFF),
    (0x2000, 0x206F),
    (0x20A0, 0x20CF),
    (0x20D0, 0x20FF),
    (0x2100, 0x214F),
    (0x2C60, 0x2C7F),
    (0xA720, 0xA7FF),
    (0xAB30, 0xAB6F),
    (0x180E, 0x180E),
    (0xFE00, 0xFE0F),
    (0xFEFF, 0xFEFF),
    (0xFFFC, 0xFFFC),
]


def nfkd_ascii(ch: str) -> str:
    return "".join(piece for piece in unicodedata.normalize("NFKD", ch) if not unicodedata.combining(piece))


def observed_mid(ch: str) -> str | None:
    slug = python_slugify(f"{PREFIX}{ch}{SUFFIX}")
    if not slug.startswith(PREFIX) or not slug.endswith(SUFFIX) or len(slug) < len(PREFIX) + len(SUFFIX):
        return None
    return slug[len(PREFIX) : len(slug) - len(SUFFIX)]


def probe() -> dict[str, str]:
    maps: dict[str, str] = {}
    skipped: list[str] = []
    for start, end in RANGES:
        for code in range(start, end + 1):
            if 0xD800 <= code <= 0xDFFF:
                continue
            char = chr(code)
            mid = observed_mid(char)
            if mid is None:
                skipped.append(char)
                continue
            folded = nfkd_ascii(char)
            # Already produced by a Unicode NFKD fold to ASCII; no map entry.
            if mid == folded.lower() and folded.isascii() and mid != "" and all(c.isalnum() for c in mid):
                continue
            # Punctuation, math/other symbols, and separators already become
            # a dash in the slug filter. Recording "-" for them is redundant.
            # Currency (Sc) and modifier (Sk) symbols can transliterate to
            # letters, so "-" is still recorded when that is the observed mid.
            category = unicodedata.category(char)
            if mid == "-" and (category[:1] in "PZ" or category in ("Sm", "So")):
                continue
            maps[char] = mid
    if skipped:
        sys.stderr.write(f"{len(skipped)} characters had no clean xx...yy wrap and were left unmapped\n")
    return maps


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help=f"write {OUT.relative_to(REPO)}")
    args = parser.parse_args()
    version = getattr(slugify_module, "__version__", "")
    if version != PINNED:
        raise SystemExit(f"python-slugify {version!r} does not match pin {PINNED}")
    maps = probe()
    payload = {
        "source": "values observed from python-slugify 9.2.0 output per character; no table copied from text-unidecode or Unidecode",
        "version": PINNED,
        "keys": "".join(maps),
        "values": list(maps.values()),
    }
    if args.write:
        OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        sys.stderr.write(f"wrote {len(maps)} mappings to {OUT.relative_to(REPO)}\n")
    else:
        json.dump(payload, sys.stdout, ensure_ascii=False, indent=2)
        sys.stdout.write("\n")


if __name__ == "__main__":
    main()
