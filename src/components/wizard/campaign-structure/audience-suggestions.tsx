"use client";

import { Users, Sparkles } from "lucide-react";
import { suggestedAudiences } from "./types";

interface AudienceSuggestionsProps {
  onApply: (audienceName: string) => void;
}

export function AudienceSuggestions({ onApply }: AudienceSuggestionsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles size={12} strokeWidth={1.5} className="text-accent" />
        <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.4px]">
          AI-Suggested Audiences
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {suggestedAudiences.map((audience) => (
          <div
            key={audience.id}
            className="bg-surface-page border border-border-subtle rounded-[8px] p-3 flex flex-col"
          >
            <h4 className="text-[12px] font-semibold text-text-primary mb-1 leading-snug">
              {audience.name}
            </h4>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-2 flex-1">
              {audience.description}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                <Users size={10} strokeWidth={1.5} />
                <span>{audience.size}</span>
              </div>
              <button
                type="button"
                onClick={() => onApply(audience.name)}
                className="text-[11px] font-medium text-accent hover:text-accent-hover transition-colors duration-150"
              >
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
