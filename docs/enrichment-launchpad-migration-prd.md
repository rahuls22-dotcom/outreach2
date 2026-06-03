# Enrichment → Launchpad PRD

|  |  |
|---|---|
| **Status** | Draft v0.2 |
| **Owner** | Sourabh Nanwani |
| **Last updated** | 27 May 2026 |
| **Parent spec** | Launchpad — Product Consolidation |
| **Engineering Owner** | @Ankit Purohit |
| **Delivery Date** | TBD |

---

## 1. Context & problem

We run three products today:

| Product | Purpose | State |
|---|---|---|
| **Launchpad** | New flagship — projects, campaigns, creatives, audiences | Active development |
| **app.revspot.ai** | Self-serve data + enrichment platform | UX broken, customers unhappy |
| **admin.revspot.ai** | Internal ops console | Active |

**The problem:** maintaining three products is unsustainable. app.revspot's UX is fundamentally broken — customers churn through it, support load is high, and every fix means a parallel design + eng investment that doesn't compound into Launchpad.

**The decision:** sunset app.revspot. Migrate its features into Launchpad one module at a time. Enrichment is the first.

**Why Enrichment first:**
- Most-used module on app.revspot — clearest customer signal
- Self-contained (limited dependencies on other app.revspot screens)
- Already partially scaffolded in Launchpad
- Unblocks killing one of the three products fastest

**Personas affected by the broken status quo:**

| Persona | Detailed problem |
|---|---|
| **Self-serve customer** | Lands on app.revspot, hits broken UX, churns or files tickets |
| **AM** | Has to push customers through a product they're embarrassed by |
| **Ops/Eng** | Splits attention across three codebases, three design systems, three release pipelines |
| **Org** | 3× maintenance cost, no consolidated story for prospects, slow shipping on every product |

---

## 2. Solution overview

Re-implement Enrichment inside Launchpad with no feature regression vs. app.revspot — same flows, same outputs, same data on the user-facing side. Old app's Enrichment goes read-only the day Launchpad's version is GA, fully deprecated 4 weeks later.

- **Sidebar item** under Tools → Enrichment, with two pages: **Dashboard** and **Operations**
- **Operations** has two sub-tabs: **Bulk upload**, **Single lookup**
- **Professional / Financial** enrichment types — pick one or both
- **Dashboard** — KPIs, trend chart, source filter, preset breakdowns, run/lead explorer
- **Push to CRM + downloads** — reuses Launchpad's CRM connections

---

## 3. Users

| User | What they need from V1 | Frequency |
|---|---|---|
| **Self-serve customer (primary)** | A usable enrichment surface that doesn't break trust on first use | Daily |
| **AM** | One product to demo and one URL to send to customers | Daily |
| **Ops/Data** | Bulk-enrich client onboardings without bouncing tools | 2–3× weekly |

---

## 4. Functional requirements

### 4.1 Entry points

| Requirement | Description |
|---|---|
| Sidebar | "Enrichment" item under TOOLS, with children: Dashboard, Operations |
| Empty state | First-time users see brief explainer + sample CSV downloads |
| Demo data toggle | Honors Launchpad's existing Preview-Empty-States toggle |

### 4.2 Operations — Single lookup

| Requirement | Description |
|---|---|
| Type selector | Professional / Financial (one or both) — picks first, drives required inputs |
| Inputs — Professional only | LinkedIn URL **or** Email **or** Phone (any one). LinkedIn strongest; nudge to add it if user typed only Email or Phone. |
| Inputs — Financial only | Name **+** Phone (both required). "Use the exact name registered with the phone number." |
| Inputs — Professional + Financial | Name **+** Phone (required). LinkedIn or Email optional — boosts Professional hit rate. |
| Output | Inline profile card with enriched fields, scoped to selected type(s) |
| Actions | Push to CRM, copy field, view source |

### 4.3 Operations — Bulk upload

| Requirement | Description |
|---|---|
| Upload | CSV with name, phone, email, linkedin columns (any subset) |
| Sample files | Downloadable sample CSV per enrichment type |
| Field mapping | Field mapping view — auto-detects columns, user can override |
| Type selector | Professional / Financial (one or both) — picks first, drives required columns |
| Columns — Professional only | LinkedIn URL **or** Email **or** Phone (any one column mapped). LinkedIn strongest. |
| Columns — Financial only | Name **+** Phone (both columns required). Name must match the one registered with the phone. |
| Columns — Professional + Financial | Name **+** Phone (required). LinkedIn or Email optional — boosts Professional hit rate. |
| Progress | Live counter (X of Y enriched) |
| Run drawer | Per-run detail with status, count, timestamp |
| Outputs | Push to CRM, Download CSV, Download Excel |
| Run history | Past runs listed with status, count, timestamp, re-open drawer |

### 4.4 Dashboard

| Requirement | Description |
|---|---|
| KPI tiles | Total leads, Enriched leads, Enrichment % (with delta vs prev period) |
| Trend chart | Enriched-vs-not over time, scoped to active filters |
| Time filter | Segmented control: 7d / 14d / 30d / 90d / All / Custom — synced across tiles + charts |
| Source filter | Dropdown: All / CRM / Bulk / Single — applies to all charts |
| Preset breakdowns | Company tier, Seniority, Geography, Income range |
| Visualization | Donut for nominal dims, column for ordinal/range dims |
| Lead explorer | Filterable list of enriched leads — Range · Type · Source · Status · search |

### 4.5 Enriched leads table

| Requirement | Description |
|---|---|
| Filters | Range, Type, Source, Status, search |
| KPIs | Computed from the filtered set |
| Row actions | Open lead detail, push to CRM |

---

## 5. Out of scope (V1.1+ roadmap)

| Cut from V1 | Reason | Earliest re-add |
|---|---|---|
| **Audience handoff** | "Build audience from enriched leads" is a natural next step but requires deciding how an enrichment run becomes an Audience source (filters carry-over, schema mapping, refresh semantics). Ship Enrichment standalone first; wire to Audiences once both sides are stable in Launchpad. | V1.1 |
| **Chart builder** ("Create own charts") | Custom dim/filter chart authoring exists in old app. Adds builder surface area + filter-eval complexity. Ship the four presets first; usage tells us which custom dims customers actually want. | V1.1 |
| Saved dashboard views | Dashboard filter persistence beyond session | V1.1 |
| Multi-source enrichment fallback | Vendor cascade if primary returns partial | V1.2 |
| Real-time enrichment via webhook | Auto-enrich every new project lead | V1.2 |
| Enrichment-level A/B (vendor comparison) | Needs eval framework + ground truth | V2 |
| Cohort scoring (lead potential tiers) | Needs labeled outcomes from CRM | V2 |

---

## 6. Success metrics

| Metric | Target by end of V1 |
|---|---|
| Enrichment runs initiated from Launchpad | 100% of new runs |
| app.revspot Enrichment MAU | → 0 within 4 weeks of GA |
| Customer-reported UX tickets on Enrichment | ↓ 80% vs. app.revspot baseline |
| Self-serve customer task completion (upload → download) | ≥ 90% (was: ~60% on app.revspot) |
| New-user discovery (clicks Enrichment in first session) | ≥ 50% |

---

## 7. User stories

### Self-serve customer (primary)

| ID | User story | Acceptance criteria |
|---|---|---|
| **US-01** | As a self-serve customer, I want to enrich a single lead without confusion, so I trust the product on first use. | Single-lookup reachable from Enrichment → Operations in ≤ 2 clicks • Inline result card without reload • Result shows enriched fields • Push-to-CRM CTA on result |
| **US-02** | As a self-serve customer, I want to upload a CSV and get an enriched file back, so I can use it in my outreach. | Drag-drop + click-to-browse upload • Sample CSV per type • Auto column-mapping with manual override • Live progress • CSV + Excel download on completion |
| **US-03** | As a self-serve customer, I want to see the shape of my enriched list, so I know what I'm working with. | Dashboard loads in ≤ 2s • KPI tiles for Total / Enriched / Enrichment % with delta • Preset breakdowns (Company tier, Seniority, Geography, Income range) without configuration • Time filter (7d/14d/30d/90d/All/Custom) + Source filter apply to all tiles + charts |

### AM / Ops

| ID | User story | Acceptance criteria |
|---|---|---|
| **US-04** | As Ops, I want to push enriched leads directly to a client's CRM, so I don't download-then-upload. | "Push to CRM" on every completed bulk run + single lookup • Uses Launchpad's existing connections • Per-lead status visible in run drawer |
| **US-05** | As an AM, I want to re-open a past run, so I can re-download or re-push. | Run history shows past runs with status, count, timestamp, type • Re-open drawer • Download CSV/Excel works for any completed run |

---

## 8. Migration / cutover

| Item | Plan |
|---|---|
| app.revspot Enrichment | Read-only on Launchpad GA, fully deprecated 4 weeks later |
| Past run history | Stays on app.revspot read-only window; not migrated |
| Auth/users | Launchpad workspace + user model |
| Branding/theme | Launchpad theme tokens; no carryover from app.revspot |
| Customer comms | In-app banner on app.revspot pointing to Launchpad; email to existing users |

---

## 9. Open questions

1. Self-serve signup path — do new customers sign up directly into Launchpad on day 1, or still go through app.revspot until GA?
2. Which CRM integrations are mandatory at V1 vs. acceptable to push to V1.1?
3. Credit/billing — surface enrichment credit consumption inline in Launchpad, or roll up under Workspace?
4. Single-lookup — cache results across users in the same workspace?
