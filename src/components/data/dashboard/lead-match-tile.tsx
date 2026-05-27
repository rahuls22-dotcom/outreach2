"use client";

// Big match count + Build audience action. Navigates to /audiences without
// filter query-params per spec (out of scope for v1).

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  matching: number;
  total: number;
}

export function LeadMatchTile({ matching, total }: Props) {
  const router = useRouter();
  const pct = total === 0 ? 0 : Math.round((matching / total) * 1000) / 10;

  return (
    <div className="bg-white border border-border rounded-card px-5 py-4 flex items-center justify-between">
      <div>
        <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">
          Matching enriched leads
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <div className="text-[26px] font-semibold text-text-primary tabular-nums tracking-tight">
            {matching.toLocaleString("en-IN")}
          </div>
          <div className="text-[12px] text-text-secondary">
            of {total.toLocaleString("en-IN")} · {pct}%
          </div>
        </div>
      </div>

      <button
        disabled={matching === 0}
        onClick={() => router.push("/audiences?source=enrichment")}
        className="inline-flex items-center gap-1.5 h-9 px-4 bg-text-primary text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Build audience
        <ArrowRight size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}
