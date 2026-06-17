"use client";

// LiveExecution — the cowork-style live progress checklist that fills the
// right canvas when a diagnostic plan goes live (the *-live step). It reads
// the ticking execution state off the store (DiagnosticWorkflow.executionMoves
// + executionDone, driven by startLiveExecution) and renders the plan's
// concrete moves ticking off pending → running → done, with a thin progress
// bar at the top and a settled "Done" state when everything completes.
//
// Light mode, impeccable: tinted neutrals + the brand --spot-* tokens, no
// dark surface, no gear-icon clutter. The done check uses the brand tint, not
// the reserved dark action fill (#1A1A1A) which belongs to user actions only.

import { Check, Loader2 } from "lucide-react";
import { useSpotStore } from "@/lib/spot/store";
import type { DiagnosticWorkflow, ExecutionMove } from "@/lib/spot/workflow";

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

  const doneCount = moves.filter((m) => m.status === "done").length;
  const pct = moves.length ? (doneCount / moves.length) * 100 : 0;

  return (
    <div className="px-6 py-7 max-w-[640px] mx-auto">
      {/* Header · running affordance vs. settled done state */}
      <div className="flex items-center gap-2.5 mb-1.5">
        <StatusDot allDone={allDone} />
        <h1 className="text-[16px] font-semibold tracking-tight text-text-primary">
          {allDone ? "Plan executed" : "Executing the plan"}
        </h1>
        <span
          className="inline-flex items-center h-[18px] px-2 rounded-full text-[10px] font-semibold uppercase tracking-wide flex-shrink-0"
          style={
            allDone
              ? { background: "var(--ok-bg)", color: "var(--ok-fg)" }
              : { background: "var(--spot-tint)", color: "#8A6D1F", border: "1px solid var(--spot-stroke)" }
          }
        >
          {allDone ? "Done" : "Live"}
        </span>
      </div>
      <p className="text-[12px] text-text-tertiary mb-5 ml-[26px]">
        {allDone
          ? "Every move is live. My analyst is watching from here, I'll surface the next decision the moment a watcher fires."
          : "Each move ticks off as I make it, you can watch it work or step away."}
      </p>

      {/* Progress bar */}
      <div className="ml-[26px] mb-5 flex items-center gap-2.5">
        <div
          className="flex-1 h-1 rounded-full overflow-hidden"
          style={{ background: "var(--spot-tint)", border: "1px solid var(--spot-stroke)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: allDone ? "var(--ok-fg)" : "#C9A227",
            }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-text-tertiary flex-shrink-0">
          {doneCount} / {moves.length}
        </span>
      </div>

      {/* Checklist */}
      <ul className="ml-[26px] space-y-2.5">
        {moves.map((move, i) => (
          <MoveRow key={i} move={move} />
        ))}
      </ul>
    </div>
  );
}

function StatusDot({ allDone }: { allDone: boolean }) {
  if (allDone) {
    return (
      <span
        className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full flex-shrink-0"
        style={{ background: "var(--ok-bg)" }}
      >
        <Check size={12} strokeWidth={2.4} style={{ color: "var(--ok-fg)" }} />
      </span>
    );
  }
  return (
    <Loader2
      size={16}
      strokeWidth={2}
      className="animate-spin flex-shrink-0"
      style={{ color: "#C9A227", animationDuration: "1.4s" }}
    />
  );
}

function MoveRow({ move }: { move: ExecutionMove }) {
  const isDone = move.status === "done";
  const isRunning = move.status === "running";
  return (
    <li className="flex items-start gap-2.5 text-[13px] leading-snug">
      <span className="mt-[1px] w-[16px] h-[16px] flex items-center justify-center flex-shrink-0">
        {isDone ? (
          <span
            className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full"
            style={{ background: "var(--spot-tint)", border: "1px solid var(--spot-stroke)" }}
          >
            <Check size={11} strokeWidth={2.6} style={{ color: "#8A6D1F" }} />
          </span>
        ) : isRunning ? (
          <Loader2
            size={13}
            strokeWidth={2}
            className="animate-spin"
            style={{ color: "#C9A227", animationDuration: "1.1s" }}
          />
        ) : (
          <span
            className="w-[12px] h-[12px] rounded-full"
            style={{ border: "1.5px solid var(--spot-stroke)" }}
          />
        )}
      </span>
      <span
        className="flex-1 transition-colors"
        style={{
          color: isDone
            ? "var(--text-3)"
            : isRunning
              ? "var(--text-1)"
              : "var(--text-2)",
          textDecoration: isDone ? "line-through" : "none",
          textDecorationColor: "var(--spot-stroke)",
        }}
      >
        {move.label}
      </span>
      {isRunning && (
        <span
          className="text-[9.5px] uppercase tracking-wider font-semibold flex-shrink-0 mt-[2px]"
          style={{ color: "#8A6D1F" }}
        >
          running
        </span>
      )}
    </li>
  );
}
