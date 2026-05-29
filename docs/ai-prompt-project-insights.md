# AI Prompt — Project-Level Insights (Funnel-Connecting)

## What it produces

Cross-campaign insights for a single project (one property/development). Where campaign-level insights look at one campaign in isolation, project-level insights answer the questions a developer actually has:

- *Across all my campaigns for this property, where is the money working?*
- *Which audience or creative converts best across the entire project?*
- *Are my campaigns cannibalizing each other or complementing each other?*
- *Where in the funnel is this project losing leads?*

The output drives **two surfaces** on the project detail page:
- **Inline summary** above the campaigns table — at-a-glance project headline + top 2-3 findings
- **Diagnosis tab** — full set of 5-7 findings with funnel evidence

A single prompt call generates both — they're different cuts of the same JSON output.

**Example output:**
> 🎯 **Reallocate 20% of project budget from Retargeting to Whitefield HNI** to concentrate spend on segments that convert to site visits.
> *Expected: Project CPQL drops ~30%, +3 site visits/month.*
>
> Status: **NEEDS ATTENTION** — qualification rate 7.9% with 22% of spend producing zero qualified leads.

Plus 5-7 findings such as:
> 📈 **Whitefield HNI is your project's growth lever** — accounts for 41% of qualified leads from just 28% of spend, and 4 of 6 site visits trace back to it.
> 🔻 **'Below ₹1Cr' budget bracket is leaking spend** — 102 leads (37% of total), 0 qualified, 0 site visits. The audience is too broad for a ₹2Cr+ property.

---

## Data payload sent to the LLM

The payload aggregates across all campaigns in `project.campaignIds`. It includes per-campaign performance, rolled-up adset performance (since the same audience may run in multiple campaigns), creative rollups, form-response signals, and CRM events.

```json
{
  "project": {
    "id": "proj-1",
    "name": "Godrej Air Phase 3",
    "category": "Real Estate",
    "property_price_crores": 2.5,
    "campaign_count": 3,
    "active_campaign_count": 2
  },

  "project_totals_30d": {
    "spend": 233000,
    "impressions": 2950000,
    "reach": 1100000,
    "link_clicks": 47200,
    "leads": 278,
    "verified_leads": 46,
    "qualified_leads": 22,
    "site_visits": 8,
    "won": 1,
    "lost": 4,
    "cpm": 78.98,
    "ctr": 1.60,
    "cpc": 4.93,
    "frequency": 2.68,
    "cpl": 838,
    "cpvl": 5065,
    "cpql": 10591,
    "verification_rate": 0.165,
    "qualification_rate": 0.079,
    "qualified_to_site_visit_rate": 0.364,
    "click_to_lead_rate": 0.0059
  },

  "previous_30d_totals": {
    "spend": 198000, "leads": 244, "verified_leads": 38, "qualified_leads": 17, "site_visits": 5,
    "cpl": 811, "cpvl": 5211, "cpql": 11647,
    "ctr": 1.55, "verification_rate": 0.156, "qualification_rate": 0.070
  },

  "by_campaign": [
    {
      "id": "camp-1", "name": "Godrej Air — Lead Gen (Whitefield)",
      "status": "active", "health": "on-track",
      "spend": 95000, "impressions": 1180000, "ctr": 1.72, "cpm": 80.51, "frequency": 2.91,
      "leads": 124, "verified_leads": 28, "qualified_leads": 14, "site_visits": 5,
      "cpl": 766, "cpvl": 3393, "cpql": 6786,
      "verification_rate": 0.226, "qualification_rate": 0.113,
      "trend": "improving"
    },
    {
      "id": "camp-10", "name": "Godrej Air — Retargeting",
      "status": "active", "health": "needs-attention",
      "spend": 75000, "impressions": 920000, "ctr": 1.41, "cpm": 81.52, "frequency": 3.42,
      "leads": 98, "verified_leads": 12, "qualified_leads": 6, "site_visits": 2,
      "cpl": 765, "cpvl": 6250, "cpql": 12500,
      "verification_rate": 0.122, "qualification_rate": 0.061,
      "trend": "stable"
    },
    {
      "id": "camp-15", "name": "Godrej Air — Brand Awareness (paused)",
      "status": "paused", "health": "needs-attention",
      "spend": 63000, "impressions": 850000, "ctr": 0.92, "cpm": 74.12, "frequency": 1.89,
      "leads": 56, "verified_leads": 6, "qualified_leads": 2, "site_visits": 1,
      "cpl": 1125, "cpvl": 10500, "cpql": 31500,
      "verification_rate": 0.107, "qualification_rate": 0.036,
      "trend": "declining"
    }
  ],

  "by_adset_rolled_up": [
    {
      "name": "Whitefield HNI — 30-45",
      "appears_in_campaigns": ["camp-1"],
      "spend": 65000, "impressions": 720000, "ctr": 2.4, "frequency": 2.78,
      "leads": 72, "verified": 22, "qualified": 14, "site_visits": 4,
      "cpl": 903, "cpql": 4643,
      "verification_rate": 0.306, "qualification_rate": 0.194,
      "qualified_to_site_visit_rate": 0.286
    },
    {
      "name": "Sarjapur IT Corridor",
      "appears_in_campaigns": ["camp-1", "camp-10"],
      "spend": 48000, "impressions": 615000, "ctr": 1.85, "frequency": 2.55,
      "leads": 62, "verified": 14, "qualified": 6, "site_visits": 2,
      "cpl": 774, "cpql": 8000,
      "verification_rate": 0.226, "qualification_rate": 0.097,
      "qualified_to_site_visit_rate": 0.333
    },
    {
      "name": "Broad Bangalore — 25-55",
      "appears_in_campaigns": ["camp-1", "camp-10", "camp-15"],
      "spend": 78000, "impressions": 1015000, "ctr": 0.95, "frequency": 4.05,
      "leads": 86, "verified": 8, "qualified": 0, "site_visits": 0,
      "cpl": 907, "cpql": null,
      "verification_rate": 0.093, "qualification_rate": 0.0,
      "qualified_to_site_visit_rate": null
    },
    {
      "name": "Past Site Visitors (Retargeting)",
      "appears_in_campaigns": ["camp-10"],
      "spend": 42000, "impressions": 600000, "ctr": 1.45, "frequency": 3.62,
      "leads": 58, "verified": 2, "qualified": 2, "site_visits": 2,
      "cpl": 724, "cpql": 21000,
      "verification_rate": 0.034, "qualification_rate": 0.034,
      "qualified_to_site_visit_rate": 1.0
    }
  ],

  "by_creative_rolled_up": [
    {
      "name": "Lakeside 3BHK Carousel", "format": "Carousel",
      "campaigns": ["camp-1"],
      "impressions": 480000, "ctr": 2.8, "frequency": 2.45,
      "leads": 84, "verified": 18, "qualified": 11, "site_visits": 3,
      "verification_rate": 0.214, "qualification_rate": 0.131
    },
    {
      "name": "Godrej Air Lifestyle Video", "format": "Video",
      "campaigns": ["camp-1", "camp-10"],
      "impressions": 720000, "ctr": 1.85, "frequency": 3.18,
      "leads": 62, "verified": 12, "qualified": 5, "site_visits": 2,
      "verification_rate": 0.194, "qualification_rate": 0.081
    },
    {
      "name": "Floor Plan Static", "format": "Image",
      "campaigns": ["camp-15"],
      "impressions": 280000, "ctr": 0.7, "frequency": 1.95,
      "leads": 14, "verified": 1, "qualified": 0, "site_visits": 0,
      "verification_rate": 0.071, "qualification_rate": 0.0
    }
  ],

  "form_response_signals": {
    "by_timeline": [
      { "answer": "Immediate",       "leads": 78, "verified": 22, "qualified": 18, "site_visits": 6 },
      { "answer": "Within 3 months", "leads": 94, "verified": 18, "qualified": 4,  "site_visits": 2 },
      { "answer": "6-12 months",     "leads": 62, "verified":  4, "qualified": 0,  "site_visits": 0 },
      { "answer": ">12 months",      "leads": 44, "verified":  2, "qualified": 0,  "site_visits": 0 }
    ],
    "by_budget": [
      { "answer": "₹2Cr+",       "leads": 52,  "verified": 22, "qualified": 19, "site_visits": 7 },
      { "answer": "₹1Cr - ₹2Cr", "leads": 124, "verified": 18, "qualified":  3, "site_visits": 1 },
      { "answer": "Below ₹1Cr",  "leads": 102, "verified":  6, "qualified":  0, "site_visits": 0 }
    ],
    "by_configuration": [
      { "answer": "3 BHK", "leads": 138, "qualified": 16, "site_visits": 6 },
      { "answer": "4 BHK", "leads":  78, "qualified":  6, "site_visits": 2 },
      { "answer": "2 BHK", "leads":  62, "qualified":  0, "site_visits": 0 }
    ]
  },

  "voice_agent_rollup": {
    "calls_made": 84, "calls_connected": 62, "qualified": 22,
    "connected_rate": 0.738, "qualification_rate": 0.262,
    "avg_duration_min": 3.4,
    "top_disqualification_reasons": [
      { "reason": "Budget below threshold",  "count": 32, "pct": 51.6 },
      { "reason": "Timeline >12 months",     "count": 18, "pct": 29.0 },
      { "reason": "Not decision maker",      "count": 8,  "pct": 12.9 },
      { "reason": "Not interested",          "count": 4,  "pct": 6.5 }
    ]
  },

  "crm_events_30d": {
    "site_visit_scheduled": 12,
    "site_visit_done": 8,
    "negotiation": 3,
    "won": 1,
    "lost": 4
  },

  "benchmarks": {
    "industry_qualification_rate": 0.10,
    "industry_qualified_to_site_visit_rate": 0.40,
    "target_cac_per_crore_avg": 100000
  }
}
```

---

## Prompt

```
You are the project-level analytics engine for Revspot, a performance marketing platform for Indian real estate developers.

A "project" represents a single property or development (e.g., "Godrej Air Phase 3"). It contains multiple ad campaigns running on Meta Ads. Your job is to find cross-campaign patterns and connect top-of-funnel signals to bottom-of-funnel outcomes (qualification, site visits, conversions).

## PROJECT DATA
{project_data_json}

## TASK

Generate ONE output that powers two surfaces:
1. The inline insights panel above the campaigns table (renders the headline_action + top 2-3 findings)
2. The Diagnosis tab (renders all 5-7 findings)

The output must include:
- A project-level **headline_action** — the single most impactful action across all campaigns
- A project **status**
- A 1-2 sentence **summary**
- 5-7 **findings** that connect funnel stages

---

## HEADLINE ACTION

The verb is constrained to one of seven values:

- **Reallocate** — shift budget across campaigns/adsets within the project
- **Pause** — stop a wasteful campaign or adset
- **Scale** — increase budget on a clear winner
- **Refresh** — replace fatiguing creatives across the project
- **Tighten** — narrow audience based on form-signal/disqualification evidence
- **Investigate** — surface an anomaly that needs human review
- **Maintain** — project is healthy; no changes needed

Pick the verb that addresses the highest-impact opportunity in the data. Decision priority:
1. Money waste across campaigns (Pause, Reallocate) — if any adset has 0 qualified leads after >15% of project spend
2. Concentration opportunities (Scale, Reallocate) — if one audience/creative dramatically outperforms across multiple campaigns
3. Audience misfit (Tighten) — if form-response or disqualification clusters reveal a wrong-audience problem
4. Creative fatigue (Refresh) — if multiple creatives show declining CTR + rising frequency
5. Anomalies (Investigate)
6. Healthy state (Maintain) — only if project_status is "on-track" and no waste signals

The action must be **specific** — name the adset, audience, budget bracket, or creative. Never "optimize budgets" — always "Reallocate 20% from Retargeting to Whitefield HNI".

---

## FUNNEL-CONNECTING ANALYSIS (the core differentiator)

The funnel stages:
- **TOF**: impressions, reach, CPM, CTR, CPC, frequency, link clicks
- **MOF**: form fills (leads), verification, verified leads, click-to-lead rate, form responses (timeline, budget, configuration)
- **BOF**: qualification rate, qualified leads, voice agent outcomes, disqualification reasons, site visits, won/lost

Every finding must trace evidence across at least TWO funnel stages. Use the `funnel_evidence` array to make the chain explicit.

The seven analytical lenses to mine:

1. **Audience leverage** — Compare `by_adset_rolled_up`. Which audience has the best qualified-leads-per-₹ AND the best qualified-to-site-visit-rate? Recommend scaling. Which has the worst? Recommend pausing or excluding.

2. **Creative leverage** — Compare `by_creative_rolled_up`. Which creative converts above its share of impressions? Below?

3. **Form signal mismatch** — Look at `form_response_signals`. If a budget bracket or timeline answer dominates lead volume but produces 0 qualified leads or site visits, that's a TOF/MOF leak. Recommend tightening.

4. **Disqualification clusters** — Top disqualification reason (e.g., "Budget below threshold" at 51.6%) hints at audience or messaging gap. If 50%+ of disqualifications share one reason, surface it as a finding.

5. **Cross-campaign cannibalization** — When the same adset appears in multiple campaigns (`appears_in_campaigns` has multiple entries), check whether one campaign is clearly outperforming for the same audience. May indicate cannibalization or wasteful overlap.

6. **Funnel bottleneck** — Compare project rates to `benchmarks`:
   - If verification_rate is below industry but qualification_rate of verified leads is healthy → MOF/TOF audience problem
   - If verification_rate is healthy but qualification_rate is low → BOF qualification or messaging problem
   - If qualification_rate is healthy but qualified_to_site_visit_rate is low → sales handoff problem (worth surfacing even though Revspot doesn't fix it directly)

7. **Trend changes** — Compare `project_totals_30d` to `previous_30d_totals`. Significant deltas (>15%) deserve a finding tied to a likely cause.

Each finding's `funnel_evidence` should reference 2-3 stage-tagged data points that justify it.

---

## OUTPUT FORMAT

Return valid JSON only:

{
  "project_status": "on-track" | "needs-attention" | "underperforming",
  "headline_action": {
    "verb": "Reallocate" | "Pause" | "Scale" | "Refresh" | "Tighten" | "Investigate" | "Maintain",
    "target": "string — what to act on (specific adset/audience/budget bracket)",
    "outcome": "string — what this achieves, in plain English",
    "expected_impact": "string — concrete, quantified projection"
  },
  "summary": "string — 1-2 sentence project narrative (max 200 chars)",
  "findings": [
    {
      "icon": "🎯" | "⚠️" | "📈" | "🎨" | "📞" | "✅" | "🔻",
      "title": "string — bold, scannable title (max 60 chars)",
      "narrative": "string — 1-2 sentences explaining the finding (max 200 chars)",
      "funnel_evidence": [
        { "stage": "TOF" | "MOF" | "BOF", "fact": "string" },
        { "stage": "TOF" | "MOF" | "BOF", "fact": "string" }
      ],
      "scope": "audience" | "creative" | "form_signal" | "campaign" | "funnel" | "trend",
      "tone": "positive" | "neutral" | "concern"
    }
  ]
}

### Status thresholds
- **on-track**: All campaigns on-track or only one needs-attention; project qualification_rate ≥ benchmarks.industry_qualification_rate; no clear waste signal
- **needs-attention**: Multiple campaigns flagged OR clear funnel leak (e.g., verification_rate < 60% of benchmark) OR significant unused leverage
- **underperforming**: Qualification_rate < 50% of benchmark OR multiple campaigns underperforming OR site_visits = 0 with substantial spend

### Icon meanings
- 🎯 = headline opportunity / lever to pull
- 📈 = positive trend or growth opportunity
- ✅ = something working well; tone "positive"
- ⚠️ = needs attention but not yet broken
- 🔻 = something underperforming or leaking
- 🎨 = creative or messaging insight
- 📞 = voice agent / qualification call insight

### Inline-summary selection rule
The frontend renders the headline_action plus the top 2-3 findings on the inline panel. To make this work, ORDER findings by importance:
1. Findings with `tone: "concern"` and `scope: "audience" | "campaign" | "funnel"` come first
2. Then `tone: "positive"` findings about clear winners (these motivate scale-up actions)
3. Then trend/creative/form-signal findings

The first 3 findings in the array should be the most decision-relevant — they will be shown inline.

---

## RULES

- Use ₹ for Indian Rupees. Format as ₹1,180 or ₹1.2L (lakhs) or ₹1.2Cr (crores). Use Indian digit grouping (1,58,000 not 158,000).
- Always name specific adsets, creatives, audiences, budget brackets. Never vague terms.
- Every claim must reference a number from the data.
- Findings must NOT be redundant with each other. If two findings are about the same audience or campaign, merge them.
- Don't restate campaign-level diagnoses verbatim. Project-level findings should be cross-campaign or aggregate insights — patterns visible only when looking at the project as a whole.
- If a finding could be either positive or concerning, default to the framing that drives action. "Whitefield HNI converts at 19%" (neutral) becomes "Whitefield HNI is your project's growth lever" (action-driving).
- The `expected_impact` in headline_action must be quantified — never vague phrases like "improves performance".
- Prefer findings with TOF→BOF chains over TOF-only or BOF-only observations.

---

## EDGE CASES

- **Single-campaign project**: Skip cross-campaign analysis (Section 5 above). Focus on funnel bottleneck, form signals, and disqualification clusters. Headline action may still be valuable (e.g., "Tighten audience to ₹2Cr+ buyers").
- **All campaigns paused**: Set status to "needs-attention", verb to "Investigate", and surface the gap. Findings can be retrospective ("Whitefield HNI was your top performer when active — consider relaunching with refreshed creative").
- **Insufficient data (< 7 days OR < 30 leads project-wide)**: Set headline_action to null, status to "on-track", summary "Project is ramping up — not enough data for cross-campaign insights yet. Check back in {N} days." Findings array empty.
- **No voice agent connected**: Skip BOF reasoning that depends on qualification calls. Use site_visit data and form responses as your BOF signals. Surface a finding recommending voice agent connection.
```

---

## When to regenerate

| Trigger | Regenerate? |
|---------|-------------|
| Daily campaign data sync | Yes |
| New campaign added to project | Yes |
| Campaign in project changes status (active/paused) | Yes |
| User opens project page (if cache > 12 hours old) | Yes |
| Manually triggered ("Refresh insights") | Yes |
| User applies a recommendation on a child campaign | Yes (project rollup may shift) |
| Lead status changes in CRM (single lead) | No |

Cache for 12 hours by default — project-level rollups are heavier to compute and don't need real-time freshness.

---

## Fallback behavior

If the LLM returns invalid JSON or errors:
- Show the last successfully generated insights with a "Last updated X hours ago" note
- If none exist, show a rule-based fallback: surface the campaign with worst CPQL as a "Pause/Investigate" finding, and the campaign with best CPQL as a "Scale" finding

If project has insufficient data:
- `headline_action`: null
- `status`: "on-track"
- `summary`: "Project is ramping up — check back once campaigns have at least 7 days of data."
- `findings`: empty array
- Frontend hides both surfaces (inline + diagnosis tab) and shows the ramp-up message instead

---

## Cross-doc consistency notes

The `headline_action` schema here is intentionally identical to the campaign-level diagnosis output (`docs/ai-prompt-campaign-diagnosis.md`) so the frontend can use a single banner component to render either. The project-level adds two new verbs (`Reallocate`, `Scale`, `Tighten`) on top of the campaign-level set.

The `funnel_evidence` schema matches the optimization recommendations doc (`docs/ai-prompt-optimization-recommendations.md`) — same `{stage, fact}` shape — so chips and badges can be reused.
