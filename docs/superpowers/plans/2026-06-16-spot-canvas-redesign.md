# Spot Canvas Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Spot screen's dark multi-pane right canvas with a single, chat-driven, light, tokenized floating artifact panel.

**Architecture:** Chat is the base surface (`--spot-desk`). A single artifact panel floats docked right as a rounded card with soft shadow, opening only on a user click from chat (an artifact card in the thread, or the chat-header files dropdown), jumping directly to the artifact at its full path. Store collapses from `canvasOpen` + `canvasFiles[]` (multi-pane) to one `panelFile: CanvasFile | null`. All approvals/gates stay in chat; the panel is read-only. Light mode only for v1.

**Tech Stack:** Next.js App Router prototype, React 18.3.1-portable (no React-19/RSC-only APIs), Tailwind 3.4, lucide-react, Zustand. Dev server port 3200, OTP `150397`. No unit-test harness; verification is the browser preview + `node_modules/.bin/tsc --noEmit`.

**Source of truth:** `docs/superpowers/specs/2026-06-16-spot-canvas-redesign-design.md`.

---

## Two interpretation decisions baked into this plan (confirm at review)

These were resolved while writing the plan from the approved spec. They are behavioral, so flag them at the first review checkpoint:

1. **Dark full-canvas loaders are removed from the panel, not re-themed.** The spec (§1, §3.1) removes the panel's auto-drive. The current build's dark full-takeover loaders (`AwaitingInputCanvas`, the `MemoryBuildingLoader` / `PlanBuildingLoader` / `StrategyFileView`'s `DarkSpotLoader` building states, and the `WorkflowPane` deploy/done/import/diagnostic takeovers) WERE that auto-drive. They are dropped from the panel. "Spot is working" feedback already lives in the chat stream as `tool-call` parts. When a file has no content yet, the panel shows the light empty line "Nothing here yet." (spec §7). The artifact-scoped **light** overlay (`BuildingOverlay`, `bg-white/60`) and the light `EmptyCanvas` empties are kept (not dark, not a violation).

2. **Per-step launch artifact cards are a documented v1 cut; reachability is via the dropdown.** Spot emits an artifact card at three "artifact is ready" reveal points (existing-product kickoff → `memory`; new-product research done → `memory`; diagnostic analysis done → `analysis`). It does NOT emit a card for every file that materializes during a launch (plan, strategy, assets, dashboard) or for the analyst review report. Those remain reachable at all times through the **chat-header files dropdown**, which lists every file that exists for the active workflow (`fileTabsForWorkflow()`). This is the spec's model ("opening happens through the chat UI only"); the dropdown is the always-available entry point, the cards are the proactive surface.

---

## File structure (what each task touches)

| File | Responsibility | Tasks |
|---|---|---|
| `src/app/globals.css` | Add light-only Spot canvas tokens to `:root` | 1 |
| `src/components/memory/md-doc.tsx` | Tokenize hardcoded hex in `MarkdownDoc` | 2 |
| `src/lib/spot/types.ts` | Add the `artifact` `SpotPart` variant | 3 |
| `src/components/spot/workflow/workflow-pane.tsx` | `taxonomy` on `FILE_TABS` + `fileMeta`/`TaxonomyChip` helpers (Task 4); rewrite `WorkflowPane` → `SpotCanvasPanel`, rework `ChatHeaderFilePicker`, light-re-theme `FileBody` (Task 6) | 4, 6 |
| `src/lib/spot/store.ts` | Single-panel state + `artifactCardMessage` + wire 3 reveal points + migrate call sites | 5 |
| `src/components/spot/spot-message.tsx` | `ArtifactCardPart` + `PartRenderer` `case "artifact"` | 7 |
| `src/app/(app)/spot/page.tsx` | Chat-base layout, floating panel, reflow, responsive overlay, remove `ResizeHandle`/dark split/toggle | 8 |

**Build-state note (read before starting):** Tasks 1–4 are additive and keep the project compiling. Task 5 (store refactor) removes `canvasOpen` / `canvasFiles` / `focusCanvasFile` / `closeCanvasFile` / `setCanvasOpen` / `toggleCanvas`; its only remaining consumers are `workflow-pane.tsx` and `page.tsx`, which are rewritten in Tasks 6 and 8. **The app will not fully typecheck between the start of Task 5 and the end of Task 8 — this is expected.** The typecheck + browser gate is Task 9. Each task below still has a focused "internal completeness" check (a grep) so you know that file's edits are done.

---

### Task 1: Spot canvas theme tokens (light only)

**Files:**
- Modify: `src/app/globals.css:36`

- [ ] **Step 1: Add the four new tokens after `--spot-stroke`**

In `:root`, the existing Spot block ends at line 36 (`--spot-stroke: #E8E3D5;`). Insert the new tokens immediately after it:

```css
    --spot-tint: #FAF8F2;
    --spot-stroke: #E8E3D5;
    /* Spot canvas (chat-base + floating panel/nav/chips). Light only for v1;
       a future dark theme is a token swap, no dark values authored now. */
    --spot-desk: #F6F2E9;
    --spot-card: #FFFFFF;
    --spot-card-border: #EFE9DB;
    --spot-shadow: 0 1px 3px rgba(60,50,30,.07), 0 10px 26px rgba(60,50,30,.12);
```

- [ ] **Step 2: Verify the tokens are present and well-formed**

Run: `grep -n "spot-desk\|spot-card\|spot-shadow" src/app/globals.css`
Expected: three lines printed (`--spot-desk`, `--spot-card`, `--spot-card-border`, `--spot-shadow` — `spot-card` matches two).

- [ ] **Step 3: Commit** (only if the user has asked for local commits — RULE 1: never push)

```bash
rtk git add src/app/globals.css && rtk git commit -m "feat(spot): add light-only canvas theme tokens"
```

---

### Task 2: Tokenize `MarkdownDoc`

`MarkdownDoc` is the light beautifier shared by the Memory drawer and (after this redesign) the panel. Replace its two hardcoded hex fills with the shared tokens. No API change — same `source` prop.

**Files:**
- Modify: `src/components/memory/md-doc.tsx:312`, `src/components/memory/md-doc.tsx:343`

- [ ] **Step 1: Tokenize the table header fill (line 312)**

Change:

```tsx
                    className="bg-[#FAF8F2] text-text-primary font-semibold px-3 py-2 border-b border-border-subtle whitespace-nowrap"
```

to:

```tsx
                    className="bg-[var(--spot-tint)] text-text-primary font-semibold px-3 py-2 border-b border-border-subtle whitespace-nowrap"
```

- [ ] **Step 2: Tokenize the blockquote fill + border (line 343)**

Change:

```tsx
          className="mb-4 rounded-card bg-[#FAF8F2] border border-[#E8E3D5] px-4 py-3"
```

to:

```tsx
          className="mb-4 rounded-card bg-[var(--spot-tint)] border border-[var(--spot-stroke)] px-4 py-3"
```

- [ ] **Step 3: Verify no hardcoded Spot hex remains in md-doc**

Run: `grep -n "FAF8F2\|E8E3D5" src/components/memory/md-doc.tsx`
Expected: no output (exit 1).

- [ ] **Step 4: Commit** (local only, if asked)

```bash
rtk git add src/components/memory/md-doc.tsx && rtk git commit -m "refactor(spot): tokenize MarkdownDoc fills"
```

---

### Task 3: `artifact` chat-part type

The real `SpotPart` union discriminates on `type:`. The spec §5.2 writes the variant as `{ kind: "artifact"; ... }` — that is a spec typo; it MUST be `type: "artifact"` to match the union and the `PartRenderer` switch.

**Files:**
- Modify: `src/lib/spot/types.ts`

- [ ] **Step 1: Import `CanvasFile` at the top of types.ts**

Add as the first import line (the file currently has no imports; add it above `export type ScopeKind`):

```tsx
import type { CanvasFile } from "./workflow";
```

(Type-only import; the workflow↔types cycle is erased at compile and is safe.)

- [ ] **Step 2: Add the `artifact` variant to the `SpotPart` union**

In the `SpotPart` union (starts line 20), add this member directly after the `step-cta` member (line 30) so artifact cards group near the other actionable parts:

```tsx
  // A saved artefact, surfaced as a floating chat card. Clicking Open
  // calls openCanvasFile(file) — the ONLY way Spot proactively surfaces
  // an artefact. Carries no approve action (gates remain separate parts).
  | { type: "artifact"; file: CanvasFile; title: string; subtitle: string }
```

- [ ] **Step 3: Verify the type compiles**

Run: `node_modules/.bin/tsc --noEmit 2>&1 | grep -v "integration-data.ts" | grep "types.ts"`
Expected: no output (the pre-existing `integration-data.ts:31` error is filtered out and unrelated).

- [ ] **Step 4: Commit** (local only, if asked)

```bash
rtk git add src/lib/spot/types.ts && rtk git commit -m "feat(spot): add artifact chat-part type"
```

---

### Task 4: `taxonomy` on `FILE_TABS` + `fileMeta` / `TaxonomyChip` helpers

One source of truth for `{ key, label, file, icon, taxonomy }`. `FILE_TABS` already lives in `workflow-pane.tsx` (the spec says "workflow.ts" but it is actually here — keep it here, it carries lucide icon refs). This task is additive — the old `WorkflowPane` / `ChatHeaderFilePicker` still compile against it.

**Files:**
- Modify: `src/components/spot/workflow/workflow-pane.tsx:116-128`

- [ ] **Step 1: Add the `Taxonomy` type and extend `FILE_TABS`**

Replace the `FILE_TABS` declaration (lines 116-128) with:

```tsx
export type Taxonomy = "memory" | "work" | "reference" | "folder";

export const FILE_TABS: {
  key: CanvasFile;
  label: string;
  file: string;
  icon: typeof FileText;
  taxonomy: Taxonomy;
}[] = [
  { key: "memory", label: "Project details", file: "project-details.md", icon: FileText, taxonomy: "memory" },
  { key: "strategy", label: "Strategy", file: "strategy.md", icon: Sparkles, taxonomy: "work" },
  { key: "plan", label: "Plan", file: "plan.md", icon: TrendingUp, taxonomy: "work" },
  { key: "analysis", label: "Analysis", file: "analysis.md", icon: Search, taxonomy: "reference" },
  { key: "dashboard", label: "Dashboard", file: "dashboard.html", icon: ChartPie, taxonomy: "reference" },
  { key: "assets", label: "Assets", file: "assets/", icon: ImageIcon, taxonomy: "folder" },
];

/** Single source of truth for a CanvasFile's display metadata. Falls back
 *  to the memory descriptor so callers never get undefined. */
export function fileMeta(key: CanvasFile) {
  return FILE_TABS.find((t) => t.key === key) ?? FILE_TABS[0];
}

const TAXONOMY_LABEL: Record<Taxonomy, string> = {
  memory: "Memory",
  work: "Work",
  reference: "Reference",
  folder: "Folder",
};

/** Taxonomy chip for the files dropdown. Work = gold, everything else
 *  neutral (mirrors the Reference / Work artefact taxonomy). The folder
 *  item-count is deferred in v1 — the chip reads "Folder" with no count. */
export function TaxonomyChip({ taxonomy }: { taxonomy: Taxonomy }) {
  const isWork = taxonomy === "work";
  return (
    <span
      className="inline-flex items-center h-4 px-1.5 rounded-full text-[9.5px] font-medium tracking-wide flex-shrink-0"
      style={
        isWork
          ? { background: "var(--spot-tint)", color: "#8A6D1F", border: "1px solid #E8C97A" }
          : { background: "var(--spot-tint)", border: "1px solid var(--spot-stroke)" }
      }
    >
      <span className={isWork ? "" : "text-text-tertiary"}>{TAXONOMY_LABEL[taxonomy]}</span>
    </span>
  );
}
```

- [ ] **Step 2: Verify `taxonomy` is on every tab**

Run: `grep -c "taxonomy:" src/components/spot/workflow/workflow-pane.tsx`
Expected: `6` (one per FILE_TABS entry) plus the `Record` line — accept `7`. Either confirms all six entries carry a taxonomy.

- [ ] **Step 3: Commit** (local only, if asked)

```bash
rtk git add src/components/spot/workflow/workflow-pane.tsx && rtk git commit -m "feat(spot): add file taxonomy + fileMeta/TaxonomyChip helpers"
```

---

### Task 5: Store — single-panel state + artifact cards + call-site migration

This is the core refactor. After it, `workflow-pane.tsx` and `page.tsx` will not compile until Tasks 6 and 8. That is expected.

**Files:**
- Modify: `src/lib/spot/store.ts` (state interface, initial state, `artifactCardMessage` helper, 3 reveal points, actions, call sites)

- [ ] **Step 1: Replace the two state fields in the `PanelState` interface (lines 46-55)**

Replace lines 46-55 (the `canvasOpen` and `canvasFiles` declarations with their comments):

```tsx
  // Whether the right-pane canvas is visible. Workflow state is
  // preserved when this is false — the user just gets the chat wider
  // so they can read uninterrupted, like collapsing Claude's preview.
  canvasOpen: boolean;
  // Files currently open in the canvas. Length 0..2 — closing the
  // last one hides the canvas. Order = left-to-right pane order.
  // Drives the multi-pane canvas (Claude-style "open two files side
  // by side"). The picker dropdown lives in the chat header so the
  // user opens / focuses files from the same side they type on.
  canvasFiles: CanvasFile[];
```

with:

```tsx
  // The single artifact the floating panel is showing, or null when the
  // panel is closed. This one field IS the panel state — open iff
  // panelFile !== null. Chat-driven: only user clicks set it.
  panelFile: CanvasFile | null;
```

- [ ] **Step 2: Replace the canvas action signatures in the interface (lines 135-149)**

Replace lines 135-149 (the `setCanvasOpen` / `toggleCanvas` / `openCanvasFile` / `focusCanvasFile` / `closeCanvasFile` signatures with their comments):

```tsx
  /** Collapse the right-pane canvas without losing workflow state. */
  setCanvasOpen: (open: boolean) => void;
  /** Convenience toggler used by the canvas open/close buttons. */
  toggleCanvas: () => void;
  /** Open (or focus) a file in the canvas. If already open → no-op.
   *  If 2 files are already open → replaces the second one. Opens
   *  the canvas if it was collapsed. */
  openCanvasFile: (file: CanvasFile) => void;
  /** Replace the entire canvas with a single pane showing this file.
   *  Used for workflow step transitions (kickoff → plan etc.) so
   *  advancing the workflow swaps the active file rather than
   *  stacking it as a second pane. */
  focusCanvasFile: (file: CanvasFile) => void;
  /** Close a single pane. If it was the last pane → canvas collapses. */
  closeCanvasFile: (file: CanvasFile) => void;
```

with:

```tsx
  /** Open the panel to a file, or switch the open panel to it. */
  openCanvasFile: (file: CanvasFile) => void;
  /** Close the panel entirely (X / thread switch / Spot home). */
  closeCanvas: () => void;
```

- [ ] **Step 3: Add the `artifactCardMessage` helper near the top-level helpers**

Add this module-scope function immediately above the `startDiagnostic` helper (i.e. just before line 195's `copy: { headline...` block — place it before the `function startDiagnostic` declaration that contains line 195). If you cannot find the exact `startDiagnostic` signature line, place it directly above `export const useSpotStore = create<PanelState>` (line 260):

```tsx
/** A Spot message carrying a single artifact card — the proactive way
 *  Spot surfaces a saved artefact. Clicking Open in the renderer calls
 *  openCanvasFile(file). Carries no gate (P11: gates stay separate). */
function artifactCardMessage(
  file: CanvasFile,
  title: string,
  subtitle: string,
): SpotMessage {
  return { role: "spot", parts: [{ type: "artifact", file, title, subtitle }] };
}
```

(`CanvasFile` and `SpotMessage` are already imported in store.ts.)

- [ ] **Step 4: Initial state — replace `canvasOpen` / `canvasFiles` (lines 270-271)**

Replace:

```tsx
  canvasOpen: true,
  canvasFiles: ["memory"],
```

with:

```tsx
  panelFile: null,
```

- [ ] **Step 5: Reveal point 1 — diagnostic analysis ready (lines 237-256)**

Inside the `setTimeout` reveal block (line 237), the return currently is:

```tsx
      return {
        workflow: { ...s.workflow, ready: true },
        thread: intro ? [...updatedThread, intro] : updatedThread,
      };
```

Replace it with (emit the analysis artifact card after the intro):

```tsx
      const baseThread = intro ? [...updatedThread, intro] : updatedThread;
      return {
        workflow: { ...s.workflow, ready: true },
        thread: [
          ...baseThread,
          artifactCardMessage(
            "analysis",
            "Analysis",
            `Spot's read on ${s.workflow.productName}`,
          ),
        ],
      };
```

- [ ] **Step 6: Reveal point 2 — existing-product kickoff (lines 351-382)**

In `startLaunchFlow`'s reveal `setTimeout`, the `summary` message's first text part (lines 355-358) ends with "Pulled it up on the right." — drop that stale claim (the panel no longer auto-opens). Change the `text:` value to:

```tsx
              text: product
                ? `Got it. Memory's **${Math.round(product.readiness * 100)}% complete** — ${product.personas.length} personas linked, ${product.memory.length} entries on file.`
                : `Here's what I have on file.`,
```

Then change the final return (line 382) from:

```tsx
        return { workflow: nextWorkflow, thread: [...updatedThread, summary] };
```

to:

```tsx
        return {
          workflow: nextWorkflow,
          thread: [
            ...updatedThread,
            artifactCardMessage("memory", "Project details", "Memory Spot has on file."),
            summary,
          ],
        };
```

- [ ] **Step 7: Reveal point 3 — new-product research done (lines 802-828)**

In `startDeepResearch`'s reveal `setTimeout`, the `kickoff` message's text part (lines 803-805) ends with "the right pane shows it." — drop that stale claim. Change the `text:` value to:

```tsx
              text: `I've drafted what I'd lead with and what to avoid. From here you can pull in your existing campaigns to analyse them, or have me draft a fresh execution plan.`,
```

Then change the final return (line 828) from:

```tsx
        return { workflow: nextWorkflow, thread: [...updatedThread, kickoff] };
```

to:

```tsx
        return {
          workflow: nextWorkflow,
          thread: [
            ...updatedThread,
            artifactCardMessage("memory", "Project details", `Memory built for ${productName}.`),
            kickoff,
          ],
        };
```

- [ ] **Step 8: Remove `canvasOpen` / `canvasFiles` from the remaining flow-init call sites**

Delete the `canvasOpen: true,` line at each of these locations (the panel now starts closed; cards + the dropdown drive opening). Also delete the `canvasFiles: [...]` lines.

- Line 203: delete `    canvasOpen: true,` (in `startDiagnostic`)
- Line 297: delete `      canvasOpen: true,` (in `startLaunchFlow`)
- Lines 398-399: delete `      canvasOpen: true,` and `      canvasFiles: ["memory"],` (in `startNewProductFlow`)
- Line 663: delete `      canvasOpen: true,` (in `startDeepResearch`)
- Lines 891-892: delete `      canvasOpen: true,` and `      canvasFiles: ["analysis"],` (in `startAnalystReview`). The analyst report stays reachable through the chat-header dropdown (analysis.md row); no auto-open in v1.
- Line 917: delete `      canvasOpen: true,` (in `startCampaignDive`)
- Line 1093: delete `        canvasOpen: true,` (in the import flow — the import picker is inline in chat, not the panel)
- Line 1225: delete `        canvasOpen: false,` (in `finalizeImportReview`)

(Line numbers shift as you delete; delete top-down or re-grep with Step 12 between edits.)

- [ ] **Step 9: Replace the canvas action implementations (lines 1331-1362)**

Replace the block from `setCanvasOpen:` (line 1331) through the end of `closeCanvasFile` (line 1362) — i.e. `setCanvasOpen`, `toggleCanvas`, `openCanvasFile`, `focusCanvasFile`, `closeCanvasFile`:

```tsx
  setCanvasOpen: (open) => set({ canvasOpen: open }),
  toggleCanvas: () => set((s) => ({ canvasOpen: !s.canvasOpen })),

  openCanvasFile: (file) =>
    set((s) => {
      // Already open → focus by opening the canvas if needed.
      if (s.canvasFiles.includes(file)) {
        return { canvasOpen: true };
      }
      // 0 panes → open as first.
      if (s.canvasFiles.length === 0) {
        return { canvasOpen: true, canvasFiles: [file] };
      }
      // 1 pane → add as second (split view).
      if (s.canvasFiles.length === 1) {
        return { canvasOpen: true, canvasFiles: [...s.canvasFiles, file] };
      }
      // 2 panes → replace the second one (max 2 panes).
      return { canvasOpen: true, canvasFiles: [s.canvasFiles[0], file] };
    }),

  focusCanvasFile: (file) =>
    set(() => ({ canvasOpen: true, canvasFiles: [file] })),

  closeCanvasFile: (file) =>
    set((s) => {
      const next = s.canvasFiles.filter((f) => f !== file);
      if (next.length === 0) {
        return { canvasFiles: [], canvasOpen: false };
      }
      return { canvasFiles: next };
    }),
```

with:

```tsx
  openCanvasFile: (file) => set({ panelFile: file }),
  closeCanvas: () => set({ panelFile: null }),
```

- [ ] **Step 10: `showHomeView` / `resumeWorkflow` (lines 1364-1365)**

Replace:

```tsx
  showHomeView: () => set({ viewHomeOverride: true }),
  resumeWorkflow: () => set({ viewHomeOverride: false, canvasOpen: true }),
```

with:

```tsx
  showHomeView: () => set({ viewHomeOverride: true, panelFile: null }),
  resumeWorkflow: () => set({ viewHomeOverride: false }),
```

- [ ] **Step 11: `exitWorkflow` (lines 1315-1321)**

Replace:

```tsx
  exitWorkflow: () =>
    set({
      workflow: null,
      canvasOpen: true,
      viewHomeOverride: false,
      clickedCtas: new Set<string>(),
    }),
```

with:

```tsx
  exitWorkflow: () =>
    set({
      workflow: null,
      panelFile: null,
      viewHomeOverride: false,
      clickedCtas: new Set<string>(),
    }),
```

- [ ] **Step 12: Verify the store has no stale canvas symbols**

Run: `grep -n "canvasOpen\|canvasFiles\|focusCanvasFile\|closeCanvasFile\|setCanvasOpen\|toggleCanvas" src/lib/spot/store.ts`
Expected: no output (exit 1). If any line prints, it was missed — fix it.

Run: `grep -n "panelFile\|closeCanvas\|artifactCardMessage" src/lib/spot/store.ts`
Expected: the new field, action, helper, and the three `artifactCardMessage(...)` calls all appear.

- [ ] **Step 13: Commit** (local only, if asked)

```bash
rtk git add src/lib/spot/store.ts && rtk git commit -m "refactor(spot): single panelFile state + artifact cards"
```

---

### Task 6: Rewrite the panel (`SpotCanvasPanel`) + rework the files dropdown + light-re-theme `FileBody`

**Files:**
- Modify: `src/components/spot/workflow/workflow-pane.tsx` (remove `defaultFileForStep`, `WorkflowPane`, `AwaitingInputCanvas`; add `SpotCanvasPanel`; rework `ChatHeaderFilePicker`; re-theme `FileBody` / `MemoryFileView` / `StrategyFileView` / `PlanFileView`)

- [ ] **Step 1: Delete `defaultFileForStep` (lines 149-196)**

Delete the entire `defaultFileForStep` function and its doc comment (the block from line 149's `/** Default file to focus...` through line 196's closing `}`). Nothing references it after the rewrite.

- [ ] **Step 2: Replace `WorkflowPane` (lines 198-436) with `SpotCanvasPanel`**

Delete the whole `WorkflowPane` function (the doc comment at 198 through its closing brace at 436) and replace it with:

```tsx
/**
 * SpotCanvasPanel · the single floating artifact viewer. Renders nothing
 * when no file is open (panel is unmounted by the page). Header is a pure
 * path-label breadcrumb + a close X; body is the existing FileBody router,
 * light-themed. Read-only — every gate/approve action lives in the chat.
 */
export function SpotCanvasPanel() {
  const workflow = useSpotStore((s) => s.workflow);
  const panelFile = useSpotStore((s) => s.panelFile);
  const closeCanvas = useSpotStore((s) => s.closeCanvas);

  if (!workflow || !panelFile) return null;

  const meta = fileMeta(panelFile);
  const FolderIcon = meta.icon;
  const productId = "productId" in workflow ? workflow.productId : null;
  const productName =
    "productName" in workflow
      ? workflow.productName
      : "entityName" in workflow
        ? workflow.entityName
        : "";
  const slug = slugFor(productId ?? null, productName ?? "");

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--spot-card)" }}>
      {/* Header · path-label breadcrumb (pure label) + close X */}
      <div
        className="px-4 py-2.5 flex items-center gap-2 border-b"
        style={{ borderColor: "var(--spot-card-border)" }}
      >
        <FolderIcon size={12} strokeWidth={1.7} className="text-text-tertiary flex-shrink-0" />
        <div className="font-mono text-[10.5px] text-text-tertiary inline-flex items-center gap-1 min-w-0">
          <span className="truncate">{slug}</span>
          <span className="text-text-tertiary/60">/</span>
          <span className="text-text-secondary truncate">{meta.file}</span>
        </div>
        <span className="flex-1" />
        <button
          type="button"
          onClick={closeCanvas}
          aria-label="Close panel"
          className="inline-flex items-center justify-center h-6 w-6 rounded-button text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors flex-shrink-0"
        >
          <X size={14} strokeWidth={1.8} />
        </button>
      </div>

      {/* Body · the file router, light-themed */}
      <div className="flex-1 overflow-y-auto">
        <FileBody workflow={workflow} tab={panelFile} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Delete `AwaitingInputCanvas` (lines 550-591)**

Delete the `AwaitingInputCanvas` function and its doc comment (the dark orb empty state). It is no longer rendered.

- [ ] **Step 4: Rework `ChatHeaderFilePicker` into a single-select dropdown**

Replace the entire `ChatHeaderFilePicker` function (the doc comment at ~438 through its closing brace at ~548) with:

```tsx
/**
 * Chat-header files dropdown (LEFT panel). Lists the active workflow's
 * files with a taxonomy chip each. Selecting a row opens the panel to
 * that artifact (or switches the open panel to it). Single-select — the
 * panel shows exactly one file; the X inside the panel closes it.
 */
export function ChatHeaderFilePicker({ compact = false }: { compact?: boolean }) {
  const panelFile = useSpotStore((s) => s.panelFile);
  const workflow = useSpotStore((s) => s.workflow);
  const openCanvasFile = useSpotStore((s) => s.openCanvasFile);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const availableTabs = fileTabsForWorkflow(workflow);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  // Label · show the open file's name; otherwise a generic "Files" prompt.
  const primary = panelFile ? fileMeta(panelFile) : null;
  const PrimaryIcon = primary?.icon ?? FileText;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-button border border-border bg-white hover:border-border-hover text-text-primary ${
          compact ? "h-7 px-2 text-[11.5px]" : "h-8 px-2.5 text-[12px]"
        }`}
        title={panelFile ? "Switch file" : "Open a file"}
      >
        <PrimaryIcon size={11} strokeWidth={1.7} className="text-text-secondary" />
        {primary ? (
          <span className="font-mono text-[11px]">{primary.file}</span>
        ) : (
          <span>Files</span>
        )}
        <ChevronDown size={11} strokeWidth={1.8} className="text-text-tertiary" />
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+4px)] right-0 z-50 bg-white border border-border rounded-card py-1 min-w-[320px]"
          style={{ boxShadow: "var(--spot-shadow)" }}
        >
          <div className="px-3 pt-1 pb-1.5 text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
            Project files
          </div>
          {availableTabs.map((t) => {
            const Icon = t.icon;
            const isActive = panelFile === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  openCanvasFile(t.key);
                  setOpen(false);
                }}
                className={`w-full text-left flex items-center gap-2 px-3 h-9 hover:bg-surface-secondary text-[12.5px] ${
                  isActive ? "bg-surface-secondary/60" : ""
                }`}
              >
                <Icon size={11} strokeWidth={1.7} className="text-text-tertiary flex-shrink-0" />
                <span className="text-text-primary whitespace-nowrap">{t.label}</span>
                <span className="text-[10.5px] font-mono text-text-tertiary whitespace-nowrap flex-shrink-0">
                  {t.file}
                </span>
                <span className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                  <TaxonomyChip taxonomy={t.taxonomy} />
                  {isActive && <Check size={11} strokeWidth={2} className="text-text-primary" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Import check:** this rework uses `ChevronDown` and `Check` from lucide-react and the `useRef` / `useState` / `useEffect` React hooks. The old `ChatHeaderFilePicker` was already a click-outside dropdown, so `useRef`/`useState`/`useEffect` and `Check` are very likely already imported. If `node_modules/.bin/tsc --noEmit` reports `Cannot find name 'ChevronDown'` (or `Check`), add the missing name to the lucide-react import at the top of `workflow-pane.tsx`. Do NOT remove `Check`/`ChevronDown` even if a stale import lists them already.

- [ ] **Step 5: `FileBody` — light analyst report (line 636) + drop `diagnostic-dark` wrappers (lines 686, 692)**

Line 636 — change:

```tsx
        <Markdown source={report.reportMd} theme="dark" />
```

to:

```tsx
        <Markdown source={report.reportMd} theme="light" />
```

Line 686 — change `className="px-6 py-5 diagnostic-dark"` to `className="px-6 py-5"`.
Line 692 — change `className="px-6 py-5 diagnostic-dark"` to `className="px-6 py-5"`.

- [ ] **Step 6: `MemoryFileView` — drop the dark build loader, light theme, light empty (lines 1432-1474)**

Delete the `isBuildingFromScratch` block (lines 1432-1441):

```tsx
  const isBuildingFromScratch =
    workflow.kind === "launch-campaign" &&
    !files &&
    !workflow.researchedMemory &&
    (workflow.step === "deep-research" ||
      (workflow.step === "kickoff" && !workflow.kickoffReady));

  if (isBuildingFromScratch && workflow.kind === "launch-campaign") {
    return <MemoryBuildingLoader productName={workflow.productName} />;
  }
```

Line 1459 — change `<Markdown source={md} theme="dark" />` to `<Markdown source={md} theme="light" />`.
Line 1467 — change `<EmptyFile label="No memory yet." />` to `<EmptyFile label="Nothing here yet." />`.
Line 1472 — change `<Markdown source={files.productInfoMd} theme="dark" />` to `<Markdown source={files.productInfoMd} theme="light" />`.

(The light `BuildingOverlay` at 1474 stays.)

- [ ] **Step 7: `StrategyFileView` — drop the dark build loader (lines 2404-2426)**

Replace the whole function:

```tsx
function StrategyFileView({ workflow }: { workflow: LaunchWorkflow }) {
  const [building, setBuilding] = useState(workflow.step === "launch-strategy");
  useEffect(() => {
    if (workflow.step === "launch-strategy") {
      setBuilding(true);
      const id = setTimeout(() => setBuilding(false), 5000);
      return () => clearTimeout(id);
    }
    setBuilding(false);
  }, [workflow.step]);

  if (building) {
    return (
      <DarkSpotLoader
        agentLabel="Strategy Agent · live"
        title="Composing the campaign strategy"
        thoughts={STRATEGY_THOUGHTS}
        intervalMs={1600}
      />
    );
  }
  return <LaunchStrategyStep workflow={workflow} />;
}
```

with:

```tsx
function StrategyFileView({ workflow }: { workflow: LaunchWorkflow }) {
  // Build progress is narrated in the chat (tool-call parts); the panel
  // just shows the strategy artefact (light).
  return <LaunchStrategyStep workflow={workflow} />;
}
```

- [ ] **Step 8: `PlanFileView` — drop the dark build loader, light theme (lines 2441-2497)**

Delete the `planBuilding` state + effect + loader (lines 2441-2461):

```tsx
  const [planBuilding, setPlanBuilding] = useState(
    workflow.kind === "launch-campaign" && workflow.step === "launch-plan",
  );
  useEffect(() => {
    if (
      workflow.kind === "launch-campaign" &&
      workflow.step === "launch-plan"
    ) {
      setPlanBuilding(true);
      const id = setTimeout(() => setPlanBuilding(false), 11800);
      return () => clearTimeout(id);
    }
    setPlanBuilding(false);
  }, [workflow?.step, workflow?.kind]);

  if (
    planBuilding &&
    workflow.kind === "launch-campaign"
  ) {
    return <PlanBuildingLoader productName={workflow.productName} />;
  }
```

Line 2471 — change `<Markdown source={md} theme="dark" />` to `<Markdown source={md} theme="light" />`.
Line 2497 — change `<Markdown source={files.planMd} theme="dark" />` to `<Markdown source={files.planMd} theme="light" />`.

(The light `EmptyCanvas` and `BuildingOverlay` usages stay. `useState`/`useEffect` are still imported and used elsewhere in the file — leave the imports.)

- [ ] **Step 9: Resolve any now-unused symbols flagged by typecheck**

Run: `node_modules/.bin/tsc --noEmit 2>&1 | grep "workflow-pane.tsx"`

If `noUnusedLocals` surfaces errors for now-dead components (`MemoryBuildingLoader`, `PlanBuildingLoader`, `DarkSpotLoader`, or imports like `PanelRightClose`, `Maximize2`, `LaunchBuildingLoader`, `ImportCampaignsStep`, `ExecutionChecklist`, `ThankYouScreen`, `DiagnosticPhaseLoader`, `SpotLoader`, `Home`, `Megaphone`, `LayoutIcon`, `PartyPopper`, `Wifi`, `WifiOff`, `Cog`, `motion`, `Variants`, `canvasStagger`, `canvasReveal`), delete each flagged declaration/import. If `noUnusedLocals` is off (default in many Next setups), there will be no such errors — leave them. Do NOT delete a symbol that is still referenced by a kept view (e.g. `DiagnosticPhaseLoader` may still be used by the diagnostic file views — only delete what tsc actually flags as unused).

Note: `WorkflowPane` and `defaultFileForStep` are gone; `page.tsx` (Task 8) imports `SpotCanvasPanel` instead. Until Task 8 lands, `page.tsx` still imports `WorkflowPane` and will error — expected, fixed in Task 8.

- [ ] **Step 10: Verify the panel surface is light (no dark hex in the rewritten regions)**

Run: `grep -n "theme=\"dark\"\|diagnostic-dark\|#161614\|#1A1A18" src/components/spot/workflow/workflow-pane.tsx`
Expected: no output (exit 1). (Any remaining `theme="dark"` means a `FileBody` view was missed.)

- [ ] **Step 11: Commit** (local only, if asked)

```bash
rtk git add src/components/spot/workflow/workflow-pane.tsx && rtk git commit -m "feat(spot): single light SpotCanvasPanel + files dropdown"
```

---

### Task 7: Artifact card renderer

**Files:**
- Modify: `src/components/spot/spot-message.tsx` (import `fileMeta`, add `ArtifactCardPart`, add `PartRenderer` case)

- [ ] **Step 1: Import `fileMeta` from workflow-pane**

The file currently imports the `LaunchWorkflow` type from workflow at line 13. Add a value import for `fileMeta` directly below it:

```tsx
import { fileMeta } from "@/components/spot/workflow/workflow-pane";
```

- [ ] **Step 2: Add the `ArtifactCardPart` component (after `HandoffPart`, ~line 192)**

Mirror `HandoffPart`'s reference-card shell; swap the SpotMark for the file icon and the "Next step" eyebrow for the filename, and make the whole card open the panel:

```tsx
function ArtifactCardPart({
  file,
  title,
  subtitle,
}: {
  file: CanvasFile;
  title: string;
  subtitle: string;
}) {
  const openCanvasFile = useSpotStore((s) => s.openCanvasFile);
  const meta = fileMeta(file);
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={() => openCanvasFile(file)}
      className="card-base hover-row text-left w-full p-3 flex items-center gap-3 mb-2.5"
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-[7px] flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #FAF8F2 0%, #FFF 100%)", border: "1px solid #E8C97A" }}
      >
        <Icon size={16} strokeWidth={1.7} className="text-text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono text-text-tertiary mb-0.5">{meta.file}</div>
        <div className="text-[13.5px] font-semibold leading-tight">{title}</div>
        <div className="text-[11.5px] text-text-secondary mt-0.5">{subtitle}</div>
      </div>
      <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-text-secondary flex-shrink-0">
        Open
        <ChevronRight size={14} className="text-text-tertiary" />
      </span>
    </button>
  );
}
```

- [ ] **Step 3: Add `CanvasFile` to the type imports**

The types import is on line 11. Add a value/type import for `CanvasFile` from workflow (it has none yet besides `LaunchWorkflow` on line 13). Change line 13:

```tsx
import type { LaunchWorkflow } from "@/lib/spot/workflow";
```

to:

```tsx
import type { LaunchWorkflow, CanvasFile } from "@/lib/spot/workflow";
```

- [ ] **Step 4: Add the `PartRenderer` case (after the `step-cta` case, line 1114)**

Insert:

```tsx
    case "artifact":
      return <ArtifactCardPart file={part.file} title={part.title} subtitle={part.subtitle} />;
```

- [ ] **Step 5: Verify the case + component exist**

Run: `grep -n "ArtifactCardPart\|case \"artifact\"" src/components/spot/spot-message.tsx`
Expected: the component definition, its use in the case, and the `case "artifact":` line all print.

- [ ] **Step 6: Commit** (local only, if asked)

```bash
rtk git add src/components/spot/spot-message.tsx && rtk git commit -m "feat(spot): render artifact chat cards"
```

---

### Task 8: Page layout — chat base + floating panel + reflow + responsive

**Files:**
- Modify: `src/app/(app)/spot/page.tsx` (import swap, remove `ResizeHandle`, store-hook swap, `useIsNarrow` hook, `closeCanvas` wiring, workflow-branch rewrite)

- [ ] **Step 1: Swap the panel import (line 51)**

Change:

```tsx
import { WorkflowPane, ChatHeaderFilePicker } from "@/components/spot/workflow/workflow-pane";
```

to:

```tsx
import { SpotCanvasPanel, ChatHeaderFilePicker } from "@/components/spot/workflow/workflow-pane";
```

- [ ] **Step 2: Delete `ResizeHandle` (lines 78-123)**

Delete the whole `ResizeHandle` function (its doc comment header at ~76 through the closing brace at 123). No resize in v1.

- [ ] **Step 3: Add the `useIsNarrow` hook (just above `composerPlaceholderFor`, ~line 125)**

```tsx
/** True below the 900px reflow breakpoint — the panel overlays instead
 *  of reflowing. SSR-safe: starts false, the effect sets the real value. */
function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}
```

- [ ] **Step 4: Swap `canvasOpen` for `panelFile` + grab `closeCanvas` + call `useIsNarrow` (lines 148-153)**

Change line 150:

```tsx
  const canvasOpen = useSpotStore((s) => s.canvasOpen);
```

to:

```tsx
  const panelFile = useSpotStore((s) => s.panelFile);
  const closeCanvas = useSpotStore((s) => s.closeCanvas);
  const isNarrow = useIsNarrow();
  const panelOpen = panelFile !== null;
```

- [ ] **Step 5: Remove the obsolete `chatWidth` state (lines 156-164)**

Delete:

```tsx
  // Chat-panel width (px) — user-resizable via the divider drag handle.
  // Default to 40% of the viewport so the canvas gets ~60% to render
  // the file content comfortably. Falls back to a sensible px value
  // during SSR before window is available.
  const [chatWidth, setChatWidth] = useState(() =>
    typeof window !== "undefined"
      ? Math.max(420, Math.round(window.innerWidth * 0.4))
      : 720,
  );
```

- [ ] **Step 6: Close the panel on mount-reset (line 172)**

In the mount `useEffect`, after `closePanel();` (line 172) add:

```tsx
    closeCanvas();
```

- [ ] **Step 7: Rewrite the workflow-mode render (lines 300-449)**

Replace the entire `if (workflow && !viewHomeOverride) { return ( ... ); }` block (lines 300-450) with:

```tsx
  if (workflow && !viewHomeOverride) {
    const PANEL_W = 380;
    return (
      <div
        className="h-screen relative overflow-hidden"
        style={{ background: "var(--spot-desk)" }}
      >
        {/* Chat — the base surface. Reflows narrower (right padding) when
            the panel is docked on a wide viewport; full-width otherwise. */}
        <div
          className="h-full flex flex-col"
          style={panelOpen && !isNarrow ? { paddingRight: PANEL_W + 16 } : undefined}
        >
          <div className="relative z-30 flex items-center gap-2.5 px-4 py-3 border-b border-border-subtle bg-white/70 backdrop-blur-sm">
            <button
              type="button"
              onClick={showHomeView}
              title="Back to Spot home · workflow stays alive"
              className="inline-flex items-center justify-center h-7 w-7 rounded-button text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
            >
              <Home size={14} strokeWidth={1.6} />
            </button>
            {isAgentRunning ? (
              <SpotLoader mode="orbit" size={21} className="!gap-0" />
            ) : (
              <SpotMark size={21} />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold leading-tight">Spot</div>
              <div className="text-[10.5px] text-text-tertiary leading-tight truncate">
                {workflow.kind === "scale"
                  ? `Scaling · ${workflow.productName}`
                  : workflow.kind === "optimize"
                    ? `Optimizing · ${workflow.productName}`
                    : workflow.kind === "test-angles"
                      ? `Angle test · ${workflow.productName}`
                      : workflow.kind === "campaign-dive"
                        ? `Spot it · ${workflow.entityName}`
                        : workflow.kind === "analyst-review"
                          ? `Analyst review · ${workflow.productName}`
                          : `Launching · ${workflow.productName}`}
              </div>
            </div>
            {/* Files dropdown · the only file-inventory surface. Shown for
                every workflow (incl. analyst-review, which has analysis.md). */}
            <ChatHeaderFilePicker compact />
          </div>

          <div ref={threadScrollRef} className="flex-1 overflow-y-auto scroll px-4 py-4">
            <div className="max-w-[760px] mx-auto w-full">
              {thread.map((m, i) => (
                <MessageBubble key={i} message={m} animate={i === thread.length - 1} />
              ))}
              {pending && <TypingDots />}
              <AgentWorkingBlock
                working={isAgentRunning}
                workflowKind={workflow.kind}
                workflowStep={workflow.step}
              />
              {isAgentRunning &&
                !["launch-campaign", "scale", "optimize", "test-angles"].includes(
                  workflow.kind,
                ) && <AgentTrailIndicator working />}

              {workflow.kind === "launch-campaign" &&
                workflow.step === "product-setup" &&
                workflow.productSetupModalOpen === true &&
                !workflow.productSetupAnswers?.name && (
                  <ProductSetupQuestionCard
                    onSubmit={(data) => submitProductSetupForm(data)}
                    onClose={() => exitWorkflow()}
                  />
                )}
            </div>
          </div>
          <div className="border-t border-border-subtle px-3 py-3 bg-white/50 backdrop-blur-sm">
            <div className="max-w-[760px] mx-auto w-full">
              <Composer
                value={draft}
                onChange={setDraft}
                onSend={() => send()}
                scope={scope}
                onChangeScope={setScope}
                scopeOpen={scopeOpen}
                onScopeOpenChange={setScopeOpen}
                inputRef={inputRef}
                placeholder={composerPlaceholderFor(workflow)}
                onAttachFiles={
                  workflow.kind === "launch-campaign" &&
                  workflow.step === "product-setup" &&
                  workflow.productSetupStage === "files"
                    ? (names) =>
                        useSpotStore.getState().attachProductSetupFiles(names)
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Scrim · only on narrow viewports where the panel overlays. */}
        {panelOpen && isNarrow && (
          <div
            className="absolute inset-0 z-40 bg-black/20"
            onClick={closeCanvas}
            aria-hidden
          />
        )}

        {/* Floating artifact panel · docked right, mounted only when open.
            Reflows the chat on wide viewports; overlays full-bleed (with
            the scrim above) on narrow ones. */}
        {panelOpen && (
          <div
            className={
              isNarrow
                ? "absolute inset-2 z-50"
                : "absolute top-2 bottom-2 right-2 z-40"
            }
            style={isNarrow ? undefined : { width: PANEL_W }}
          >
            <div
              className="h-full rounded-card overflow-hidden"
              style={{
                background: "var(--spot-card)",
                border: "1px solid var(--spot-card-border)",
                boxShadow: "var(--spot-shadow)",
              }}
            >
              <SpotCanvasPanel />
            </div>
          </div>
        )}
      </div>
    );
  }
```

- [ ] **Step 8: Close the panel from the active-thread "New" button (line 473)**

In the active-thread render, the "New chat" button calls `setThread([])`. Change its `onClick` (line 473):

```tsx
            onClick={() => setThread([])}
```

to:

```tsx
            onClick={() => {
              setThread([]);
              closeCanvas();
            }}
```

- [ ] **Step 9: Verify no stale canvas symbols remain in the page**

Run: `grep -n "canvasOpen\|ResizeHandle\|WorkflowPane\|chatWidth\|#161614" src/app/(app)/spot/page.tsx`
Expected: no output (exit 1).

Run: `grep -n "panelFile\|SpotCanvasPanel\|useIsNarrow\|closeCanvas" src/app/(app)/spot/page.tsx`
Expected: the new symbols print.

- [ ] **Step 10: Resolve any unused-import errors**

Run: `node_modules/.bin/tsc --noEmit 2>&1 | grep "spot/page.tsx"`
If `noUnusedLocals` flags `PanelRightOpen` (the removed toggle button) or `ChevronLeft`/`ChevronRight`/`X` if now unused, remove them from the lucide import on lines 21-40. Only remove what tsc flags.

- [ ] **Step 11: Commit** (local only, if asked)

```bash
rtk git add src/app/\(app\)/spot/page.tsx && rtk git commit -m "feat(spot): chat-base layout with floating artifact panel"
```

---

### Task 9: Full typecheck + browser verification + self-review

**Files:** none (verification only)

- [ ] **Step 1: Typecheck the whole project**

Run: `node_modules/.bin/tsc --noEmit 2>&1 | grep -v "src/lib/integration-data.ts(31"`
Expected: no output other than (possibly) the pre-existing `integration-data.ts:31` `contact_extraction` error, which is filtered and out of scope per spec §10. If any OTHER error prints, fix it before proceeding.

- [ ] **Step 2: Start the dev server and sign in**

Use the preview tools. Start the server (port 3200) with `preview_start`, navigate to `/spot`, and complete OTP `150397` if prompted.

- [ ] **Step 3: Verify the closed state**

`preview_snapshot` + `preview_screenshot` on `/spot` after starting a launch flow (e.g. kick off an existing-product launch). Confirm: chat owns the full surface on a warm paper background (`--spot-desk`), no panel is visible, the chat header shows the **Files** dropdown.

- [ ] **Step 4: Verify opening from an artifact card**

After the kickoff reveal, an artifact card ("Project details") appears in the thread. `preview_click` its Open affordance. Confirm: the panel floats in docked right, the chat reflows narrower (its right edge clears the panel), and the breadcrumb reads `<slug> / project-details.md`. `preview_screenshot`.

- [ ] **Step 5: Verify opening / switching from the files dropdown**

`preview_click` the header Files dropdown, confirm rows show filename + taxonomy chip (Work = gold, others neutral), pick a different file (e.g. Plan). Confirm the panel switches to that artifact at its full path. `preview_screenshot`.

- [ ] **Step 6: Verify the breadcrumb is inert and X closes**

`preview_click` the breadcrumb label — confirm nothing happens (not a button). `preview_click` the panel's X — confirm the panel unmounts and the chat reflows full-width.

- [ ] **Step 7: Verify the responsive overlay**

`preview_resize` to width 800 (below 900px). Open a file. Confirm the panel overlays the chat full-bleed with a dim scrim (not a reflow), and clicking the scrim or the X dismisses it. `preview_screenshot`. Resize back to a wide width and confirm it reflows again.

- [ ] **Step 8: Check the console for errors**

`preview_console_logs` — confirm no React errors/warnings from the new components (no missing-key, no "cannot read panelFile", no hydration mismatch from `useIsNarrow`).

- [ ] **Step 9: Plan self-review (run the writing-plans checklist)**

Confirm: every spec section (§4 file/taxonomy model, §5.1–5.6 components, §6 data flow, §7 edge cases/responsive, §8 principles) maps to a task above; no placeholders remain; `openCanvasFile` / `closeCanvas` / `panelFile` / `SpotCanvasPanel` / `fileMeta` / `artifactCardMessage` names are used consistently across tasks.

- [ ] **Step 10: Principle re-check (LOAD-BEARING — `spot_agentic_principles.md`)**

Confirm the panel has NO approve/edit/write control (P11) — only the close X and the read-only `FileBody`. All gates (`step-cta`, `choice`, analyst CTAs) still render in the chat stream. If any step pulled a gate into the panel, STOP and raise it with Sourabh (spec §8) before shipping.

---

## Out of scope (do not build — spec §9)

- Floating-card treatment across the whole app shell / nav rail (the existing app nav is left as-is for the Spot route in v1).
- Dark mode entirely (no `.dark` block, no dark token values, no toggle).
- Real backend wiring of artefact production (mock data continues to drive cards and panel).
- Memory drawer structural work (`memory-panel.tsx` only inherits the `MarkdownDoc` token change from Task 2).
- The pre-existing `src/lib/integration-data.ts:31` `contact_extraction` typecheck error.

## Constraints (standing)

- **RULE 1 — no remote writes to any revspot org repo until explicit go-ahead.** Local commits only if the user explicitly asks. Never `git push` / PR / branch-push.
- React 18.3.1-portable only (no React-19/RSC-only APIs).
- Light mode only for v1.
