"use client";

// One card in the breakdown grid. Title + horizontal CSS bars.
// Read-only per design. Hover reveals an X to remove (only for non-default
// cards — caller passes `removable`).

import { X } from "lucide-react";
import { breakdownByCard } from "@/lib/dashboard/breakdown";
import { CHART_CARD_LABEL } from "@/lib/dashboard/dim-registry";
import type { ChartCardId, LeadProfile } from "@/lib/dashboard/types";

interface Props {
  cardId: ChartCardId;
  profiles: LeadProfile[];
  removable?: boolean;
  onRemove?: () => void;
}

export function BreakdownChartCard({ cardId, profiles, removable, onRemove }: Props) {
  const rows = breakdownByCard(profiles, cardId);
  const label = CHART_CARD_LABEL[cardId];

  return (
    <div className="group relative bg-white border border-border rounded-card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">
          {label}
        </div>
        {removable && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${label} card`}
            className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-primary transition-all -mr-1 p-1"
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-[12px] text-text-tertiary py-4">No data for this slice.</div>
      ) : (
        <div className="space-y-1.5">
          {rows.slice(0, 6).map((r) => (
            <div key={r.bucket} className="flex items-center gap-2 text-[11.5px]">
              <div className="w-[88px] flex-shrink-0 text-text-secondary truncate">{r.bucket}</div>
              <div className="flex-1 h-[6px] bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-text-primary rounded-full"
                  style={{ width: `${Math.max(2, r.pct)}%` }}
                />
              </div>
              <div className="w-[40px] text-right tabular-nums text-text-primary">{r.pct}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
