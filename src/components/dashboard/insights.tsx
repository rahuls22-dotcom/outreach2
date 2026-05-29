"use client";

import { useState } from "react";
import { yesterdayInsights, weeklyInsights } from "@/lib/mock-data";
import type { InsightItem } from "@/lib/mock-data";

function highlightText(text: string, highlights: string[]) {
  let result = text;
  highlights.forEach((h) => {
    result = result.replace(h, `<strong class="font-medium text-text-primary">${h}</strong>`);
  });
  return result;
}

export function Insights() {
  const [period, setPeriod] = useState<"yesterday" | "week">("yesterday");
  const insights = period === "yesterday" ? yesterdayInsights : weeklyInsights;

  return (
    <div className="bg-white border border-border rounded-card">
      <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-section-header text-text-primary">Insights</h2>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-badge bg-surface-secondary text-text-secondary">
            {period === "yesterday" ? "Yesterday" : "Last 7 days"}
          </span>
        </div>
        <div className="flex items-center gap-0.5 bg-surface-secondary rounded-input p-0.5">
          {([
            { key: "yesterday" as const, label: "Yesterday" },
            { key: "week" as const, label: "Last 7 days" },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-[5px] transition-colors duration-150 ${
                period === opt.key
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-border-subtle">
        {insights.map((insight) => (
          <div key={insight.id} className="px-6 py-3.5 flex items-start gap-3">
            <span className="text-[16px] mt-0.5 shrink-0 leading-none">{insight.icon}</span>
            <p
              className="text-[13px] text-text-secondary leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightText(insight.text, insight.highlights) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
