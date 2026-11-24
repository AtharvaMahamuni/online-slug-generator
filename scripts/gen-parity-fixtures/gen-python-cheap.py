#!/usr/bin/env python3
"""Generate src/lib/slug/parity-python-cheap.json from text-unidecode.

python-slugify 9.2.0 uses text-unidecode when Unidecode is not installed.
This script records only the cheap, common ranges the preset ships:
Latin Extended-B and -C, IPA and phonetic extensions, spacing modifier
letters (ʹ ʺ ˆ), currency (₦), U+2066..U+2069 and U+180E. Characters
already handled by NFKD-to-ASCII are omitted.

Usage (from the repository root, after the fixture venv exists):

    scripts/gen-parity-fixtures/.cache/venv/bin/python \\
      scripts/gen-parity-fixtures/gen-python-cheap.py
"""

from __future__ import annotations

import json
import unicodedata
from pathlib import Path

from text_unidecode import unidecode

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / "src/lib/slug/parity-python-cheap.json"

RANGES = [
    (0x0180, 0x024F),  # Latin Extended-B
    (0x0250, 0x02AF),  # IPA Extensions
    (0x02B0, 0x02FF),  # Spacing Modifier Letters, including ʹ ʺ ˆ
    (0x1D00, 0x1DBF),  # Phonetic Extensions (IPA small capitals)
    (0x2C60, 0x2C7F),  # Latin Extended-C
    (0x20A0, 0x20CF),  # currency, including ₦
    (0x2066, 0x2069),  # directional isolates
    (0x180E, 0x180E),  # Mongolian vowel separator
    (0x0482, 0x0482),  # CYRILLIC THOUSANDS SIGN (text-unidecode: " 1000 ")
    (0x1E00, 0x1EFF),  # Latin Extended Additional (non-decomposing letters)
    (0xA720, 0xA7FF),  # Latin Extended-D
    (0xAB30, 0xAB6F),  # Latin Extended-E
    (0x2060, 0x206F),  # word joiner and other format characters
    (0x20D0, 0x20FF),  # combining marks for symbols (keycap)
    (0xFE00, 0xFE0F),  # variation selectors
]


def nfkd_ascii(ch: str) -> str:
    return "".join(piece for piece in unicodedata.normalize("NFKD", ch) if not unicodedata.combining(piece))


def python_transliterate(ch: str) -> str:
    """Match python-slugify: unidecode(NFKD(ch))."""
    return unidecode(unicodedata.normalize("NFKD", ch))


def main() -> None:
    maps: dict[str, str] = {}
    for start, end in RANGES:
        for code in range(start, end + 1):
            char = chr(code)
            decomposed = unicodedata.normalize("NFKD", char)
            # Precomposed letters are handled by NFKD plus a piece mapping.
            # Recording unidecode(char) here would skip that first step and
            # disagree with python-slugify (for example ǯ).
            if decomposed != char:
                continue
            mapped = unidecode(char)
            folded = nfkd_ascii(char)
            if mapped == char:
                continue
            if mapped == folded and folded.isascii():
                continue
            maps[char] = mapped
    # Keys are stored as one string, not object keys: a minifier may emit
    # newer Unicode letters as bare identifiers that older browsers reject.
    payload = {
        "source": "text-unidecode via python-slugify 9.2.0, cheap ranges only",
        "keys": "".join(maps),
        "values": list(maps.values()),
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(maps)} mappings to {OUT}")


if __name__ == "__main__":
    main()
