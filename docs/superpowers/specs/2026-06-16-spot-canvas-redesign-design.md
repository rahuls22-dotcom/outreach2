# Spot Canvas Redesign — Design Spec

**Date:** 2026-06-16
**Surface:** The Spot chat screen (`/spot`) — the right-side artifact panel and the three-zone theming.
**Status:** Approved in brainstorming. Ready for implementation plan.

---

## 1. Goal

Replace the Spot screen's right-side artifact panel and its theming with a single, robust model:

- **Chat is the base surface**; the side-nav and a single artifact panel **float over it** as inset rounded cards with soft shadow (Claude-mac-app depth).
- The artifact panel is a **single artifact viewer**: a breadcrumb path label on top, the artifact below. No file list, no tree inside the panel. The inventory of a project's files lives in a **files dropdown in the chat header**.
- The panel is **chat-driven**: it starts closed and only ever opens when the user clicks something in the chat (an artifact card or the header files dropdown). Every open jumps **directly to the artifact at its full path**. Spot never auto-opens or steals focus.
- One **warm surface family** for all zones, **tokenized** (no per-panel hardcoded hex) so depth is consistent and the theme is changed in one place. **Light mode only for v1** — dark mode is deferred, no work spent on it now.

This removes three problems in the current build: the hardcoded dark canvas faking contrast against the light chat, the up-to-2 side-by-side panes, and the panel auto-driving itself off the workflow step.

---

## 2. Current state (what we are replacing)

- `src/components/spot/workflow/workflow-pane.tsx` — `WorkflowPane`: dark hardcoded surface (`#161614`), renders 1–2 panes from `canvasFiles` with a `1px` divider, per-pane header (close / minimize / exit), auto-focus via `defaultFileForStep(step)`, and `AwaitingInputCanvas` (glowing orb empty state). Exports `ChatHeaderFilePicker`, `fileTabsForWorkflow()`.
- `src/lib/spot/store.ts` — `useSpotStore`: `canvasOpen: boolean`, `canvasFiles: CanvasFile[]` (length 0..2, multi-pane), `viewHomeOverride`, plus `openCanvasFile` / `focusCanvasFile` / `closeCanvasFile`.
- `src/lib/spot/workflow.ts` — `CanvasFile = "memory" | "strategy" | "plan" | "dashboard" | "assets" | "analysis"`.
- `src/app/(app)/spot/page.tsx` — `SpotPage`: lays out left nav / center chat / right canvas; workflow+canvas split is resizable (`ResizeHandle`, chat default 40%); canvas bg hardcoded `#161614` border `#2A2A26`.
- `src/app/globals.css` — single `:root` light theme. Spot tokens already present: `--chat-bg: #F8F7F4`, `--spot-tint: #FAF8F2`, `--spot-stroke: #E8E3D5`. No `.dark` block yet.
- `src/components/memory/md-doc.tsx` — `MarkdownDoc`, the clean light beautifier, with hardcoded `#FAF8F2` / `#E8E3D5`.

---

## 3. Locked decisions

1. **Panel focus model = chat-driven.** Panel is closed by default. When Spot saves an artefact it emits an artifact **card** into the chat thread. The panel opens **only** on a user click from chat — the card's Open, or a row in the chat-header **files dropdown**. Both open directly to the chosen artifact at its full path. Spot never auto-opens and never switches a panel the user is viewing.
2. **Single panel.** No multi-pane. Exactly one artifact is shown when open.
3. **Navigation = chat-header files dropdown + path-label breadcrumb.**
   - The project's file inventory is a **dropdown in the chat header** (the existing `ChatHeaderFilePicker`, reworked). Each row: filename + taxonomy chip. Selecting a row opens the panel to that artifact at its full path.
   - The panel's breadcrumb (`<project> / <file>`) is a **pure path label** — it shows where the artifact lives; it is not a button and opens nothing.
   - No file list inside the panel, no Files icon, no directory tree.
4. **Layout/theme = variant C.** Chat is the full-bleed base (warm paper). The nav rail floats left at all times. The artifact panel floats docked right, **only when open**; opening it **reflows** the chat column narrower (it does not overlay/cover the conversation), except on narrow viewports (see §7). Depth comes from rounded corners, hairline border, and soft shadow, not from color contrast. One warm **light** family, defined as tokens. Dark mode is deferred (§9) — not built in v1.
5. **Gates stay in chat.** The panel is read/inspect only. Approve / edit / any gate (Gate 1/2/3) lives in the chat stream, never in the panel. (Principle 11.)

---

## 4. Artifact / file model

The per-project file set is small and bounded. The chat-header files dropdown lists them, in this order:

| File | Taxonomy chip | Renderer in panel body |
|---|---|---|
| `project-details.md` | Memory | `MarkdownDoc` (or existing `MemoryFileView`) |
| `strategy.md` | Work | existing `StrategyFileView` / `MarkdownDoc` |
| `plan.md` | Work | existing `PlanFileView` / `MarkdownDoc` |
| `analysis.md` | Reference | `MarkdownDoc` |
| `dashboard.html` | Reference | existing `DashboardFileView` |
| `assets/` | folder | existing `CreativesFormsReview` |

`execution-plan.md` (Work, gate 3) appears in the Flow 3 (Optimize) variant and uses the same Work treatment. Taxonomy → chip color: **Work = gold**, **Reference = neutral**, **Memory = neutral**, **folder = neutral with item count**. This mirrors the artefact taxonomy in `spot_agentic_principles.md` (Reference / Work / Sub-agent).

The set shown is derived from the active workflow (reuse the existing `fileTabsForWorkflow()` mapping as the source of truth for which files exist in a given flow), not from a filesystem scan.

**Key → filename.** The store value is a `CanvasFile` key (`"memory" | "strategy" | "plan" | "dashboard" | "assets" | "analysis"`); the breadcrumb label and the dropdown rows show a real filename. Mapping: `memory → project-details.md`, `strategy → strategy.md`, `plan → plan.md`, `analysis → analysis.md`, `dashboard → dashboard.html`, `assets → assets/`. This `{ key, filename, taxonomy }` metadata extends the existing per-`CanvasFile` file-tab descriptor in `workflow.ts` (which `fileTabsForWorkflow()` already carries label data for) so there is one source of truth, not a second lookup table.

---

## 5. Components and file structure

### 5.1 Store — `src/lib/spot/store.ts`

Replace the multi-pane canvas state with single-panel state.

- Remove: `canvasFiles: CanvasFile[]`, `focusCanvasFile`, and the 0..2 semantics.
- Add `panelFile: CanvasFile | null` — the artifact currently shown, or `null` when the panel is closed. This single field is the whole panel state (no separate mode enum — open iff `panelFile !== null`).
- Actions:
  - `openCanvasFile(file: CanvasFile)` → `panelFile = file` (opens, or switches to, that artifact).
  - `closeCanvas()` → `panelFile = null`.
- Keep `workflow`, `viewHomeOverride`, `thread`. `canvasOpen` is derived (`panelFile !== null`) — remove the standalone boolean or compute it.
- On thread switch / new conversation: call `closeCanvas()` (panel is per-conversation).

### 5.2 Artifact card chat part — `src/lib/spot/types.ts` + `src/components/spot/spot-message.tsx`

- Add a `SpotPart` variant `artifact`: `{ kind: "artifact"; file: CanvasFile; title: string; subtitle: string }`.
- Render it in `spot-message.tsx` as a floating white card (file icon in a gold-tint square, title, subtitle, an `Open` button) that calls `openCanvasFile(file)`. This is the only way Spot surfaces a saved artefact. It does **not** carry approve actions — those remain separate gate parts (`step-cta` / choice).

### 5.3 Panel — `src/components/spot/workflow/workflow-pane.tsx` (rewrite)

Rewrite around a single floating panel that shows exactly one artifact.

- `SpotCanvasPanel` — the floating card. Renders nothing when `panelFile === null`.
  - `PanelHeader` — breadcrumb label + close.
    - Breadcrumb: folder icon, `<project-slug>` `/` `<filename>`. **Pure label, not interactive.** Mono font, uses `--spot-*` tokens.
    - Action: close `X` → `closeCanvas()`. (Drop the old minimize/exit pair; no Files icon.)
  - Body: `FileBody` for `panelFile` — reuse the existing router → `MemoryFileView` / `StrategyFileView` / `PlanFileView` / `DashboardFileView` / `CreativesFormsReview` / `MarkdownDoc`, theme-aware via tokens.
- Remove: multi-pane column rendering, the `1px` dividers, `AwaitingInputCanvas` orb, `defaultFileForStep` auto-focus, the in-panel file list, and all hardcoded dark hex. The panel simply unmounts when closed (no orb).
- `ChatHeaderFilePicker` is **kept** but reworked into the chat-header files dropdown (§5.4): selecting a row calls `openCanvasFile(file)`. It is the only "list of files" surface.

### 5.4 Page layout — `src/app/(app)/spot/page.tsx`

- Container is `position: relative`, background `var(--spot-desk)` (the chat base).
- Nav rail: floats `position: absolute` left, inset with margin, rounded, shadow, always present. (Presentation of the existing app nav for the Spot route — see Scope §9.)
- Chat column: full height, left padding to clear the floating nav. When `panelFile !== null`, add right padding to clear the floating panel (reflow). The chat's own interactive objects (artifact cards, composer, the header files dropdown) render as floating white chips on the base.
- Chat header hosts the **files dropdown** (the reworked `ChatHeaderFilePicker`): a compact control listing the active workflow's files with taxonomy chips; selecting one calls `openCanvasFile(file)`. Available whether the panel is open or closed.
- Panel: `SpotCanvasPanel` floats `position: absolute` right, inset with margin, rounded, shadow, mounted only when `panelFile !== null`.
- Remove the dark canvas split and `ResizeHandle` (no resize; fixed panel width, see §7). Keep the empty / active-thread states for the chat itself, minus the canvas dark styling.

### 5.5 Theme tokens — `src/app/globals.css`

Add Spot canvas tokens to `:root` (**light only** — no `.dark` block in v1):

- `--spot-desk: #F6F2E9` (chat base / paper)
- `--spot-card: #FFFFFF` (floating surfaces: nav, panel, in-chat chips)
- `--spot-card-border: #EFE9DB`
- `--spot-shadow: 0 1px 3px rgba(60,50,30,.07), 0 10px 26px rgba(60,50,30,.12)`
- reuse existing `--spot-tint`, `--spot-stroke` for inner fills.

Tokens (not hardcoded hex) are used so depth lives in one place and a future dark theme is a token swap, but **no dark values are authored now**. (§9.)

### 5.6 Markdown renderer — `src/components/memory/md-doc.tsx`

Replace hardcoded `#FAF8F2` / `#E8E3D5` with `var(--spot-tint)` / `var(--spot-stroke)` (and text via existing `--text-*` tokens) so it reads from the same token source as the panel. Light only. No structural / API change — same `source` prop.

---

## 6. Data flow

1. Spot saves an artefact → thread gets an `artifact` part → renders as a chat card.
2. User clicks the card's **Open** → `openCanvasFile(file)` → panel floats in showing that artifact at its full path, chat reflows narrower.
3. Alternatively, user picks a file from the **chat-header files dropdown** → `openCanvasFile(file)` → same: panel jumps directly to that artifact at its full path. (Works whether the panel was closed or already showing another file — it switches.)
4. The panel's breadcrumb is a label only; there is no in-panel navigation. To view a different file, use the card or the dropdown.
5. User clicks **close X** → `closeCanvas()` → panel unmounts, chat reflows full width.
6. Gates (approve / edit) are separate chat parts and call existing workflow advance logic. The panel is never on the write path.

---

## 7. Edge cases and responsive

- **No content for a file:** panel body shows a simple, token-styled empty line ("Nothing here yet."), not the orb.
- **Narrow viewport (< 900px):** the panel cannot reflow without crushing the chat. Below this breakpoint the panel becomes an **overlay** (floats over the chat with a light scrim) instead of reflowing. The close X and scrim/Esc dismiss it. Above the breakpoint it reflows.
- **Fixed panel width:** the panel is a fixed `380px` on desktop (no drag-resize in v1). Below the 900px breakpoint it goes full-width as an overlay.
- **Thread switch / Spot home:** `closeCanvas()` so the panel never leaks across conversations.
- **Workflow without a given file:** the files dropdown only lists files that exist for the active workflow (`fileTabsForWorkflow()`); absent files are not offered, and no card for them is emitted.

---

## 8. Principle check (LOAD-BEARING — `spot_agentic_principles.md`)

- **P1 (all comms through Spot, both ways):** chat cards + gates live in chat; panel is read-only inspection with no side comms. ✓
- **P8 (every artefact passes a user gate):** unchanged — gates stay in the chat stream; the panel never approves or executes. ✓
- **P11 (only Spot executes writes; gates co-located with the user in chat):** the panel has **no** action/write buttons; approve/edit are chat parts. ✓
- **P12 (tiered write gates):** unaffected — gating UI is unchanged, only its location (chat, not panel) is reaffirmed. ✓

No principle is broken. **If implementation discovers a need to put any write/approve action inside the panel, STOP and raise it** — that would break P11 and must be decided with Sourabh before proceeding.

---

## 9. Scope

**In scope (v1):**
- The Spot route (`/spot`): chat-base layout, floating nav presentation, floating single artifact panel (path-label breadcrumb + close), chat-header files dropdown, artifact chat card, store refactor, Spot canvas theme tokens (**light values only**), `MarkdownDoc` tokenization.

**Out of scope (deferred):**
- Rolling the floating-card treatment across the entire app shell / all routes (`app-shell.tsx`, every page). v1 styles the Spot route; the global nav is presented in the floating style for Spot but a full app-wide redesign is a separate effort.
- **Dark mode entirely.** No `.dark` block, no dark token values, no toggle. Tokens are used so a future dark theme is cheap, but zero dark-mode effort is spent now.
- Real backend wiring of artefact production — mock data continues to drive the cards and panel.
- The Memory drawer (`memory-panel.tsx`) is already rebuilt; it only inherits the `MarkdownDoc` token change, no structural work.

---

## 10. Verification

Prototype is Next.js / React 18.3.1-portable; no unit-test harness assumed — verify in the browser (dev server port 3200, OTP `150397`) via the preview tools:

- Closed state: chat owns the surface, nav floats left, no panel.
- Click an artifact card → panel floats in at the artifact's full path, chat reflows, breadcrumb shows `project / file`.
- Pick a file from the chat-header files dropdown → panel opens (or switches) directly to that artifact.
- Breadcrumb is a label: clicking it does nothing.
- Close X → panel unmounts, chat full width.
- Resize below 900px → panel overlays with scrim instead of reflowing.
- Typecheck: `node_modules/.bin/tsc --noEmit` (ignore the pre-existing `src/lib/integration-data.ts:31` `contact_extraction` error, which is unrelated to this work).

Components are React-18.3.1-portable (no React-19/RSC-only APIs), per `feedback_demo_react18_compat`.
