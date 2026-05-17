# Multi-workspace + admin dashboard

## What's in this build

### Data model
- **3 workspaces** (`src/lib/workspace-data.ts`):
  - **Godrej South** (Bangalore · Hyderabad, 8 members) — Banerghatta, Kukatpally
  - **Godrej NCR** (Delhi · Gurugram, 5 members) — Arden
  - **Godrej MMR** (Mumbai · Pune, 9 members) — Reserve, Varanya
- **4 users**: 1 admin (Priya Mehra, Head of Marketing) and 3 regional leads.
- Every `ProjectDetail` now carries a `workspaceId` so it can be filtered.

### State
- `useWorkspaceStore` (`src/lib/workspace-store.ts`) — current user, current scope (specific workspace id or "all"), persisted in `localStorage`.
- Members can never escape their default workspace; if their scope ever ends up "all", the selector clamps it back.
- Demo helper `setDemoRole("admin" | "member")` flips between the two views — wired to a small pill in the user card.

### Workspace switcher (sidebar)
- Replaces the old logo header. Shows the active workspace's mark + name + region with a chevron.
- Popover lists every workspace the user can access, each with a small KPI subline (`N projects · M members`). Active row has a checkmark.
- Admins get a separate "All workspaces" row at the top of the popover (with an Admin pill), which jumps to `/admin`.
- A "Workspace settings" link sits at the bottom as a placeholder.

### Projects page now filters by scope
- When scope = a specific workspace → only that workspace's projects.
- When scope = "all" (admin) → every project.
- Header shows the current scope label ("Godrej South · Lead Generation" or "All workspaces · Lead Generation").
- The Spot ambient strip text is generic enough to make sense in both views.

### Admin dashboard `/admin`
- Members are redirected to `/projects` (server-side check on render).
- Top KPI strip: portfolio spend, total leads, verified leads + rate, portfolio CPVL, goal progress %.
- "By workspace" stack: one card per workspace with name, pace pill, members + project count, then 5 columns (spend, total leads, verified+rate, qualified, goal progress). Click a card → switches scope to that workspace and routes to `/projects`.
- Spot "cross-workspace read" callout + scoped chip questions.
- Team access card with a placeholder "Manage members" CTA.

### Spot palette is workspace-aware
- `Switch workspace` section between `Ask Spot` and `Go to`.
- Admins see an "All workspaces" entry as the first item in that section.
- Selecting a workspace from the palette updates scope and routes appropriately.

### Project renames
- `godrej-aristocrat` → `godrej-banerghatta` (id + display name); micromarket adjusted to Bangalore South.
- `godrej-splendour` → `godrej-kukatpally`; micromarket adjusted to Hyderabad West.
- 3 new lightweight project entries (Arden, Reserve, Varanya) — no rich personas/angles yet, but valid goal + brief + secondary metrics so they render in the admin dashboard.
- All narrative references in Spot replies and project data also updated.

## What I'd suggest for follow-up

These were called out in the planning notes (`/tmp/godrej-handoff-notes/workspaces-plan.md`) but not built — flagging here so they don't get lost:

1. **Workspace settings page** — members, default brand inheritance, default channel preferences, RERA disclaimers, monthly budget cap.
2. **Cross-workspace experiments library** — winning experiments in one workspace surfaced as "worth trying" to another. Spot can propose: "this hook worked in MMR, try it in South?"
3. **Workspace-aware Spot reply branches** — Spot needs a new "org" scope so questions like "compare South vs MMR" or "find winning creatives across regions" produce cross-workspace answers, not single-project ones.
4. **Notification fanout** — alerts route to workspace owners; admin sees a consolidated weekly digest.
5. **Activity log per workspace** — deployments, persona changes, experiment outcomes (audit trail for admins).
6. **Budget governance** — admin sets monthly cap per workspace; the workspace can't deploy past that without admin approval. Surface a "Pending admin approval" state on the deploy page.
7. **Workspace-level brand overrides** — each region keeps the master brand book but can override copy variants (e.g. MMR uses "Pune East" not "Whitefield" in hooks).
8. **Admin export** — CSV / PDF report of cross-workspace performance, schedulable via Spot.
9. **SSO + SCIM provisioning** for the real production rollout — Okta / Microsoft Entra.
10. **Keyboard shortcut for workspace switcher** — e.g. ⌘O to open it, then ↑↓ to pick.
11. **Audit who's switching scopes** — if an admin is acting "as" a workspace, mark actions as `via Priya Mehra (Admin)` so workspace members know.
12. **Per-workspace Spot autonomy preferences** — South may want "alert only", MMR may want "auto-pause underperformers" once we add that capability.
