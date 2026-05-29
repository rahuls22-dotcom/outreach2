# Campaign Creation — Budget Nudges (Step 1)

## Context

When a user sets their campaign targets in Step 1 of the campaign launcher, we evaluate whether their budget makes sense for the property they're selling. The nudge appears in real-time as they fill the fields — a pre-launch sanity check, not a post-launch alert.

### The underlying principle

For Indian real estate, **Customer Acquisition Cost (CAC)** scales with property value. The working range is:

| CAC per ₹1Cr of property value | Label |
|--------------------------------|-------|
| ~₹75,000 | Good CAC |
| ~₹97,500 – ₹1,00,000 | Average CAC |
| ~₹1,30,000+ | High CAC |

All lead-cost benchmarks below are **derived from this CAC envelope** and a standard real estate funnel:
- 100 raw leads → 60 verified → 20 qualified → 1 closure
- Raw → Close: 1% | Verified → Close: ~1.67% | Qualified → Close: 5%

So the cost per lead at any funnel stage scales directly with property price. A ₹5Cr property justifies 5× the cost per lead that a ₹1Cr property does.

---

## 1. Required Inputs

The nudge needs **five** inputs to evaluate the budget:

| Input | Example | Source |
|-------|---------|--------|
| **Property Price (P)** | 2.5 (in crores) | From the selected project in Step 1 |
| **Target type** | Raw Lead / Verified Lead / Qualified Lead | User picks one |
| **Target count** | 500 | User enters |
| **Duration (days)** | 30 | User enters |
| **Budget** | ₹15,00,000 | User enters |

> **Note on P:** Property price should be captured at the **project level** so every campaign inside that project inherits the same CAC envelope. If the project doesn't have P set, prompt the user to add it before the nudge can be shown.

---

## 2. Derived Metrics

```
implied_cost_per_target = budget / target_count
daily_budget            = budget / duration_days
daily_target            = target_count / duration_days
```

The cost label adapts to the target type:
- Raw Lead → **CPL** (Cost Per Lead)
- Verified Lead → **CPVL** (Cost Per Verified Lead)
- Qualified Lead → **CPQL** (Cost Per Qualified Lead)

---

## 3. Benchmark Ranges — Scaled by Property Price (P)

All thresholds are multiplied by **P (property price in crores)**. If P = 2, the ranges double. If P = 0.5, they halve.

| Target Type | Unrealistic (High Risk) | Aggressive (Good CAC) | Optimal (Avg CAC) | Overboard (High CAC) |
|-------------|-------------------------|-----------------------|-------------------|----------------------|
| **Raw Lead (CPL)** | < ₹400 × P | ₹400 – ₹750 × P | ₹750 – ₹975 × P | > ₹975 × P |
| **Verified Lead (CPVL)** | < ₹650 × P | ₹650 – ₹1,250 × P | ₹1,250 – ₹1,625 × P | > ₹1,625 × P |
| **Qualified Lead (CPQL)** | < ₹2,000 × P | ₹2,000 – ₹3,750 × P | ₹3,750 – ₹4,875 × P | > ₹4,875 × P |

### What each status means

- 🔴 **Unrealistic (High Risk)** — Cost per target is below what the market can realistically deliver. Either the budget is too low to acquire the target volume, or expectations are unreasonable. Most campaigns at this level will underdeliver severely.
- 🟢 **Aggressive (Good CAC)** — Budget implies a **good CAC** (~₹75K/Cr). Ambitious but achievable with disciplined targeting and strong creatives. This is the sweet spot for performance-minded teams.
- 🟢 **Optimal (Avg CAC)** — Budget implies an **average CAC** (~₹1L/Cr). Comfortably achievable with standard best practices. Most campaigns land here.
- 🟡 **Overboard (High CAC)** — Budget implies a **high CAC** (₹1.3L+/Cr). Spending more than necessary for the property's value. Either reduce budget or use the extra room to focus on lead quality over volume.

### Worked examples

**Example 1 — ₹1Cr property, targeting 500 Qualified Leads in 30 days**

Qualified lead thresholds (with P = 1):
- Unrealistic: < ₹2,000
- Aggressive: ₹2,000 – ₹3,750
- Optimal: ₹3,750 – ₹4,875
- Overboard: > ₹4,875

| Budget entered | CPQL = Budget ÷ 500 | Status |
|----------------|--------------------:|--------|
| ₹5,00,000 | ₹1,000 | 🔴 Unrealistic |
| ₹15,00,000 | ₹3,000 | 🟢 Aggressive |
| ₹22,00,000 | ₹4,400 | 🟢 Optimal |
| ₹30,00,000 | ₹6,000 | 🟡 Overboard |

**Example 2 — ₹5Cr luxury property, targeting 200 Verified Leads in 30 days**

Verified lead thresholds (with P = 5):
- Unrealistic: < ₹3,250 (₹650 × 5)
- Aggressive: ₹3,250 – ₹6,250 (₹650–₹1,250 × 5)
- Optimal: ₹6,250 – ₹8,125 (₹1,250–₹1,625 × 5)
- Overboard: > ₹8,125 (₹1,625 × 5)

| Budget entered | CPVL = Budget ÷ 200 | Status |
|----------------|--------------------:|--------|
| ₹5,00,000 | ₹2,500 | 🔴 Unrealistic |
| ₹10,00,000 | ₹5,000 | 🟢 Aggressive |
| ₹14,00,000 | ₹7,000 | 🟢 Optimal |
| ₹20,00,000 | ₹10,000 | 🟡 Overboard |

---

## 4. Daily Budget Floor (Independent of CAC)

Meta needs a minimum daily budget to deliver effectively. This check runs **independently** of the CAC-based thresholds — a great CAC doesn't help if the daily budget is too low for Meta to exit the learning phase.

| Daily Budget | Status |
|--------------|--------|
| < ₹1,000/day | **Blocks "Optimal"** — Meta can't exit learning phase |
| ₹1,000 – ₹3,000/day | **Downgrades by one level** — limited delivery, slow learning |
| ₹3,000 – ₹5,000/day | Minimum viable — will deliver but learning may be slow |
| ₹5,000+/day | Good — sufficient for stable delivery |

---

## 5. Nudge Status Logic

```
function evaluateBudget(propertyPriceCrores P, targetType, targetCount, durationDays, budget):

    impliedCost = budget / targetCount
    dailyBudget = budget / durationDays

    // Step 1: Hard floor on daily budget
    if dailyBudget < 1000:
        return "unrealistic" with reason "daily budget below Meta's learning-phase floor"

    dailyBudgetSoftWarning = (dailyBudget < 3000)  // will downgrade by one level

    // Step 2: Scale thresholds by property price
    benchmarks = BENCHMARKS[targetType]
    unrealisticCeiling = benchmarks.unrealistic_ceiling * P
    aggressiveCeiling  = benchmarks.aggressive_ceiling  * P
    optimalCeiling     = benchmarks.optimal_ceiling     * P

    // Step 3: Classify against CAC-derived ranges
    if impliedCost < unrealisticCeiling:
        status = "unrealistic"
    else if impliedCost <= aggressiveCeiling:
        status = "aggressive"
    else if impliedCost <= optimalCeiling:
        status = "optimal"
    else:
        status = "overboard"

    // Step 4: Downgrade one level if daily budget is soft-warning range
    if dailyBudgetSoftWarning:
        status = downgrade(status)
        // optimal → aggressive, aggressive → unrealistic, overboard → optimal

    return status
```

---

## 6. Nudge Messages

All messages include the scaled threshold for context, so the user understands why the status applies to *their* property, not generic real estate.

### 🔴 Unrealistic (High Risk)

**Appearance:** Red background, ⛔ icon

When implied cost is below the floor:
> "A {cost_label} of ₹{implied_cost} is below the floor for a ₹{P}Cr property — typical real estate campaigns need at least ₹{unrealistic_ceiling} per {target_type} to deliver. Consider increasing your budget or reducing your target."

When daily budget is too low:
> "A daily budget of ₹{daily_budget} is too low for Meta to deliver effectively. Meta needs at least ₹1,000/day to exit the learning phase. Consider increasing your budget or extending the duration."

### 🟢 Aggressive (Good CAC)

**Appearance:** Green background, ✅ icon

> "{cost_label} of ₹{implied_cost} puts you at a **good CAC of ~₹75K per crore**. Ambitious but achievable — you'll need disciplined targeting and strong creatives, but this is the sweet spot for efficient spend."

### 🟢 Optimal (Avg CAC)

**Appearance:** Green background, ✅ icon

> "{cost_label} of ₹{implied_cost} lands at an **average CAC of ~₹1L per crore** — comfortably achievable with standard best practices. Most campaigns for ₹{P}Cr properties perform in this range."

### 🟡 Overboard (High CAC)

**Appearance:** Amber background, ⚠️ icon

> "{cost_label} of ₹{implied_cost} implies a **CAC above ₹1.3L per crore** — higher than needed for a ₹{P}Cr property. Consider reducing your budget to ₹{suggested_budget} (for avg CAC) or using the extra spend to tighten targeting for higher-intent buyers."

---

## 7. Suggested Budget Calculation

When the user is Unrealistic or Overboard, we suggest a budget that would land them in the Optimal zone.

```
optimal_midpoint_per_target = (aggressive_ceiling + optimal_ceiling) / 2 * P
suggested_budget            = target_count * optimal_midpoint_per_target
suggested_daily             = suggested_budget / duration_days
```

**Worked example:**
- Property: ₹2Cr, targeting 300 Qualified Leads in 30 days
- Optimal range per QL: ₹7,500 – ₹9,750 (₹3,750–₹4,875 × 2)
- Midpoint: ₹8,625
- Suggested budget: 300 × ₹8,625 = **₹25,87,500** at ₹86,250/day

If the user entered ₹40,00,000 (₹13,333 CPQL — Overboard), the nudge suggests trimming to ~₹25.8L.

---

## 8. Cross-field Validation

The nudge should only show when **all four inputs** are resolved: property price (from project), target count, duration, and budget.

| Fields resolved | Show nudge? |
|----------------|-------------|
| Missing P (project has no price set) | No — show prompt: "Add property price to this project to see budget guidance" |
| Only budget | No |
| Budget + target count | No (need duration for daily check) |
| Budget + target count + duration (with P available) | Yes |

---

## 9. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Target count = 0 | No nudge, show field validation error |
| Duration = 0 | No nudge, show field validation error |
| Budget = 0 | No nudge, show field validation error |
| Property price not set | No nudge, inline CTA: "Add property price to the project" |
| P < 0.25 (under ₹25L) | Show nudge with note: "Low-ticket real estate may have different benchmarks — monitor CAC closely" |
| P > 10 (over ₹10Cr ultra-luxury) | Show nudge with note: "Ultra-premium properties often run higher CAC — consider extending campaign duration for quality over speed" |
| Very long duration (90+ days) | Add note: "For campaigns longer than 60 days, consider splitting into phases for better optimization" |
| Very short duration (< 7 days) | Add note: "Short campaigns give Meta limited time to optimize. Consider extending to at least 14 days" |

---

## 10. Benchmark Config (implementation reference)

```typescript
// All values are PER ₹1Cr of property value. Multiply by P at evaluation time.
const BUDGET_BENCHMARKS_PER_CRORE = {
  raw_lead: {
    unrealistic_ceiling: 400,     // < this * P  → Unrealistic
    aggressive_ceiling:  750,     // up to this * P → Aggressive (Good CAC)
    optimal_ceiling:     975,     // up to this * P → Optimal (Avg CAC)
                                  // > this * P  → Overboard (High CAC)
    label: "CPL",
  },
  verified_lead: {
    unrealistic_ceiling:  650,
    aggressive_ceiling:  1250,
    optimal_ceiling:     1625,
    label: "CPVL",
  },
  qualified_lead: {
    unrealistic_ceiling: 2000,
    aggressive_ceiling:  3750,
    optimal_ceiling:     4875,
    label: "CPQL",
  },
};

// Underlying CAC envelope (per ₹1Cr of property value)
const CAC_ENVELOPE = {
  good_cac:    75_000,    // ≈ upper bound of Aggressive zone
  average_cac: 97_500,    // ≈ upper bound of Optimal zone
  high_cac:    130_000,   // ≈ Overboard territory begins
};

// Implicit funnel assumed in the derivation
const FUNNEL = {
  raw_to_close:       0.01,   // 1%
  verified_to_close:  0.0167, // 1.67%
  qualified_to_close: 0.05,   // 5%
};
```

These constants should eventually be:
- Configurable per project (luxury vs mid-market may use different funnel rates)
- Informed by the org's own historical campaign data (once enough campaigns have run)
- Adjusted by city tier (Tier 1 vs Tier 2 vs NRI markets may have different CAC envelopes)

---

## 11. Summary

```
Inputs:   Property Price (P) + Target type + Target count + Duration + Budget
Derives:  Implied cost per target, daily budget
Scales:   All thresholds × P (so a ₹5Cr property gets 5× the budget headroom)
Checks:   Implied cost against CAC-derived ranges, plus daily budget floor

Four statuses, semantically tied to CAC outcomes:
  🔴 Unrealistic — below market floor, won't deliver
  🟢 Aggressive  — implies GOOD CAC (~₹75K/Cr), efficient spend
  🟢 Optimal     — implies AVG CAC (~₹1L/Cr), standard range
  🟡 Overboard   — implies HIGH CAC (>₹1.3L/Cr), overspending

The key mental model:
  Budget isn't judged in absolute terms — it's judged against the
  property's value. ₹10L for a ₹1Cr property is overboard;
  ₹10L for a ₹5Cr property is aggressive-good.
```
