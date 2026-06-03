# Enrichment Migration — app.revspot → launchpad

## Goal

Sunset app.revspot enrichment. Bring same functionality into launchpad using only existing launchpad components. No new functionality. Must look native to launchpad.

## Core rule

**If an element can't justify its need on the screen — it isn't there.**

## What enrichment is

Two enrichment types, picked independently or together:

- **Professional** — name, linkedin, profile_summary, personality, age, age_group, location/state/city/country, employed, professional_level, years_of_experience, job_title, company_name, company_tier, company_industry, university_tier, iit_iim, mba, photo_url, languages.
- **Financial** — credit_limit, credit_utilization, credit_score, total_credit_cards, car_loan_amount, total_cars, home_loan_amount, home_emi, total_home_loans, estimated_yearly_earnings, estimated_lifetime_earnings, annual_earnings_inr_min/max, potential_tier, final_score.

Status fields: `enrichment_status`, `finance_data`, `email_verification_status`, `phone_verification_status`, `valid_indian_name`. `lead_id` passthrough (Salesforce-style).

## Input requirements

- **Professional**: any one of `email` / `phone` / `linkedin_url`. Derivation chain: email → linkedin → professional. phone → email → linkedin → professional. linkedin → professional.
- **Financial**: `phone` + `name` (both required, phone is never derivable, name can be derived from email/linkedin).
- A run can request **both** types from one input set.

## Sidebar placement

- Add **Enrichment** under existing **Tools** section in launchpad sidebar.
- Icon: lucide `UserSearch`.

## Page structure

Single page. Vertical scroll. No tabs, no subpages.

1. **Composer** — pinned top region (not sticky, scrolls with page).
2. **History table** — below composer.

## Composer

### Anatomy (top → bottom, all inside one card)

1. **Type chips** (multi-select): `Professional`, `Financial`. Selecting both = "Both". Mandatory. Submit disabled until ≥1 picked.
2. **Mode toggle**: `Single` | `Bulk`. Default `Bulk` (primary use case).
3. **Cost preview** (live, inline next to mode toggle): "≈ X credits / lead" updates as chips toggle. For bulk after upload: "≈ X credits total (Y leads × Z/lead)".
4. **Sample CSV** link in composer header: "Sample CSV →" — file matches current type pick.
5. **Input zone**:
   - Single → input rows for `email`, `phone`, `linkedin`, `name`. Only rows relevant to picked types render. Soft-degrade hints inline (see validation).
   - Bulk → upload zone (CSV + Excel). Helper line inside upload zone: "First time? Get the sample CSV →" — morphs by type pick.
6. **Confirm columns** step (bulk only, inline expansion after upload — composer grows down). See section below.
7. **Submit button**:
   - Label morphs: `Enrich 1 lead` / `Enrich 1,000 leads` / `Submit (Professional only)` when partial.
   - Disabled until valid.

### Composer state machine

| State | Chips | Mode | Cost preview | Input zone | Confirm columns | Submit |
|---|---|---|---|---|---|---|
| **S0** Initial | visible, none picked | visible, Bulk default | `— credits / lead` (muted, text-3) | hidden | hidden | `Pick type to start`, disabled |
| **S1** Chip picked, no input yet | one+ active | active | live `≈ N credits / lead` | visible (Single: relevant rows / Bulk: upload zone + sample link) | hidden | `Enrich`, disabled until valid input |
| **S2** Bulk file uploaded | active | Bulk | `≈ N credits total (Y leads × Z)` | upload zone shows filename pill + remove × | **visible** (auto-mapped, inline expansion below input zone) | disabled until all required columns mapped |
| **S3** Soft-degrade | both chips active | active | cost shows runnable type only | as S2 | as S2 | `Submit (Professional only)` + inline note `Financial skipped — name column not mapped. [Map name]` |

### Visual grouping (3 zones inside composer card)

- **Intent zone** (top): chips · mode toggle · cost preview · sample link · balance pill — single row, comfortable padding.
- **Work zone** (middle): input rows OR upload zone (+ optional inline column-confirm expansion). Separated from intent by `border-subtle` hairline.
- **Action zone** (bottom): validation notes left-aligned, submit button right-aligned. Separated from work by `border-subtle` hairline.

### Confirm columns (bulk, inline)

After upload, composer expands inline. Shows:

- Auto-detected mapping for required columns (silent detection, no color coding noise).
- One row per required field: `Email`, `Phone`, `LinkedIn URL`, `Name` (only the ones needed for picked types).
- Each row: field label · detected column dropdown · sample value preview.
- User can override any dropdown.
- If a required column can't be mapped: inline note "Financial skipped — name column not mapped. [Map name]" — clicking link opens picker for that field, also updates cost preview live.
- No template saving.

### Validation behavior (soft-degrade)

- **Hard block** only when zero enrichment can run (no valid inputs at all).
- **Otherwise**: submit becomes `Submit (Professional only)` style and shows inline note `Financial skipped — name column not mapped` with [Map name] action link. Cost updates accordingly.

## Single submission flow

1. User picks chips, fills input rows, clicks submit.
2. Result renders **inline below composer** (no drawer for fresh submits).
3. Result component = Profile Card + Raw JSON tabs (both kept from old design).
4. Row appears at top of history.

### Profile Card as shared component

Profile Card + Raw JSON pair built as a **generic shared component** from day 1 (`src/components/lead/lead-profile-card.tsx` or similar), not enrichment-specific. Same component reusable anywhere in launchpad that needs to show a lead profile.

## Bulk submission flow

1. User picks chips, uploads file, confirms columns, clicks submit.
2. Composer resets to empty.
3. Toast: `Bulk run queued. We'll email when done.`
4. New history row appears at top: status `In progress 0%`, leads `0 / 1000`, credits `~150 est. blocked`.
5. Async processing (hours per 1000 rows). Email notification on completion.
6. Error states: row status flips to `Failed` or `Partial`.

## History table

Unified single + bulk. One row per run. Sorted by date desc default.

### Columns

| Column | Bulk (Done) | Bulk (In progress) | Bulk (Failed) | Single |
|---|---|---|---|---|
| **Source** | filename.csv | filename.csv | filename.csv | input value (e.g. email/phone) |
| **Type** | Pro / Fin / Both | same | same | same |
| **Status** | `Done` | `In progress 47%` | `Failed` | `Done` |
| **Leads** | `780 / 1000` (success/total) | `470 / 1000` processed | `0 / 1000` | `1 / 1` |
| **Credits** | `780 charged · 220 refunded` | `~2,000 est. blocked` | `0 charged · 2,000 refunded` | `1 charged` |
| **Date** | timestamp | started ts | failed ts | timestamp |
| **Action** | Download · Build audience · View details | View details (live %) | View details | View profile |

Status enum: `In progress N%` / `Done` / `Failed`. No `Partial` — enrichment is partial-by-nature (50-90% typical), so `Done` means run finished and the success ratio + refund tells the story.

### Status cell rendering

One glance must convey both run state and success rate. Status cell shows pill + muted suffix:

- `In progress`: `info` pill + ` · 47%` (text-2 muted)
- `Done`: `ok` pill + ` · 78%` (text-2 muted) — success rate inline
- `Failed`: `err` pill + small `i` icon. Hover → short error reason. Click row → drawer with full error log.

No color-only encoding (text label always present for a11y).

### Filters

All of: Type (Pro/Fin/Both), Status (Done/In progress/Failed/Partial), Source (Single/Bulk), Date range.

### Sort

Date (desc default), Leads, Credits.

### Search

- Bulk → filename search
- Single → input value search (email/phone/linkedin)

### View details drawer

Side drawer (right). Click `View details` or single result row.

Visual structure (top → bottom):

```
[← Close]
Run #{id} · {filename or input}        [Type chips: Pro Fin]
────────────────────────────────────────────────────────────
STATUS                                  [ok|info|err] pill
Done · 78% success · Started 2h ago · Finished 1m ago

LEADS                                   stat row
780 success · 220 failed · 0 skipped · 1,000 total

CREDITS                                 stat row
2,000 blocked → 780 charged → 220 refunded

[Download CSV] [Download Excel] [Build audience]    primary action row
────────────────────────────────────────────────────────────
ERROR DETAILS  (only when Failed)
Expandable section: error code + message + copy ID + retry (if retryable)
────────────────────────────────────────────────────────────
PROFILE  (single mode only — replaces Leads/Credits sections)
Profile Card + Raw JSON tabs
```

Three labeled stat rows + action row. Mirrors launchpad `metric-card` density.

## Audience handoff (post-bulk completion)

- Completed bulk rows expose `[Build audience]` action alongside `Download` and `View details`.
- Click → routes to `/audiences/new?source=enrichment&runId={id}` (or matching pattern launchpad's audience builder accepts).
- Audience builder opens pre-populated with the enriched lead set as source. `csv_upload` source type on the Audience model already supports this — reuse it (no new source enum).
- Naming default: `Enriched · {filename or input value} · {date}`. User can rename.
- Single-mode results do not get this CTA (1 lead = not an audience).

## Pricing & credits

- Professional = **1 credit** / lead (v1 placeholder). Financial = **1 credit** / lead (v1 placeholder). Real numbers later.
- Both selected = `2 credits` per lead (v1).
- Blocked up front based on lead count + types picked.
- Consumed only on successful enrichment per lead.
- Refunded automatically per failed lead.
- Enrichment is partial-by-nature (50-90% success typical). A run finishing = `Done`, the success/refund breakdown carries the partial reality.
- Visible: row badge `X charged · Y refunded` + full breakdown in details drawer + completion toast.

### Credit balance UX

- **Balance pill** in composer intent zone (top-right): `Balance: 2,450 credits` (text-2, meta size).
- Cost preview compares against balance live. If `estimated > balance`: cost text turns `err` color and submit button labels `Insufficient credits · Top up` (links to credits/billing page; route TBD).
- Submit button always shows total cost suffix: `Enrich 1,000 leads · 2,000 credits`.

## Notifications

- **Email** on bulk completion (required).
- **In-app toast** on bulk submit ("queued") and bulk completion ("done").
- **In-app sidebar badge** on `Enrichment` row when one or more bulk runs finish since last visit. Clears on visit.
- Error states surfaced in row status + toast.

## Empty state

First-time user (zero history) renders launchpad-style `<EmptyState>` below composer:

- Monochrome SVG illustration — new export `IllustrationEnrichment` in `src/components/illustrations/empty-states.tsx`. Concept: magnifying glass (motif from `IllustrationSearchEmpty`) overlaid on faint user silhouette card with data row lines. Palette: #F5F5F5 / #E5E5E5 / #9B9B9B / #0A0A0A (matches existing illustrations exactly).
- Title: "No enrichments yet"
- Description: "Enrich one lead or upload a CSV to enrich up to thousands at once."
- Action: `Download sample CSV` button (primary).

## Accessibility minimum bar

- Composer keyboard-traversable in S0 → S1 → S2 order
- Chips: arrow keys to move focus, space to toggle
- Upload zone: focusable, enter opens file picker, paste/drop supported
- Submit: enter submits when valid
- Inline column-confirm expansion: focus moves to first mapping dropdown when it expands
- After single-mode submit: focus moves to result region, `aria-live=polite` on the result container
- Status pills are not color-only (text label always present)
- Drawer trap focus, escape closes, focus returns to row that opened it

## Components reused from launchpad

To be confirmed by design review, expected reuse list:

- `EmptyState` (`src/components/layout/empty-state.tsx`)
- Existing card / table / drawer / toast / button / input primitives
- lucide icons only

## File outputs

- Input: CSV + Excel
- Output (bulk download): CSV + Excel matching input format
- Output (single): Profile Card UI + Raw JSON tab + download JSON button

## Deferred / not in scope

- Saved column mapping templates
- Mapping color coding
- New functionality beyond what app.revspot enrichment does today
- Tools sidebar group restructure (slot into existing group)
- Cancel in-progress runs
- Additional discoverability entry points outside the sidebar (campaign builder, lead lists, etc.)
- Ambient / auto-enrich on import flows
- Re-enrich stale data

## Open questions (decide later)

- **Pricing finalization** — currently 1 credit Pro + 1 credit Financial v1 placeholder. Real values?
- **Limits** — max rows per bulk, max concurrent runs, file size cap?
- **Migration path** — existing app.revspot enrichment data + users: fresh start or import history?
- **Top-up route** — submit button says `Insufficient credits · Top up` when balance < cost. Where does that link to? (`/billing`? `/credits`? does either exist?)

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | inline (skill load failed, ran framework manually) | Scope & strategy | 1 | DONE | SELECTIVE EXPANSION recommended. Locked: Profile Card as shared component, audience CTA, sidebar completion badge. Open: pricing, limits, migration. |
| Codex Review | not run | Independent 2nd opinion | 0 | — | — |
| Eng Review | not run | Architecture & tests (required) | 0 | — | — |
| Design Review | inline (skill load failed, ran framework manually) | UI/UX gaps | 1 | DONE | 6.3/10. Added: composer state machine, status cell rendering, credit balance UX, drawer visual structure, empty state illustration concept, a11y minimum bar. |

**VERDICT:** READY FOR BUILD pending user sign-off. Eng review optional. Codex review optional.
