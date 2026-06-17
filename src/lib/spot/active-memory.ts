// ACTIVE MEMORY — a browsable mirror of Spot's real working memory.
//
// Spot's durable memory is file-based: a per-workspace CLAUDE.md that is
// auto-loaded every turn, plus the artefacts and chats behind it. CLAUDE.md
// has four living sections — Summary, Live Campaigns Index, Performance,
// Change History — written via the `update-memory` skill at the end of every
// substantive turn. A freshly-onboarded product has an effectively empty
// file (`[No campaigns yet.]`); the memory is *earned* as campaigns run.
//
// This module reshapes the demo's existing per-product data into that same
// CLAUDE.md shape so the Memory UI can render a faithful mirror — including a
// real empty state for products that haven't shipped a campaign yet. It is a
// pure derivation over PRODUCTS / PRODUCT_PLANS / PERSONAS / performance; no
// new source of truth, no Math.random (ids are deterministic so the demo is
// stable across renders).

import { PRODUCTS, type ProductMemoryEntry } from "../products-data";
import { PERSONAS } from "../personas-data";
import { PRODUCT_PLANS, PLAN_ORIGIN_LABEL, type ProductPlan } from "./extended-flows";
import { memoryFilesFor } from "./memory-files";

/* ────────────────────────────────────────────────────────────────
 * SHAPE — mirrors the four CLAUDE.md sections + the files/chats
 * behind them.
 * ──────────────────────────────────────────────────────────────── */

/** CLAUDE.md · Live Campaigns Index — one running campaign + its id. */
export type ActiveCampaign = {
  /** Stable, human-ish id (e.g. cmp_8f2a). */
  id: string;
  /** "JEE Crack · Engineer Parent". */
  name: string;
  status: "live" | "draft" | "paused";
  /** What the campaign is chasing — the persona's lead desire. */
  objective: string;
  /** Primary channel. */
  channel: string;
};

/** CLAUDE.md · Performance — one current number / baseline. */
export type ActiveMetric = {
  key: string;
  label: string;
  value: string;
  /** % delta vs prior period. */
  delta: number;
  /** If true, ↑ is bad (cost metrics). */
  invertDelta?: boolean;
};

/** CLAUDE.md · Change History — one dated, append-only log line. */
export type ActiveChange = {
  at: string;
  who: string;
  /** Short kind tag — "Brief", "Creative", "Execution"… */
  kind: string;
  entry: string;
};

/** A work-product file behind the memory (the *reasoning*, not just the summary). */
export type ActiveArtefact = {
  name: string;
  /** Faux path under the workspace, e.g. revspot/guyjus-jee/campaign-plan.md. */
  path: string;
  kind: "strategy" | "plan" | "execution" | "export";
  desc: string;
  updatedAt: string;
};

/** A chat thread that fed this memory (all users — not yet user-split). */
export type ActiveChatThread = {
  id: string;
  name: string;
  kind: "campaign" | "am" | "founder" | "internal";
  messages: number;
  lastAt: string;
};

export type ActiveMemory = {
  productId: string;
  /** Has a campaign actually run? Gates the populated vs empty state. */
  onboarded: boolean;
  /** CLAUDE.md · Summary — the state of play, one paragraph. */
  summary: string;
  campaigns: ActiveCampaign[];
  performance: ActiveMetric[];
  /** Newest first. */
  changeHistory: ActiveChange[];
  artefacts: ActiveArtefact[];
  chats: ActiveChatThread[];
};

/* ────────────────────────────────────────────────────────────────
 * HELPERS
 * ──────────────────────────────────────────────────────────────── */

export const CAMPAIGN_STATUS_TONE: Record<ActiveCampaign["status"], string> = {
  live: "pill-ok",
  draft: "pill",
  paused: "pill-warn",
};

export const CAMPAIGN_STATUS_LABEL: Record<ActiveCampaign["status"], string> = {
  live: "Live",
  draft: "Draft",
  paused: "Paused",
};

const MEMORY_KIND_LABEL: Record<ProductMemoryEntry["kind"], string> = {
  brief: "Brief",
  usp: "USP",
  "persona-link": "Persona",
  "creative-feedback": "Creative",
  constraint: "Constraint",
};

/** Deterministic short id — no Math.random so renders are stable. */
function shortId(prefix: string, seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `${prefix}_${h.toString(16).padStart(4, "0").slice(0, 4)}`;
}

function personasForProduct(productId: string) {
  return PERSONAS.filter((p) => p.products.some((x) => x.id === productId));
}

/* ────────────────────────────────────────────────────────────────
 * DERIVATION
 * ──────────────────────────────────────────────────────────────── */

export function activeMemoryFor(productId: string): ActiveMemory | null {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return null;

  const plan: ProductPlan | null =
    PRODUCT_PLANS.find((p) => p.productId === productId) ?? null;
  const files = memoryFilesFor(productId);

  // "Onboarded" = a campaign has actually started running. A drafted-but-
  // not-started plan (currentPhase 0) is still the empty state.
  const onboarded = !!plan && plan.currentPhase > 0;

  const linked = personasForProduct(productId);
  const shortName = product.name.replace(/^Guyju's\s*/i, "").trim() || product.name;

  /* Live Campaigns Index — derived from the personas the product targets. */
  const campaigns: ActiveCampaign[] = onboarded
    ? linked.map((per) => ({
        id: shortId("cmp", productId + per.id),
        name: `${shortName} · ${per.shortLabel}`,
        status: per.status === "researching" ? "draft" : "live",
        objective: per.desire[0] ?? per.pain[0] ?? "",
        channel: per.preferredChannels[0] ?? "Meta",
      }))
    : [];

  /* Performance — current numbers, only once something has spent. */
  const performance: ActiveMetric[] =
    onboarded && files
      ? files.performance.metrics.slice(0, 4).map((m) => ({
          key: m.key,
          label: m.label,
          value: m.value,
          delta: m.delta,
          invertDelta: m.invertDelta,
        }))
      : [];

  /* Summary — the state of play. */
  let summary: string;
  if (onboarded && plan) {
    const live = campaigns.filter((c) => c.status === "live").length;
    summary = `${live} campaign${live === 1 ? "" : "s"} live · ${PLAN_ORIGIN_LABEL[plan.origin]} running (${plan.dayLabel}). ${plan.goal}`;
  } else if (plan) {
    summary = `[No campaigns live yet] · ${PLAN_ORIGIN_LABEL[plan.origin]} drafted but not started. ${plan.goal}`;
  } else {
    summary = `[No campaigns yet] · ${product.name} is onboarded and its strategy is drafted. Active memory fills in automatically once Spot ships the first campaign.`;
  }

  /* Change History — merge product memory + plan history, newest first. */
  const changeHistory: ActiveChange[] = [];
  for (const m of product.memory) {
    changeHistory.push({
      at: m.at,
      who: m.who,
      kind: MEMORY_KIND_LABEL[m.kind] ?? "Note",
      entry: m.summary,
    });
  }
  if (plan) {
    for (const h of plan.history) {
      changeHistory.push({ at: h.at, who: h.who, kind: "Execution", entry: h.entry });
    }
  }
  changeHistory.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  /* Artefacts — gated by how far the product has progressed. */
  const slug = productId.replace(/^prod-/, "");
  const artefacts: ActiveArtefact[] = [
    {
      name: "product-strategy.md",
      path: `revspot/${slug}/product-strategy.md`,
      kind: "strategy",
      desc: "Positioning, ICP and messaging pillars Spot drafted at onboarding.",
      updatedAt: product.updatedAt,
    },
  ];
  if (plan) {
    artefacts.push({
      name: "campaign-plan.md",
      path: `revspot/${slug}/campaign-plan.md`,
      kind: "plan",
      desc: "The approved campaign architecture — audiences, ad sets, budgets.",
      updatedAt: plan.updatedAt,
    });
  }
  if (onboarded && plan) {
    artefacts.push({
      name: "execution-plan.md",
      path: `revspot/${slug}/execution-plan.md`,
      kind: "execution",
      desc: "Live execution checklist — phase decisions and guardrails.",
      updatedAt: plan.updatedAt,
    });
    artefacts.push({
      name: "meta-export.csv",
      path: `revspot/${slug}/exports/meta-export.csv`,
      kind: "export",
      desc: "Raw Meta delivery export — the source numbers behind Performance.",
      updatedAt: plan.updatedAt,
    });
  }

  /* Chats — the conversations that wrote this memory (all users). */
  const chats: ActiveChatThread[] =
    onboarded && plan
      ? [
          {
            id: shortId("th", productId + "campaign"),
            name: `Campaign room · ${shortName}`,
            kind: "campaign",
            messages: 38 + linked.length * 3,
            lastAt: plan.updatedAt,
          },
          {
            id: shortId("th", productId + "am"),
            name: "Account team sync",
            kind: "am",
            messages: 18,
            lastAt: plan.updatedAt,
          },
          {
            id: shortId("th", productId + "founder"),
            name: "Founder review",
            kind: "founder",
            messages: 11,
            lastAt: plan.createdAt,
          },
        ]
      : [
          {
            id: shortId("th", productId + "onboard"),
            name: "Onboarding",
            kind: "internal",
            messages: 6,
            lastAt: product.updatedAt,
          },
        ];

  return { productId, onboarded, summary, campaigns, performance, changeHistory, artefacts, chats };
}

/* ────────────────────────────────────────────────────────────────
 * CLAUDE.md — the same active memory, serialised as the real markdown
 * file Spot keeps per workspace. Four living sections (Summary · Live
 * campaigns · Performance · Change history) plus the Sources behind
 * them. The empty/earned state is encoded in the content itself.
 * ──────────────────────────────────────────────────────────────── */

export function activeMemoryMdFor(productId: string): string | null {
  const mem = activeMemoryFor(productId);
  if (!mem) return null;
  const product = PRODUCTS.find((p) => p.id === productId);
  const name = product?.name ?? "Project";

  let campaignsBlock: string;
  if (mem.campaigns.length === 0) {
    campaignsBlock = mem.onboarded
      ? "_No campaigns running right now._"
      : "No campaign is live yet. Active memory fills in automatically once Spot ships the first campaign — what exists so far is the strategy and the onboarding log.";
  } else {
    const rows = mem.campaigns
      .map(
        (c) =>
          `| ${c.name} | ${CAMPAIGN_STATUS_LABEL[c.status]} | ${c.objective || "—"} | ${c.channel} | \`${c.id}\` |`,
      )
      .join("\n");
    campaignsBlock = `| Campaign | Status | Objective | Channel | ID |\n|----------|--------|-----------|---------|----|\n${rows}`;
  }

  let perfBlock: string;
  if (mem.performance.length === 0) {
    perfBlock = "_Nothing has spent yet — no numbers to steer against._";
  } else {
    const rows = mem.performance
      .map((m) => {
        const d = Math.abs(m.delta);
        const arrow = m.delta === 0 ? "—" : m.delta > 0 ? `↑ ${d}%` : `↓ ${d}%`;
        return `| ${m.label} | ${m.value} | ${arrow} |`;
      })
      .join("\n");
    perfBlock = `| Metric | Value | Δ vs prior |\n|--------|-------|------------|\n${rows}`;
  }

  const historyBlock =
    mem.changeHistory.length === 0
      ? "_No changes logged yet._"
      : mem.changeHistory
          .map((h) => `- **${h.at} · ${h.who}** · _${h.kind}_ — ${h.entry}`)
          .join("\n");

  const artefacts = mem.artefacts
    .map((a) => `- \`${a.path}\` — ${a.desc} _(updated ${a.updatedAt})_`)
    .join("\n");
  const chats = mem.chats
    .map((t) => `- ${t.name} — ${t.kind} · ${t.messages} messages · ${t.lastAt}`)
    .join("\n");

  return `# ${name} · working memory

_CLAUDE.md · auto-loaded every turn · written back after each substantive turn_

${mem.summary}

## Live campaigns

${campaignsBlock}

## Performance

${perfBlock}

## Change history

Append-only — newest first.

${historyBlock}

## Sources

The files and conversations this memory was written from.

**Artefacts**

${artefacts}

**Conversations** _(all users · not yet separated)_

${chats}
`;
}
