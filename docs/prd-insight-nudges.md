# PRD — Insight Nudges (Campaign Detail Home + Diagnosis)

**Status**: Draft for review
**Owner**: Product / Growth
**Surfaces**: `/campaigns/[id]` (Campaign Detail Home) and the Diagnosis tab within it

---

## 1. Context & Problem

The Campaign Detail page currently surfaces three kinds of insight nudges:

1. **Status strip** + **Next Best Action (NBA)** card at the top of the page (always visible, above the tabs).
2. **Diagnosis bullets** with `Drives action →` chips on the Diagnosis tab.
3. **Ad-set / Persona insights** + **More actions** + **Creative Signals** on the Diagnosis tab.

Three problems:

- **`Drives action →` is open-ended.** It just highlights the linked action card; clicking doesn't *do* anything. Users have to mentally translate "Drives action" → "I should pause this" → scroll up → click `Apply`. The CTA needs to be verb-specific and lead directly into a confirm/input flow.
- **Actions ignore campaign budget mode.** If the campaign uses **CBO** (Campaign Budget Optimization), recommendations like "Shift ₹25K from Broad Bangalore to Whitefield HNI" are physically impossible — under CBO budget lives at the campaign level and Meta redistributes automatically. The right action is "Pause Broad Bangalore" (and let CBO redistribute) or "Increase campaign budget." The diagnosis prompt + UI need to be CBO/ABO-aware.
- **Video diagnostics are absent.** We have `firstFrameRetention`, `hookRate`, `holdRate`, and `playRate95` on every campaign ([campaign-data.ts:25-31](../src/lib/campaign-data.ts:25)) but the diagnosis ignores them. A video creative can fail in three distinct places — thumbnail/preview (first-frame retention), first 3 seconds (hook rate), or middle/end (hold rate, playRate95) — and each implies a different fix. Without these signals we collapse all video underperformance into "Refresh creative," which is a coin flip.

This PRD specifies (a) the action-flow grammar that turns insights into one-click operations, (b) CBO/ABO awareness across the action layer, and (c) video-metric integration into the diagnosis pipeline.

## 2. Goals & Non-goals

**Goals**
- Every action surfaced in any nudge maps to a concrete, verb-specific UI flow that the user can complete in ≤2 confirmations.
- Recommendations adapt to `campaign.budgetMode` (CBO vs ABO) — illegal moves never appear.
- Video creatives are diagnosed on hook/hold/first-frame, not just CTR/frequency.
- AI diagnosis prompt updated so the LLM emits action verbs the UI can render without further interpretation.

**Non-goals**
- We are not redesigning the Diagnosis tab layout or the NBA card visual.
- We are not building an action history / audit log in this PRD (separate workstream).
- We are not connecting to the real Meta API — actions are mocked end-to-end as in the current MVP.

## 3. Glossary

- **CBO** — Campaign Budget Optimization. Budget is set at campaign level; Meta distributes across adsets automatically.
- **ABO** — Ad Set Budget Optimization. Budget is set per adset; user controls allocation manually.
- **Nudge** — Any UI element that suggests an action (banner, card, bullet, chip).
- **Action verb** — One of the enum values in `ActionVerb` ([diagnosis-payload.ts:20](../src/lib/types/diagnosis-payload.ts:20)). Determines the UI flow.
- **Persona-ad** — A creative tied to a defined persona (e.g., "Ad — Rajesh"). One persona-ad can run across multiple adsets.

---

## 4. Action-flow grammar

Every action verb maps to one of four UI flows:

| Flow | Verbs | UI |
|---|---|---|
| **A. Confirm-only** | `PAUSE`, `CONTINUE`, `WAIT` | Single modal with target entity + reason + Continue/Cancel. |
| **B. Input + confirm** | `SCALE`, `SHIFT_BUDGET` | Modal with input field (budget delta, target adset), validated, then confirm. |
| **C. Deep link** | `REFRESH`, `ADD_CREATIVE`, `ADD_ADSET` | Opens the relevant creator (Creative Generator modal or Adset Wizard) with context prefilled. |
| **D. Composite** | `INTERVENE`, `URGENT`, `OPTIMIZE` | Resolves into one of A/B/C at render time based on `target_entity` + `redeploy_to` fields. The LLM should emit the resolved verb; we keep these as a fallback. |

### 4.1 Modal copy contract per verb

Every action surfaced in any nudge MUST render the verb-specific CTA label below, never the generic "Drives action" or "Apply." The label is computed from `verb` + `target_entity`.

| Verb | CTA label | Modal title | Body shape |
|---|---|---|---|
| `PAUSE` | "Pause Broad Bangalore" | "Pause adset?" | Target name (bold) + reason + "Meta will stop serving in ~minutes. You can re-enable any time." |
| `SCALE` | "Scale Whitefield HNI" | "Increase budget" | Current budget · input "Increase by [%or ₹]" (default +20%) · projected new budget · expected impact |
| `SHIFT_BUDGET` | "Move ₹25K to Whitefield" | "Shift budget" | From/To/Amount inputs · validation that From has the budget to give · expected impact |
| `REFRESH` | "Refresh Carousel v2" | _(opens generator)_ | n/a — Creative Generator opens with `personaName`, `angleName`, `adSetName` prefilled |
| `ADD_CREATIVE` | "Add creative for Whitefield HNI" | _(opens generator)_ | n/a — same as Refresh, with no existing creative as base |
| `ADD_ADSET` | "Create Sarjapur Road adset" | _(opens adset wizard)_ | n/a — wizard opens with the targeting hint prefilled |
| `CONTINUE` | "Keep current strategy" | "Confirm" | Single Confirm — used for "trust the learning phase" moments |
| `WAIT` | "Snooze 24h" | _(no modal)_ | Snoozes the nudge — already implemented for NBA |

### 4.2 Confirmation modal — shared structure

```
┌──────────────────────────────────────┐
│  [Icon] {Modal title}                │
│                                       │
│  {Target entity, bold}                │
│  {Reason — one sentence with numbers} │
│                                       │
│  Expected: {goal-unit impact}         │
│                                       │
│  [Optional input(s) for Flow B]       │
│                                       │
│  [Cancel]  [{verb-specific CTA}]      │
└──────────────────────────────────────┘
```

Optimistic UI: on confirm we close the modal, fire a toast ("Pausing Broad Bangalore…" → "Paused"), and gray out the row in any tables that surface it. Mock backend in this MVP just sets local state.

### 4.3 Where the verb-specific CTA replaces today's generic chips

| Surface | Today | After |
|---|---|---|
| **NBA card** ([next-best-action.tsx](../src/components/campaigns/diagnosis/next-best-action.tsx)) | `cta_label` from payload — already verb-specific. Keep. | No change. |
| **Diagnosis bullets** `Drives action →` chip ([diagnosis-bullets.tsx:50-65](../src/components/campaigns/diagnosis/diagnosis-bullets.tsx:50)) | Generic label, only highlights. | Becomes verb-specific label (e.g., `Pause Broad Bangalore →`) and opens the matching Flow A/B/C/D directly. |
| **More actions** ([more-actions.tsx](../src/components/campaigns/diagnosis/more-actions.tsx)) | `cta_label` from payload. | Verify the payload writes verb-specific labels (the prompt update in §7 enforces this). |
| **Persona scorecard** recommendation ([persona-scorecard.tsx](../src/components/campaigns/diagnosis/persona-scorecard.tsx)) | Plain text. | Inline action button at the end of the recommendation that resolves to a Flow A/B/C. |
| **Creative signals** `Refresh →` / `Pause →` links ([creative-signals.tsx](../src/components/campaigns/diagnosis/creative-signals.tsx)) | Highlight only. | Open the matching flow directly. |

---

## 5. CBO / ABO awareness

### 5.1 Schema change

Add to [`CampaignDetail`](../src/lib/campaign-data.ts):

```ts
budgetMode: "CBO" | "ABO";
```

For mock `camp-7` (Godrej Air Phase 3), set `budgetMode: "CBO"` to drive the new code paths.

### 5.2 Verb filter table

The diagnosis prompt MUST emit only verbs that are valid under the current `budgetMode`. The UI MUST also defensively filter, so a stale CBO move never renders.

| Verb | Valid under CBO? | Valid under ABO? | Notes for CBO |
|---|---|---|---|
| `PAUSE` | ✅ | ✅ | Under CBO, pausing an adset triggers automatic redistribution — copy should mention this. |
| `SCALE` | ✅ (campaign-level) | ✅ (adset-level) | Under CBO, "Scale" means raise the *campaign* daily budget. Modal must read "Campaign daily budget" not "Adset daily budget." |
| `SHIFT_BUDGET` | ❌ | ✅ | Under CBO, replace with `PAUSE` of the donor adset. The diagnosis prompt should emit the `PAUSE` form when it detects CBO. |
| `REFRESH` | ✅ | ✅ | n/a |
| `ADD_CREATIVE` | ✅ | ✅ | n/a |
| `ADD_ADSET` | ✅ | ✅ | New adset under CBO inherits the campaign budget; modal copy reflects this. |
| `CONTINUE` | ✅ | ✅ | n/a |
| `WAIT` | ✅ | ✅ | n/a |

### 5.3 Copy adaptation

When `budgetMode === "CBO"`:

- Top-reallocation type messaging changes from "Pause Broad Bangalore (₹25K) → Whitefield HNI · recovers 22 qualified · closes 88% of gap" to "Pause Broad Bangalore — CBO will redistribute spend, projected +22 qualified leads."
- Scale modal label changes from "Adset daily budget" to "Campaign daily budget."
- A small `CBO` chip appears next to the budget figure in the header so users know the constraint.

### 5.4 Implementation note

`actionColorStyles` already has all four colors. No visual changes here — only label/copy/verb selection changes.

---

## 6. Video-metric integration

### 6.1 Schema additions

Extend [`CreativeMetric`](../src/components/campaigns/diagnosis-tab.tsx) for video creatives:

```ts
export interface CreativeMetric {
  // ...existing fields
  /** Only set when format === "Video". % of impressions where the first frame fully rendered. */
  firstFrameRetention?: number;
  /** Only for Video. % retained at 3 seconds. */
  hookRate?: number;
  /** Only for Video. % retained between 3s and 75% completion. */
  holdRate?: number;
  /** Only for Video. % completing 95% of the video. */
  playRate95?: number;
  /** 7d delta on hookRate, in percentage points. Negative = drift. */
  hookRateDelta7d?: number;
  /** 7d delta on holdRate, in percentage points. */
  holdRateDelta7d?: number;
}
```

### 6.2 New diagnosis signals (video only)

These extend `creative-signals.tsx`. Order/priority unchanged — these are new branches in the underperformer / fatigue families.

| Signal | Trigger | Text template | Recommended action |
|---|---|---|---|
| **Thumbnail/preview problem** | `firstFrameRetention < 80%` | "{name} — first frame retention {x}%, viewers skip before the video plays. Likely thumbnail or preview issue." | `REFRESH` (re-cut thumbnail/opening frame) |
| **Weak hook** | `hookRate < 25%` OR `hookRateDelta7d <= -5` | "{name} — hook rate {x}% ({delta}pp in 7d). First 3 seconds aren't holding viewers." | `REFRESH` (rework first 3 seconds) |
| **Pacing collapse** | `holdRate < 50%` OR `holdRateDelta7d <= -8` | "{name} — hold rate {x}% ({delta}pp in 7d). Viewers drop off mid-video." | `REFRESH` (restructure middle pacing) |
| **Story incomplete** | `playRate95 < 15%` AND `holdRate >= 50%` | "{name} — {x}% finish the video despite holding through the middle. Ending isn't earning the watch." | `REFRESH` (rework CTA / final 25%) |

These signals replace the generic "fatiguing" message for video creatives — for static/carousel we keep the existing CTR-drift + frequency rules.

### 6.3 Persona scorecard impact

Persona scorecard verdicts (`persona-scorecard.tsx`) get a new sub-verdict: **`Reformat`**. Triggered when one specific video weakness signal fires across most placements of a persona (e.g., Rajesh's video has `hookRate < 25%` in both Whitefield and Broad). Recommendation: "Reformat Rajesh — weak hook (24%) across all placements. New opening before reshooting."

### 6.4 Where the data comes from

In production this comes from Meta's video metric endpoints. For the MVP mock, we extend [diagnosis-tab.tsx](../src/components/campaigns/diagnosis-tab.tsx) `adSetCreatives` mock with the four new fields per Video creative.

---

## 7. Updated AI prompt (campaign diagnosis)

The LLM-side prompt at [`docs/ai-prompt-campaign-diagnosis.md`](./ai-prompt-campaign-diagnosis.md) needs three additions. The full diff is below — the rest of the prompt is unchanged.

### 7.1 New system context (prepend)

```
The campaign you are diagnosing has:
  budget_mode: {{ "CBO" | "ABO" }}
  primary_goal: {{ "leads" | "verified" | "qualified" }}

CBO RULES (apply when budget_mode === "CBO"):
  - NEVER emit a SHIFT_BUDGET action. Replace with PAUSE on the donor adset.
  - SCALE actions refer to the campaign-level daily budget, not adset budget.
  - In top_move and any reallocation language, write "CBO will redistribute" instead of naming the recipient adset's manual budget bump.
  - The recipient adset still appears in `redeploy_to` for context, but the user-facing copy must not imply manual reallocation.

ABO RULES (apply when budget_mode === "ABO"):
  - SHIFT_BUDGET is the preferred reallocation primitive.
  - SCALE refers to the adset-level daily budget.
```

### 7.2 New input fields (per creative, when format === "Video")

Add to the per-creative input block:

```
{
  "id": "...",
  "format": "Video",
  "first_frame_retention": 0.78,
  "hook_rate": 0.21,
  "hold_rate": 0.43,
  "play_rate_95": 0.11,
  "hook_rate_delta_7d": -6,    // percentage points
  "hold_rate_delta_7d": -3
  // ...existing fields
}
```

### 7.3 New diagnosis signal types (video)

Extend the diagnosis-bullet family with explicit video sub-types. The model should choose the most specific one when a video creative is involved:

```
- VIDEO_THUMBNAIL_DROP    (when first_frame_retention < 0.80)
- VIDEO_WEAK_HOOK         (when hook_rate < 0.25 OR hook_rate_delta_7d <= -5)
- VIDEO_PACING_COLLAPSE   (when hold_rate < 0.50 OR hold_rate_delta_7d <= -8)
- VIDEO_STORY_INCOMPLETE  (when play_rate_95 < 0.15 AND hold_rate >= 0.50)
```

For each, write the bullet with two real video metrics (not just CTR), and `drives_action_id` should point to a `REFRESH` action whose `target_entity` is the specific creative.

### 7.4 CTA label rules

The model must write `cta_label` as `{verb_in_imperative} {target_entity_short}` — never generic. Examples:

- ✅ "Pause Broad Bangalore"
- ✅ "Scale Whitefield HNI"
- ✅ "Refresh Ad — Sneha"
- ❌ "Apply" / "Continue" / "Drives action" / "Take action"

The only allowed generic label is `Snooze 24h` for `WAIT` verbs.

---

## 8. Insight nudges — Campaign Detail homepage

Above the tabs, three nudge slots in priority order:

| Slot | Component | Visibility rule |
|---|---|---|
| **1. Agent banner** | "No agent connected" thin banner | Visible when `!campaign.agentConnected && !agentNudgeDismissed`. Already implemented. |
| **2. Status strip** | `StatusStrip` | Always visible. Clickable when `verdict !== ON_TRACK && verdict !== SCALE_WINNER` — routes to Diagnosis tab. Already implemented. |
| **3. Next Best Action** | `NextBestAction` | Visible when not snoozed. Already implemented; verb-specific CTA per §4. |

### 8.1 Snooze + dismiss persistence

Per-nudge state should persist beyond a tab refresh — store in `localStorage` keyed by `${campaignId}:${nudgeKey}`. Snooze expires after 24h. Currently we use in-memory React state which resets on reload.

### 8.2 New nudge: "Goal at risk" inline

When `goal_tracker.headroom_cpl < 0` AND `time.burn_pct < 50` (early in the campaign but already off-target on cost), render a small inline notice between the Status strip and the NBA card:

```
⚠ At day {N} of {total}, projected to miss {goal} goal by {gap_pct}%.
  See Diagnosis →
```

Single line, dismissible (per-campaign localStorage), routes to Diagnosis tab.

---

## 9. Insight nudges — Diagnosis tab

Order of cards is unchanged. Nudge changes are CTA-level, per §4.3.

Two new cards proposed (post-MVP, behind a flag):

### 9.1 Video performance card (when ≥1 Video creative is active)

A new `<VideoPerformance>` card sitting between **Persona scorecard** and **More actions**. It surfaces:
- A bar chart of hook rate vs. campaign benchmark per creative
- A delta-table for hookRateDelta7d / holdRateDelta7d / playRate95 across active video creatives
- One-line verdict per creative (e.g., "Lifestyle Video — strong hook, weak ending. Story-incomplete.")

Drives `REFRESH` actions linked to the specific creative, with the relevant video sub-signal carried into the modal as the reason.

### 9.2 Persona-format card

A small card showing per-persona format performance: "Rajesh's Video out-performs Carousel by 1.4× CTR — drop the Carousel variant." Useful when one persona has multiple ad formats; not necessary in the current mock (1 format per persona).

---

## 10. Schema changes — summary

| File | Change |
|---|---|
| [src/lib/campaign-data.ts](../src/lib/campaign-data.ts) | Add `budgetMode: "CBO" \| "ABO"` to `CampaignDetail`. Set `camp-7` to `"CBO"`. |
| [src/components/campaigns/diagnosis-tab.tsx](../src/components/campaigns/diagnosis-tab.tsx) | Extend `CreativeMetric` with optional video metric fields. Add mock values for all Video creatives. |
| [src/lib/types/diagnosis-payload.ts](../src/lib/types/diagnosis-payload.ts) | Add `budget_mode` to `DiagnosisPayload`. Add new diagnosis-signal sub-types (`VIDEO_*`). Tighten `cta_label` to a non-empty string convention (cannot be the generic strings listed in §7.4). |
| [docs/ai-prompt-campaign-diagnosis.md](./ai-prompt-campaign-diagnosis.md) | Apply §7 changes. |
| [docs/ai-system-prompt.md](./ai-system-prompt.md) | Mirror the budget-mode rules and CTA-label rule. |

---

## 11. UI changes — summary

| Component | Change |
|---|---|
| [diagnosis-bullets.tsx](../src/components/campaigns/diagnosis/diagnosis-bullets.tsx) | Replace `Drives action →` chip with verb-specific label and wire to action flow modal. |
| [more-actions.tsx](../src/components/campaigns/diagnosis/more-actions.tsx) | Replace `cta_label` button onClick to open the corresponding flow modal. |
| [next-best-action.tsx](../src/components/campaigns/diagnosis/next-best-action.tsx) | Replace `onApply` with the same flow-modal opener. Wire `verb`-aware behavior. |
| [persona-scorecard.tsx](../src/components/campaigns/diagnosis/persona-scorecard.tsx) | Append a verb-specific button on each row's recommendation. |
| [creative-signals.tsx](../src/components/campaigns/diagnosis/creative-signals.tsx) | `Refresh →` / `Pause →` chips become real action launchers. Add new video signal handlers. |
| **NEW**: `src/components/campaigns/actions/action-flow-modal.tsx` | A single modal that switches on `verb` and renders Flow A/B/C/D. All consumers above call `openActionFlow(action)`. |
| **NEW**: `src/components/campaigns/actions/use-action-flow.ts` | A small hook that owns the active-action state and exposes `openActionFlow`, `closeActionFlow`. Wraps localStorage persistence for snooze/dismiss. |

---

## 12. Verification plan

For each verb, manually verify the flow at `/campaigns/camp-7`:

1. **`PAUSE`**: Click `Pause Broad Bangalore →` from any nudge → confirm modal → click confirm → toast appears → adset row in Budget Allocation table grays out.
2. **`SCALE`**: Click `Scale Whitefield HNI →` → modal with budget input (default +20%) → change to ₹+5K → confirm → toast.
3. **`SHIFT_BUDGET`** (only when `budgetMode === "ABO"`): set `camp-7.budgetMode = "ABO"` temporarily → confirm `SHIFT_BUDGET` actions appear → flow opens with from/to/amount.
4. **`REFRESH`**: Click on Persona scorecard → opens Creative Generator with Sneha's persona prefilled.
5. **`CBO` filter**: with `budgetMode = "CBO"`, no `SHIFT_BUDGET` action should render anywhere; the top reallocation copy should read "CBO will redistribute…"
6. **Video signals**: with mock video metric data, expand Whitefield → Creative Signals lists "Lifestyle Video — weak hook 22%, -7pp in 7d" instead of generic fatigue copy.
7. **Snooze persistence**: snooze NBA → reload page → NBA stays snoozed.

End-to-end: `preview_console_logs level=error` must be empty after every flow.

---

## 13. Open questions

1. **Snooze granularity** — should "snooze NBA 24h" snooze *that* NBA only, or all NBAs for this campaign? (Recommend: this NBA — keyed by `action.id`.)
2. **Multi-action confirm** — when an NBA chains two operations (pause donor + scale recipient), do we show one combined modal or two sequential modals? (Recommend: one combined "Apply reallocation" modal that lists both effects.)
3. **CBO budget bump default** — what's the suggested `SCALE` default under CBO? (Recommend: +20% of the campaign daily budget, consistent with ABO default.)
4. **Video metric nulls** — when a video has been live <72h and metrics are too thin, do we suppress the signal or show a "warming up" state? (Recommend: suppress; the ON_TRACK / LEARNING verdict already handles this at the campaign level.)

---

## 14. External resolution & state reconciliation

### 14.1 The problem

Users will often skip our action-flow modal and apply changes directly in Meta Ads Manager — sometimes the recommendation we surfaced, sometimes a partial version, sometimes the opposite. Without reconciliation:

- The same recommendation re-renders day after day even though the user already acted.
- We lose attribution (did our nudge cause the change?).
- We can't tell apart "user disagreed and did the opposite" from "user agreed and is still implementing."
- The Diagnosis tab fills with stale clutter.

### 14.2 Snapshot-based reconciliation

Every action emitted by the diagnosis prompt MUST include a snapshot of the entity state it expects to change. The reconciliation step compares the snapshot to current Meta state on every diagnosis refresh.

**Schema addition** to [`NextBestAction`](../src/lib/types/diagnosis-payload.ts) and [`SecondaryAction`](../src/lib/types/diagnosis-payload.ts):

```ts
interface ActionSnapshot {
  /** Type of entity the action targets. Determines which fields are populated. */
  entity_kind: "campaign" | "adset" | "creative";
  /** Stable Meta ID, not name — names can change. */
  entity_id: string;
  /** State the entity was in when the recommendation was generated. */
  before: {
    status?: "ACTIVE" | "PAUSED";
    daily_budget?: number;
    // ...verb-specific fields (e.g., creative_id_in_use for REFRESH actions)
  };
  /** State we expect after the action is applied. Used for partial-match detection. */
  expected_after: {
    status?: "ACTIVE" | "PAUSED";
    daily_budget?: number;
  };
  /** When this snapshot was taken. */
  generated_at: string; // ISO timestamp
}

interface NextBestAction {
  // ...existing fields
  snapshot: ActionSnapshot;
  resolution: ActionResolution; // see §14.3
}
```

### 14.3 Action resolution states

```ts
type ActionResolution =
  | { state: "open" }
  | { state: "resolved-via-app"; applied_at: string; by: "user" | "auto" }
  | { state: "resolved-externally"; applied_at: string; detected_at: string }
  | { state: "resolved-partial"; applied_at: string; gap: string /* e.g., "+10% applied vs +20% recommended" */ }
  | { state: "counter-action"; detected_at: string; observed: string /* e.g., "Adset budget increased instead of paused" */ }
  | { state: "stale"; reason: string /* e.g., "CTR recovered to 2.4% — pause no longer needed" */ }
  | { state: "snoozed"; until: string }
  | { state: "dismissed"; at: string };
```

### 14.4 Reconciliation rules

Run on every diagnosis refresh, before rendering. For each action with `resolution.state === "open"`:

| Comparison | Resolution |
|---|---|
| `current.status === expected_after.status` AND `current.daily_budget === expected_after.daily_budget` | `resolved-via-app` if our app has a matching log entry within ±2 minutes; else `resolved-externally` |
| `current.status === expected_after.status` but other fields don't match | `resolved-partial` with `gap` describing the delta |
| `current.status === before.status` (no change) but underlying metrics no longer support the recommendation (e.g., CTR recovered, fatigue cleared) | `stale` |
| `current` shifted in the *opposite* direction (e.g., we said pause, user scaled) | `counter-action` — surface to the user as a soft warning, don't auto-dismiss |
| Otherwise | remains `open` |

### 14.5 UI affordances

- **`resolved-via-app`** / **`resolved-externally`** — action card collapses into a "Recently resolved" rail at the bottom of the Diagnosis tab. Single line per item: `✓ Pause Broad Bangalore — resolved on Meta · 2h ago`. Optional click to expand.
- **`resolved-partial`** — stays visible in the active stack with a yellow chip: `Partially applied — +10% vs recommended +20%`. CTA changes to `Top up to +20% →`.
- **`counter-action`** — stays in active stack with a red chip: `You did the opposite — campaign budget went up after we recommended pause`. No CTA; instead an inline `Why? [Tell us]` link feeding into a thumbs-down feedback channel so the model can learn.
- **`stale`** — action quietly disappears on next refresh; logged in audit trail.

### 14.6 Where resolution data comes from

- **Production**: poll Meta Insights API + Ads Library for status & budget every 5 min for the focused campaign; webhook for status changes if available. App-originated actions log to our backend with `action_id + applied_at + result_status`, and we cross-reference.
- **MVP mock**: `adSetsData` and `adSetCreatives` mocks are the single source of truth. The reconciliation step diffs the snapshot against the current mock. To demo the resolved states, expose a small "Pretend Meta state" toggle in dev that mutates mock state and triggers re-reconciliation.

### 14.7 Attribution & telemetry

For each resolved action, log:

```ts
{
  campaign_id,
  action_id,
  recommended_at,
  resolution_state,        // resolved-via-app | resolved-externally | ...
  applied_at,
  detection_lag_seconds,   // applied_at - detected_at
  outcome_metric_delta_7d, // primary goal metric change in the 7 days after resolution
}
```

This serves two purposes:
- **Trust**: in the UI, surface "Last 5 recommendations from us improved CPL by 14% on average" — proves the diagnosis is worth following.
- **Learning**: counter-actions are negative-feedback signals for the diagnosis prompt — they should reduce that recommendation's confidence weight in similar future situations.

### 14.8 Recently-resolved rail (UI)

A collapsed bar at the bottom of the Diagnosis tab:

```
▸ 3 recently resolved · last 7 days
```

Expanded:

```
✓ Pause Broad Bangalore — resolved on Meta · 2h ago · CPL improved by ₹240 (-15%) since
✓ Refresh Ad — Sneha — resolved via app · 1d ago · CTR recovered to 3.1%
✓ Add Sarjapur Road adset — resolved on Meta · 3d ago · 8 leads in first 48h
```

Each line is clickable → opens an audit drawer with the full action history (recommendation text, before/after snapshots, outcome metrics).

### 14.9 What this means for the AI prompt

The diagnosis prompt at [`docs/ai-prompt-campaign-diagnosis.md`](./ai-prompt-campaign-diagnosis.md) gets one more responsibility:

- **Receive `previous_recommendations`** in input — the last N actions we surfaced (with their snapshots and current resolution state).
- **Don't re-emit recently-resolved actions** unless metrics have regressed back to the original problem state. Specifically: if a `PAUSE` was applied 6 days ago and the adset is back to active with the same problem, *that's a separate diagnosis* — emit a new action, not a duplicate.
- **Reference resolution history in `reason`** when relevant: "Pacing recovered after last week's pause of Broad Bangalore — keep current allocation." This gives the diagnosis continuity across runs.

### 14.10 Open questions for §14

1. **Resolution detection lag tolerance** — if the user pauses on Meta and our next diagnosis runs 3 hours later, we'll show the recommendation as `open` for 3 hours. Acceptable? (Recommend: yes for MVP; production should poll the focused campaign every 5 min.)
2. **Counter-action escalation** — if a user repeatedly does the opposite of our recommendations, do we down-rank or hide our diagnosis for that campaign? (Recommend: a "diagnosis trust" indicator the user can see, not silent down-ranking.)
3. **Multi-step actions** — if NBA was "pause A, scale B" and the user pauses A but doesn't scale B, is that resolved-partial or two separate actions? (Recommend: split into two actions at emission time so each resolves independently.)
