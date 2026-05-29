# Empty States — Revspot MVP

## Overview

Empty states are shown across the app when pages have no data — either because the user is new (first-time load) or because search/filter results are empty.

## Demo Toggle

A **"Preview Empty States"** toggle lives in the sidebar (above the user section). Clicking it switches the entire app between populated and empty-data mode — useful for design review and QA.

- **Toggle ON** → all list pages show empty states, dashboard shows placeholder cards
- **Toggle OFF** → normal populated mock data

Implementation: `src/lib/demo-mode.tsx` (React Context), consumed via `useDemoMode()` hook in each page.

---

## Pages with Empty States

### Primary — Empty List Pages

| Page | Route | Illustration | Title | CTA |
|------|-------|-------------|-------|-----|
| Campaigns | `/campaigns` | Megaphone + document | "No campaigns yet" | Create campaign / Import |
| Agents MVP | `/agents-mvp` | Bot with headset | "No agents created" | Create Agent |
| Projects | `/projects` | Folder with plus | "No projects yet" | Create project |
| Leads | `/enquiries` | Inbox with arrow | "No leads yet" | — (passive) |
| Contacts | `/contacts` | People with plus | "No contacts yet" | Import Contacts |
| Creatives | `/creatives` | Image frame (dashed) | "No creatives uploaded" | Upload creative |
| Audiences | `/audiences` | Target circles | "No audiences created" | Create Audience |
| Outreach | `/outreach` | Paper airplane | "No outreach campaigns" | New outreach |
| Sequences | `/workflows` | Connected nodes | "No sequences created" | Create Sequence |

### Secondary — Search/Filter Empty Results

| Page | Title | CTA |
|------|-------|-----|
| Campaigns | "No campaigns match your filters" | Clear filters |
| Leads | "No leads match your filters" | Clear filters |
| Contacts | "No contacts found" | Clear search |
| Creatives | "No creatives match your filters" | Clear filters |

### Tertiary — Dashboard Sections

When empty mode is ON, the dashboard shows:
- Metric cards with "—" values
- Chart area → "Waiting for data"
- Insights → "No insights yet"
- Voice Agent Performance → "No voice agent connected" + Create Agent CTA
- Campaign Performance → "No active campaigns" + Create campaign CTA
- Recently Qualified → "No qualified leads yet"

---

## File Structure

```
src/
├── components/
│   ├── illustrations/
│   │   └── empty-states.tsx      # 12 monochrome SVG illustrations
│   └── layout/
│       └── empty-state.tsx       # Reusable EmptyState component
├── lib/
│   └── demo-mode.tsx             # DemoModeProvider + useDemoMode hook
└── app/(app)/
    └── empty-states/
        └── page.tsx              # Standalone showcase of all empty states
```

## Standalone Showcase

Visit `/empty-states` to see all empty states displayed together in a gallery format — organized by priority (Primary, Secondary, Tertiary) with an illustration gallery at the bottom.

## Design Language

- **Illustrations**: Monochrome line-art SVGs
  - Lines: `#9B9B9B` (primary), `#D4D4D4` (secondary), `#E5E5E5` (tertiary)
  - Fills: `#F5F5F5` (shapes), `#FFFFFF` (highlights)
  - Plus circles: `#9B9B9B` stroke on white fill (for "create" CTAs)
- **Typography**: Uses existing design tokens (`text-card-title`, `text-meta`)
- **Spacing**: `py-20` for full empty states, `py-12` for compact (inside sections)
- **Animation**: Fade-in with 4px upward slide (`framer-motion`)
- **CTAs**: Primary button (accent bg) for main action, secondary (border) for alternatives

## Component API

```tsx
<EmptyState
  illustration={<IllustrationCampaigns />}  // SVG component
  title="No campaigns yet"                   // Bold heading
  description="Create your first campaign."  // Secondary text
  action={<button>Create</button>}           // Optional CTA
  compact                                     // Optional: less padding
/>
```
