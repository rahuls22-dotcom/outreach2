"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { ChevronDown, X, Plus } from "lucide-react";
import { metricsMeta, campaignDetail } from "@/lib/campaign-data";
import type { MetricMeta } from "@/lib/campaign-data";

// ── Trend Data ──────────────────────────────────────────────

function makeTrend(startVal: number, endVal: number) {
  return Array.from({ length: 14 }, (_, i) => {
    const progress = i / 13;
    return Math.round((startVal + (endVal - startVal) * progress + (Math.random() * startVal * 0.06 - startVal * 0.03)) * 10) / 10;
  });
}

const dates = Array.from({ length: 14 }, (_, i) => `Mar ${10 + i}`);

const trendValues: Record<string, number[]> = {
  spend: makeTrend(6500, 8200), leads: makeTrend(4, 8), qualified: makeTrend(0.5, 1.2),
  cpl: makeTrend(1400, 1100), ctr: makeTrend(1.6, 2.1), cvr: makeTrend(3.8, 4.8),
  verificationRate: makeTrend(18, 22.6), aiQualRate: makeTrend(15, 18.3), sqlRate: makeTrend(9, 11.8),
  cpm: makeTrend(230, 245), cpc: makeTrend(62, 57), cpvl: makeTrend(4800, 5238),
  cpql: makeTrend(9200, 10000), frequency: makeTrend(2.0, 2.4), budgetPacing: makeTrend(92, 97.5),
};

// Build chart data: array of { date, [metricKey]: value, ... }
function buildChartData(selectedKeys: string[]) {
  return dates.map((date, i) => {
    const point: Record<string, string | number> = { date };
    selectedKeys.forEach((key) => { if (trendValues[key]) point[key] = trendValues[key][i]; });
    return point;
  });
}

// Line colors (cycle through)
const LINE_COLORS = ["#1A1A1A", "#3B82F6", "#22C55E"];

const MAX_METRICS = 3;

interface MetricExplorerProps {
  selectedMetrics: string[];
  onToggleMetric: (key: string) => void;
}

export function MetricExplorer({ selectedMetrics, onToggleMetric }: MetricExplorerProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const explorerMetrics = metricsMeta.filter((m) => m.category !== "headline");
  const categories = ["funnel", "cost", "health"] as const;
  const categoryLabels = { funnel: "Funnel", cost: "Cost", health: "Health" };

  const selectedMetas = selectedMetrics.map((k) => metricsMeta.find((m) => m.key === k)).filter(Boolean) as MetricMeta[];
  const chartData = buildChartData(selectedMetrics);

  // Determine Y-axis types
  const hasCurrency = selectedMetas.some((m) => m.unit === "currency");
  const hasNonCurrency = selectedMetas.some((m) => m.unit !== "currency");
  const needsDualAxis = hasCurrency && hasNonCurrency;

  return (
    <div className="space-y-3">
      {/* Header row: label + dropdown + selected pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px]">Metric Explorer</span>

        {/* Dropdown trigger */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-text-secondary border border-border rounded-button bg-white hover:bg-surface-page transition-colors duration-150"
          >
            <Plus size={13} strokeWidth={1.5} />
            Add metric
            <ChevronDown size={12} strokeWidth={1.5} className={`transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-40 mt-1 left-0 bg-white border border-border rounded-card shadow-lg py-1 min-w-[220px] max-h-[320px] overflow-y-auto"
              >
                {categories.map((cat) => {
                  const items = explorerMetrics.filter((m) => m.category === cat);
                  return (
                    <div key={cat}>
                      <div className="px-3 py-1.5 text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                        {categoryLabels[cat]}
                      </div>
                      {items.map((m) => {
                        const isSelected = selectedMetrics.includes(m.key);
                        const isDisabled = !isSelected && selectedMetrics.length >= MAX_METRICS;
                        return (
                          <button
                            key={m.key}
                            onClick={() => { onToggleMetric(m.key); }}
                            disabled={isDisabled}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left text-[12px] transition-colors ${
                              isSelected ? "bg-surface-page" : isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-surface-page"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-sm border ${isSelected ? "bg-accent border-accent" : "border-border"} flex items-center justify-center`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                              </div>
                              <span className="text-text-primary font-medium">{m.label}</span>
                            </div>
                            <span className="text-text-tertiary tabular-nums">{m.currentValue}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected pills */}
        {selectedMetas.map((m, i) => (
          <span key={m.key} className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium bg-surface-secondary rounded-badge text-text-primary">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
            {m.label}
            <button onClick={() => onToggleMetric(m.key)} className="text-text-tertiary hover:text-text-primary transition-colors">
              <X size={11} strokeWidth={2} />
            </button>
          </span>
        ))}

        {selectedMetrics.length > 0 && (
          <span className="text-[11px] text-text-tertiary">{selectedMetrics.length}/{MAX_METRICS}</span>
        )}
      </div>

      {/* Chart */}
      {selectedMetrics.length > 0 ? (
        <div className="bg-white border border-border rounded-card p-5">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9B9B9B" }} axisLine={{ stroke: "#E5E5E5" }} tickLine={false} interval={2} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "#9B9B9B" }}
                  axisLine={{ stroke: "#E5E5E5" }}
                  tickLine={false}
                  tickFormatter={(v: number) => {
                    const firstMeta = selectedMetas[0];
                    if (firstMeta?.unit === "currency") return v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`;
                    if (firstMeta?.unit === "percentage") return `${v}%`;
                    return `${v}`;
                  }}
                />
                {needsDualAxis && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "#9B9B9B" }}
                    axisLine={{ stroke: "#E5E5E5" }}
                    tickLine={false}
                    tickFormatter={(v: number) => {
                      const rightMeta = selectedMetas.find((m) => m.unit !== selectedMetas[0]?.unit);
                      if (rightMeta?.unit === "currency") return v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`;
                      if (rightMeta?.unit === "percentage") return `${v}%`;
                      return `${v}`;
                    }}
                  />
                )}
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: "6px", fontSize: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  formatter={(value, name) => {
                    const meta = metricsMeta.find((m) => m.key === name);
                    if (meta?.unit === "currency") return [`₹${Number(value).toLocaleString("en-IN")}`, meta.label];
                    if (meta?.unit === "percentage") return [`${value}%`, meta.label];
                    return [value, meta?.label || String(name)];
                  }}
                />
                {selectedMetrics.includes("cpl") && (
                  <ReferenceLine yAxisId="left" y={campaignDetail.targetCPL} stroke="#9B9B9B" strokeDasharray="6 4"
                    label={{ value: `Target ₹${campaignDetail.targetCPL}`, position: "insideTopRight", fill: "#9B9B9B", fontSize: 10 }} />
                )}
                {selectedMetas.map((m, i) => {
                  const isFirstUnit = m.unit === selectedMetas[0]?.unit;
                  return (
                    <Line key={m.key} type="monotone" dataKey={m.key}
                      yAxisId={needsDualAxis && !isFirstUnit ? "right" : "left"}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2}
                      dot={{ r: 2.5, fill: LINE_COLORS[i % LINE_COLORS.length], strokeWidth: 0 }}
                      activeDot={{ r: 4.5, fill: LINE_COLORS[i % LINE_COLORS.length], strokeWidth: 0 }} />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-surface-page border border-border rounded-card px-5 py-10 text-center">
          <p className="text-[13px] text-text-tertiary">Select metrics above to visualize trends</p>
        </div>
      )}
    </div>
  );
}
