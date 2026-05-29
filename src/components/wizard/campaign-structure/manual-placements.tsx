"use client";

import { Check } from "lucide-react";
import type { PlacementSelection } from "./types";
import { placementGroups } from "./types";

interface ManualPlacementsProps {
  placements: PlacementSelection;
  onChange: (placements: PlacementSelection) => void;
}

export function ManualPlacementsSelector({ placements, onChange }: ManualPlacementsProps) {
  const togglePlacement = (platformKey: keyof PlacementSelection, placementKey: string) => {
    const updated = { ...placements };
    updated[platformKey] = {
      ...updated[platformKey],
      [placementKey]: !updated[platformKey][placementKey],
    };
    onChange(updated);
  };

  const toggleAll = (platformKey: keyof PlacementSelection, placementKeys: string[]) => {
    const allChecked = placementKeys.every((k) => placements[platformKey][k]);
    const updated = { ...placements };
    const newVal: Record<string, boolean> = {};
    for (const k of placementKeys) newVal[k] = !allChecked;
    updated[platformKey] = { ...updated[platformKey], ...newVal };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {placementGroups.map((group) => {
        const keys = group.placements.map((p) => p.key);
        const allChecked = keys.every((k) => placements[group.key][k]);
        const someChecked = keys.some((k) => placements[group.key][k]) && !allChecked;

        return (
          <div key={group.key} className="space-y-2">
            {/* Platform header + select all */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-text-primary">{group.platform}</span>
              <button
                type="button"
                onClick={() => toggleAll(group.key, keys)}
                className="text-[11px] font-medium text-accent hover:text-accent-hover transition-colors duration-150"
              >
                {allChecked ? "Deselect All" : "Select All"}
              </button>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {group.placements.map((p) => {
                const checked = !!placements[group.key][p.key];
                return (
                  <label
                    key={p.key}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <span
                      className={`flex items-center justify-center h-4 w-4 rounded-[4px] border transition-colors duration-150 shrink-0 ${
                        checked
                          ? "bg-accent border-accent text-white"
                          : "border-border bg-white group-hover:border-text-tertiary"
                      }`}
                    >
                      {checked && <Check size={10} strokeWidth={3} />}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlacement(group.key, p.key)}
                      className="sr-only"
                    />
                    <span className="text-[12px] text-text-secondary">{p.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Visual indicator for partial selection */}
            {someChecked && (
              <span className="text-[10px] text-text-tertiary">
                {keys.filter((k) => placements[group.key][k]).length} of {keys.length} selected
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
