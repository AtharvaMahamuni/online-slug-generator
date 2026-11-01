import { describe, expect, it } from "vitest";
import {
  assessFileSize,
  defaultTitleColumn,
  limitDataRows,
  looksLikeHeader,
  parseCsv,
  MAX_FILE_BYTES,
} from "../../src/lib/slug/csv";
import { buildExport, toCsv, toTxt } from "../../src/lib/slug/export";

describe("csv and export", () => {
  it("parses quoted commas and escaped quotes", () => {
    const parsed = parseCsv('Name,Note\r\n"Ada, Smith","says ""hi"""\r\n');
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toEqual([
      ["Name", "Note"],
      ["Ada, Smith", 'says "hi"'],
    ]);
  });

  it("strips a leading BOM and accepts LF", () => {
    const parsed = parseCsv("\uFEFFtitle,city\nRoses,Pune\n");
    expect(parsed.rows[0]).toEqual(["title", "city"]);
    expect(parsed.rows[1]).toEqual(["Roses", "Pune"]);
  });

  it("reports a broken quote and keeps the surrounding rows", () => {
    const parsed = parseCsv('Name,Note\ngood,one\n"bad,two\ngood,three\n');
    expect(parsed.rows).toEqual([
      ["Name", "Note"],
      ["good", "one"],
      ["good", "three"],
    ]);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0]?.line).toBe(3);
    expect(parsed.errors[0]?.raw).toContain("bad");
  });

  it("keeps a quoted field that legitimately spans lines", () => {
    const parsed = parseCsv('name,note\n"Ada","line1\nline2"\n');
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[1]).toEqual(["Ada", "line1\nline2"]);
  });

  it("detects a header row and lets the caller override it", () => {
    expect(looksLikeHeader(["Product ID", "Name"])).toBe(true);
    expect(looksLikeHeader(["How to prune roses in early June", "Name"])).toBe(false);
    expect(looksLikeHeader(["Name", "Name"])).toBe(false);
  });

  it("picks a title-like column, otherwise column 1", () => {
    expect(defaultTitleColumn(["SKU", "Product name", "Price"])).toBe(1);
    expect(defaultTitleColumn(["Handle", "Price"])).toBe(0);
    expect(defaultTitleColumn(["SKU", "Price"])).toBe(0);
    expect(defaultTitleColumn(null)).toBe(0);
  });

  it("keeps a missing cell as an empty string", () => {
    const parsed = parseCsv("id,title\n1001\n1002,Roses\n");
    expect(parsed.rows[1]).toEqual(["1001"]);
    expect(parsed.rows[1]?.[1] ?? "").toBe("");
  });

  it("rejects an oversize file before reading it", () => {
    const result = assessFileSize(MAX_FILE_BYTES + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("5 MB");
    expect(assessFileSize(MAX_FILE_BYTES).ok).toBe(true);
  });

  it("drops the 10001st data row and reports the count", () => {
    const rows = Array.from({ length: 10_001 }, (_, index) => `Title ${index + 1}`);
    const limited = limitDataRows(rows);
    expect(limited.kept).toHaveLength(10_000);
    expect(limited.dropped).toBe(1);
    expect(limited.kept[0]).toBe("Title 1");
  });

  it("round-trips Product ID and other columns into the CSV export", () => {
    const exported = buildExport({
      sourceHeaders: ["Product ID", "Name"],
      sourceRows: [
        ["SKU-1", "Samsung Galaxy S26"],
        ["SKU-2", "Samsung Galaxy S26"],
      ],
      slugs: ["samsung-galaxy-s26", "samsung-galaxy-s26-2"],
    });
    expect(exported.headers).toEqual(["Product ID", "Name", "slug"]);
    expect(exported.csv.charCodeAt(0)).toBe(0xfeff);
    expect(exported.csv).toContain("SKU-1");
    expect(exported.csv).toContain("samsung-galaxy-s26-2");
    expect(toTxt(exported.rows.map((row) => row[2] ?? ""))).toBe("samsung-galaxy-s26\nsamsung-galaxy-s26-2\n");
  });

  it("quotes commas, quotes, and newlines", () => {
    const csv = toCsv(["Note"], [['He said "hi", then left'], ["line1\nline2"]]);
    expect(csv).toContain('"He said ""hi"", then left"');
    expect(csv).toContain('"line1\nline2"');
  });

  it("names the generated column slug_2 when slug already exists", () => {
    const exported = buildExport({
      sourceHeaders: ["slug", "title"],
      sourceRows: [["old", "Hello"]],
      slugs: ["hello"],
    });
    expect(exported.headers).toEqual(["slug", "title", "slug_2"]);
  });

  it("parses TXT-style lines outside the CSV parser by splitting", () => {
    const lines = "Roses\r\n\r\nPrunes\r\n".replace(/\r\n/g, "\n").split("\n");
    const skipped = lines.filter((line) => line.trim() === "").length;
    const kept = lines.map((line) => line.trim()).filter(Boolean);
    expect(kept).toEqual(["Roses", "Prunes"]);
    expect(skipped).toBeGreaterThan(0);
  });
});
