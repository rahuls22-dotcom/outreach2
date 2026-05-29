# Campaign Health & Budget Nudges — Logic Definition

## Core Principle

Campaign health is a **single status** derived from how well a campaign is tracking against the targets set during creation. Nudges are actionable recommendations when the campaign drifts off-target.

---

## 1. Campaign Targets (set at creation)

The user sets **3 required values** plus picks **one lead target type**:

| Target | Example | Unit | Required |
|--------|---------|------|----------|
| Total Budget | ₹5,00,000 | ₹ | Always |
| Duration | 30 days | days | Always |
| Lead Target Type | one of: Leads / Verified Leads / Qualified Leads | — | Always |
| Lead Target Value | 500 | count | Always |

**The user picks ONE of three lead target types:**
- **Leads** — raw form submissions (top of funnel)
- **Verified Leads** — leads confirmed via phone/enrichment (mid funnel)
- **Qualified Leads** — leads qualified by voice agent (bottom of funnel)

This choice determines what the campaign is optimizing for and how health is measured.

**Derived targets (auto-calculated):**
| Derived Metric | Formula | Example (if target = 500 Leads) |
|----------------|---------|---------|
| Daily Budget | Total Budget ÷ Duration | ₹16,667/day |
| Cost Per Target Lead | Total Budget ÷ Target Value | ₹1,000 |
| Expected Daily Target | Target Value ÷ Duration | ~17/day |

---

## 2. Campaign Health — Single Status

Health is calculated by comparing **actual performance** against **expected performance at the current point in time** (not end-of-campaign targets).

### Time-Proportional Expected Values

```
days_elapsed = today - campaign_start_date
progress_pct = days_elapsed / duration

expected_spend         = total_budget × progress_pct
expected_target_leads  = target_value × progress_pct
```

### Health Score Calculation

Two core ratios:

```
target_delivery_ratio = actual_target_leads / expected_target_leads
cost_efficiency_ratio = target_cost_per_lead / actual_cost_per_lead   (inverted — lower cost is better)
spend_pacing          = 1.0 - |spend_ratio - 1.0|                    (penalizes over AND under-spending)
```

Where:
- `actual_target_leads` = actual count of whichever lead type the user chose as target
- `actual_cost_per_lead` = actual_spend / actual_target_leads
- `spend_ratio` = actual_spend / expected_spend

A ratio of 1.0 = perfectly on target.

### Weighted Health Score

```
health_score = (
    target_delivery_ratio  × 0.55 +
    cost_efficiency_ratio  × 0.30 +
    spend_pacing           × 0.15
)
```

**Weights reflect what matters:**
- **Target delivery (55%)** — Are you getting the leads you promised? This is the primary metric.
- **Cost efficiency (30%)** — Are you getting them at or below the expected cost?
- **Spend pacing (15%)** — Are you spending at the right rate? (Both overspending and underspending are bad.)

This is simpler and more focused because the user already told us what matters by choosing their target type. We don't need to second-guess the funnel — if they targeted qualified leads, that's what we measure.

### Health Status Thresholds

| Status | Score Range | Meaning |
|--------|-------------|---------|
| **on-track** | ≥ 0.85 | Delivering within 15% of targets across the board |
| **needs-attention** | 0.60 – 0.84 | Some metrics are lagging; intervention may help |
| **underperforming** | < 0.60 | Significantly behind targets; action required |

### Edge Cases

- **Day 1–3:** Health is always "on-track" (insufficient data for meaningful scoring)
- **Paused campaigns:** Health freezes at last calculated value
- **Completed campaigns:** Health is final — based on actual vs target at end
- **No leads yet:** If expected_leads > 5 and actual = 0, immediately "needs-attention"
- **Budget exhausted early:** If spend > 90% of total budget with < 70% of duration elapsed → "underperforming"

---

## 3. Budget Nudges

Nudges are triggered when specific conditions are met. Each nudge has a **trigger condition**, a **message**, and a **suggested action**.

### Nudge Types

#### A. Budget Pacing Nudges

| Condition | Nudge | Priority |
|-----------|-------|----------|
| Spent > 110% of expected spend at this point | "Campaign is overspending — ₹X spent vs ₹Y expected. At this pace, budget will exhaust {N} days early." | High |
| Spent < 70% of expected spend at this point | "Campaign is underspending — only ₹X of expected ₹Y spent. Consider increasing daily budget or broadening targeting." | Medium |
| Remaining budget < 3 days of daily spend | "Budget running low — only ₹X remaining (~{N} days). Consider extending budget or wrapping up." | High |
| Budget exhausted with campaign still active | "Budget fully spent with {N} days remaining. Pause campaign or add budget to continue." | Critical |

#### B. Cost Efficiency Nudges

(Cost = Total Budget ÷ Target Value. Labeled as CPL, CPVL, or CPQL depending on chosen target type.)

| Condition | Nudge | Priority |
|-----------|-------|----------|
| Actual cost per target > 130% of target cost | "{cost_label} is ₹{actual} — {X}% above your target of ₹{target}. Review ad sets for high-cost underperformers." | High |
| Actual cost per target < 70% of target cost | "{cost_label} is ₹{actual} — well below your target of ₹{target}. Consider scaling up budget to capture more at this rate." | Low (positive) |
| Cost per target trending up (7-day slope > 15%) | "{cost_label} has increased {X}% over the last 7 days. Creative fatigue or audience saturation may be setting in." | Medium |

#### C. Target Lead Delivery Nudges

(These use whichever lead type the user chose as their target.)

| Condition | Nudge | Priority |
|-----------|-------|----------|
| Target lead delivery < 60% of expected at this point | "Only {actual} {target_type} generated vs {expected} expected. Campaign is behind pace by {X}%." | High |
| Target lead delivery > 130% of expected | "Campaign is over-delivering — {actual} {target_type} vs {expected} expected. Great performance — consider shifting budget from other campaigns here." | Low (positive) |
| Cost per target lead > 130% of target cost | "Cost per {target_type} is ₹{actual} — {X}% above your target of ₹{target}. Review ad sets for high-cost underperformers." | High |
| Zero target leads after spending > 20% of budget | "₹{spend} spent with zero {target_type}. Review targeting, creatives, or form setup." | Critical |

#### D. Ad Set Reallocation Nudges

| Condition | Nudge | Priority |
|-----------|-------|----------|
| One ad set has CPL 2x higher than the best ad set | "'{expensive_adset}' has CPL ₹{cpl} — 2x higher than '{cheap_adset}' (₹{cpl}). Shift {X}% budget from underperformer." | High |
| One ad set has 0 leads after spending > ₹{threshold} | "'{adset}' has spent ₹{spend} with zero leads. Consider pausing it." | Critical |
| Top ad set is budget-capped (spending all its daily budget) | "'{adset}' is hitting its daily budget limit. It's your best performer — consider increasing its budget." | Medium |

---

## 4. Nudge Priority & Display Rules

### Priority Levels
- **Critical:** Red badge, always shown first, blocks positive nudges
- **High:** Amber badge, shown prominently
- **Medium:** Yellow badge, shown in recommendations section
- **Low (positive):** Green badge, celebratory/encouraging tone

### Display Rules
- Show **max 3 nudges** at the top of campaign detail page (highest priority first)
- Show **max 2 nudges** in dashboard campaign table (inline, most critical only)
- Nudges are **dismissible** — dismissed nudges don't re-appear for 7 days
- Nudges **refresh daily** based on latest data
- Positive nudges only show when there are no critical/high nudges

### Nudge Cooldown
- Same nudge type doesn't re-trigger within 24 hours of being dismissed
- If the underlying condition worsens (e.g., CPL goes even higher), the nudge re-appears regardless of cooldown

---

## 5. Health Change Tracking

Track health transitions to surface in the activity log:

| Transition | Log Entry |
|------------|-----------|
| on-track → needs-attention | "Campaign health declined to Needs Attention — {primary reason}" |
| needs-attention → underperforming | "Campaign health declined to Underperforming — {primary reason}" |
| needs-attention → on-track | "Campaign health improved to On Track" |
| underperforming → needs-attention | "Campaign health improved to Needs Attention" |

**Primary reason** is the metric with the worst delivery ratio (e.g., "qualified leads at 45% of target" or "CPL 40% above target").

---

## 6. Summary

```
User sets:       Budget + Duration + ONE lead target (Leads OR Verified OR Qualified)
System derives:  Daily budget, cost per target lead, expected daily targets

Health = weighted score of:
  - Target lead delivery (55%) — are you getting the leads you targeted?
  - Cost efficiency (30%)      — at or below expected cost per target lead?
  - Spend pacing (15%)         — spending at the right rate?

Nudges = condition-based alerts when metrics drift beyond thresholds
  - Budget pacing (over/under-spending)
  - Cost efficiency (cost per target lead drifting)
  - Target delivery (behind/ahead on lead count)
  - Ad set reallocation (shift budget between ad sets)

Health answers: "Is this campaign on track to hit its goals?"
Nudges answer:  "What specific thing should you do about it?"
```
