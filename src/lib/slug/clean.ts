const ZERO_WIDTH = /[\u200B\u200C\u200D\uFEFF]/g;
const UNICODE_SPACES = /\p{Zs}/gu;

export function cleanText(input: string): string {
  return input
    .replace(ZERO_WIDTH, "")
    .replace(UNICODE_SPACES, " ")
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFC");
}
