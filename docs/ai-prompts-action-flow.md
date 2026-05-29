# AI Prompts — Action Flow & Video Diagnosis

**Purpose**: Updates to the campaign-diagnosis system prompt that the orchestrator AI uses to emit actions and creative signals. The MVP UI is already wired to consume the new fields — the LLM just has to start producing them.

This file is a **delta** against the existing prompt at [`docs/ai-prompt-campaign-diagnosis.md`](./ai-prompt-campaign-diagnosis.md). Apply each section as a patch.

---

## 1. New input fields

### 1.1 Campaign-level

```jsonc
{
  // ...existing campaign-level fields
  "budget_mode": "CBO" | "ABO",                  // NEW — required
  "campaign_daily_budget": 8000,                 // ₹/day; required when budget_mode === "CBO"
  "primary_goal": "leads" | "verified" | "qualified"  // already implied; now formalized
}
```

### 1.2 Per-creative (when format === "Video")

```jsonc
{
  "id": "cr-rajesh-3",
  "name": "Ad — Rajesh",
  "persona_id": "p-rajesh",
  "format": "Video",
  // ...existing CTR/frequency/spend/leads
  "first_frame_retention": 0.85,    // 0–1; % of impressions where first frame fully renders
  "hook_rate": 0.21,                 // 0–1; % retained at 3 seconds
  "hold_rate": 0.42,                 // 0–1; % retained between 3s and 75% of duration
  "play_rate_95": 0.11,              // 0–1; % completing 95% of the video
  "hook_rate_delta_7d": -7,          // percentage points
  "hold_rate_delta_7d": -5           // percentage points
}
```

These fields are **only** present when `format === "Video"`. For Carousel / Image creatives, do not invent placeholder values; the model should not reason about hook/hold for non-video formats.

### 1.3 Previous recommendations (for resolution-aware diagnosis — Phase 3 of the PRD)

```jsonc
{
  "previous_recommendations": [
    {
      "action_id": "nba-1",
      "verb": "PAUSE",
      "target_entity": "Broad Bangalore — 25-55",
      "recommended_at": "2026-04-23T10:00:00Z",
      "resolution": {
        "state": "resolved-externally",
        "applied_at": "2026-04-23T14:30:00Z",
        "outcome_metric_delta_7d": -240   // CPL change since resolution; negative = improved
      }
    }
  ]
}
```

The model should **not** re-emit any action whose `resolution.state` ∈ `{ "resolved-via-app", "resolved-externally", "resolved-partial" }` *unless* the underlying metrics have regressed back to a problem state. When relevant, reference past resolutions in `reason` for continuity (e.g., "Pacing recovered after last week's pause of Broad Bangalore — keep current allocation.").

---

## 2. CBO / ABO rules

These rules control which `verb` values the model is allowed to emit and how copy should read.

### 2.1 When `budget_mode === "CBO"`

**Forbidden verbs**: `SHIFT_BUDGET`. Replace with `PAUSE` of the donor adset (Meta redistributes automatically under CBO).

**Verb-specific copy adaptations**:

| Verb | CBO copy rule |
|---|---|
| `PAUSE` | When the action is part of a reallocation, the `reason` MUST mention "Meta will redistribute spend toward {recipient_adset}" — the recipient still goes in `redeploy_to`. |
| `SCALE` | The action targets the **campaign-level** daily budget. `cta_label` reads `Increase campaign budget` (no adset name). `expected_impact` is in goal units, not adset-level lead count. |
| `INTERVENE` | Acceptable, but the underlying op is always a `PAUSE` of the donor + automatic redistribution. The model SHOULD prefer emitting `PAUSE` directly with `redeploy_to` populated, rather than `INTERVENE`. |
| `ADD_ADSET` | New adset inherits the campaign budget. Don't reference adset-level budget in the recommendation. |

### 2.2 When `budget_mode === "ABO"`

`SHIFT_BUDGET` is the preferred reallocation primitive. `SCALE` refers to the **adset-level** daily budget — `cta_label` reads `Scale {adset_name}`. The model can mix `SHIFT_BUDGET` and `PAUSE` based on the size of the move (rule of thumb: <30% of adset budget → SHIFT, >30% → PAUSE).

---

## 3. CTA-label contract

Every action MUST set `cta_label` to a **verb-specific imperative phrase that names the target entity**. Generic labels are forbidden.

### 3.1 Allowed forms

| Verb | Format | Example |
|---|---|---|
| `PAUSE` | `Pause {target}` | `Pause Broad Bangalore — 25-55` |
| `SCALE` (CBO) | `Increase campaign budget` | (literal) |
| `SCALE` (ABO) | `Scale {adset}` | `Scale Whitefield HNI — 30-45` |
| `SHIFT_BUDGET` | `Move budget to {recipient}` | `Move budget to Whitefield HNI — 30-45` |
| `REFRESH` | `Refresh {target}` or `Reformat {target}` (use Reformat when video weakness is present) | `Refresh Ad — Sneha` / `Reformat Ad — Vikram` |
| `ADD_CREATIVE` | `Add creative for {persona_or_adset}` | `Add creative for Whitefield HNI` |
| `ADD_ADSET` | `Create {targeting_hint} adset` | `Create Sarjapur Road adset` |
| `CONTINUE` | `Keep current strategy` | (literal) |
| `WAIT` | `Snooze 24h` | (literal) |

### 3.2 Forbidden labels

The model MUST NOT emit any of these strings as `cta_label`:

- `Apply`
- `Apply reallocation`
- `Apply intervention`
- `Take action`
- `Drives action`
- `Continue` (without context)
- `Optimize`
- `Fix this`
- Any imperative without a target — e.g., bare `Pause`, `Scale`, `Refresh`

### 3.3 Validation hint

If you generate a `cta_label` that violates §3.1 / §3.2, the UI will fall back to a computed label using `getActionLabel(verb, target_entity, budget_mode)`. The fallback works, but the model should produce the labels directly so the prompt and UI stay in sync.

---

## 4. Diagnosis-bullet sub-types for video creatives

Existing diagnosis bullets use one of `{TOF, MOF, BOF}` chips to point at a funnel stage. Video creatives now get **four explicit sub-types** that the model should pick when a video weakness is the cause.

| Sub-type | Trigger condition | Recommended action |
|---|---|---|
| `VIDEO_THUMBNAIL_DROP` | `first_frame_retention < 0.80` | `REFRESH` — re-cut thumbnail/preview frame |
| `VIDEO_WEAK_HOOK` | `hook_rate < 0.25` OR `hook_rate_delta_7d <= -5` | `REFRESH` — rework first 3 seconds |
| `VIDEO_PACING_COLLAPSE` | `hold_rate < 0.50` OR `hold_rate_delta_7d <= -8` | `REFRESH` — restructure middle pacing |
| `VIDEO_STORY_INCOMPLETE` | `play_rate_95 < 0.15` AND `hold_rate >= 0.50` | `REFRESH` — rework CTA / final 25% |

### 4.1 Priority

When a single creative could match multiple sub-types, emit the most specific one in this priority order:

```
VIDEO_THUMBNAIL_DROP > VIDEO_WEAK_HOOK > VIDEO_PACING_COLLAPSE > VIDEO_STORY_INCOMPLETE
```

Rationale: a viewer who never saw the first frame can't be diagnosed as having a weak hook — surface the upstream-most failure.

### 4.2 Bullet-text contract for video sub-types

Each video bullet MUST include at least **two real video metrics** — not just CTR. Examples:

✅ `"Ad — Rajesh — first-frame retention 85%, hook rate 21% (-7pp in 7d). Viewers skip before the video plays."`

✅ `"Ad — Vikram — hold rate 45% (-8pp in 7d), play-rate-95 12%. Viewers drop off mid-video."`

❌ `"Ad — Rajesh — video underperforming. Refresh."` *(no metrics)*

❌ `"Ad — Rajesh — CTR 1.4%, fatiguing."` *(CTR-only; doesn't use video metrics)*

### 4.3 Persona-level escalation: "Reformat"

When **the same video weakness sub-type** fires across **the majority of a persona-ad's placements** (e.g., `Ad — Vikram` shows `VIDEO_WEAK_HOOK` in both Sarjapur and Broad), the issue is creative-level, not audience-level. The model should:

- Emit a **single** action per persona, not one per placement.
- Use `verb: "REFRESH"`.
- Set `cta_label` to `Reformat {creative_name}` (not `Refresh`) — signals to the user that a rebuild is needed, not a tweak.
- In `reason`, mention all affected placements: `"Weak hook (avg 19%, -5pp in 7d) across both Sarjapur IT Corridor and Broad Bangalore — 25-55. Audience isn't the issue; rebuild the opening."`

---

## 5. Snapshot field for resolution (forward-compat)

For Phase 3 of the PRD (state reconciliation), every action MUST include a `snapshot` capturing the entity's state at the moment of recommendation. Populate this even if the consumer ignores it for now — it's load-bearing for the reconciliation step.

```jsonc
{
  "id": "nba-1",
  "verb": "PAUSE",
  "target_entity": "Broad Bangalore — 25-55",
  // ...
  "snapshot": {
    "entity_kind": "adset",
    "entity_id": "adset-3",          // stable Meta ID, NOT the name
    "before": {
      "status": "ACTIVE",
      "daily_budget": 15000           // null under CBO since budget is campaign-level
    },
    "expected_after": {
      "status": "PAUSED"
    },
    "generated_at": "2026-04-30T14:00:00Z"
  }
}
```

The exact reconciliation rules live in [`docs/prd-insight-nudges.md`](./prd-insight-nudges.md) §14. Prompt-side, the model just needs to emit the snapshot — it doesn't need to know how reconciliation works.

---

## 6. Examples (full action objects)

### 6.1 INTERVENE under CBO (today's mock NBA)

```json
{
  "id": "nba-1",
  "verb": "PAUSE",
  "color": "amber",
  "headline": "Pause Broad Bangalore — 25-55",
  "reason": "Broad Bangalore burned ₹63K for 0 qualified leads (CTR 0.9%, verify 11%). Whitefield HNI is delivering at ₹6,786 CPQL — half the campaign average. Meta will redistribute spend toward Whitefield HNI under CBO.",
  "expected_impact": "Recovers ~22 qualified leads · closes 88% of the qualified-lead gap (22 of 25)",
  "cta_label": "Pause Broad Bangalore — 25-55",
  "target_entity": "Broad Bangalore — 25-55",
  "redeploy_to": "Whitefield HNI — 30-45",
  "why_action_ids": ["diag-1", "diag-2"],
  "snapshot": {
    "entity_kind": "adset",
    "entity_id": "adset-3",
    "before": { "status": "ACTIVE", "daily_budget": null },
    "expected_after": { "status": "PAUSED" },
    "generated_at": "2026-04-30T14:00:00Z"
  }
}
```

Note that under CBO we emit `verb: "PAUSE"` directly, not `INTERVENE` — see §2.1.

### 6.2 SCALE under CBO

```json
{
  "id": "act-scale-cbo",
  "verb": "SCALE",
  "headline": "Increase campaign budget",
  "reason": "Whitefield HNI is delivering at ₹6,786 CPQL with frequency 1.6 — well below saturation. Pacing index 0.91 means the campaign is under-spending vs time elapsed.",
  "expected_impact": "+18 qualified leads/week at projected CPQL ₹7,100 (+5% headroom on cost)",
  "cta_label": "Increase campaign budget",
  "target_entity": null,
  "redeploy_to": null,
  "snapshot": {
    "entity_kind": "campaign",
    "entity_id": "camp-7",
    "before": { "daily_budget": 8000 },
    "expected_after": { "daily_budget": 9600 },
    "generated_at": "2026-04-30T14:00:00Z"
  }
}
```

### 6.3 Reformat (video weakness across multiple placements)

```json
{
  "id": "act-reformat-vikram",
  "verb": "REFRESH",
  "headline": "Reformat Ad — Vikram",
  "reason": "Ad — Vikram has weak hook (avg 19%, -5pp in 7d) and pacing collapse (hold rate 45%, -8pp) across both Sarjapur IT Corridor and Broad Bangalore — 25-55. Audience isn't the issue; rebuild the opening 10 seconds.",
  "expected_impact": "Restores hook rate to ~28% and CTR to ~1.8%; recovers ~6 leads/week.",
  "cta_label": "Reformat Ad — Vikram",
  "target_entity": "Ad — Vikram",
  "redeploy_to": null,
  "snapshot": {
    "entity_kind": "creative",
    "entity_id": "cr-vikram-1",
    "before": { "status": "ACTIVE" },
    "expected_after": { "status": "ACTIVE" },
    "generated_at": "2026-04-30T14:00:00Z"
  }
}
```

### 6.4 Diagnosis bullet — VIDEO_WEAK_HOOK

```json
{
  "id": "diag-video-1",
  "bullet": "Ad — Vikram — hook rate 18% (-6pp in 7d), first-frame retention 77%. First 3 seconds aren't holding viewers in Broad Bangalore.",
  "tof": "CTR 1.2% vs 1.9% top placement",
  "mof": null,
  "bof": null,
  "subtype": "VIDEO_WEAK_HOOK",
  "drives_action_id": "act-reformat-vikram"
}
```

---

## 7. System-prompt patch (apply verbatim to `ai-system-prompt.md`)

```
The campaign you are diagnosing has:
  budget_mode: {{ "CBO" | "ABO" }}
  primary_goal: {{ "leads" | "verified" | "qualified" }}

CBO RULES (apply when budget_mode === "CBO"):
  - NEVER emit a SHIFT_BUDGET action. Replace with PAUSE on the donor adset.
  - Prefer emitting PAUSE directly with `redeploy_to` populated, instead of INTERVENE.
  - SCALE actions refer to the campaign-level daily budget. cta_label reads "Increase campaign budget".
  - When pausing as part of a reallocation, mention "Meta will redistribute spend toward {recipient}" in `reason`.

ABO RULES (apply when budget_mode === "ABO"):
  - SHIFT_BUDGET is the preferred reallocation primitive for moves <30% of donor budget.
  - SCALE refers to the adset-level daily budget. cta_label reads "Scale {adset_name}".

CTA LABEL CONTRACT (always):
  - cta_label MUST be `{verb_in_imperative} {target_entity}` — never generic.
  - Forbidden: "Apply", "Apply reallocation", "Take action", "Drives action", "Optimize", bare verbs.
  - The only generic label allowed is "Snooze 24h" for WAIT verbs and "Keep current strategy" for CONTINUE.

VIDEO DIAGNOSIS (when a creative has format === "Video"):
  - Use the four sub-types: VIDEO_THUMBNAIL_DROP, VIDEO_WEAK_HOOK, VIDEO_PACING_COLLAPSE, VIDEO_STORY_INCOMPLETE.
  - Priority: thumbnail > hook > pacing > story.
  - Diagnosis bullets MUST include two real video metrics, not just CTR.
  - When the same sub-type fires across the majority of a persona's placements, emit ONE action per persona with cta_label "Reformat {creative_name}", not multiple per-placement actions.

PREVIOUS RECOMMENDATIONS:
  - Do not re-emit any action whose resolution.state is resolved-* unless metrics have regressed.
  - Reference past resolutions in `reason` when relevant (e.g., "Pacing recovered after last week's pause…").

SNAPSHOT (every action):
  - Every action MUST include a `snapshot` object with entity_kind, entity_id, before, expected_after, generated_at.
  - entity_id is the stable Meta ID, not the human name.
```

---

## 8. Validation checklist for prompt output

Before returning, the model should self-check:

1. ☐ Every action has `verb`, `cta_label`, `target_entity` (where applicable), `snapshot`.
2. ☐ No `cta_label` is in the forbidden list (§3.2).
3. ☐ Under CBO, no `SHIFT_BUDGET` actions exist.
4. ☐ Every video diagnosis bullet has at least two video metrics referenced.
5. ☐ No action duplicates a `previous_recommendations` entry whose state is `resolved-*` unless metrics regressed.
6. ☐ When the same video weakness applies to a persona across multiple placements, only ONE action per persona is emitted (Reformat pattern).
