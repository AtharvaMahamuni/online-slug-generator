# UX, design, and the workspace

## 11. Viewport-first workspace

This section wins over DESIGN.md's 72px hero, 64px marketing nav, and 80px rhythm wherever those would push the tool down. DESIGN.md color, hairlines, orange scarcity, Inter, and JetBrains Mono still apply. The 80px rhythm applies only to the knowledge layer.

The page has two zones:

1. Utility layer. Compact. Fits the initial viewport. Task only.
2. Knowledge layer. Normal document flow underneath. Definitions, examples, privacy, Quick Answers, links.

Do not try to show the knowledge layer in the first screen. Do not let it occupy the first screen.

### What must be on screen at 100% zoom

Without scrolling the document, the user can switch Single/Bulk, enter or paste text, see the slug, edit it, copy it, reach core settings, and clear the input.

Not required on screen at once: advanced settings, every FAQ answer, URL preview while it is off, or every row of a large file.

At 200% zoom, document scrolling is allowed. Nothing may clip, overlap, or require horizontal page scroll. Do not lock the page to a fixed pixel height. Do not disable zoom.

### Reference viewports

Desktop: 1440×900, 1280×800, 1024×768. Mobile: 390×844, 375×812, 360×800, 320×568.

Playwright sets these as layout viewports. A real phone browser also loses space to its own chrome. Design against the listed CSS viewports, and also against a shortened visual viewport that simulates a keyboard (about 260px less height).

### Height budget

Tool pages use a column of `min-height: 100dvh` with `100vh` as the fallback. The utility layer is `minmax(0, 1fr)` only so the tool can shrink. It is not a `height: 100vh` trap. Content inside fields scrolls inside the field. The knowledge layer starts after this block and scrolls with the document.

Header is 48px, not the 64px marketing nav. Add `padding-top: env(safe-area-inset-top)` and the same for the bottom inset. Primary controls are at least 44×44px. Segmented buttons may be 36px tall if the hit area is padded to 44px.

H1 on tool pages is 22px from 768px up and 18px below. Weight 400. One supporting sentence includes the definition: "A slug is the readable end of a URL, such as how-to-prune-roses." Do not stack a headline, a slogan, and a definition as three blocks. Guide pages may use 26px for the H1. Never 72px. Never 36px on a tool page.

Input and output cap at about 160px tall on desktop and then scroll inside the field. They do not grow into a hero.

### Header

Desktop, inline: wordmark, Single, Bulk, Guides, About, theme. Theme is an icon button with an accessible name, "Theme: system" (or light, or dark).

Below 1024px: wordmark, Single/Bulk, theme, and one menu button. Guides and About live in that menu. The menu is a `<dialog>` or disclosure, keyboard-reachable, and it does not cover the Copy button when closed.

### Desktop single

Two columns of equal width inside one hairline panel.

Left: label "Title", textarea, character count, Clear.

Right: label "Slug", editable mono field, character count, Copy. If URL preview is on, one single-line row under the slug.

Under both columns, one settings row: separator, lowercase, letters, max length, Advanced, preset. Preset is a native `<select>` at the end of the row, not its own card.

```
┌ Header 48: Online Slug Generator   Single  Bulk  Guides  About   (theme) ┐
│ Turn text into a clean URL slug                                          │
│ A slug is the readable end of a URL, such as how-to-prune-roses.         │
│ ┌ Title                         ┐ ┌ Slug                            [Copy]┐
│ │ textarea, max ~160px          │ │ editable mono field                  │
│ │ 24 characters          [Clear]│ │ 18 characters                        │
│ └───────────────────────────────┘ └──────────────────────────────────────┘
│  - | _     Aa on     Latin | Keep     Max [   ]    Preset ▾    Advanced   │
└──────────────────────────────────────────────────────────────────────────┘
  knowledge layer starts here, usually just under the fold on 1024×768
```

Visible immediately: mode, title, slug, clear, copy, core settings, advanced trigger, preset.

Disclosed: advanced panel, URL preview row (only after the user enables it), Quick Answers.

### Mobile single

One column. Same order: header, one-line H1 plus the definition sentence, title field, slug field with Copy on that row, core settings if they fit, otherwise a visible Settings button.

```
┌ Online Slug Generator     Single|Bulk    (theme)  ≡ ┐
│ Turn text into a clean URL slug                     │
│ A slug is the readable end of a URL…                │
│ Title                                        [Clear]│
│ ┌──────────────────────────────────────────────────┐│
│ │ source                                            ││
│ └──────────────────────────────────────────────────┘│
│ Slug                                          [Copy]│
│ ┌──────────────────────────────────────────────────┐│
│ │ editable slug                                     ││
│ └──────────────────────────────────────────────────┘│
│ - | _    Aa    Latin|Keep    Max     Advanced       │
└─────────────────────────────────────────────────────┘
```

Copy is on the slug row so a keyboard cannot hide it under the field. The slug field stays directly under the source. Neither is in a tall card.

### Keyboard open, and 320×568

A full settings row plus two fields plus an open keyboard does not fit in a ~300px visual viewport. Do not pretend it does.

When `visualViewport.height` is under 420px:

- Header compacts to wordmark, Single/Bulk, and theme. Guides and About stay in the menu.
- The definition sentence is visually hidden. It stays in the HTML.
- Title and slug become single-line fields. Copy stays on the slug row.
- The segmented settings row is replaced by one visible Settings button. That button opens the same bottom sheet, which includes the core controls and Advanced. Opening the sheet is not document scrolling.

When the keyboard closes, restore the inline settings row if the width can wrap it without horizontal page scroll. On 320px, wrapping to two lines is acceptable only while the keyboard is closed and those two lines still leave input, output, and copy inside the viewport. If they do not, keep the Settings button even with the keyboard closed. Measure this in Playwright at 320×568. Prefer the Settings button on that viewport rather than clipping.

URL preview, if on, hides while the keyboard is open and returns when it closes. Copy does not move.

### Desktop bulk

Same header and compact title. Then one control: Paste | Import.

Paste shows the multiline input and, under it, a result region. Import shows a drop zone about 96px tall, the privacy sentence, and a Browse button. After a file is chosen, the drop zone is replaced by the filename, Replace, Clear, and a status line. CSV header and column controls appear only after a CSV loads. They do not appear for TXT, and they do not appear before a file exists.

Results live in a region with its own scroll and a pager. Show 100 rows. The export row (Copy all, CSV, TXT) stays at the bottom of the utility layer, inside the viewport, not under the result list. Desktop results are a table: row, source, slug, state. The page itself does not scroll sideways. If the table is wider than the panel, the result region scrolls horizontally, not the document. Prefer column widths that fit 1280 and 1024 without that.

```
┌ Header, same as single, Bulk current ────────────────────────────────────┐
│ Generate slugs for a list                                                │
│ One title per line, or a TXT or CSV file. The file stays on this device. │
│ [ Paste ]  Import                                                         │
│ ┌ multiline titles, capped height ─────────────────────────────────────┐ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ ┌ results, internal scroll ────────────────────────────────────────────┐ │
│ │ 1  Samsung Galaxy S26     samsung-galaxy-s26            ok           │ │
│ │ 2  Samsung Galaxy S26     samsung-galaxy-s26-2          duplicate    │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ Copy all    CSV    TXT                         Settings row, same as /  │
└──────────────────────────────────────────────────────────────────────────┘
```

Visible immediately in paste mode: mode, paste/import switch, input, result region, export, core settings.

Visible immediately in import mode: the compact drop zone and Browse. Not a second empty textarea.

Disclosed: column mapping (after CSV), advanced, rows beyond the current page, row-level warnings inside the scrolled region.

### Mobile bulk

Same switch. Results are stacked rows, not a table:

```
┌ 1 · ok ──────────────────────────────────────────────┐
│ Samsung Galaxy S26                                   │
│ [ samsung-galaxy-s26                          ]      │
└──────────────────────────────────────────────────────┘
```

Duplicate and truncated states use the word, not color alone. Export actions are a wrapping row of 44px buttons under the visible result region, still inside the utility layer. The result region scrolls inside itself. The document does not have to move to reach Copy all.

### File interaction

Drop zone: drag and drop, browse, replace, clear, status, error. The file input is a real control with a visible label, not only a drag target. Errors use `role="alert"` and focus moves to the alert heading. Errors stay next to the zone. No toast-only errors.

"This file is read on your device. It is not uploaded."

### Quick Answers

Three `<details>` on the home page, immediately after the utility layer:

1. What is a URL slug?
2. Does this upload what I paste?
3. Should I use a hyphen or an underscore?

Three different ones on the bulk page:

1. Will the other columns in my file be kept?
2. What happens when two titles make the same slug?
3. Is the file uploaded?

Answers are in the initial HTML, including while closed. Do not fetch them. Do not render them with client JavaScript. Summaries are compact rows, about 44px, with a chevron. Answers expand inline. No cards, no tiles, no open-by-default essays. Further down, the knowledge layer may add more disclosures. Do not repeat this set on every guide. Guides answer in prose. No `FAQPage`.

Home quick answers are for usability and for the HTML that crawlers already receive. They are not a rich-result tactic.

### Empty, motion, focus, readers

Single placeholder: "Paste a title". Output placeholder: "Your slug will show here". It is muted text, not a value that Copy would copy.

Bulk paste placeholder: "One title per line".

No scroll-triggered reveals. Hover 150ms. `prefers-reduced-motion: reduce` removes transitions.

Focus is a 2px orange outline with 2px offset, both themes. Never remove the outline without a replacement. The header must not completely cover a focused control.

`aria-live="polite"` says "Slug updated" for a finished pause, not on every key. Copy failure and file errors are assertive. Single/Bulk is navigation, so the new page title is the announcement.

### Per-component behavior

| Piece | Desktop | Mobile | Short height / keyboard | Overflow | Touch | Focus | Error |
|---|---|---|---|---|---|---|---|
| Header | 48px inline | menu holds Guides and About | hides the text links first | no wrap into a second bar | 44px | visible ring | none |
| H1 and definition | 22px, one sentence | 18px, one sentence | sentence hidden visually, kept in DOM | wraps, no sideways scroll | n/a | n/a | n/a |
| Title and slug | two columns, internal scroll after ~160px | stacked, Copy on the slug row | single-line fields | field scrolls, page does not | Clear and Copy 44px | ring on fields and buttons | empty slug is an empty field, not an error |
| Core settings | one row | one row, or Settings button if the row would push Copy down | Settings button under 420px visual height | wrap only if Copy stays on screen | 44px hit area | ring, popover traps focus until dismiss | destructive options say so inside Advanced |
| Advanced | popover | bottom sheet | same sheet, raised above the keyboard using `visualViewport` | sheet scrolls inside | 44px | focus moves in, returns to the trigger on close | none |
| Bulk results | table, region scrolls | cards | region gives height to the fields first | horizontal scroll only inside the region, never the page | row fields at least 44px | edit field is a labeled input | duplicate and truncated are text |
| File zone | 96px, shown only in Import | same | stays 96px | status wraps | Browse 44px | native file input labeled | alert, focus the heading |
| Quick Answers | closed rows under the workspace | same | not part of the utility layer | summary wraps | summary 44px | native details | none |

### What this changes in earlier sections

- Section 8's settings and bulk input follow this section.
- Section 12's 36px tool H1 and 80px padding around the tool are withdrawn. Knowledge-layer sections may still use 80px.
- Section 13's header is 48px. Advanced is a popover or sheet, not a large in-flow card.
- The homepage supporting copy still has to reach the 500-word floor. That copy lives in the knowledge layer, so it does not spend the first viewport.

---
## 12. Light and dark design

### Decision

Light theme copies workspace `DESIGN.md` tokens by name. Dark theme is the same hues inverted, defined as overrides on `[data-theme="dark"]`. One stylesheet. No second component set.

`ui-ux-pro-max` navy `#1E3A5F` and green `#22C55E` are not used.

CursorGothic is not shipped. `DESIGN.md` says it is licensed and names Inter as the substitute. Self-host Inter (OFL) and JetBrains Mono (OFL). No Google Fonts request.

Tool-page H1 is 22px desktop and 18px mobile, weight 400. Guide H1 may be 26px. Do not use 72px or 36px on a tool page. See section 11.

Timeline pastel tokens are not used. This product has no agent timeline.

Hairlines only. No drop shadows. A 1px border is the surface change. Radius 8px on controls, 12px on the tool panel. Utility-layer gaps are 12–16px. The 80px section rhythm is only for the knowledge layer.

### Token matrix

| Token | Light (DESIGN.md) | Dark |
|---|---|---|
| canvas | `#f7f7f4` | `#1c1b17` |
| canvas-soft | `#fafaf7` | `#24231e` |
| surface-card | `#ffffff` | `#2a2924` |
| surface-strong | `#e6e5e0` | `#3a3832` |
| ink | `#26251e` | `#f4f2ea` |
| body | `#5a5852` | `#c8c4b8` |
| muted | `#807d72` | `#9c978c` |
| hairline | `#e6e5e0` | `#3f3d36` |
| hairline-strong | `#cfcdc4` | `#5c594f` |
| primary | `#f54e00` | `#f54e00` |
| primary-active | `#d04200` | `#ff6a22` |
| on-primary | `#ffffff` | `#ffffff` |
| semantic-error | `#cf2d56` | `#ff6b8a` |
| semantic-success | `#1f8a65` | `#3dbe90` |

Check contrast at implementation. Body on canvas must be at least 4.5:1. Muted text that is informational must also be 4.5:1, or it is not used for sentences. Orange on white and orange on `#1c1b17` must be checked for the button label (white on `#f54e00`). If white on orange fails, use ink text on orange. Do not lighten orange into a second brand color until the check fails.

### Theme behavior

- First visit: `system`, which follows `prefers-color-scheme`.
- Toggle in the header: System, Light, Dark. The button cycles and has an accessible name "Theme: system" (or light, or dark).
- Persist the explicit choice in `localStorage` key `osg.theme`.
- A tiny inline script in `<head>` sets `data-theme` before CSS paints. No flash. The script is the only thing in head besides CSS.
- Components do not mention colors. They use variables.

---
## 13. Component inventory

Astro components, static, unless marked client.

| Component | Client JS? | Notes |
|---|---|---|
| BaseLayout | head script for theme only | title, description, canonical, OG, skip link, header, footer |
| Header | no, except the mobile menu | 48px. About leaves the bar below 1024px |
| Footer | no | knowledge layer only. Not inside the first viewport |
| ToolSingle | yes, shared `tool.ts` | two columns desktop, stack on mobile, Copy on the slug row |
| ToolBulk | yes, same module | Paste or Import, never both empty surfaces |
| SettingsRow | inside the tool module | inline core controls. Advanced is a popover or bottom sheet |
| PresetSelect | inside the tool module | native `<select>` on the settings row |
| ResultTable | inside the tool module | desktop table, mobile cards, internal scroll, 100 rows |
| FileDrop | inside the tool module | Import mode only. About 96px. Real file input |
| QuickAnswers | no | server-rendered `<details>`. Different questions per page |
| GuideLayout | no | prose, date, breadcrumbs |
| ExampleTable | no | knowledge layer |
| StatusLine | inside the tool module | live region |

Do not build cards for every feature. The tool is one panel. Guides are a text column, max width 68ch, on the cream canvas.

Icons: inline SVG, decorative ones `aria-hidden`. No emoji.

---
