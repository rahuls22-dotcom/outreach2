"use client";

import { Sparkles, Calendar, ArrowRight } from "lucide-react";
import type { StatusStripData } from "@/lib/types/diagnosis-payload";
import { verdictStyles } from "@/lib/diagnosis-data";

interface StatusStripProps {
  data: StatusStripData;
  onOpenDiagnosis?: () => void;
}

export function StatusStrip({ data, onOpenDiagnosis }: StatusStripProps) {
  const style = verdictStyles[data.verdict];
  const offTrack = data.verdict !== "ON_TRACK" && data.verdict !== "SCALE_WINNER";
  const clickable = !!onOpenDiagnosis && offTrack;

  const inner = (
    <>
      <div className="w-5 h-5 rounded-[5px] bg-accent flex items-center justify-center shrink-0">
        <Sparkles size={11} strokeWidth={1.5} className="text-white" />
      </div>
      <span
        className={`inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.5px] px-2 py-0.5 rounded-badge shrink-0 ${style.pillBg} ${style.pillText}`}
      >
        {style.label}
      </span>
      <p className="text-[13px] font-medium text-text-primary truncate flex-1 min-w-0 text-left">
        {data.headline}
      </p>
      <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary shrink-0 tabular-nums">
        <Calendar size={11} strokeWidth={1.5} />
        Day {data.days_live} of {data.days_total}
      </span>
      <span className="text-border">|</span>
      <span className="text-[11px] text-text-secondary tabular-nums shrink-0">
        {data.primary_metric_summary}
      </span>
      {clickable && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent shrink-0">
          Diagnose
          <ArrowRight size={11} strokeWidth={2} />
        </span>
      )}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onOpenDiagnosis}
        className="w-full bg-white border border-border rounded-card px-4 py-2.5 flex items-center gap-3 hover:border-border-hover hover:bg-surface-page/40 transition-colors duration-150 text-left"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="bg-white border border-border rounded-card px-4 py-2.5 flex items-center gap-3">
      {inner}
    </div>
  );
}
