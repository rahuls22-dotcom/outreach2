# Revspot — Enrichment Module Extract

Self-contained runnable extract of the enrichment module from
`revspot-mvp-final` (commit reference at the bottom of this file).
Built so you can `npm install && npm run dev` without dragging
in the rest of the app.

Live reference build: <https://revspot-mvp-final-1.vercel.app/enrichment>

## Setup

```bash
npm install
npm run dev
# open http://localhost:3000
```

Root route redirects to `/enrichment`.

## What's in the box

### Routes (under `src/app/(app)/`)

| Route | State |
|---|---|
| `/enrichment` | Default (CRM connected, storage on) |
| `/enrichment/operations` | Bulk + Single composer + CRM activity |
| `/enrichment/database` | Unified enriched-leads table |
| `/enrichment-empty` | Empty / first-run variant |
| `/enrichment-empty/operations` | ↳ |
| `/enrichment-empty/database` | ↳ |
| `/enrichment-crm` | CRM tab focused page |
| `/enrichment-crm-empty` | CRM tab, no connection |

### Demo variants (sidebar picker)

State lives in `src/lib/demo-mode.tsx`. Picker is rendered in the
sidebar (`src/components/layout/sidebar.tsx`) and persists to
localStorage so reload keeps the choice.

| Variant | Flag | Effect |
|---|---|---|
| Populated | `populated` | Full dashboard, leads table, CRM activity, both composers |
| Empty | `isEnrichmentEmpty` | Zero data. Composers visible, history empty, dashboard blank |
| No CRM | `isEnrichmentNoCrm` | CRM banner + connect modal. Drops crm-sourced runs. Bulk + single still active |
| No storage | `isEnrichmentNoStorage` | Slim KPI dashboard. Post-retention summary rows in bulk history. Single tab hidden. Run drawer shows "available for 7 days from enrichment completion" hint |

### Key files to read first

```
src/app/(app)/enrichment/page.tsx            # entry: variant routing + filters
src/components/data/enrichment-dashboard.tsx # dashboard composition
src/components/data/dashboard/                # charts (reliability, trend, donut, hbar, bar)
src/components/data/enriched-leads.tsx       # the leads table (final col spacing)
src/components/enrichment-crm/composer.tsx   # bulk + single composer
src/components/enrichment-crm/run-drawer.tsx # run detail drawer (incl. no-storage hint)
src/components/enrichment-crm/crm-activity.tsx
src/lib/demo-mode.tsx                        # variant flag source
src/lib/enrichment-crm-data.ts               # zustand store
src/lib/dashboard/dim-registry.ts            # chart kind registry (donut|column|hbar)
```

### Chart palette

Muted editorial palette (`src/components/data/dashboard/breakdown-chart-card.tsx`):

```ts
const PALETTE = [
  "#5BA3A3", "#8B9EC7", "#E8927C", "#D4B96A",
  "#A8A29E", "#B8956A", "#94A3B8", "#9985CC",
];
```

Trend chart (Submitted vs Enriched): `#D4B96A` (gold, 0.3 opacity) over
`#5BA3A3` (teal, 0.65 opacity). Source donut: CRM `#8B9EC7`, Bulk
`#5BA3A3`, Single `#9985CC`.

### Adding a new chart card

1. Add the dim to `src/lib/dashboard/dim-registry.ts` (`DIM_REGISTRY`)
2. Add an entry to `CHART_CARD_TO_DIM` + `CHART_CARD_LABEL`
3. Add the id to `ChartCardId` union in `src/lib/dashboard/types.ts`
4. Route it inside `BreakdownChartCard` (`donut` / `hbar` / `column`)
5. Drop it into `src/components/data/dashboard/lead-explorer.tsx` rows

## What was stripped from the parent app

To keep this extract self-contained:

- `Sidebar` replaced with a minimal stub linking only the enrichment routes
- Spot AI panel removed (`spot-root`, `useSpotStore`)
- Plan-mode provider removed
- Workspace switcher removed
- Audiences / Campaigns / Lead profile pages — links from the run drawer
  point to `/audiences?...` which 404s in this extract. Wire your own route
  or remove the CTA in `src/components/enrichment-crm/run-drawer.tsx`.

## Tailwind tokens used

Custom tokens live in `tailwind.config.ts` + `src/app/globals.css`. Important ones:

- Colors: `text-primary`, `text-secondary`, `text-tertiary`, `border`, `border-hover`,
  `surface-secondary`, `accent-hover`, `background`
- Radii: `rounded-card`, `rounded-button`, `rounded-input`
- Type: `text-page-title`, `text-meta`

All of these are CSS variables — see `globals.css` `:root`.

## Tech

- Next 16 (App Router, Turbopack)
- React 19
- Tailwind 3
- Recharts 3
- Zustand 5
- Framer Motion 12
- Base UI (Radix replacement) for menus / popovers
- date-fns for time bucketing

## Source

Generated from `revspot-mvp-final` @ commit `5c40cb5`
on branch `main` at `github.com/ankitpurohit991-ui/revspot-mvp-final`.
