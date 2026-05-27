"use client";

// One chart card. Picks the visualization off the dim's chartKind:
//   - donut  → Pie + side legend (nominal / categorical splits)
//   - column → Vertical bar chart (ordinal / range-bucketed values)
//
// Two modes:
//   1. Preset — pass `cardId` (source/company_tier/seniority/...)
//   2. Custom build — pass `card` (CustomChartCard). Filters in `card.filters`
//      are AND-ed onto the incoming profiles before bucketing.

import { Pencil, X } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { breakdownByDim } from "@/lib/dashboard/breakdown";
import {
  CHART_CARD_LABEL,
  CHART_CARD_TO_DIM,
  DIM_REGISTRY,
} from "@/lib/dashboard/dim-registry";
import { evalFilters, clauseLabel } from "@/lib/dashboard/filter-eval";
import type {
  BreakdownRow,
  ChartCardId,
  CustomChartCard,
  FilterDim,
  LeadProfile,
} from "@/lib/dashboard/types";

interface PresetProps {
  mode: "preset";
  cardId: ChartCardId;
  profiles: LeadProfile[];
}

interface CustomProps {
  mode: "custom";
  card: CustomChartCard;
  profiles: LeadProfile[];
  onEdit?: () => void;
  onRemove?: () => void;
}

type Props = PresetProps | CustomProps;

// Medium-saturation palette — alive, not loud. Sits between the saturated
// brand blues and the washed-out pastel zone so charts feel active without
// shouting. Tuned to read distinct at 6+ buckets.
const PALETTE = [
  "#5B8FDB", // blue
  "#3FB8A2", // teal
  "#E0A848", // amber
  "#DE7878", // rose
  "#9985CC", // violet
  "#5DA9C9", // sky
  "#73B47F", // sage green
  "#D78A5C", // terracotta
];

function bucketColor(_bucket: string, idx: number): string {
  return PALETTE[idx % PALETTE.length];
}

export function BreakdownChartCard(props: Props) {
  const isCustom = props.mode === "custom";
  const dimId: FilterDim = isCustom ? props.card.dim : CHART_CARD_TO_DIM[props.cardId];
  const dim = DIM_REGISTRY[dimId];
  const label = isCustom ? props.card.name : CHART_CARD_LABEL[props.cardId];

  // Apply local filters for custom cards.
  const scoped = isCustom
    ? props.profiles.filter((p) => evalFilters(p, props.card.filters))
    : props.profiles;

  const rows = breakdownByDim(scoped, dimId);
  const total = scoped.length;
  const chartKind = dim.chartKind ?? "column";

  return (
    <div className="group relative bg-white border border-border rounded-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary truncate">
            {isCustom ? `Slice by ${dim.label}` : label}
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <div className="text-[18px] font-semibold text-text-primary tabular-nums tracking-tight truncate">
              {isCustom ? label : total.toLocaleString("en-IN")}
            </div>
            {isCustom ? (
              <span className="text-[11px] text-text-tertiary tabular-nums whitespace-nowrap">
                {total.toLocaleString("en-IN")} leads
              </span>
            ) : (
              <span className="text-[11px] text-text-tertiary">leads</span>
            )}
          </div>
        </div>

        {isCustom && (props.onEdit || props.onRemove) && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {props.onEdit && (
              <button
                onClick={props.onEdit}
                aria-label={`Edit ${label}`}
                className="p-1 text-text-tertiary hover:text-text-primary"
              >
                <Pencil size={12} strokeWidth={1.75} />
              </button>
            )}
            {props.onRemove && (
              <button
                onClick={props.onRemove}
                aria-label={`Remove ${label}`}
                className="p-1 text-text-tertiary hover:text-text-primary"
              >
                <X size={12} strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter chips (custom cards only) */}
      {isCustom && props.card.filters.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {props.card.filters.map((c, i) => (
            <span
              key={`${c.dim}-${i}`}
              className="inline-flex items-center h-5 px-1.5 text-[10px] font-medium text-text-secondary bg-surface-secondary rounded-[4px]"
            >
              {clauseLabel(c)}
            </span>
          ))}
        </div>
      )}

      {/* Body */}
      {rows.length === 0 ? (
        <div className="text-[12px] text-text-tertiary py-6 text-center">No data.</div>
      ) : chartKind === "donut" ? (
        <DonutVis rows={rows} total={total} />
      ) : (
        <ColumnVis rows={rows} />
      )}
    </div>
  );
}

// ── Donut ───────────────────────────────────────────────────────────────

function DonutVis({ rows, total }: { rows: BreakdownRow[]; total: number }) {
  const data = rows.map((r, i) => ({
    name: r.bucket,
    value: r.count,
    color: bucketColor(r.bucket, i),
  }));

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
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
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

      <div className="flex-1 min-w-0 space-y-0.5 max-h-[140px] overflow-y-auto pr-1">
        {rows.map((r, i) => (
          <div
            key={r.bucket}
            className="flex items-center gap-2 text-[11.5px] py-0.5"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: bucketColor(r.bucket, i) }}
            />
            <span className="text-text-primary truncate">{r.bucket}</span>
            <span className="text-text-tertiary tabular-nums ml-auto whitespace-nowrap">
              {r.pct}% · {r.count.toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Column ──────────────────────────────────────────────────────────────

function ColumnVis({ rows }: { rows: BreakdownRow[] }) {
  const data = rows.map((r, i) => ({
    bucket: r.bucket,
    count: r.count,
    pct: r.pct,
    color: bucketColor(r.bucket, i),
  }));

  return (
    <div>
      <div className="h-[140px] -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 10, fill: "#525252" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                fontSize: "11px",
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #E5E5E5",
              }}
              formatter={(v) => [Number(v).toLocaleString("en-IN"), "Leads"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.bucket} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {rows.map((r, i) => (
          <div key={r.bucket} className="flex items-center gap-1.5 text-[10.5px]">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: bucketColor(r.bucket, i) }}
            />
            <span className="text-text-secondary">{r.bucket}</span>
            <span className="text-text-tertiary tabular-nums">
              {r.count.toLocaleString("en-IN")} · {r.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
