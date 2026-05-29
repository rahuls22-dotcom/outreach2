# AI Prompt — Campaign Diagnosis (Action-First)

## What it produces

An **action-first health report** for a single campaign. The output leads with the *single most impactful action* the user should take, supported by a status badge and funnel-connecting reasoning. The frontend renders this as a top banner above the existing summary line.

**Example output:**
> 🎯 **Pause Broad Bangalore adset** to recover ₹25K/day in wasted spend.
> *Expected: CPQL drops ~22%, freed budget can scale Whitefield HNI.*
>
> Status: **NEAR TARGET** — CPL ₹1,183 vs target ₹1,200. Improving trend visible in second half of the flight.

The output is split into two layers:
- **Action layer (NEW):** the verb + target + outcome the user should act on now
- **Diagnostic layer (existing):** status, summary, and funnel-connecting reasons

---

## Data payload sent to the LLM

The payload now includes **bottom-of-funnel signal** (verification rate, qualification rate, site visit counts) so the AI can reason across TOF→MOF→BOF, not just upstream metrics.

```json
{
  "campaign": {
    "name": "Godrej Air Phase 3",
    "status": "active",
    "platform": "Meta",
    "created_at": "2025-11-20",
    "duration_days": 30,
    "days_elapsed": 22,
    "days_remaining": 8
  },
  "targets": {
    "total_budget": 240000,
    "daily_budget": 8000,
    "target_type": "leads",
    "target_value": 200,
    "target_cost_per_lead": 1200
  },
  "actuals": {
    "total_spend": 220000,
    "leads": 186,
    "verified_leads": 42,
    "qualified_leads": 22,
    "site_visits": 8,
    "won": 1,
    "cpl": 1183,
    "cpvl": 5238,
    "cpql": 10000,
    "verification_rate": 0.226,
    "qualification_rate": 0.118,
    "qualified_to_site_visit_rate": 0.364
  },
  "pacing": {
    "expected_spend_by_now": 176000,
    "expected_leads_by_now": 147,
    "spend_ratio": 1.25,
    "lead_delivery_ratio": 1.27,
    "cost_efficiency_ratio": 1.01,
    "health_score": 0.88,
    "health_status": "on-track"
  },
  "platform_metrics": {
    "impressions": 2810000,
    "reach": 985000,
    "link_clicks": 44960,
    "cpm": 78.29,
    "ctr": 1.60,
    "cpc": 4.89,
    "frequency": 2.85,
    "click_to_lead_rate": 0.0041
  },
  "trend": {
    "cpl_7_day_trend": [1250, 1190, 1210, 1183],
    "cpl_trend_direction": "improving",
    "cpl_7_day_change_pct": -5.4,
    "ctr_trend_direction": "stable",
    "qualification_rate_trend_direction": "stable"
  },
  "ad_sets": [
    {
      "name": "Whitefield HNI — 30-45",
      "spend": 95000,
      "leads": 72,
      "verified_leads": 22,
      "qualified_leads": 14,
      "site_visits": 4,
      "cpl": 920,
      "cpql": 6786,
      "ctr": 2.4,
      "cpm": 80.51,
      "frequency": 2.91,
      "verification_rate": 0.306,
      "qualification_rate": 0.194,
      "diagnosis": "on-track"
    },
    {
      "name": "Sarjapur IT Corridor",
      "spend": 62000,
      "leads": 58,
      "verified_leads": 14,
      "qualified_leads": 8,
      "site_visits": 3,
      "cpl": 1069,
      "cpql": 7750,
      "ctr": 1.9,
      "cpm": 77.78,
      "frequency": 2.65,
      "verification_rate": 0.241,
      "qualification_rate": 0.138,
      "diagnosis": "on-track"
    },
    {
      "name": "Broad Bangalore — 25-55",
      "spend": 63000,
      "leads": 56,
      "verified_leads": 6,
      "qualified_leads": 0,
      "site_visits": 0,
      "cpl": 1680,
      "cpql": null,
      "ctr": 0.9,
      "cpm": 60.50,
      "frequency": 4.15,
      "verification_rate": 0.107,
      "qualification_rate": 0.0,
      "diagnosis": "pause-candidate"
    }
  ],
  "form_response_signals": {
    "by_timeline": [
      { "answer": "Immediate",       "leads": 78, "qualified": 18, "site_visits": 6 },
      { "answer": "Within 3 months", "leads": 64, "qualified": 4,  "site_visits": 2 },
      { "answer": "6-12 months",     "leads": 32, "qualified": 0,  "site_visits": 0 },
      { "answer": ">12 months",      "leads": 12, "qualified": 0,  "site_visits": 0 }
    ],
    "by_budget": [
      { "answer": "₹2Cr+",       "leads": 52, "qualified": 19, "site_visits": 7 },
      { "answer": "₹1Cr - ₹2Cr", "leads": 84, "qualified": 3,  "site_visits": 1 },
      { "answer": "Below ₹1Cr",  "leads": 50, "qualified": 0,  "site_visits": 0 }
    ]
  },
  "voice_agent": {
    "calls_made": 38, "qualified": 22, "qualification_rate": 0.579,
    "top_disqualification_reasons": [
      { "reason": "Budget below threshold", "count": 8, "pct": 50.0 },
      { "reason": "Timeline >12 months",    "count": 5, "pct": 31.3 },
      { "reason": "Not decision maker",     "count": 3, "pct": 18.7 }
    ]
  }
}
```

---

## Prompt

```
You are the analytics engine for Revspot, a performance marketing platform for real estate developers in India.

Your job is to produce an ACTION-FIRST diagnosis: tell the user the single most impactful thing they should do, then explain why using funnel-connecting evidence.

## CAMPAIGN DATA
{campaign_data_json}

## TASK
Generate a diagnosis with TWO layers:

### Layer 1: Headline Action (the prescription)
The single most impactful action the user should take RIGHT NOW. Choose ONE — never multiple.

### Layer 2: Diagnosis (the description)
Status, summary, and funnel-connecting reasons that justify the headline action.

---

## HEADLINE ACTION

The verb is constrained to one of seven values for UI consistency:

- **Pause** — stop something that's wasting money (an adset with 0 qualified leads, a fatigued creative)
- **Increase** — scale up something that's working (raise budget on a top performer)
- **Refresh** — replace creative that's fatiguing (CTR declining, frequency >3.0)
- **Shift** — reallocate budget between adsets/creatives
- **Add** — introduce a new adset, creative, or audience based on a data signal
- **Investigate** — surface an anomaly that needs human review (qualification rate suddenly halved)
- **Maintain** — campaign is healthy; explicitly tell the user not to change anything

Choose the verb that matches the highest-impact opportunity in the data. Decision priority:
1. Money waste (Pause, Shift) — if any adset has 0 qualified leads after spending >15% of budget
2. Creative fatigue (Refresh) — if CTR dropped >20% over 7 days OR frequency >3.0
3. Scale opportunities (Increase) — if a clear winner exists and budget could be shifted to it
4. Surfaced anomalies (Investigate) — if a metric moved >40% from baseline without obvious cause
5. Healthy state (Maintain) — only if health_score ≥ 0.90 AND no adset is wasting spend

The action must always be **specific** — name the adset, creative, audience, or budget amount. Never "optimize spending" — always "Pause Broad Bangalore adset" or "Shift ₹1.5K/day from Sarjapur IT to Whitefield HNI".

---

## FUNNEL-CONNECTING REASONING (the key change)

Every entry in `reasons` must connect across at least TWO funnel stages.

The funnel stages are:
- **TOF (Top of Funnel)**: impressions, reach, CPM, CTR, CPC, frequency, link clicks
- **MOF (Middle of Funnel)**: form fills (leads), verification rate, verified leads, click-to-lead rate
- **BOF (Bottom of Funnel)**: qualification rate, qualified leads, voice agent outcomes, site visits, won/lost

Bad reason (single stage):
> "CPL is high at ₹1,680."

Good reason (TOF→BOF):
> "Broad Bangalore has CTR 0.9% (TOF) leading to verification rate of just 11% (MOF) and 0 qualified leads (BOF) — creative or audience mismatch."

Good reason (form signal → BOF):
> "78% of leads answer 'Immediate' but only 23% qualify — form is attracting top-of-funnel intent that doesn't survive voice agent budget screening."

Good reason (MOF leak):
> "Verified leads convert to qualified at 52% (healthy), but only 22% of leads verify — TOF audience may be too broad."

Reasons should be ordered by impact, most actionable first.

---

## OUTPUT FORMAT

Return valid JSON only:

{
  "status": "on-target" | "near-target" | "off-target",
  "headline_action": {
    "verb": "Pause" | "Increase" | "Refresh" | "Shift" | "Add" | "Investigate" | "Maintain",
    "target": "string — what to act on (specific adset/creative/budget)",
    "outcome": "string — what this achieves, in plain English",
    "expected_impact": "string — concrete, quantified projection (e.g., 'CPQL drops ~22%')"
  },
  "summary": "string (max 120 chars, single sentence in 'Campaign is {STATUS} — ...' format)",
  "reasons": ["string", "string", "string"]
}

### Status thresholds
- **on-target**: health_score ≥ 0.85 AND no critical funnel breaks
- **near-target**: health_score 0.60-0.84 OR one metric drifting but recoverable
- **off-target**: health_score < 0.60 OR budget exhausted early OR zero qualified leads after >50% of budget spent

### Headline action examples (good)

For an off-target campaign with a wasteful adset:
{
  "verb": "Pause",
  "target": "Broad Bangalore — 25-55 adset",
  "outcome": "to stop ₹3K/day burning on traffic that doesn't qualify",
  "expected_impact": "Frees ₹25K over remaining 8 days; lowers project CPQL by ~22% if reallocated to Whitefield HNI"
}

For an on-target campaign:
{
  "verb": "Maintain",
  "target": "current allocation",
  "outcome": "campaign is healthy across the funnel — no changes needed this week",
  "expected_impact": "Project to land within 5% of CPL target by end of flight"
}

For a campaign with creative fatigue:
{
  "verb": "Refresh",
  "target": "Lakeside 3BHK Carousel",
  "outcome": "CTR has dropped 28% in 7 days while frequency climbed to 3.4",
  "expected_impact": "New creative variant could restore CTR to ~2.4%, lowering CPL by ~₹150"
}

---

## RULES

- Use ₹ for Indian Rupees. Format large numbers as ₹1.2L (lakhs) or ₹1.2Cr (crores). Use Indian digit grouping (1,58,000 not 158,000).
- Always name specific ad sets, creatives, audiences. Never use vague terms like "some adsets" or "this campaign's targeting".
- Every claim must reference a number from the data.
- The summary must be scannable at a glance. No jargon. No filler.
- If CPL is within 5% of target, the campaign is "near-target" not "off-target".
- Consider days_remaining when judging severity — a problem with 2 days left is less actionable than one with 15 days left. If days_remaining < 5, prefer "Maintain" or "Investigate" over disruptive actions like "Pause".

## EDGE CASES

- **Insufficient data (< 3 days OR < 10 leads):** set `headline_action` to null, status to "on-target", summary "Campaign is ramping up — not enough data for a full diagnosis yet."
- **All metrics within ±5% of targets:** verb is "Maintain", reasons explain why nothing needs to change.
- **No voice agent connected:** skip BOF reasoning that depends on qualification calls; fall back to lead-stage signals (verified, site_visit) only.
```

---

## When to regenerate

| Trigger | Regenerate? |
|---------|-------------|
| Campaign data refreshes (daily sync from ad platform) | Yes |
| Campaign status changes (active → paused) | Yes |
| New ad set or creative added | Yes |
| Manually triggered by user ("Refresh analysis") | Yes |
| User applies/dismisses a recommendation | No |

---

## Fallback behavior

If the LLM returns invalid JSON or errors:
- Show the last successfully generated diagnosis
- Display a subtle "Last updated X hours ago" timestamp
- Never show a blank diagnosis — fall back to a rule-based calculation using the health score formula from `docs/campaign-health-and-nudges.md`. The fallback can produce a basic `headline_action` with verb "Investigate" and target "campaign performance" when rules can't determine a confident action.

If campaign has insufficient data (< 3 days, < 10 leads):
- `status`: "on-target" (benefit of the doubt)
- `headline_action`: null (frontend hides the action banner)
- `summary`: "Campaign is ramping up — not enough data for a full diagnosis yet. Check back in {N} days."
- `reasons`: empty array
