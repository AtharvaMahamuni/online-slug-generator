import {
  assignDuplicates,
  assessFileSize,
  buildExport,
  changeNote,
  defaultSettings,
  defaultTitleColumn,
  limitDataRows,
  looksLikeHeader,
  parseCsv,
  parseStoredJson,
  PRESETS,
  presetMatches,
  slugify,
  type PresetId,
  type SlugConfig,
  type SlugResult,
  type StoredSettings,
} from "../lib/slug/index";
import { extractHtmlText } from "./html-text";

const PAGE_SIZE = 100;
const SETTINGS_KEY = "osg.settings";
const HANDOFF_KEY = "osg.handoff";

type BulkRow = {
  source: string;
  cells: string[];
  slug: string;
  edited: boolean;
  truncated: boolean;
  duplicate: boolean;
  empty: boolean;
  lengthWarning: boolean;
  htmlStripped: boolean;
  transliterated: boolean;
  stopWordsRemoved: boolean;
  numbersRemoved: boolean;
  cleaned: string;
};

type LoadedFile = {
  name: string;
  kind: "csv" | "txt";
  table: string[][];
  hasHeaders: boolean;
  errors: { line: number; raw: string }[];
  dropped: number;
  skipped: number;
};

let settings: StoredSettings = readSettings();
let refresh: () => void = () => {};
let rows: BulkRow[] = [];
let page = 0;
let skippedEmpty = 0;
let loadedFile: LoadedFile | null = null;
let sheetTrigger: HTMLElement | null = null;

function must<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

function codePointCount(value: string): number {
  return [...value].length;
}

function countLabel(value: string): string {
  const count = codePointCount(value);
  return `${count} ${count === 1 ? "character" : "characters"}`;
}

function readSettings(): StoredSettings {
  try {
    return parseStoredJson(localStorage.getItem(SETTINGS_KEY));
  } catch {
    return defaultSettings();
  }
}

function writeSettings(): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* Storage can be blocked. The tool still works for this visit. */
  }
}

function config(): SlugConfig {
  return settings.config;
}

function previewText(slug: string): string {
  if (!slug) return "";
  const prefix = settings.urlPrefix.trim().replace(/\/+$/, "");
  return prefix ? `${prefix}/${slug}` : slug;
}

function updatePreview(): void {
  const box = document.getElementById("url-preview");
  const text = document.getElementById("url-preview-text");
  const slug = document.getElementById("slug");
  if (!box || !text) return;
  box.hidden = !settings.urlPreview;
  const value = slug instanceof HTMLTextAreaElement ? slug.value : "";
  text.textContent = previewText(value);
}

function syncControls(): void {
  const current = config();
  document.querySelectorAll<HTMLButtonElement>("[data-separator]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.separator === current.separator));
  });
  must<HTMLButtonElement>("lowercase").setAttribute("aria-pressed", String(current.lowercase));
  document.querySelectorAll<HTMLButtonElement>("[data-letters]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.letters === current.letterPolicy));
  });
  must<HTMLInputElement>("max-length").value = current.maxLength === null ? "" : String(current.maxLength);
  must<HTMLSelectElement>("preset").value = settings.preset;
  must<HTMLInputElement>("stop-words").checked = current.stopWords;
  must<HTMLInputElement>("remove-numbers").checked = current.removeNumbers;
  must<HTMLInputElement>("ampersand").checked = current.ampersandToAnd;
  must<HTMLInputElement>("url-preview-toggle").checked = settings.urlPreview;
  must<HTMLInputElement>("url-prefix").value = settings.urlPrefix;
  const warning = must<HTMLElement>("preset-warning");
  warning.hidden = !(settings.preset === "short" || current.stopWords || current.maxLength !== null || current.removeNumbers);
  updatePreview();
}

function applyConfig(next: SlugConfig, preset?: PresetId): void {
  settings = {
    ...settings,
    config: next,
    preset: preset ?? presetMatches(next),
  };
  syncControls();
  writeSettings();
  refresh();
}

function patchConfig(patch: Partial<SlugConfig>): void {
  applyConfig({ ...config(), ...patch });
}

function bindSettings(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-separator]").forEach((button) => {
    button.addEventListener("click", () => {
      patchConfig({ separator: button.dataset.separator === "_" ? "_" : "-" });
    });
  });
  must<HTMLButtonElement>("lowercase").addEventListener("click", () => {
    patchConfig({ lowercase: must<HTMLButtonElement>("lowercase").getAttribute("aria-pressed") !== "true" });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-letters]").forEach((button) => {
    button.addEventListener("click", () => {
      patchConfig({ letterPolicy: button.dataset.letters === "preserve" ? "preserve" : "latin-ascii" });
    });
  });
  must<HTMLInputElement>("max-length").addEventListener("input", () => {
    const value = must<HTMLInputElement>("max-length").value.trim();
    if (!value) {
      patchConfig({ maxLength: null });
      return;
    }
    if (!/^\d+$/.test(value)) return;
    patchConfig({ maxLength: Number(value) });
  });
  must<HTMLSelectElement>("preset").addEventListener("change", () => {
    const value = must<HTMLSelectElement>("preset").value;
    if (value === "readable" || value === "short" || value === "preserve") {
      applyConfig({ ...PRESETS[value] }, value);
    }
  });
  must<HTMLInputElement>("stop-words").addEventListener("change", () => {
    patchConfig({ stopWords: must<HTMLInputElement>("stop-words").checked });
  });
  must<HTMLInputElement>("remove-numbers").addEventListener("change", () => {
    patchConfig({ removeNumbers: must<HTMLInputElement>("remove-numbers").checked });
  });
  must<HTMLInputElement>("ampersand").addEventListener("change", () => {
    patchConfig({ ampersandToAnd: must<HTMLInputElement>("ampersand").checked });
  });
  must<HTMLInputElement>("url-preview-toggle").addEventListener("change", () => {
    settings = { ...settings, urlPreview: must<HTMLInputElement>("url-preview-toggle").checked };
    writeSettings();
    updatePreview();
  });
  must<HTMLInputElement>("url-prefix").addEventListener("input", () => {
    settings = { ...settings, urlPrefix: must<HTMLInputElement>("url-prefix").value };
    writeSettings();
    updatePreview();
  });
  must<HTMLButtonElement>("reset-settings").addEventListener("click", () => {
    settings = defaultSettings();
    syncControls();
    writeSettings();
    refresh();
  });

  const sheet = must<HTMLDialogElement>("settings-sheet");
  const mount = must<HTMLElement>("sheet-mount");
  const core = must<HTMLElement>("core-settings");
  const coreSlot = must<HTMLElement>("core-slot");
  const advanced = must<HTMLElement>("advanced-fields");
  const advancedSlot = must<HTMLElement>("advanced-slot");

  const openSheet = (mode: "advanced" | "all", trigger: HTMLElement) => {
    sheetTrigger = trigger;
    mount.replaceChildren();
    if (mode === "all") mount.append(core);
    mount.append(advanced);
    advanced.hidden = false;
    must<HTMLElement>("sheet-title").textContent = mode === "all" ? "Settings" : "Advanced";
    if (!sheet.open) sheet.showModal();
    raiseSheet();
    must<HTMLButtonElement>("sheet-close").focus();
  };

  const restoreSheet = () => {
    advanced.hidden = true;
    coreSlot.append(core);
    advancedSlot.append(advanced);
    const trigger = sheetTrigger;
    sheetTrigger = null;
    trigger?.focus();
  };

  must<HTMLButtonElement>("advanced-open").addEventListener("click", (event) => {
    openSheet("advanced", event.currentTarget as HTMLElement);
  });
  must<HTMLButtonElement>("settings-open").addEventListener("click", (event) => {
    openSheet("all", event.currentTarget as HTMLElement);
  });
  must<HTMLButtonElement>("sheet-close").addEventListener("click", () => sheet.close());
  sheet.addEventListener("close", restoreSheet);
  sheet.addEventListener("click", (event) => {
    if (event.target === sheet) sheet.close();
  });
}

function raiseSheet(): void {
  const sheet = document.getElementById("settings-sheet");
  const viewport = window.visualViewport;
  if (!sheet || !viewport) return;
  const keyboard = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
  sheet.style.setProperty("--keyboard", `${keyboard}px`);
}

function syncCompact(): void {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.body.classList.toggle("is-compact", height < 420);
  const sheet = document.getElementById("settings-sheet");
  if (sheet instanceof HTMLDialogElement && sheet.open) raiseSheet();
}

let flashTimer = 0;
let flashed: HTMLButtonElement | null = null;

function restoreFlash(): void {
  window.clearTimeout(flashTimer);
  if (!flashed) return;
  flashed.textContent = flashed.dataset.idleLabel ?? flashed.textContent;
  flashed.classList.remove("is-copied");
  flashed = null;
}

function flashButton(button: HTMLButtonElement | null, label: string): void {
  if (!button) return;
  restoreFlash();
  if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent ?? "";
  button.textContent = label;
  button.classList.add("is-copied");
  flashed = button;
  flashTimer = window.setTimeout(restoreFlash, 1600);
}

async function copyText(value: string, field: HTMLElement | null, button: HTMLButtonElement | null = null): Promise<void> {
  const live = document.getElementById("live");
  const assertive = document.getElementById("assertive");
  if (assertive) assertive.textContent = "";
  if (!value) {
    if (assertive) assertive.textContent = "There is no slug to copy.";
    flashButton(button, "Empty");
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    if (live) {
      live.dataset.ticket = String(Number(live.dataset.ticket ?? "0") + 1);
      live.textContent = "Copied";
    }
    flashButton(button, "Copied");
  } catch {
    if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
      field.focus();
      field.select();
    }
    if (assertive) assertive.textContent = "Select the slug and copy it.";
    flashButton(button, "Select it");
  }
}

function download(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fillWhatChanged(result: SlugResult, slug: string): void {
  const original = document.getElementById("wc-original");
  const cleaned = document.getElementById("wc-cleaned");
  const slugNode = document.getElementById("wc-slug");
  const notes = document.getElementById("wc-notes");
  if (!original || !cleaned || !slugNode || !notes) return;
  original.textContent = result.original || "Empty title";
  cleaned.textContent = result.cleaned || "Empty after cleaning";
  slugNode.textContent = slug || "Empty slug";
  const preserved = /[^\u0000-\u007f]/.test(slug);
  const line = changeNote({ ...result, slug, preservedNonLatin: preserved && !result.flags.transliterated });
  notes.textContent = line || "No characters were removed by an optional setting.";
}

function initSingle(): void {
  const title = must<HTMLTextAreaElement>("title");
  const slug = must<HTMLTextAreaElement>("slug");
  const titleCount = must<HTMLElement>("title-count");
  const slugCount = must<HTMLElement>("slug-count");
  const update = must<HTMLButtonElement>("update-slug");
  const note = must<HTMLElement>("change-note");
  const live = must<HTMLElement>("live");
  let dirty = false;
  let lastAuto = "";
  let timer = 0;
  let announce = 0;
  let lastAnnounced = "";

  const compute = () => {
    const prepared = extractHtmlText(title.value);
    return slugify(prepared.text, config(), { htmlStripped: prepared.htmlStripped });
  };

  const paint = (result: SlugResult, writeField: boolean) => {
    if (writeField) {
      slug.value = result.slug;
      lastAuto = result.slug;
      dirty = false;
      update.hidden = true;
    }
    titleCount.textContent = countLabel(title.value);
    slugCount.textContent = countLabel(slug.value);
    const preserved = /[^\u0000-\u007f]/.test(writeField ? result.slug : slug.value);
    const line = changeNote({
      slug: slug.value,
      flags: { ...result.flags, empty: slug.value.length === 0 },
      preservedNonLatin: preserved && !result.flags.transliterated,
    });
    const blank = title.value.trim() === "";
    note.hidden = blank || line.length === 0;
    note.textContent = blank ? "" : line;
    const nudge = document.getElementById("bulk-nudge");
    if (nudge) {
      const lines = title.value.split(/\r?\n/).filter((line) => line.trim().length > 0);
      nudge.hidden = lines.length < 3;
    }
    fillWhatChanged(result, slug.value);
    updatePreview();
    window.clearTimeout(announce);
    const ticket = live.dataset.ticket ?? "";
    announce = window.setTimeout(() => {
      if ((live.dataset.ticket ?? "") !== ticket) return;
      if (slug.value === lastAnnounced) return;
      lastAnnounced = slug.value;
      live.textContent = slug.value ? "Slug updated" : "";
    }, 600);
  };

  const applyAuto = () => paint(compute(), true);

  refresh = () => {
    const result = compute();
    if (dirty) {
      update.hidden = false;
      paint(result, false);
    } else {
      paint(result, true);
    }
  };

  title.addEventListener("input", () => {
    titleCount.textContent = countLabel(title.value);
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (dirty) update.hidden = false;
      else applyAuto();
    }, 50);
  });

  slug.addEventListener("input", () => {
    dirty = slug.value !== lastAuto;
    update.hidden = !dirty;
    slugCount.textContent = countLabel(slug.value);
    updatePreview();
  });

  update.addEventListener("click", () => applyAuto());
  must<HTMLButtonElement>("clear").addEventListener("click", () => {
    title.value = "";
    dirty = false;
    applyAuto();
    title.focus();
  });
  must<HTMLButtonElement>("copy").addEventListener("click", (event) => {
    const button = event.currentTarget;
    void copyText(slug.value, slug, button instanceof HTMLButtonElement ? button : null);
  });

  document.querySelectorAll('a[href="/bulk-slug-generator"]').forEach((link) => {
    link.addEventListener("click", () => {
      try {
        sessionStorage.setItem(HANDOFF_KEY, title.value);
      } catch {
        /* The bulk page still opens. */
      }
    });
  });

  if (window.matchMedia("(min-width: 1024px)").matches) title.focus();
  applyAuto();
}

function stateWord(row: BulkRow): string {
  if (row.duplicate) return "Duplicate";
  if (row.edited) return "Edited";
  if (row.truncated || row.lengthWarning) return "Truncated";
  if (row.empty) return "Empty";
  return "OK";
}

function cell(label: string, text: string): HTMLTableCellElement {
  const td = document.createElement("td");
  td.dataset.label = label;
  td.textContent = text;
  return td;
}

function renderRow(row: BulkRow, index: number): HTMLTableRowElement {
  const tr = document.createElement("tr");
  const number = index + 1;
  tr.append(cell("Row", String(number)));
  tr.append(cell("Source", row.source));
  const slugCell = document.createElement("td");
  slugCell.dataset.label = "Slug";
  slugCell.className = "slug-cell";
  const input = document.createElement("input");
  input.type = "text";
  input.value = row.slug;
  input.setAttribute("aria-label", `Slug for row ${number}`);
  input.autocomplete = "off";
  input.spellcheck = false;
  input.addEventListener("input", () => {
    row.slug = input.value;
    row.edited = true;
    recheckDuplicates();
  });
  slugCell.append(input);
  tr.append(slugCell);
  const state = cell("State", stateWord(row));
  state.className = "state";
  tr.append(state);
  const copyCell = document.createElement("td");
  copyCell.dataset.label = "Copy";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button-secondary";
  button.textContent = "Copy";
  button.dataset.idleLabel = "Copy";
  button.setAttribute("aria-label", `Copy row ${number}`);
  button.dataset.tip = "Copy this row's slug";
  button.addEventListener("click", () => {
    void copyText(row.slug, input, button);
  });
  copyCell.append(button);
  tr.append(copyCell);
  return tr;
}

function renderBulk(): void {
  const body = must<HTMLTableSectionElement>("result-body");
  const empty = must<HTMLElement>("empty-results");
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > pages - 1) page = pages - 1;
  if (page < 0) page = 0;
  const start = page * PAGE_SIZE;
  const slice = rows.slice(start, start + PAGE_SIZE);
  empty.hidden = total !== 0;
  body.replaceChildren(...slice.map((row, offset) => renderRow(row, start + offset)));
  must<HTMLElement>("page-status").textContent =
    total === 0 ? "Showing 0 of 0" : `Showing ${start + 1}–${Math.min(start + slice.length, total)} of ${total}`;
  must<HTMLButtonElement>("page-prev").disabled = page === 0 || total === 0;
  must<HTMLButtonElement>("page-next").disabled = start + PAGE_SIZE >= total;
  const skipped = must<HTMLElement>("skipped");
  skipped.hidden = skippedEmpty === 0;
  skipped.textContent = `${skippedEmpty} empty ${skippedEmpty === 1 ? "line" : "lines"} skipped`;
  const disabled = total === 0;
  for (const id of ["copy-all", "copy-tsv", "export-csv", "export-txt"]) {
    must<HTMLButtonElement>(id).disabled = disabled;
  }
}

function syncVisibleRows(): void {
  const start = page * PAGE_SIZE;
  must<HTMLTableSectionElement>("result-body")
    .querySelectorAll<HTMLInputElement>("input")
    .forEach((input, offset) => {
      const row = rows[start + offset];
      if (!row) return;
      if (document.activeElement !== input && input.value !== row.slug) input.value = row.slug;
      const state = input.closest("tr")?.querySelector(".state");
      if (state) state.textContent = stateWord(row);
    });
}

function recheckDuplicates(): void {
  const assigned = assignDuplicates(
    rows.map((row) => row.slug),
    config().separator,
    config().maxLength,
    rows.map((row) => row.edited),
  );
  rows.forEach((row, index) => {
    const next = assigned[index];
    if (!next) return;
    row.slug = next.slug;
    row.duplicate = next.duplicate;
    row.lengthWarning = next.lengthWarning;
    row.empty = next.slug.length === 0;
  });
  syncVisibleRows();
}

async function recomputeBulk(): Promise<void> {
  const prepared: Array<{ text: string; htmlStripped: boolean }> = [];
  for (let index = 0; index < rows.length; index += 1) {
    if (index > 0 && index % 500 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    prepared.push(extractHtmlText(rows[index]?.source ?? ""));
  }
  const bases = prepared.map((item, index) => {
    const row = rows[index];
    if (row?.edited) return { slug: row.slug, result: null as SlugResult | null, cleaned: item.text };
    const result = slugify(item.text, config(), { htmlStripped: item.htmlStripped });
    return { slug: result.slug, result, cleaned: result.cleaned };
  });
  const assigned = assignDuplicates(
    bases.map((item) => item.slug),
    config().separator,
    config().maxLength,
    rows.map((row) => row.edited),
  );
  rows.forEach((row, index) => {
    const base = bases[index];
    const next = assigned[index];
    if (!base || !next) return;
    row.cleaned = base.cleaned;
    if (base.result) {
      row.truncated = base.result.flags.truncated;
      row.htmlStripped = base.result.flags.htmlStripped;
      row.transliterated = base.result.flags.transliterated;
      row.stopWordsRemoved = base.result.flags.stopWordsRemoved;
      row.numbersRemoved = base.result.flags.numbersRemoved;
    }
    row.slug = next.slug;
    row.duplicate = next.duplicate;
    row.lengthWarning = next.lengthWarning;
    row.empty = next.slug.length === 0;
  });
  renderBulk();
}

function setRows(next: BulkRow[], skipped: number): void {
  rows = next;
  skippedEmpty = skipped;
  page = 0;
  void recomputeBulk();
}

function linesFromText(value: string): { sources: string[]; skipped: number } {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = normalized.split("\n");
  if (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
  let skipped = 0;
  const sources: string[] = [];
  for (const part of parts) {
    if (part.trim() === "") skipped += 1;
    else sources.push(part.trim());
  }
  return { sources, skipped };
}

function showFileError(title: string, body: string, items: string[] = []): void {
  const box = must<HTMLElement>("file-error");
  const heading = must<HTMLElement>("file-error-title");
  box.hidden = false;
  heading.textContent = title;
  must<HTMLElement>("file-error-body").textContent = body;
  const list = must<HTMLUListElement>("file-error-list");
  list.replaceChildren(
    ...items.slice(0, 8).map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    }),
  );
  heading.focus();
}

function clearFileError(): void {
  const box = document.getElementById("file-error");
  if (box) box.hidden = true;
}

function fileStatus(): void {
  const status = must<HTMLElement>("file-status");
  if (!loadedFile) {
    status.textContent = "";
    return;
  }
  const parts = [`${loadedFile.name} is loaded on this device.`];
  if (loadedFile.dropped > 0) parts.push(`${loadedFile.dropped} rows past 10,000 were left out.`);
  if (loadedFile.errors.length > 0) {
    parts.push(`${loadedFile.errors.length} malformed ${loadedFile.errors.length === 1 ? "row was" : "rows were"} listed and not slugged.`);
  }
  status.textContent = parts.join(" ");
}

function matrixFromFile(): { headers: string[] | null; matrix: string[][] } {
  if (!loadedFile) return { headers: null, matrix: [] };
  if (loadedFile.kind === "txt") return { headers: null, matrix: loadedFile.table };
  const hasHeaders = loadedFile.hasHeaders && loadedFile.table.length > 0;
  const headers = hasHeaders ? (loadedFile.table[0] ?? null) : null;
  const data = hasHeaders ? loadedFile.table.slice(1) : loadedFile.table;
  const limited = limitDataRows(data);
  loadedFile.dropped = limited.dropped;
  return { headers, matrix: limited.kept };
}

function applyLoadedFile(reportErrors = false): void {
  if (!loadedFile) return;
  const csvControls = must<HTMLElement>("csv-controls");
  const { headers, matrix } = matrixFromFile();
  csvControls.hidden = loadedFile.kind !== "csv";
  if (loadedFile.kind === "csv") {
    const select = must<HTMLSelectElement>("column");
    const previous = select.value;
    const width = Math.max(1, ...matrix.map((row) => row.length), headers?.length ?? 1);
    select.replaceChildren();
    for (let index = 0; index < width; index += 1) {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = headers?.[index]?.trim() || `Column ${index + 1}`;
      select.append(option);
    }
    const preferred = String(defaultTitleColumn(headers));
    select.value = [...select.options].some((option) => option.value === previous) && previous ? previous : preferred;
    must<HTMLInputElement>("has-headers").checked = loadedFile.hasHeaders;
  }
  const titleIndex = loadedFile.kind === "csv" ? Number(must<HTMLSelectElement>("column").value || "0") : 0;
  const previous = rows;
  const next = matrix.map((cells, index) => {
    const source = cells[titleIndex] ?? "";
    const prior = previous[index];
    const edited = Boolean(prior && prior.edited && prior.source === source);
    return {
      source,
      cells,
      slug: edited ? prior!.slug : "",
      edited,
      truncated: false,
      duplicate: false,
      empty: false,
      lengthWarning: false,
      htmlStripped: false,
      transliterated: false,
      stopWordsRemoved: false,
      numbersRemoved: false,
      cleaned: "",
    } satisfies BulkRow;
  });
  must<HTMLElement>("drop").hidden = true;
  must<HTMLElement>("file-bar").hidden = false;
  must<HTMLElement>("file-name").textContent = loadedFile.name;
  fileStatus();
  if (reportErrors && loadedFile.errors.length) {
    showFileError(
      "Some rows were skipped",
      "The other rows are still in the list. Each broken row is shown with its line number.",
      loadedFile.errors.map((error) => `Line ${error.line}: ${error.raw}`),
    );
  }
  setRows(next, loadedFile.skipped);
}

async function loadFile(file: File): Promise<void> {
  clearFileError();
  const size = assessFileSize(file.size);
  if (!size.ok) {
    showFileError("File not read", size.message);
    return;
  }
  const csv = /\.csv$/i.test(file.name) || file.type.includes("csv");
  const txt = /\.txt$/i.test(file.name) || file.type === "text/plain" || file.type === "";
  if (!csv && !txt) {
    showFileError("File not read", "Choose a TXT or CSV file.");
    return;
  }
  const text = await file.text();
  if (csv) {
    const parsed = parseCsv(text);
    const table = parsed.rows.filter((row) => row.some((cell) => cell.trim() !== ""));
    const guess = table.length > 1 && looksLikeHeader(table[0] ?? []);
    loadedFile = { name: file.name, kind: "csv", table, hasHeaders: guess, errors: parsed.errors, dropped: 0, skipped: 0 };
  } else {
    const { sources, skipped } = linesFromText(text);
    const limited = limitDataRows(sources);
    loadedFile = {
      name: file.name,
      kind: "txt",
      table: limited.kept.map((source) => [source]),
      hasHeaders: false,
      errors: [],
      dropped: limited.dropped,
      skipped,
    };
  }
  applyLoadedFile(true);
}

function clearLoaded(options?: { keepPaste?: boolean }): void {
  loadedFile = null;
  rows = [];
  skippedEmpty = 0;
  page = 0;
  must<HTMLElement>("drop").hidden = false;
  must<HTMLElement>("file-bar").hidden = true;
  must<HTMLElement>("csv-controls").hidden = true;
  must<HTMLElement>("file-status").textContent = "";
  clearFileError();
  if (!options?.keepPaste) must<HTMLTextAreaElement>("bulk-input").value = "";
  renderBulk();
}

function askConfirm(message: string, onYes: () => void): void {
  const dialog = must<HTMLDialogElement>("confirm-dialog");
  must<HTMLElement>("confirm-body").textContent = message;
  const yes = must<HTMLButtonElement>("confirm-yes");
  const no = must<HTMLButtonElement>("confirm-no");
  const finish = (accept: boolean) => {
    dialog.close();
    yes.onclick = null;
    no.onclick = null;
    if (accept) onYes();
  };
  yes.onclick = () => finish(true);
  no.onclick = () => finish(false);
  dialog.showModal();
  no.focus();
}

function needsConfirm(): boolean {
  return rows.length > 20 || loadedFile !== null;
}

const columnWidths = new Map<string, number>();

function setColumnWidth(col: HTMLTableColElement, width: number): void {
  const table = document.getElementById("result-table");
  const frame = document.getElementById("results");
  if (!table || !frame) return;
  const headers = [...table.querySelectorAll("th")];
  const cols = [...table.querySelectorAll("col")];
  if (columnWidths.size === 0) {
    headers.forEach((header, index) => {
      const item = cols[index];
      if (item) columnWidths.set(item.id, header.getBoundingClientRect().width);
    });
  }
  columnWidths.set(col.id, Math.min(640, Math.max(72, Math.round(width))));
  let sum = 0;
  cols.forEach((item) => {
    const value = columnWidths.get(item.id) ?? 80;
    item.style.width = `${Math.round(value)}px`;
    sum += value;
    const handle = document.querySelector<HTMLElement>(`.col-resize[data-col="${item.id}"]`);
    if (handle) handle.setAttribute("aria-valuenow", String(Math.round(value)));
  });
  table.style.width = sum > frame.clientWidth + 1 ? `${Math.ceil(sum)}px` : "100%";
}

function initColumnResize(): void {
  document.querySelectorAll<HTMLElement>(".col-resize").forEach((handle) => {
    const col = handle.dataset.col ? document.getElementById(handle.dataset.col) : null;
    if (!(col instanceof HTMLTableColElement)) return;
    const currentWidth = () => handle.closest("th")?.getBoundingClientRect().width ?? 120;
    handle.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 32 : 16;
      if (event.key === "ArrowRight") {
        setColumnWidth(col, currentWidth() + step);
        event.preventDefault();
      } else if (event.key === "ArrowLeft") {
        setColumnWidth(col, currentWidth() - step);
        event.preventDefault();
      }
    });
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = currentWidth();
      const move = (ev: PointerEvent) => setColumnWidth(col, startWidth + ev.clientX - startX);
      const up = (ev: PointerEvent) => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        if (Math.abs(ev.clientX - startX) < 4) setColumnWidth(col, startWidth + (ev.shiftKey ? -32 : 32));
        document.body.classList.remove("is-resizing");
      };
      document.body.classList.add("is-resizing");
      handle.setPointerCapture(event.pointerId);
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
    });
  });
}

function initBulk(): void {
  const input = must<HTMLTextAreaElement>("bulk-input");
  let timer = 0;

  const runPaste = () => {
    loadedFile = null;
    must<HTMLElement>("csv-controls").hidden = true;
    must<HTMLElement>("file-bar").hidden = true;
    must<HTMLElement>("drop").hidden = false;
    const { sources, skipped } = linesFromText(input.value);
    const limited = limitDataRows(sources);
    const next = limited.kept.map((source, index) => {
      const prior = rows[index];
      const edited = Boolean(prior && prior.edited && prior.source === source);
      return {
        source,
        cells: [source],
        slug: edited ? prior!.slug : "",
        edited,
        truncated: false,
        duplicate: false,
        empty: false,
        lengthWarning: false,
        htmlStripped: false,
        transliterated: false,
        stopWordsRemoved: false,
        numbersRemoved: false,
        cleaned: "",
      } satisfies BulkRow;
    });
    if (limited.dropped > 0) {
      must<HTMLElement>("file-status").textContent = `${limited.dropped} lines past 10,000 were left out.`;
    }
    setRows(next, skipped);
  };

  refresh = () => {
    void recomputeBulk();
  };

  input.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(runPaste, 50);
  });

  const showPane = (pane: "paste" | "import") => {
    const paste = pane === "paste";
    must<HTMLElement>("panel-paste").hidden = !paste;
    must<HTMLElement>("panel-import").hidden = paste;
    must<HTMLButtonElement>("tab-paste").setAttribute("aria-selected", String(paste));
    must<HTMLButtonElement>("tab-import").setAttribute("aria-selected", String(!paste));
  };
  must<HTMLButtonElement>("tab-paste").addEventListener("click", () => showPane("paste"));
  must<HTMLButtonElement>("tab-import").addEventListener("click", () => showPane("import"));

  const fileInput = must<HTMLInputElement>("file");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (file) void loadFile(file);
  });
  const drop = must<HTMLElement>("drop");
  drop.addEventListener("dragover", (event) => event.preventDefault());
  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) void loadFile(file);
  });

  must<HTMLButtonElement>("file-replace").addEventListener("click", () => {
    const open = () => fileInput.click();
    if (loadedFile || rows.length > 0) askConfirm("Replace the current file?", open);
    else open();
  });
  must<HTMLButtonElement>("file-clear").addEventListener("click", () => {
    const clear = () => clearLoaded();
    if (needsConfirm()) askConfirm("Clear the list? This removes the rows on this page.", clear);
    else clear();
  });
  must<HTMLInputElement>("has-headers").addEventListener("change", () => {
    if (!loadedFile || loadedFile.kind !== "csv") return;
    loadedFile.hasHeaders = must<HTMLInputElement>("has-headers").checked;
    applyLoadedFile();
  });
  must<HTMLSelectElement>("column").addEventListener("change", () => {
    if (loadedFile?.kind === "csv") applyLoadedFile();
  });

  must<HTMLButtonElement>("page-prev").addEventListener("click", () => {
    page = Math.max(0, page - 1);
    renderBulk();
  });
  must<HTMLButtonElement>("page-next").addEventListener("click", () => {
    page += 1;
    renderBulk();
  });
  must<HTMLButtonElement>("copy-all").addEventListener("click", (event) => {
    const button = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null;
    void copyText(rows.map((row) => row.slug).join("\n"), null, button);
  });
  must<HTMLButtonElement>("copy-tsv").addEventListener("click", (event) => {
    const button = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null;
    void copyText(rows.map((row) => `${row.source}\t${row.slug}`).join("\n"), null, button);
  });
  must<HTMLButtonElement>("export-csv").addEventListener("click", (event) => {
    const exported = buildExport({
      sourceHeaders: loadedFile?.kind === "csv" && loadedFile.hasHeaders ? (loadedFile.table[0] ?? null) : null,
      sourceRows: rows.map((row) => row.cells),
      slugs: rows.map((row) => row.slug),
    });
    download("slugs.csv", exported.csv, "text/csv;charset=utf-8");
    flashButton(event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null, "Saved");
  });
  must<HTMLButtonElement>("export-txt").addEventListener("click", (event) => {
    const exported = buildExport({
      sourceHeaders: null,
      sourceRows: rows.map((row) => row.cells),
      slugs: rows.map((row) => row.slug),
    });
    download("slugs.txt", exported.txt, "text/plain;charset=utf-8");
    flashButton(event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null, "Saved");
  });
  initColumnResize();

  let resumed = false;
  try {
    const handoff = sessionStorage.getItem(HANDOFF_KEY);
    if (handoff !== null) {
      sessionStorage.removeItem(HANDOFF_KEY);
      if (handoff) {
        input.value = handoff;
        runPaste();
        resumed = true;
      }
    }
  } catch {
    /* Session storage is optional. */
  }

  if (window.matchMedia("(min-width: 1024px)").matches) input.focus();
  if (!resumed) renderBulk();
}

const toolEl = document.querySelector("[data-tool]");
const toolLocale = toolEl?.getAttribute("data-locale");
if (toolLocale === "es" || toolLocale === "de" || toolLocale === "fr" || toolLocale === "pt") {
  settings.config.locale = toolLocale;
}

bindSettings();
syncControls();
syncCompact();
window.visualViewport?.addEventListener("resize", syncCompact);
window.visualViewport?.addEventListener("scroll", syncCompact);

const mode = toolEl?.getAttribute("data-tool");
if (mode === "single") initSingle();
if (mode === "bulk") initBulk();
