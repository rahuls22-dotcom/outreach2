"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  outreachDetailForId,
  type OutreachDetail,
} from "./outreach-data";

// ── Draft seed ────────────────────────────────────────────────────────────
//
// A newly-created outreach starts life in the draft store with just enough
// fields to render the detail page: id, name, voice agent, project, created
// date. Everything else (called counts, funnels, schedule defaults) is
// hydrated from a baseline outreach in the static set when the detail page
// asks for it.
//
// This split keeps the demo from having to maintain a full OutreachDetail
// shape per draft while still letting the detail page render meaningfully
// the moment the user lands on it after Create.

export interface OutreachDraftSeed {
  id: string;
  projectId: string;
  name: string;
  voiceAgent: string;
  createdAt: string;
  // Audience + scheduling state. Empty until the user commits the
  // AddLeadsModal — at which point we copy totalContacts, status,
  // and the scheduling choice in so the detail page funnel + counters
  // + status badge update immediately. Persisted so reloading keeps
  // the just-added audience visible.
  totalContacts?: number;
  status?: "draft" | "in_progress" | "scheduled" | "completed" | "paused";
  startMode?: "immediate" | "schedule";
  scheduledFor?: string; // ISO timestamp when startMode === "schedule"
  sources?: { id: string; name: string; uploadedAt: string; leads: number }[];
}

type OutreachDraftStore = {
  drafts: Record<string, OutreachDraftSeed>;
  upsertDraft: (seed: OutreachDraftSeed) => void;
  patchDraft: (id: string, patch: Partial<OutreachDraftSeed>) => void;
  removeDraft: (id: string) => void;
};

export const useOutreachDraftStore = create<OutreachDraftStore>()(
  persist(
    (set) => ({
      drafts: {},
      upsertDraft: (seed) =>
        set((s) => ({ drafts: { ...s.drafts, [seed.id]: seed } })),
      patchDraft: (id, patch) =>
        set((s) => {
          const current = s.drafts[id];
          if (!current) return s;
          return { drafts: { ...s.drafts, [id]: { ...current, ...patch } } };
        }),
      removeDraft: (id) =>
        set((s) => {
          const next = { ...s.drafts };
          delete next[id];
          return { drafts: next };
        }),
    }),
    { name: "revspot:outreach-draft-store" },
  ),
);

/** Build a renderable OutreachDetail from a draft seed by overlaying it on
 *  a baseline outreach — keeps the detail page meaningful (real schedule,
 *  realistic empty funnel, sensible defaults) even before any audience is
 *  uploaded. The baseline `out-1` is the same one the rest of the demo
 *  uses for new-account snapshots. */
export function hydrateDraftDetail(seed: OutreachDraftSeed): OutreachDetail | null {
  const baseline = outreachDetailForId("out-1");
  if (!baseline) return null;
  const totalContacts = seed.totalContacts ?? 0;
  // A freshly committed draft has the audience uploaded but no calls
  // have happened yet — remaining equals the total, every funnel stage
  // sits at zero. Once a real backend is in place, the funnel ticks up
  // as the dialer makes progress; for the demo, surfacing the audience
  // count + the right status is enough.
  return {
    ...baseline,
    id: seed.id,
    name: seed.name,
    voiceAgent: seed.voiceAgent,
    status: seed.status ?? "draft",
    totalContacts,
    called: 0,
    connected: 0,
    interacted: 0,
    qualified: 0,
    notQualified: 0,
    callback: 0,
    noAnswer: 0,
    busy: 0,
    wrongNumber: 0,
    remaining: totalContacts,
    avgDuration: 0,
    totalCalls: 0,
    totalMinutes: 0,
    spend: 0,
    activityDays: 0,
    sources: seed.sources ?? [],
    createdAt: seed.createdAt,
  };
}
