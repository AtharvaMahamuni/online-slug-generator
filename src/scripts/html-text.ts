export function extractHtmlText(input: string): { text: string; htmlStripped: boolean } {
  if (!input.includes("<") || !input.includes(">")) {
    return { text: input, htmlStripped: false };
  }
  const doc = new DOMParser().parseFromString(input, "text/html");
  doc.querySelectorAll("script, style, noscript").forEach((node) => node.remove());
  return { text: doc.body?.textContent ?? "", htmlStripped: true };
}
