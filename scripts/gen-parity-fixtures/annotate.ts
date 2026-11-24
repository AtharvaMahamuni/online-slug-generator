/**
 * Mark a fixture row unsupported when our in-app rules do not match the
 * real library output. Stdin: JSON array of rows. Stdout: annotated rows.
 */
import { slugifyParity } from "../../src/lib/slug/parity.ts";

const PRESETS = ["wordpress", "django", "python-slugify", "npm-slugify"] as const;

const input = await new Response(process.stdin).text();
const rows = JSON.parse(input) as Array<Record<string, unknown>>;
const annotated = rows.map((row) => {
  const title = String(row.title);
  const unsupported = PRESETS.filter((preset) => slugifyParity(title, preset) !== row[preset]);
  const next = { ...row };
  if (unsupported.length) next.unsupported = unsupported;
  else delete next.unsupported;
  return next;
});
process.stdout.write(`${JSON.stringify(annotated)}\n`);
