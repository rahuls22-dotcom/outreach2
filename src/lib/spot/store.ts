"use client";

import { create } from "zustand";
import type { GuidedKind, GuidedPayload, SpotMessage, SpotPart, SpotScope } from "./types";
import {
  EMPTY_APPROVALS,
  executionMovesFor,
  launchBuildMoves,
  launchDeployMoves,
  nextStepFor,
  stepIntroMessage,
  STEP_TOOL_CALL,
  type CampaignDiveWorkflow,
  type CanvasFile,
  type DiagnosticWorkflow,
  type LaunchWorkflow,
  type ProductSetupAnswers,
  type SpotWorkflow,
  type WorkflowBudget,
  type WorkflowKind,
  type WorkflowStep,
} from "./workflow";
import { PRODUCTS } from "../products-data";
import { analystReportFor, importedReviewFor } from "./analyst-data";
import { campaignsForAccount } from "./import-campaigns-data";
import { planMarkdownFor, watchHandoffMessage, firstNudgeMessage } from "./extended-flows";
import { buildLaunchPlanMd, buildLaunchStrategyMd } from "./memory-files";

type PanelState = {
  open: boolean;
  maximized: boolean;
  scope: SpotScope;
  // Bumped each time the host calls askSpot(query) so the panel knows to
  // reset its thread and seed a reply for the new question.
  pendingQuery: { q: string; ts: number } | null;
  // Live conversation in the panel.
  thread: SpotMessage[];

  // Command palette
  paletteOpen: boolean;

  // Guided flow modal
  guided: GuidedPayload | null;

  // Toast
  toast: string | null;

  // Active workflow — launch-campaign, scale, optimize, or test-angles.
  // null = no workflow active, single-column chat.
  workflow: SpotWorkflow | null;
  // The single artifact the floating panel is showing, or null when the
  // panel is closed. This one field IS the panel state — open iff
  // panelFile !== null. Chat-driven: only user clicks set it.
  panelFile: CanvasFile | null;
  // When a workflow is active but the user has navigated back to the
  // Spot homepage (via the "Spot home" button), this is true. The
  // workflow is preserved; we just render the home view. Setting back
  // to false re-enters the split-screen.
  viewHomeOverride: boolean;

  // Setters
  askSpot: (query: string, scope?: SpotScope) => void;
  startLaunchFlow: (project: { id: string; name: string }) => void;
  /** Start the workflow at the product-setup step (new product flow). */
  startNewProductFlow: () => void;
  /** Handle a chat-driven answer during the product-setup Q&A. Each
   *  call advances the stage (name → url → files → ready) and appends
   *  Spot's next question. The final "ready" stage triggers
   *  startDeepResearch automatically. */
  handleProductSetupAnswer: (text: string) => void;
  /** Attach files during product-setup. Mirrors the attachment as a
   *  user message in the chat. */
  attachProductSetupFiles: (fileNames: string[]) => void;
  /** Submit the new-product modal · captures name + URL + files in one
   *  shot, mirrors the input as a user message in chat, then triggers
   *  deep research. Replaces the chat-driven Q&A for the first step. */
  submitProductSetupForm: (data: {
    name: string;
    url?: string;
    files?: string[];
    /** Daily ad spend in ₹ — sizes the campaign plan + lead targets. */
    dailyBudget?: number;
  }) => void;
  /** Spot doesn't recognise the product — fake-research it in real-time. */
  startDeepResearch: (productName: string, attachedFiles?: string[]) => void;
  /** Start the Scale workflow against an existing product. */
  startScaleFlow: (product: { id: string; name: string }) => void;
  /** Start the Optimize workflow against an existing product. */
  startOptimizeFlow: (product: { id: string; name: string }) => void;
  /** Start the Test New Angles workflow against an existing product. */
  startTestAnglesFlow: (product: { id: string; name: string }) => void;
  /** Open the Analyst Agent ↔ Spot conversation for a project (chat-only). */
  startAnalystReview: (product: { id: string; name: string }) => void;
  /** User passed on Spot's recommendation. Keeps the session, reasons through
   *  the reject, then asks what to do next (with alternative plays). */
  rejectRecommendation: (args: {
    flow: "scale" | "optimize" | "test-angles" | "launch";
    productId: string;
    productName: string;
  }) => void;
  /** User passed on a mid-flow step gate (e.g. didn't want to set the goal).
   *  Same shape as rejectRecommendation: keeps the session, reasons through the
   *  pass, then asks what they'd like to do. Holds the workflow where it is. */
  rejectStep: () => void;
  /** Start the campaign-dive surface · chat-left + campaign-detail right.
   *  Called by the "Spot it" button on campaign / ad-set / ad rows. */
  startCampaignDive: (entity: {
    id: string;
    name: string;
    tier: "campaign" | "adset" | "ad";
    productId: string;
    productName: string;
    channel: "Meta" | "Google";
    metaUrl: string;
  }) => void;
  /** Advance the workflow to the next step + seed a Spot narration message.
   *  Pass `forcedNext` to jump to a specific step instead of the linear
   *  next one (used by the import branch to enter the launch plan). */
  advanceWorkflow: (narration?: string, forcedNext?: WorkflowStep) => void;
  /** Seed the live-execution checklist for the active diagnostic workflow
   *  and tick the moves off one by one on a timer (pending → running →
   *  done), flipping executionDone when all are complete. Drives the
   *  LiveExecution canvas. Called when the *-live step begins. */
  startLiveExecution: () => void;
  /** Seed + tick the launch-building checklist (the 5 build tasks) on a
   *  timer. When the last task finishes, flips the thinking tool-call (by
   *  id) to done, appends Spot's build-complete message, and opens the
   *  deliverables canvas. Called the moment launch-building begins. */
  startLaunchBuild: (callId: string) => void;
  startLaunchDeploy: (callId: string) => void;
  /** Begin the import-campaigns sub-flow (after memory setup). Opens the
   *  ad-account picker on the canvas. */
  startImportCampaigns: () => void;
  /** Pick an ad account → load its campaigns (all pre-ticked). */
  selectImportAdAccount: (accountId: string) => void;
  /** Return to the ad-account picker from the campaign list. */
  backToImportAccounts: () => void;
  /** Toggle one campaign in the import selection. */
  toggleImportCampaign: (id: string) => void;
  /** Replace the whole import selection (select-all / clear). */
  setImportSelection: (ids: string[]) => void;
  /** Confirm the import → freeze the set + post the next-step choice. */
  confirmImportCampaigns: () => void;
  /** Hand the imported campaigns to the Analyst Agent → open an analyst
   *  review conversation (replaces /campaigns navigation). */
  startImportReview: () => void;
  /** Jump to a specific step (used for "edit a previous step"). */
  gotoStep: (step: WorkflowStep) => void;
  setWorkflowBudget: (b: WorkflowBudget) => void;
  toggleWorkflowApproval: (group: "personaIds" | "angleIds" | "formIds", id: string) => void;
  /** Set an answer at the clarify step (questionId → optionId, or a
   *  list of optionIds for multi-select questions). */
  setClarifyAnswer: (questionId: string, value: string | string[]) => void;
  /** Pre-populate all clarify defaults at once (called on entering clarify). */
  primeClarifyDefaults: (defaults: Record<string, string | string[]>) => void;
  /** Pick / change the voice agent attached to outbound campaigns. */
  attachVoiceAgent: (agentId: string | null) => void;
  exitWorkflow: () => void;
  /** Open the panel to a file, or switch the open panel to it. */
  openCanvasFile: (file: CanvasFile) => void;
  /** Close the panel entirely (X / thread switch / Spot home). */
  closeCanvas: () => void;
  /** Park the workflow and render the homepage (workflow stays alive). */
  showHomeView: () => void;
  /** Resume the active workflow (homepage banner / past-chats click). */
  resumeWorkflow: () => void;
  /** Stamp the active workflow with the exact saved-session title, so the
   *  in-session header shows the same name as the Sessions list. Called
   *  right after a flow starter when resuming an existing session. No-op if
   *  no workflow is active. */
  setResumedTitle: (title: string) => void;
  /** Set of step-CTA labels the user has already clicked in the
   *  current workflow. We hide the button after click so the chat
   *  doesn't render the same dark CTA next to the user's echo. */
  clickedCtas: Set<string>;
  markCtaClicked: (label: string) => void;
  /** Recommendation cards (Analyst CTA) the user has resolved, keyed by a
   *  stable sentinel. Persists across flow starts (unlike clickedCtas, which
   *  resets per workflow) so the card can morph into its decided state and
   *  stay that way. */
  ctaResolutions: Record<string, "accepted" | "rejected">;
  resolveCta: (key: string, decision: "accepted" | "rejected") => void;
  /** Workspace-level WhatsApp Business connection state (for media-plan). */
  whatsAppConnected: boolean;
  connectWhatsApp: () => void;
  setScope: (scope: SpotScope) => void;
  appendMessage: (m: SpotMessage) => void;
  setThread: (m: SpotMessage[] | ((prev: SpotMessage[]) => SpotMessage[])) => void;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  toggleMaximize: () => void;
  setMaximized: (v: boolean) => void;
  openPalette: () => void;
  closePalette: () => void;
  openGuided: (payload: GuidedPayload) => void;
  closeGuided: () => void;
  showToast: (text: string) => void;
  dismissToast: () => void;
};

const WORKSPACE_SCOPE: SpotScope = { kind: "workspace", label: "Workspace" };

/**
 * Build the initial state for a Diagnostic flow (Scale / Optimize /
 * Test-Angles). All three share the structure — only the first step,
 * tool-call narration, and intro copy differ.
 *
 * After the fake delay, the loader resolves: `ready` flips to true and
 * the first step's intro message appears with its CTA.
 */
/** Spot's chain-of-thought as it opens each diagnostic — one string per
 *  reasoning step, streamed in order before the analyze result lands. Mirrors
 *  the analyst-review CoT so every phase reads the same: thinking → chain of
 *  thought → next thing. */
const DIAGNOSTIC_THINKING: Record<DiagnosticWorkflow["kind"], string[]> = {
  scale: [
    "Pulling up what I know about this project",
    "Confirming the winners and where budget's underspent",
    "Checking audience headroom before pushing",
    "Sizing the moves I'd make",
  ],
  optimize: [
    "Reading the latest performance",
    "Separating recent problems from chronic ones",
    "Tracing each issue back to a root cause",
    "Picking the smallest reversible fixes first",
  ],
  "test-angles": [
    "Auditing the last 30 days of creative",
    "Finding the pattern under the winners",
    "Spotting which angles have gone stale",
    "Framing the angles worth testing",
  ],
};

function startDiagnostic(
  set: (
    fn: (s: PanelState) => Partial<PanelState> | PanelState,
  ) => void,
  kind: DiagnosticWorkflow["kind"],
  product: { id: string; name: string },
  firstStep: WorkflowStep,
  // copy is retained for callers but the analyze narration now comes from
  // stepIntroMessage so the CoT result reads consistently across entry points.
  _copy: { headline: string; intro: string },
) {
  const thinking = DIAGNOSTIC_THINKING[kind];

  // The clarify (questions) step for each kind — where we jump to when the
  // analysis has already happened.
  const CLARIFY_STEP: Record<DiagnosticWorkflow["kind"], WorkflowStep> = {
    scale: "scale-clarify",
    optimize: "opt-clarify",
    "test-angles": "ang-clarify",
  };

  // When the user accepts an Analyst recommendation, the analysis is already
  // done and read (it's the analyst review sitting right above). Re-running an
  // analyze step would be redundant and makes Accept feel like "go". So in
  // that case we skip straight to the questions; fresh entries (resume,
  // dashboard) still open on the analyze step. Captured out of `set` so the
  // thinking runner below uses the same step.
  let openStep = firstStep;

  set((s) => {
    // Continue the SAME chat session when the user is accepting an Analyst
    // recommendation — the analyst review (finding + report + Spot's reasoning)
    // stays above, and Spot picks the thread back up. Other entry points
    // (dashboard cards, campaign table) start a fresh thread.
    const continuing =
      s.workflow?.kind === "analyst-review" && s.workflow.productId === product.id;
    if (continuing) openStep = CLARIFY_STEP[kind];
    const base = continuing ? s.thread : [];
    // No user echo on accept — the recommendation card morphs into its own
    // "Accepted" state, which carries the decision. A separate user bubble
    // would be redundant.
    // Spot picks the thread back up with a fresh chain of thought — opens on
    // the generic warmup beat, runDiagnosticThinking streams the rest.
    const pickup: SpotMessage = {
      role: "spot",
      parts: [warmupThought()],
    };
    return {
      open: true,
      maximized: false,
      viewHomeOverride: false,
      clickedCtas: new Set<string>(),
      scope: { kind: "project", label: product.name, target: product.id },
      pendingQuery: null,
      // The analysis lives in the right panel — keep whatever the analyst
      // review already had open, else open it for fresh entries.
      panelFile: "analysis",
      workflow: {
        kind,
        step: openStep,
        productId: product.id,
        productName: product.name,
        startedAt: Date.now(),
        ready: false,
        clarifyAnswers: {},
        planApproved: false,
        // Continuing from an analyst review → keep the Weekly scan in the
        // panel; don't swap to the per-kind audit (one continuous doc).
        fromAnalystReview: continuing,
      },
      thread: [...base, pickup],
    };
  });

  runDiagnosticThinking(set, thinking, openStep);
}

/** Stream the diagnostic's opening chain of thought, then land the analyze
 *  result (the step intro + its CTA) as the next message — same shape as the
 *  analyst-review reveal. Pure timed reveal; flips the workflow `ready` so the
 *  right-pane analysis blooms when the thinking settles. */
function runDiagnosticThinking(
  set: SpotSet,
  thinking: string[],
  firstStep: WorkflowStep,
) {
  const GAP = 980; // ms between thoughts — matches the analyst-review cadence
  // Warmup: hold ~2s on the generic "thinking" beat, then reveal the first
  // real thought. Spot thinks before it knows its reasoning steps.
  setTimeout(() => {
    set((s) => ({
      thread: settleThought(s.thread, "think-warmup", [
        { type: "tool-call", id: "think-0", agent: thinking[0], status: "running" },
      ]),
    }));
  }, THINKING_WARMUP_MS);
  for (let i = 1; i < thinking.length; i++) {
    setTimeout(() => {
      set((s) => ({
        thread: settleThought(s.thread, `think-${i - 1}`, [
          { type: "tool-call", id: `think-${i}`, agent: thinking[i], status: "running" },
        ]),
      }));
    }, THINKING_WARMUP_MS + GAP * i);
  }
  setTimeout(() => {
    set((s) => {
      if (
        !s.workflow ||
        s.workflow.kind === "launch-campaign" ||
        s.workflow.kind === "analyst-review" ||
        s.workflow.kind === "campaign-dive"
      ) {
        return {};
      }
      const wf = s.workflow;
      // Settle the last thought to done (append nothing), then drop the
      // analysis document card + the analyze narration as new messages.
      const settled = settleThought(s.thread, `think-${thinking.length - 1}`, []);
      const intro = stepIntroMessage(firstStep, wf);
      // The analysis is a panel artefact, not a chat card. It opens in the
      // right pane by default (panelFile = "analysis"), so the chat carries
      // only the conversation — recommendation → accept → questions → plan →
      // approve → work. No duplicate downloadable doc card in the thread.
      const tail = [intro].filter(Boolean) as SpotMessage[];
      return {
        workflow: { ...wf, ready: true },
        thread: [...settled, ...tail],
      };
    });
  }, THINKING_WARMUP_MS + GAP * thinking.length);
}

/** A Spot message carrying a single artifact card — the proactive way
 *  Spot surfaces a saved artefact. Clicking Open in the renderer calls
 *  openCanvasFile(file). Carries no gate (P11: gates stay separate). */
function artifactCardMessage(
  file: CanvasFile,
  title: string,
  subtitle: string,
  markdown?: string,
): SpotMessage {
  return { role: "spot", parts: [{ type: "artifact", file, title, subtitle, markdown }] };
}

type SpotSet = (
  fn: (s: PanelState) => Partial<PanelState> | PanelState,
) => void;

/** Flip the currently-running thought (`doneId`) to done and append the next
 *  parts to the LAST spot message — the one holding Spot's thinking trace.
 *  Guarded: if that thought isn't running on the last message (the flow was
 *  replaced before the timer fired), the thread is returned untouched so a
 *  stale timer can't graft an answer onto an unrelated thread. */
function settleThought(
  thread: SpotMessage[],
  doneId: string,
  append: SpotPart[],
): SpotMessage[] {
  const lastIdx = thread.length - 1;
  const last = thread[lastIdx];
  if (!last || last.role !== "spot") return thread;
  const running = last.parts.some(
    (p) => p.type === "tool-call" && p.id === doneId && p.status === "running",
  );
  if (!running) return thread;
  return thread.map((m, i) => {
    if (i !== lastIdx || m.role !== "spot") return m;
    const parts = m.parts.map((p) =>
      p.type === "tool-call" && p.id === doneId
        ? { ...p, status: "done" as const }
        : p,
    );
    return { ...m, parts: [...parts, ...append] };
  });
}

/** How long Spot sits on a generic "thinking" beat before the structured
 *  chain of thought begins. Spot doesn't know its reasoning steps up front —
 *  it has to think first — so every CoT opens with this pause, then the real
 *  thoughts stream in. */
const THINKING_WARMUP_MS = 1800;

/** The seed part every chain of thought starts from: a single running
 *  "thinking" beat. The runners (runSpotThinking / runDiagnosticThinking)
 *  hold on this for THINKING_WARMUP_MS, then settle it into the first real
 *  thought. Seeded by every entry point so the warmup is uniform. */
function warmupThought(): SpotPart {
  return { type: "tool-call", id: "think-warmup", agent: "Working out the approach", status: "running" };
}

/** Drive Spot's chain-of-thought after the Analyst hands off: the first
 *  thought is already seeded as "running"; this reveals the rest one at a
 *  time, then drops Spot's answer in once the last thought settles. The answer
 *  text streams in token-by-token (StreamingText); the action CTA in the same
 *  message is held back by the renderer until that stream finishes, so the
 *  gate never sits under a half-typed sentence. Pure timed reveal — no tool
 *  calls. */
function runSpotThinking(
  set: SpotSet,
  thinking: string[],
  answer: SpotPart[],
) {
  const GAP = 980; // ms between thoughts — reads as deliberate, not laggy
  // Warmup: hold ~2s on the generic "thinking" beat, then reveal the first
  // real thought. Spot thinks before it knows its reasoning steps.
  setTimeout(() => {
    set((s) => ({
      thread: settleThought(s.thread, "think-warmup", [
        { type: "tool-call", id: "think-0", agent: thinking[0], status: "running" },
      ]),
    }));
  }, THINKING_WARMUP_MS);
  for (let i = 1; i < thinking.length; i++) {
    setTimeout(() => {
      set((s) => ({
        thread: settleThought(s.thread, `think-${i - 1}`, [
          { type: "tool-call", id: `think-${i}`, agent: thinking[i], status: "running" },
        ]),
      }));
    }, THINKING_WARMUP_MS + GAP * i);
  }
  setTimeout(() => {
    set((s) => ({
      thread: settleThought(s.thread, `think-${thinking.length - 1}`, answer),
    }));
  }, THINKING_WARMUP_MS + GAP * thinking.length);
}

export const useSpotStore = create<PanelState>((set) => ({
  open: false,
  maximized: false,
  scope: WORKSPACE_SCOPE,
  pendingQuery: null,
  thread: [],
  paletteOpen: false,
  guided: null,
  toast: null,
  workflow: null,
  panelFile: null,
  viewHomeOverride: false,
  clickedCtas: new Set<string>(),
  ctaResolutions: {},
  whatsAppConnected: false,

  askSpot: (query, scope) =>
    set((s) => ({
      open: true,
      scope: scope || s.scope,
      // bump ts even when the same query is repeated so subscribers re-fire
      pendingQuery: { q: query, ts: Date.now() },
    })),

  // Kicks off the launch workflow for an *existing* product. Chat opens
  // with a single conversational line + a "Memory Reader" tool-call.
  // After a beat, Spot resolves the tool-call and drops an artifact card
  // in chat; the user can open the memory panel from there. Mirrors the
  // deep-research pattern but on existing memory.
  startLaunchFlow: (project) => {
    const product = PRODUCTS.find((p) => p.id === project.id);
    const callId = `tc-${Date.now()}`;

    set(() => ({
      open: true,
      maximized: false,
      viewHomeOverride: false,
      clickedCtas: new Set<string>(),
      scope: { kind: "project", label: project.name, target: project.id },
      pendingQuery: null,
      workflow: {
        kind: "launch-campaign",
        step: "kickoff",
        productId: project.id,
        productName: project.name,
        budget: null,
        approvals: { ...EMPTY_APPROVALS },
        startedAt: Date.now(),
        researchedMemory: null,
        kickoffReady: false,
        attachedVoiceAgentId: null,
      },
      thread: [
        {
          role: "spot",
          parts: [
            {
              type: "text",
              text: `Let me pull up what I know about **${project.name}**.`,
            },
            {
              type: "tool-call",
              id: callId,
              agent: "memory.read",
              detail: `loading product file · ${project.name}`,
              status: "running",
            },
          ],
        },
      ],
    }));

    // After the loader, reveal the canvas + drop a short conversational
    // line in chat. No findings dump — the artifact card in thread lets the user open the memory panel on demand.
    setTimeout(() => {
      set((s) => {
        if (!s.workflow || s.workflow.kind !== "launch-campaign") return {};
        const nextWorkflow: LaunchWorkflow = { ...s.workflow, kickoffReady: true };
        const updatedThread = s.thread.map((m) => {
          if (m.role !== "spot") return m;
          return {
            ...m,
            parts: m.parts.map((p) =>
              p.type === "tool-call" && p.id === callId
                ? { ...p, status: "done" as const }
                : p,
            ),
          };
        });
        const summary: SpotMessage = {
          role: "spot",
          parts: [
            {
              type: "text",
              text: product
                ? `Got it. Memory's **${Math.round(product.readiness * 100)}% complete** — ${product.personas.length} personas linked, ${product.memory.length} entries on file.`
                : `Here's what I have on file.`,
            },
            // The "how do you want to start?" choice is NOT inline in the
            // thread — it's docked to the composer (KickoffDock in page.tsx),
            // the same anchored treatment the diagnostic clarify questions get.
          ],
        };
        return {
          workflow: nextWorkflow,
          // Surface the memory in the canvas by default (same as the deep-research
          // kickoff) — deterministic at the source, not effect-dependent.
          panelFile: "memory",
          thread: [
            ...updatedThread,
            artifactCardMessage("memory", "Project details", "Memory Spot has on file."),
            summary,
          ],
        };
      });
    }, 4500);
  },

  // Kicks off the new-product flow. The thread leads with a user
  // bubble ("Let's start working on a new product.") so the
  // conversation reads naturally from the top — Spot's response
  // follows with the running intake tool-call. The inline question
  // card slides into the thread ~1.4s later, after the tool-call
  // resolves.
  startNewProductFlow: () => {
    const callId = `tc-form-${Date.now()}`;
    set(() => ({
      open: true,
      maximized: false,
      viewHomeOverride: false,
      clickedCtas: new Set<string>(),
      scope: { kind: "workspace", label: "New project" },
      pendingQuery: null,
      workflow: {
        kind: "launch-campaign",
        step: "product-setup",
        productId: null,
        productName: "Untitled project",
        budget: null,
        approvals: { ...EMPTY_APPROVALS },
        startedAt: Date.now(),
        researchedMemory: null,
        kickoffReady: true,
        attachedVoiceAgentId: null,
        productSetupStage: "name",
        productSetupAnswers: {},
        productSetupModalOpen: false,
      },
      thread: [
        { role: "user", text: "Let's start working on a new project." },
        {
          role: "spot",
          parts: [
            {
              type: "text",
              text:
                "Got it — spinning up a quick intake. Name, brand URL, and any files you have. " +
                "I'll pull what I can and write the memory.",
            },
            {
              type: "tool-call",
              id: callId,
              agent: "Spot",
              detail: "preparing intake form…",
              status: "running",
            },
          ],
        },
      ],
    }));

    // After the fake delay, resolve the tool-call and open the
    // drawer. The drawer's own mount-effect handles the slide-up.
    setTimeout(() => {
      set((s) => {
        if (!s.workflow || s.workflow.kind !== "launch-campaign") return {};
        const updatedThread = s.thread.map((m) => {
          if (m.role !== "spot") return m;
          return {
            ...m,
            parts: m.parts.map((p) =>
              p.type === "tool-call" && p.id === callId
                ? { ...p, status: "done" as const }
                : p,
            ),
          };
        });
        return {
          workflow: { ...s.workflow, productSetupModalOpen: true },
          thread: updatedThread,
        };
      });
    }, 1400);
  },

  // Modal submit — captures all three inputs at once. Mirrors the
  // input as a single user message, then triggers deep research.
  submitProductSetupForm: (data) => {
    const trimmedName = data.name.trim();
    if (!trimmedName) return;
    const state = useSpotStore.getState();
    const wf = state.workflow;
    if (!wf || wf.kind !== "launch-campaign" || wf.step !== "product-setup") return;

    const url = data.url?.trim() || undefined;
    const files = data.files && data.files.length > 0 ? data.files : undefined;

    const answers: ProductSetupAnswers = {
      name: trimmedName,
      url,
      files: files ?? [],
    };

    // Daily ad spend → a 14-day planning window (amountInr is the total over
    // `days`, matching how PlanFileView's allocator reads budget).
    const daily = data.dailyBudget && data.dailyBudget > 0 ? data.dailyBudget : null;
    const budget: WorkflowBudget | null = daily
      ? { amountInr: daily * 14, days: 14 }
      : wf.budget;

    const nextWorkflow: LaunchWorkflow = {
      ...wf,
      productName: trimmedName,
      productSetupAnswers: answers,
      budget,
      productSetupStage: "ready",
      productSetupModalOpen: false,
    };

    // The question card mirrors each answer as a user message as the
    // user advances — no need to append a combined summary here.
    // Just flip workflow state and let deep research take it from here.
    set(() => ({
      workflow: nextWorkflow,
    }));

    // Kick off deep research after a brief beat.
    setTimeout(() => {
      const cur = useSpotStore.getState();
      if (cur.workflow?.step !== "product-setup") return;
      cur.startDeepResearch(trimmedName, files ?? []);
    }, 600);
  },

  // Chat-driven product-setup Q&A · advances stage by stage. Each call
  // appends the user's answer as a chat message, stores the answer,
  // and either appends Spot's next question or triggers deep research
  // once all fields are captured.
  handleProductSetupAnswer: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const state = useSpotStore.getState();
    const wf = state.workflow;
    if (!wf || wf.kind !== "launch-campaign" || wf.step !== "product-setup") return;

    const stage = wf.productSetupStage ?? "name";
    const answers: ProductSetupAnswers = { ...(wf.productSetupAnswers ?? {}) };
    const userMsg: SpotMessage = { role: "user", text: trimmed };

    // "skip" / "none" treated as explicit "no value" — accepted on
    // optional stages (url, files), rejected on required (name).
    const skipped =
      stage !== "name" && /^(skip|none|no|nope|nada|nothing)\b/i.test(trimmed);

    if (stage === "name") {
      answers.name = trimmed;
      const nextWorkflow: LaunchWorkflow = {
        ...wf,
        productName: trimmed,
        productSetupAnswers: answers,
        productSetupStage: "url",
      };
      const reply: SpotMessage = {
        role: "spot",
        parts: [
          {
            type: "text",
            text: `Got it · **${trimmed}**.\n\nDo you have a brand URL or landing page I can crawl? Paste it here, or type **skip** if you don't have one yet.`,
          },
        ],
      };
      set((s) => ({
        workflow: nextWorkflow,
        thread: [...s.thread, userMsg, reply],
      }));
      return;
    }

    if (stage === "url") {
      if (!skipped) answers.url = trimmed;
      const nextWorkflow: LaunchWorkflow = {
        ...wf,
        productSetupAnswers: answers,
        productSetupStage: "files",
      };
      const acknowledged = skipped
        ? "No URL · that's fine."
        : `Reading **${trimmed}**.`;
      const reply: SpotMessage = {
        role: "spot",
        parts: [
          {
            type: "text",
            text: `${acknowledged}\n\nAnything else worth sharing? Brochures, decks, internal PDFs — drop them in chat with the **Attach** button below, or type **skip** to start research.`,
          },
        ],
      };
      set((s) => ({
        workflow: nextWorkflow,
        thread: [...s.thread, userMsg, reply],
      }));
      return;
    }

    if (stage === "files") {
      // The user is either skipping or saying something like "no, just go".
      const nextWorkflow: LaunchWorkflow = {
        ...wf,
        productSetupAnswers: answers,
        productSetupStage: "ready",
      };
      const reply: SpotMessage = {
        role: "spot",
        parts: [
          {
            type: "text",
            text: `Perfect — starting deep research on **${answers.name}** now.`,
          },
        ],
      };
      set((s) => ({
        workflow: nextWorkflow,
        thread: [...s.thread, userMsg, reply],
      }));
      // Kick off deep research after a brief beat so the reply lands.
      setTimeout(() => {
        const cur = useSpotStore.getState();
        if (cur.workflow?.step !== "product-setup") return;
        cur.startDeepResearch(answers.name ?? "Untitled product", answers.files ?? []);
      }, 700);
      return;
    }
  },

  // Files attached via the composer's Attach button during the files
  // stage. Mirrors as a user message ("📎 Attached · file1.pdf, file2.pdf")
  // and stores the names in the workflow.
  attachProductSetupFiles: (fileNames) => {
    if (fileNames.length === 0) return;
    const state = useSpotStore.getState();
    const wf = state.workflow;
    if (
      !wf ||
      wf.kind !== "launch-campaign" ||
      wf.step !== "product-setup" ||
      wf.productSetupStage !== "files"
    )
      return;

    const answers: ProductSetupAnswers = {
      ...(wf.productSetupAnswers ?? {}),
      files: [...(wf.productSetupAnswers?.files ?? []), ...fileNames],
    };
    const userMsg: SpotMessage = {
      role: "user",
      text: `📎 Attached · ${fileNames.join(", ")}`,
    };
    const reply: SpotMessage = {
      role: "spot",
      parts: [
        {
          type: "text",
          text: `Got ${fileNames.length} file${fileNames.length === 1 ? "" : "s"} · I'll parse ${fileNames.length === 1 ? "it" : "them"} as part of the research. Drop more files or type **skip** to start.`,
        },
      ],
    };
    set((s) => ({
      workflow: { ...wf, productSetupAnswers: answers },
      thread: [...s.thread, userMsg, reply],
    }));
  },

  // The user mentioned a product we don't have on file. Instead of
  // crashing on "no memory found", we kick off a deep-research arc —
  // spawn the Research Agent, show progress on the canvas, then on a
  // delay synthesise the memory and advance to kickoff. From the
  // user's POV it feels like Spot just learned about the product.
  startDeepResearch: (productName, attachedFiles = []) => {
    // The Deep Research Agent crawls, parses, and writes the memory itself —
    // but its sub-agents are surfaced IN THE CHAT as a chain-of-thought trace,
    // not a full-screen canvas. MessageBubble coalesces the adjacent tool-call
    // parts below into one collapsible "Thinking" block; each step ticks
    // running → done over the 14s window. The `detail` is the result that
    // lands when a step completes (blank while it's still running).
    const researchCallId = `tc-research-${Date.now()}`;
    const hasFiles = attachedFiles.length > 0;
    const introText = hasFiles
      ? `On it — dispatching the Deep Research Agent. Crawling the URL, parsing your ${attachedFiles.length} file${attachedFiles.length === 1 ? "" : "s"}, searching the open web, then writing everything to product memory.`
      : `On it — dispatching the Deep Research Agent. Crawling the URL, searching the open web for category signals, then writing everything to product memory.`;

    // Sub-agents, in order. Durations sum to ~14s (the docs step is dropped
    // when nothing was uploaded). Mirrors MEMORY_BUILD_AGENTS in workflow-pane.
    const steps: { agent: string; detail: string; dur: number }[] = [
      { agent: "Crawling the brand site", detail: "about · curriculum · pricing · 47 product entities", dur: 2400 },
      { agent: "Searching the open web for category signals", detail: "12 review sites · 8 forum threads · ₹420 CPL median", dur: 2200 },
      ...(hasFiles
        ? [{ agent: `Reading your ${attachedFiles.length} uploaded file${attachedFiles.length === 1 ? "" : "s"}`, detail: "brochure · 14 pages · 22 positioning phrases", dur: 1800 }]
        : []),
      { agent: "Matching against the Revspot audience graph", detail: "5 cross-product personas · overlap with 2 products", dur: 2100 },
      { agent: "Synthesizing findings into a brief", detail: "tagline · 4 USPs · 3 personas · 3 pricing tiers", dur: 2800 },
      { agent: "Writing brief · personas · pricing · USPs to memory", detail: "committed to project-details.md", dur: 2700 },
    ];

    // Parts of the research message at a given progress index: steps before
    // `current` are done (with their result detail), `current` is running
    // (no detail yet), later steps aren't shown yet.
    const buildParts = (current: number): SpotPart[] => [
      { type: "text", text: introText },
      ...steps.slice(0, current + 1).map((st, idx) => ({
        type: "tool-call" as const,
        id: `${researchCallId}-${idx}`,
        agent: st.agent,
        detail: idx < current ? st.detail : undefined,
        status: (idx < current ? "done" : "running") as "running" | "done",
      })),
    ];

    // Rewrite just the research message's parts in place (located by id prefix).
    const setResearchParts = (parts: SpotPart[]) =>
      set((s) => ({
        thread: s.thread.map((m) =>
          m.role === "spot" &&
          m.parts.some((p) => p.type === "tool-call" && p.id.startsWith(researchCallId))
            ? { ...m, parts }
            : m,
        ),
      }));

    // Carry the daily budget captured during product-setup forward — this
    // rebuilds the workflow object, so without this the figure the user
    // just entered would be silently dropped.
    const prevWf = useSpotStore.getState().workflow;
    const carriedBudget =
      prevWf?.kind === "launch-campaign" ? prevWf.budget : null;
    // Append (not replace) the thread so any prior turn — the user's form
    // submission, intake tool-call, or "launch a campaign for X" prompt —
    // stays visible above the research narration.
    set((s) => ({
      open: true,
      maximized: false,
      viewHomeOverride: false,
      scope: { kind: "workspace", label: productName },
      pendingQuery: null,
      workflow: {
        kind: "launch-campaign",
        step: "deep-research",
        productId: null,
        productName,
        budget: carriedBudget,
        approvals: { ...EMPTY_APPROVALS },
        startedAt: Date.now(),
        researchedMemory: null,
        // kickoffReady stays false through both loader phases so the
        // canvas knows to keep showing the loader (not the memory).
        kickoffReady: false,
        attachedVoiceAgentId: null,
      },
      thread: [
        ...s.thread,
        { role: "spot", parts: buildParts(0) },
      ],
    }));

    // Tick each sub-agent running → done in sequence, so the in-chat
    // chain-of-thought advances node by node. The final step's flip-to-done
    // happens in the 14000ms block below (alongside the kickoff reveal).
    let elapsed = 0;
    for (let i = 1; i < steps.length; i++) {
      elapsed += steps[i - 1].dur;
      setTimeout(() => setResearchParts(buildParts(i)), elapsed);
    }

    // ── Research done · flip to kickoff, reveal memory, ship CTA ──
    // After ~8s, flip the deep-research tool-call to done, transition
    // step to "kickoff" with researchedMemory populated, append the
    // kickoff intro message with the step-cta. The single tool-call
    // does it all — no separate Memory Builder.
    setTimeout(() => {
      set((s) => {
        if (!s.workflow || s.workflow.kind !== "launch-campaign") return {};
        const researched: import("./workflow").ResearchedMemory = {
          tagline: `Two-year JEE Mains + Advanced program for Class 11 students — live doubt-clearing, weekly all-India mocks, and IIT-alum mentors. Memory pre-filled from research; edit any field in chat.`,
          brief: [
            { icon: "📅", label: "Duration", value: "2 years · Class 11 + 12" },
            { icon: "👥", label: "Cohort size", value: "Capped at 60 · live classes" },
            { icon: "📚", label: "Curriculum", value: "Physics · Chemistry · Math (NCERT + advanced)" },
            { icon: "👨‍🏫", label: "Mentors", value: "12 IIT-alum mentors · 1:1 monthly review" },
            { icon: "📝", label: "Mocks", value: "Weekly all-India · ranked against 1.2L+ aspirants" },
            { icon: "🎞️", label: "Access", value: "Recordings + library for 24 months" },
            { icon: "🎯", label: "Outcome", value: "JEE Mains + Advanced preparation" },
          ],
          personas: [
            {
              name: "The Aspiring Engineer Parent",
              meta: "36-48 · Hyderabad, Pune, Bangalore, NCR, Kota · kid in Class 9-12",
              pain: "Offline coaching eats 3-4 hrs of commute; hard to verify if it's working week-on-week",
            },
            {
              name: "The Self-Studier",
              meta: "16-19 · tier-2/3 India · pays via parent's UPI",
              pain: "No quality coaching locally; doubt resolution is the biggest gap when self-studying",
            },
            {
              name: "The Coaching Hopper",
              meta: "16-18 · Kota, Hyderabad, Pune, Delhi · ₹1.2L-2.5L/yr offline now",
              pain: "Class strength of 200+ means no personal attention; commute eats study hours",
            },
          ],
          usps: [
            "Live cohort classes capped at 60 — every doubt answered in-class.",
            "Weekly all-India mocks ranked against 1.2L+ JEE aspirants.",
            "Personal study planner reviewed by an IIT-alum mentor.",
            "Recordings available for 24 months — revise anytime, no time pressure.",
          ],
          avoid: [
            "Don't promise specific ranks or guarantees — flagged by legal.",
            "Avoid name-checking competitors (FIITJEE / Allen / Aakash) — reads as insecure.",
            "No 'best in India' superlatives.",
          ],
          pricing: [
            { name: "2-year cohort", cost: "₹65,000", cadence: "one-shot", badge: "Most picked" },
            { name: "2-year · EMI", cost: "₹5,950", cadence: "/month · 12 months" },
            { name: "1-year intensive", cost: "₹38,000", cadence: "one-shot" },
          ],
          offers: [
            { label: "Early-bird · 12% off", meta: "till May 31" },
            { label: "Sibling discount · 8%", meta: "stackable" },
            { label: "100% refund · first 14 days", meta: "no questions" },
          ],
          sources: [
            ...(attachedFiles.length > 0
              ? attachedFiles.slice(0, 3).map((n) => `Your upload · ${n}`)
              : []),
            ...(attachedFiles.length > 3
              ? [`Your uploads · +${attachedFiles.length - 3} more file${attachedFiles.length - 3 === 1 ? "" : "s"}`]
              : []),
            "Brand site · /about, /curriculum, /pricing",
            "Category research · top-of-funnel keyword landscape",
            "Open web · category review sites, parent forums",
            "Revspot audience graph · cross-product persona overlap",
          ],
        };
        const nextWorkflow: LaunchWorkflow = {
          ...s.workflow,
          step: "kickoff",
          researchedMemory: researched,
          kickoffReady: true,
        };
        // Settle every research sub-agent to done (with its result detail) +
        // append the kickoff intro with the step-cta. The chain-of-thought
        // collapses to its quiet one-line summary once nothing's running.
        const settledParts = buildParts(steps.length);
        const updatedThread = s.thread.map((m) => {
          if (
            m.role !== "spot" ||
            !m.parts.some(
              (p) => p.type === "tool-call" && p.id.startsWith(researchCallId),
            )
          )
            return m;
          return { ...m, parts: settledParts };
        });
        const kickoff: SpotMessage = {
          role: "spot",
          parts: [
            {
              type: "text",
              text: `I've drafted what I'd lead with and what to avoid. From here you can pull in your existing campaigns to analyse them, or have me draft a fresh execution plan.`,
            },
            // Choice is docked to the composer (KickoffDock), not inline.
          ],
        };
        return {
          workflow: nextWorkflow,
          // Open the freshly-built memory in the canvas by default. Set here at
          // the source so it's deterministic — the page-level auto-open effect is
          // a fallback, but the research → kickoff transition must never depend on
          // effect timing or a remount to surface the artifact.
          panelFile: "memory",
          thread: [
            ...updatedThread,
            artifactCardMessage("memory", "Project details", "Brief · personas · pricing · USPs"),
            kickoff,
          ],
        };
      });
    }, 14000); // Deliberately slower so each loader stage gets to breathe
  },

  // Diagnostic workflows — Scale, Optimize, Test-Angles. They all share
  // the same shape, so a helper builds the initial state. The chat opens
  // with a "what I'm about to do" line + a running tool-call for the
  // first step. Once the tool-call resolves, Spot drops an artifact card
  // for the analysis and the first step CTA.
  startScaleFlow: (product) => {
    startDiagnostic(set, "scale", product, "scale-analyze", {
      headline: `Scaling ${product.name}.`,
      intro:
        "Let me pull up what I know about this project first — recent winners, audience headroom, where money's underspent. I'll lay it out, and then we'll talk about goals.",
    });
  },
  startOptimizeFlow: (product) => {
    startDiagnostic(set, "optimize", product, "opt-analyze", {
      headline: `Optimizing ${product.name}.`,
      intro:
        "First, the analysis — I'll show you what's broken and *why* (creative fatigue, sentiment, competitor moves, landing pages). Then we'll set the priority together.",
    });
  },
  startTestAnglesFlow: (product) => {
    startDiagnostic(set, "test-angles", product, "ang-analyze", {
      headline: `Testing new angles · ${product.name}.`,
      intro:
        "Auditing last 30 days of creative first — winners, losers, the pattern underneath. Then we'll set focus + budget for the test.",
    });
  },

  startAnalystReview: (product) => {
    const prod = PRODUCTS.find((p) => p.id === product.id);
    if (!prod) return;
    const conv = analystReportFor(prod);
    const thread: SpotMessage[] = [
      // The Analyst Agent kicks off the conversation — its finding lives in a
      // container that marks it as the Analyst (not Spot).
      {
        role: "spot",
        parts: [{ type: "analyst-report", productId: product.id }],
      },
      // Spot takes over: it reads the report and thinks before answering.
      // Seed the warmup beat; runSpotThinking holds ~2s then streams the
      // chain of thought and drops in the reasoning + Accept gate.
      {
        role: "spot",
        parts: [warmupThought()],
      },
    ];
    // The answer Spot lands on once it's done thinking.
    runSpotThinking(set, conv.thinking, [
      { type: "text", text: conv.reasoning },
      {
        type: "analyst-cta",
        flow: conv.flow,
        productId: product.id,
        productName: product.name,
        label: conv.action,
      },
    ]);
    set(() => ({
      open: true,
      maximized: false,
      viewHomeOverride: false,
      clickedCtas: new Set<string>(),
      scope: { kind: "project", label: product.name, target: product.id },
      pendingQuery: null,
      // Open the report in the Analysis panel by default — the opener says
      // "full report's on the right", so the canvas should already be there.
      panelFile: "analysis",
      workflow: {
        kind: "analyst-review",
        step: "campaign-dive",
        productId: product.id,
        productName: product.name,
        recommendedFlow: conv.flow,
        recommendedLabel: conv.action,
        startedAt: Date.now(),
      },
      thread,
    }));
  },

  rejectRecommendation: ({ productName }) => {
    // Reject mirrors Accept: same continuous session, same think → chain of
    // thought → next thing rhythm. Spot acknowledges the pass, reasons through
    // it, then leaves it open for the user to say what they want next.
    const thinking = [
      "Noting you've passed on this plan",
      "Setting the recommendation aside",
      "Leaving the campaign exactly where it is",
    ];
    const answer: SpotPart[] = [
      {
        type: "text",
        text:
          `No problem, I'll leave **${productName}** exactly as it is. Nothing's changed.\n\n` +
          `Tell me what you have in mind and we'll take it from there.`,
      },
    ];
    set((s) => ({
      open: true,
      thread: [
        ...s.thread,
        {
          role: "spot",
          parts: [warmupThought()],
        },
      ],
    }));
    runSpotThinking(set, thinking, answer);
  },

  rejectStep: () => {
    const thinking = [
      "Noting you'd rather not move ahead just yet",
      "Holding everything exactly where it is",
      "Thinking about what you'd want instead",
    ];
    const answer: SpotPart[] = [
      {
        type: "text",
        text:
          "No problem, I'll hold here. Nothing's moved.\n\n" +
          "Tell me what you'd like to change, or we can pick this back up whenever you're ready.",
      },
    ];
    set((s) => ({
      open: true,
      thread: [
        ...s.thread,
        { role: "user", text: "Hold on — not yet." },
        {
          role: "spot",
          parts: [warmupThought()],
        },
      ],
    }));
    runSpotThinking(set, thinking, answer);
  },

  startCampaignDive: (entity) => {
    // Open the chat + canvas split-screen with the campaign in focus.
    // The chat seeds with a short framing message so the user can start
    // asking immediately ("why is CPL up?", "should I pause this?").
    set(() => ({
      open: true,
      maximized: false,
      viewHomeOverride: false,
      scope: {
        kind: "campaign",
        label: entity.name,
        target: entity.id,
      },
      pendingQuery: null,
      workflow: {
        kind: "campaign-dive",
        step: "campaign-dive",
        productId: entity.productId,
        productName: entity.productName,
        entityId: entity.id,
        entityName: entity.name,
        entityTier: entity.tier,
        channel: entity.channel,
        metaUrl: entity.metaUrl,
        startedAt: Date.now(),
      },
      thread: [
        {
          role: "spot",
          parts: [
            {
              type: "text",
              text: `Pulling up **${entity.name}** now. Ask me anything — why a metric moved, whether to pause, what to scale — or use the quick actions on the canvas.`,
            },
          ],
        },
      ],
    }));
  },

  advanceWorkflow: (narration, forcedNext) =>
    set((s) => {
      if (!s.workflow) return {};
      const upcoming = forcedNext ?? nextStepFor(s.workflow.kind, s.workflow.step);
      // The terminal `done` step carries a legacy launch tool-call
      // ("deploy.push · pushing to Meta + WhatsApp…"). Diagnostic flows
      // (scale / optimize / test-angles) already deployed at their *-live
      // step, so re-running a Meta+WhatsApp push on `done` reads as a
      // second, incoherent deploy. Suppress it for diagnostic kinds — the
      // done intro lands synchronously instead.
      const isDiagnostic =
        s.workflow.kind === "scale" ||
        s.workflow.kind === "optimize" ||
        s.workflow.kind === "test-angles";
      const tc =
        upcoming === "done" && isDiagnostic ? undefined : STEP_TOOL_CALL[upcoming];
      const callId = `tc-${Date.now()}`;
      // Flip the workflow step IMMEDIATELY so the workflow canvas advances
      // to the next step (which renders a loader while the tool-call
      // narrates in chat). Then after the fake delay, flip the
      // tool-call to done + append the step's intro message.
      const appended: SpotMessage[] = [];
      if (narration) {
        appended.push({ role: "spot", parts: [{ type: "text", text: narration }] });
      }

      const nextWorkflow: SpotWorkflow = (() => {
        if (s.workflow.kind === "launch-campaign") {
          const current = s.workflow.approvals;
          let approvals = current;
          // Pre-select sensible defaults so the user sees selected state
          // immediately on entering a step (clearer than "0 selected").
          if (upcoming === "personas" && current.personaIds.length === 0) {
            // Import lazily to avoid a circular ref at module top-level.
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { LAUNCH_PERSONAS } = require("./workflow") as typeof import("./workflow");
            const existing = LAUNCH_PERSONAS.filter(
              (p: { origin: string }) => p.origin === "existing",
            ).map((p: { id: string }) => p.id);
            approvals = { ...current, personaIds: existing };
          }
          return { ...s.workflow, step: upcoming, approvals };
        }
        // Single-step flows — no advancement state to track.
        if (
          s.workflow.kind === "campaign-dive" ||
          s.workflow.kind === "analyst-review"
        ) {
          return { ...s.workflow, step: upcoming };
        }
        // Diagnostic flows — when advancing from `plan` to `live`,
        // flip planApproved so the live canvas knows the user signed
        // off (drives the dashboard recommendation feed).
        const planApproved = upcoming.endsWith("-live") ? true : s.workflow.planApproved;
        // Reset `ready` on EVERY diagnostic step transition so the
        // dark Spot loader runs through each phase (analyze →
        // clarify → plan → live). Without this, the loader only
        // fires on the first step and subsequent phases land cold.
        const ready = false;
        return { ...s.workflow, step: upcoming, planApproved, ready };
      })();

      // ── launch-building · the build experience ───────────────────
      // Instead of a single opaque spinner, render: the headline + a
      // ticking 5-task todo list (exec-checklist part), with the "thinking"
      // tool-call narration BELOW it. startLaunchBuild crosses each task
      // off on a timer; when all 5 finish it flips the thinking call to
      // done, posts the build-complete message, and opens the deliverables
      // canvas (all the assets Spot produced). No forced auto-advance —
      // the user reviews the deliverables, then approves to deploy.
      if (upcoming === "launch-building" && nextWorkflow.kind === "launch-campaign") {
        const moves = launchBuildMoves();
        const buildWorkflow: SpotWorkflow = {
          ...nextWorkflow,
          executionMoves: moves,
          executionDone: false,
        };
        const intro = stepIntroMessage(upcoming, buildWorkflow);
        const introParts: SpotPart[] =
          intro && intro.role === "spot" ? [...intro.parts] : [];
        // Headline + text, then the live build checklist directly under it.
        const checklistMsg: SpotMessage = {
          role: "spot",
          parts: [...introParts, { type: "exec-checklist" }],
        };
        // "Thinking" narration sits BELOW the checklist.
        const thinkingMsg: SpotMessage = {
          role: "spot",
          parts: [
            {
              type: "tool-call",
              id: callId,
              agent: tc?.agent ?? "Building your campaign",
              detail: tc?.detail ?? "",
              status: "running",
            },
          ],
        };
        // Kick off the ticker on the next tick (after this set commits).
        setTimeout(() => {
          useSpotStore.getState().startLaunchBuild(callId);
        }, 0);
        return {
          workflow: buildWorkflow,
          thread: [...s.thread, ...appended, checklistMsg, thinkingMsg],
        };
      }

      // ── launch-deploy · publish-to-Meta, IN CHAT ─────────────────
      // Same inline treatment as launch-building — render the deploy
      // checklist as a ticking todo in the thread (exec-checklist part)
      // with the "publishing" narration below it. No full-screen
      // takeover: the publish runs in chat and Spot posts the "live"
      // summary right here when it finishes. startLaunchDeploy drives it.
      if (upcoming === "launch-deploy" && nextWorkflow.kind === "launch-campaign") {
        const moves = launchDeployMoves();
        const deployWorkflow: SpotWorkflow = {
          ...nextWorkflow,
          executionMoves: moves,
          executionDone: false,
        };
        const intro = stepIntroMessage(upcoming, deployWorkflow);
        const introParts: SpotPart[] =
          intro && intro.role === "spot" ? [...intro.parts] : [];
        const checklistMsg: SpotMessage = {
          role: "spot",
          parts: [...introParts, { type: "exec-checklist" }],
        };
        const thinkingMsg: SpotMessage = {
          role: "spot",
          parts: [
            {
              type: "tool-call",
              id: callId,
              agent: tc?.agent ?? "Publishing everything live",
              detail: tc?.detail ?? "",
              status: "running",
            },
          ],
        };
        setTimeout(() => {
          useSpotStore.getState().startLaunchDeploy(callId);
        }, 0);
        return {
          workflow: deployWorkflow,
          thread: [...s.thread, ...appended, checklistMsg, thinkingMsg],
        };
      }

      if (tc) {
        appended.push({
          role: "spot",
          parts: [
            {
              type: "tool-call",
              id: callId,
              agent: tc.agent,
              detail: tc.detail,
              status: "running",
            },
          ],
        });

        // Stay in the chat panel on launch-building — the new
        // "Spot is working" drawer lives inline in the thread and
        // gives the user View memory / Spot homepage actions. No
        // forced redirect to the homepage anymore.
        const extraSetterPayload: Partial<PanelState> = {};

        // After the fake delay, flip the tool-call to done + append the
        // step intro. Step itself already advanced.
        setTimeout(() => {
          set((s2) => {
            if (!s2.workflow) return {};
            const intro = stepIntroMessage(upcoming, s2.workflow);
            const updatedThread = s2.thread.map((m) => {
              if (m.role !== "spot") return m;
              return {
                ...m,
                parts: m.parts.map((p) =>
                  p.type === "tool-call" && p.id === callId
                    ? { ...p, status: "done" as const }
                    : p,
                ),
              };
            });
            // When Spot finishes writing the execution plan, surface it as a
            // floating artifact card right after the intro — the spinner that
            // just resolved (spot.plan · "folding your picks into the
            // execution plan…") was the create-the-document CoT; the card is
            // the saved result, downloadable as plan.md and click-to-open.
            // Diagnostic plan steps AND the launch flow's launch-plan step
            // all close on a written execution plan — surface it as a card
            // (above the CTA) and force the canvas to the plan so the user
            // SEES the plan they're about to execute without an extra click.
            const planSteps = ["scale-plan", "opt-plan", "ang-plan", "launch-plan"];
            const isPlanStep = planSteps.includes(upcoming);
            // The launch flow's launch-strategy step closes on a written
            // strategy.md — same treatment as the plan steps: surface it as a
            // card (above the CTA) and force the canvas to the strategy so the
            // user SEES the strategy they're approving without an extra click.
            const isStrategyStep =
              upcoming === "launch-strategy" &&
              s2.workflow.kind === "launch-campaign";
            // The plan.md document must match the plan the canvas renders.
            // Diagnostic flows read their per-kind WorkflowPlan; the launch
            // flow reads the shared launch-plan markdown (same as PlanFileView).
            const planMd = !isPlanStep
              ? undefined
              : s2.workflow.kind === "scale" ||
                  s2.workflow.kind === "optimize" ||
                  s2.workflow.kind === "test-angles"
                ? planMarkdownFor(s2.workflow.kind, s2.workflow.productName)
                : s2.workflow.kind === "launch-campaign"
                  ? buildLaunchPlanMd(s2.workflow.productName)
                  : undefined;
            // A single card per card-step — plan card for plan steps, strategy
            // card for the strategy step.
            const stepCard: SpotMessage | null = isPlanStep
              ? artifactCardMessage(
                  "plan",
                  "Execution plan",
                  "Full plan · Markdown",
                  planMd,
                )
              : isStrategyStep
                ? artifactCardMessage(
                    "strategy",
                    "Campaign strategy",
                    "Personas · angles · targeting · CPQL",
                    buildLaunchStrategyMd(s2.workflow.productName),
                  )
                : null;
            const isCardStep = isPlanStep || isStrategyStep;
            // Card steps: the intro message bundles [text, step-cta]. The
            // user wants the artifact card to sit ABOVE the CTA, so split the
            // intro — text first, then the card, then the step-cta — to land
            // the chat order [intro text] → [card] → [CTA].
            let finalThread: SpotMessage[];
            if (isCardStep && intro && intro.role === "spot" && stepCard) {
              const textParts = intro.parts.filter((p) => p.type !== "step-cta");
              const ctaParts = intro.parts.filter((p) => p.type === "step-cta");
              const introText: SpotMessage[] = textParts.length
                ? [{ role: "spot", parts: textParts }]
                : [];
              const introCta: SpotMessage[] = ctaParts.length
                ? [{ role: "spot", parts: ctaParts }]
                : [];
              finalThread = [
                ...updatedThread,
                ...introText,
                stepCard,
                ...introCta,
              ];
            } else {
              finalThread = intro
                ? [...updatedThread, intro, ...(stepCard ? [stepCard] : [])]
                : [...updatedThread, ...(stepCard ? [stepCard] : [])];
            }
            // Diagnostic plan/live steps gate canvas reveal on `ready`.
            // When the tool-call resolves we flip ready=true so the
            // canvas blooms into the plan / live state.
            const workflow =
              s2.workflow.kind !== "launch-campaign"
                ? { ...s2.workflow, ready: true }
                : s2.workflow;
            // When the card is created, force the right panel to open the
            // matching file REGARDLESS of what was open — the user wants to
            // see the strategy/plan they're about to approve without an extra
            // click.
            const panelPatch: Partial<PanelState> = isPlanStep
              ? { panelFile: "plan" }
              : isStrategyStep
                ? { panelFile: "strategy" }
                : {};
            return { thread: finalThread, workflow, ...panelPatch };
          });

          // launch-building auto-advances to launch-review once the
          // build tool-call resolves. Without this, a user who clicks
          // "Back to Spot homepage" mid-build would see the parked
          // banner stuck at "Spot is working · ETA ~2 hrs" forever.
          // With this, the homepage banner naturally switches to the
          // green "Ready to review · Review & approve" state when the
          // build finishes, and the canvas swaps to LaunchReviewStep.
          if (upcoming === "launch-building") {
            setTimeout(() => {
              const store = useSpotStore.getState();
              if (store.workflow && store.workflow.step === "launch-building") {
                store.advanceWorkflow();
              }
            }, 600);
          }

          // launch-deploy no longer routes through this generic tool-call
          // path — it returns early above with an inline exec-checklist
          // (startLaunchDeploy) that ticks in chat and posts the "live"
          // summary there. No full-screen takeover, no forced advance.

          // Diagnostic *-live step: once the deploy.push tool-call resolves
          // and the live intro has landed, swap the right panel from plan.md
          // to the live-execution canvas and kick off the ticking checklist.
          const liveSteps = ["scale-live", "opt-live", "ang-live"];
          if (liveSteps.includes(upcoming)) {
            useSpotStore.getState().startLiveExecution();
          }
        }, tc.delayMs);
        return {
          workflow: nextWorkflow,
          thread: [...s.thread, ...appended],
          ...extraSetterPayload,
        };
      }

      // No tool call configured for this transition — advance synchronously.
      const intro = stepIntroMessage(upcoming, nextWorkflow);
      if (intro) appended.push(intro);
      return { workflow: nextWorkflow, thread: [...s.thread, ...appended] };
    }),

  startLiveExecution: () => {
    const s = useSpotStore.getState();
    const wf = s.workflow;
    if (
      !wf ||
      (wf.kind !== "scale" && wf.kind !== "optimize" && wf.kind !== "test-angles")
    ) {
      return;
    }
    // Seed the checklist (all pending). The panel intentionally stays on the
    // approved plan.md — approving does NOT open a separate execution file
    // (removed for all three kinds: scale / optimize / test-angles). Execution
    // progress is surfaced in the chat thread, not as a new canvas file.
    const moves = executionMovesFor(wf.kind);
    const isDiag = (w: SpotWorkflow | null): w is DiagnosticWorkflow =>
      !!w && (w.kind === "scale" || w.kind === "optimize" || w.kind === "test-angles");
    set((st) => {
      if (!isDiag(st.workflow)) return {};
      return {
        workflow: { ...st.workflow, executionMoves: moves, executionDone: false },
      };
    });

    // Tick the moves off one at a time: mark running, then done, on an
    // interval, so the user watches the plan execute live. Deliberately
    // unhurried (~2.8s per move) — the work should feel like it's actually
    // happening, not snapping done.
    const perMoveMs = 2800;
    const runDelayMs = 700;
    const kind = wf.kind;
    const productName = wf.productName;
    moves.forEach((_, i) => {
      // running
      setTimeout(() => {
        useSpotStore.setState((st) => {
          if (!isDiag(st.workflow)) return {};
          const cur = st.workflow.executionMoves;
          if (!cur) return {};
          const next = cur.map((m, j) =>
            j === i ? { ...m, status: "running" as const } : m,
          );
          return { workflow: { ...st.workflow, executionMoves: next } };
        });
      }, perMoveMs * i + runDelayMs);
      // done
      setTimeout(() => {
        useSpotStore.setState((st) => {
          if (!isDiag(st.workflow)) return {};
          const cur = st.workflow.executionMoves;
          if (!cur) return {};
          const next = cur.map((m, j) =>
            j === i ? { ...m, status: "done" as const } : m,
          );
          const allDone = next.every((m) => m.status === "done");
          return {
            workflow: { ...st.workflow, executionMoves: next, executionDone: allDone },
          };
        });
      }, perMoveMs * (i + 1));
    });

    // After the last move lands, the plan is done and the product goes
    // under watch (Flow 3, Phase A). Play that hand-off out IN THE CHAT:
    //   beat 1 — "watching now" confirmation (right after the checklist).
    //   beat 2 — the first 🔔 watcher nudge: a read + a question for the
    //            user. The question is a fresh chat message; the ticked-off
    //            tasks stay above it. Spot never acts off its own nudge.
    const allDoneAt = perMoveMs * moves.length;
    // Guard each append: only fire if the user is still on this same live
    // execution (no navigation / reset / re-drive in the meantime).
    const stillLive = (w: SpotWorkflow | null): w is DiagnosticWorkflow =>
      isDiag(w) && w.kind === kind && Boolean(w.executionDone);
    setTimeout(() => {
      const st = useSpotStore.getState();
      if (!stillLive(st.workflow)) return;
      useSpotStore.setState((s) => ({
        thread: [...s.thread, watchHandoffMessage(kind, productName)],
      }));
    }, allDoneAt + 1400);
    setTimeout(() => {
      const st = useSpotStore.getState();
      if (!stillLive(st.workflow)) return;
      // The watcher trips: append Spot's read + the report card, and pop the
      // watch-review.md write-up open in the side panel at the same time.
      useSpotStore.setState((s) => ({
        thread: [...s.thread, firstNudgeMessage(kind, productName)],
        panelFile: "watch-review",
      }));
    }, allDoneAt + 6200);
  },

  startLaunchBuild: (callId) => {
    const isLaunch = (w: SpotWorkflow | null): w is LaunchWorkflow =>
      !!w && w.kind === "launch-campaign";
    const wf = useSpotStore.getState().workflow;
    if (!isLaunch(wf)) return;
    const productName = wf.productName;
    const moves = wf.executionMoves ?? launchBuildMoves();
    // Make sure the checklist is seeded (idempotent if advanceWorkflow
    // already set it).
    set((st) =>
      isLaunch(st.workflow)
        ? {
            workflow: {
              ...st.workflow,
              executionMoves: moves,
              executionDone: false,
            },
          }
        : {},
    );

    // Tick each task: running, then done. ~3.6s per task ≈ 18s end-to-end,
    // matching the build narration. Deliberately unhurried so the work
    // reads as actually happening.
    const perMoveMs = 3600;
    const runDelayMs = 700;
    moves.forEach((_, i) => {
      // running
      setTimeout(() => {
        useSpotStore.setState((st) => {
          if (!isLaunch(st.workflow) || !st.workflow.executionMoves) return {};
          const next = st.workflow.executionMoves.map((m, j) =>
            j === i ? { ...m, status: "running" as const } : m,
          );
          return { workflow: { ...st.workflow, executionMoves: next } };
        });
      }, perMoveMs * i + runDelayMs);
      // done
      setTimeout(() => {
        useSpotStore.setState((st) => {
          if (!isLaunch(st.workflow) || !st.workflow.executionMoves) return {};
          const next = st.workflow.executionMoves.map((m, j) =>
            j === i ? { ...m, status: "done" as const } : m,
          );
          const allDone = next.every((m) => m.status === "done");
          return {
            workflow: { ...st.workflow, executionMoves: next, executionDone: allDone },
          };
        });
      }, perMoveMs * (i + 1));
    });

    // Once the last task crosses off: flip the thinking tool-call to done,
    // post Spot's build-complete message (with the review-and-deploy CTA),
    // and open the deliverables canvas — the full asset pack Spot produced.
    setTimeout(() => {
      const st = useSpotStore.getState();
      if (!isLaunch(st.workflow) || !st.workflow.executionDone) return;
      const completeMsg: SpotMessage = {
        role: "spot",
        parts: [
          {
            type: "headline",
            text: `Done — all 5 tasks complete for ${productName}.`,
            verdict: "ok",
          },
          {
            type: "text",
            text:
              "Everything's built: creatives per persona, lead forms, landing pages, the full campaign structure, CRM wiring, and the Pre-Sales Agent (Voice + WhatsApp). Opening the deliverables on the right for your review now.",
          },
        ],
      };
      useSpotStore.setState((s) => {
        const updatedThread = s.thread.map((m) => {
          if (m.role !== "spot") return m;
          return {
            ...m,
            parts: m.parts.map((p) =>
              p.type === "tool-call" && p.id === callId
                ? { ...p, status: "done" as const }
                : p,
            ),
          };
        });
        return {
          thread: [...updatedThread, completeMsg],
          panelFile: "deliverables",
        };
      });
      // Auto-flow into the single review + deploy gate (launch-review).
      // The build-complete message above is informational only — it no
      // longer carries a deploy CTA, so the user is asked to "deploy live"
      // exactly once, at the launch-review gate.
      setTimeout(() => {
        const s2 = useSpotStore.getState();
        if (isLaunch(s2.workflow) && s2.workflow.step === "launch-building") {
          s2.advanceWorkflow(undefined, "launch-review");
        }
      }, 700);
    }, perMoveMs * moves.length + 400);
  },

  startLaunchDeploy: (callId) => {
    const isLaunch = (w: SpotWorkflow | null): w is LaunchWorkflow =>
      !!w && w.kind === "launch-campaign";
    const wf = useSpotStore.getState().workflow;
    if (!isLaunch(wf)) return;
    const productName = wf.productName;
    const moves = wf.executionMoves ?? launchDeployMoves();
    set((st) =>
      isLaunch(st.workflow)
        ? {
            workflow: {
              ...st.workflow,
              executionMoves: moves,
              executionDone: false,
            },
          }
        : {},
    );

    // Deploy ticks faster than the build — this is publishing, not
    // authoring. ~1.3s per task × 7 ≈ 9s end-to-end.
    const perMoveMs = 1300;
    const runDelayMs = 500;
    moves.forEach((_, i) => {
      setTimeout(() => {
        useSpotStore.setState((st) => {
          if (!isLaunch(st.workflow) || !st.workflow.executionMoves) return {};
          const next = st.workflow.executionMoves.map((m, j) =>
            j === i ? { ...m, status: "running" as const } : m,
          );
          return { workflow: { ...st.workflow, executionMoves: next } };
        });
      }, perMoveMs * i + runDelayMs);
      setTimeout(() => {
        useSpotStore.setState((st) => {
          if (!isLaunch(st.workflow) || !st.workflow.executionMoves) return {};
          const next = st.workflow.executionMoves.map((m, j) =>
            j === i ? { ...m, status: "done" as const } : m,
          );
          const allDone = next.every((m) => m.status === "done");
          return {
            workflow: { ...st.workflow, executionMoves: next, executionDone: allDone },
          };
        });
      }, perMoveMs * (i + 1));
    });

    // Last task crosses off: flip the "publishing" tool-call to done and
    // post the "live" summary IN CHAT. No takeover, no forced advance —
    // the flow ends right here in the thread.
    setTimeout(() => {
      const st = useSpotStore.getState();
      if (!isLaunch(st.workflow) || !st.workflow.executionDone) return;
      const liveMsg: SpotMessage = {
        role: "spot",
        parts: [
          {
            type: "headline",
            text: `${productName} is live.`,
            verdict: "ok",
          },
          {
            type: "text",
            text:
              "Everything's published to Meta + WhatsApp — both campaigns, every ad set, the landing pages, lead forms, the Meta pixel + Conversions API, and the Pre-Sales Agent (Voice + WhatsApp). The watchers are armed on CPL, sentiment, and frequency. I'll report back here the moment the first data lands.",
          },
        ],
      };
      useSpotStore.setState((s) => {
        const updatedThread = s.thread.map((m) => {
          if (m.role !== "spot") return m;
          return {
            ...m,
            parts: m.parts.map((p) =>
              p.type === "tool-call" && p.id === callId
                ? { ...p, status: "done" as const }
                : p,
            ),
          };
        });
        return { thread: [...updatedThread, liveMsg] };
      });
    }, perMoveMs * moves.length + 400);
  },

  startImportCampaigns: () =>
    set((s) => {
      if (!s.workflow || s.workflow.kind !== "launch-campaign") return {};
      const intro: SpotMessage = {
        role: "spot",
        parts: [
          {
            type: "text",
            text: "Let's bring in your existing campaigns.",
          },
          { type: "import-picker" },
        ],
      };
      return {
        workflow: {
          ...s.workflow,
          // Keep the step on kickoff — the picker lives inline in the chat
          // (left panel), and the canvas stays on memory.md. importStage
          // drives the inline import-picker part.
          importStage: "select-account",
          importAdAccountId: null,
          selectedImportCampaignIds: [],
          importedCampaignIds: [],
        },
        thread: [...s.thread, intro],
      };
    }),

  selectImportAdAccount: (accountId) =>
    set((s) => {
      if (!s.workflow || s.workflow.kind !== "launch-campaign") return {};
      // The inline import-picker re-renders to the campaign list; it's
      // self-describing, so no extra chat narration is appended here.
      const all = campaignsForAccount(accountId).map((c) => c.id);
      return {
        workflow: {
          ...s.workflow,
          importStage: "select-campaigns",
          importAdAccountId: accountId,
          selectedImportCampaignIds: all,
        },
      };
    }),

  backToImportAccounts: () =>
    set((s) => {
      if (!s.workflow || s.workflow.kind !== "launch-campaign") return {};
      return {
        workflow: {
          ...s.workflow,
          importStage: "select-account",
          importAdAccountId: null,
          selectedImportCampaignIds: [],
        },
      };
    }),

  toggleImportCampaign: (id) =>
    set((s) => {
      if (!s.workflow || s.workflow.kind !== "launch-campaign") return {};
      const cur = s.workflow.selectedImportCampaignIds ?? [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { workflow: { ...s.workflow, selectedImportCampaignIds: next } };
    }),

  setImportSelection: (ids) =>
    set((s) =>
      s.workflow && s.workflow.kind === "launch-campaign"
        ? { workflow: { ...s.workflow, selectedImportCampaignIds: ids } }
        : {},
    ),

  confirmImportCampaigns: () =>
    set((s) => {
      if (!s.workflow || s.workflow.kind !== "launch-campaign") return {};
      const ids = s.workflow.selectedImportCampaignIds ?? [];
      if (ids.length === 0) return {};
      // The inline import-picker re-renders to a rich success summary
      // (count + spend/leads/CPL + the imported list). The chat just
      // offers the next step.
      const msg: SpotMessage = {
        role: "spot",
        parts: [
          {
            type: "choice",
            prompt: "What would you like to do next?",
            options: [
              {
                label: "Launch new campaigns",
                helper: "Draft a fresh execution plan with Spot",
                action: "launch-after-import",
                icon: "rocket",
                variant: "primary",
              },
              {
                label: "Analyse campaign performance",
                helper: "Open Campaigns with Spot's take on each",
                action: "analyse-performance",
                icon: "chart",
                variant: "secondary",
              },
            ],
          },
        ],
      };
      return {
        workflow: { ...s.workflow, importStage: "imported", importedCampaignIds: ids },
        thread: [...s.thread, msg],
      };
    }),

  startImportReview: () =>
    set((s) => {
      if (!s.workflow || s.workflow.kind !== "launch-campaign") return {};
      const w = s.workflow;
      const campaignIds = w.importedCampaignIds ?? [];
      if (campaignIds.length === 0) return {};
      const accountId = w.importAdAccountId ?? "";
      const review = importedReviewFor(campaignIds, accountId, w.productName);
      // New products carry productId: null — give the downstream diagnostic a
      // stable synthetic id (the analysis canvas is keyed by flow kind, not by
      // a PRODUCTS lookup, so any string is safe).
      const productId = w.productId ?? "imported";
      const thread: SpotMessage[] = [
        {
          role: "spot",
          parts: [
            { type: "import-report", campaignIds, accountId, productName: w.productName },
          ],
        },
        // Spot takes over and thinks through the imported set before answering.
        {
          role: "spot",
          parts: [warmupThought()],
        },
      ];
      runSpotThinking(set, review.thinking, [
        { type: "text", text: review.reasoning },
        {
          type: "analyst-cta",
          flow: review.flow,
          productId,
          productName: w.productName,
          label: review.action,
        },
      ]);
      return {
        clickedCtas: new Set<string>(),
        workflow: {
          kind: "analyst-review",
          step: "campaign-dive",
          productId,
          productName: w.productName,
          recommendedFlow: review.flow,
          recommendedLabel: review.action,
          startedAt: Date.now(),
        },
        thread,
      };
    }),

  gotoStep: (step) =>
    set((s) => (s.workflow ? { workflow: { ...s.workflow, step } } : {})),

  setWorkflowBudget: (b) =>
    set((s) =>
      s.workflow && s.workflow.kind === "launch-campaign"
        ? { workflow: { ...s.workflow, budget: b } }
        : {},
    ),

  toggleWorkflowApproval: (group, id) =>
    set((s) => {
      if (!s.workflow || s.workflow.kind !== "launch-campaign") return {};
      const current = s.workflow.approvals[group];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      return {
        workflow: {
          ...s.workflow,
          approvals: { ...s.workflow.approvals, [group]: next },
        },
      };
    }),

  setClarifyAnswer: (questionId, value) =>
    set((s) => {
      // Only diagnostic flows have clarifyAnswers.
      if (
        !s.workflow ||
        s.workflow.kind === "launch-campaign" ||
        s.workflow.kind === "campaign-dive" ||
        s.workflow.kind === "analyst-review"
      )
        return {};
      return {
        workflow: {
          ...s.workflow,
          clarifyAnswers: { ...s.workflow.clarifyAnswers, [questionId]: value },
        },
      };
    }),

  primeClarifyDefaults: (defaults) =>
    set((s) => {
      if (
        !s.workflow ||
        s.workflow.kind === "launch-campaign" ||
        s.workflow.kind === "campaign-dive" ||
        s.workflow.kind === "analyst-review"
      )
        return {};
      // Don't overwrite anything the user has already set — only fill blanks.
      // CRITICAL: bail out early if no blanks remain. The caller's useEffect
      // can fire on every render (the questions array is a fresh ref each
      // time), but as long as we don't return a new workflow object here,
      // no re-render is triggered and the loop terminates.
      const current = s.workflow.clarifyAnswers;
      let hasBlank = false;
      for (const key of Object.keys(defaults)) {
        if (!(key in current)) {
          hasBlank = true;
          break;
        }
      }
      if (!hasBlank) return {};
      const merged = { ...defaults, ...current };
      return { workflow: { ...s.workflow, clarifyAnswers: merged } };
    }),

  attachVoiceAgent: (agentId) =>
    set((s) =>
      s.workflow && s.workflow.kind === "launch-campaign"
        ? { workflow: { ...s.workflow, attachedVoiceAgentId: agentId } }
        : {},
    ),

  exitWorkflow: () =>
    set({
      workflow: null,
      panelFile: null,
      viewHomeOverride: false,
      clickedCtas: new Set<string>(),
    }),

  markCtaClicked: (label) =>
    set((s) => {
      if (s.clickedCtas.has(label)) return {};
      const next = new Set(s.clickedCtas);
      next.add(label);
      return { clickedCtas: next };
    }),

  resolveCta: (key, decision) =>
    set((s) => ({ ctaResolutions: { ...s.ctaResolutions, [key]: decision } })),

  openCanvasFile: (file) => set({ panelFile: file }),
  closeCanvas: () => set({ panelFile: null }),

  showHomeView: () => set({ viewHomeOverride: true, panelFile: null }),
  resumeWorkflow: () => set({ viewHomeOverride: false }),

  setResumedTitle: (title) =>
    set((s) => (s.workflow ? { workflow: { ...s.workflow, resumedTitle: title } } : {})),

  connectWhatsApp: () =>
    set((s) => ({
      whatsAppConnected: true,
      toast: "WhatsApp Business connected · Click-to-WA ads can now run.",
      // Drop a small Spot message so the chat reflects the change.
      thread: s.workflow
        ? [
            ...s.thread,
            {
              role: "spot",
              parts: [
                {
                  type: "text",
                  text: "Connected your WhatsApp Business account. Click-to-WhatsApp + Outreach WA campaigns are now available.",
                },
              ],
            },
          ]
        : s.thread,
    })),

  setScope: (scope) => set({ scope }),
  appendMessage: (m) => set((s) => ({ thread: [...s.thread, m] })),
  setThread: (m) =>
    set((s) => ({ thread: typeof m === "function" ? m(s.thread) : m })),

  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false, maximized: false }),
  togglePanel: () => set((s) => ({ open: !s.open, maximized: s.open ? false : s.maximized })),
  toggleMaximize: () => set((s) => ({ maximized: !s.maximized, open: true })),
  setMaximized: (v) => set({ maximized: v }),

  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),

  // Legacy callers across the platform still call openGuided() expecting
  // a modal. The modal is dead — we now redirect to /spot and seed a
  // thread that walks the user through the same step inline. The
  // SpotRedirector watches `open` and routes accordingly.
  openGuided: (payload) =>
    set(() => ({
      open: true,
      maximized: false,
      pendingQuery: null,
      thread: [
        {
          role: "spot",
          parts: [
            {
              type: "headline",
              text: `Starting: ${guidedKindLabel[payload.kind]}.`,
              verdict: "info",
            },
            {
              type: "text",
              text: "I'll walk us through this here — no modals. Approve each step inline and I'll dispatch the right agent in the background.",
            },
            {
              type: "handoff",
              kind: payload.kind,
              label: `Continue · ${guidedKindLabel[payload.kind]}`,
              reason: "I'll handle the next step inline.",
            },
          ],
        },
      ],
    })),
  closeGuided: () => set({ guided: null }),

  showToast: (text) => set({ toast: text }),
  dismissToast: () => set({ toast: null }),
}));

/** Resolve a scope object from a "workspace" | "project:<id>" | "campaign:<id>" string. */
export function scopeFromRoute(
  pathname: string,
  resolve: { project?: (id: string) => string | null; campaign?: (id: string) => string | null } = {},
): SpotScope {
  // Path patterns: /projects/<id>, /campaigns/<id>, otherwise workspace
  const projMatch = pathname.match(/^\/projects\/([^/?#]+)/);
  if (projMatch) {
    const label = resolve.project?.(projMatch[1]) || "Project";
    return { kind: "project", label, target: projMatch[1] };
  }
  const campMatch = pathname.match(/^\/campaigns\/([^/?#]+)/);
  if (campMatch) {
    const label = resolve.campaign?.(campMatch[1]) || "Campaign";
    return { kind: "campaign", label, target: campMatch[1] };
  }
  return { kind: "workspace", label: "Workspace" };
}

/** Map a guided flow kind to a friendly label. */
export const guidedKindLabel: Record<GuidedKind, string> = {
  "new-persona": "Add a new persona",
  "new-angle": "Add a new angle",
  "launch-creative": "Launch new creatives",
  "new-campaign": "New campaign",
  "new-adset": "New ad set",
};

// Dev-only escape hatch — lets demo drivers (and Playwright) jump the
// workflow to any step from the console without clicking through every
// loader. Stripped from production builds by the env check.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __spotStore?: typeof useSpotStore }).__spotStore = useSpotStore;
}
