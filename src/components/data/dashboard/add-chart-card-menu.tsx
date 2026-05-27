"use client";

// Dashed "+ Add chart card" slot at the end of the grid. Click → popover
// listing remaining chart-card ids (those not currently in the user's list).

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { CHART_CARD_LABEL } from "@/lib/dashboard/dim-registry";
import type { ChartCardId } from "@/lib/dashboard/types";

const ALL_CARDS: ChartCardId[] = [
  "source",
  "company_tier",
  "seniority",
  "geography",
  "income_range",
  "industry",
  "potential_tier",
  "age_group",
  "employed",
  "iit_iim",
  "mba",
];

interface Props {
  active: ChartCardId[];
  onAdd: (cardId: ChartCardId) => void;
}

export function AddChartCardMenu({ active, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const remaining = ALL_CARDS.filter((c) => !active.includes(c));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (remaining.length === 0) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full h-full min-h-[120px] border border-dashed border-border rounded-card text-[12px] text-text-secondary hover:text-text-primary hover:border-text-primary/40 transition-colors flex flex-col items-center justify-center gap-1"
      >
        <Plus size={14} strokeWidth={1.75} />
        Add chart card
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-30 min-w-[200px] bg-white border border-border rounded-card shadow-[0_8px_24px_rgba(15,15,15,0.08)] py-1 max-h-[280px] overflow-y-auto">
          {remaining.map((c) => (
            <button
              key={c}
              onClick={() => {
                onAdd(c);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-[12.5px] text-text-primary hover:bg-surface-page"
            >
              {CHART_CARD_LABEL[c]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
