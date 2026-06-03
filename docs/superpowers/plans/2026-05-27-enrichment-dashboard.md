# Enrichment Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder at `/enrichment` (the main Enrichment tab) with a two-half dashboard: Revspot reliability (KPIs + stacked-area trend + source donut) on top, configurable lead explorer (filters + saved views + 5 default breakdown cards) on bottom. One page-level time filter scopes everything.

**Architecture:** Pure client-side. Reads from existing `useEnrichmentCrmStore` (Zustand). Flattens runs → per-lead profiles via a shared util (extracted from `enriched-leads.tsx` so both surfaces share filtering logic). Time filter + filter chips + chart cards held as page-level React state; saved views + chart-card configuration persist to `localStorage`. Charts use **recharts** (already a dep). Breakdown cards use plain CSS bars (no chart lib needed for ≤6 rows).

**Tech Stack:** Next.js 16 App Router · TypeScript · Tailwind · Zustand (existing) · Recharts ^3.8.0 (existing) · Lucide icons (existing).

**Verification approach:** This is a frontend prototype with no unit-test framework installed. Each task verifies via:
- `rtk tsc --noEmit` (TypeScript typecheck)
- Inline `node -e` runtime assertions for pure utility functions where stated
- Visual smoke check via `gstack browse` at the end (Task 18)

**Spec:** `docs/superpowers/specs/2026-05-27-enrichment-dashboard-design.md`

---

## File Structure

**New files under `src/lib/dashboard/`:**

| File | Responsibility |
|------|---------------|
| `types.ts` | `LeadProfile`, `FilterClause`, `FilterDim`, `ChartCardId`, `SavedView`, `TimeRange`, `RangeBounds` |
| `dim-registry.ts` | Single source of truth: dimension metadata, value-set buckets, bucketing functions (incl. income brackets) |
| `flatten-leads.ts` | `flattenRunsToLeadProfiles(runs, opts)` — returns `LeadProfile[]` scoped to a time range |
| `filter-eval.ts` | Compile `FilterClause` → predicate; `evalFilters(profile, clauses)` |
| `breakdown.ts` | `breakdownBy(profiles, dim)` → `{ bucket, count, pct }[]` |
| `dashboard-storage.ts` | localStorage I/O for saved views + chart card list |
| `trend-bucketing.ts` | Daily/weekly bucket boundaries for the trend chart |

**New files under `src/components/data/dashboard/`:**

| File | Responsibility |
|------|---------------|
| `dashboard-time-filter.tsx` | Segmented control (7d/14d/30d/90d/All/Custom) + custom popover trigger |
| `reliability-kpis.tsx` | 3 KPI tiles: Enriched / Success rate / Failed |
| `enriched-trend-chart.tsx` | Recharts stacked-area: enriched% vs not-enriched% over time |
| `source-donut.tsx` | Recharts donut + legend (CRM / Bulk / Single) |
| `reliability-section.tsx` | Wraps KPI row + trend + donut |
| `breakdown-chart-card.tsx` | Generic bar-chart card driven by a dim id |
| `add-filter-menu.tsx` | Popover with dim selector + value picker per dim type |
| `lead-filter-bar.tsx` | Active filter chips + "+ Add filter" trigger |
| `saved-views-strip.tsx` | Chip list + save-view modal |
| `lead-match-tile.tsx` | Big count + Build audience CTA |
| `add-chart-card-menu.tsx` | Popover with remaining dims |
| `lead-explorer.tsx` | Wraps filter bar + saved views + match tile + chart grid |
| `enrichment-dashboard.tsx` | Top-level. Page state. Replaces existing placeholder. |

**Modified files:**

- `src/components/data/enrichment-dashboard.tsx` — was a 25-line placeholder; replaced by re-export of the new dashboard root
- `src/components/data/enriched-leads.tsx` — `flattenRunsToLeads` delegates to shared `flattenRunsToLeadProfiles`
- `src/lib/enrichment-crm-data.ts` — no schema changes (new utilities consume existing fields)

---

## Task 1: Scaffold folders + types

**Files:**
- Create: `src/lib/dashboard/types.ts`
- Create: `src/components/data/dashboard/.keep` (empty, to anchor folder)

- [ ] **Step 1: Create dashboard types**

Write `src/lib/dashboard/types.ts`:

```ts
// Shared types for the Enrichment dashboard.
//
// LeadProfile = flat record per enriched lead (one row per CRM hit / single
// lookup / bulk row). Lighter than the existing LeadRow in enriched-leads.tsx
// because the table needs presentation strings while the dashboard only
// needs the enrichment data + a few derived bucket fields.

import type { EnrichedProfile, RunRecord } from "@/lib/enrichment-crm-data";

export interface LeadProfile {
  /** Stable id: `${runId}::${index}` for bulk rows, `runId` for crm/single. */
  id: string;
  runId: string;
  source: RunRecord["source"];
  /** Lead-level outcome derived from (run.status, profile.enrichment_status). */
  status: LeadStatus;
  /** ISO timestamp (run.startedAt for crm/single, run.startedAt + i*1000 for bulk). */
  startedAt: string;
  /** Raw enriched data when available. */
  profile?: EnrichedProfile;
}

export type LeadStatus = "enriched" | "not_enriched" | "failed" | "running";

// ── Time range ────────────────────────────────────────────────────────────

export type TimeRange = "7d" | "14d" | "30d" | "90d" | "all" | "custom";

export interface RangeBounds {
  /** Inclusive lower bound (ms epoch). null = no lower bound. */
  startMs: number | null;
  /** Inclusive upper bound (ms epoch). null = no upper bound. */
  endMs: number | null;
}

// ── Filters ───────────────────────────────────────────────────────────────

export type FilterDim =
  | "source"
  | "location_type"
  | "seniority"
  | "company_tier"
  | "industry"
  | "annual_earnings"
  | "potential_tier"
  | "age_group"
  | "employed"
  | "iit_iim"
  | "mba";

export type FilterOp = "eq" | "in" | "gte" | "lte" | "between";

export interface FilterClause {
  dim: FilterDim;
  op: FilterOp;
  value: string | number | boolean | string[] | [number, number];
}

// ── Chart cards ───────────────────────────────────────────────────────────

export type ChartCardId =
  | "source"
  | "company_tier"
  | "seniority"
  | "geography"
  | "income_range"
  // Optional, addable via + Add chart:
  | "industry"
  | "potential_tier"
  | "age_group"
  | "employed"
  | "iit_iim"
  | "mba";

export const DEFAULT_CHART_CARDS: ChartCardId[] = [
  "source",
  "company_tier",
  "seniority",
  "geography",
  "income_range",
];

// ── Saved views ───────────────────────────────────────────────────────────

export interface SavedView {
  id: string;
  name: string;
  starred?: boolean;
  filters: FilterClause[];
  createdAt: string;
}

// ── Breakdown output ──────────────────────────────────────────────────────

export interface BreakdownRow {
  bucket: string;
  count: number;
  pct: number;
}
```

- [ ] **Step 2: Anchor components folder**

```bash
touch "src/components/data/dashboard/.keep"
```

- [ ] **Step 3: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors (2 pre-existing errors unrelated to this work are tolerated).

- [ ] **Step 4: Commit**

```bash
git add src/lib/dashboard/types.ts src/components/data/dashboard/.keep
git commit -m "feat(dashboard): scaffold types + folders"
```

---

## Task 2: Dim registry (filterable + bucketable dimensions)

**Files:**
- Create: `src/lib/dashboard/dim-registry.ts`

- [ ] **Step 1: Write the registry**

Write `src/lib/dashboard/dim-registry.ts`:

```ts
// Single source of truth for every filter/breakdown dimension.
// One entry = one dim. Each dim knows:
//   - its display label
//   - how to extract a bucket from a LeadProfile (for breakdowns)
//   - its filterable value type (enum / range / bool)
//   - the enum value list (where applicable) for the AddFilterMenu

import type { FilterDim, ChartCardId, LeadProfile } from "./types";

export type DimType = "enum" | "range_money" | "bool";

export interface DimConfig {
  id: FilterDim;
  label: string;
  type: DimType;
  /** Enum dims only: ordered list of bucket labels for breakdowns + filter menu. */
  values?: string[];
  /** Extracts the bucket value from a profile. Returns null when missing. */
  bucket: (p: LeadProfile) => string | null;
  /** Returns numeric value used by range filters. */
  numeric?: (p: LeadProfile) => number | null;
  /** Returns boolean for bool filters. */
  boolean?: (p: LeadProfile) => boolean | null;
}

// Seniority bucketing from raw professional_level strings ("Junior", "Mid",
// "Senior", "Executive", "C-level", etc.) into 4 stable buckets.
function seniorityBucket(level?: string | null): string | null {
  if (!level) return null;
  const l = level.toLowerCase();
  if (/(exec|c-?level|chief|founder|cto|ceo|cfo|coo|vp|head)/.test(l)) return "Exec";
  if (/(senior|staff|principal|lead|director|manager)/.test(l)) return "Senior";
  if (/(mid|associate|engineer ii|engineer iii)/.test(l)) return "Mid";
  if (/(junior|entry|analyst|intern|graduate)/.test(l)) return "Junior";
  // Anything else falls into Mid by default (most enriched levels land here).
  return "Mid";
}

function avgEarnings(p: LeadProfile): number | null {
  const f = p.profile?.financial;
  if (!f) return null;
  const lo = f.annual_earnings_inr_min;
  const hi = f.annual_earnings_inr_max;
  if (typeof lo === "number" && typeof hi === "number") return (lo + hi) / 2;
  if (typeof hi === "number") return hi;
  if (typeof lo === "number") return lo;
  return null;
}

export function incomeBucket(p: LeadProfile): string {
  const v = avgEarnings(p);
  if (v == null) return "Unknown";
  if (v >= 10_000_000) return "> 1Cr";
  if (v >= 5_000_000) return "50L - 1Cr";
  if (v >= 2_500_000) return "25L - 50L";
  return "< 25L";
}

export const INCOME_BUCKETS = ["> 1Cr", "50L - 1Cr", "25L - 50L", "< 25L", "Unknown"];

export const DIM_REGISTRY: Record<FilterDim, DimConfig> = {
  source: {
    id: "source",
    label: "Source",
    type: "enum",
    values: ["CRM", "Bulk", "Single"],
    bucket: (p) => (p.source === "crm" ? "CRM" : p.source === "bulk" ? "Bulk" : "Single"),
  },
  location_type: {
    id: "location_type",
    label: "Geography",
    type: "enum",
    values: ["Metro", "Tier-2", "Tier-3"],
    bucket: (p) => p.profile?.professional?.location_type ?? null,
  },
  seniority: {
    id: "seniority",
    label: "Seniority",
    type: "enum",
    values: ["Exec", "Senior", "Mid", "Junior"],
    bucket: (p) => seniorityBucket(p.profile?.professional?.professional_level),
  },
  company_tier: {
    id: "company_tier",
    label: "Company tier",
    type: "enum",
    values: ["Unicorn", "Mid-Market", "SMB", "Startup"],
    bucket: (p) => p.profile?.professional?.company_tier ?? null,
  },
  industry: {
    id: "industry",
    label: "Industry",
    type: "enum",
    // Values are dynamic — derived from data in the menu. The default list
    // below seeds the picker when no data is present.
    values: ["Fintech", "SaaS", "E-commerce", "Edtech", "Healthcare", "Other"],
    bucket: (p) => p.profile?.professional?.company_industry ?? null,
  },
  annual_earnings: {
    id: "annual_earnings",
    label: "Annual earnings",
    type: "range_money",
    bucket: incomeBucket,
    numeric: avgEarnings,
  },
  potential_tier: {
    id: "potential_tier",
    label: "Potential tier",
    type: "enum",
    values: ["High", "Medium", "Low"],
    bucket: (p) => p.profile?.financial?.potential_tier ?? null,
  },
  age_group: {
    id: "age_group",
    label: "Age",
    type: "enum",
    values: ["18-29", "30-39", "40-49", "50+"],
    bucket: (p) => p.profile?.professional?.age_group ?? null,
  },
  employed: {
    id: "employed",
    label: "Employed",
    type: "bool",
    bucket: (p) => (p.profile?.professional?.employed == null ? null : p.profile.professional.employed ? "Yes" : "No"),
    boolean: (p) => p.profile?.professional?.employed ?? null,
  },
  iit_iim: {
    id: "iit_iim",
    label: "IIT / IIM",
    type: "bool",
    bucket: (p) => (p.profile?.professional?.iit_iim == null ? null : p.profile.professional.iit_iim ? "Yes" : "No"),
    boolean: (p) => p.profile?.professional?.iit_iim ?? null,
  },
  mba: {
    id: "mba",
    label: "MBA",
    type: "bool",
    bucket: (p) => (p.profile?.professional?.mba == null ? null : p.profile.professional.mba ? "Yes" : "No"),
    boolean: (p) => p.profile?.professional?.mba ?? null,
  },
};

// Chart-card id → dim id. Most chart cards map 1:1 to a dim; "geography" maps
// to location_type, "income_range" to annual_earnings.
export const CHART_CARD_TO_DIM: Record<ChartCardId, FilterDim> = {
  source: "source",
  company_tier: "company_tier",
  seniority: "seniority",
  geography: "location_type",
  income_range: "annual_earnings",
  industry: "industry",
  potential_tier: "potential_tier",
  age_group: "age_group",
  employed: "employed",
  iit_iim: "iit_iim",
  mba: "mba",
};

export const CHART_CARD_LABEL: Record<ChartCardId, string> = {
  source: "Source",
  company_tier: "Company tier",
  seniority: "Seniority",
  geography: "Geography",
  income_range: "Income range",
  industry: "Industry",
  potential_tier: "Potential tier",
  age_group: "Age",
  employed: "Employed",
  iit_iim: "IIT / IIM",
  mba: "MBA",
};
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/dashboard/dim-registry.ts
git commit -m "feat(dashboard): dim registry with bucketing functions"
```

---

## Task 3: Flatten util (shared with enriched-leads)

**Files:**
- Create: `src/lib/dashboard/flatten-leads.ts`
- Create: `src/lib/dashboard/trend-bucketing.ts`
- Modify: `src/components/data/enriched-leads.tsx` (delegate to shared util)

- [ ] **Step 1: Write trend-bucketing util**

Write `src/lib/dashboard/trend-bucketing.ts`:

```ts
// Resolve a TimeRange to absolute (startMs, endMs) bounds + pick daily vs
// weekly bucketing for the trend chart.

import type { RangeBounds, TimeRange } from "./types";

export function resolveRange(
  range: TimeRange,
  customStart: Date | null,
  customEnd: Date | null,
  now: number = Date.now(),
): RangeBounds {
  if (range === "all") return { startMs: null, endMs: null };
  if (range === "custom") {
    const s = customStart ? new Date(customStart).setHours(0, 0, 0, 0) : null;
    const e = customEnd ? new Date(customEnd).setHours(23, 59, 59, 999) : null;
    return { startMs: s, endMs: e };
  }
  const days = range === "7d" ? 7 : range === "14d" ? 14 : range === "30d" ? 30 : 90;
  return { startMs: now - days * 86_400_000, endMs: now };
}

export type Bucketing = "daily" | "weekly";

export function pickBucketing(range: TimeRange, bounds: RangeBounds): Bucketing {
  if (range === "7d" || range === "14d" || range === "30d") return "daily";
  if (range === "90d") return "weekly";
  // all + custom: span-based
  if (bounds.startMs != null && bounds.endMs != null) {
    const days = (bounds.endMs - bounds.startMs) / 86_400_000;
    return days >= 90 ? "weekly" : "daily";
  }
  return "weekly";
}

/** Returns the bucket key (YYYY-MM-DD) a timestamp falls into, given a
 *  daily/weekly bucketing scheme. Week buckets start Monday. */
export function bucketKey(ms: number, mode: Bucketing): string {
  const d = new Date(ms);
  if (mode === "daily") {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  // Move back to Monday of the week.
  const dow = (d.getDay() + 6) % 7; // 0 = Mon
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
  return `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
```

- [ ] **Step 2: Write the flatten util**

Write `src/lib/dashboard/flatten-leads.ts`:

```ts
// Flatten the store's RunRecord[] to one LeadProfile per enriched lead.
//
// CRM / Single  → 1 lead per run (uses run.profile)
// Bulk          → 1 lead per row in run.leadsTotal (uses run.leads[i] when
//                 seeded, else synthesizes from CRM_NAMES_POOL — kept in
//                 sync with the per-lead drawer in enriched-leads.tsx)

import {
  CRM_NAMES_POOL,
  sampleProfile,
  type EnrichedProfile,
  type EnrichmentType,
  type RunRecord,
} from "@/lib/enrichment-crm-data";
import type { LeadProfile, LeadStatus, RangeBounds } from "./types";

export interface FlattenOpts {
  bounds?: RangeBounds;
}

export function flattenRunsToLeadProfiles(
  runs: RunRecord[],
  opts: FlattenOpts = {},
): LeadProfile[] {
  const out: LeadProfile[] = [];
  const inRange = (ms: number) => {
    const b = opts.bounds;
    if (!b) return true;
    if (b.startMs != null && ms < b.startMs) return false;
    if (b.endMs != null && ms > b.endMs) return false;
    return true;
  };

  for (const r of runs) {
    if (r.source === "crm" || r.source === "single") {
      const ts = new Date(r.startedAt).getTime();
      if (!inRange(ts)) continue;
      out.push({
        id: r.id,
        runId: r.id,
        source: r.source,
        status: deriveLeadStatus(r),
        startedAt: r.startedAt,
        profile: r.profile,
      });
      continue;
    }

    // Bulk
    const total = r.leadsTotal || 0;
    const success = Math.min(total, r.leadsSuccess || 0);
    const failed = Math.min(total - success, r.leadsFailed || 0);
    const notEnriched = Math.max(0, total - success - failed);
    const seed = hashCode(r.id);
    const renderCap = 200;            // generous enough for dashboard math
    const rowsToRender = Math.min(total, renderCap);

    for (let i = 0; i < rowsToRender; i++) {
      const person = CRM_NAMES_POOL[(seed + i * 7) % CRM_NAMES_POOL.length];
      const ts = new Date(r.startedAt).getTime() + i * 1000;
      if (!inRange(ts)) continue;

      const ratio = total === 0 ? 0 : i / total;
      let status: LeadStatus;
      if (r.status === "in_progress") status = "running";
      else if (r.status === "failed") status = "failed";
      else if (ratio < success / total) status = "enriched";
      else if (ratio < (success + failed) / total) status = "failed";
      else status = notEnriched > 0 ? "not_enriched" : "enriched";

      const seeded = r.leads?.[i];
      const profile: EnrichedProfile | undefined =
        seeded ??
        (status === "failed" || status === "running"
          ? undefined
          : synthBulkProfile({ person, types: r.types, status }));

      out.push({
        id: `${r.id}::${i}`,
        runId: r.id,
        source: "bulk",
        status,
        startedAt: new Date(ts).toISOString(),
        profile,
      });
    }
  }

  return out;
}

function deriveLeadStatus(r: RunRecord): LeadStatus {
  if (r.status === "in_progress") return "running";
  if (r.status === "failed") return "failed";
  const es = r.profile?.enrichment_status;
  if (es === "Zero Enrichment" || !r.profile) return "not_enriched";
  return "enriched";
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function synthBulkProfile(args: {
  person: (typeof CRM_NAMES_POOL)[number];
  types: EnrichmentType[];
  status: LeadStatus;
}): EnrichedProfile {
  const { person, types, status } = args;
  const wantsPro = types.includes("professional");
  const wantsFin = types.includes("financial");
  const isPartial = status === "not_enriched";
  return {
    enrichment_status: isPartial ? "Partial Enrichment" : "Fully Enriched",
    finance_data: wantsFin && !isPartial ? "Available" : "Not Available",
    contact: { name: person.name, email: person.email, phone: person.phone },
    professional:
      wantsPro && !isPartial
        ? {
            ...sampleProfile.professional,
            name: person.name,
            job_title: person.title,
            company_name: person.company,
          }
        : undefined,
    financial: wantsFin && !isPartial ? sampleProfile.financial : undefined,
  };
}
```

- [ ] **Step 3: Smoke-test the flatten util via inline runtime check**

Run:

```bash
node -e "
const path = require('path');
require('ts-node/register/transpile-only');
"
```

If `ts-node` is not installed, skip this step (typecheck below is sufficient).

- [ ] **Step 4: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 5: Refactor enriched-leads.tsx to delegate**

Open `src/components/data/enriched-leads.tsx`. The existing `flattenRunsToLeads` builds presentation strings the table needs (`name`, `subline`, `leadId`, etc.). Leave it in place — DO NOT replace it. The dashboard uses the new `flattenRunsToLeadProfiles` independently. Both functions share the same per-bulk-row indexing scheme (same `hashCode` seed, same `i * 7` formula) so they emit identical profile sets for the same `runs[]`.

Add a brief comment at the top of `flattenRunsToLeads` referencing the new util to prevent drift:

In `src/components/data/enriched-leads.tsx`, replace:

```ts
// ── Flatten runs to per-lead rows ─────────────────────────────────────────

function flattenRunsToLeads(runs: RunRecord[]): LeadRow[] {
```

With:

```ts
// ── Flatten runs to per-lead rows ─────────────────────────────────────────
// NOTE: Indexing scheme (seed=hashCode(run.id), step=i*7) is mirrored in
// src/lib/dashboard/flatten-leads.ts so the dashboard and this table show
// the same set of bulk leads. Keep both in sync.

function flattenRunsToLeads(runs: RunRecord[]): LeadRow[] {
```

- [ ] **Step 6: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/dashboard/trend-bucketing.ts src/lib/dashboard/flatten-leads.ts src/components/data/enriched-leads.tsx
git commit -m "feat(dashboard): shared flatten util + trend bucketing"
```

---

## Task 4: Filter evaluator

**Files:**
- Create: `src/lib/dashboard/filter-eval.ts`

- [ ] **Step 1: Write the evaluator**

Write `src/lib/dashboard/filter-eval.ts`:

```ts
// Compile a FilterClause to a (LeadProfile)→boolean predicate. AND-combine
// multiple clauses with evalFilters().

import { DIM_REGISTRY } from "./dim-registry";
import type { FilterClause, LeadProfile } from "./types";

export function compileFilter(clause: FilterClause): (p: LeadProfile) => boolean {
  const dim = DIM_REGISTRY[clause.dim];
  if (!dim) return () => true;

  switch (clause.op) {
    case "eq": {
      const v = String(clause.value);
      return (p) => dim.bucket(p) === v;
    }
    case "in": {
      const set = new Set((clause.value as string[]).map(String));
      return (p) => {
        const b = dim.bucket(p);
        return b != null && set.has(b);
      };
    }
    case "gte": {
      const v = Number(clause.value);
      return (p) => {
        const n = dim.numeric?.(p);
        return n != null && n >= v;
      };
    }
    case "lte": {
      const v = Number(clause.value);
      return (p) => {
        const n = dim.numeric?.(p);
        return n != null && n <= v;
      };
    }
    case "between": {
      const [lo, hi] = clause.value as [number, number];
      return (p) => {
        const n = dim.numeric?.(p);
        return n != null && n >= lo && n <= hi;
      };
    }
    default:
      return () => true;
  }
}

export function evalFilters(p: LeadProfile, clauses: FilterClause[]): boolean {
  for (const c of clauses) {
    if (!compileFilter(c)(p)) return false;
  }
  return true;
}

// Pretty-print a clause for a chip label.
export function clauseLabel(c: FilterClause): string {
  const dim = DIM_REGISTRY[c.dim];
  const dimLabel = dim?.label ?? c.dim;
  switch (c.op) {
    case "eq":
      return `${dimLabel}: ${c.value}`;
    case "in":
      return `${dimLabel}: ${(c.value as string[]).join(", ")}`;
    case "gte":
      return `${dimLabel} ≥ ${formatNumberInr(c.value as number)}`;
    case "lte":
      return `${dimLabel} ≤ ${formatNumberInr(c.value as number)}`;
    case "between":
      const [lo, hi] = c.value as [number, number];
      return `${dimLabel}: ${formatNumberInr(lo)} – ${formatNumberInr(hi)}`;
  }
}

function formatNumberInr(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(n % 10_000_000 === 0 ? 0 : 1)}Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)}L`;
  return n.toLocaleString("en-IN");
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/dashboard/filter-eval.ts
git commit -m "feat(dashboard): filter evaluator + clause labels"
```

---

## Task 5: Breakdown utility

**Files:**
- Create: `src/lib/dashboard/breakdown.ts`

- [ ] **Step 1: Write the breakdown util**

Write `src/lib/dashboard/breakdown.ts`:

```ts
// Group profiles by a dimension's bucket. Returns sorted rows with counts +
// percentages relative to the input set (NOT all leads — already-filtered).

import { DIM_REGISTRY, INCOME_BUCKETS } from "./dim-registry";
import type { BreakdownRow, ChartCardId, LeadProfile } from "./types";
import { CHART_CARD_TO_DIM } from "./dim-registry";

export function breakdownByCard(
  profiles: LeadProfile[],
  cardId: ChartCardId,
): BreakdownRow[] {
  const dimId = CHART_CARD_TO_DIM[cardId];
  const dim = DIM_REGISTRY[dimId];
  if (!dim) return [];

  const counts = new Map<string, number>();
  for (const p of profiles) {
    const bucket = dim.bucket(p);
    if (bucket == null) continue;
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  const total = profiles.length || 1;
  const rows: BreakdownRow[] = [];

  // Income range gets a fixed bucket order so the bars don't reshuffle on filter.
  if (cardId === "income_range") {
    for (const bucket of INCOME_BUCKETS) {
      const count = counts.get(bucket) ?? 0;
      if (count === 0) continue;
      rows.push({ bucket, count, pct: round1((count / total) * 100) });
    }
    return rows;
  }

  // Enum dims with a declared value order: respect that order.
  if (dim.values) {
    for (const bucket of dim.values) {
      const count = counts.get(bucket);
      if (!count) continue;
      rows.push({ bucket, count, pct: round1((count / total) * 100) });
    }
    // Append any unexpected buckets at the end, descending.
    const seen = new Set(dim.values);
    const extras = [...counts.entries()].filter(([k]) => !seen.has(k));
    extras.sort((a, b) => b[1] - a[1]);
    for (const [bucket, count] of extras) {
      rows.push({ bucket, count, pct: round1((count / total) * 100) });
    }
    return rows;
  }

  // Free-form dims: descending by count.
  const all = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [bucket, count] of all) {
    rows.push({ bucket, count, pct: round1((count / total) * 100) });
  }
  return rows;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/dashboard/breakdown.ts
git commit -m "feat(dashboard): breakdown util"
```

---

## Task 6: Dashboard storage (localStorage)

**Files:**
- Create: `src/lib/dashboard/dashboard-storage.ts`

- [ ] **Step 1: Write the storage layer**

Write `src/lib/dashboard/dashboard-storage.ts`:

```ts
// Versioned localStorage I/O for the dashboard. Holds saved views + chart
// card configuration. Range and active filters are NOT persisted — they
// reset on every page load by design.

import { DEFAULT_CHART_CARDS, type ChartCardId, type SavedView } from "./types";

const STORAGE_KEY = "revspot.dashboard.v1";

interface Persisted {
  v: 1;
  savedViews: SavedView[];
  chartCards: ChartCardId[];
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadDashboardState(): { savedViews: SavedView[]; chartCards: ChartCardId[] } {
  if (!isBrowser()) return { savedViews: [], chartCards: [...DEFAULT_CHART_CARDS] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { savedViews: [], chartCards: [...DEFAULT_CHART_CARDS] };
    const parsed: Persisted = JSON.parse(raw);
    if (parsed.v !== 1) return { savedViews: [], chartCards: [...DEFAULT_CHART_CARDS] };
    return {
      savedViews: Array.isArray(parsed.savedViews) ? parsed.savedViews : [],
      chartCards:
        Array.isArray(parsed.chartCards) && parsed.chartCards.length > 0
          ? parsed.chartCards
          : [...DEFAULT_CHART_CARDS],
    };
  } catch {
    return { savedViews: [], chartCards: [...DEFAULT_CHART_CARDS] };
  }
}

export function saveDashboardState(state: {
  savedViews: SavedView[];
  chartCards: ChartCardId[];
}): void {
  if (!isBrowser()) return;
  try {
    const payload: Persisted = { v: 1, ...state };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or disabled — silently ignore. Dashboard still works in-session.
  }
}

export function newSavedViewId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sv-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/dashboard/dashboard-storage.ts
git commit -m "feat(dashboard): localStorage layer for views + chart cards"
```

---

## Task 7: Time filter component

**Files:**
- Create: `src/components/data/dashboard/dashboard-time-filter.tsx`

- [ ] **Step 1: Write the component**

Write `src/components/data/dashboard/dashboard-time-filter.tsx`:

```tsx
"use client";

// Segmented control: 7d / 14d / 30d / 90d / All / Custom. Reuses the existing
// DateRangePopover for custom ranges.

import { useState } from "react";
import { Calendar } from "lucide-react";
import { DateRangePopover, formatRangeLabel } from "@/components/data/date-range-popover";
import type { TimeRange } from "@/lib/dashboard/types";

interface Props {
  range: TimeRange;
  customStart: Date | null;
  customEnd: Date | null;
  onChange: (range: TimeRange, customStart: Date | null, customEnd: Date | null) => void;
}

const PRESETS: { v: TimeRange; l: string }[] = [
  { v: "7d", l: "7d" },
  { v: "14d", l: "14d" },
  { v: "30d", l: "30d" },
  { v: "90d", l: "90d" },
  { v: "all", l: "All" },
];

export function DashboardTimeFilter({ range, customStart, customEnd, onChange }: Props) {
  const [customOpen, setCustomOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center bg-surface-secondary/60 border border-border rounded-input p-0.5 gap-0.5">
      {PRESETS.map((opt) => {
        const active = opt.v === range;
        return (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v, null, null)}
            className={[
              "h-6 px-2.5 text-[11.5px] font-medium rounded-[5px] transition-colors",
              active
                ? "bg-white text-text-primary shadow-[0_1px_2px_rgba(15,15,15,0.06)]"
                : "text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            {opt.l}
          </button>
        );
      })}

      <button
        onClick={() => setCustomOpen((v) => !v)}
        className={[
          "h-6 inline-flex items-center gap-1 px-2 text-[11.5px] font-medium rounded-[5px] transition-colors",
          range === "custom"
            ? "bg-white text-text-primary shadow-[0_1px_2px_rgba(15,15,15,0.06)]"
            : "text-text-secondary hover:text-text-primary",
        ].join(" ")}
      >
        <Calendar size={11} strokeWidth={1.75} />
        {range === "custom" && customStart && customEnd
          ? formatRangeLabel(customStart, customEnd)
          : "Custom"}
      </button>

      <DateRangePopover
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        initialStart={customStart}
        initialEnd={customEnd}
        onApply={(s, e) => {
          onChange("custom", s, e);
          setCustomOpen(false);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/data/dashboard/dashboard-time-filter.tsx
git commit -m "feat(dashboard): time filter segmented control"
```

---

## Task 8: Reliability KPIs

**Files:**
- Create: `src/components/data/dashboard/reliability-kpis.tsx`

- [ ] **Step 1: Write the component**

Write `src/components/data/dashboard/reliability-kpis.tsx`:

```tsx
"use client";

// Three KPI tiles for the top half:
//   Enriched · Success rate (with delta vs previous period) · Failed

import type { LeadProfile } from "@/lib/dashboard/types";

interface Props {
  /** Profiles already scoped to the active time range. */
  profiles: LeadProfile[];
  /** Profiles from the previous equal-length period, for the success-rate delta. */
  prevProfiles: LeadProfile[];
}

export function ReliabilityKpis({ profiles, prevProfiles }: Props) {
  const stats = computeStats(profiles);
  const prevStats = computeStats(prevProfiles);

  const delta =
    prevStats.attempted === 0
      ? null
      : round1(stats.successRate - prevStats.successRate);

  return (
    <div className="grid grid-cols-3 gap-3 mb-3">
      <Kpi label="Enriched" value={stats.enriched.toLocaleString("en-IN")} />
      <Kpi
        label="Success rate"
        value={`${round1(stats.successRate)}%`}
        delta={delta}
      />
      <Kpi label="Failed" value={stats.failed.toLocaleString("en-IN")} />
    </div>
  );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta?: number | null }) {
  return (
    <div className="bg-white border border-border rounded-card p-4">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary mb-1.5">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-[22px] font-semibold text-text-primary tabular-nums tracking-tight">{value}</div>
        {delta != null && (
          <span
            className={[
              "inline-flex items-center text-[10.5px] font-semibold px-1.5 py-0.5 rounded-badge",
              delta >= 0 ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]",
            ].join(" ")}
          >
            {delta >= 0 ? "+" : ""}{delta} vs prev
          </span>
        )}
      </div>
    </div>
  );
}

interface Stats {
  enriched: number;
  failed: number;
  attempted: number;
  successRate: number;
}

function computeStats(profiles: LeadProfile[]): Stats {
  let enriched = 0;
  let failed = 0;
  for (const p of profiles) {
    if (p.status === "enriched") enriched++;
    else if (p.status === "failed" || p.status === "not_enriched") failed++;
  }
  const attempted = enriched + failed;
  const successRate = attempted === 0 ? 0 : (enriched / attempted) * 100;
  return { enriched, failed, attempted, successRate };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/data/dashboard/reliability-kpis.tsx
git commit -m "feat(dashboard): reliability KPI tiles"
```

---

## Task 9: Enriched-vs-not trend chart (recharts)

**Files:**
- Create: `src/components/data/dashboard/enriched-trend-chart.tsx`

- [ ] **Step 1: Write the chart**

Write `src/components/data/dashboard/enriched-trend-chart.tsx`:

```tsx
"use client";

// Stacked area: % enriched vs % not-enriched/failed over time. Bucketing
// (daily vs weekly) decided by trend-bucketing.pickBucketing().

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { bucketKey, pickBucketing } from "@/lib/dashboard/trend-bucketing";
import type { LeadProfile, RangeBounds, TimeRange } from "@/lib/dashboard/types";

interface Props {
  profiles: LeadProfile[];
  range: TimeRange;
  bounds: RangeBounds;
}

interface TrendPoint {
  bucket: string;
  date: string;
  enriched: number;
  failed: number;
  enrichedPct: number;
  failedPct: number;
}

export function EnrichedTrendChart({ profiles, range, bounds }: Props) {
  const data = useMemo(() => buildTrend(profiles, range, bounds), [profiles, range, bounds]);

  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-[12px] text-text-tertiary">
        No data for this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(15,15,15,0.06)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--color-text-tertiary, #71717a)" }}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 10, fill: "var(--color-text-tertiary, #71717a)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "white",
            border: "1px solid #e5e5e5",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number, name) => [
            `${value}%`,
            name === "enrichedPct" ? "Enriched" : "Not enriched / Failed",
          ]}
          labelFormatter={(label) => label}
        />
        <Area
          type="monotone"
          dataKey="enrichedPct"
          stackId="1"
          stroke="#22C55E"
          fill="#22C55E"
          fillOpacity={0.55}
        />
        <Area
          type="monotone"
          dataKey="failedPct"
          stackId="1"
          stroke="#F59E0B"
          fill="#F59E0B"
          fillOpacity={0.55}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function buildTrend(
  profiles: LeadProfile[],
  range: TimeRange,
  bounds: RangeBounds,
): TrendPoint[] {
  const mode = pickBucketing(range, bounds);
  const byBucket = new Map<string, { enriched: number; failed: number }>();
  for (const p of profiles) {
    const ts = new Date(p.startedAt).getTime();
    if (Number.isNaN(ts)) continue;
    const k = bucketKey(ts, mode);
    let row = byBucket.get(k);
    if (!row) {
      row = { enriched: 0, failed: 0 };
      byBucket.set(k, row);
    }
    if (p.status === "enriched") row.enriched++;
    else if (p.status === "failed" || p.status === "not_enriched") row.failed++;
  }

  const points: TrendPoint[] = [];
  for (const [k, v] of byBucket) {
    const total = v.enriched + v.failed;
    const enrichedPct = total === 0 ? 0 : Math.round((v.enriched / total) * 100);
    const failedPct = total === 0 ? 0 : 100 - enrichedPct;
    points.push({
      bucket: k,
      date: formatBucketLabel(k),
      enriched: v.enriched,
      failed: v.failed,
      enrichedPct,
      failedPct,
    });
  }
  points.sort((a, b) => a.bucket.localeCompare(b.bucket));
  return points;
}

function formatBucketLabel(key: string): string {
  // "2026-05-27" → "May 27"
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/data/dashboard/enriched-trend-chart.tsx
git commit -m "feat(dashboard): enriched-vs-not stacked area trend chart"
```

---

## Task 10: Source donut

**Files:**
- Create: `src/components/data/dashboard/source-donut.tsx`

- [ ] **Step 1: Write the donut**

Write `src/components/data/dashboard/source-donut.tsx`:

```tsx
"use client";

// Donut + side legend for the source split (CRM / Bulk / Single).

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { LeadProfile } from "@/lib/dashboard/types";

interface Props {
  profiles: LeadProfile[];
}

const SOURCE_META = {
  crm: { label: "CRM", color: "#1D4ED8" },
  bulk: { label: "Bulk", color: "#9A3412" },
  single: { label: "Single", color: "#6D28D9" },
} as const;

const ORDER: (keyof typeof SOURCE_META)[] = ["crm", "bulk", "single"];

export function SourceDonut({ profiles }: Props) {
  const counts: Record<keyof typeof SOURCE_META, number> = { crm: 0, bulk: 0, single: 0 };
  for (const p of profiles) counts[p.source]++;
  const total = profiles.length;

  const data = ORDER.map((k) => ({
    name: SOURCE_META[k].label,
    value: counts[k],
    color: SOURCE_META[k].color,
    key: k,
  })).filter((d) => d.value > 0);

  if (total === 0 || data.length === 0) {
    return (
      <div className="h-[140px] flex items-center justify-center text-[12px] text-text-tertiary">
        No data.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[120px] h-[120px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={36}
              outerRadius={56}
              paddingAngle={1}
              stroke="white"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[16px] font-semibold text-text-primary tabular-nums">
            {formatCompact(total)}
          </div>
          <div className="text-[10px] text-text-tertiary uppercase tracking-[0.4px]">total</div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {ORDER.map((k) => {
          const meta = SOURCE_META[k];
          const c = counts[k];
          const pct = total === 0 ? 0 : Math.round((c / total) * 100);
          return (
            <div key={k} className="flex items-center gap-2 text-[12px] py-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="text-text-primary">{meta.label}</span>
              <span className="text-text-tertiary tabular-nums ml-auto">
                {pct}% · {c.toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/data/dashboard/source-donut.tsx
git commit -m "feat(dashboard): source split donut"
```

---

## Task 11: Reliability section wrapper

**Files:**
- Create: `src/components/data/dashboard/reliability-section.tsx`

- [ ] **Step 1: Write the wrapper**

Write `src/components/data/dashboard/reliability-section.tsx`:

```tsx
"use client";

// Top half: section heading + KPI row + (trend | donut) two-column grid.

import { ReliabilityKpis } from "./reliability-kpis";
import { EnrichedTrendChart } from "./enriched-trend-chart";
import { SourceDonut } from "./source-donut";
import type { LeadProfile, RangeBounds, TimeRange } from "@/lib/dashboard/types";

interface Props {
  profiles: LeadProfile[];
  prevProfiles: LeadProfile[];
  range: TimeRange;
  bounds: RangeBounds;
}

export function ReliabilitySection({ profiles, prevProfiles, range, bounds }: Props) {
  return (
    <section className="mb-8">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.4px] text-text-tertiary mb-3">
        How is Revspot doing?
      </h2>

      <ReliabilityKpis profiles={profiles} prevProfiles={prevProfiles} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
        <div className="bg-white border border-border rounded-card p-4">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">
                Enrichment rate
              </div>
              <div className="text-[13px] font-semibold text-text-primary mt-0.5">
                Enriched vs not-enriched
              </div>
            </div>
          </div>
          <EnrichedTrendChart profiles={profiles} range={range} bounds={bounds} />
        </div>

        <div className="bg-white border border-border rounded-card p-4">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">
            Split by source
          </div>
          <div className="text-[13px] font-semibold text-text-primary mt-0.5 mb-3">
            Volume mix
          </div>
          <SourceDonut profiles={profiles} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/data/dashboard/reliability-section.tsx
git commit -m "feat(dashboard): reliability section wrapper"
```

---

## Task 12: Breakdown chart card

**Files:**
- Create: `src/components/data/dashboard/breakdown-chart-card.tsx`

- [ ] **Step 1: Write the card**

Write `src/components/data/dashboard/breakdown-chart-card.tsx`:

```tsx
"use client";

// One card in the breakdown grid. Title + horizontal CSS bars.
// Read-only per design. Hover reveals an X to remove (only for non-default
// cards — caller passes `removable`).

import { X } from "lucide-react";
import { breakdownByCard } from "@/lib/dashboard/breakdown";
import { CHART_CARD_LABEL } from "@/lib/dashboard/dim-registry";
import type { ChartCardId, LeadProfile } from "@/lib/dashboard/types";

interface Props {
  cardId: ChartCardId;
  profiles: LeadProfile[];
  removable?: boolean;
  onRemove?: () => void;
}

export function BreakdownChartCard({ cardId, profiles, removable, onRemove }: Props) {
  const rows = breakdownByCard(profiles, cardId);
  const label = CHART_CARD_LABEL[cardId];

  return (
    <div className="group relative bg-white border border-border rounded-card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">
          {label}
        </div>
        {removable && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${label} card`}
            className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-primary transition-all -mr-1 p-1"
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-[12px] text-text-tertiary py-4">No data for this slice.</div>
      ) : (
        <div className="space-y-1.5">
          {rows.slice(0, 6).map((r) => (
            <div key={r.bucket} className="flex items-center gap-2 text-[11.5px]">
              <div className="w-[88px] flex-shrink-0 text-text-secondary truncate">{r.bucket}</div>
              <div className="flex-1 h-[6px] bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-text-primary rounded-full"
                  style={{ width: `${Math.max(2, r.pct)}%` }}
                />
              </div>
              <div className="w-[40px] text-right tabular-nums text-text-primary">{r.pct}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/data/dashboard/breakdown-chart-card.tsx
git commit -m "feat(dashboard): generic breakdown chart card"
```

---

## Task 13: Filter bar + Add filter menu

**Files:**
- Create: `src/components/data/dashboard/add-filter-menu.tsx`
- Create: `src/components/data/dashboard/lead-filter-bar.tsx`

- [ ] **Step 1: Write the add-filter menu**

Write `src/components/data/dashboard/add-filter-menu.tsx`:

```tsx
"use client";

// Popover invoked from "+ Add filter". Step 1: pick a dimension. Step 2: pick
// values for it (enum: checkbox list; range: min/max inputs; bool: Yes/No).
// Confirms with Apply → returns a new FilterClause to the parent.

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { DIM_REGISTRY } from "@/lib/dashboard/dim-registry";
import type { FilterClause, FilterDim } from "@/lib/dashboard/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (clause: FilterClause) => void;
  /** Dims already in the active filter set — disabled in the picker. */
  activeDims: FilterDim[];
}

export function AddFilterMenu({ open, onClose, onApply, activeDims }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState<"pick-dim" | "pick-value">("pick-dim");
  const [dim, setDim] = useState<FilterDim | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rangeMin, setRangeMin] = useState("");
  const [rangeMax, setRangeMax] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("pick-dim");
      setDim(null);
      setSelected(new Set());
      setRangeMin("");
      setRangeMax("");
      return;
    }
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const pickedDim = dim ? DIM_REGISTRY[dim] : null;

  return (
    <div
      ref={rootRef}
      className="absolute top-full left-0 mt-1 z-30 min-w-[260px] bg-white border border-border rounded-card shadow-[0_8px_24px_rgba(15,15,15,0.08)] overflow-hidden"
    >
      {step === "pick-dim" && (
        <div className="py-1 max-h-[320px] overflow-y-auto">
          {Object.values(DIM_REGISTRY).map((d) => {
            const disabled = activeDims.includes(d.id);
            return (
              <button
                key={d.id}
                disabled={disabled}
                onClick={() => {
                  setDim(d.id);
                  setStep("pick-value");
                }}
                className={[
                  "w-full text-left px-3 py-2 text-[12.5px] flex items-center justify-between gap-3",
                  disabled
                    ? "text-text-tertiary cursor-not-allowed"
                    : "text-text-primary hover:bg-surface-page",
                ].join(" ")}
              >
                <span>{d.label}</span>
                {disabled ? (
                  <span className="text-[10px] text-text-tertiary">in use</span>
                ) : (
                  <ChevronRight size={12} strokeWidth={1.75} className="text-text-tertiary" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {step === "pick-value" && pickedDim && (
        <div className="p-3 w-[260px]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">
              {pickedDim.label}
            </div>
            <button
              onClick={() => setStep("pick-dim")}
              className="text-[11px] text-text-tertiary hover:text-text-primary"
            >
              ← back
            </button>
          </div>

          {pickedDim.type === "enum" && pickedDim.values && (
            <div className="space-y-1 max-h-[200px] overflow-y-auto -mx-1 px-1">
              {pickedDim.values.map((v) => {
                const checked = selected.has(v);
                return (
                  <button
                    key={v}
                    onClick={() => {
                      const next = new Set(selected);
                      if (checked) next.delete(v);
                      else next.add(v);
                      setSelected(next);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[12.5px] rounded-input hover:bg-surface-page"
                  >
                    <span
                      className={[
                        "w-3.5 h-3.5 border rounded-[3px] flex items-center justify-center flex-shrink-0",
                        checked ? "bg-text-primary border-text-primary" : "border-border",
                      ].join(" ")}
                    >
                      {checked && <Check size={9} strokeWidth={3} className="text-white" />}
                    </span>
                    <span className="text-text-primary">{v}</span>
                  </button>
                );
              })}
            </div>
          )}

          {pickedDim.type === "range_money" && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="min (₹)"
                value={rangeMin}
                onChange={(e) => setRangeMin(e.target.value)}
                className="flex-1 h-7 px-2 text-[12px] bg-white border border-border rounded-input"
              />
              <span className="text-text-tertiary text-[11px]">to</span>
              <input
                type="number"
                placeholder="max (₹)"
                value={rangeMax}
                onChange={(e) => setRangeMax(e.target.value)}
                className="flex-1 h-7 px-2 text-[12px] bg-white border border-border rounded-input"
              />
            </div>
          )}

          {pickedDim.type === "bool" && (
            <div className="flex gap-2">
              {["Yes", "No"].map((v) => {
                const checked = selected.has(v);
                return (
                  <button
                    key={v}
                    onClick={() => setSelected(new Set([v]))}
                    className={[
                      "flex-1 h-7 text-[12px] border rounded-input",
                      checked
                        ? "bg-text-primary border-text-primary text-white"
                        : "bg-white border-border text-text-primary",
                    ].join(" ")}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                if (!pickedDim) return;
                let clause: FilterClause | null = null;
                if (pickedDim.type === "enum" && selected.size > 0) {
                  clause = { dim: pickedDim.id, op: "in", value: [...selected] };
                } else if (pickedDim.type === "range_money") {
                  const lo = rangeMin ? Number(rangeMin) : NaN;
                  const hi = rangeMax ? Number(rangeMax) : NaN;
                  if (!Number.isNaN(lo) && !Number.isNaN(hi)) {
                    clause = { dim: pickedDim.id, op: "between", value: [lo, hi] };
                  } else if (!Number.isNaN(lo)) {
                    clause = { dim: pickedDim.id, op: "gte", value: lo };
                  } else if (!Number.isNaN(hi)) {
                    clause = { dim: pickedDim.id, op: "lte", value: hi };
                  }
                } else if (pickedDim.type === "bool" && selected.size > 0) {
                  const val = selected.has("Yes");
                  clause = { dim: pickedDim.id, op: "eq", value: val ? "Yes" : "No" };
                }
                if (clause) {
                  onApply(clause);
                  onClose();
                }
              }}
              className="h-7 px-3 text-[12px] font-medium bg-text-primary text-white rounded-button hover:bg-accent-hover transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write the filter bar**

Write `src/components/data/dashboard/lead-filter-bar.tsx`:

```tsx
"use client";

// Active filter chips + "+ Add filter" launcher. Bar wraps the AddFilterMenu
// popover with `relative` so the menu anchors below the button.

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { clauseLabel } from "@/lib/dashboard/filter-eval";
import type { FilterClause } from "@/lib/dashboard/types";
import { AddFilterMenu } from "./add-filter-menu";

interface Props {
  filters: FilterClause[];
  onChange: (filters: FilterClause[]) => void;
}

export function LeadFilterBar({ filters, onChange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeDims = filters.map((f) => f.dim);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">
        Filters:
      </span>

      {filters.length === 0 && (
        <span className="text-[12px] text-text-secondary">
          None — showing all enriched leads
        </span>
      )}

      {filters.map((c, i) => (
        <span
          key={`${c.dim}-${i}`}
          className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 text-[11.5px] font-medium text-white bg-text-primary rounded-input"
        >
          {clauseLabel(c)}
          <button
            onClick={() => onChange(filters.filter((_, j) => j !== i))}
            aria-label="Remove filter"
            className="p-0.5 -mr-0.5 hover:bg-white/15 rounded-[3px] transition-colors"
          >
            <X size={11} strokeWidth={2} />
          </button>
        </span>
      ))}

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-1 h-7 px-2.5 text-[11.5px] font-medium text-text-secondary bg-white border border-border rounded-input hover:text-text-primary transition-colors"
        >
          <Plus size={11} strokeWidth={2} />
          Add filter
        </button>
        <AddFilterMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeDims={activeDims}
          onApply={(clause) => onChange([...filters, clause])}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/data/dashboard/add-filter-menu.tsx src/components/data/dashboard/lead-filter-bar.tsx
git commit -m "feat(dashboard): filter bar + add-filter menu"
```

---

## Task 14: Saved views strip

**Files:**
- Create: `src/components/data/dashboard/saved-views-strip.tsx`

- [ ] **Step 1: Write the strip**

Write `src/components/data/dashboard/saved-views-strip.tsx`:

```tsx
"use client";

// Chip list of saved views + "Save view" button when filters are dirty.
// Save flow: prompt() for name → emit a new SavedView upward. Persistence
// is handled by the parent's storage layer.

import { Star, Trash2 } from "lucide-react";
import { newSavedViewId } from "@/lib/dashboard/dashboard-storage";
import type { FilterClause, SavedView } from "@/lib/dashboard/types";

interface Props {
  savedViews: SavedView[];
  activeFilters: FilterClause[];
  onApplyView: (view: SavedView) => void;
  onSaveView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  onClearFilters: () => void;
}

export function SavedViewsStrip({
  savedViews,
  activeFilters,
  onApplyView,
  onSaveView,
  onDeleteView,
  onClearFilters,
}: Props) {
  const dirty = activeFilters.length > 0;

  const handleSave = () => {
    const name = window.prompt("Name this view (e.g. Premium Bangalore):");
    if (!name?.trim()) return;
    onSaveView({
      id: newSavedViewId(),
      name: name.trim(),
      filters: [...activeFilters],
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">
        Saved:
      </span>

      <button
        onClick={onClearFilters}
        className={[
          "h-7 px-2.5 text-[11.5px] font-medium rounded-input border transition-colors",
          activeFilters.length === 0
            ? "bg-surface-secondary border-border text-text-primary"
            : "bg-white border-border text-text-secondary hover:text-text-primary",
        ].join(" ")}
      >
        All leads
      </button>

      {savedViews.map((v) => (
        <span
          key={v.id}
          className="group inline-flex items-center h-7 bg-white border border-border rounded-input overflow-hidden"
        >
          <button
            onClick={() => onApplyView(v)}
            className="inline-flex items-center gap-1.5 h-full pl-2.5 pr-1.5 text-[11.5px] font-medium text-text-primary hover:bg-surface-page transition-colors"
          >
            {v.starred && <Star size={10} strokeWidth={2} fill="currentColor" />}
            {v.name}
          </button>
          <button
            onClick={() => onDeleteView(v.id)}
            aria-label={`Delete view ${v.name}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-full px-1.5 border-l border-border text-text-tertiary hover:text-[#991B1B]"
          >
            <Trash2 size={10} strokeWidth={1.75} />
          </button>
        </span>
      ))}

      {dirty && (
        <button
          onClick={handleSave}
          className="h-7 px-2.5 text-[11.5px] font-medium text-text-primary bg-white border border-dashed border-border rounded-input hover:bg-surface-page transition-colors"
        >
          + Save view
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/data/dashboard/saved-views-strip.tsx
git commit -m "feat(dashboard): saved views strip with save/delete"
```

---

## Task 15: Match tile + Build audience CTA

**Files:**
- Create: `src/components/data/dashboard/lead-match-tile.tsx`

- [ ] **Step 1: Write the tile**

Write `src/components/data/dashboard/lead-match-tile.tsx`:

```tsx
"use client";

// Big match count + Build audience action. Navigates to /audiences without
// filter query-params per spec (out of scope for v1).

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  matching: number;
  total: number;
}

export function LeadMatchTile({ matching, total }: Props) {
  const router = useRouter();
  const pct = total === 0 ? 0 : Math.round((matching / total) * 1000) / 10;

  return (
    <div className="bg-white border border-border rounded-card px-5 py-4 flex items-center justify-between">
      <div>
        <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">
          Matching enriched leads
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <div className="text-[26px] font-semibold text-text-primary tabular-nums tracking-tight">
            {matching.toLocaleString("en-IN")}
          </div>
          <div className="text-[12px] text-text-secondary">
            of {total.toLocaleString("en-IN")} · {pct}%
          </div>
        </div>
      </div>

      <button
        disabled={matching === 0}
        onClick={() => router.push("/audiences?source=enrichment")}
        className="inline-flex items-center gap-1.5 h-9 px-4 bg-text-primary text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Build audience
        <ArrowRight size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/data/dashboard/lead-match-tile.tsx
git commit -m "feat(dashboard): match tile + build audience CTA"
```

---

## Task 16: Add chart card menu

**Files:**
- Create: `src/components/data/dashboard/add-chart-card-menu.tsx`

- [ ] **Step 1: Write the menu**

Write `src/components/data/dashboard/add-chart-card-menu.tsx`:

```tsx
"use client";

// Dashed "+ Add chart card" slot at the end of the grid. Click → popover
// listing remaining chart-card ids (those not currently in the user's list).

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { CHART_CARD_LABEL } from "@/lib/dashboard/dim-registry";
import type { ChartCardId } from "@/lib/dashboard/types";

const ALL_CARDS: ChartCardId[] = [
  "source",
  "company_tier",
  "seniority",
  "geography",
  "income_range",
  "industry",
  "potential_tier",
  "age_group",
  "employed",
  "iit_iim",
  "mba",
];

interface Props {
  active: ChartCardId[];
  onAdd: (cardId: ChartCardId) => void;
}

export function AddChartCardMenu({ active, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const remaining = ALL_CARDS.filter((c) => !active.includes(c));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (remaining.length === 0) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full h-full min-h-[120px] border border-dashed border-border rounded-card text-[12px] text-text-secondary hover:text-text-primary hover:border-text-primary/40 transition-colors flex flex-col items-center justify-center gap-1"
      >
        <Plus size={14} strokeWidth={1.75} />
        Add chart card
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-30 min-w-[200px] bg-white border border-border rounded-card shadow-[0_8px_24px_rgba(15,15,15,0.08)] py-1 max-h-[280px] overflow-y-auto">
          {remaining.map((c) => (
            <button
              key={c}
              onClick={() => {
                onAdd(c);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-[12.5px] text-text-primary hover:bg-surface-page"
            >
              {CHART_CARD_LABEL[c]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/data/dashboard/add-chart-card-menu.tsx
git commit -m "feat(dashboard): add-chart-card popover menu"
```

---

## Task 17: Lead explorer assembly

**Files:**
- Create: `src/components/data/dashboard/lead-explorer.tsx`

- [ ] **Step 1: Write the explorer**

Write `src/components/data/dashboard/lead-explorer.tsx`:

```tsx
"use client";

// Bottom half: filter bar + saved views + match tile + chart grid + add slot.
// Owns local UI state for the picker only; filters / savedViews / chartCards
// state lives in the page (so localStorage persistence stays at one level).

import { useMemo } from "react";
import { evalFilters } from "@/lib/dashboard/filter-eval";
import { DEFAULT_CHART_CARDS } from "@/lib/dashboard/types";
import type {
  ChartCardId,
  FilterClause,
  LeadProfile,
  SavedView,
} from "@/lib/dashboard/types";

import { BreakdownChartCard } from "./breakdown-chart-card";
import { LeadFilterBar } from "./lead-filter-bar";
import { SavedViewsStrip } from "./saved-views-strip";
import { LeadMatchTile } from "./lead-match-tile";
import { AddChartCardMenu } from "./add-chart-card-menu";

interface Props {
  profiles: LeadProfile[];
  filters: FilterClause[];
  onFiltersChange: (f: FilterClause[]) => void;
  savedViews: SavedView[];
  onSavedViewsChange: (v: SavedView[]) => void;
  chartCards: ChartCardId[];
  onChartCardsChange: (c: ChartCardId[]) => void;
}

export function LeadExplorer({
  profiles,
  filters,
  onFiltersChange,
  savedViews,
  onSavedViewsChange,
  chartCards,
  onChartCardsChange,
}: Props) {
  const filtered = useMemo(
    () => profiles.filter((p) => evalFilters(p, filters)),
    [profiles, filters],
  );

  return (
    <section>
      <h2 className="text-[11px] font-medium uppercase tracking-[0.4px] text-text-tertiary mb-3">
        Who are your leads?
      </h2>

      {/* Filter row + saved views */}
      <div className="bg-white border border-border rounded-card p-3 mb-3 flex flex-col gap-2.5">
        <LeadFilterBar filters={filters} onChange={onFiltersChange} />
        <div className="border-t border-border-subtle pt-2.5">
          <SavedViewsStrip
            savedViews={savedViews}
            activeFilters={filters}
            onApplyView={(v) => onFiltersChange([...v.filters])}
            onSaveView={(v) => onSavedViewsChange([...savedViews, v])}
            onDeleteView={(id) => onSavedViewsChange(savedViews.filter((s) => s.id !== id))}
            onClearFilters={() => onFiltersChange([])}
          />
        </div>
      </div>

      {/* Match tile */}
      <LeadMatchTile matching={filtered.length} total={profiles.length} />

      {/* Chart grid */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {chartCards.map((cardId) => {
          const isDefault = DEFAULT_CHART_CARDS.includes(cardId);
          return (
            <BreakdownChartCard
              key={cardId}
              cardId={cardId}
              profiles={filtered}
              removable={!isDefault}
              onRemove={() => onChartCardsChange(chartCards.filter((c) => c !== cardId))}
            />
          );
        })}
        <AddChartCardMenu
          active={chartCards}
          onAdd={(c) => onChartCardsChange([...chartCards, c])}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/data/dashboard/lead-explorer.tsx
git commit -m "feat(dashboard): lead explorer assembly"
```

---

## Task 18: Top-level dashboard + replace placeholder

**Files:**
- Create: `src/components/data/dashboard/enrichment-dashboard.tsx`
- Modify: `src/components/data/enrichment-dashboard.tsx` (replace placeholder body with re-export of the new dashboard root)

- [ ] **Step 1: Write the dashboard root**

Write `src/components/data/dashboard/enrichment-dashboard.tsx`:

```tsx
"use client";

// Top-level dashboard for /enrichment. Two halves stacked, single time
// filter at top, two slices of LeadProfile[] in flight at once: the
// active range and the prior-equal-length range (for the success-rate
// delta KPI).

import { useEffect, useMemo, useState } from "react";

import { Sparkles } from "lucide-react";
import { useEnrichmentCrmStore, type RunRecord } from "@/lib/enrichment-crm-data";
import { useDemoMode } from "@/lib/demo-mode";

import { flattenRunsToLeadProfiles } from "@/lib/dashboard/flatten-leads";
import { resolveRange } from "@/lib/dashboard/trend-bucketing";
import { loadDashboardState, saveDashboardState } from "@/lib/dashboard/dashboard-storage";
import { DEFAULT_CHART_CARDS } from "@/lib/dashboard/types";
import type {
  ChartCardId,
  FilterClause,
  LeadProfile,
  SavedView,
  TimeRange,
} from "@/lib/dashboard/types";

import { EmptyState } from "@/components/layout/empty-state";
import { IllustrationEnrichment } from "@/components/illustrations/empty-states";

import { DashboardTimeFilter } from "./dashboard-time-filter";
import { ReliabilitySection } from "./reliability-section";
import { LeadExplorer } from "./lead-explorer";

// Suppress unused param warning on the inherited shell prop signature.
type Props = { onOpenRun?: (r: RunRecord) => void };

export function EnrichmentDashboard(_props: Props) {
  const runs = useEnrichmentCrmStore((s) => s.runs);
  const { isEmpty } = useDemoMode();

  // Page-level state — range/filters do NOT persist, chart cards + saved views DO.
  const [range, setRange] = useState<TimeRange>("30d");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [filters, setFilters] = useState<FilterClause[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [chartCards, setChartCards] = useState<ChartCardId[]>([...DEFAULT_CHART_CARDS]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    const s = loadDashboardState();
    setSavedViews(s.savedViews);
    setChartCards(s.chartCards);
    setHydrated(true);
  }, []);

  // Persist after hydration only — otherwise we'd wipe storage on first render.
  useEffect(() => {
    if (!hydrated) return;
    saveDashboardState({ savedViews, chartCards });
  }, [hydrated, savedViews, chartCards]);

  const bounds = useMemo(
    () => resolveRange(range, customStart, customEnd),
    [range, customStart, customEnd],
  );

  // Previous-period bounds: same length, immediately before the active range.
  const prevBounds = useMemo(() => {
    if (bounds.startMs == null || bounds.endMs == null) {
      return { startMs: null, endMs: null };
    }
    const span = bounds.endMs - bounds.startMs;
    return { startMs: bounds.startMs - span, endMs: bounds.startMs };
  }, [bounds]);

  // Empty-mode override: treat the demo's "empty" state as no runs.
  const effectiveRuns = isEmpty ? [] : runs;

  const profiles: LeadProfile[] = useMemo(
    () => flattenRunsToLeadProfiles(effectiveRuns, { bounds }),
    [effectiveRuns, bounds],
  );
  const prevProfiles: LeadProfile[] = useMemo(
    () => flattenRunsToLeadProfiles(effectiveRuns, { bounds: prevBounds }),
    [effectiveRuns, prevBounds],
  );

  // Time filter is always visible.
  const timeFilter = (
    <DashboardTimeFilter
      range={range}
      customStart={customStart}
      customEnd={customEnd}
      onChange={(r, s, e) => {
        setRange(r);
        setCustomStart(s);
        setCustomEnd(e);
      }}
    />
  );

  // Empty state — no enriched leads in the active range.
  if (profiles.length === 0) {
    const allTime = flattenRunsToLeadProfiles(effectiveRuns);
    const description =
      allTime.length === 0
        ? "Connect your CRM or upload a CSV to start enriching."
        : "No enriched leads in the selected range. Try a wider window.";

    return (
      <div>
        <div className="flex justify-end mb-6">{timeFilter}</div>
        <EmptyState
          illustration={allTime.length === 0 ? <IllustrationEnrichment /> : <Sparkles size={36} strokeWidth={1.25} className="text-text-tertiary" />}
          title={allTime.length === 0 ? "No enriched leads yet" : "No leads in this window"}
          description={description}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-6">{timeFilter}</div>
      <ReliabilitySection
        profiles={profiles}
        prevProfiles={prevProfiles}
        range={range}
        bounds={bounds}
      />
      <LeadExplorer
        profiles={profiles}
        filters={filters}
        onFiltersChange={setFilters}
        savedViews={savedViews}
        onSavedViewsChange={setSavedViews}
        chartCards={chartCards}
        onChartCardsChange={setChartCards}
      />
    </div>
  );
}
```

- [ ] **Step 2: Replace the placeholder**

Open `src/components/data/enrichment-dashboard.tsx`. Replace the ENTIRE file with:

```tsx
"use client";

// Re-export the dashboard root so existing imports
// (`@/components/data/enrichment-dashboard`) keep working.

export { EnrichmentDashboard } from "./dashboard/enrichment-dashboard";
```

- [ ] **Step 3: Typecheck**

```bash
rtk tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/data/dashboard/enrichment-dashboard.tsx src/components/data/enrichment-dashboard.tsx
git commit -m "feat(dashboard): top-level dashboard + replace placeholder"
```

---

## Task 19: Visual smoke verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server in the background**

```bash
cd /Users/sourabhnanwani/Work\ @revspot/revspot-mvp-final && pnpm dev
```

Run via Bash with `run_in_background: true`. Confirm server is listening on `http://localhost:6969`.

- [ ] **Step 2: Open /enrichment in gstack browse**

Setup check:

```bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
B=""
[ -n "$_ROOT" ] && [ -x "$_ROOT/.claude/skills/gstack/browse/dist/browse" ] && B="$_ROOT/.claude/skills/gstack/browse/dist/browse"
[ -z "$B" ] && B=~/.claude/skills/gstack/browse/dist/browse
[ -x "$B" ] && echo "READY: $B" || echo "NEEDS_SETUP"
```

If NEEDS_SETUP: prompt user, then `cd ~/.claude/skills/gstack/browse && ./setup`.

Then navigate + screenshot:

```bash
$B navigate http://localhost:6969/enrichment
$B screenshot --output /tmp/dashboard-30d.png
```

Read the screenshot to confirm:
- Time filter shows in the header row, `30d` selected
- KPI row renders with 3 tiles (Enriched, Success rate, Failed)
- Trend chart renders without overflow
- Source donut renders with 3 legend rows
- Filter row shows "None — showing all enriched leads"
- Saved views shows "All leads" chip
- Match tile shows total count
- 5 default chart cards render with bars
- "+ Add chart card" dashed slot present at end

- [ ] **Step 3: Smoke-check time filter switching**

```bash
$B click "text=7d"
$B screenshot --output /tmp/dashboard-7d.png
$B click "text=All"
$B screenshot --output /tmp/dashboard-all.png
```

Read both screenshots; confirm numbers change and charts re-render.

- [ ] **Step 4: Smoke-check filter chip add/remove**

```bash
$B click "text=Add filter"
$B screenshot --output /tmp/dashboard-filter-menu.png
```

Read the screenshot; confirm dimension list pops below the button.

- [ ] **Step 5: Smoke-check empty mode**

Navigate to the empty variant:

```bash
$B navigate http://localhost:6969/enrichment-empty
$B screenshot --output /tmp/dashboard-empty.png
```

Read the screenshot; confirm EmptyState shows with the "No enriched leads yet" copy.

- [ ] **Step 6: Final typecheck**

```bash
rtk tsc --noEmit
```

Expected: 2 pre-existing errors (unchanged), 0 new errors.

- [ ] **Step 7: Stop dev server**

Stop the background pnpm dev process.

- [ ] **Step 8: Update task #27 → completed**

The TodoWrite task #27 ("Beef up Enrichment Dashboard") is marked completed.

- [ ] **Step 9: Final commit (if any uncommitted changes)**

```bash
git status
```

If clean, skip. If anything dangling, commit with a `chore: dashboard verification` message.

---

## Out of scope (do NOT implement)

- Click bar/slice on a chart card to apply as filter (spec: read-only)
- Pass filters to `/audiences` as query params (spec: out of scope v1)
- Drag-to-reorder chart cards
- Export to PNG/PDF
- Side-by-side period comparison
- Backend-synced dashboard config (localStorage only)
- Click-to-swap a chart card's dim inline
