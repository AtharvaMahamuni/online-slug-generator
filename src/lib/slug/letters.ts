const EXCEPTIONS: Record<string, string> = {
  ß: "ss",
  ẞ: "ss",
  Æ: "ae",
  æ: "ae",
  Œ: "oe",
  œ: "oe",
  Ø: "o",
  ø: "o",
  Ł: "l",
  ł: "l",
  Đ: "d",
  đ: "d",
  Þ: "th",
  þ: "th",
  Ð: "d",
  ð: "d",
};

const GERMAN_UMLAUTS: Record<string, string> = {
  ä: "ae",
  Ä: "ae",
  ö: "oe",
  Ö: "oe",
  ü: "ue",
  Ü: "ue",
};

export function foldLatinAscii(input: string, locale?: string): { text: string; transliterated: boolean } {
  let source = input;
  let umlautsReplaced = false;
  if (locale === "de") {
    source = input.replace(/[äÄöÖüÜ]/g, (match) => {
      umlautsReplaced = true;
      return GERMAN_UMLAUTS[match] ?? match;
    });
  }
  const nfkd = source.normalize("NFKD");
  const stripped = nfkd.replace(/\p{M}/gu, "");
  let transliterated = umlautsReplaced || nfkd !== source || stripped !== nfkd;
  let text = "";
  for (const ch of stripped) {
    const mapped = EXCEPTIONS[ch];
    if (mapped) {
      text += mapped;
      transliterated = true;
    } else {
      text += ch;
    }
  }
  return { text, transliterated };
}
