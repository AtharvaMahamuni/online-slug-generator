export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function slugHeader(headers: string[]): string {
  const taken = new Set(headers);
  if (!taken.has("slug")) return "slug";
  let n = 2;
  while (taken.has(`slug_${n}`)) n += 1;
  return `slug_${n}`;
}

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) => row.map((cell) => escapeCsvField(cell)).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function toTxt(slugs: string[]): string {
  return `${slugs.join("\n")}${slugs.length ? "\n" : ""}`;
}

export function buildExport(options: {
  sourceHeaders: string[] | null;
  sourceRows: string[][];
  slugs: string[];
}): { headers: string[]; rows: string[][]; csv: string; txt: string } {
  const sourceHeaders = options.sourceHeaders ?? columnNames(options.sourceRows);
  const header = slugHeader(sourceHeaders);
  const headers = [...sourceHeaders, header];
  const rows = options.sourceRows.map((row, index) => [...pad(row, sourceHeaders.length), options.slugs[index] ?? ""]);
  return { headers, rows, csv: toCsv(headers, rows), txt: toTxt(options.slugs) };
}

function columnNames(rows: string[][]): string[] {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return Array.from({ length: Math.max(width, 1) }, (_, index) => `Column ${index + 1}`);
}

function pad(row: string[], width: number): string[] {
  const next = row.slice(0, width);
  while (next.length < width) next.push("");
  return next;
}
