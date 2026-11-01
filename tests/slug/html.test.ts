// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { slugify } from "../../src/lib/slug/pipeline";
import { extractHtmlText } from "../../src/scripts/html-text";

describe("html text extraction", () => {
  it("reads text from tags and ignores script and style", () => {
    const extracted = extractHtmlText("<div><b>Hi</b><script>secret()</script><style>.x{}</style></div>");
    expect(extracted.htmlStripped).toBe(true);
    expect(extracted.text).toContain("Hi");
    expect(extracted.text).not.toContain("secret");
    expect(extracted.text).not.toContain(".x");
    expect(slugify(extracted.text, undefined, { htmlStripped: true }).slug).toBe("hi");
  });

  it("leaves plain titles untouched", () => {
    const extracted = extractHtmlText("Hello World");
    expect(extracted).toEqual({ text: "Hello World", htmlStripped: false });
  });
});
