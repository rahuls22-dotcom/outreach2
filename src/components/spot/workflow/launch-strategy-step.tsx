"use client";

// Campaign Strategy canvas — the launch-strategy step. Spot drafts the full
// strategy.md: the lean-experiment approach, ad identity, creative strategy
// (one angle per persona), campaign structure & targeting, and the instant
// form. Lead-gen forms only for now. The user approves it (read-only here;
// edits happen via chat) before Spot builds the detailed plan.
//
// Dark-themed to match the right canvas (#161614).

import { Target, FileText, Crosshair, TrendingUp, Workflow, IdCard, Layers, ClipboardList } from "lucide-react";
import type { LaunchWorkflow } from "@/lib/spot/workflow";
import { PRODUCTS } from "@/lib/products-data";

type StratPersona = { name: string; pain: string; angles: string[] };

/** Full PDF-spec creative angle for a persona. */
type FullAngle = {
  hook: string;
  painPoint: string;
  usp: string;
  cta: string;
  primaryText: string;
  headline: string;
  description: string;
};

/** EdTech-generic creative angles keyed off the persona archetype, so the
 *  strategy reads coherently for both researched (new) and existing products. */
function anglesForPersona(name: string, pain: string): string[] {
  const n = name.toLowerCase();
  if (n.includes("parent"))
    return [
      "Watch your child solve a hard problem this week",
      "Weekly progress — visible to you, in the parent app",
      "Mentors who know the weak chapters by name",
    ];
  if (n.includes("coaching") || n.includes("switch"))
    return [
      "Switching coaching mid-year? We cover the gap",
      "Capped at 60, not 200 — attention, not anonymity",
      "1:1 mentor review every fortnight",
    ];
  if (n.includes("self") || n.includes("student"))
    return [
      "Doubts cleared live, in 15 minutes",
      "Rank against your whole batch, weekly",
      "24-month recordings — revise anytime",
    ];
  if (n.includes("professional") || n.includes("working"))
    return [
      "Fluency on your schedule — 20 minutes a day",
      "Speak up with confidence in the next meeting",
      "From hesitant to fluent in 90 days",
    ];
  return [
    pain ? `${pain} — addressed head-on` : "The pain, named head-on",
    "The outcome they actually want",
    "Proof it works — real cohort results",
  ];
}

/** Full PDF-spec angle copy keyed off the persona archetype. Maps the same
 *  archetypes anglesForPersona uses, so it stays in sync with researched or
 *  product-derived personas. */
function fullAngleForPersona(name: string): FullAngle {
  const n = name.toLowerCase();
  if (n.includes("parent"))
    return {
      hook: "Watch your child solve a JEE problem this week",
      painPoint:
        "Offline coaching is a black box: you only hear about ranks after it's too late to fix anything",
      usp: "Cohort capped at 60, IIT-alum mentors, weekly all-India mock rankings visible in the parent dashboard",
      cta: "Book a free trial class",
      primaryText:
        "You don't have to wait for term-end results. With Guyju's JEE Crack, every week brings a live mock, an all-India rank, and a 1:1 mentor review you can see.",
      headline: "See the Rank. Every Week.",
      description: "Live classes · IIT-alum mentors · cohort capped at 60",
    };
  if (n.includes("self") || n.includes("student"))
    return {
      hook: "Stuck on a problem at 11pm? Get it cleared live",
      painPoint:
        "Self-study stalls on the hard chapters, and there's no one to clear a doubt the moment it blocks you",
      usp: "Live doubt-clearing in minutes, weekly all-India mocks to benchmark yourself, and 24-month recordings to revise on your own time",
      cta: "Try a free doubt-clearing session",
      primaryText:
        "Self-study takes you far, but the hard chapters are where ranks are won. Clear doubts live, rank against the whole batch every week, and revise from full recordings whenever you want.",
      headline: "Clear Every Doubt. Live.",
      description: "Live doubt-clearing · weekly mocks · 24-month recordings",
    };
  if (n.includes("coaching") || n.includes("switch") || n.includes("hopper"))
    return {
      hook: "Switched coaching mid-year? We close the gap",
      painPoint:
        "A 200-seat batch means you're a row number, not a name, and a mid-year switch leaves syllabus gaps no one tracks",
      usp: "A cohort capped at 60 with named mentors, a gap-closing onboarding plan, and a fortnightly 1:1 review that tracks exactly where you are",
      cta: "Book a free trial class",
      primaryText:
        "Big batches lose you in the crowd. At Guyju's JEE Crack the cohort is capped at 60, mentors know your weak chapters, and a gap-closing plan brings you up to speed without restarting.",
      headline: "A Batch of 60. Not 200.",
      description: "Capped cohort · named mentors · gap-closing plan",
    };
  // Sensible fallback for any other persona archetype.
  return {
    hook: "A JEE program that actually tracks your child's progress",
    painPoint:
      "Most coaching gives you a rank at term-end and no visibility into the weeks in between",
    usp: "Cohort capped at 60, IIT-alum mentors, and weekly all-India mock rankings",
    cta: "Book a free trial class",
    primaryText:
      "Guyju's JEE Crack runs a live mock every week, an all-India rank, and a 1:1 mentor review, so progress is visible long before the final exam.",
    headline: "See the Rank. Every Week.",
    description: "Live classes · IIT-alum mentors · cohort capped at 60",
  };
}

function parsePrice(cost?: string): number | null {
  if (!cost) return null;
  const digits = cost.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : null;
}

function strategyFor(w: LaunchWorkflow) {
  const rm = w.researchedMemory;
  let personas: StratPersona[] = [];
  if (rm?.personas?.length) {
    personas = rm.personas
      .slice(0, 3)
      .map((p) => ({ name: p.name, pain: p.pain, angles: anglesForPersona(p.name, p.pain) }));
  } else if (w.productId) {
    const prod = PRODUCTS.find((x) => x.id === w.productId);
    personas = (prod?.personas ?? [])
      .slice(0, 3)
      .map((p) => ({ name: p.name, pain: "", angles: anglesForPersona(p.name, "") }));
  }
  if (personas.length === 0) {
    personas = [{ name: "Primary buyer", pain: "", angles: anglesForPersona("", "") }];
  }

  const price = parsePrice(rm?.pricing?.[0]?.cost);
  const cpql = price ? Math.round((price * 0.023) / 50) * 50 : 1200;
  const cpqlRationale = price
    ? `~2.3% of the ${rm?.pricing?.[0]?.cost} program price`
    : "set from the category price band";

  // Daily budget: workflow.budget.amountInr is the TOTAL over .days. Fall back
  // to ₹8,000/day. Goal leads = (daily × 30) / CPL per month.
  const daily = w.budget && w.budget.days > 0 ? Math.round(w.budget.amountInr / w.budget.days) : 8000;
  const goalLeads = cpql > 0 ? Math.round((daily * 30) / cpql) : 200;

  return { personas, cpql, cpqlRationale, daily, goalLeads };
}

export function LaunchStrategyStep({ workflow }: { workflow: LaunchWorkflow }) {
  const { personas, cpql, cpqlRationale, daily, goalLeads } = strategyFor(workflow);

  return (
    <div className="px-6 py-6 max-w-[760px] mx-auto text-text-primary">
      <div className="text-[10.5px] uppercase tracking-wider font-semibold mb-1.5 text-text-tertiary">
        Campaign strategy
      </div>
      <h1 className="text-[22px] font-semibold tracking-tight leading-[1.15] text-text-primary">{workflow.productName}</h1>

      {/* Intro blurb — the lean-experiment framing (PDF tone). */}
      <p className="text-[12.5px] mt-2.5 mb-5 leading-relaxed text-text-secondary">
        Since this is a new campaign with no historical data, Spot will start with a lean experiment: 2 campaigns,
        4 ad sets, 3 creative angles. Based on results from the first 7 to 14 days, I&apos;ll narrow the targeting and
        creatives that are working, then scale. Think of it as a discovery phase: every rupee spent is buying data,
        not just leads.
      </p>

      {/* 1. Approach */}
      <Section icon={TrendingUp} label="1 · Approach">
        <div className="space-y-px">
          <KVRow k="Objective" v="Lead Generation via Meta Lead Ads" />
          <KVRow k="Daily budget" v={`₹${daily.toLocaleString("en-IN")}`} />
          <KVRow k="Target CPL" v={`₹${cpql.toLocaleString("en-IN")}`} sub={cpqlRationale} />
          <KVRow k="Goal leads" v={`${goalLeads.toLocaleString("en-IN")} per month`} sub="From daily budget ÷ target CPL" />
          <KVRow k="Campaign count" v="2 — Cold Acquisition (85% of budget) + Retargeting (15% of budget)" />
          <KVRow
            k="Week 1 focus"
            v="Data collection: all 4 ad sets run simultaneously to find the strongest audience and creative angle."
          />
        </div>
      </Section>

      {/* 2. Ad Identity */}
      <Section icon={IdCard} label="2 · Ad Identity">
        <div className="space-y-px">
          <KVRow k="Facebook Page" v={workflow.productName} />
          <KVRow k="Instagram Account" v="@guyjus.jee" />
          <KVRow k="Ad format mix" v="Static image (50%) · Reel/video (30%) · Carousel (20%)" />
        </div>
      </Section>

      {/* 3. Creative Strategy — one full angle per persona */}
      <SectionHeader icon={FileText} label="3 · Creative strategy" />
      <div className="space-y-3 mb-5">
        {personas.map((p, i) => {
          const a = fullAngleForPersona(p.name);
          return (
            <div key={i} className="bg-white border border-border rounded-card p-4">
              <div className="text-[14px] font-semibold text-text-primary">{p.name}</div>
              <div className="mt-3 pt-3 space-y-2.5 border-t border-border">
                <AngleField label="Hook" value={a.hook} />
                <AngleField label="Pain point" value={a.painPoint} />
                <AngleField label="USP" value={a.usp} />
                <AngleField label="CTA" value={a.cta} />
                <AngleField label="Primary text" value={a.primaryText} />
                <AngleField label="Headline" value={a.headline} />
                <AngleField label="Description" value={a.description} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Campaign Structure & Targeting */}
      <SectionHeader icon={Layers} label="4 · Campaign structure & targeting" />

      {/* Campaign 1 — Cold Acquisition */}
      <div className="bg-white border border-border rounded-card p-4 mb-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Crosshair size={12} strokeWidth={1.8} className="text-text-tertiary" />
          <span className="text-[12.5px] font-semibold text-text-primary">Campaign 1 — Cold Acquisition</span>
        </div>
        <p className="text-[11.5px] mb-3 leading-snug text-text-tertiary">
          3 ad sets, one per persona. 85% of budget. All run at once in week 1 to find the winner.
        </p>
        <div className="space-y-2.5">
          {COLD_AD_SETS.map((s, i) => (
            <div key={i} className="rounded-[8px] px-3 py-2.5 bg-surface-secondary border border-border">
              <div className="text-[12px] font-semibold mb-2 text-text-primary">{s.adSet}</div>
              <div className="space-y-px">
                <TargetRow k="Geo" v={s.geo} />
                <TargetRow k="Age" v={s.age} />
                <TargetRow k="Signals" v={s.signals} />
                <TargetRow k="Income" v={s.income} />
                <TargetRow k="Exclusions" v={s.exclusions} />
                <TargetRow k="CTA" v={s.cta} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign 2 — Retargeting */}
      <div className="bg-white border border-border rounded-card p-4 mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <Target size={12} strokeWidth={1.8} className="text-text-tertiary" />
          <span className="text-[12.5px] font-semibold text-text-primary">Campaign 2 — Retargeting</span>
        </div>
        <p className="text-[11.5px] mb-3 leading-snug text-text-tertiary">
          15% of budget. Warm audiences who engaged but didn&apos;t convert.
        </p>
        <div className="space-y-px">
          <KVRow k="Audiences" v="Site visitors · lead-form openers who didn't submit · video viewers 50%+" />
          <KVRow k="Exclusions" v="Already-enrolled students · leads who already submitted" />
          <KVRow k="Creative angle" v="Urgency + social proof: “Seats filling — cohort capped at 60”" />
          <KVRow k="Frequency cap" v="3 impressions per 7 days" />
        </div>
      </div>

      {/* 5. Instant Form */}
      <SectionHeader icon={ClipboardList} label="5 · Instant form" />
      <div className="bg-white border border-border rounded-card p-4 mb-5">
        <div className="space-y-px">
          <KVRow k="Form type" v="Meta Instant Form (lead-gen)" />
          <KVRow k="Headline" v="Book a free JEE trial class" />
          <KVRow k="Greeting" v="Class 11 and serious about JEE? See how Guyju's JEE Crack works in one free trial class." />
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2 text-text-tertiary">
            Qualifying questions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Current class (11 / 12 / Dropper)",
              "Target exam year",
              "Parent or student?",
              "Phone number",
              "Email",
            ].map((q, i) => (
              <span
                key={i}
                className="text-[11.5px] px-2 py-1 rounded-[7px] bg-surface-secondary border border-border text-text-secondary"
              >
                {q}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 pt-3 space-y-px border-t border-border">
          <KVRow k="Thank-you screen" v="Thanks! You're booked. Our team will call to schedule your trial." />
          <KVRow k="Privacy policy" v="Linked: guyjus.jee/privacy (required by Meta lead forms)" />
        </div>
      </div>

      {/* CRM workflow · Qualifier Agent — how inbound leads get handled once
          the ads bring them in. Lives in the strategy, not the plan. */}
      <div className="mt-6">
        <SectionHeader icon={Workflow} label="CRM workflow · Qualifier Agent" />
      </div>
      <div className="bg-white border border-border rounded-card p-4">
        <p className="text-[12.5px] leading-relaxed text-text-secondary">
          Every inbound lead is picked up the moment it lands and routed on ICP fit — voice + WhatsApp, no lead left cold.
        </p>
        <div className="mt-3.5 space-y-2.5">
          {[
            { k: "Qualifier Agent", v: "Always-on · voice + WhatsApp capable" },
            { k: "ICP match", v: "Runs Revspot Enrichment on each lead — role, intent signals, prior product touches" },
            { k: "High ICP → human", v: "Patches the call live to a Sales rep within 90s, while the lead is still warm" },
            { k: "Lower ICP → nurture", v: "Qualifies on the call, then a 10-day WhatsApp sequence (6 touches) re-qualifies when intent resurfaces" },
          ].map((s, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-surface-secondary border border-border text-text-tertiary">
                {i + 1}
              </span>
              <div>
                <div className="text-[12.5px] font-semibold text-text-primary">{s.k}</div>
                <div className="text-[11.5px] leading-snug mt-0.5 text-text-secondary">{s.v}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Light section card with an eyebrow header. */
function Section({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof TrendingUp;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-border rounded-card p-4 mb-5">
      <SectionEyebrow icon={Icon} label={label} />
      {children}
    </div>
  );
}

/** Standalone eyebrow header (for sections whose body isn't a single card). */
function SectionHeader({ icon: Icon, label }: { icon: typeof TrendingUp; label: string }) {
  return (
    <div className="mb-3">
      <SectionEyebrow icon={Icon} label={label} />
    </div>
  );
}

function SectionEyebrow({ icon: Icon, label }: { icon: typeof TrendingUp; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon size={13} strokeWidth={1.8} className="text-text-tertiary" />
      <span className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">{label}</span>
    </div>
  );
}

/** Cold-acquisition ad sets — one per persona/audience. Guyju's JEE Crack data. */
const COLD_AD_SETS = [
  {
    adSet: "Ad set A — Engineer Parent",
    geo: "Tier-1 / tier-2 metros (Bengaluru, Hyderabad, Pune, Delhi NCR)",
    age: "Parents, 38-52",
    signals: "JEE prep interest, ed-tech intent, IIT/engineering-college pages",
    income: "Top 25% household income",
    exclusions: "Existing leads + enrolled students",
    cta: "Book a free trial",
  },
  {
    adSet: "Ad set B — Self-Studier",
    geo: "Tier-1 / tier-2 metros + high-intent tier-2 towns",
    age: "Students, 16-18",
    signals: "JEE prep interest, mock-test apps, doubt-clearing / study-help pages",
    income: "Broad (student audience)",
    exclusions: "Existing leads + enrolled students",
    cta: "Try a free doubt-clearing session",
  },
  {
    adSet: "Ad set C — Coaching Hopper",
    geo: "Tier-1 / tier-2 metros with dense coaching clusters",
    age: "Students 16-18 + parents 38-52",
    signals: "Competitor coaching-page engagement, JEE prep interest, ed-tech intent",
    income: "Top 25% household income",
    exclusions: "Existing leads + enrolled students",
    cta: "Book a free trial",
  },
];

/** Label/value row for key sections (Approach, Ad Identity, Retargeting, Form). */
function KVRow({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="flex gap-3 py-1.5 border-t border-border first:border-t-0">
      <span className="text-[11px] flex-shrink-0 w-[112px] pt-px text-text-tertiary">{k}</span>
      <div className="min-w-0">
        <span className="text-[12.5px] text-text-primary">{v}</span>
        {sub && <span className="text-[10.5px] block mt-0.5 text-text-tertiary">{sub}</span>}
      </div>
    </div>
  );
}

/** Compact label/value row for the targeting mini-cards. */
function TargetRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2.5 py-1 border-t border-border first:border-t-0">
      <span className="text-[10px] uppercase tracking-wider font-semibold flex-shrink-0 w-[72px] pt-px text-text-tertiary">{k}</span>
      <span className="text-[11.5px] min-w-0 text-text-secondary">{v}</span>
    </div>
  );
}

/** A single labeled creative-angle field inside a persona card. */
function AngleField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider font-semibold mb-0.5 text-text-tertiary">{label}</div>
      <div className="text-[12.5px] leading-snug text-text-primary">{value}</div>
    </div>
  );
}
