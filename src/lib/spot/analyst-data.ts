// Analyst Agent ↔ Spot conversation.
//
// Spot's recommendations ("Scale with Spot", "Optimize campaigns"…) don't come
// out of nowhere — they're the output of an always-on Analyst Agent that scans
// each project and talks the findings through with Spot. "View analysis" on a
// project card surfaces that conversation so the user can see the reasoning
// behind the recommended move before acting on it.

import type { ProductSummary } from "@/lib/products-data";
import { diagnoseProduct } from "@/lib/products-data";

export type AnalystTurn = { speaker: "analyst" | "spot"; text: string };

export type AnalystConversation = {
  turns: AnalystTurn[];
  /** The flow the conversation concludes Spot should run. */
  flow: "scale" | "optimize" | "test-angles" | "launch";
  /** CTA label for the recommended action (matches the card). */
  action: string;
  /** One-line summary Spot opens the chat with. */
  summary: string;
};

export function analystConversationFor(p: ProductSummary): AnalystConversation {
  const dx = diagnoseProduct(p);
  const cpl = p.performance.avgCpl;
  const leads = p.performance.totalLeads.toLocaleString("en-IN");
  const qual = p.performance.qualificationRate;
  const winnerCpl = Math.max(120, Math.round((cpl * 0.83) / 10) * 10);

  if (dx.flow === "optimize") {
    return {
      flow: "optimize",
      action: dx.action,
      summary:
        "creative fatigue + a leaky landing page are driving CPL up — small reversible fixes first.",
      turns: [
        { speaker: "analyst", text: `Weekly scan on ${p.name} is in. CPL's run up to ₹${cpl} — about ${Math.round(((cpl - winnerCpl) / winnerCpl) * 100)}% over where it was. Qualification's flat at ${qual}%.` },
        { speaker: "spot", text: "Where's the leak — targeting or creative?" },
        { speaker: "analyst", text: "Creative. The top 3 ads are past frequency 3.5 and CTR's down 22% over the last 10 days. Landing-page bounce crept to 58%, so the click-to-lead step is leaking too." },
        { speaker: "spot", text: "So it's a freshness + LP problem, not the audience." },
        { speaker: "analyst", text: "Right. I'd refresh the fatigued creatives, tighten the LP hero, and pause the worst-performing ad set. All reversible, low risk." },
        { speaker: "spot", text: `Agreed. I'll draft an optimize plan — the small reversible fixes ship first, then we watch CPL before the bigger swings.` },
      ],
    };
  }

  if (dx.flow === "test-angles") {
    return {
      flow: "test-angles",
      action: dx.action,
      summary:
        "volume's thin and CPL's high — the current angles are tapped, time to test fresh ones.",
      turns: [
        { speaker: "analyst", text: `${p.name} flagged this week. Only ${leads} leads at ₹${cpl} CPL — volume's thin and cost is high.` },
        { speaker: "spot", text: "Is the audience too narrow, or are the angles tired?" },
        { speaker: "analyst", text: "Angles. Reach is healthy but CTR on all three live concepts has flattened — they've stopped saying anything new. The winning pattern is specificity + parent autonomy; the current set is generic." },
        { speaker: "spot", text: "So we don't touch the audience yet — we test fresh creative against it." },
        { speaker: "analyst", text: "Exactly. Spin up 3-4 net-new angles off the winning pattern, small budget, prune fast." },
        { speaker: "spot", text: `Got it. I'll draft an angle test — fresh creatives against the existing audiences, scale whatever wins.` },
      ],
    };
  }

  // Healthy → scale (default)
  return {
    flow: "scale",
    action: dx.action,
    summary:
      "the parent-dashboard cohort has real headroom — scale the winner, trim two saturating ad sets.",
    turns: [
      { speaker: "analyst", text: `Weekly scan on ${p.name} is in. CPL's holding at ₹${cpl} — about 8% under target — and qualification ticked up to ${qual}%. Volume's steady at ${leads} leads.` },
      { speaker: "spot", text: "Good. Which cohort is carrying it?" },
      { speaker: "analyst", text: `The parent-dashboard angle — 62% of qualified leads at ₹${winnerCpl} CPL. Frequency's only 1.4 and the lookalike's 38% penetrated, so there's real headroom to push.` },
      { speaker: "spot", text: "And the laggards?" },
      { speaker: "analyst", text: "Two interest-stack ad sets are saturating — frequency over 3.2 and CPL drifting up. I'd cap those and move the budget to the winner." },
      { speaker: "spot", text: `Agreed. The move is to scale the parent-dashboard cohort and trim the saturating ad sets. I'll draft a scale plan now.` },
    ],
  };
}
