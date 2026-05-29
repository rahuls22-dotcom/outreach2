# AI Prompt — Optimization Recommendations

## What it produces

3-5 specific, actionable recommendations the user can apply to improve campaign performance. Each recommendation traces evidence across the funnel — TOF (impressions, CTR, CPM) → MOF (verification, lead quality) → BOF (qualified leads, site visits) — so the user understands not just *what* to do but *why it works across the whole journey*.

**Example output:**
```json
[
  {
    "type": "budget",
    "text": "Shift 20% budget from 'Broad Bangalore' to 'Whitefield HNI' — Whitefield HNI delivers 3.2x more qualified leads per ₹ and 4 of 5 site visits this month came from it.",
    "funnel_evidence": [
      { "stage": "TOF", "fact": "Whitefield HNI CTR 2.4% vs Broad Bangalore 0.9%" },
      { "stage": "MOF", "fact": "Verification rate 31% vs 11%" },
      { "stage": "BOF", "fact": "4 of 5 site visits attributed to Whitefield HNI; Broad Bangalore has 0 qualified leads" }
    ],
    "cta": "Adjust Budget"
  },
  {
    "type": "creative",
    "text": "Pause 'Godrej Air Floor Plan Static' — 0.8% CTR is dragging upstream cost up and leads from this creative verify at half the campaign rate.",
    "funnel_evidence": [
      { "stage": "TOF", "fact": "CTR 0.8% vs campaign avg 1.6%" },
      { "stage": "MOF", "fact": "Leads from this creative verify at 11% vs 22% campaign avg" }
    ],
    "cta": "Update Creative",
    "cta_module": "creatives"
  }
]
```

---

## Data payload sent to the LLM

The payload includes full funnel data — TOF (platform metrics), MOF (verification, form responses), and BOF (qualification, site visits, voice agent outcomes) — so the AI can build cause-and-effect chains.

```json
{
  "campaign": {
    "name": "Godrej Air Phase 3",
    "status": "active",
    "platform": "Meta",
    "created_at": "2025-11-20",
    "duration_days": 30,
    "days_elapsed": 22,
    "days_remaining": 8,
    "agent_connected": true
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
      "impressions": 1180000,
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
      "impressions": 798000,
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
      "impressions": 832000,
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
  "creatives_by_ad_set": {
    "Whitefield HNI — 30-45": [
      { "name": "Godrej Air 3BHK Carousel v2", "format": "Carousel", "ctr": 2.8, "leads_attributed": 38, "verified_attributed": 14, "qualified_attributed": 9, "status": "active" },
      { "name": "Godrej Air Lifestyle Video",  "format": "Video",    "ctr": 3.4, "leads_attributed": 28, "verified_attributed":  8, "qualified_attributed": 5, "status": "active" },
      { "name": "Godrej Air Floor Plan Static","format": "Image",    "ctr": 0.8, "leads_attributed":  6, "verified_attributed":  0, "qualified_attributed": 0, "status": "paused" }
    ],
    "Sarjapur IT Corridor": [
      { "name": "Godrej Air Amenities Carousel",   "format": "Carousel", "ctr": 2.1, "leads_attributed": 34, "verified_attributed": 9, "qualified_attributed": 5, "status": "active" },
      { "name": "Godrej Air NRI Investment Static","format": "Image",    "ctr": 1.9, "leads_attributed": 24, "verified_attributed": 5, "qualified_attributed": 3, "status": "active" }
    ],
    "Broad Bangalore — 25-55": [
      { "name": "Godrej Air Family Lifestyle",   "format": "Video",    "ctr": 1.2, "leads_attributed": 32, "verified_attributed": 4, "qualified_attributed": 0, "status": "active" },
      { "name": "Godrej Air 3BHK Carousel v2",   "format": "Carousel", "ctr": 0.9, "leads_attributed": 24, "verified_attributed": 2, "qualified_attributed": 0, "status": "active" }
    ]
  },
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
  },
  "diagnosis": {
    "status": "near-target",
    "headline_action": {
      "verb": "Pause",
      "target": "Broad Bangalore — 25-55 adset",
      "outcome": "to stop ₹3K/day burning on traffic that doesn't qualify",
      "expected_impact": "Frees ₹25K over remaining 8 days; lowers project CPQL by ~22% if reallocated"
    },
    "summary": "Campaign is NEAR TARGET — CPL ₹1,183 is 1.4% below target ₹1,200.",
    "reasons": [
      "Whitefield HNI delivers verification rate 31% (TOF→MOF strong) and 4 site visits (BOF strong)",
      "Broad Bangalore has CTR 0.9% leading to verification rate 11% and 0 qualified leads",
      "Budget bracket 'Below ₹1Cr' generates 27% of leads but 0% qualified — TOF/MOF leak"
    ]
  }
}
```

---

## Prompt

```
You are the optimization engine for Revspot, a performance marketing platform for real estate developers in India.

Based on this campaign's current performance and diagnosis, generate specific optimization recommendations. Every recommendation must trace its reasoning across the funnel.

## CAMPAIGN DATA
{campaign_data_json}

## TASK
Generate 3-5 optimization recommendations. Each must be:

1. **Specific** — Name the exact ad set, creative, audience, or budget bracket. Never "some ad sets" — say "Broad Bangalore".
2. **Quantified** — Include the number that justifies the action. "CPL ₹1,680" not "high CPL".
3. **Actionable** — The user should be able to do it immediately. Not "consider optimizing" but "shift 20% budget from X to Y".
4. **Funnel-connected** — Trace evidence across at least TWO funnel stages (see rule below).
5. **Typed** — Categorize each as: "budget", "creative", "targeting", or "general".

---

## FUNNEL-CONNECTING RULE (most important)

A recommendation that only references one stage is weak. Recommendations gain power when they connect cause and effect across the funnel.

The funnel stages are:
- **TOF (Top of Funnel)**: impressions, reach, CPM, CTR, CPC, frequency, link clicks
- **MOF (Middle of Funnel)**: form fills (leads), verification rate, verified leads, click-to-lead rate
- **BOF (Bottom of Funnel)**: qualification rate, qualified leads, voice agent outcomes, site visits, won/lost, disqualification reasons

**Every recommendation must include a `funnel_evidence` array with at least 2 entries from different stages.**

Bad recommendation (single-stage):
> "Pause Broad Bangalore adset — CPL is too high at ₹1,680."

Good recommendation (TOF→MOF→BOF):
> "Pause Broad Bangalore adset — its 0.9% CTR (TOF) leads to just 11% verification (MOF) and 0 qualified leads (BOF). The audience isn't matching the property's price point."

Good recommendation (form-signal → BOF):
> "Tighten audience to exclude 'Below ₹1Cr' budget bracket — these 50 leads (27% of total) verify at 0% and produce zero qualified leads or site visits. They're absorbing TOF spend without contributing downstream."

If you can only find single-stage evidence for a potential recommendation, OMIT it rather than weaken the output.

---

## RECOMMENDATION CATEGORIES

### Budget recommendations ("budget")
Look for:
- Ad sets with similar TOF reach but very different BOF outcomes (qualified leads, site visits) — shift budget toward the winner
- Ad sets spending budget but generating 0 qualified leads or 0 site visits — pause or reduce
- Top performers measured by qualified-leads-per-₹ or site-visits-per-₹ that may be budget-constrained — increase
- Overall pacing problems (over/under-spend vs days_remaining)

### Creative recommendations ("creative")
Look for:
- Creatives with CTR < 1.0% AND low downstream verification (TOF + MOF leak combined)
- Creatives that drive volume but whose leads don't convert (TOF strong, BOF weak)
- Creatives that drive low volume but high quality (TOF weak, BOF strong) — recommend scaling them
- CTR declining + frequency rising together → creative fatigue
- Ad sets with only 1 active creative — recommend adding variety

### Targeting recommendations ("targeting")
Look for:
- Form-response brackets (timeline, budget) that produce many leads but no qualified leads — exclude or downweight
- Form-response brackets that have high qualification AND site-visit rates — recommend isolating as new audience
- Frequency above 3.0 with declining CTR — audience saturation, expand or refresh
- High verification but low qualification → audience is real but wrong fit (review messaging)

### General recommendations ("general")
Look for:
- Missing voice agent (agent_connected = false) when qualification data would unlock better optimization
- Disqualification reason clusters (e.g., 50% disqualified for "budget below threshold" → tighten budget targeting)
- Funnel bottleneck patterns: where in the funnel does this campaign lose the most?

---

## PRIORITY ORDER

1. **Stop money waste** — Pause adsets/creatives with 0 qualified leads after >15% of budget spent
2. **Fix funnel leaks** — Address the biggest TOF→MOF or MOF→BOF drop visible in the data
3. **Improve cost efficiency** — Creative refresh, audience tightening based on form/disqualification signals
4. **Scale winners** — Increase budget on adsets/creatives with best per-₹ qualified-lead or site-visit rates
5. **New tests** — Add adsets/creatives only when there's clear data justification

---

## RULES

- Max 5 recommendations. Quality over quantity. 3 strong recommendations beat 5 weak ones.
- Use ₹ for Indian Rupees. Format as ₹1,680 or ₹1.2L (lakhs). Use Indian digit grouping (1,58,000 not 158,000).
- Never recommend something already done (e.g., don't say "pause" an already-paused creative — check the `status` field).
- Each recommendation `text` should be 1-2 sentences max. The full reasoning lives in `funnel_evidence`.
- CTA labels are 2-3 words: "Adjust Budget", "Pause Creative", "Add Ad Set", "Tighten Audience", "Update Targeting".
- If campaign is "on-target" with health_score > 0.9 AND no waste signals, focus on growth/scaling rather than fixing.
- If campaign is "off-target", focus on damage control — pause wasteful spend first.
- Don't repeat the diagnosis `headline_action` as a recommendation. The recommendations expand on the diagnosis, not duplicate it.

---

## OUTPUT FORMAT

Return valid JSON array only:

[
  {
    "type": "budget" | "creative" | "targeting" | "general",
    "text": "string (1-2 sentences, specific and quantified)",
    "funnel_evidence": [
      { "stage": "TOF" | "MOF" | "BOF", "fact": "string (one data point)" },
      { "stage": "TOF" | "MOF" | "BOF", "fact": "string (one data point)" }
    ],
    "cta": "string (2-3 word action label)",
    "cta_module": "string (optional: 'creatives' | 'audiences' | null)"
  }
]
```

---

## When to regenerate

| Trigger | Regenerate? |
|---------|-------------|
| Campaign data refreshes (daily sync from ad platform) | Yes |
| User applies a recommendation | Yes (remove applied, may generate new ones) |
| New ad set or creative added | Yes |
| Manually triggered by user ("Refresh analysis") | Yes |
| User dismisses a recommendation | No (just hide it) |
| Campaign status changes (active → paused) | No |

---

## Fallback behavior

If the LLM returns invalid JSON or errors:
- Show the last successfully generated recommendations
- Display a subtle "Last updated X hours ago" timestamp

If campaign has insufficient data (< 3 days, < 10 leads):
- Recommendations: empty array
- Show: "Recommendations will appear once we have enough performance data."

If `agent_connected` is false AND no other strong signals exist:
- Output a single "general" recommendation prompting voice agent connection, with `funnel_evidence` showing the BOF gap (e.g., "MOF: 42 verified leads. BOF: no qualification calls made — voice agent not connected.")
