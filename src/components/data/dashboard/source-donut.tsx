"use client";

// Donut + side legend for the source split (CRM / Bulk / Single).

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { LeadProfile } from "@/lib/dashboard/types";

interface Props {
  profiles: LeadProfile[];
}

const SOURCE_META = {
  crm: { label: "CRM", color: "#1D4ED8" },
  bulk: { label: "Bulk", color: "#9A3412" },
  single: { label: "Single", color: "#6D28D9" },
} as const;

const ORDER: (keyof typeof SOURCE_META)[] = ["crm", "bulk", "single"];

export function SourceDonut({ profiles }: Props) {
  const counts: Record<keyof typeof SOURCE_META, number> = { crm: 0, bulk: 0, single: 0 };
  for (const p of profiles) counts[p.source]++;
  const total = profiles.length;

  const data = ORDER.map((k) => ({
    name: SOURCE_META[k].label,
    value: counts[k],
    color: SOURCE_META[k].color,
    key: k,
  })).filter((d) => d.value > 0);

  if (total === 0 || data.length === 0) {
    return (
      <div className="h-[140px] flex items-center justify-center text-[12px] text-text-tertiary">
        No data.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[120px] h-[120px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={36}
              outerRadius={56}
              paddingAngle={1}
              stroke="white"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[16px] font-semibold text-text-primary tabular-nums">
            {formatCompact(total)}
          </div>
          <div className="text-[10px] text-text-tertiary uppercase tracking-[0.4px]">total</div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {ORDER.map((k) => {
          const meta = SOURCE_META[k];
          const c = counts[k];
          const pct = total === 0 ? 0 : Math.round((c / total) * 100);
          return (
            <div key={k} className="flex items-center gap-2 text-[12px] py-0.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="text-text-primary">{meta.label}</span>
              <span className="text-text-tertiary tabular-nums ml-auto">
                {pct}% · {c.toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
