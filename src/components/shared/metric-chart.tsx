"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { X, Plus, ChevronDown } from "lucide-react";

const LINE_COLORS = ["#1A1A1A", "#3B82F6", "#22C55E"];

export interface MetricChartDef {
  key: string;
  label: string;
  unit: "currency" | "percentage" | "number";
  data: number[];
}

export interface MetricOption {
  key: string;
  label: string;
  category?: string;
  currentValue?: string;
}

interface MetricChartProps {
  metrics: MetricChartDef[];
  dates: string[];
  onRemove: (key: string) => void;
  onAdd?: (key: string) => void;
  /** All available metrics for the "Add metric" dropdown */
  availableMetrics?: MetricOption[];
  /** Currently selected metric keys (for disabling in dropdown) */
  selectedKeys?: string[];
  maxMetrics?: number;
}

export function MetricChart({ metrics, dates, onRemove, onAdd, availableMetrics, selectedKeys = [], maxMetrics = 3 }: MetricChartProps) {
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

  if (metrics.length === 0) return null;

  const chartData = dates.map((date, i) => {
    const point: Record<string, string | number> = { date };
    metrics.forEach((m) => { point[m.key] = m.data[i] ?? 0; });
    return point;
  });

  const hasCurrency = metrics.some((m) => m.unit === "currency");
  const hasNonCurrency = metrics.some((m) => m.unit !== "currency");
  const needsDualAxis = hasCurrency && hasNonCurrency;

  const formatValue = (v: number, unit: string) => {
    if (unit === "currency") return v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`;
    if (unit === "percentage") return `${v}%`;
    return `${v}`;
  };

  // Group available metrics by category
  const categories = availableMetrics
    ? [...new Set(availableMetrics.map((m) => m.category || "Other"))]
    : [];

  return (
    <div className="bg-white border border-border rounded-card p-5 space-y-3">
      {/* Header: pills + add button */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px]">Chart</span>

        {/* Add metric dropdown */}
        {onAdd && availableMetrics && selectedKeys.length < maxMetrics && (
          <div ref={dropdownRef} className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center gap-1 h-6 px-2 text-[10px] font-medium text-text-secondary border border-border rounded-button bg-white hover:bg-surface-page transition-colors">
              <Plus size={11} strokeWidth={1.5} /> Add metric
              <ChevronDown size={10} strokeWidth={1.5} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="absolute z-40 mt-1 left-0 bg-white border border-border rounded-card shadow-lg py-1 min-w-[200px] max-h-[280px] overflow-y-auto">
                  {categories.map((cat) => {
                    const items = availableMetrics.filter((m) => (m.category || "Other") === cat);
                    return (
                      <div key={cat}>
                        <div className="px-3 py-1 text-[9px] font-medium text-text-tertiary uppercase tracking-[0.5px]">{cat}</div>
                        {items.map((m) => {
                          const isSel = selectedKeys.includes(m.key);
                          const isDisabled = !isSel && selectedKeys.length >= maxMetrics;
                          return (
                            <button key={m.key}
                              onClick={() => { if (!isDisabled) { onAdd(m.key); if (selectedKeys.length >= maxMetrics - 1) setDropdownOpen(false); } }}
                              disabled={isDisabled}
                              className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-[11px] transition-colors ${
                                isSel ? "bg-surface-page" : isDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-surface-page"
                              }`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-sm border ${isSel ? "bg-accent border-accent" : "border-border"} flex items-center justify-center`}>
                                  {isSel && <div className="w-1 h-1 bg-white rounded-[1px]" />}
                                </div>
                                <span className="text-text-primary">{m.label}</span>
                              </div>
                              {m.currentValue && <span className="text-text-tertiary tabular-nums text-[10px]">{m.currentValue}</span>}
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
        )}

        {/* Selected pills */}
        {metrics.map((m, i) => (
          <span key={m.key} className="inline-flex items-center gap-1.5 h-6 px-2 text-[10px] font-medium bg-surface-secondary rounded-badge text-text-primary">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
            {m.label}
            <button onClick={() => onRemove(m.key)} className="text-text-tertiary hover:text-text-primary transition-colors">
              <X size={10} strokeWidth={2} />
            </button>
          </span>
        ))}

        <span className="text-[10px] text-text-tertiary">{metrics.length}/{maxMetrics}</span>
      </div>

      {/* Chart */}
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9B9B9B" }} axisLine={{ stroke: "#E5E5E5" }} tickLine={false} interval={2} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9B9B9B" }} axisLine={{ stroke: "#E5E5E5" }} tickLine={false}
              tickFormatter={(v: number) => formatValue(v, metrics[0]?.unit || "number")} />
            {needsDualAxis && (
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#9B9B9B" }} axisLine={{ stroke: "#E5E5E5" }} tickLine={false}
                tickFormatter={(v: number) => {
                  const rightMetric = metrics.find((m) => m.unit !== metrics[0]?.unit);
                  return formatValue(v, rightMetric?.unit || "number");
                }} />
            )}
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: "6px", fontSize: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              formatter={(value, name) => {
                const meta = metrics.find((m) => m.key === name);
                if (meta?.unit === "currency") return [`₹${Number(value).toLocaleString("en-IN")}`, meta.label];
                if (meta?.unit === "percentage") return [`${value}%`, meta.label];
                return [value, meta?.label || String(name)];
              }}
            />
            {metrics.map((m, i) => {
              const isFirstUnit = m.unit === metrics[0]?.unit;
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
  );
}
