"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronRight, Folder, ArrowUpRight } from "lucide-react";
import {
  projectsList as newProjectsList,
  projectDetails,
  projectRollup,
} from "@/lib/project-data";
import { CreateProjectFlow } from "@/components/project/create-project-flow";
import { SpotMark } from "@/components/spot/spot-mark";
import { useSpotStore } from "@/lib/spot/store";

function fmtRate(v: number | null) {
  if (v === null) return "—";
  return `${v.toFixed(1)}%`;
}

function HealthPill({ health }: { health: "on-track" | "needs-attention" | "underperforming" }) {
  const map = {
    "on-track": { label: "On track", cls: "pill-ok" },
    "needs-attention": { label: "Attention", cls: "pill-warn" },
    underperforming: { label: "Low", cls: "pill-err" },
  } as const;
  const c = map[health];
  return <span className={`pill ${c.cls}`}>{c.label}</span>;
}

function GoalProgress({
  goal,
}: {
  goal: ReturnType<typeof projectRollup> extends infer R ? R extends { goal: infer G } ? G : never : never;
}) {
  if (!goal) return <span className="text-[11px] text-text-tertiary">no goal</span>;
  const pct = Math.min(100, Math.round((goal.achieved / goal.target) * 100));
  const expectedPct = Math.round((goal.daysElapsed / goal.daysTotal) * 100);
  const paceCls =
    goal.pace === "ahead"
      ? "pill-ok"
      : goal.pace === "on-pace"
      ? "pill-info"
      : "pill-err";
  return (
    <div>
      <div className="flex items-baseline gap-1 text-[11px] mb-1">
        <span className="tabular-nums font-semibold text-text-primary">{goal.achieved}</span>
        <span className="text-text-tertiary">/ {goal.target}</span>
        <span className={`pill ${paceCls} ml-auto`} style={{ fontSize: 9.5, padding: "1px 6px", letterSpacing: 0.3, fontWeight: 700, textTransform: "uppercase" }}>
          {goal.paceDelta}
        </span>
      </div>
      <div className="relative h-[5px] rounded-full bg-surface-secondary overflow-hidden">
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${expectedPct}%`,
            background:
              "repeating-linear-gradient(45deg, transparent 0 3px, rgba(0,0,0,0.06) 3px 6px)",
          }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: "#0A0A0A" }}
        />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const askSpot = useSpotStore((s) => s.askSpot);

  const rows = newProjectsList.map((p) => {
    const rollup = projectRollup(p.id)!;
    const d = projectDetails[p.id];
    return { p, d, rollup };
  });

  const totalSpend = rows.reduce((s, r) => {
    // values are like "₹14.6L" — strip and sum in lakhs
    const v = String(r.rollup.spend).replace(/[₹,L\s]/g, "");
    return s + (parseFloat(v) || 0);
  }, 0);
  const totalLeads = rows.reduce((s, r) => s + r.rollup.totalLeads, 0);
  const totalVerified = rows.reduce((s, r) => s + r.rollup.verifiedLeads, 0);
  const totalQualified = rows.reduce((s, r) => s + r.rollup.qualifiedLeads, 0);
  const totalVerifRate = totalLeads ? (totalVerified / totalLeads) * 100 : null;
  const totalQualRate = totalLeads ? (totalQualified / totalLeads) * 100 : null;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[12px] text-text-secondary mb-1">Lead Generation</div>
          <h1 className="text-[26px] font-semibold tracking-[-0.01em]">Projects</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              askSpot("Audit every project — which is on pace and which needs attention?", {
                kind: "workspace",
                label: "Workspace",
              })
            }
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-button border border-border bg-white hover:border-border-hover hover:bg-surface-page text-[12.5px] font-medium transition-colors"
          >
            <SpotMark size={13} />
            Ask Spot about portfolio
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-button bg-accent text-white hover:bg-accent-hover text-[12.5px] font-medium transition-colors"
          >
            <Plus size={13} />
            New project
          </button>
        </div>
      </div>

      {/* Portfolio table — compact column widths so it fits at common
          laptop viewports (~700px content area) even when the Spot panel
          is open. Wrapped in a horizontal-scroll fallback for narrower
          cases. */}
      {(() => {
        const COLS =
          "minmax(180px, 2.2fr) 70px 60px 70px 60px minmax(140px, 1.4fr) 90px 20px";
        return (
          <div className="card-base overflow-x-auto">
            <div style={{ minWidth: 690 }}>
              {/* Table header */}
              <div
                className="grid items-center px-4 py-2.5 border-b border-border bg-surface-page text-[10px] uppercase tracking-[0.04em] font-semibold text-text-tertiary"
                style={{ gridTemplateColumns: COLS }}
              >
                <span>Project</span>
                <span className="text-right">Spend</span>
                <span className="text-right">Leads</span>
                <span className="text-right">Verif</span>
                <span className="text-right">QL</span>
                <span>Goal progress</span>
                <span className="text-right">Health</span>
                <span />
              </div>

              {rows.map(({ p, d, rollup }, i) => {
                const last = i === rows.length - 1;
                return (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className={`hover-row text-left w-full grid items-center px-4 py-3.5 ${
                      last ? "" : "border-b border-border-subtle"
                    }`}
                    style={{ gridTemplateColumns: COLS }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex-shrink-0 flex items-center justify-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 7,
                          background: `linear-gradient(135deg, oklch(0.92 0.04 ${(p.id.length * 47) % 360}) 0%, oklch(0.78 0.06 ${
                            (p.id.length * 47 + 40) % 360
                          }) 100%)`,
                          color: "rgba(0,0,0,0.5)",
                        }}
                      >
                        <Folder size={13} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold truncate leading-tight">
                          {p.name.split(" · ")[0]}
                        </div>
                        <div className="text-[10.5px] text-text-tertiary truncate">
                          {p.category}
                          {d?.micromarket ? ` · ${d.micromarket.split(" · ")[0]}` : ""}
                        </div>
                      </div>
                    </div>
                    <span className="tabular-nums text-right text-[12.5px] font-medium">
                      {rollup.spend}
                    </span>
                    <span className="tabular-nums text-right text-[12.5px]">
                      {rollup.totalLeads.toLocaleString()}
                    </span>
                    <span className="tabular-nums text-right text-[12.5px]">
                      {fmtRate(rollup.verifRate)}
                    </span>
                    <span className="tabular-nums text-right text-[12.5px]">
                      {fmtRate(rollup.qualRate)}
                    </span>
                    <GoalProgress goal={rollup.goal} />
                    <div className="flex justify-end">
                      <HealthPill health={p.health} />
                    </div>
                    <ChevronRight size={14} className="text-text-tertiary" />
                  </button>
                );
              })}

              {/* Footer totals */}
              <div
                className="grid items-center px-4 py-2.5 border-t border-border bg-surface-page text-[12px] font-medium"
                style={{ gridTemplateColumns: COLS }}
              >
                <span>Portfolio total</span>
                <span className="tabular-nums text-right">₹{totalSpend.toFixed(1)}L</span>
                <span className="tabular-nums text-right">{totalLeads.toLocaleString()}</span>
                <span className="tabular-nums text-right">
                  {totalVerifRate ? `${totalVerifRate.toFixed(1)}%` : "—"}
                </span>
                <span className="tabular-nums text-right">
                  {totalQualRate ? `${totalQualRate.toFixed(1)}%` : "—"}
                </span>
                <span className="text-[11px] text-text-tertiary font-normal">
                  across {rows.length} projects
                </span>
                <span />
                <span />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Spot ambient strip (workspace) */}
      <div className="spot-reply mt-6 p-4 flex items-start gap-3">
        <SpotMark size={20} />
        <div className="flex-1">
          <div className="uplabel mb-1">Spot · portfolio read</div>
          <div className="text-[13.5px] leading-[1.5] text-text-primary">
            <strong>Aristocrat</strong> is 21% behind pace; <strong>Splendour</strong> is 56%
            behind and the audience can't afford the price band. I can model a budget
            reallocation toward Aristocrat — but Splendour may need a re-positioning, not
            more spend.
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {[
              "Why is Aristocrat behind pace?",
              "Should I pause Splendour?",
              "Model a reallocation",
              "Compare all projects on CPVL",
            ].map((q) => (
              <button
                key={q}
                onClick={() =>
                  askSpot(q, {
                    kind: "workspace",
                    label: "Workspace",
                  })
                }
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-button border border-border bg-white text-[11.5px] hover:border-border-hover hover:bg-surface-page"
              >
                <ArrowUpRight size={11} /> {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {createOpen && (
        <CreateProjectFlow
          onClose={() => setCreateOpen(false)}
          onComplete={(id) => {
            setCreateOpen(false);
            router.push(`/projects/${id}`);
          }}
        />
      )}
    </motion.div>
  );
}
