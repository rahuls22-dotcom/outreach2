// Analyst Agent ↔ Spot review.
//
// An always-on Analyst Agent scans each project, writes up a markdown report,
// and kicks off a short conversation with Spot — the Analyst opens with the
// finding, Spot reasons through it and lands the recommendation. "View
// analysis" on a project card surfaces that exchange: the Analyst's opener +
// a collapsible markdown report, then Spot's reasoning + the action CTA.

import type { ProductSummary } from "@/lib/products-data";
import { diagnoseProduct } from "@/lib/products-data";

export type AnalystReport = {
  /** The flow Spot concludes it should run. */
  flow: "scale" | "optimize" | "test-angles" | "launch";
  /** CTA label for the recommended action (matches the card). */
  action: string;
  /** Report header, shown on the collapsed drop-down. */
  headline: string;
  /** The Analyst Agent's opening line — it starts the conversation. */
  opener: string;
  /** Spot's reasoning behind the recommendation. */
  reasoning: string;
  /** The full report, as the markdown the Analyst Agent actually produces. */
  reportMd: string;
};

export function analystReportFor(p: ProductSummary): AnalystReport {
  const dx = diagnoseProduct(p);
  const cpl = p.performance.avgCpl;
  const leads = p.performance.totalLeads.toLocaleString("en-IN");
  const qual = p.performance.qualificationRate;
  const winnerCpl = Math.max(120, Math.round((cpl * 0.83) / 10) * 10);
  const headline = `Weekly scan · ${p.name}`;
  const overPct = Math.round(((cpl - winnerCpl) / winnerCpl) * 100);

  if (dx.flow === "optimize") {
    return {
      flow: "optimize",
      action: dx.action,
      headline,
      opener: `Morning — weekly scan on **${p.name}** is in, and I'm flagging it for optimization. CPL's run up and the cause is creative fatigue, not targeting. Report's below.`,
      reasoning: `Got it. My read: the top creatives are past frequency 3.5 with CTR sliding, and the landing page is leaking on top of that — but the audience itself is still healthy. So this is a freshness problem, not a targeting one. I'd ship the small reversible fixes first — refresh the creative, tighten the LP, pause the worst ad set — and re-measure CPL before any bigger swings. That's why I'm recommending we **optimize**.`,
      reportMd: `## Weekly scan · ${p.name}

### Signals
- **CPL** — ₹${cpl} (+${overPct}% WoW)
- **Qualification** — ${qual}% (flat)
- **Volume** — ${leads} leads (−6%)
- **Avg. frequency** — 3.6 (+0.9)

### Root cause
- The top 3 ads are past frequency 3.5 and CTR is down 22% over the last 10 days — the creative is tired.
- Landing-page bounce crept to 58%, so the click-to-lead step is leaking as well.
- Audience reach and overlap are healthy — no saturation at the audience level yet.

### Recommendation
- Refresh the three fatigued creatives and pause the worst-performing ad set (reversible, low-risk).
- Tighten the landing-page hero and form above the fold to recover the bounce.
- Hold targeting steady and re-measure CPL before any bigger swings.
`,
    };
  }

  if (dx.flow === "test-angles") {
    return {
      flow: "test-angles",
      action: dx.action,
      headline,
      opener: `Morning — scan on **${p.name}** flags thin volume at a high CPL. The angles are tapped, not the audience. Report's below.`,
      reasoning: `Right. Reach is fine, but all three live concepts have flattened — they've stopped saying anything new. So rather than touch the audience, I'd spin up 3-4 fresh angles off the winning pattern (specificity + parent autonomy), small budget each, and scale whatever breaks out. That's why I'm recommending an **angle test**.`,
      reportMd: `## Weekly scan · ${p.name}

### Signals
- **CPL** — ₹${cpl} (high)
- **Volume** — ${leads} leads (thin)
- **Qualification** — ${qual}%
- **Live angles** — 3 (all flat)

### What I'm seeing
- Reach is healthy but CTR on all three live concepts has flattened — they've stopped saying anything new.
- The winning historical pattern is specificity + parent autonomy; the current set is generic.
- Audience quality is fine — this is a creative problem, not a targeting one.

### Recommendation
- Spin up 3-4 net-new angles built off the winning pattern, small budget each.
- Run them against the existing audiences, prune fast, and scale whatever breaks out.
`,
    };
  }

  // Healthy → scale (default)
  return {
    flow: "scale",
    action: dx.action,
    headline,
    opener: `Morning — I ran the weekly scan on **${p.name}** and I'm flagging it as a scale opportunity. Headline: the parent-dashboard cohort has real headroom. Full report's below.`,
    reasoning: `Thanks. Here's how I read it: the parent-dashboard angle is doing the heavy lifting — 62% of qualified leads at a low ₹${winnerCpl} CPL, frequency still only 1.4, and the lookalike's barely penetrated, so there's room to push hard. The two interest-stack ad sets, meanwhile, are saturating and dragging CPL up. So the call's straightforward — move budget onto the proven winner and cap the laggards. That's why I'm recommending we **scale**.`,
    reportMd: `## Weekly scan · ${p.name}

### Signals
- **CPL** — ₹${cpl} (−8% WoW)
- **Qualification** — ${qual}% (+1.2 pts)
- **Volume** — ${leads} leads (steady)
- **Winner CPL** — ₹${winnerCpl} (frequency 1.4)

### What's carrying it
- The parent-dashboard angle drives **62% of qualified leads** at ₹${winnerCpl} CPL — the strongest cohort by far.
- Frequency on the winner is only 1.4 and the 1% lookalike is 38% penetrated → real headroom before fatigue.
- Qualification on this cohort is ~4 pts above the account average.

### What's dragging
- Two interest-stack ad sets are saturating — frequency over 3.2 and CPL drifting up ~11% over 7 days.
- Budget on those is better spent behind the proven winner.

### Recommendation
- Shift budget to the parent-dashboard cohort and expand the lookalike (1% → 2%).
- Cap the two saturating ad sets so spend follows performance.
`,
  };
}
