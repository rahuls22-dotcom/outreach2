"use client";

// LiveExecution — the calm, single-focus live progress view that fills the
// right canvas when a diagnostic plan goes live (the *-live step). It reads
// the ticking execution state off the store (DiagnosticWorkflow.executionMoves
// + executionDone, driven by startLiveExecution) and renders the plan's
// concrete moves ticking pending → running → done, under one quiet header and
// one slim progress bar, settling into a composed "Done" state.
//
// Design intent: editorial calm over dashboard density. ONE accent (the warm
// gold), generous whitespace, no stacked "what changed / recommendations /
// guardrails" cards, no competing progress read-outs. Light mode only. The
// done check uses the brand tint, never the reserved dark action fill
// (#1A1A1A) which belongs to user-action buttons.
//
// API ({ workflow }) and store reliance are fixed by the canvas contract —
// do not change them. The checklist primitive in execution-checklist.tsx is a
// separate timer-driven, dark-themed component used by the launch-deploy flow
// (consumed by workflow-pane); this store-driven view stays self-contained so
// it can settle exactly when the store says executionDone, not on a timer.

import { Check } from "lucide-react";
import { useSpotStore } from "@/lib/spot/store";
import type { DiagnosticWorkflow, ExecutionMove } from "@/lib/spot/workflow";

// The single accent — a restrained warm gold. The brand --spot-tint/-stroke
// are too pale to read as an accent on their own, so the gold carries every
// "live / running / progress" cue. Done switches to the calm green --ok tokens.
const ACCENT = "#C9A227";
const ACCENT_INK = "#8A6D1F";

export function LiveExecution({ workflow }: { workflow: DiagnosticWorkflow }) {
  // Subscribe to the live execution slice so the panel re-renders as the
  // store ticks moves off. Falling back to the passed workflow keeps the
  // first paint correct before the subscription resolves.
  const moves =
    useSpotStore((s) =>
      s.workflow && s.workflow.kind === workflow.kind
        ? (s.workflow as DiagnosticWorkflow).executionMoves
        : undefined,
    ) ??
    workflow.executionMoves ??
    [];
  const allDone =
    useSpotStore((s) =>
      s.workflow && s.workflow.kind === workflow.kind
        ? Boolean((s.workflow as DiagnosticWorkflow).executionDone)
        : false,
    ) || Boolean(workflow.executionDone);

  const total = moves.length;
  const doneCount = moves.filter((m) => m.status === "done").length;
  const pct = total ? (doneCount / total) * 100 : 0;

  return (
    <div className="px-7 py-9 max-w-[560px] mx-auto">
      {/* Scoped motion — a gentle pulse for the live dot and a breathing ring
          for the running row. Calm, slow, no spinner whir. Local to this file
          so the component stays self-contained. */}
      <style>{`
        @keyframes execDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.45; transform: scale(0.78); }
        }
        @keyframes execRingPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.86); }
        }
        .exec-live-dot {
          width: 6px; height: 6px; border-radius: 9999px;
          animation: execDotPulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .exec-run-ring {
          width: 13px; height: 13px; border-radius: 9999px;
          border: 1.5px solid; box-sizing: border-box;
          animation: execRingPulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .exec-live-dot, .exec-run-ring { animation: none; }
        }
      `}</style>

      {/* Header — one quiet line: what's running + a single live/done status. */}
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h1 className="text-[17px] font-semibold tracking-tight text-text-primary">
          {allDone ? "Plan executed" : "Executing the plan"}
        </h1>
        <StatusPill allDone={allDone} />
      </div>
      <p className="text-[12.5px] leading-relaxed text-text-tertiary max-w-[44ch]">
        {allDone
          ? "Every move is live. My analyst watches from here and surfaces the next decision the moment a watcher fires."
          : "Each move ticks off as I make it. Watch it work, or step away."}
      </p>

      {/* One progress affordance — a slim bar carries the motion. No competing
          N-of-M readout; the pill gives the live/done state, the bar the pace. */}
      <div
        className="mt-7 h-[3px] rounded-full overflow-hidden"
        style={{ background: "var(--spot-tint)", boxShadow: "inset 0 0 0 1px var(--spot-stroke)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            background: allDone ? "var(--ok-fg)" : ACCENT,
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>

      {/* Checklist — the moves ticking off. */}
      <ul className="mt-7 space-y-3.5">
        {moves.map((move, i) => (
          <MoveRow key={i} move={move} />
        ))}
      </ul>

      {/* One understated reassurance line — not a card. */}
      <p className="mt-9 pt-5 text-[11.5px] leading-relaxed text-text-tertiary border-t border-border-subtle">
        {allDone
          ? "Nothing more for you to do here. I'll bring the next decision to chat."
          : "I'll pause and ping you in chat if a guardrail trips. Otherwise this runs on its own."}
      </p>
    </div>
  );
}

/** The single live/done status — count while running, settled green when done. */
function StatusPill({ allDone }: { allDone: boolean }) {
  if (allDone) {
    return (
      <span
        className="inline-flex items-center gap-1.5 h-[22px] pl-1.5 pr-2.5 rounded-full text-[11px] font-medium flex-shrink-0"
        style={{ background: "var(--ok-bg)", color: "var(--ok-fg)" }}
      >
        <Check size={12} strokeWidth={2.6} />
        Done
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-[11px] font-medium flex-shrink-0"
      style={{ background: "var(--spot-tint)", color: ACCENT_INK, boxShadow: "inset 0 0 0 1px var(--spot-stroke)" }}
    >
      <span className="exec-live-dot" style={{ background: ACCENT }} />
      Live
    </span>
  );
}

function MoveRow({ move }: { move: ExecutionMove }) {
  const isDone = move.status === "done";
  const isRunning = move.status === "running";
  return (
    <li className="flex items-start gap-3 text-[13.5px] leading-snug">
      <span className="mt-[1px] w-[15px] h-[15px] flex items-center justify-center flex-shrink-0">
        {isDone ? (
          <span
            className="inline-flex items-center justify-center w-[15px] h-[15px] rounded-full"
            style={{ background: "var(--spot-tint)", boxShadow: "inset 0 0 0 1px var(--spot-stroke)" }}
          >
            <Check size={10} strokeWidth={2.8} style={{ color: ACCENT_INK }} />
          </span>
        ) : isRunning ? (
          // Subtle pulsing ring — alive without the dashboard-spinner whir.
          <span className="exec-run-ring" style={{ borderColor: ACCENT }} />
        ) : (
          <span
            className="w-[11px] h-[11px] rounded-full"
            style={{ boxShadow: "inset 0 0 0 1.5px var(--spot-stroke)" }}
          />
        )}
      </span>
      <span
        className="flex-1 transition-colors duration-500"
        style={{
          color: isDone ? "var(--text-3)" : isRunning ? "var(--text-1)" : "var(--text-2)",
          fontWeight: isRunning ? 500 : 400,
          textDecoration: isDone ? "line-through" : "none",
          textDecorationColor: "var(--spot-stroke)",
        }}
      >
        {move.label}
      </span>
    </li>
  );
}
