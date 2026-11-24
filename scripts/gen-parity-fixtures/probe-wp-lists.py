#!/usr/bin/env python3
"""Probe WordPress 7.1.5 behaviour on individual characters.

This script does not read or copy WordPress PHP tables. It sends characters
to the real 7.1.5 library (remove_accents and sanitize_title) and records
where the result differs from Unicode NFD folding or from keeping the
percent-encoded form.

It also records two lists the preset ships as data
(src/lib/slug/parity-wp-unfolded.json, written with --write):

- unfolded: Latin letters that NFD would strip a mark from, but that
  remove_accents leaves unchanged, so WordPress percent-encodes them
  (for example the IAST letters in Kr\u1e5b\u1e63\u1e47a).
- keep_case: characters that JavaScript lowercases but WordPress does not
  (its mb_strtolower uses an older Unicode version). The candidates come
  from Node; the decision comes from the real sanitize_title output.

Usage (from the repository root):

    WORDPRESS_ROOT=scripts/gen-parity-fixtures/.cache/wordpress \\
      python3 scripts/gen-parity-fixtures/probe-wp-lists.py

    python3 scripts/gen-parity-fixtures/probe-wp-lists.py --count-fixture
    python3 scripts/gen-parity-fixtures/probe-wp-lists.py --write
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
PHP_HELPER = HERE / "probe-wp-char.php"
FIXTURE = REPO / "tests/slug/fixtures/parity.json"
UNFOLDED_DATA = REPO / "src/lib/slug/parity-wp-unfolded.json"


def js_eval(script: str):
    out = subprocess.run(["node", "-e", script], stdout=subprocess.PIPE, check=True)
    return json.loads(out.stdout.decode("utf-8"))


def js_lowercase_changes() -> list[str]:
    """Characters U+00A0..U+FFFF that Node's toLocaleLowerCase("en") changes."""
    return js_eval(
        "const o=[];for(let c=0xa0;c<=0xffff;c++){if(c>=0xd800&&c<=0xdfff)continue;"
        "const h=String.fromCodePoint(c);if(h.toLocaleLowerCase('en')!==h)o.push(h)}"
        "process.stdout.write(JSON.stringify(o))"
    )


def js_latin_letters() -> set[str]:
    """Letters with Script=Latin according to the same Unicode property the preset uses."""
    return set(js_eval(
        "const o=[];for(let c=0xa0;c<=0xffff;c++){if(c>=0xd800&&c<=0xdfff)continue;"
        "const h=String.fromCodePoint(c);if(/\\p{Script=Latin}/u.test(h)&&/\\p{L}/u.test(h))o.push(h)}"
        "process.stdout.write(JSON.stringify(o))"
    ))


def nfd_strip(ch: str) -> str:
    return "".join(piece for piece in unicodedata.normalize("NFD", ch) if not unicodedata.combining(piece))


def percent_encode(text: str) -> str:
    return "".join(f"%{byte:02x}" if byte >= 128 else chr(byte) for byte in text.encode("utf-8"))


def call_wp(inputs: list[str]) -> list[dict]:
    root = os.environ.get("WORDPRESS_ROOT")
    if not root:
        raise SystemExit("WORDPRESS_ROOT is not set")
    proc = subprocess.run(
        ["php", str(PHP_HELPER)],
        input=json.dumps(inputs, ensure_ascii=False).encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        env={**os.environ, "WORDPRESS_ROOT": root},
    )
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr.decode("utf-8", "replace"))
        raise SystemExit(proc.returncode)
    return json.loads(proc.stdout.decode("utf-8"))


def chunked(items: list[str], size: int = 500):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def probe() -> dict:
    special_inputs: list[str] = []
    for start, end in (
        (0x00A0, 0x024F),
        (0x0250, 0x02AF),
        (0x1E00, 0x1EFF),
        (0x2C60, 0x2C7F),
        (0xA720, 0xA7FF),
        (0xFB00, 0xFB06),
        (0x20A0, 0x20CF),
    ):
        for cp in range(start, end + 1):
            if 0xD800 <= cp <= 0xDFFF:
                continue
            special_inputs.append(chr(cp))

    encode_inputs: list[str] = []
    for cp in range(0x00A0, 0x10000):
        if 0xD800 <= cp <= 0xDFFF:
            continue
        encode_inputs.append(chr(cp))
    encode_inputs.extend(["\U0001F600", "\U0001F389"])

    # Already-percent-encoded sequences that save-context replacements can see.
    literal_encoded = ["%ef%bb%bf", "%ef%bf%bc"]

    results: dict[str, dict] = {}
    for group in chunked(special_inputs + encode_inputs + literal_encoded, 800):
        for row in call_wp(group):
            results[row["input"]] = row

    specials: dict[str, str] = {}
    special_candidates = list(dict.fromkeys(special_inputs + encode_inputs))
    for ch in special_candidates:
        ra = results[ch]["remove_accents"]
        nfd = nfd_strip(ch)
        # Ignore normalization-only differences (the same letters in a
        # different Unicode form). Keep mappings that change the character.
        if unicodedata.normalize("NFC", ra) == unicodedata.normalize("NFC", nfd):
            continue
        if ra == ch:
            continue
        specials[ch] = ra

    hyphen: list[str] = []
    to_x: list[str] = []
    strip: list[str] = []
    seen: set[str] = set()
    for ch in encode_inputs:
        folded = results[ch]["remove_accents"].lower()
        encoded = percent_encode(folded)
        if not encoded or "%" not in encoded or encoded in seen:
            continue
        real = results[ch]["slug"]
        if real == "xx-yy":
            hyphen.append(encoded)
            seen.add(encoded)
        elif real == "xxyy":
            strip.append(encoded)
            seen.add(encoded)
        elif real == "xxxyy":
            to_x.append(encoded)
            seen.add(encoded)

    for code in literal_encoded:
        real = results[code]["slug"]
        if real == "xxyy" and code not in seen:
            strip.append(code)
            seen.add(code)
        elif real == "xx-yy" and code not in seen:
            hyphen.append(code)
            seen.add(code)

    hyphen.sort()
    to_x.sort()
    strip.sort()

    # Latin-script letters NFD would fold that WordPress leaves alone,
    # including letterlike signs such as Å whose names do not contain LATIN.
    latin_letters = js_latin_letters()
    unfolded: list[str] = []
    for cp in range(0x00A0, 0x10000):
        if 0xD800 <= cp <= 0xDFFF:
            continue
        ch = chr(cp)
        if ch not in latin_letters:
            continue
        if ch in specials or nfd_strip(ch) == ch:
            continue
        if results[ch]["remove_accents"] == ch:
            unfolded.append(ch)

    # Characters JavaScript lowercases where WordPress keeps the case.
    keep_case: list[str] = []
    for ch in js_lowercase_changes():
        if results[ch]["slug"] == "xx" + percent_encode(ch) + "yy":
            keep_case.append(ch)

    return {
        "versions": {"wordpress": "7.1.5"},
        "specials": specials,
        "encoded_to_hyphen": hyphen,
        "encoded_to_x": to_x,
        "encoded_strip": strip,
        "unfolded": "".join(unfolded),
        "keep_case": "".join(keep_case),
    }


def count_fixture(data: dict) -> dict:
    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    titles = [row["title"] for row in fixture["rows"]]
    special_hit = 0
    special_keys = []
    for ch in data["specials"]:
        if any(ch in title for title in titles):
            special_hit += 1
            special_keys.append(ch)
    codes = data["encoded_to_hyphen"] + data["encoded_to_x"] + data["encoded_strip"]
    code_hit = 0
    code_keys = []
    for code in codes:
        exercised = False
        for title in titles:
            if code.lower() in title.lower():
                exercised = True
                break
            for ch in title:
                folded = nfd_strip(ch).lower()
                if percent_encode(ch) == code or percent_encode(ch.lower()) == code or percent_encode(folded) == code:
                    exercised = True
                    break
        if exercised:
            code_hit += 1
            code_keys.append(code)
    return {
        "specials_total": len(data["specials"]),
        "specials_exercised": special_hit,
        "specials_exercised_keys": special_keys,
        "encoded_total": len(codes),
        "encoded_exercised": code_hit,
        "encoded_exercised_keys": code_keys,
        "lists_total": len(data["specials"]) + len(codes),
        "lists_exercised": special_hit + code_hit,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count-fixture", action="store_true")
    parser.add_argument("--write", action="store_true", help=f"write {UNFOLDED_DATA.relative_to(REPO)}")
    args = parser.parse_args()
    data = probe()
    if args.write:
        payload = {
            "source": "scripts/gen-parity-fixtures/probe-wp-lists.py against WordPress 7.1.5",
            "unfolded": data["unfolded"],
            "keepCase": data["keep_case"],
        }
        UNFOLDED_DATA.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        sys.stderr.write(f"wrote {len(data['unfolded'])} unfolded, {len(data['keep_case'])} keep-case\n")
    if args.count_fixture:
        data["fixture_exercise"] = count_fixture(data)
    json.dump(data, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
