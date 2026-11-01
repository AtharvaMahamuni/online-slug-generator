export type CsvError = { line: number; raw: string };

export type CsvParseResult = {
  rows: string[][];
  errors: CsvError[];
};

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_DATA_ROWS = 10_000;

export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseCsv(input: string): CsvParseResult {
  const text = stripBom(input).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  const errors: CsvError[] = [];
  let line = 1;
  let index = 0;

  while (index < text.length) {
    if (text[index] === "\n") {
      rows.push([""]);
      index += 1;
      line += 1;
      continue;
    }
    const start = index;
    const startLine = line;
    const parsed = readRecord(text, index, line);
    if (parsed.error) {
      const end = parsed.resumeAt;
      errors.push({ line: startLine, raw: text.slice(start, end).replace(/\n$/, "") });
      index = end;
      line = parsed.line;
      continue;
    }
    rows.push(parsed.fields);
    index = parsed.index;
    line = parsed.line;
  }

  return { rows, errors };
}

function readRecord(
  text: string,
  index: number,
  line: number,
): { fields: string[]; index: number; line: number; error: boolean; resumeAt: number } {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  const start = index;

  while (index < text.length) {
    const ch = text[index];
    if (inQuotes) {
      if (ch === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      if (ch === "\n") {
        const resumeAt = recoverAt(text, start);
        if (resumeAt !== null) {
          return { fields, index, line, error: true, resumeAt };
        }
        field += ch;
        index += 1;
        line += 1;
        continue;
      }
      field += ch;
      index += 1;
      continue;
    }

    if (ch === '"') {
      if (field.length > 0) {
        return { fields, index, line, error: true, resumeAt: lineEnd(text, start) };
      }
      inQuotes = true;
      index += 1;
      continue;
    }
    if (ch === ",") {
      fields.push(field);
      field = "";
      index += 1;
      continue;
    }
    if (ch === "\n") {
      fields.push(field);
      return { fields, index: index + 1, line: line + 1, error: false, resumeAt: index + 1 };
    }
    field += ch;
    index += 1;
  }

  if (inQuotes) {
    return { fields, index, line, error: true, resumeAt: text.length };
  }
  fields.push(field);
  return { fields, index, line, error: false, resumeAt: index };
}

function lineEnd(text: string, start: number): number {
  const next = text.indexOf("\n", start);
  return next === -1 ? text.length : next + 1;
}

function recoverAt(text: string, start: number): number | null {
  const nextLine = text.indexOf("\n", start);
  if (nextLine === -1) return null;
  const rest = text.slice(nextLine + 1);
  if (!rest) return null;
  const probe = readRecord(rest, 0, 1);
  if (!probe.error && probe.fields.length > 0) return nextLine + 1;
  return null;
}

export function looksLikeHeader(row: string[]): boolean {
  if (!row.length) return false;
  const cells = row.map((cell) => cell.trim());
  if (cells.some((cell) => cell.length === 0 || cell.length > 40)) return false;
  if (cells.some((cell) => cell.split(/\s+/).length > 4)) return false;
  const unique = new Set(cells.map((cell) => cell.toLocaleLowerCase("en")));
  return unique.size === cells.length;
}

export function defaultTitleColumn(headers: string[] | null): number {
  if (!headers) return 0;
  const index = headers.findIndex((header) => /name|title|handle/i.test(header));
  return index >= 0 ? index : 0;
}

export function assessFileSize(bytes: number): { ok: true } | { ok: false; message: string } {
  if (bytes > MAX_FILE_BYTES) {
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      message: `This file is ${mb} MB. The limit is 5 MB, so it was not read.`,
    };
  }
  return { ok: true };
}

export function limitDataRows<T>(rows: T[]): { kept: T[]; dropped: number } {
  if (rows.length <= MAX_DATA_ROWS) return { kept: rows, dropped: 0 };
  return { kept: rows.slice(0, MAX_DATA_ROWS), dropped: rows.length - MAX_DATA_ROWS };
}
