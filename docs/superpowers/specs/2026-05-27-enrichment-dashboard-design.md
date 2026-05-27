# Enrichment Dashboard — Design

**Date:** 2026-05-27
**Status:** Design — pending approval
**Replaces:** Placeholder at `src/components/data/enrichment-dashboard.tsx`

## Purpose

The Enrichment dashboard is the landing page at `/enrichment`. It answers two questions for a growth / marketing leader who does NOT run enrichment jobs themselves:

1. **Is Revspot working?** — Of the leads I sent, what did you actually enrich? Trend over time?
2. **What do my enriched leads look like?** — Let me slice the data by location, seniority, income, etc.

Not a workspace. Not a launchpad. A read-only "open the app, what should I know" surface.

## Layout

Single column. Page-level time filter at top scopes everything below. Two stacked sections.

```
┌─────────────────────────────────────────────────────────────────┐
│ Enrichment                              [7d 14d 30d 90d All ⋯] │
│ 24,310 enriched leads · CRM, bulk, single                       │
├─────────────────────────────────────────────────────────────────┤
│ HOW IS REVSPOT DOING?                                           │
│ [Enriched]  [Success rate]  [Failed]                            │
│ ┌──── Enriched vs not (stacked area) ────┐ ┌── Source donut ──┐│
│ │                                        │ │ CRM 68%          ││
│ │                                        │ │ Bulk 24%         ││
│ │                                        │ │ Single 8%        ││
│ └────────────────────────────────────────┘ └──────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ WHO ARE YOUR LEADS?                                             │
│ Filters: [Bangalore ×] [Exec ×] [+ Add filter]   Saved: chips   │
│ ┌─ 1,284 matching · 5.3% of 24,310 ───── [→ Build audience] ──┐│
│ └──────────────────────────────────────────────────────────────┘│
│ ┌Source─┐ ┌Co. tier──┐ ┌Seniority┐ ┌Geography┐ ┌Income range┐ │
│ │ bars  │ │  bars    │ │  bars   │ │  bars   │ │   bars     │ │
│ └───────┘ └──────────┘ └─────────┘ └─────────┘ └────────────┘ │
│ [+ Add chart card]                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Sections

### Page header

- **Title:** "Enrichment"
- **Subtitle:** dynamic, `{count} enriched leads · CRM, bulk, single`
- **Right-aligned time filter** (segmented control): `7d / 14d / 30d / 90d / All / Custom`
- Default: `30d`
- Custom opens existing `date-range-popover.tsx`
- State held at the page component; cascades to BOTH sections

### Top half — Reliability

Title: "How is Revspot doing?"

**KPI row (3 tiles, equal width):**

Per-lead status is derived from `(run.status, profile.enrichment_status)`. A failed bulk run with 100 rows produces 100 failed leads.

| Tile | Value | Detail |
|------|-------|--------|
| Enriched | count of leads where `enrichment_status` ∈ {`Fully Enriched`, `Partial Enrichment`} | tabular numerals |
| Success rate | `Enriched / (Enriched + Failed)` as percentage | shows delta vs previous period of same length (e.g., 30d vs prior 30d): `+1.2` green pill or `-1.2` red pill. If prev period has 0 leads, show no delta. |
| Failed | count of leads where `run.status = "failed"` OR `enrichment_status = "Zero Enrichment"` | |

**Trend chart (left, 1.6fr) + Source donut (right, 1fr):**

- **Trend** — Recharts stacked area, Y = % share. Two layers:
  - `Enriched` (green `#34c759`)
  - `Not enriched / Failed` (amber `#ff9f0a`)
  - **Bucketing:** daily for ranges `7d / 14d / 30d`; weekly for `90d`; weekly for `all` when span ≥ 90d, else daily.
  - Tooltip on hover: shows bucket date + counts + percentages
  - X-axis labels: 5 evenly-spaced tick marks across the active range
- **Donut** — Recharts pie with `innerRadius` for donut hole. Slices: CRM (`#1d4ed8`), Bulk (`#9a3412`), Single (`#6d28d9`). Center label: total count. Legend to the right: source label + percent + count.

### Bottom half — Lead Explorer

Title: "Who are your leads?"

#### Filter row

Horizontal flex row, wraps. Contains:

- Active filter chips (each removable via ×)
- "+ Add filter" button — opens a popover menu of available dimensions
- Right-aligned: "Saved:" label + saved-view chips

**Filter dimensions:**

| Dim key | Label | Type | Source field |
|---------|-------|------|--------------|
| `source` | Source | enum (CRM, Bulk, Single) | `run.source` |
| `location` | Location (city) | string (search) | `profile.professional.city` |
| `location_type` | Geography | enum (Metro, Tier-2, Tier-3) | `profile.professional.location_type` |
| `seniority` | Seniority | enum (Exec, Senior, Mid, Junior) | derived from `professional_level` |
| `company_tier` | Company tier | enum (Unicorn, Mid-Market, SMB, Startup) | `profile.professional.company_tier` |
| `industry` | Industry | string (multi-select) | `profile.professional.company_industry` |
| `annual_earnings` | Annual earnings | range (≥ / ≤ INR) | `profile.financial.annual_earnings_inr_*` |
| `potential_tier` | Potential tier | enum (High, Medium, Low) | `profile.financial.potential_tier` |
| `age_group` | Age | enum (18-29 / 30-39 / 40-49 / 50+) | `profile.professional.age_group` |
| `employed` | Employed | bool | `profile.professional.employed` |
| `iit_iim` | IIT/IIM | bool | `profile.professional.iit_iim` |
| `mba` | MBA | bool | `profile.professional.mba` |

A `FilterClause` is `{ dim, op, value }`. All clauses combine with **AND**.

#### Saved views

Strip of chips next to "Saved:" label.

- Always-present: "All leads" (clears filters)
- User can save current filter set via "Save view" button (appears in the filter row when filters are dirty) → modal with name input + optional ★ favorite
- Persist to `localStorage` under key `revspot.dashboard.savedViews.v1`
- Click chip → applies that view's filters
- Right-click / long-press → "Rename" / "Delete"

#### Match tile

Single card spanning full width.

- Left: `label` + count `{matching} matching enriched leads` + subtitle `of {total} · {pct}%`
- Right: primary CTA "Build audience" → navigates to `/audiences` (filter passing out of scope for v1)

#### Chart grid

3-column responsive grid. 5 default cards in this order:

1. **Source** — CRM / Bulk / Single
2. **Company tier** — Unicorn / Mid-Market / SMB / Startup
3. **Seniority** — Exec / Senior / Mid / Junior
4. **Geography** — Metro / Tier-2 / Tier-3 (+ small footer line listing top 4 cities)
5. **Income range** — `>1Cr / 50L-1Cr / 25L-50L / <25L / Unknown`
   - Bucketing input: `(annual_earnings_inr_min + annual_earnings_inr_max) / 2`. Leads without `financial` enrichment fall into `Unknown`.

Each card:

- Title (label, uppercase, tracked-out)
- 3-5 horizontal bar rows: label · track · % value
- Bar fill color: page accent (single hue, since these are read-only)
- Bars are **NOT clickable** — explicitly read-only per design decision

#### + Add chart card

Dashed slot at end of grid. Click → menu listing dimensions not currently shown:

- Industry · Potential tier · Age group · Employed · IIT/IIM · MBA · Engineer

Added cards persist to `localStorage` key `revspot.dashboard.chartCards.v1`.

Each added card gets an "×" remove affordance in the corner (hover-revealed).

## Empty state

If `flattenRunsToLeadProfiles(runs, { range })` returns 0 leads in the active time range:

- Hide both sections (KPIs, charts, explorer)
- Render the existing `EmptyState` component with:
  - `IllustrationEnrichment`
  - title: "No enriched leads yet"
  - description: "Connect your CRM or upload a CSV to start enriching."
  - action: button "Run your first enrichment" → `/enrichment/enrich`

Edge case: if the time range yields 0 but other ranges have data, still show empty state with copy: "No enriched leads in the selected range. Try a wider window."

## State

### Page-level state (component-local)

```ts
type TimeRange = "7d" | "14d" | "30d" | "90d" | "all" | "custom";

interface PageState {
  range: TimeRange;
  customStart: Date | null;
  customEnd: Date | null;
  filters: FilterClause[];
  // localStorage-backed (hydrated on mount)
  savedViews: SavedView[];
  chartCards: ChartCardId[];
}
```

### LocalStorage shape

```ts
// Key: revspot.dashboard.v1
interface DashboardPersistedState {
  savedViews: SavedView[];
  chartCards: ChartCardId[];
  // range / filters NOT persisted — fresh each visit
}

interface SavedView {
  id: string;          // nanoid
  name: string;
  starred?: boolean;
  filters: FilterClause[];
  createdAt: string;
}

type ChartCardId =
  | "source" | "company_tier" | "seniority" | "geography" | "income_range"  // defaults
  | "industry" | "potential_tier" | "age_group" | "employed" | "iit_iim" | "mba" | "engineer";
```

## Components (new)

All under `src/components/data/dashboard/`:

| Component | Purpose |
|-----------|---------|
| `enrichment-dashboard.tsx` | Top-level. Owns page state. Replaces existing placeholder. |
| `dashboard-time-filter.tsx` | Segmented control + custom popover trigger |
| `reliability-section.tsx` | Wraps KPI row + trend + donut |
| `reliability-kpis.tsx` | 3 KPI tiles |
| `enriched-trend-chart.tsx` | Recharts stacked area |
| `source-donut.tsx` | Recharts donut + legend |
| `lead-explorer.tsx` | Wraps filter bar + saved views + match tile + chart grid |
| `lead-filter-bar.tsx` | Active chips + add-filter menu |
| `add-filter-menu.tsx` | Popover with dim selector + value picker per type |
| `saved-views-strip.tsx` | Chip list + save modal |
| `lead-match-tile.tsx` | Big count + Build audience CTA |
| `breakdown-chart-card.tsx` | Generic bar-chart card driven by a dim |
| `add-chart-card-menu.tsx` | Popover with remaining dims |

### Shared utilities

Under `src/lib/dashboard/`:

| File | Exports |
|------|---------|
| `flatten-leads.ts` | `flattenRunsToLeadProfiles(runs, opts)` — **extract from `enriched-leads.tsx`'s existing `flattenRunsToLeads`** so both surfaces share logic. Returns `LeadProfile[]` (lighter than `LeadRow`). |
| `filter-eval.ts` | `FilterClause`, `evalFilters(profile, clauses)`, `compileFilter(clause)` |
| `breakdown.ts` | `breakdownBy(profiles, dim)` → `{ bucket, count, pct }[]` |
| `dim-registry.ts` | Single source of truth: all dims with labels, value sets, bucketing fns |
| `dashboard-storage.ts` | localStorage read/write with versioning |

## Data flow

```
useEnrichmentCrmStore.runs
  └─ flattenRunsToLeadProfiles(runs, { range })  ⟵  scoped by page time filter
       └─ profiles[]
            ├─ Reliability KPIs: count / success rate / failed
            ├─ Trend chart: daily bucket × status
            ├─ Source donut: groupBy(run.source)
            └─ filtered = profiles.filter(evalFilters(filters))
                 ├─ Match tile: filtered.length
                 └─ Chart grid: chartCards.map(id => breakdownBy(filtered, id))
```

## Charts

Use **recharts** (already a dep at `^3.8.0`).

- Trend: `<AreaChart>` with two `<Area stackId="1">` layers. `<CartesianGrid>` light. `<XAxis>` formatted as `MMM d`. `<YAxis>` percentage.
- Donut: `<PieChart>` + `<Pie innerRadius={...} outerRadius={...}>` with `<Cell>` per source.
- Breakdown cards: do NOT use recharts. Pure CSS bars (see `enriched-leads.tsx` patterns) — recharts is overkill for ≤6 rows and recharts donuts are heavier than needed.

## Empty state for individual charts

If a breakdown card has 0 buckets (e.g., filter excludes all data for that dim): show inline "No data for this slice" placeholder inside the card.

## Testing (manual demo verification)

- Smoke: `/enrichment` renders in both connected and empty demo modes
- Time filter: change range → KPIs, trend, donut, match count, all charts re-render
- Filter chips: add via menu → match count drops, chart cards re-bucket
- Saved view: create "Premium Bangalore" → reload page → still in saved chips
- + Add chart: add Industry → reload → still there. Remove → gone after reload.
- Empty state: clear all runs (or pick range with no data) → empty hero shows
- Mobile responsive: chart grid collapses 3-col → 2-col → 1-col

## Out of scope (v1)

- Click bar/slice to apply as filter (locked: read-only)
- Pass filters as query params to `/audiences` on "Build audience" (just navigates)
- Drag-to-reorder chart cards
- Export dashboard as PNG/PDF
- Compare two time ranges side by side
- Per-user dashboard configs synced to a backend (localStorage only — this is a demo)
- Click chart card title to swap its dim inline

## Affected files

**New** (created):

- `src/components/data/dashboard/` (entire folder)
- `src/lib/dashboard/` (entire folder)

**Modified:**

- `src/components/data/enrichment-dashboard.tsx` — replace placeholder body with `<EnrichmentDashboard />` import from new folder
- `src/components/data/enriched-leads.tsx` — refactor `flattenRunsToLeads` to delegate to shared `flattenRunsToLeadProfiles` (preserve `LeadRow` adaptor for table)
- `src/lib/enrichment-crm-data.ts` — no schema changes; existing fields suffice. Add a small helper `bucketIncome(financial)` if not already present.

**Untouched:**

- All other pages, sidebar, routes, audiences

## Risks / open questions

- **Trend chart math at low volume.** With <10 leads/day, daily buckets jump around. Mitigation: aggregate to weekly buckets when range ≥ 90d.
- **Income field availability.** Only leads with `financial` enrichment have earnings data. Bucket = "Unknown" gets its own bar; not hidden.
- **Saved views explosion.** No cap on saved views in v1. UI will scroll horizontally if many. Practical cap ~10.
- **localStorage version migrations.** Use `revspot.dashboard.v1` key so we can ship breaking changes as v2.
