# Enrichment + CRM integration

Working in the cloned route `/enrichment-crm` (files: `src/components/enrichment-crm/`, `src/lib/enrichment-crm-data.ts`). CRM connection itself is OUT OF SCOPE — assume it is connected, mapped, and authenticated.

---

## What we are adding

Two new flows on top of the existing single + bulk enrichment:

1. **CRM inbound** — leads created in the customer's CRM arrive in our queue, get enriched (per rules), and the enriched fields are written back to the CRM record.
2. **Bulk → push** — existing CSV/XLSX upload. After enrichment finishes, user can push the enriched dataset back into the CRM as new or updated records.

Single enrichment stays as-is. It is a "look up one lead" tool — no CRM round-trip.

---

## Page IA (revised)

```
┌──────────────────────────────────────────────────────────┐
│ Page title:  Enrichment                                  │
│ Subtitle:    (existing copy)                             │
├──────────────────────────────────────────────────────────┤
│ ▸ CRMStatusBanner    Connected to Salesforce · 8m ago    │
│                      [Manage mapping]  [Disconnect]      │
├──────────────────────────────────────────────────────────┤
│ Tabs:   [CRM activity]   [Bulk upload]   [Single lookup] │
│                                                          │
│   ── content for selected tab ──                         │
├──────────────────────────────────────────────────────────┤
│ Enrichment history     (Bulk + Single only)              │
│   Status ▼  Type ▼  Source ▼ (CSV / Manual)  search…     │
└──────────────────────────────────────────────────────────┘
```

- **CRM activity tab** is self-contained — has its own KPIs, chart, and lead-level table. Doesn't feed the bottom history.
- **Bottom history** only shows Bulk + Single runs. Source filter values: `CSV`, `Manual`.
- Bottom history is hidden when the CRM activity tab is active (the activity table is the history for that tab — showing two tables would be noise).
- Tabs replace today's tab-less composer because the three modes have different chrome and would be cramped if stacked.

---

## Tab 1 — CRM activity (read-only visibility)

No rules, no controls, no live stream. This tab tells the customer **what their CRM integration did for them**. Three sections stacked.

### A. KPI strip (top)
4 tiles, time-window selector to the right (Today / 7d / 30d / Custom).

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Incoming │ │ Enriched │ │ Failed   │ │ Pushed   │
│   142    │ │   128    │ │    14    │ │   126    │
│ +18 vs   │ │ 90.1%    │ │ 9.9%     │ │ to CRM   │
│  yest.   │ │ success  │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### B. Daily volume chart
Simple bar/stacked-bar chart, last 14 days. Each day stacked: enriched (green) vs failed (red). Hover shows exact counts.

```
Volume — last 14 days
140 ┤             ▓                ▓
120 ┤  ▓    ▓ ▓ █▓  ▓ ▓ ▓     ▓ ▓ █▓
 80 ┤  █▓ ▓ █ █ █▓  █ █ █ ▓ ▓ █ █ █▓
 40 ┤  █▓ █ █ █ █▓  █ █ █ █ █ █ █ █▓
  0 └──────────────────────────────────
    May 10  ─────────────────  May 23
    ▓ Enriched   █ Failed
```

### C. Lead-level table
The data the customer actually wants — every lead that entered from CRM, what happened to it.

| Entered at | Name | Email / Phone | CRM source | Type | Status | Fields filled | CRM record |
| -- | -- | -- | -- | -- | -- | -- | -- |
| 12:04 | Priya R. | prr@acme.in | Web form | Pro | ✓ Enriched | 11/12 | [Open ↗] |
| 12:04 | Vivek M. | vm@startup.co | API | Pro+Fin | ✓ Enriched | 18/20 | [Open ↗] |
| 12:03 | Anil T. | anil@bigco.com | Web form | Pro | ✗ Failed | 0/12 | [Open ↗] |
| 11:58 | Neha S. | ns@…  | Salesforce | Pro+Fin | ✓ Enriched | 19/20 | [Open ↗] |

- Sortable, paginated.
- Filter row: Status (any/enriched/failed/partial), Type (Pro/Fin/both), CRM source.
- Click any row → existing `RunDrawer` opens with full enriched profile + CRM record link.
- Export CSV button (top right of table).

### Mock data
- Seed `enrichment-crm-data.ts` with ~200 CRM-sourced runs spread across the last 14 days.
- Each: entered timestamp, mock CRM source ("Web form" / "API" / "Salesforce"), enrichment outcome, profile (reuse `sampleProfile` family with variations).
- No simulator, no live feed — static historical view.

---

## Tab 2 — Bulk upload (existing + push step)

Existing composer stays. After a bulk run finishes, the run drawer gains:

```
┌─ Push to CRM ─────────────────────────────────────────┐
│ 482 of 500 rows enriched                              │
│ Destination: Lead (Salesforce) · 12 fields mapped     │
│ Write-back policy: Fill blanks only (set in mapping)  │
│                                                       │
│             [ Push 482 records → CRM ]                │
└───────────────────────────────────────────────────────┘
```

On click: fake a 1.8s push, then per-row status updates in the history row (`pushed: 470, failed: 12`). Failed rows expandable to see reason.

---

## Tab 3 — Single lookup

Unchanged from today. Single is a manual tool, not a CRM workflow. Add one secondary action in the result panel: **"Push to CRM as new lead"** (off by default — user chooses).

---

## History table changes (bottom — Bulk + Single only)

- Scope: only `source: "bulk" | "single"` runs. CRM-sourced runs live exclusively in the CRM activity tab.
- New sub-badge: `CRM sync` (— / synced / failed / pending) — appears when user pushed a Bulk or Single run to CRM.
- Source filter values become `CSV` (= bulk) and `Manual` (= single).
- Hidden entirely when CRM activity tab is active.
- Drawer gets a "CRM sync" section showing record link + push log per row.

---

## Data model additions (`enrichment-crm-data.ts`)

```ts
type RunSource = "single" | "bulk" | "crm";

interface CrmOriginRef {
  provider: "salesforce" | "hubspot" | "pipedrive";
  objectType: "Lead" | "Contact" | "Account";
  recordId: string;
  recordUrl?: string;
}

interface CrmSyncState {
  status: "not_pushed" | "pending" | "synced" | "failed";
  syncedAt?: string;
  pushedRecords?: number;
  failedRecords?: number;
  errorMessage?: string;
}

interface RunRecord {
  // …existing fields…
  source: RunSource;            // add "crm"
  crmOrigin?: CrmOriginRef;     // when source=crm
  crmSync?: CrmSyncState;       // for any run that's been pushed
}

interface CrmConnection {
  provider: "salesforce" | "hubspot" | "pipedrive";
  accountName: string;
  connectedAt: string;
  lastSyncedAt: string;
  status: "connected" | "degraded" | "disconnected";
  mappedFieldCount: number;
}

// Store additions:
// - crmConnection: CrmConnection
// - pushRunToCrm(runId)     // mock 1.8s push, used by bulk + single flows
// (no auto-rules, no simulator — CRM activity is historical/read-only)
```

---

## New components

| File | Purpose |
| -- | -- |
| `crm-status-banner.tsx` | Top banner: provider chip + last sync (no editor — just status) |
| `crm-tabs.tsx` | Tab switcher (CRM activity / Bulk / Single) |
| `crm-activity-kpis.tsx` | 4 KPI tiles + time-window selector |
| `crm-activity-chart.tsx` | 14-day stacked-bar volume chart |
| `crm-activity-table.tsx` | Per-lead activity table with filters + export |
| `crm-push-panel.tsx` | Post-bulk-run "push to CRM" step (policy is read-only) |
| `crm-sync-badge.tsx` | Status pill in history rows |

Run drawer gains a `CrmSyncSection` block — not a new file, inline in `run-drawer.tsx`.

---

## Cross-component events (namespaced)

Already renamed in clone: `enrichment-crm:toast`, `enrichment-crm:open-run`. Add:

- `enrichment-crm:push-complete` — run drawer + history row update

---

## Build order

1. Data model + store mutations + mock connection + seed ~200 historical CRM runs across 14 days.
2. `crm-status-banner` + tab shell + bottom-history scope to bulk/single.
3. CRM Activity tab: KPI tiles → chart → activity table → row drawer wiring.
4. Bulk push panel in run drawer.
5. Single "Push to CRM as new lead" button.
6. Demo polish: failure injection in seed, export CSV, copy.

---

## Decisions (locked)

- KPI default window: **Last 7 days**. User can switch to Today / 30d / Custom.
- Chart shape: **Stacked bars** (enriched green + failed red, 14-day window).
- Bottom history scope: Bulk + Single only.
- Tabs: CRM activity / Bulk upload / Single lookup.

## Out of scope (assumed pre-configured during CRM integration)

- Write-back conflict policy (overwrite vs fill-blanks vs per-field). Set once at integration time, applied silently on every push. No UI surface needed.
- Field mapping. Set once at integration time. We may surface a read-only "view mapping" link from the banner, but no editor.
