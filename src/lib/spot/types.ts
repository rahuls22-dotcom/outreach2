import type { CanvasFile } from "./workflow";

// Types used across the Spot agent surfaces (panel, palette, guided flows).
//
// In this version Spot is answer-only. There is no "actions" part type. Any
// "doing" needs to be expressed as a handoff to a guided flow.

export type ScopeKind = "workspace" | "project" | "campaign";

export type SpotScope = {
  kind: ScopeKind;
  label: string;
  target?: string;
  /** When kind is "project", an optional single campaign within it.
   *  Absent = "All campaigns" (the whole project). */
  campaignId?: string;
  campaignLabel?: string;
};

export type Verdict = "ok" | "warn" | "err" | "info";

export type SpotPart =
  | { type: "text"; text: string }
  | { type: "headline"; text: string; verdict?: Verdict }
  | { type: "findings"; items: SpotFinding[] }
  | { type: "kpis"; items: SpotKpi[] }
  | { type: "handoff"; kind: GuidedKind; label: string; reason: string }
  // Inline workflow CTA — owns the "Approve & continue" action so the
  // chat (not the right-pane workspace) is where decisions get made.
  // Spent rendered the right-pane canvas as a place to *see* the work
  // and the chat as the place to *act on it*, like Claude's flows.
  | { type: "step-cta"; label: string; helper?: string; refineHint?: string }
  // A saved artefact, surfaced as a floating chat card. Clicking Open
  // calls openCanvasFile(file) — the ONLY way Spot proactively surfaces
  // an artefact. Carries no approve action (gates remain separate parts).
  | { type: "artifact"; file: CanvasFile; title: string; subtitle: string; markdown?: string }
  // Multi-option branch — two or three mutually-exclusive choices in a
  // single Spot message (e.g. "Import campaigns" vs "Launch new"). Each
  // option carries an `action` key the renderer maps to a store call.
  | { type: "choice"; prompt?: string; options: SpotChoiceOption[] }
  // Inline import-campaigns picker — ad-account selection → campaign
  // selection → imported, all rendered in the chat (left panel). Reads /
  // writes the workflow's import state in the store; the right canvas
  // stays on memory.md.
  | { type: "import-picker" }
  // The Analyst Agent's report — a collapsed drop-down. Closed by default
  // (Spot's one-liner sits above it); expands to the full detailed write-up +
  // the analyst↔Spot conversation. The renderer looks the report up by id.
  | { type: "analyst-report"; productId: string }
  // The Analyst Agent's review of freshly-imported campaigns — same shape as
  // analyst-report (attributed opener + collapsible markdown), but built from
  // the imported campaign set rather than a product in PRODUCTS.
  | { type: "import-report"; campaignIds: string[]; accountId: string; productName: string }
  // The recommended-action CTA at the end of an analyst review — kicks off the
  // matching flow (scale / optimize / test-angles / launch) for the project.
  | {
      type: "analyst-cta";
      flow: "scale" | "optimize" | "test-angles" | "launch";
      productId: string;
      productName: string;
      label: string;
    }
  // Tool / agent call narration — renders a compact status row that
  // says "Spawning Persona Researcher…" with a spinner. Status flips
  // to "done" with a check once the workflow advances.
  | {
      type: "tool-call";
      id: string;
      agent: string;
      detail?: string;
      status: "running" | "done";
    }
  // Refinement ledger event — the structured delta a studio session
  // hands back to Spot on commit. The studio conversation never lands
  // in this thread; only the versioned outcome does ("artifacts travel,
  // conversations don't"). Collapsed row; expands to the change list.
  | {
      type: "ledger";
      agent: string; // "Iris"
      artifact: string; // "Angle 2 · Parent"
      fromVersion: number;
      toVersion: number;
      summary: string; // "warmer palette · shorter headline"
      changes: string[];
      impact?: string; // plan-level consequence flag, if any
    };

/** Branch actions a `choice` part can trigger. Mapped to store calls in
 *  the chat renderer (ChoicePart). */
export type SpotChoiceAction =
  | "launch-new" // kickoff → draft a fresh execution plan
  | "import-campaigns" // open the import-campaigns canvas
  | "launch-after-import" // after import → jump into the launch plan
  | "analyse-performance" // after import → open Campaigns
  | "reconsider-flow"; // after a reject → run a different diagnostic play

export type SpotChoiceIcon = "rocket" | "download" | "chart" | "sparkles";

export type SpotChoiceOption = {
  label: string;
  helper?: string;
  action: SpotChoiceAction;
  icon?: SpotChoiceIcon;
  variant?: "primary" | "secondary";
  // For `reconsider-flow`: which diagnostic to run and on which product.
  diagFlow?: "scale" | "optimize" | "test-angles";
  productId?: string;
  productName?: string;
};

export type SpotFinding = {
  tone?: "concern" | "positive" | "neutral";
  title: string;
  body: string;
  evidence?: string[];
};

export type SpotKpi = {
  label: string;
  value: string;
  delta?: string;
  good?: boolean | null;
};

export type SpotMessage =
  | { role: "user"; text: string }
  | { role: "spot"; parts: SpotPart[] };

export type SpotThread = {
  id: string;
  title: string;
  scope: string; // "workspace" | "project:<id>" | "campaign:<id>"
  when: string;
  pinned?: boolean;
};

export type GuidedKind =
  | "new-persona"
  | "new-angle"
  | "launch-creative"
  | "new-campaign"
  | "new-adset";

export type GuidedPayload = {
  kind: GuidedKind;
  projectId?: string;
  personaId?: string;
  angleId?: string;
  prefillTypeId?: string;
};
