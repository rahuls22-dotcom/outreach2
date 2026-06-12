"use client";

// Refinement studio state — the "rooms off the spine".
//
// One session per artifact (a creative angle or the lead form). The
// session owns everything that happens in the room: the chat with the
// agent, the version filmstrip, and the commit. Only two things ever
// leave the room: the committed version and a structured ledger event
// appended to Spot's thread. The conversation itself never travels.
//
// Doctrine (mirrors the agents/ contract):
//   · Artifacts travel, conversations don't.
//   · Approve once — committing in the studio IS the approval.
//   · Nothing changes silently — every commit emits a ledger event.
//   · Agents have lanes — plan-level asks are escalated to Spot.

import { create } from "zustand";
import { useSpotStore } from "@/lib/spot/store";

export type RefinementKind = "creative" | "form";

export type RefinementVersion = {
  /** 1-based version number. v1 is always the original. */
  n: number;
  /** One-line description of what changed vs the previous version. */
  note: string;
  /** Bullet-level deltas, shown in the filmstrip + ledger expansion. */
  changes: string[];
  /** Creative · headline at this version. */
  hook?: string;
  /** Creative · CSS filter applied over the base image / gradient. */
  look?: string;
  /** Form · the field list at this version. */
  fields?: string[];
  /** Consequence beyond pixels — travels with the commit to Spot. */
  impact?: string;
};

export type StudioChatMessage =
  | { role: "user"; text: string }
  | {
      role: "agent";
      text: string;
      /** Version this reply produced (absent for lane escalations). */
      version?: number;
      /** True when the agent is declining + routing to Spot. */
      lane?: boolean;
      laneAsk?: string;
    };

export type RefinementSession = {
  artifactId: string;
  kind: RefinementKind;
  /** "Angle 2 · Parent" / "Lead form" — used in ribbon + ledger. */
  artifactLabel: string;
  persona?: string;
  personaPain?: string;
  format?: string;
  /** e.g. "9:16 only" when refining a single size. */
  scopeNote?: string;
  productName: string;
  baseHook: string;
  baseSrc?: string;
  baseHue: number;
  versions: RefinementVersion[];
  /** 1-based number of the version selected in the filmstrip. */
  activeVersion: number;
  committedVersion: number | null;
  chat: StudioChatMessage[];
  agentBusy: boolean;
};

export const STUDIO_AGENT = { name: "Iris", role: "Creative Agent" };

/* ─── The scripted agent brain ───────────────────────────────────────
   Deterministic intent matching so the demo always lands: the reply
   acknowledges, names the change, and yields a new version. Plan-level
   asks get a lane response instead of a version. */

const LANE_RE =
  /budget|price|pricing|offer|discount|cost|spend|targeting|audience|cpql|bid|persona|landing page/i;

type CreativeMove = {
  re: RegExp;
  note: string;
  look: string;
  hook: (base: string) => string;
  reply: string;
  changes: string[];
};

const CREATIVE_MOVES: CreativeMove[] = [
  {
    re: /warm/i,
    note: "warmer palette",
    look: "sepia(0.22) saturate(1.25) hue-rotate(-10deg)",
    hook: (b) => b,
    reply:
      "Warmed it up — pulled the palette toward golds and softened the cool tones. Same composition, friendlier temperature.",
    changes: ["Palette shifted warm (+gold, −blue)", "Skin tones lifted slightly"],
  },
  {
    re: /bright|light/i,
    note: "brighter exposure",
    look: "brightness(1.16) contrast(1.04)",
    hook: (b) => b,
    reply:
      "Brightened the whole frame and nudged contrast so it doesn't wash out. Reads better on a feed scroll.",
    changes: ["Exposure +16%", "Micro-contrast preserved"],
  },
  {
    re: /punch|contrast|bold|pop/i,
    note: "punchier contrast",
    look: "contrast(1.2) saturate(1.28)",
    hook: (b) => b,
    reply:
      "Gave it more punch — deeper contrast, richer saturation. It'll hold attention in the first half-second.",
    changes: ["Contrast +20%", "Saturation +28%"],
  },
  {
    re: /calm|soft|mut|subtle|less/i,
    note: "calmer, muted treatment",
    look: "saturate(0.72) brightness(1.05)",
    hook: (b) => b,
    reply:
      "Pulled it back — muted the saturation and lifted the base so it feels premium rather than loud.",
    changes: ["Saturation −28%", "Quieter overall tone"],
  },
  {
    re: /short|tight|crisp|headline|copy|hook|word/i,
    note: "shorter headline",
    look: "",
    hook: shortenHook,
    reply:
      "Tightened the headline — cut it to the core promise so it survives the 2-second skim.",
    changes: ["Headline cut to the core promise", "Same visual, copy-only change"],
  },
  {
    re: /urgen|now|deadline|fomo|scar/i,
    note: "urgency added to the hook",
    look: "contrast(1.08)",
    hook: (b) => `${shortenHook(b)} — new batch closes Sunday`,
    reply:
      "Added a soft deadline to the hook. Urgency without the countdown-timer energy — it stays on-brand.",
    changes: ["Hook now carries a batch deadline", "Slight contrast lift to match"],
  },
  {
    re: /proof|trust|social|number|stat/i,
    note: "proof-led hook",
    look: "",
    hook: () => "12,000+ parents saw the change in 8 weeks",
    reply:
      "Swapped the promise for proof — led with the 12,000-parent number. Proof-led hooks have been winning in this account.",
    changes: ["Hook now leads with social proof", "Promise moved to supporting line"],
  },
];

const CREATIVE_FALLBACKS: CreativeMove[] = [
  {
    re: /.*/,
    note: "alternate take",
    look: "hue-rotate(14deg) saturate(1.12)",
    hook: (b) => b,
    reply:
      "Here's an alternate take — shifted the grade and rebalanced the frame. Tell me warmer, brighter, punchier or calmer and I'll steer from there.",
    changes: ["Alternate colour grade", "Rebalanced framing"],
  },
  {
    re: /.*/,
    note: "second alternate take",
    look: "brightness(1.08) hue-rotate(-18deg)",
    hook: shortenHook,
    reply:
      "Another direction — lighter grade, tighter headline. We can also go proof-led or add urgency if you want a sharper hook.",
    changes: ["Lighter grade", "Headline tightened"],
  },
];

function shortenHook(base: string): string {
  const words = base.replace(/[.!]$/, "").split(" ");
  if (words.length <= 4) return base;
  return words.slice(0, 4).join(" ");
}

type FormMove = {
  re: RegExp;
  note: string;
  apply: (fields: string[]) => string[];
  reply: string;
  changes: string[];
  impact?: string;
};

const FORM_MOVES: FormMove[] = [
  {
    re: /remove.*phone|drop.*phone|no phone|without phone/i,
    note: "phone field removed",
    apply: (f) => f.filter((x) => x !== "Phone number"),
    reply:
      "Removed the phone field. Heads up — this usually lifts volume but drops lead quality, since phone is the strongest intent filter. I'll flag it to Spot when you commit.",
    changes: ["Phone number field removed"],
    impact:
      "Removing the phone field typically raises lead volume and lowers qualification rate",
  },
  {
    re: /qualif|intent|filter|serious|quality/i,
    note: "qualifying question added",
    apply: (f) => [...f, "Current English comfort level"],
    reply:
      "Added a qualifying question — “Current English comfort level”. Volume may dip a little, but the leads that come through will be warmer for the voice agent.",
    changes: ["Added: Current English comfort level"],
    impact:
      "An extra qualifying question may reduce volume slightly while raising lead quality",
  },
  {
    re: /short|fewer|less field|simpl|two tap|quick/i,
    note: "form trimmed to essentials",
    apply: () => ["Full name", "Phone number", "Email"],
    reply:
      "Trimmed it to the three essentials — name, phone, email. All three pre-fill from the Meta profile, so it's genuinely two taps.",
    changes: ["Trimmed to 3 pre-fillable fields"],
  },
  {
    re: /whatsapp|wa\b/i,
    note: "WhatsApp opt-in added",
    apply: (f) => [...f, "WhatsApp opt-in"],
    reply:
      "Added a WhatsApp opt-in checkbox. Leads who tick it can go straight into the click-to-WA follow-up sequence.",
    changes: ["Added: WhatsApp opt-in"],
  },
  {
    re: /city|location|where/i,
    note: "city field added",
    apply: (f) => [...f, "City"],
    reply: "Added a City field — useful for routing leads to the right batch timings.",
    changes: ["Added: City"],
  },
];

const FORM_FALLBACK: FormMove = {
  re: /.*/,
  note: "alternate field order",
  apply: (f) => f,
  reply:
    "I can remove fields, add a qualifying question, add WhatsApp opt-in, or trim it to essentials — which direction?",
  changes: [],
};

function laneReply(ask: string, productName: string): StudioChatMessage {
  return {
    role: "agent",
    lane: true,
    laneAsk: ask,
    text:
      `That touches the campaign plan — offer, budget and audience are Spot's call, not mine. ` +
      `I can hand it to Spot with this context so it lands in the ${productName} workflow.`,
  };
}

/* ─── Store ──────────────────────────────────────────────────────── */

export type OpenStudioArgs = {
  artifactId: string;
  kind: RefinementKind;
  artifactLabel: string;
  persona?: string;
  personaPain?: string;
  format?: string;
  scopeNote?: string;
  productName: string;
  baseHook: string;
  baseSrc?: string;
  baseHue: number;
  baseFields?: string[];
};

type RefinementState = {
  sessions: Record<string, RefinementSession>;
  /** Artifact id whose studio is currently open (null = closed). */
  studioId: string | null;
  openStudio: (args: OpenStudioArgs) => void;
  closeStudio: () => void;
  discardSession: (artifactId: string) => void;
  selectVersion: (n: number) => void;
  sendToAgent: (text: string) => void;
  escalateToSpot: (ask: string) => void;
  commitVersion: () => void;
};

function greeting(args: OpenStudioArgs): string {
  if (args.kind === "form") {
    return (
      `I've got the Meta instant form for ${args.productName} — ` +
      `${(args.baseFields ?? []).length} fields, attached to every angle. ` +
      `I can add, remove or reorder fields; anything that changes the offer goes back to Spot. What should change?`
    );
  }
  const scope = args.scopeNote ? ` — ${args.scopeNote}` : ", all three sizes";
  // Lowercase only the leading character — "English gap" must keep its E.
  const pain = args.personaPain
    ? ` Spot's brief: ${args.personaPain.charAt(0).toLowerCase()}${args.personaPain.slice(1)}.`
    : "";
  return (
    `I've got “${args.baseHook}” for the ${args.persona} persona (${args.format}${scope}).` +
    `${pain} What should change — palette, headline, or the whole take?`
  );
}

export const useRefinementStore = create<RefinementState>((set, get) => ({
  sessions: {},
  studioId: null,

  openStudio: (args) => {
    const existing = get().sessions[args.artifactId];
    if (existing) {
      set({ studioId: args.artifactId });
      return;
    }
    const session: RefinementSession = {
      artifactId: args.artifactId,
      kind: args.kind,
      artifactLabel: args.artifactLabel,
      persona: args.persona,
      personaPain: args.personaPain,
      format: args.format,
      scopeNote: args.scopeNote,
      productName: args.productName,
      baseHook: args.baseHook,
      baseSrc: args.baseSrc,
      baseHue: args.baseHue,
      versions: [
        {
          n: 1,
          note: "original",
          changes: [],
          hook: args.baseHook,
          look: "",
          fields: args.baseFields,
        },
      ],
      activeVersion: 1,
      committedVersion: null,
      chat: [{ role: "agent", text: greeting(args) }],
      agentBusy: false,
    };
    set((s) => ({
      sessions: { ...s.sessions, [args.artifactId]: session },
      studioId: args.artifactId,
    }));
  },

  closeStudio: () => set({ studioId: null }),

  discardSession: (artifactId) =>
    set((s) => {
      const sessions = { ...s.sessions };
      delete sessions[artifactId];
      return { sessions, studioId: s.studioId === artifactId ? null : s.studioId };
    }),

  selectVersion: (n) => {
    const id = get().studioId;
    if (!id) return;
    set((s) => ({
      sessions: {
        ...s.sessions,
        [id]: { ...s.sessions[id], activeVersion: n },
      },
    }));
  },

  sendToAgent: (text) => {
    const id = get().studioId;
    if (!id) return;
    const patch = (fn: (sess: RefinementSession) => RefinementSession) =>
      set((s) => ({ sessions: { ...s.sessions, [id]: fn(s.sessions[id]) } }));

    patch((sess) => ({
      ...sess,
      chat: [...sess.chat, { role: "user", text }],
      agentBusy: true,
    }));

    window.setTimeout(() => {
      const sess = get().sessions[id];
      if (!sess) return;

      if (LANE_RE.test(text)) {
        patch((s2) => ({
          ...s2,
          agentBusy: false,
          chat: [...s2.chat, laneReply(text, s2.productName)],
        }));
        return;
      }

      if (sess.kind === "form") {
        const move = FORM_MOVES.find((m) => m.re.test(text)) ?? FORM_FALLBACK;
        const prevFields =
          sess.versions[sess.activeVersion - 1]?.fields ??
          sess.versions[sess.versions.length - 1].fields ??
          [];
        if (move.changes.length === 0) {
          patch((s2) => ({
            ...s2,
            agentBusy: false,
            chat: [...s2.chat, { role: "agent", text: move.reply }],
          }));
          return;
        }
        const n = sess.versions.length + 1;
        const version: RefinementVersion = {
          n,
          note: move.note,
          changes: move.changes,
          fields: move.apply(prevFields),
          impact: move.impact,
        };
        patch((s2) => ({
          ...s2,
          agentBusy: false,
          versions: [...s2.versions, version],
          activeVersion: n,
          chat: [...s2.chat, { role: "agent", text: move.reply, version: n }],
        }));
        return;
      }

      const baseVersion = sess.versions[sess.activeVersion - 1] ?? sess.versions[0];
      const matched = CREATIVE_MOVES.find((m) => m.re.test(text));
      const move =
        matched ?? CREATIVE_FALLBACKS[(sess.versions.length - 1) % CREATIVE_FALLBACKS.length];
      const n = sess.versions.length + 1;
      const version: RefinementVersion = {
        n,
        note: move.note,
        changes: move.changes,
        hook: move.hook(baseVersion.hook ?? sess.baseHook),
        look: move.look,
      };
      patch((s2) => ({
        ...s2,
        agentBusy: false,
        versions: [...s2.versions, version],
        activeVersion: n,
        chat: [...s2.chat, { role: "agent", text: move.reply, version: n }],
      }));
    }, 1100);
  },

  escalateToSpot: (ask) => {
    const id = get().studioId;
    const sess = id ? get().sessions[id] : null;
    set({ studioId: null });
    const spot = useSpotStore.getState();
    spot.appendMessage({ role: "user", text: ask });
    spot.appendMessage({
      role: "spot",
      parts: [
        {
          type: "text",
          text:
            `Got it — ${STUDIO_AGENT.name} routed this over since it changes the plan, not just the ` +
            `${sess?.kind === "form" ? "form" : "creative"}. Plan-level changes run through me so the ` +
            `budget, offer and audience stay coherent. Let's look at it together — what's driving the change?`,
        },
      ],
    });
    spot.showToast(`Handed to Spot · ${STUDIO_AGENT.name} stays scoped to the creative`);
  },

  commitVersion: () => {
    const id = get().studioId;
    if (!id) return;
    const sess = get().sessions[id];
    if (!sess) return;
    const v = sess.activeVersion;

    set((s) => ({
      sessions: {
        ...s.sessions,
        [id]: { ...s.sessions[id], committedVersion: v },
      },
      studioId: null,
    }));

    // Nothing real happened (committed the untouched original) → no ledger.
    if (v === 1) return;

    const upto = sess.versions.filter((x) => x.n > 1 && x.n <= v);
    const summary = upto.map((x) => x.note).join(" · ");
    const changes = upto.flatMap((x) => x.changes);
    const impact = [...upto].reverse().find((x) => x.impact)?.impact;

    const spot = useSpotStore.getState();
    spot.appendMessage({
      role: "spot",
      parts: [
        {
          type: "ledger",
          agent: STUDIO_AGENT.name,
          artifact: sess.artifactLabel,
          fromVersion: 1,
          toVersion: v,
          summary,
          changes,
          impact,
        },
        ...(impact
          ? [
              {
                type: "text" as const,
                text: `Noted — ${impact.toLowerCase()}. I'll have the Analyst watch this for the first 48 hours after launch.`,
              },
            ]
          : []),
      ],
    });
    spot.showToast(`${sess.artifactLabel} · v${v} committed to the plan`);
  },
}));

/* ─── Derived status helpers (for the review board) ─────────────── */

export type ArtifactRefinementStatus =
  | { state: "none" }
  | { state: "unmerged"; latest: number }
  | { state: "committed"; version: number; hook?: string; look?: string; fields?: string[] };

export function statusOf(
  sessions: Record<string, RefinementSession>,
  artifactId: string,
): ArtifactRefinementStatus {
  const sess = sessions[artifactId];
  if (!sess) return { state: "none" };
  if (sess.committedVersion && sess.committedVersion > 1) {
    const v = sess.versions[sess.committedVersion - 1];
    return {
      state: "committed",
      version: sess.committedVersion,
      hook: v?.hook,
      look: v?.look,
      fields: v?.fields,
    };
  }
  if (sess.versions.length > 1) return { state: "unmerged", latest: sess.versions.length };
  return { state: "none" };
}
