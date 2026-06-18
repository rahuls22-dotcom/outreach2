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

// Legacy shape mirrored by OutreachDetail.sources. Kept so committed
// uploads can also feed the hydrated draft detail without translation.
export interface OutreachSource {
  id: string;
  name: string;
  uploadedAt: string;
  leads: number;
}

// One row in the persistent Sources panel. Carries everything we need
// to render the source through its full lifecycle in a single,
// consistent card layout:
//
//   processing  — upload simulation running. `progress` ticks from 0
//                 to 100 over wall-clock time, anchored to startedAt
//                 so reload / tab-switch don't reset.
//   queued      — processing complete. `validRows` + `invalidRows` are
//                 populated; the user can click Start calling to begin.
//   dialing     — actively being dialed.
//   paused      — user paused a dialing source.
//
// Persisted via localStorage so the queued / dialing decisions survive
// reload, log-out, and navigation away.
export interface OutreachAddedSource {
  id: string;
  name: string;
  // Total rows in the file (estimated at upload time from file size).
  leads: number;
  uploadedAt: string;
  dialState: "processing" | "queued" | "dialing" | "paused";
  // Processing — 0-100, advanced by tickProcessing on a wall-clock anchor.
  progress?: number;
  startedAt?: string;
  // Populated when processing completes. Drives the "X valid · Y invalid"
  // summary in the source row. Mocked from a deterministic id-hash so the
  // same file always shows the same split across renders.
  validRows?: number;
  invalidRows?: number;
  // Per-reason breakdown for the invalid count — mirrors the categories
  // the original AddLeadsModal surfaced (missing phone / invalid format
  // / duplicate / missing name). Lets the row explain *why* some rows
  // were skipped, not just that some were.
  invalidBreakdown?: {
    missingPhone: number;
    invalidFormat: number;
    duplicate: number;
    missingName: number;
  };
}

export interface OutreachDraftSeed {
  id: string;
  projectId: string;
  name: string;
  voiceAgent: string;
  createdAt: string;
  totalContacts?: number;
  // State machine for drafts:
  //   draft       — no audience yet
  //   uploading   — files in flight (any source is processing)
  //   ready       — at least one source has finished processing
  //   in_progress — actively dialing
  status?: "draft" | "uploading" | "ready" | "scheduled" | "in_progress" | "completed" | "paused";
  startMode?: "immediate" | "schedule";
  scheduledFor?: string;
  sources?: OutreachSource[];
}

type OutreachDraftStore = {
  drafts: Record<string, OutreachDraftSeed>;
  // Persistent sources for every outreach (drafts + static outreaches).
  // This is the single source of truth for the Sources panel rendering —
  // there is no separate "in-flight uploads" dict any more; processing
  // sources live here too with dialState="processing" + progress.
  addedSources: Record<string, OutreachAddedSource[]>;

  upsertDraft: (seed: OutreachDraftSeed) => void;
  patchDraft: (id: string, patch: Partial<OutreachDraftSeed>) => void;
  // Kick off a CSV upload — appends one processing source per file.
  startUpload: (
    outreachId: string,
    files: { id?: string; name: string; totalRows: number }[],
  ) => void;
  // Advances every processing source for this outreach. When a source
  // hits 100%, it flips to "queued" and validRows / invalidRows are
  // populated from a deterministic id-hash so the same file always
  // shows the same valid/invalid split.
  tickProcessing: (outreachId: string) => void;
  setSourceDialState: (
    outreachId: string,
    sourceId: string,
    state: OutreachAddedSource["dialState"],
  ) => void;
  removeAddedSource: (outreachId: string, sourceId: string) => void;
  // Instant source insertion — for manual lead entry (synchronous, no
  // upload simulation). Lands queued with validRows = total leads.
  addInstantSource: (
    outreachId: string,
    source: { name: string; leads: number },
  ) => void;
  removeDraft: (id: string) => void;
};

// Demo-grade processing speed: ~1,000 rows/sec. A 10k CSV completes
// in 10s, a 50k CSV in 50s.
const ROWS_PER_SECOND = 1000;

// Deterministic valid / invalid split based on the source id. Same
// file always reports the same split across renders. Range 92–97%
// valid — enough to feel realistic without making "invalid" feel
// like an edge case the user can ignore. The invalid count is then
// distributed across the four skip reasons using id-derived weights
// so the breakdown is stable per file and the four reasons don't all
// land at the same proportions for every CSV.
function computeValidSplit(id: string, totalRows: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  const hash = Math.abs(h);
  const validPct = 92 + (hash % 6); // 92..97
  const validRows = Math.floor(totalRows * (validPct / 100));
  const invalidRows = totalRows - validRows;

  // Pick four weights (1..10) deterministically from the hash and
  // normalize them. Apportion the invalid count, then put any
  // rounding remainder on the largest bucket so the four counts
  // always sum to invalidRows exactly.
  const weights = [
    1 + ((hash >>> 0) % 10),
    1 + ((hash >>> 4) % 10),
    1 + ((hash >>> 8) % 10),
    1 + ((hash >>> 12) % 10),
  ];
  const wSum = weights[0] + weights[1] + weights[2] + weights[3];
  let missingPhone   = Math.floor((invalidRows * weights[0]) / wSum);
  let invalidFormat  = Math.floor((invalidRows * weights[1]) / wSum);
  let duplicate      = Math.floor((invalidRows * weights[2]) / wSum);
  let missingName    = Math.floor((invalidRows * weights[3]) / wSum);
  const apportioned = missingPhone + invalidFormat + duplicate + missingName;
  const remainder = invalidRows - apportioned;
  if (remainder > 0) {
    const buckets: Array<[number, "missingPhone" | "invalidFormat" | "duplicate" | "missingName"]> = [
      [missingPhone, "missingPhone"],
      [invalidFormat, "invalidFormat"],
      [duplicate, "duplicate"],
      [missingName, "missingName"],
    ];
    buckets.sort((a, b) => b[0] - a[0]);
    const target = buckets[0][1];
    if (target === "missingPhone") missingPhone += remainder;
    else if (target === "invalidFormat") invalidFormat += remainder;
    else if (target === "duplicate") duplicate += remainder;
    else missingName += remainder;
  }

  return {
    validRows,
    invalidRows,
    invalidBreakdown: { missingPhone, invalidFormat, duplicate, missingName },
  };
}

export const useOutreachDraftStore = create<OutreachDraftStore>()(
  persist(
    (set) => ({
      drafts: {},
      addedSources: {},
      upsertDraft: (seed) =>
        set((s) => ({ drafts: { ...s.drafts, [seed.id]: seed } })),
      patchDraft: (id, patch) =>
        set((s) => {
          const current = s.drafts[id];
          if (!current) return s;
          return { drafts: { ...s.drafts, [id]: { ...current, ...patch } } };
        }),
      startUpload: (outreachId, files) =>
        set((s) => {
          const now = new Date().toISOString();
          const stamp = Date.now();
          const fresh: OutreachAddedSource[] = files.map((f, i) => ({
            id: f.id ?? `src-${stamp}-${i}`,
            name: f.name,
            leads: f.totalRows,
            uploadedAt: now,
            dialState: "processing",
            progress: 0,
            startedAt: now,
          }));
          const draft = s.drafts[outreachId];
          const nextDrafts = draft
            ? { ...s.drafts, [outreachId]: { ...draft, status: "uploading" as const } }
            : s.drafts;
          return {
            addedSources: {
              ...s.addedSources,
              [outreachId]: [...(s.addedSources[outreachId] ?? []), ...fresh],
            },
            drafts: nextDrafts,
          };
        }),
      tickProcessing: (outreachId) =>
        set((s) => {
          const list = s.addedSources[outreachId];
          if (!list || list.length === 0) return s;
          const now = Date.now();
          let didFlip = false;
          const next = list.map((src) => {
            if (src.dialState !== "processing" || !src.startedAt) return src;
            const elapsedSec = (now - new Date(src.startedAt).getTime()) / 1000;
            const parsedRows = Math.min(src.leads, Math.floor(elapsedSec * ROWS_PER_SECOND));
            const progress = src.leads > 0
              ? Math.min(100, Math.round((parsedRows / src.leads) * 100))
              : 100;
            if (progress >= 100) {
              didFlip = true;
              const { validRows, invalidRows, invalidBreakdown } = computeValidSplit(src.id, src.leads);
              return {
                ...src,
                dialState: "queued" as const,
                progress: 100,
                validRows,
                invalidRows,
                invalidBreakdown,
              };
            }
            return { ...src, progress: Math.max(src.progress ?? 0, progress) };
          });
          // If any source flipped processing → queued AND there's a
          // draft seed in "uploading", promote it to "ready" + roll up
          // totals so the legacy hydrate path still reads accurately.
          const draft = s.drafts[outreachId];
          let nextDrafts = s.drafts;
          if (didFlip && draft && draft.status === "uploading") {
            const noneProcessing = next.every((src) => src.dialState !== "processing");
            if (noneProcessing) {
              const sources: OutreachSource[] = next.map((src) => ({
                id: `legacy-${src.id}`,
                name: src.name,
                uploadedAt: src.uploadedAt,
                leads: src.leads,
              }));
              const totalContacts = next.reduce((sum, src) => sum + src.leads, 0);
              nextDrafts = {
                ...s.drafts,
                [outreachId]: { ...draft, status: "ready", totalContacts, sources },
              };
            }
          }
          return {
            addedSources: { ...s.addedSources, [outreachId]: next },
            drafts: nextDrafts,
          };
        }),
      setSourceDialState: (outreachId, sourceId, state) =>
        set((s) => {
          const list = s.addedSources[outreachId];
          if (!list) return s;
          const next = list.map((src) =>
            src.id === sourceId ? { ...src, dialState: state } : src,
          );
          return { addedSources: { ...s.addedSources, [outreachId]: next } };
        }),
      removeAddedSource: (outreachId, sourceId) =>
        set((s) => {
          const list = s.addedSources[outreachId];
          if (!list) return s;
          const next = list.filter((src) => src.id !== sourceId);
          return { addedSources: { ...s.addedSources, [outreachId]: next } };
        }),
      addInstantSource: (outreachId, source) =>
        set((s) => {
          const stamp = Date.now();
          const id = `src-manual-${stamp}`;
          const newSource: OutreachAddedSource = {
            id,
            name: source.name,
            uploadedAt: new Date().toISOString(),
            leads: source.leads,
            dialState: "queued",
            progress: 100,
            validRows: source.leads,
            invalidRows: 0,
          };
          return {
            addedSources: {
              ...s.addedSources,
              [outreachId]: [...(s.addedSources[outreachId] ?? []), newSource],
            },
          };
        }),
      removeDraft: (id) =>
        set((s) => {
          const nextDrafts = { ...s.drafts };
          delete nextDrafts[id];
          const nextAddedSources = { ...s.addedSources };
          delete nextAddedSources[id];
          return { drafts: nextDrafts, addedSources: nextAddedSources };
        }),
    }),
    {
      name: "revspot:outreach-draft-store",
      // Bumped so the next load clears stale demo state once. Older
      // sessions persisted addedSources from before this surface
      // existed; the user expects a clean detail page until they
      // actually upload, so wipe addedSources on migration. Drafts
      // are kept so any in-flight outreach the user was setting up
      // doesn't vanish.
      version: 2,
      migrate: (persistedState, fromVersion) => {
        const s = (persistedState ?? {}) as Partial<OutreachDraftStore>;
        if (fromVersion < 2) {
          return { ...s, addedSources: {} } as OutreachDraftStore;
        }
        return s as OutreachDraftStore;
      },
    },
  ),
);

/** Build a renderable OutreachDetail from a draft seed by overlaying it on
 *  a baseline outreach — keeps the detail page meaningful (real schedule,
 *  realistic empty funnel, sensible defaults) even before any audience is
 *  uploaded. */
export function hydrateDraftDetail(seed: OutreachDraftSeed): OutreachDetail | null {
  const baseline = outreachDetailForId("out-1");
  if (!baseline) return null;
  const totalContacts = seed.totalContacts ?? 0;
  type DetailStatus = OutreachDetail["status"];
  const renderedStatus: DetailStatus =
    seed.status === "uploading" || seed.status === "ready" || seed.status === "scheduled"
      ? "draft"
      : (seed.status ?? "draft");
  return {
    ...baseline,
    id: seed.id,
    name: seed.name,
    voiceAgent: seed.voiceAgent,
    status: renderedStatus,
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
