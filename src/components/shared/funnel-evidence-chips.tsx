"use client";

export type FunnelStage = "TOF" | "MOF" | "BOF";

export interface FunnelEvidence {
  stage: FunnelStage;
  fact: string;
}

interface StageStyle {
  labelBg: string;
  labelText: string;
  chipBg: string;
  chipText: string;
}

const stageStyles: Record<FunnelStage, StageStyle> = {
  TOF: {
    labelBg: "bg-[#DBEAFE]",
    labelText: "text-[#1E40AF]",
    chipBg: "bg-[#EFF6FF]",
    chipText: "text-[#1E3A8A]",
  },
  MOF: {
    labelBg: "bg-[#FEF3C7]",
    labelText: "text-[#92400E]",
    chipBg: "bg-[#FFFBEB]",
    chipText: "text-[#78350F]",
  },
  BOF: {
    labelBg: "bg-[#DCFCE7]",
    labelText: "text-[#15803D]",
    chipBg: "bg-[#F0FDF4]",
    chipText: "text-[#14532D]",
  },
};

interface FunnelEvidenceChipsProps {
  evidence: FunnelEvidence[];
  /** Show chips inline (single line) vs wrapping. Default: wrapping. */
  inline?: boolean;
}

export function FunnelEvidenceChips({
  evidence,
  inline = false,
}: FunnelEvidenceChipsProps) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className={`flex ${inline ? "" : "flex-wrap"} items-center gap-1.5`}>
      {evidence.map((e, i) => {
        const style = stageStyles[e.stage];
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1 text-[10px] font-medium ${style.chipBg} ${style.chipText} px-1.5 py-0.5 rounded-badge border border-border-subtle`}
          >
            <span
              className={`text-[9px] font-semibold ${style.labelBg} ${style.labelText} px-1 py-[1px] rounded-[3px] tracking-[0.3px]`}
            >
              {e.stage}
            </span>
            <span>{e.fact}</span>
          </span>
        );
      })}
    </div>
  );
}
