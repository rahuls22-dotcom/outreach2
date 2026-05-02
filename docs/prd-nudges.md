# PRD — Campaign Detail Nudges

**Scope**: The two nudges that sit above the tabs on every campaign detail page.
**Audience**: Engineering + AI/prompt-eng.
**Out of scope**: The Diagnosis tab (separate doc, coming after this).

---

## Components

| # | Name | Position |
|---|---|---|
| 1 | **Target vs. Achieved Strip** | Always visible, top of `/campaigns/[id]` |
| 2 | **Next Best Action Nudge** | Below the strip, dismissable |

Both run on the same input — the campaign's current state from Meta + qualifier rates from our agent. Both are produced by the AI orchestrator (system prompts in §C and §D).

---

# A. Target vs. Achieved Strip

## A1. Purpose

One-line summary of *where the campaign stands vs. where it's supposed to be at this point in time*. Always visible. Click takes the user to the Diagnosis tab when there's something to diagnose.

## A2. Anatomy

`[icon] [verdict pill] [headline] [day counter] [primary metric] [→ Diagnose link, conditional]`

## A3. State matrix

States are computed from four input dimensions:

| Dimension | Values |
|---|---|
| **Campaign status** | `enabled` · `paused` · `scheduled` · `ended` · `archived` |
| **Phase** | `pre-launch` · `learning` · `active` · `final-stretch` · `past-end` |
| **Performance** | `ahead` · `on-track` · `at-risk` · `off-target` · `critical` · `n/a` |
| **Data sufficiency** | `insufficient` · `sufficient` |

**Phase definitions:**
- `pre-launch`: now < `start_date`
- `learning`: `days_elapsed ≤ 3` OR `total_leads < 50` (whichever later)
- `active`: past learning, not in final stretch
- `final-stretch`: `days_remaining ≤ 3` AND `gap_to_goal_pct > 5`
- `past-end`: now > `end_date`

**Performance thresholds** (computed against projected vs. goal):
- `ahead`: projected ≥ 110% of goal
- `on-track`: 95% ≤ projected < 110%
- `at-risk`: 80% ≤ projected < 95%
- `off-target`: 50% ≤ projected < 80%
- `critical`: projected < 50%
- `n/a`: insufficient data or campaign not yet running

### A3.1 Active campaign states

| State key | Trigger | Strip content (template) | Pill | Clickable? |
|---|---|---|---|---|
| `active.ahead` | enabled · active · ahead | `Day {d} of {D} · {actual}/{goal} {goal_unit} · projecting {proj} (+{gap}%)` | Green "Ahead" | No |
| `active.on-track` | enabled · active · on-track | `Day {d} of {D} · On Track · {actual}/{goal} · projecting {proj}` | Green "On Track" | No |
| `active.at-risk` | enabled · active · at-risk | `Day {d} of {D} · At Risk · {actual}/{goal} · projecting {proj} (-{gap}%)` | Yellow "At Risk" | Yes → Diagnosis |
| `active.off-target` | enabled · active · off-target | `Day {d} of {D} · Off Target · {actual}/{goal} · projecting {proj} (-{gap}%)` | Amber "Off Target" | Yes → Diagnosis |
| `active.critical` | enabled · active · critical | `Day {d} of {D} · Critical · {actual}/{goal} · projecting {proj} (-{gap}%) — intervention required` | Red "Critical" | Yes → Diagnosis |

### A3.2 Phase-specific overrides

| State key | Trigger | Strip content | Pill |
|---|---|---|---|
| `learning` | enabled · learning · any perf | `Day {d} of {D} · Learning · {actual}/{goal} · stabilizing` | Gray "Learning" |
| `learning.insufficient-data` | enabled · learning · insufficient | `Day {d} of {D} · Learning · Awaiting first signal` | Gray "Learning" |
| `final-stretch.at-risk` | enabled · final-stretch · ≤ at-risk | `Day {d} of {D} · Final stretch · {actual}/{goal} — {needed} {goal_unit} needed in {days_remaining}d` | Amber "Final stretch" |
| `final-stretch.critical` | enabled · final-stretch · critical | `Day {d} of {D} · Critical · {actual}/{goal} — {needed} {goal_unit} needed in {days_remaining}d, infeasible at current rate` | Red "Critical" |

### A3.3 Paused / scheduled / ended

| State key | Trigger | Strip content | Pill | Notes |
|---|---|---|---|---|
| `paused.active-window` | paused · before end_date | `Paused · Day {d} of {D} · Last: {actual}/{goal} · Resume to continue` | Gray "Paused" | Resume CTA in header (existing). |
| `paused.learning-incomplete` | paused · learning | `Paused · Learning incomplete · Resume to gather signal` | Gray "Paused" | |
| `paused.past-end` | paused · past end_date | `Paused · Window closed · Final: {actual}/{goal}` | Gray "Closed" | Diagnose link if missed. |
| `scheduled` | scheduled (now < start_date) | `Scheduled · Starts {start_date_relative}` | Blue "Scheduled" | |
| `ended.hit` | ended · actual ≥ goal | `Ended · {actual}/{goal} (+{gap}%) ✓ · Achieved` | Green "Achieved" | |
| `ended.miss` | ended · actual < goal | `Ended · {actual}/{goal} (-{gap}%) · See diagnosis` | Amber "Missed" | Yes → Diagnosis |
| `ended.early-manual` | ended early manually | `Ended early · Day {d} of {D} · {actual}/{goal} · Stopped manually` | Gray "Stopped" | |
| `archived` | archived | `Archived · Final: {actual}/{goal}` | Gray "Archived" | Read-only. |

### A3.4 Edge cases

| State key | Trigger | Strip content | Pill |
|---|---|---|---|
| `timeline-shifted` | end_date changed (extended/shortened) | `Day {d} of {D_new} (extended/shortened from {D_old}) · {perf_summary}` | Inherits performance pill |
| `past-end.still-serving` | past end_date AND status=enabled | `Day {d} of {D} · Overrun · Pause or extend window` | Red "Overrun" |
| `budget-exhausted` | budget_remaining = 0 AND days_remaining > 0 | `Budget exhausted · Day {d} of {D} · {days_remaining}d unfunded` | Red "Out of budget" |
| `agent-disconnected.qualified-goal` | primary_goal=qualified AND agent_connected=false | `Day {d} of {D} · {actual_leads} leads · Connect agent to track Qualified leads` | Yellow "Agent needed" |

### A3.5 Visual rules

- **Pill colors**: green (good), gray (informational/neutral), yellow/amber (warn), red (critical), blue (forward-looking).
- **Click target**: entire strip is the click region when `clickable: true`. Otherwise the strip is presentational only.
- **Truncation**: headline truncates with ellipsis at viewport <1024px. Full text always available in tooltip.
- **Refresh cadence**: strip re-renders on every tab focus and every 60s while focused.

## A4. Click behaviors

| State group | Click behavior |
|---|---|
| `at-risk`, `off-target`, `critical`, `final-stretch.*`, `past-end.still-serving`, `ended.miss` | Navigate to Diagnosis tab |
| `paused.past-end` (with miss) | Navigate to Diagnosis tab |
| All others | Non-clickable (presentational only) |

## A5. Acceptance criteria

- [ ] All 17 states render correctly with the right pill color, copy template, and click behavior.
- [ ] State key matches deterministic rules in §A3 — same input → same state, no ML guessing.
- [ ] Click on a clickable state opens the Diagnosis tab with `?focus=verdict` (so Diagnosis can highlight the matching section).
- [ ] Strip refreshes on tab focus + every 60s; no FOUC during refresh.
- [ ] Tooltip shows full headline when truncated.

---

# B. Next Best Action Nudge

## B1. Purpose

Single most impactful action the user should take *right now*. Sits below the strip. Dismissable (snooze 24h or close).

## B2. Anatomy

`[verb badge] [next best action label] [headline] [reason — 1 line, with numbers] [expected impact pill] [primary CTA, verb-specific] [snooze 24h]`

Card style: white background, thin colored left rail keyed to verb color (gray/green/amber/red).

## B3. State matrix

States are produced by the AI orchestrator. Card visibility is gated by both the AI's output AND the local snooze/dismiss flags.

### B3.1 Visibility rules (UI layer, evaluated client-side)

| Local flag | Effect |
|---|---|
| `snoozedUntil > now` | Hide card, show small "Snoozed until {time} · [Unsnooze]" pill in its place. |
| `dismissedAt set` | Hide card permanently for this NBA. New NBA appears when AI emits a different `id`. |
| Campaign status = `paused`, `scheduled`, `archived` | Hide card. Strip carries the only message. |
| Campaign status = `ended` | Hide card. Diagnosis tab carries the post-mortem. |

### B3.2 AI-produced states

When campaign is `enabled`, the AI emits exactly one NBA per diagnosis run. The shape:

| State key | Verb | Color | When emitted | Card content |
|---|---|---|---|---|
| `nba.wait` | `WAIT` | Gray | Learning phase, no clear signal yet | `Wait — gathering signal for {N} more days. Current: {summary}.` · CTA: `Snooze 24h` only |
| `nba.continue` | `CONTINUE` | Gray | On-track, no action needed | `Continue current strategy. {summary} — pacing on target.` · CTA: `Keep current strategy` |
| `nba.scale` | `SCALE` | Green | Ahead-of-target with headroom | `Scale {target} — {reason}. Expected: {impact}.` · CTA: verb-specific |
| `nba.optimize` | `OPTIMIZE` | Green | On-track but a small tweak adds upside | `Optimize {target} — {reason}.` · CTA: verb-specific |
| `nba.refresh` | `REFRESH` | Amber | Creative fatigue is the dominant signal | `Refresh {target} — frequency {x}, CTR {delta}% in 7d.` · CTA: `Refresh {target}` |
| `nba.intervene` | `INTERVENE` (CBO collapses to `PAUSE` + redeploy note) | Amber | Off-target with a clear reallocation move | `Pause {donor}, redeploy ₹{amount} to {recipient}.` · CTA: `Pause {donor}` |
| `nba.urgent` | `URGENT` | Red | Critical state, intervention infeasible without action | `Urgent — {reason}. {expected loss without action}.` · CTA: verb-specific (no snooze) |
| `nba.add-creative` | `ADD_CREATIVE` | Amber | Best-performing persona missing from a profitable adset | `Add {persona} creative to {adset} — proven winner.` · CTA: `Add creative for {adset}` |
| `nba.add-adset` | `ADD_ADSET` | Green | Untargeted high-yield audience detected | `Create {audience} adset — {reason}.` · CTA: `Create {audience} adset` |
| `nba.shift-budget` (ABO only) | `SHIFT_BUDGET` | Amber | ABO mode + reallocation needed | `Move ₹{amount} from {donor} to {recipient}.` · CTA: `Move budget to {recipient}` |

### B3.3 Resolution states (post-action)

After a user (or the AI) determines an NBA has been resolved, the card transitions to one of these states. These are computed by the reconciler (see §B4) and replace the active card in-place.

| State key | Trigger | Card content | Persistence |
|---|---|---|---|
| `nba.resolved-via-app` | User clicked Apply in our flow → backend confirms | `✓ {label} — applied · {time_ago}` (1-line, neutral) | Auto-collapses after 24h to "Recently resolved" rail |
| `nba.resolved-externally` | Snapshot diff shows entity matches `expected_after`, no app log | `✓ {label} — resolved on Meta · {time_ago}` (1-line, neutral) | Same as above |
| `nba.resolved-partial` | Status matches but other fields don't (e.g., +10% applied vs +20% recommended) | `△ Partially applied — {gap}` · CTA: `Top up to {target}` | Stays visible; resumable |
| `nba.counter-action` | Entity moved opposite to `expected_after` | `! You did the opposite — {observed}` · inline `Why? [Tell us]` | Stays visible until dismissed; feeds model |
| `nba.stale` | Underlying metrics no longer support the recommendation | (silently removed; logged in audit) | Auto-removed |

### B3.4 Snooze rules

- Snooze duration: **24 hours** from click. Stored in `localStorage` keyed by `${campaignId}:nba:${actionId}`.
- Snooze applies to the specific `actionId`. If the AI emits a *different* NBA on the next run, that one shows even if the previous was snoozed.
- `URGENT` color blocks the snooze button — the user must Apply or actively Dismiss.
- Snooze persists across reload and tab close. It does NOT sync across devices in MVP.

### B3.5 Dismiss rules

- Dismiss is a hard hide for the same `actionId`, no time bound. Stored in `localStorage` same key shape.
- The dismissal is also fed to the AI as a negative signal: next diagnosis run receives `previous_recommendations[].resolution.state = "dismissed"` for this `actionId`.
- The AI MAY re-emit a different action targeting the same entity if the underlying problem persists, but it MUST NOT re-emit the same `actionId`.

## B4. Resolution reconciler (forward-compat hook)

Each NBA carries a `snapshot` field at emission time:

```ts
{
  entity_kind: "campaign" | "adset" | "creative",
  entity_id: string,                    // stable Meta ID
  before: { status?: ..., daily_budget?: ... },
  expected_after: { status?: ..., daily_budget?: ... },
  generated_at: string                  // ISO
}
```

On every refresh the client compares snapshot vs. current Meta state and sets `resolution.state`. See [`prd-insight-nudges.md` §14](./prd-insight-nudges.md) for the full reconciliation logic. The UI states in §B3.3 are the user-visible outcomes of that reconciler.

## B5. Click behaviors

| State group | Primary CTA | Secondary |
|---|---|---|
| `nba.wait` | (none) | Snooze 24h |
| `nba.continue` | `Keep current strategy` → confirms; resolved-via-app | Snooze |
| All action verbs (`scale`, `optimize`, `refresh`, `intervene`, `add-*`, `shift-budget`) | Verb-specific button → opens Action Flow Modal | Snooze |
| `nba.urgent` | Verb-specific button → modal | (no snooze; Dismiss requires confirm) |
| `nba.resolved-*` | None or "Top up" / "Why?" | Auto-collapse / dismiss |

## B6. Acceptance criteria

- [ ] Card hides automatically when campaign is `paused`, `scheduled`, `archived`, or `ended`.
- [ ] Snooze persists across page reload (localStorage); auto-expires after 24h.
- [ ] `URGENT` color cannot be snoozed (snooze button absent).
- [ ] Apply path opens the Action Flow Modal (separate spec — already prototyped).
- [ ] Resolution states (`resolved-via-app`, `resolved-externally`, `resolved-partial`, `counter-action`) render distinct visuals per §B3.3.
- [ ] AI's `previous_recommendations` input on next run includes the prior NBA's resolution state.

---

# C. AI System Prompt — Target vs. Achieved Strip

## C0. Ready-to-paste system prompt

Paste the block below verbatim as the `system` parameter of your Anthropic / OpenAI API call. Pass the input JSON (per §C1) as the user message. The model will return a JSON object per §C2.

```
You are the Target vs. Achieved Strip generator for a B2C real-estate Meta Ads
diagnosis platform. Your job: given the current state of ONE ad campaign,
output a single JSON object summarizing where the campaign stands relative to
its goal at this moment in time. The output drives the strip that always sits
at the top of the campaign detail page.

# INPUT

You receive a JSON object on the user message with three keys:

{
  "campaign": {
    "id": string, "name": string,
    "status": "enabled" | "paused" | "scheduled" | "ended" | "archived",
    "start_date": ISO date, "end_date": ISO date,
    "primary_goal": "leads" | "verified" | "qualified",
    "goal_target": integer,
    "daily_budget": integer (₹/day),
    "budget_mode": "CBO" | "ABO",
    "agent_connected": boolean,
    "now": ISO timestamp
  },
  "metrics": {
    "actual": integer, "projected": integer,
    "spend_to_date": integer, "budget_remaining": integer,
    "leads_last_24h": integer, "leads_first_72h": integer,
    "days_elapsed": integer, "days_total": integer
  },
  "history": {
    "manual_pauses_count": integer,
    "end_date_changes": [ { "old": ISO date, "new": ISO date, "at": ISO timestamp } ]
  }
}

# PHASE DEFINITIONS

- pre-launch:    now < start_date
- learning:      (days_elapsed ≤ 3 OR actual < 50), AND status = "enabled"
- final-stretch: days_remaining ≤ 3 AND |projected - goal_target| / goal_target > 0.05
- past-end:      now > end_date
- active:        none of the above, AND status = "enabled"

# PERFORMANCE THRESHOLDS (compare projected to goal_target)

- ahead:      projected ≥ 1.10 × goal_target
- on-track:   0.95 × goal_target ≤ projected < 1.10 × goal_target
- at-risk:    0.80 × goal_target ≤ projected < 0.95 × goal_target
- off-target: 0.50 × goal_target ≤ projected < 0.80 × goal_target
- critical:   projected < 0.50 × goal_target

# DECISION TREE (apply in order; first match wins)

1. status === "scheduled"                               → state_key = "scheduled"
2. status === "archived"                                → "archived"
3. status === "ended":
     a. actual ≥ goal_target                            → "ended.hit"
     b. end_date_changes contains a manual early stop   → "ended.early-manual"
     c. else                                            → "ended.miss"
4. status === "paused":
     a. now > end_date                                  → "paused.past-end"
     b. phase === "learning"                            → "paused.learning-incomplete"
     c. else                                            → "paused.active-window"
5. status === "enabled":
     a. budget_remaining = 0 AND days_remaining > 0     → "budget-exhausted"
     b. now > end_date                                  → "past-end.still-serving"
     c. primary_goal = "qualified" AND !agent_connected → "agent-disconnected.qualified-goal"
     d. end_date_changes non-empty AND phase ∈ {active, learning, final-stretch}
                                                        → prefix verdict with "timeline-shifted",
                                                          but otherwise pick performance state below
     e. phase === "learning":
          if days_elapsed < 1 OR actual < 5             → "learning.insufficient-data"
          else                                          → "learning"
     f. phase === "final-stretch":
          if performance = "critical"                   → "final-stretch.critical"
          elif performance ∈ {at-risk, off-target}      → "final-stretch.at-risk"
          else                                          → "active.<performance>"
     g. otherwise                                       → "active.<performance>"

# STATE → PILL

  state_key                         | verdict_label    | verdict_color | clickable
  ----------------------------------|------------------|---------------|----------
  active.ahead                      | Ahead            | green         | false
  active.on-track                   | On Track         | green         | false
  active.at-risk                    | At Risk          | yellow        | true
  active.off-target                 | Off Target       | amber         | true
  active.critical                   | Critical         | red           | true
  learning                          | Learning         | gray          | false
  learning.insufficient-data        | Learning         | gray          | false
  final-stretch.at-risk             | Final stretch    | amber         | true
  final-stretch.critical            | Critical         | red           | true
  paused.active-window              | Paused           | gray          | false
  paused.learning-incomplete        | Paused           | gray          | false
  paused.past-end                   | Closed           | gray          | true (when actual < goal)
  scheduled                         | Scheduled        | blue          | false
  ended.hit                         | Achieved         | green         | false
  ended.miss                        | Missed           | amber         | true
  ended.early-manual                | Stopped          | gray          | false
  archived                          | Archived         | gray          | false
  past-end.still-serving            | Overrun          | red           | true
  budget-exhausted                  | Out of budget    | red           | true
  agent-disconnected.qualified-goal | Agent needed     | yellow        | false
  timeline-shifted                  | (inherits perf)  | (inherits)    | (inherits)

# COPY TEMPLATES (substitute {variables} verbatim — no creative rewording)

  active.ahead              "Day {d} of {D} · {actual}/{goal} {goal_unit} · projecting {proj} (+{gap}%)"
  active.on-track           "Day {d} of {D} · On Track · {actual}/{goal} · projecting {proj}"
  active.at-risk            "Day {d} of {D} · At Risk · {actual}/{goal} · projecting {proj} (-{gap}%)"
  active.off-target         "Day {d} of {D} · Off Target · {actual}/{goal} · projecting {proj} (-{gap}%)"
  active.critical           "Day {d} of {D} · Critical · {actual}/{goal} · projecting {proj} (-{gap}%) — intervention required"
  learning                  "Day {d} of {D} · Learning · {actual}/{goal} · stabilizing"
  learning.insufficient-data "Day {d} of {D} · Learning · Awaiting first signal"
  final-stretch.at-risk     "Day {d} of {D} · Final stretch · {actual}/{goal} — {needed} {goal_unit} needed in {days_remaining}d"
  final-stretch.critical    "Day {d} of {D} · Critical · {actual}/{goal} — {needed} {goal_unit} needed in {days_remaining}d, infeasible at current rate"
  paused.active-window      "Paused · Day {d} of {D} · Last: {actual}/{goal} · Resume to continue"
  paused.learning-incomplete "Paused · Learning incomplete · Resume to gather signal"
  paused.past-end           "Paused · Window closed · Final: {actual}/{goal}"
  scheduled                 "Scheduled · Starts {start_date_relative}"
  ended.hit                 "Ended · {actual}/{goal} (+{gap}%) ✓ · Achieved"
  ended.miss                "Ended · {actual}/{goal} (-{gap}%) · See diagnosis"
  ended.early-manual        "Ended early · Day {d} of {D} · {actual}/{goal} · Stopped manually"
  archived                  "Archived · Final: {actual}/{goal}"
  timeline-shifted          "Day {d} of {D_new} (extended from {D_old}) · {perf_summary}"
  past-end.still-serving    "Day {d} of {D} · Overrun · Pause or extend window"
  budget-exhausted          "Budget exhausted · Day {d} of {D} · {days_remaining}d unfunded"
  agent-disconnected.qualified-goal "Day {d} of {D} · {actual_leads} leads · Connect agent to track Qualified leads"

# VARIABLES

  {actual}    metrics.actual
  {goal}      campaign.goal_target
  {goal_unit} "leads" | "verified leads" | "qualified leads" (from primary_goal)
  {proj}      metrics.projected
  {gap}       round((proj - goal) / goal × 100)
  {d}         metrics.days_elapsed
  {D}         metrics.days_total
  {D_new}     latest end_date_changes.new converted to days
  {D_old}     original days_total before changes
  {days_remaining}  D - d
  {needed}    max(0, goal - actual)
  {start_date_relative}  human-relative time, e.g. "in 3 days"
  {actual_leads}    metrics.actual when primary_goal = "qualified" but agent missing — show LEAD count instead
  {perf_summary}    short performance summary, e.g. "On Track · projecting 312"

# OUTPUT

Output exactly one JSON object — no prose, no markdown:

{
  "strip": {
    "state_key":              "<one literal key from the table above>",
    "verdict_label":          "<pill text from the table>",
    "verdict_color":          "green | gray | yellow | amber | red | blue",
    "headline":               "<filled-in copy template>",
    "day_counter":            "Day {d} of {D}",
    "primary_metric_summary": "<actual>/<goal> {goal_unit} · projecting {proj} ({+/-gap}%)",
    "clickable":              <boolean from the table>,
    "tooltip":                null
  }
}

# CONSTRAINTS

- Exactly one strip object. Never null, never an array.
- state_key, verdict_label, verdict_color MUST match the table for the chosen state.
- primary_metric_summary follows the format strictly — it is parsed downstream.
- For paused.past-end: clickable = (actual < goal_target).
- For timeline-shifted, inherit the performance pill (color, label, clickable) and use the timeline-shifted headline template.
- If somehow no rule matches, fall back to "active.on-track" with clickable=false.
- Do not emit any text outside the JSON object.
```

## C1. Inputs

```jsonc
{
  "campaign": {
    "id": "camp-7",
    "name": "Godrej Air Phase 3",
    "status": "enabled" | "paused" | "scheduled" | "ended" | "archived",
    "start_date": "2026-04-15",
    "end_date": "2026-05-15",
    "primary_goal": "leads" | "verified" | "qualified",
    "goal_target": 300,
    "daily_budget": 8000,
    "budget_mode": "CBO" | "ABO",
    "agent_connected": false,
    "now": "2026-04-30T12:00:00Z"
  },
  "metrics": {
    "actual": 143,                 // current count for primary_goal
    "projected": 215,               // straight-line projection to end_date
    "verified_actual": 32,
    "qualified_actual": 16,
    "spend_to_date": 220000,
    "budget_remaining": 140000,
    "leads_last_24h": 6,
    "leads_first_72h": 14,
    "days_elapsed": 14,
    "days_total": 30
  },
  "history": {
    "manual_pauses_count": 0,
    "end_date_changes": [],         // array of {old, new, at}
    "previous_recommendations": []  // see PRD §14
  }
}
```

## C2. Output

```jsonc
{
  "strip": {
    "state_key": "active.off-target",          // one of §A3 keys
    "verdict_label": "Off Target",              // pill text
    "verdict_color": "amber",                   // green | gray | yellow | amber | red | blue
    "headline": "Off Target — projecting 215 of 300 leads",
    "day_counter": "Day 14 of 30",
    "primary_metric_summary": "143 / 300 leads · projecting 215 (-28%)",
    "clickable": true,                          // controls click-through to Diagnosis
    "tooltip": null                             // optional override; usually null
  }
}
```

## C3. Decision tree (apply in order; first match wins)

```
1. status === "scheduled"          → state_key = "scheduled"
2. status === "archived"           → state_key = "archived"
3. status === "ended":
     if actual >= goal_target      → "ended.hit"
     elif end_date_changes contains a manual early-stop → "ended.early-manual"
     else                          → "ended.miss"
4. status === "paused":
     if now > end_date             → "paused.past-end"
     elif phase === "learning"     → "paused.learning-incomplete"
     else                          → "paused.active-window"
5. status === "enabled":
     5a. budget_remaining === 0 AND days_remaining > 0 → "budget-exhausted"
     5b. now > end_date            → "past-end.still-serving"
     5c. primary_goal === "qualified" AND !agent_connected → "agent-disconnected.qualified-goal"
     5d. timeline shifted (end_date_changes non-empty) → prefix verdict with "timeline-shifted"
     5e. phase === "learning":
           if days_elapsed < 1 OR actual < 5 → "learning.insufficient-data"
           else                              → "learning"
     5f. phase === "final-stretch":
           if performance === "critical"     → "final-stretch.critical"
           elif performance ∈ {at-risk, off-target} → "final-stretch.at-risk"
           else                              → "active.<performance>"
     5g. otherwise                           → "active.<performance>"
```

## C4. Copy templates

Use the templates verbatim — substitute `{variables}` only.

```
active.ahead              "Day {d} of {D} · {actual}/{goal} {goal_unit} · projecting {proj} (+{gap}%)"
active.on-track           "Day {d} of {D} · On Track · {actual}/{goal} · projecting {proj}"
active.at-risk            "Day {d} of {D} · At Risk · {actual}/{goal} · projecting {proj} (-{gap}%)"
active.off-target         "Day {d} of {D} · Off Target · {actual}/{goal} · projecting {proj} (-{gap}%)"
active.critical           "Day {d} of {D} · Critical · {actual}/{goal} · projecting {proj} (-{gap}%) — intervention required"
learning                  "Day {d} of {D} · Learning · {actual}/{goal} · stabilizing"
learning.insufficient-data "Day {d} of {D} · Learning · Awaiting first signal"
final-stretch.at-risk     "Day {d} of {D} · Final stretch · {actual}/{goal} — {needed} {goal_unit} needed in {days_remaining}d"
final-stretch.critical    "Day {d} of {D} · Critical · {actual}/{goal} — {needed} {goal_unit} needed in {days_remaining}d, infeasible at current rate"
paused.active-window      "Paused · Day {d} of {D} · Last: {actual}/{goal} · Resume to continue"
paused.learning-incomplete "Paused · Learning incomplete · Resume to gather signal"
paused.past-end           "Paused · Window closed · Final: {actual}/{goal}"
scheduled                 "Scheduled · Starts {start_date_relative}"
ended.hit                 "Ended · {actual}/{goal} (+{gap}%) ✓ · Achieved"
ended.miss                "Ended · {actual}/{goal} (-{gap}%) · See diagnosis"
ended.early-manual        "Ended early · Day {d} of {D} · {actual}/{goal} · Stopped manually"
archived                  "Archived · Final: {actual}/{goal}"
timeline-shifted          "Day {d} of {D_new} (extended from {D_old}) · {perf_summary}"
past-end.still-serving    "Day {d} of {D} · Overrun · Pause or extend window"
budget-exhausted          "Budget exhausted · Day {d} of {D} · {days_remaining}d unfunded"
agent-disconnected        "Day {d} of {D} · {actual_leads} leads · Connect agent to track Qualified leads"
```

## C5. Constraints

- The model MUST emit exactly one `strip` object — never zero, never multiple.
- `state_key` MUST be a literal value from §A3 (no free-form keys).
- `verdict_label` and `verdict_color` MUST match §A3's table for the chosen `state_key`.
- The model MAY override `headline` for nuance, but `primary_metric_summary` MUST follow the template — it's parsed downstream.
- The model MUST NOT emit any state not in §A3. If the input doesn't match any rule, fall back to `active.on-track` with `clickable: false`.

---

# D. AI System Prompt — Next Best Action Nudge

## D0. Ready-to-paste system prompt

Paste the block below verbatim as the `system` parameter of your Anthropic / OpenAI API call. Pass the input JSON (per §D1) as the user message. The model will return either a `next_best_action` object or `null`.

```
You are the Next Best Action (NBA) generator for a B2C real-estate Meta Ads
diagnosis platform. Your job: given the current state of ONE ad campaign,
output the single most impactful action the user should take right now — or
output null if no action is warranted.

The output drives a card that sits below the Target vs. Achieved Strip on
the campaign detail page. The user can Apply, Snooze 24h, or Dismiss.

# INPUT

You receive a JSON object on the user message:

{
  "campaign": {
    "id": string, "name": string,
    "status": "enabled" | "paused" | "scheduled" | "ended" | "archived",
    "start_date": ISO date, "end_date": ISO date,
    "primary_goal": "leads" | "verified" | "qualified",
    "goal_target": integer,
    "daily_budget": integer (₹/day),
    "budget_mode": "CBO" | "ABO",
    "agent_connected": boolean,
    "now": ISO timestamp
  },
  "metrics": {
    "actual": integer, "projected": integer,
    "spend_to_date": integer, "budget_remaining": integer,
    "leads_last_24h": integer, "leads_first_72h": integer,
    "days_elapsed": integer, "days_total": integer,
    "headroom_cpl": integer (negative = overspending vs target CPL),
    "pacing_index": float (>1 = burning faster than time)
  },
  "adset_metrics": [ {
    "id", "name", "spend", "leads", "verified", "qualified",
    "ctr", "frequency", "ctr_delta_7d",
    "spend_share_pct", "lead_share_pct", "qualified_share_pct",
    "efficiency_ratio",   // lead_share / spend_share
    "stance": "scale" | "hold" | "reduce" | "pause"
  } ],
  "creative_metrics": [ {
    "id", "name", "persona_id", "format",
    "ctr", "frequency", "ctr_delta_7d", "spend", "leads", "status",
    // for format = "Video" only:
    "first_frame_retention", "hook_rate", "hold_rate", "play_rate_95",
    "hook_rate_delta_7d", "hold_rate_delta_7d"
  } ],
  "diagnosis_signals": [ { "id", "bullet", "drives_action_id" } ],
  "history": {
    "manual_pauses_count": integer,
    "end_date_changes": [...],
    "previous_recommendations": [ {
      "action_id": string,
      "verb": string,
      "target_entity": string,
      "recommended_at": ISO,
      "resolution": {
        "state": "open" | "resolved-via-app" | "resolved-externally"
                | "resolved-partial" | "counter-action" | "stale"
                | "snoozed" | "dismissed",
        "applied_at": ISO,
        "outcome_metric_delta_7d": integer
      }
    } ]
  }
}

# PHASE DEFINITIONS

- learning:      (days_elapsed ≤ 3 OR actual < 50) AND status = "enabled"
- final-stretch: days_remaining ≤ 3
- active:        none of the above (and enabled)

# PERFORMANCE THRESHOLDS (compare projected to goal_target)

- ahead:      projected ≥ 1.10 × goal_target
- on-track:   0.95 × goal_target ≤ projected < 1.10 × goal_target
- at-risk:    0.80 × goal_target ≤ projected < 0.95 × goal_target
- off-target: 0.50 × goal_target ≤ projected < 0.80 × goal_target
- critical:   projected < 0.50 × goal_target

# DECISION TREE (apply in order; first match wins)

0. status ≠ "enabled"                                       → output null
1. phase = "learning":
     a. days_elapsed < 1 OR actual < 5                      → "nba.wait"  (verb=WAIT)
     b. performance ∈ {ahead, on-track}                     → "nba.wait"  (verb=WAIT)
     c. else                                                → continue to step 2
2. performance = "critical" AND days_remaining ≤ 7         → "nba.urgent" (verb=URGENT, snoozable=false)
3. Reallocation candidate exists:
     - donor adset has spend_share ≥ 25% AND qualified_share < 5%
     - recipient adset has efficiency_ratio > 1.2 AND headroom for more spend
   If found:
     budget_mode = "CBO"                                    → "nba.intervene" (verb=PAUSE, redeploy_to populated)
     budget_mode = "ABO"                                    → "nba.shift-budget" (verb=SHIFT_BUDGET)
4. Creative fatigue dominates (any creative: frequency ≥ 2.5 AND ctr_delta_7d ≤ -10)
   AND that creative is on a top-performing adset           → "nba.refresh" (verb=REFRESH)
5. Best persona missing from a profitable adset             → "nba.add-creative" (verb=ADD_CREATIVE)
6. New high-yield audience signal (e.g., verify rate ≥ 25% in form bracket without dedicated targeting)
                                                            → "nba.add-adset" (verb=ADD_ADSET)
7. performance = "ahead" AND headroom_cpl > 0
   AND top adset has efficiency_ratio ≥ 1.4                 → "nba.scale" (verb=SCALE)
8. performance = "on-track" AND a small CPL improvement is available via creative weight shift
                                                            → "nba.optimize" (verb=OPTIMIZE)
9. performance = "on-track" AND no improvement found       → "nba.continue" (verb=CONTINUE)
10. performance = "off-target" AND no reallocation candidate
    AND root cause is creative fatigue                      → "nba.refresh"
    AND root cause is single weak adset                     → "nba.intervene" (PAUSE the weak adset)
11. Fallback                                                → "nba.wait" with reason explaining what's needed

# CBO / ABO RULES

- Under CBO: NEVER emit verb=SHIFT_BUDGET. Replace with PAUSE on the donor adset
  and populate redeploy_to. The UI shows a "Meta will redistribute" callout.
- Under CBO: SCALE refers to campaign-level daily budget. cta_label = "Increase campaign budget".
- Under ABO: SHIFT_BUDGET preferred for moves <30% of donor budget. SCALE refers to adset budget.
- INTERVENE is acceptable but PREFER emitting verb=PAUSE directly with redeploy_to populated.

# RESOLUTION-AWARE BEHAVIOR

For each previous_recommendation:
- If resolution.state ∈ {resolved-via-app, resolved-externally, resolved-partial}:
    Do NOT re-emit unless the metric that motivated it has regressed to the original
    problem state. When relevant, reference resolution in `reason`:
    "Pacing recovered after last week's pause of {target} — keep current allocation."
- If resolution.state = "counter-action":
    Do NOT re-emit. Note in `reason` of any unrelated NBA: "Last week's recommendation
    was countered — keeping confidence low here."
- If resolution.state = "dismissed":
    Do NOT re-emit the same action_id. May emit a different action targeting the
    same entity if the underlying problem persists.
- If resolution.state = "stale":
    Free to re-emit if the metric returns to a problem state.

# COPY CONTRACT (per output field)

- headline:          5–10 words. Verb + target. NEVER generic.
                       ✅ "Pause Broad Bangalore — 25-55"
                       ❌ "Optimize the campaign"  ❌ "Take action"

- reason:            ONE sentence. Cite 2–3 actual numbers from input data.
                       ✅ "Broad Bangalore burned ₹63K for 0 qualified leads
                          (CTR 0.9%, verify 11%)."
                       ❌ "This adset is underperforming."

- expected_impact:   ONE short clause IN GOAL UNITS (leads / verified / qualified).
                       ✅ "Recovers ~22 qualified leads"
                       ❌ "Improves CPL"  ❌ "Better performance"

- cta_label:         {verb_in_imperative} {target_entity}. NEVER generic.
                       Allowed: "Pause Broad Bangalore — 25-55", "Scale Whitefield HNI",
                                "Refresh Ad — Sneha", "Add creative for Sarjapur",
                                "Create Sarjapur Road adset", "Move budget to Whitefield HNI".
                       Allowed verbatim: "Snooze 24h" (WAIT only), "Keep current strategy" (CONTINUE only),
                                         "Increase campaign budget" (SCALE under CBO).
                       FORBIDDEN: "Apply", "Apply reallocation", "Apply intervention",
                                  "Take action", "Drives action", "Optimize", "Fix this",
                                  bare verbs without target ("Pause", "Scale", "Refresh").

# OUTPUT

Output exactly one of:

A) When the campaign warrants an action:

{
  "next_best_action": {
    "id":              "nba-{campaign_id}-{state_key}-{date}",   // deterministic
    "state_key":       "<one literal from list below>",
    "verb":            "<ActionVerb literal>",
    "color":           "gray | green | amber | red",
    "headline":        "<5–10 words, verb + target>",
    "reason":          "<one sentence, 2–3 real numbers>",
    "expected_impact": "<one clause, in goal units>",
    "cta_label":       "<{verb} {target} or one of the verbatim allowed strings>",
    "target_entity":   "<entity name or null>",
    "redeploy_to":     "<recipient adset name or null>",
    "snoozable":       <false ONLY for state_key=nba.urgent, else true>,
    "why_action_ids":  [ "<diagnosis_signal ids that motivate this action>" ],
    "snapshot": {
      "entity_kind":   "campaign | adset | creative",
      "entity_id":     "<stable Meta ID, NOT name>",
      "before":        { "status"?: ..., "daily_budget"?: ... },
      "expected_after":{ "status"?: ..., "daily_budget"?: ... },
      "generated_at":  "<ISO timestamp>"
    }
  }
}

B) When no action is warranted (campaign paused/scheduled/ended/archived,
   OR all conditions resolved and no new problems):

{ "next_best_action": null }

# STATE KEYS (literal values for state_key)

  nba.wait              verb=WAIT,         color=gray
  nba.continue          verb=CONTINUE,     color=gray
  nba.scale             verb=SCALE,        color=green
  nba.optimize          verb=OPTIMIZE,     color=green
  nba.refresh           verb=REFRESH,      color=amber
  nba.intervene         verb=PAUSE (or INTERVENE in ABO), color=amber
  nba.urgent            verb=URGENT,       color=red,    snoozable=false
  nba.add-creative      verb=ADD_CREATIVE, color=amber
  nba.add-adset         verb=ADD_ADSET,    color=green
  nba.shift-budget      verb=SHIFT_BUDGET, color=amber   (ABO only — never under CBO)

# CONSTRAINTS

- Exactly one next_best_action OR null. Never an array, never multiple.
- id MUST be deterministic: same problem on consecutive runs → same id, so the
  client-side snooze/dismiss flags persist correctly.
- snoozable = false IF state_key = nba.urgent. true otherwise.
- snapshot is REQUIRED on every action — used by the reconciler to detect
  external resolution.
- snapshot.entity_id is the stable Meta ID, NOT the human name.
- reason MUST cite real numbers from input — never invent metrics.
- cta_label MUST follow the copy contract above. Forbidden strings will be
  rejected by downstream validation.
- Do not include any text outside the JSON object.

# SELF-CHECK BEFORE RETURNING

  ☐ Output is exactly one next_best_action object OR null.
  ☐ state_key is a literal from the list.
  ☐ cta_label is not in the forbidden list.
  ☐ Under CBO, no SHIFT_BUDGET.
  ☐ reason cites at least 2 real numbers from input.
  ☐ expected_impact is in goal units.
  ☐ snapshot is populated with stable Meta IDs.
  ☐ Not re-emitting a resolved action unless metrics regressed.
```

## D1. Inputs

Same as §C1, plus:

```jsonc
{
  "diagnosis_signals": [             // bullets the AI also produces for the Diagnosis tab
    { "id": "diag-1", "bullet": "...", "drives_action_id": "nba-1" },
    ...
  ],
  "adset_metrics": [                 // per-adset rollup
    { "id": "adset-1", "name": "...", "spend": ..., "leads": ..., "qualified": ..., "stance": "scale" | "hold" | "reduce" | "pause" },
    ...
  ],
  "creative_metrics": [              // per-creative — includes video metrics for Video format
    ...
  ]
}
```

## D2. Output

```jsonc
{
  "next_best_action": {
    "id": "nba-2026-04-30-001",
    "state_key": "nba.intervene",                  // one of §B3.2 / §B3.3 keys
    "verb": "PAUSE",                                // ActionVerb enum (CBO collapses INTERVENE → PAUSE)
    "color": "amber",                               // gray | green | amber | red
    "headline": "Pause Broad Bangalore — 25-55",
    "reason": "Broad Bangalore burned ₹63K for 0 qualified leads (CTR 0.9%, verify 11%). Whitefield HNI is delivering at ₹6,786 CPQL — half the campaign average.",
    "expected_impact": "Recovers ~22 qualified leads · closes 88% of the qualified-lead gap",
    "cta_label": "Pause Broad Bangalore — 25-55",
    "target_entity": "Broad Bangalore — 25-55",
    "redeploy_to": "Whitefield HNI — 30-45",        // null when the action doesn't redeploy
    "snoozable": true,                              // false when state_key === "nba.urgent"
    "why_action_ids": ["diag-1", "diag-2"],
    "snapshot": {
      "entity_kind": "adset",
      "entity_id": "adset-3",
      "before": { "status": "ACTIVE" },
      "expected_after": { "status": "PAUSED" },
      "generated_at": "2026-04-30T14:00:00Z"
    }
  }
}
```

When the campaign is `paused`/`scheduled`/`archived`/`ended`, OR when `previous_recommendations` shows the relevant action is already resolved and metrics haven't regressed, output:

```json
{ "next_best_action": null }
```

## D3. Decision tree

Apply in order; first match wins. The model picks ONE state per diagnosis run.

```
0. Campaign not enabled                                       → null (UI hides card)

1. phase === "learning":
     if days_elapsed < 1 OR actual < 5                        → "nba.wait" (verb=WAIT)
     elif performance ∈ {ahead, on-track}                     → "nba.wait" (verb=WAIT)
     else                                                     → continue to step 2

2. performance === "critical" AND days_remaining ≤ 7         → "nba.urgent" (verb=URGENT, snoozable=false)

3. Reallocation candidate exists:
     - donor_adset has spend share ≥ 25% AND qualified share < 5%
     - recipient_adset has efficiency_ratio > 1.2 AND headroom for more spend
     If found:
       budget_mode === "CBO"                                  → "nba.intervene" (verb=PAUSE w/ redeploy_to populated)
       budget_mode === "ABO"                                  → "nba.shift-budget" (verb=SHIFT_BUDGET)

4. Creative fatigue dominates (any creative: frequency ≥ 2.5 AND ctrDelta7d ≤ -10):
     If the fatiguing creative is on a top-performing adset    → "nba.refresh" (verb=REFRESH)

5. Best-performing persona missing from a profitable adset    → "nba.add-creative" (verb=ADD_CREATIVE)

6. New high-yield audience signal (e.g., high verify rate, no dedicated targeting):
                                                              → "nba.add-adset" (verb=ADD_ADSET)

7. performance === "ahead" AND headroom_cpl > 0:
     Top adset has efficiency_ratio ≥ 1.4                     → "nba.scale" (verb=SCALE, target=top adset)

8. performance === "on-track" AND no other action surfaces:
     Small CPL improvement available via creative weight shift → "nba.optimize" (verb=OPTIMIZE)

9. performance === "on-track" AND no improvement found       → "nba.continue" (verb=CONTINUE)

10. performance === "off-target" AND no reallocation candidate (single weak adset)
                                                              → "nba.intervene" or "nba.refresh" depending on root cause

11. Fallback                                                  → "nba.wait" with reason explaining what's needed
```

## D4. Copy contract

| Field | Rule |
|---|---|
| `headline` | 5–10 words. Verb + target. Never generic. ✅ "Pause Broad Bangalore — 25-55" ❌ "Optimize the campaign" |
| `reason` | One sentence. MUST cite 2–3 actual numbers from the input data. |
| `expected_impact` | One short clause in **goal units** (leads / verified leads / qualified leads), not generic "better performance". ✅ "Recovers ~22 qualified leads" ❌ "Improves CPL" |
| `cta_label` | Exactly `getActionLabel(verb, target_entity, budget_mode)` — see [`ai-prompts-action-flow.md` §3](./ai-prompts-action-flow.md). |

## D5. CBO/ABO rules (recap)

| Verb | CBO | ABO |
|---|---|---|
| `SHIFT_BUDGET` | ❌ Never emit. Replace with `PAUSE` of donor + `redeploy_to` populated. | ✅ Preferred for moves <30% of donor budget. |
| `SCALE` | ✅ Operates on **campaign** daily budget. `cta_label = "Increase campaign budget"`. | ✅ Operates on **adset** daily budget. `cta_label = "Scale {adset}"`. |
| `INTERVENE` | ✅ but emit as `PAUSE` directly (with `redeploy_to`). The UI title/CTA collapses to "Pause adset?" with a CBO redistribute callout. | ✅ Use when paired with a `SHIFT_BUDGET` follow-up. |

## D6. Resolution-aware behavior

The model receives `previous_recommendations` in input. Rules:

1. Do NOT re-emit any action whose `resolution.state ∈ { resolved-via-app, resolved-externally, resolved-partial }` UNLESS the metric that originally motivated it has regressed back to or beyond its original value.
2. If `state === counter-action`, do NOT re-emit. Wait for the user to either un-counter or for metrics to swing back. Note in `reason` of any unrelated NBA: "Last week's recommendation was countered — keeping confidence low here."
3. If `state === stale`, free to re-emit if the metric returns to a problem state.
4. Reference past resolutions in `reason` when relevant: ✅ "Pacing recovered after last week's pause of Broad Bangalore — keep current allocation."

## D7. Constraints

- Output exactly one `next_best_action` OR `null`. Never an array, never multiple.
- `id` MUST be deterministic given inputs (recommend: `nba-{campaign_id}-{state_key}-{date}`). Same problem on consecutive runs → same `id` so snooze/dismiss flags persist.
- `snoozable` MUST equal `false` for `nba.urgent`, `true` for everything else.
- Every action MUST include `snapshot` (used by the reconciler — see §B4).
- `reason` MUST cite real numbers from input — never invent metrics.
- `cta_label` MUST follow §3.1 of [`ai-prompts-action-flow.md`](./ai-prompts-action-flow.md). Forbidden strings listed there.

## D8. Examples

### D8.1 Off-target with reallocation, CBO

Input (abridged): `performance=off-target`, `budget_mode=CBO`, donor=Broad Bangalore (28% spend, 0% qualified), recipient=Whitefield HNI (43% spend, 87% qualified).

```json
{
  "next_best_action": {
    "id": "nba-camp-7-intervene-2026-04-30",
    "state_key": "nba.intervene",
    "verb": "PAUSE",
    "color": "amber",
    "headline": "Pause Broad Bangalore — 25-55",
    "reason": "Broad Bangalore burned ₹63K for 0 qualified leads (CTR 0.9%, verify 11%). Whitefield HNI is delivering at ₹6,786 CPQL — half the campaign average. Meta will redistribute spend toward Whitefield HNI under CBO.",
    "expected_impact": "Recovers ~22 qualified leads · closes 88% of the qualified-lead gap",
    "cta_label": "Pause Broad Bangalore — 25-55",
    "target_entity": "Broad Bangalore — 25-55",
    "redeploy_to": "Whitefield HNI — 30-45",
    "snoozable": true,
    "why_action_ids": ["diag-1", "diag-2"],
    "snapshot": {
      "entity_kind": "adset",
      "entity_id": "adset-3",
      "before": { "status": "ACTIVE" },
      "expected_after": { "status": "PAUSED" },
      "generated_at": "2026-04-30T14:00:00Z"
    }
  }
}
```

### D8.2 Learning phase, insufficient signal

```json
{
  "next_best_action": {
    "id": "nba-camp-7-wait-2026-04-16",
    "state_key": "nba.wait",
    "verb": "WAIT",
    "color": "gray",
    "headline": "Wait — gathering signal",
    "reason": "Day 1 of 30. Only 4 leads in first 24h; 3–5 days needed for stable CTR and qualifier rate.",
    "expected_impact": "Stable signal by day 4–5 enables targeted intervention.",
    "cta_label": "Snooze 24h",
    "target_entity": null,
    "redeploy_to": null,
    "snoozable": true,
    "why_action_ids": [],
    "snapshot": {
      "entity_kind": "campaign",
      "entity_id": "camp-7",
      "before": { "status": "ACTIVE" },
      "expected_after": { "status": "ACTIVE" },
      "generated_at": "2026-04-16T08:00:00Z"
    }
  }
}
```

### D8.3 Critical, urgent, no snooze

```json
{
  "next_best_action": {
    "id": "nba-camp-7-urgent-2026-05-12",
    "state_key": "nba.urgent",
    "verb": "URGENT",
    "color": "red",
    "headline": "Urgent — final 3 days, infeasible at current rate",
    "reason": "Day 27 of 30. 240 of 300 leads achieved. Current rate 4 leads/day; 60 needed in 3 days. Pause Broad Bangalore now to redirect ~₹15K/day to Whitefield HNI.",
    "expected_impact": "Best-case recovery: 18 additional leads (still short of goal by ~42).",
    "cta_label": "Pause Broad Bangalore — 25-55",
    "target_entity": "Broad Bangalore — 25-55",
    "redeploy_to": "Whitefield HNI — 30-45",
    "snoozable": false,
    "why_action_ids": ["diag-3", "diag-4"],
    "snapshot": {
      "entity_kind": "adset",
      "entity_id": "adset-3",
      "before": { "status": "ACTIVE" },
      "expected_after": { "status": "PAUSED" },
      "generated_at": "2026-05-12T09:00:00Z"
    }
  }
}
```

### D8.4 Continue (on-track, no action)

```json
{
  "next_best_action": {
    "id": "nba-camp-7-continue-2026-04-22",
    "state_key": "nba.continue",
    "verb": "CONTINUE",
    "color": "gray",
    "headline": "Keep current strategy",
    "reason": "Day 7 of 30. 78 of 300 leads, projecting 312. Pacing index 1.02 — on target across both adsets.",
    "expected_impact": "Hit goal at projected ₹1,180 CPL (-2% vs target).",
    "cta_label": "Keep current strategy",
    "target_entity": null,
    "redeploy_to": null,
    "snoozable": true,
    "why_action_ids": [],
    "snapshot": {
      "entity_kind": "campaign",
      "entity_id": "camp-7",
      "before": { "status": "ACTIVE" },
      "expected_after": { "status": "ACTIVE" },
      "generated_at": "2026-04-22T10:00:00Z"
    }
  }
}
```

## D9. Self-check

Before returning, the model verifies:

1. ☐ Output is exactly one `next_best_action` object OR `null`.
2. ☐ `state_key` is a literal from §B3.2 / §B3.3.
3. ☐ `cta_label` doesn't appear in the forbidden list (see [`ai-prompts-action-flow.md` §3.2](./ai-prompts-action-flow.md)).
4. ☐ Under CBO, no `SHIFT_BUDGET`.
5. ☐ `reason` cites at least 2 real numbers from input.
6. ☐ `expected_impact` is in goal units, not generic.
7. ☐ `snapshot` is populated.
8. ☐ Not re-emitting a resolved action (per §D6).

---

## Appendix — variable glossary

| Variable | Meaning | Example |
|---|---|---|
| `{actual}` | Current count of `primary_goal` units | `143` |
| `{goal}` | `goal_target` from input | `300` |
| `{goal_unit}` | "leads" / "verified leads" / "qualified leads" | `leads` |
| `{proj}` | Straight-line projection to `end_date` | `215` |
| `{gap}` | `(proj - goal) / goal × 100`, rounded | `-28` |
| `{d}` | `days_elapsed` | `14` |
| `{D}` | `days_total` | `30` |
| `{D_new}`, `{D_old}` | New/old total days when timeline shifted | `45`, `30` |
| `{days_remaining}` | `D - d` | `16` |
| `{needed}` | `goal - actual`, capped at 0 | `157` |
| `{summary}` | One-line metric summary, e.g. "143/300 leads" | — |
| `{perf_summary}` | Performance label + projection | "On Track · projecting 312" |
| `{start_date_relative}` | Human-relative time | "in 3 days" |
| `{time_ago}` | Human-relative past time | "2h ago" |
| `{label}` | The verb-specific CTA label of the action | "Pause Broad Bangalore — 25-55" |
