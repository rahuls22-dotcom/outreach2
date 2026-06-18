"use client";

import { AlertTriangle, Check, Info, ChevronRight, ChevronDown, ArrowRight, Cog, Rocket, Download, BarChart3, FileText, X } from "lucide-react";
import { useState, useEffect, useMemo, type ReactNode, type MouseEvent as ReactMouseEvent } from "react";
import { PRODUCTS } from "@/lib/products-data";
import { analystReportFor, importedReviewFor } from "@/lib/spot/analyst-data";
import { Markdown } from "@/components/memory/md-render";
import { SpotMark } from "./spot-mark";
import { SpotLoader } from "./spot-loader";
import { RichText } from "./rich-text";
import type { SpotFinding, SpotKpi, SpotMessage, SpotPart, Verdict, GuidedKind, SpotChoiceOption, SpotChoiceIcon } from "@/lib/spot/types";
import { useSpotStore } from "@/lib/spot/store";
import { hasStreamed, markStreamed } from "@/lib/spot/streamed-text";
import type { LaunchWorkflow, CanvasFile } from "@/lib/spot/workflow";
import { fileMeta } from "@/components/spot/workflow/workflow-pane";
import {
  IMPORT_AD_ACCOUNTS,
  campaignsForAccount,
  importAccount,
  summariseImport,
  type ImportPlatform,
} from "@/lib/spot/import-campaigns-data";

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const map: Record<Verdict, { label: string; cls: string; Icon: typeof Check }> = {
    ok: { label: "On track", cls: "pill-ok", Icon: Check },
    warn: { label: "Intervene", cls: "pill-warn", Icon: AlertTriangle },
    err: { label: "Critical", cls: "pill-err", Icon: AlertTriangle },
    info: { label: "Note", cls: "pill-info", Icon: Info },
  };
  const { label, cls, Icon } = map[verdict];
  return (
    <span className={`pill ${cls} flex-shrink-0`} style={{ fontSize: 10.5 }}>
      <Icon size={11} /> {label}
    </span>
  );
}

function HeadlinePart({ text, verdict }: { text: string; verdict?: Verdict }) {
  return (
    <div
      className="flex items-start gap-2.5 mb-2.5"
      style={{
        padding: "10px 13px",
        background: "var(--spot-tint)",
        border: "1px solid var(--spot-stroke)",
        borderRadius: 10,
      }}
    >
      <div className="flex-1 text-[14px] leading-[1.55] text-text-primary">
        <RichText text={text} />
      </div>
      {verdict && <VerdictBadge verdict={verdict} />}
    </div>
  );
}

// Tier-2 informational content — readable but calm. No per-item card box
// (that turned every finding into a competing surface); bare rows separated
// by whitespace, with a small tone dot carrying the signal.
function FindingsPart({ items }: { items: SpotFinding[] }) {
  return (
    <div className="space-y-3 mb-3">
      {items.map((f, i) => {
        const accent =
          f.tone === "concern" ? "#F5A623" : f.tone === "positive" ? "#22C55E" : "#D4D4D4";
        return (
          <div key={i} className="flex items-start gap-2.5">
            <span
              className="w-[7px] h-[7px] rounded-full flex-shrink-0 relative top-[7px]"
              style={{ background: accent }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold leading-snug text-text-primary">{f.title}</div>
              <div className="text-[13.5px] text-text-secondary leading-[1.55] mt-0.5">{f.body}</div>
              {f.evidence && f.evidence.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {f.evidence.map((e, j) => (
                    <span key={j} className="pill" style={{ fontSize: 10.5 }}>
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KpisPart({ items }: { items: SpotKpi[] }) {
  return (
    <div
      className="p-3 mb-2.5 grid rounded-[8px]"
      style={{
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 12,
        border: "1px solid var(--border-subtle)",
        background: "transparent",
      }}
    >
      {items.map((k, i) => {
        const color =
          k.good === true ? "var(--ok-fg)" : k.good === false ? "var(--err-fg)" : "var(--text-3)";
        return (
          <div key={i}>
            <div className="uplabel" style={{ fontSize: 10 }}>
              {k.label}
            </div>
            <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 600 }}>
              {k.value}
            </div>
            {k.delta && (
              <div className="tabular-nums" style={{ fontSize: 10.5, color }}>
                {k.delta}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Per-kind "next step" reply Spot appends inline when a handoff card
// is clicked. No modals: everything happens inside the chat thread, the
// platform pages continue their own work in the background.
const NEXT_STEP: Record<GuidedKind, SpotMessage> = {
  "new-persona": {
    role: "spot",
    parts: [
      { type: "headline", text: "Starting persona research.", verdict: "info" },
      {
        type: "findings",
        items: [
          { tone: "neutral", title: "Pulling existing personas linked to this project", body: "I'll look at every persona already approved against this project's memory and surface the ones that historically work." },
          { tone: "neutral", title: "Sweeping comparable projects", body: "Cross-checking Banerghatta + Yelahanka audience overlap to recommend net-new personas worth testing." },
          { tone: "neutral", title: "Drafting persona briefs", body: "For each candidate I'll write identity, pain, desire, and the channels where they perform — you approve or refine." },
        ],
      },
      { type: "text", text: "Reply with **approve** to lock the existing personas, or ask me to research a specific cohort first." },
    ],
  },
  "new-angle": {
    role: "spot",
    parts: [
      { type: "headline", text: "Drafting angles.", verdict: "info" },
      { type: "text", text: "I'll write 2–3 angle drafts (hook + CTA) per approved persona. Each shows up as a card on the persona's page — accept inline, no modal." },
    ],
  },
  "launch-creative": {
    role: "spot",
    parts: [
      { type: "headline", text: "Briefing the Creative Agent.", verdict: "info" },
      { type: "text", text: "The Creative Agent is generating statics + video shells against the approved angles. You'll see them appear on **Creatives** as they're ready — keep working here while I run." },
    ],
  },
  "new-campaign": {
    role: "spot",
    parts: [
      { type: "headline", text: "Structuring the campaign.", verdict: "info" },
      { type: "text", text: "I'm assembling campaign → ad sets → ads on Meta and Google. Revspot stays read-only on those entities; you'll get a link out when it's time to launch." },
    ],
  },
  "new-adset": {
    role: "spot",
    parts: [
      { type: "headline", text: "Building the ad set.", verdict: "info" },
      { type: "text", text: "Picking audiences from the linked personas and pacing budget across them." },
    ],
  },
};

function HandoffPart({ kind, label, reason }: { kind: GuidedKind; label: string; reason: string }) {
  const setThread = useSpotStore((s) => s.setThread);
  return (
    <button
      type="button"
      onClick={() => {
        const next = NEXT_STEP[kind];
        if (next) setThread((prev) => [...prev, next]);
      }}
      className="group text-left w-full mb-2.5 flex items-center gap-3 p-3.5 rounded-[14px] transition-colors hover:bg-surface-page"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--spot-card-border)",
        boxShadow: "0 1px 2px rgba(60,50,30,0.04)",
      }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-[9px] flex-shrink-0"
        style={{ background: "var(--surface-secondary)", border: "1px solid var(--border)" }}
      >
        <SpotMark size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-semibold mb-0.5">
          Next step
        </div>
        <div className="text-[14.5px] font-semibold">{label}</div>
        <div className="text-[12.5px] text-text-secondary mt-0.5">{reason}</div>
      </div>
      <ChevronRight size={14} className="text-text-tertiary flex-shrink-0" />
    </button>
  );
}

/** Save a markdown string to disk as a real .md file. Plain-DOM, no deps —
 *  React 18.3.1 safe. */
function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** The one document-artifact card. The whole card opens the file in the right
 *  panel (closing lives there, so no toggle here). The only button is Download,
 *  which saves the underlying .md. Used for every artefact Spot produces. */
function ArtifactCardPart({
  file,
  title,
  subtitle,
  markdown,
}: {
  file: CanvasFile;
  title: string;
  subtitle: string;
  markdown?: string;
}) {
  const openCanvasFile = useSpotStore((s) => s.openCanvasFile);
  const meta = fileMeta(file);
  const Icon = meta.icon;
  const onDownload = (e: ReactMouseEvent) => {
    e.stopPropagation();
    downloadMarkdown(meta.file, markdown ?? `# ${title}\n\n${subtitle}\n`);
  };
  return (
    // Card wrapper is the click target (open). The Download button is a real
    // sibling button — not nested — so it can stop propagation cleanly.
    <div
      role="button"
      tabIndex={0}
      onClick={() => openCanvasFile(file)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCanvasFile(file);
        }
      }}
      className="group cursor-pointer w-full mb-2.5 flex items-center gap-3.5 p-3.5 rounded-[14px] transition-colors hover:bg-surface-page"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--spot-card-border)",
        boxShadow: "0 1px 2px rgba(60,50,30,0.04)",
      }}
    >
      {/* Stacked-paper glyph — gives the card a real "document" read with
          depth, instead of a flat colored tile. Tinted neutral, no accent. */}
      <span className="relative flex-shrink-0 w-[38px] h-[44px]" aria-hidden>
        <span
          className="absolute left-[8px] top-[4px] w-[30px] h-[38px] rounded-[7px]"
          style={{ background: "#FFFFFF", border: "1px solid var(--spot-card-border)", transform: "rotate(6deg)" }}
        />
        <span
          className="absolute left-0 top-[2px] w-[30px] h-[38px] rounded-[7px] flex items-center justify-center"
          style={{ background: "#FBFAF7", border: "1px solid var(--border)", boxShadow: "0 1px 2px rgba(60,50,30,0.05)" }}
        >
          <Icon size={15} strokeWidth={1.7} className="text-text-secondary" />
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-semibold leading-tight text-text-primary truncate">{title}</span>
        <span className="block text-[12.5px] text-text-tertiary mt-1 truncate">{subtitle}</span>
      </span>
      {/* Download — the only action on the card. Quiet neutral pill (never the
          dark primary). Opening is handled by clicking the card itself. */}
      <button
        type="button"
        onClick={onDownload}
        title={`Download ${meta.file}`}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12.5px] font-medium flex-shrink-0 transition-colors hover:text-text-primary"
        style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
      >
        <Download size={14} strokeWidth={2} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
        Download
      </button>
    </div>
  );
}

/** The one primary action button used across Spot's HITL gates — step CTAs,
 *  the Analyst accept, etc. One shape everywhere: a dark pill with a leading
 *  or trailing icon. `icon` defaults to a trailing arrow; pass `leadingIcon`
 *  for an accept-style check. Keeps every decision point visually identical. */
function SpotActionButton({
  label,
  onClick,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon = ArrowRight,
}: {
  label: string;
  onClick: () => void;
  leadingIcon?: typeof Check;
  trailingIcon?: typeof ArrowRight | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13.5px] font-semibold transition-colors"
      style={{
        background: "#1A1A1A",
        color: "#FAFAF8",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.10) inset, 0 1px 2px rgba(0,0,0,0.08)",
      }}
    >
      {LeadingIcon && <LeadingIcon size={14} strokeWidth={2.4} />}
      {label}
      {TrailingIcon && <TrailingIcon size={13} strokeWidth={2.4} />}
    </button>
  );
}

/** The quiet companion to SpotActionButton. Every gate where Spot proposes
 *  something carries a Reject next to the dark primary — same neutral shape
 *  everywhere so "pass on this" is always one click and never reads as the
 *  loud option. */
function RejectButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13.5px] font-medium transition-colors hover:text-text-primary"
      style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
    >
      <X size={14} strokeWidth={2.2} />
      Reject
    </button>
  );
}

/**
 * StepCtaPart · a mid-flow gate, framed exactly like the analyst
 * recommendation card so every decision point in the chat looks identical:
 * a quiet "Next step" kicker, the bold action `label` as the title, a helper
 * line, then [Reject][Continue]. The button text is FIXED ("Continue") — the
 * action itself lives in the title, never on the button, so we never get
 * freeform text on a primary pill. Continue advances the workflow; Reject
 * holds the flow in place and asks the user what they'd rather do.
 */
function StepCtaPart({ label, helper, refineHint }: { label: string; helper?: string; refineHint?: string }) {
  const advanceWorkflow = useSpotStore((s) => s.advanceWorkflow);
  const rejectStep = useSpotStore((s) => s.rejectStep);
  const resolveCta = useSpotStore((s) => s.resolveCta);
  // The decision lives on the card itself: once acted on, the gate morphs into
  // its decided state (no buttons, a status chip) and stays. No user echo in
  // the chat — every decision point reads as a card, never a bubble.
  const sentinel = `step-cta:${label}`;
  const resolution = useSpotStore((s) => s.ctaResolutions[sentinel]);

  const handleContinue = () => {
    resolveCta(sentinel, "accepted");
    advanceWorkflow();
  };
  const handleReject = () => {
    resolveCta(sentinel, "rejected");
    rejectStep();
  };

  // Decided state — buttons gone, a quiet chip carries the user's call.
  if (resolution) {
    const accepted = resolution === "accepted";
    return (
      <div
        className="mt-2 mb-1 rounded-[14px] px-4 py-3.5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-medium mb-1">
              Next step
            </div>
            <div className="text-[16px] font-semibold text-text-primary leading-snug">
              {label}
            </div>
          </div>
          <div
            className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full"
            style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
          >
            {accepted ? (
              <Check size={14} strokeWidth={2} />
            ) : (
              <X size={14} strokeWidth={2} />
            )}
            <span className="text-[12.5px] font-medium">
              {accepted ? "Confirmed" : "Passed"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-2 mb-1 rounded-[14px] px-4 py-3.5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-medium mb-1">
            Next step
          </div>
          <div className="text-[16px] font-semibold text-text-primary leading-snug">
            {label}
          </div>
          {(helper || refineHint) && (
            <div className="text-[12px] text-text-tertiary mt-1.5 leading-snug">
              {helper}
              {helper && refineHint && <span> · </span>}
              {refineHint}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <RejectButton onClick={handleReject} />
          <SpotActionButton label="Continue" onClick={handleContinue} trailingIcon={ArrowRight} />
        </div>
      </div>
    </div>
  );
}

const CHOICE_ICON: Record<SpotChoiceIcon, typeof Rocket> = {
  rocket: Rocket,
  download: Download,
  chart: BarChart3,
  sparkles: Cog,
};

/**
 * ChoicePart · two (or three) mutually-exclusive branch options in one
 * Spot message. Rendered as a small stack of clickable rows — primary
 * gets the gold accent, secondary stays neutral. Picking one echoes the
 * label as a user message, hides the whole choice, and dispatches the
 * option's `action` to the right store call (or navigation).
 */
function ChoicePart({ prompt, options }: { prompt?: string; options: SpotChoiceOption[] }) {
  const advanceWorkflow = useSpotStore((s) => s.advanceWorkflow);
  const startImportCampaigns = useSpotStore((s) => s.startImportCampaigns);
  const startImportReview = useSpotStore((s) => s.startImportReview);
  const startScaleFlow = useSpotStore((s) => s.startScaleFlow);
  const startOptimizeFlow = useSpotStore((s) => s.startOptimizeFlow);
  const startTestAnglesFlow = useSpotStore((s) => s.startTestAnglesFlow);
  const appendMessage = useSpotStore((s) => s.appendMessage);
  const markClicked = useSpotStore((s) => s.markCtaClicked);
  // Hide the whole choice once any option has been chosen.
  const answered = useSpotStore((s) => options.some((o) => s.clickedCtas.has(o.label)));

  if (answered) return null;

  const choose = (o: SpotChoiceOption) => {
    appendMessage({ role: "user", text: o.label });
    markClicked(o.label);
    switch (o.action) {
      case "launch-new":
        advanceWorkflow(); // kickoff → launch-plan
        break;
      case "import-campaigns":
        startImportCampaigns();
        break;
      case "launch-after-import":
        advanceWorkflow(undefined, "launch-strategy");
        break;
      case "analyse-performance":
        // Hand the imported campaigns to the Analyst Agent instead of dumping
        // the user on the Campaigns page — opens an analyst review conversation.
        startImportReview();
        break;
      case "reconsider-flow": {
        // After a reject — run the alternative play in the same session.
        if (!o.diagFlow || !o.productId || !o.productName) break;
        const p = { id: o.productId, name: o.productName };
        if (o.diagFlow === "scale") startScaleFlow(p);
        else if (o.diagFlow === "optimize") startOptimizeFlow(p);
        else startTestAnglesFlow(p);
        break;
      }
    }
  };

  return (
    <div className="mb-2.5">
      {prompt && (
        <div className="text-[14px] font-medium text-text-secondary mb-2">{prompt}</div>
      )}
      <div className="space-y-2">
        {options.map((o) => {
          const Icon = o.icon ? CHOICE_ICON[o.icon] : ArrowRight;
          const primary = o.variant === "primary";
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => choose(o)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] border text-left transition-colors group"
              style={{
                // Primary is carried by the dark border + dark icon tile;
                // no gold wash (neutral palette).
                background: "#FFFFFF",
                borderColor: primary ? "#1A1A1A" : "var(--border)",
              }}
            >
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-[9px] flex-shrink-0"
                style={{
                  background: primary ? "#1A1A1A" : "var(--surface-secondary)",
                  color: primary ? "#FAFAF8" : "var(--text-secondary)",
                }}
              >
                <Icon size={15} strokeWidth={2} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-semibold text-text-primary leading-tight">
                  {o.label}
                </span>
                {o.helper && (
                  <span className="block text-[12px] text-text-tertiary leading-snug mt-0.5">
                    {o.helper}
                  </span>
                )}
              </span>
              <ArrowRight
                size={14}
                strokeWidth={2}
                className="text-text-tertiary group-hover:text-text-primary flex-shrink-0 transition-colors"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Inline import-campaigns picker (left panel) ─────────────────── */

function importInr(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${Math.round(n)}`;
}

const IMPORT_PLATFORM_COLOR: Record<ImportPlatform, string> = {
  Meta: "#4C6FFF",
  Google: "#34A853",
};

function ImportPlatformDot({ platform }: { platform: ImportPlatform }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 h-[18px] rounded-full text-[9.5px] font-semibold flex-shrink-0"
      style={{ background: `${IMPORT_PLATFORM_COLOR[platform]}1A`, color: IMPORT_PLATFORM_COLOR[platform] }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: IMPORT_PLATFORM_COLOR[platform] }} />
      {platform}
    </span>
  );
}

function ImportCheckBox({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) {
  const on = checked || indeterminate;
  return (
    <span
      className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-[5px] flex-shrink-0 transition-colors"
      style={{
        background: on ? "#1A1A1A" : "#FFFFFF",
        border: on ? "none" : "1.5px solid var(--border)",
      }}
    >
      {checked && <Check size={11} strokeWidth={3} style={{ color: "#FAFAF8" }} />}
      {indeterminate && !checked && (
        <span className="w-[7px] h-[2px] rounded-full" style={{ background: "#FAFAF8" }} />
      )}
    </span>
  );
}

function ImportStatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-2 py-2.5 text-center">
      <div className="text-[14px] font-semibold tabular text-text-primary leading-none">{value}</div>
      <div className="text-[8.5px] uppercase tracking-wider font-semibold text-text-tertiary mt-1.5">{label}</div>
      {sub && <div className="text-[8.5px] text-text-tertiary mt-0.5">{sub}</div>}
    </div>
  );
}

/**
 * ImportPickerPart · the whole import-campaigns selection, rendered inline
 * in the chat (left panel). Walks the workflow's importStage:
 *   select-account  → list of ad accounts to pick
 *   select-campaigns → tickable campaign list + Import button
 *   imported         → compact read-only confirmation
 * All state lives in the store; the right canvas stays on memory.md.
 */
function ImportPickerPart() {
  const workflow = useSpotStore((s) => s.workflow);
  const selectImportAdAccount = useSpotStore((s) => s.selectImportAdAccount);
  const backToImportAccounts = useSpotStore((s) => s.backToImportAccounts);
  const toggleImportCampaign = useSpotStore((s) => s.toggleImportCampaign);
  const setImportSelection = useSpotStore((s) => s.setImportSelection);
  const confirmImportCampaigns = useSpotStore((s) => s.confirmImportCampaigns);

  if (!workflow || workflow.kind !== "launch-campaign") return null;
  const w = workflow as LaunchWorkflow;
  const stage = w.importStage ?? "select-account";
  const accountId = w.importAdAccountId ?? null;

  // ── Phase 1 · choose an ad account ──
  if (stage === "select-account" || !accountId) {
    return (
      <div className="mb-2.5">
        <div className="text-[11px] text-text-tertiary mb-1.5">
          Choose an account — I&apos;ll pull every campaign in it.
        </div>
        <div className="space-y-1.5">
          {IMPORT_AD_ACCOUNTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => selectImportAdAccount(a.id)}
              className="group w-full text-left rounded-[10px] border border-border bg-white hover:border-border-hover hover:bg-surface-page px-3 py-2.5 flex items-center gap-2.5 transition-colors"
            >
              <ImportPlatformDot platform={a.platform} />
              <span className="flex-1 min-w-0">
                <span className="block text-[12.5px] font-semibold text-text-primary truncate">{a.name}</span>
                <span className="block text-[10.5px] text-text-tertiary truncate">
                  {a.campaignCount} campaigns · {importInr(a.spend30d)}/30d
                </span>
              </span>
              <ArrowRight size={13} strokeWidth={2} className="text-text-tertiary group-hover:text-text-primary flex-shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const campaigns = campaignsForAccount(accountId);
  const account = importAccount(accountId);

  // ── Phase 3 · imported · success summary ──
  if (stage === "imported") {
    const ids = w.importedCampaignIds ?? [];
    const sum = summariseImport(ids);
    const importedRows = campaigns.filter((c) => ids.includes(c.id));
    return (
      <div className="mb-2.5 rounded-card border border-border bg-white overflow-hidden">
        {/* Header — quiet gold check, monochrome copy (Spot system) */}
        <div className="px-3.5 py-3 flex items-center gap-2.5 border-b border-border-subtle">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,106,0.18) 0%, rgba(224,192,131,0.10) 100%)",
              border: "1px solid rgba(201,168,106,0.45)",
            }}
          >
            <Check size={13} strokeWidth={2.6} style={{ color: "#9A7B3F" }} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-text-primary leading-tight">
              {sum.count} campaign{sum.count === 1 ? "" : "s"} imported
            </div>
            <div className="text-[11px] text-text-tertiary truncate">
              Into {w.productName}&apos;s memory{account ? ` · ${account.name}` : ""}
            </div>
          </div>
        </div>

        {/* Stat row — hairline dividers, monochrome values */}
        <div className="grid grid-cols-4 divide-x divide-border-subtle border-b border-border-subtle">
          <ImportStatTile label="Campaigns" value={`${sum.count}`} sub={`${sum.active} active`} />
          <ImportStatTile label="Spend · 30d" value={importInr(sum.spend)} />
          <ImportStatTile label="Leads · 30d" value={sum.leads.toLocaleString("en-IN")} />
          <ImportStatTile label="Blended CPL" value={importInr(sum.blendedCpl)} />
        </div>

        {/* Imported list — gold dot = active, grey = paused */}
        <div className="px-3.5 py-2.5">
          <div className="text-[9.5px] uppercase tracking-wider font-semibold text-text-tertiary mb-2">
            Imported into memory
          </div>
          <ul className="space-y-1.5">
            {importedRows.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-[11.5px]">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: c.status === "active" ? "#6B6B6B" : "#D2D2CC" }}
                  title={c.status === "active" ? "Active" : "Paused"}
                />
                <span className="flex-1 truncate text-text-secondary">{c.name}</span>
                <span className="text-text-tertiary tabular flex-shrink-0">{importInr(c.spend)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ── Phase 2 · choose campaigns ──
  const selected = w.selectedImportCampaignIds ?? [];
  const selectedSet = new Set(selected);
  const allIds = campaigns.map((c) => c.id);
  const allSelected = selected.length === campaigns.length && campaigns.length > 0;
  const sum = summariseImport(selected);

  return (
    <div className="mb-2.5">
      {/* Account header */}
      <div className="flex items-center gap-2 mb-1.5">
        {account && <ImportPlatformDot platform={account.platform} />}
        <span className="text-[12px] font-medium text-text-primary truncate flex-1">{account?.name}</span>
        <button type="button" onClick={backToImportAccounts} className="text-[11px] text-text-tertiary hover:text-text-primary">
          Change
        </button>
      </div>

      {/* Select-all bar */}
      <button
        type="button"
        onClick={() => setImportSelection(allSelected ? [] : allIds)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[8px] border border-border bg-surface-page mb-1 text-[11.5px]"
      >
        <span className="inline-flex items-center gap-2 font-medium text-text-secondary">
          <ImportCheckBox checked={allSelected} indeterminate={!allSelected && selected.length > 0} />
          {allSelected ? "Deselect all" : "Select all"}
        </span>
        <span className="text-text-tertiary tabular">{selected.length} of {campaigns.length}</span>
      </button>

      {/* List */}
      <div className="rounded-[10px] border border-border overflow-hidden bg-white">
        {campaigns.map((c, i) => {
          const checked = selectedSet.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleImportCampaign(c.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-surface-page"
              style={{
                borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined,
                background: checked ? "rgba(201,168,106,0.07)" : undefined,
              }}
            >
              <ImportCheckBox checked={checked} />
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: c.status === "active" ? "#22C55E" : "#C4C4BD" }}
                title={c.status === "active" ? "Active" : "Paused"}
              />
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] font-medium text-text-primary truncate">{c.name}</span>
                <span className="block text-[10px] text-text-tertiary truncate">
                  {c.objective} · {importInr(c.spend)} · {c.leads.toLocaleString("en-IN")} leads · {importInr(c.cpl)} CPL
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <span className="text-[10.5px] text-text-tertiary">
          {selected.length > 0 ? (
            <>
              Importing <span className="font-semibold text-text-secondary">{selected.length}</span> · {importInr(sum.spend)} · {sum.leads.toLocaleString("en-IN")} leads
            </>
          ) : (
            "Select at least one campaign"
          )}
        </span>
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={confirmImportCampaigns}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11.5px] font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          style={{ background: "#1A1A1A", color: "#FAFAF8" }}
        >
          Import {selected.length > 0 ? selected.length : ""} campaign{selected.length === 1 ? "" : "s"}
          <ArrowRight size={10} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

function ToolCallPart({ agent, detail, status }: { agent: string; detail?: string; status: "running" | "done" }) {
  const running = status === "running";
  // Inline thinking line — no card, no border. Single row that reads
  // like a Claude "tool call" trace. While running, the agent name is
  // shown alone; once done it greys out so the page doesn't shout.
  return (
    <div className="mb-1.5 flex items-baseline gap-1.5 text-[11.5px] leading-[1.5]">
      {running ? (
        <Cog
          size={10}
          strokeWidth={1.8}
          className="text-text-secondary relative top-[1.5px] animate-spin"
          style={{ animationDuration: "2s" }}
        />
      ) : (
        <Check size={10} strokeWidth={2.2} className="text-[#15803D] relative top-[1.5px]" />
      )}
      <span className={running ? "text-text-secondary" : "text-text-tertiary"}>
        <span className="font-medium">{agent}</span>
        {detail && (
          <>
            <span className="text-text-tertiary"> · </span>
            <span>{detail}</span>
          </>
        )}
      </span>
    </div>
  );
}

/* ─── Chain of thought ───────────────────────────────────────────────
 * Groups a run of adjacent tool-call parts into ONE collapsible reasoning
 * trace, the way Claude shows "Thinking". While any step runs the header
 * reads "Thinking · <live step>" with a soft pulse and the trace stays
 * open; once settled it collapses to a quiet one-line summary the user can
 * re-open. Expanded, the steps sit on a continuous timeline rail — a small
 * node dot per step, a hairline connector between them. No icons, no box,
 * no checkmarks. Read-only display (principle P11: no write/approve here). */
type CotStep = { agent: string; detail?: string; status: "running" | "done" };

function ChainOfThought({ steps }: { steps: CotStep[] }) {
  const anyRunning = steps.some((s) => s.status === "running");
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  // Follow the work while it runs, then tuck away to a single line — unless
  // the user has taken manual control of the disclosure.
  useEffect(() => {
    if (!touched) setOpen(anyRunning);
  }, [anyRunning, touched]);

  const live = steps.find((s) => s.status === "running");
  const last = steps[steps.length - 1];
  // Self-describing collapsed summary — the live step while running, the last
  // step once settled. Never a generic "Worked through N steps".
  const summary = anyRunning
    ? live
      ? `${live.agent}${live.detail ? ` · ${live.detail}` : ""}`
      : "working"
    : last
      ? `${last.agent}${last.detail ? ` · ${last.detail}` : ""}`
      : `Thought through ${steps.length} step${steps.length === 1 ? "" : "s"}`;

  // Recessive process trace — no box, no border, no fill. A muted toggle line
  // that recedes by contrast; expand reveals the step list on a timeline rail.
  return (
    <div className="mb-2.5 text-[12px]">
      <button
        type="button"
        onClick={() => {
          setTouched(true);
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1.5 max-w-full text-text-tertiary hover:text-text-secondary transition-colors"
      >
        {anyRunning ? (
          <>
            <span className="font-medium text-text-secondary animate-pulse">Thinking</span>
            <span className="text-text-tertiary">·</span>
            <span className="truncate text-text-tertiary">{summary}</span>
          </>
        ) : (
          <span className="truncate font-medium text-text-tertiary">{summary}</span>
        )}
        <ChevronRight
          size={12}
          strokeWidth={2}
          className={`flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-2 ml-0.5">
          {steps.map((s, i) => {
            const running = s.status === "running";
            const isLast = i === steps.length - 1;
            return (
              <div key={i} className="flex gap-2.5">
                <div className="flex flex-col items-center flex-shrink-0 w-3">
                  <span
                    className={`mt-[7px] rounded-full ${
                      running
                        ? "w-[6px] h-[6px] bg-text-secondary animate-pulse"
                        : "w-[5px] h-[5px] bg-text-tertiary"
                    }`}
                  />
                  {!isLast && <span className="w-px flex-1 mt-1 mb-0.5 bg-border-subtle" />}
                </div>
                <div
                  className={`${isLast ? "pb-0" : "pb-3"} text-[12.5px] leading-[1.55] ${
                    running ? "text-text-secondary" : "text-text-tertiary"
                  }`}
                >
                  <span className="font-medium">{s.agent}</span>
                  {s.detail && <span className="text-text-tertiary"> · {s.detail}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Streaming text ─────────────────────────────────────────────────
 * Reveals a Spot answer token-by-token on mount, the way Claude streams its
 * reply, with a blinking caret while in flight. Splits on whitespace so words
 * land whole; a half-open `**bold**` marker is held back until its closing
 * `**` arrives so the markdown never flashes raw asterisks. Once a part has
 * fully revealed it just renders as static RichText. */
function StreamingText({ text, onDone }: { text: string; onDone?: () => void }) {
  const tokens = useMemo(() => text.split(/(\s+)/), [text]);
  // If this exact answer has already streamed once (this session or a prior
  // one, via localStorage), render it whole — no re-animation on reopen,
  // route change, or reload. Computed on mount so the very first render of an
  // already-seen answer is already complete.
  const alreadyDone = useMemo(() => hasStreamed(text), [text]);
  const [n, setN] = useState(alreadyDone ? tokens.length : 0);
  useEffect(() => {
    if (alreadyDone) {
      setN(tokens.length);
      onDone?.();
      return;
    }
    setN(0);
    if (tokens.length === 0) {
      markStreamed(text);
      onDone?.();
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= tokens.length) {
        clearInterval(id);
        markStreamed(text);
        onDone?.();
      }
    }, 42);
    return () => clearInterval(id);
    // onDone is a stable callback from the parent; tokens drives the run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, alreadyDone]);

  let shown = tokens.slice(0, n).join("");
  // Drop a dangling, not-yet-closed bold marker so RichText never shows `**`.
  if (((shown.match(/\*\*/g) || []).length) % 2 === 1) {
    shown = shown.slice(0, shown.lastIndexOf("**"));
  }
  const streaming = n < tokens.length;
  return (
    <>
      <RichText text={shown} />
      {streaming && (
        <span
          aria-hidden
          className="inline-block w-[2px] h-[1em] ml-[1px] align-[-0.15em] bg-text-tertiary animate-pulse"
        />
      )}
    </>
  );
}

/* ─── Ledger part ────────────────────────────────────────────────────
 * The structured delta a refinement studio hands back on commit. The
 * studio chat never lands here — only this event. Collapsed by default
 * (one quiet row, like a git log line); expands to the change list and
 * the impact flag when present. */
function LedgerPart({
  agent,
  artifact,
  fromVersion,
  toVersion,
  summary,
  changes,
  impact,
}: {
  agent: string;
  artifact: string;
  fromVersion: number;
  toVersion: number;
  summary: string;
  changes: string[];
  impact?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="mb-2 rounded-[8px] overflow-hidden"
      style={{ border: "1px solid var(--border-subtle)", background: "transparent" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
      >
        <FileText size={11} strokeWidth={1.8} className="flex-shrink-0 text-text-tertiary" />
        <span className="text-[11.5px] leading-[1.45] flex-1 min-w-0">
          <span className="font-semibold">{agent} updated {artifact}</span>
          <span className="text-text-tertiary tabular-nums"> · v{fromVersion} → v{toVersion}</span>
          <span className="text-text-secondary"> · {summary}</span>
        </span>
        <span
          className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 h-[18px] rounded-full text-text-tertiary"
          style={{ background: "var(--surface-secondary)" }}
        >
          <Check size={9} strokeWidth={2.6} /> Approved by you
        </span>
        <ChevronDown
          size={12}
          className="flex-shrink-0 text-text-tertiary transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <div className="px-2.5 pb-2.5 pt-0.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <ul className="mt-2 space-y-1">
            {changes.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11.5px] text-text-secondary leading-[1.45]">
                <Check size={10} strokeWidth={2.2} className="flex-shrink-0 relative top-[2.5px] text-text-tertiary" />
                {c}
              </li>
            ))}
          </ul>
          {impact && (
            <div
              className="mt-2 flex items-start gap-1.5 text-[11px] leading-[1.45] rounded-[6px] px-2 py-1.5"
              style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}
            >
              <AlertTriangle size={11} className="flex-shrink-0 relative top-[1.5px]" />
              {impact}
            </div>
          )}
          <div className="mt-2 text-[10.5px] text-text-tertiary">
            Refined in the studio with {agent} · only the outcome lands here — the iteration stays in the room.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Agent working block ────────────────────────────────────────────
 * The live "Spot is working" surface — mirrors a real agentic trace:
 * a row of PHASE chips (the agent's phase nomenclature), the SKILL / tool
 * calls Spot is running, and a footer (Thinking… · elapsed · tokens ·
 * tool count · Stop). The timer is real (since the block mounted);
 * the tool list + token count are scripted per workflow kind for the demo. */

const AGENT_PHASES: Record<string, string[]> = {
  "launch-campaign": ["init", "create-product", "deep-research", "mcp-tools", "product-brief", "update-memory"],
  scale: ["init", "analyze", "clarify", "plan", "deploy"],
  optimize: ["init", "analyze", "clarify", "plan", "deploy"],
  "test-angles": ["init", "analyze", "clarify", "angles", "deploy"],
};

const AGENT_TOOLS: Record<string, string[]> = {
  "launch-campaign": [
    "ToolSearch",
    "mcp spot research crawl site",
    "mcp spot audience graph match",
    "mcp spot analysis get meta campaign structure",
    "Grep brand memory",
    "mcp spot memory update project",
  ],
  scale: [
    "ToolSearch",
    "mcp spot analysis get meta campaign structure",
    "mcp spot reporting performance trend",
    "mcp spot insights anomaly signal",
    "Grep winning angles",
  ],
  optimize: [
    "ToolSearch",
    "mcp spot analysis get meta campaign structure",
    "mcp spot reporting ads get creative details",
    "mcp spot insights auction ranking benchmarks",
    "Grep landing pages",
  ],
  "test-angles": [
    "ToolSearch",
    "mcp spot analysis get meta campaign structure",
    "mcp spot reporting ads get creative details",
    "mcp spot ads library search",
    "Grep do-not-mention list",
  ],
};

// Render the raw tool identifiers as a clean namespace · action pair (the
// same shape as ChainOfThought rows) instead of raw monospace command text —
// "mcp spot research crawl site" reads as `Spot · research crawl site`.
function prettyTool(raw: string): { primary: string; detail?: string } {
  const mcp = raw.match(/^mcp\s+(\w+)\s+(.+)$/i);
  if (mcp) {
    const ns = mcp[1].charAt(0).toUpperCase() + mcp[1].slice(1);
    return { primary: ns, detail: mcp[2] };
  }
  const grep = raw.match(/^Grep\s+(.+)$/i);
  if (grep) return { primary: "Grep", detail: grep[1] };
  // Split camelCase identifiers like "ToolSearch" into "Tool Search".
  return { primary: raw.replace(/([a-z])([A-Z])/g, "$1 $2") };
}

function activePhaseIndex(kind: string, step: string): number {
  if (kind === "launch-campaign") {
    if (step === "product-setup") return 1; // create-product
    if (step === "kickoff") return 2; // deep-research
    if (step === "launch-strategy") return 3; // mcp-tools
    if (step === "launch-plan") return 4; // product-brief
    return 5; // building / review → update-memory
  }
  if (step.endsWith("-analyze")) return 1;
  if (step.endsWith("-clarify")) return 2;
  if (step.endsWith("-plan")) return 3;
  if (step.endsWith("-live")) return 4;
  return 1;
}

function fmtElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export function AgentWorkingBlock({
  working,
  workflowKind,
  workflowStep,
}: {
  working: boolean;
  workflowKind: string | null;
  workflowStep: string | null;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [revealed, setRevealed] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!working) {
      setElapsed(0);
      setRevealed(1);
      setDismissed(false);
      return;
    }
    const t0 = Date.now();
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 250);
    const rev = setInterval(() => setRevealed((r) => r + 1), 650);
    return () => {
      clearInterval(tick);
      clearInterval(rev);
    };
    // Re-seed the reveal each time the working step changes.
  }, [working, workflowStep]);

  if (!working || dismissed || !workflowKind || !AGENT_PHASES[workflowKind]) return null;
  const phases = AGENT_PHASES[workflowKind];
  const tools = AGENT_TOOLS[workflowKind] ?? AGENT_TOOLS["launch-campaign"];
  const activeIdx = activePhaseIndex(workflowKind, workflowStep ?? "");
  const shownTools = tools.slice(0, Math.max(1, Math.min(revealed, tools.length)));
  const toolCount = shownTools.length;
  const tokens = Math.min(8800, 460 + elapsed * 680 + toolCount * 210);

  // Slim, low-profile line by default — no white card. Click the summary to
  // expand the phase chips + tool rows; Stop just dismisses the indicator
  // (it never tears down the workflow / chat).
  return (
    <div className="mb-2 text-[11.5px]">
      <div className="flex items-center gap-2 text-text-tertiary">
        <Cog
          size={11}
          strokeWidth={1.8}
          className="text-text-secondary animate-spin flex-shrink-0"
          style={{ animationDuration: "2s" }}
        />
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1.5 hover:text-text-primary transition-colors"
        >
          <span className="text-text-secondary font-medium">Working…</span>
          <span>·</span>
          <span className="tabular">{fmtElapsed(elapsed)}</span>
          <span>·</span>
          <span className="tabular">↓{(tokens / 1000).toFixed(1)}k</span>
          <span>·</span>
          <span className="tabular">
            {toolCount} tool{toolCount === 1 ? "" : "s"}
          </span>
          <ChevronRight
            size={11}
            strokeWidth={1.8}
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>
      </div>

      {/* Expanded detail — phases + tool rows (opt-in) */}
      {expanded && (
        <div className="mt-1.5 ml-1 pl-2.5 border-l border-border-subtle">
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            {phases.map((p, i) => {
              const done = i < activeIdx;
              const active = i === activeIdx;
              return (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 h-[18px] px-1.5 rounded-full text-[9.5px] font-medium whitespace-nowrap"
                  style={
                    active
                      ? { background: "#1A1A1A", color: "#FAFAF8" }
                      : done
                        ? { background: "var(--surface-secondary)", color: "var(--text-secondary)" }
                        : { color: "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }
                  }
                >
                  {done && <Check size={8} strokeWidth={2.6} />}
                  {p}
                </span>
              );
            })}
          </div>
          {shownTools.map((name, i) => {
            const last = i === shownTools.length - 1;
            const t = prettyTool(name);
            return (
              <div key={`${name}-${i}`} className="flex items-center gap-2 h-6 text-[11.5px]">
                {last ? (
                  <Cog
                    size={10}
                    strokeWidth={1.8}
                    className="text-text-tertiary animate-spin flex-shrink-0"
                    style={{ animationDuration: "2s" }}
                  />
                ) : (
                  <Check size={10} strokeWidth={2.4} className="text-[#15803D] flex-shrink-0" />
                )}
                <span className={`truncate ${last ? "text-text-secondary" : "text-text-tertiary"}`}>
                  <span className="font-medium">{t.primary}</span>
                  {t.detail && (
                    <>
                      <span className="text-text-tertiary"> · </span>
                      <span>{t.detail}</span>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The Analyst Agent's turn, in its own container. Only named sub-agents (the
 *  Analyst) get a container — Spot is the default voice and stays unmarked, so
 *  the container alone signals "someone other than Spot is talking". A titled
 *  card: agent glyph + name + a quiet note on what it just did in the header,
 *  the finding in the body. No nested cards inside (P: impeccable). */
function AnalystContainer({ note, children }: { note: string; children: ReactNode }) {
  return (
    <div
      className="mb-3 rounded-[16px] overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
        {/* Agent identity — a crafted charcoal mark, distinct from Spot's
            metallic orb. Circular avatar reads as a named sub-agent, not a
            generic icon button. */}
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(160deg, #2B2B28 0%, #161614 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.18)",
          }}
        >
          <BarChart3 size={14} strokeWidth={2} style={{ color: "#F2F1ED" }} />
        </span>
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[13px] font-semibold text-text-primary">Analyst Agent</span>
          <span className="text-[11.5px] text-text-tertiary truncate">{note}</span>
        </span>
        {/* Quiet provenance chip — this write-up came from the always-on agent,
            not from Spot. Restrained: neutral fill, no pulse, no color. */}
        <span
          className="flex-shrink-0 inline-flex items-center gap-1.5 h-[22px] pl-2 pr-2.5 rounded-full"
          style={{ background: "var(--surface-secondary, #F4F4F2)", border: "1px solid var(--border-subtle)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#9B9B9B" }} />
          <span className="text-[10.5px] font-medium text-text-tertiary tracking-wide">Auto</span>
        </span>
      </div>
      <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
        {children}
      </div>
    </div>
  );
}

/** The Analyst Agent's message — it opens the conversation. The container
 *  marks it as the Analyst (not Spot); the body carries the finding. The full
 *  write-up is already open in the Analysis panel on the right, so no inline
 *  pointer. Spot then reads it, thinks, and lands the recommendation in the
 *  next message. */
function AnalystReportPart({ productId }: { productId: string }) {
  const prod = PRODUCTS.find((p) => p.id === productId);
  if (!prod) return null;
  const report = analystReportFor(prod);

  return (
    <AnalystContainer note="Weekly scan · this morning">
      <div className="text-[15px] leading-[1.7] text-text-primary">
        <RichText text={report.opener} />
      </div>
      <div className="mt-3">
        <ArtifactCardPart
          file="analysis"
          title={report.headline}
          subtitle="Full report · Markdown"
          markdown={report.reportMd}
        />
      </div>
    </AnalystContainer>
  );
}

/** The Analyst Agent's review of freshly-imported campaigns — same shape as
 *  AnalystReportPart, but the report is built from the imported campaign set
 *  (not a product in PRODUCTS, since the project may be brand-new). */
function ImportReportPart({
  campaignIds,
  accountId,
  productName,
}: {
  campaignIds: string[];
  accountId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const review = importedReviewFor(campaignIds, accountId, productName);

  return (
    <AnalystContainer note="Reviewed your imported campaigns">
      {/* Finding — the Analyst kicks the conversation off. */}
      <div className="text-[15px] leading-[1.7] text-text-primary">
        <RichText text={review.opener} />
      </div>

      {/* Collapsible report · the markdown file the agent produced. Borderless
          disclosure (no nested card) — a divider + toggle inside the Analyst
          container. */}
      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2.5 text-left group"
        >
          <FileText size={13} strokeWidth={1.8} className="text-text-tertiary flex-shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-[12px] font-medium text-text-primary group-hover:text-text-primary">
              {open ? "Hide the full report" : "Read the full report"}
            </span>
            <span className="block text-[11px] text-text-tertiary truncate">
              {review.headline} · markdown
            </span>
          </span>
          <ChevronDown
            size={15}
            strokeWidth={1.8}
            className={`text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <Markdown source={review.reportMd} />
          </div>
        )}
      </div>
    </AnalystContainer>
  );
}

/** The recommended-action CTA closing an analyst review — kicks off the
 *  matching flow (scale / optimize / test-angles / launch) for the project. */
function AnalystCtaPart({
  flow,
  productId,
  productName,
}: {
  flow: "scale" | "optimize" | "test-angles" | "launch";
  productId: string;
  productName: string;
}) {
  const startScaleFlow = useSpotStore((s) => s.startScaleFlow);
  const startOptimizeFlow = useSpotStore((s) => s.startOptimizeFlow);
  const startTestAnglesFlow = useSpotStore((s) => s.startTestAnglesFlow);
  const startLaunchFlow = useSpotStore((s) => s.startLaunchFlow);
  const rejectRecommendation = useSpotStore((s) => s.rejectRecommendation);
  const resolveCta = useSpotStore((s) => s.resolveCta);
  // Once the user acts, the card morphs into its decided state (no buttons) and
  // stays there. Tracked in ctaResolutions, which survives the flow-start reset
  // of clickedCtas — so accepting doesn't bring the buttons back.
  const sentinel = `analyst-cta:${productId}:${flow}`;
  const resolution = useSpotStore((s) => s.ctaResolutions[sentinel]);
  const go = () => {
    resolveCta(sentinel, "accepted");
    const p = { id: productId, name: productName };
    if (flow === "scale") startScaleFlow(p);
    else if (flow === "optimize") startOptimizeFlow(p);
    else if (flow === "test-angles") startTestAnglesFlow(p);
    else startLaunchFlow(p);
  };
  const reject = () => {
    resolveCta(sentinel, "rejected");
    rejectRecommendation({ flow, productId, productName });
  };
  // The recommendation Spot lands on, phrased as drafting the PLAN — not
  // the live action. Accepting starts Spot working on a plan you approve
  // before anything goes live (the helper line reinforces this).
  const suggestion =
    flow === "scale"
      ? "Create the scaling plan"
      : flow === "optimize"
        ? "Create the optimization plan"
        : flow === "test-angles"
          ? "Draft angles to test"
          : "Plan the campaign launch";

  // Decided state — buttons gone, a quiet status chip carries the user's
  // call. Neutral surface (not a dark primary): the action is already taken,
  // this is a record of it.
  if (resolution) {
    const accepted = resolution === "accepted";
    return (
      <div
        className="mt-2 mb-1 rounded-[14px] px-4 py-3.5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-medium mb-1">
              Spot&rsquo;s recommendation
            </div>
            <div className="text-[16px] font-semibold text-text-primary leading-snug">
              {suggestion}
            </div>
          </div>
          <div
            className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full"
            style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
          >
            {accepted ? (
              <Check size={14} strokeWidth={2} />
            ) : (
              <X size={14} strokeWidth={2} />
            )}
            <span className="text-[12.5px] font-medium">
              {accepted ? "Accepted" : "Rejected"}
            </span>
          </div>
        </div>
      </div>
    );
  }
  // Accept gate, framed as a recommendation card: a quiet kicker, the bold
  // call, the accept button, then the reassurance line. One standardized
  // button; `flow` decides which workflow it kicks off.
  return (
    <div
      className="mt-2 mb-1 rounded-[14px] px-4 py-3.5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-medium mb-1">
            Spot&rsquo;s recommendation
          </div>
          <div className="text-[16px] font-semibold text-text-primary leading-snug">
            {suggestion}
          </div>
          <div className="text-[12px] text-text-tertiary mt-1.5 leading-snug">
            Spot drafts the plan for your review. Nothing goes live yet.
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <RejectButton onClick={reject} />
          <SpotActionButton label="Accept" onClick={go} leadingIcon={Check} trailingIcon={null} />
        </div>
      </div>
    </div>
  );
}

/**
 * DecisionPart · a settled user decision, rendered as a card so it matches the
 * recommendation card's Accepted state. Used for choices that would otherwise
 * land as a raw chat bubble (the clarify picks). Title is the action taken,
 * `items` lists the captured picks, the chip records that it's done.
 */
function DecisionPart({ title, items, chip }: { title: string; items?: string[]; chip?: string }) {
  return (
    <div
      className="mt-2 mb-1 rounded-[14px] px-4 py-3.5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] uppercase tracking-wider text-text-tertiary font-medium mb-1">
            Your call
          </div>
          <div className="text-[16px] font-semibold text-text-primary leading-snug">
            {title}
          </div>
          {items && items.length > 0 && (
            <ul className="mt-2 space-y-1">
              {items.map((it, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] text-text-secondary leading-snug">
                  <span className="text-text-tertiary flex-shrink-0">·</span>
                  <span className="min-w-0">{it}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div
          className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full"
          style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
        >
          <Check size={14} strokeWidth={2} />
          <span className="text-[12.5px] font-medium">{chip ?? "Confirmed"}</span>
        </div>
      </div>
    </div>
  );
}

function PartRenderer({ part, onTextDone }: { part: SpotPart; onTextDone?: () => void }) {
  switch (part.type) {
    case "headline":
      return <HeadlinePart text={part.text} verdict={part.verdict} />;
    case "findings":
      return <FindingsPart items={part.items} />;
    case "kpis":
      return <KpisPart items={part.items} />;
    case "handoff":
      return <HandoffPart kind={part.kind} label={part.label} reason={part.reason} />;
    case "step-cta":
      return <StepCtaPart label={part.label} helper={part.helper} refineHint={part.refineHint} />;
    case "decision":
      return <DecisionPart title={part.title} items={part.items} chip={part.chip} />;
    case "artifact":
      return (
        <ArtifactCardPart
          file={part.file}
          title={part.title}
          subtitle={part.subtitle}
          markdown={part.markdown}
        />
      );
    case "choice":
      return <ChoicePart prompt={part.prompt} options={part.options} />;
    case "import-picker":
      return <ImportPickerPart />;
    case "analyst-report":
      return <AnalystReportPart productId={part.productId} />;
    case "import-report":
      return (
        <ImportReportPart
          campaignIds={part.campaignIds}
          accountId={part.accountId}
          productName={part.productName}
        />
      );
    case "analyst-cta":
      return (
        <AnalystCtaPart
          flow={part.flow}
          productId={part.productId}
          productName={part.productName}
        />
      );
    case "tool-call":
      return <ToolCallPart agent={part.agent} detail={part.detail} status={part.status} />;
    case "ledger":
      return (
        <LedgerPart
          agent={part.agent}
          artifact={part.artifact}
          fromVersion={part.fromVersion}
          toVersion={part.toVersion}
          summary={part.summary}
          changes={part.changes}
          impact={part.impact}
        />
      );
    case "text":
      return (
        <div className="text-[15px] leading-[1.7] text-text-primary mb-2.5">
          <StreamingText text={part.text} onDone={onTextDone} />
        </div>
      );
  }
}

export function MessageBubble({
  message,
  animate,
  onStreamComplete,
}: {
  message: SpotMessage;
  animate?: boolean;
  /** Fires once this message's last streaming text part finishes its
   *  typewriter reveal — or immediately, on mount, if the message has no
   *  streaming text to wait on. Used by the chat page to hold the clarify
   *  questions dock until the intro answer has fully landed. */
  onStreamComplete?: () => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-5">
        <div
          style={{
            background: "var(--chat-user-bg)",
            color: "var(--chat-user-fg)",
            padding: "9px 15px",
            borderRadius: 18,
            borderBottomRightRadius: 6,
            fontSize: 14.5,
            maxWidth: "78%",
            lineHeight: 1.55,
            border: "1px solid var(--spot-card-border)",
          }}
        >
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <SpotMessageBody
      message={message}
      animate={animate}
      onStreamComplete={onStreamComplete}
    />
  );
}

/** Renders one Spot message. Coalesces adjacent tool-call parts into a single
 *  chain-of-thought trace (assistant-ui part-grouping), streams text parts
 *  token-by-token, and holds back anything AFTER the last streaming text part
 *  until that stream finishes — so an action gate never lands under a
 *  half-typed answer. Spot messages render avatar-less, Claude-style; the Spot
 *  mark lives in the chat header, not as a per-message icon. */
function SpotMessageBody({
  message,
  animate,
  onStreamComplete,
}: {
  message: Extract<SpotMessage, { role: "spot" }>;
  animate?: boolean;
  onStreamComplete?: () => void;
}) {
  const parts = message.parts;
  // Index of the last text part — the one that streams. Parts after it are
  // gated until the stream completes.
  let lastTextIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].type === "text") lastTextIdx = i;
  }
  const gates = lastTextIdx >= 0;
  const [streamDone, setStreamDone] = useState(!gates);
  // Reset the gate if the message identity changes (new parts streaming in).
  useEffect(() => {
    setStreamDone(!gates);
  }, [gates, lastTextIdx]);
  // Surface stream completion to the parent. Fires immediately for messages
  // with no streaming text (streamDone starts true), and once the typewriter
  // lands for messages that gate. Kept in an effect so the callback never runs
  // mid-render.
  useEffect(() => {
    if (streamDone) onStreamComplete?.();
    // onStreamComplete is a stable callback from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamDone]);

  const nodes: ReactNode[] = [];
  for (let i = 0; i < parts.length; ) {
    if (parts[i].type === "tool-call") {
      const group: CotStep[] = [];
      const start = i;
      while (i < parts.length && parts[i].type === "tool-call") {
        const tc = parts[i] as Extract<SpotPart, { type: "tool-call" }>;
        group.push({ agent: tc.agent, detail: tc.detail, status: tc.status });
        i++;
      }
      nodes.push(<ChainOfThought key={`cot-${start}`} steps={group} />);
    } else {
      // Hold back parts that follow the streaming answer until it lands.
      if (gates && i > lastTextIdx && !streamDone) {
        i++;
        continue;
      }
      const onDone =
        gates && i === lastTextIdx ? () => setStreamDone(true) : undefined;
      nodes.push(<PartRenderer key={i} part={parts[i]} onTextDone={onDone} />);
      i++;
    }
  }

  return <div className={`${animate ? "fadeUp" : ""} mb-5`}>{nodes}</div>;
}

export function TypingDots() {
  // Use the brand "Spot is typing" dots — three rounded-square pearls
  // in a chat bubble. Stop rendering as soon as Spot's first character
  // streams in (handled by the caller).
  return (
    <div className="mb-2.5">
      <SpotLoader mode="dots" />
    </div>
  );
}
