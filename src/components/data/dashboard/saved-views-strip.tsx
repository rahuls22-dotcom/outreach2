"use client";

// Chip list of saved views + "Save view" button when filters are dirty.
// Save flow: prompt() for name → emit a new SavedView upward. Persistence
// is handled by the parent's storage layer.

import { Star, Trash2 } from "lucide-react";
import { newSavedViewId } from "@/lib/dashboard/dashboard-storage";
import type { FilterClause, SavedView } from "@/lib/dashboard/types";

interface Props {
  savedViews: SavedView[];
  activeFilters: FilterClause[];
  onApplyView: (view: SavedView) => void;
  onSaveView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  onClearFilters: () => void;
}

export function SavedViewsStrip({
  savedViews,
  activeFilters,
  onApplyView,
  onSaveView,
  onDeleteView,
  onClearFilters,
}: Props) {
  const dirty = activeFilters.length > 0;

  const handleSave = () => {
    const name = window.prompt("Name this view (e.g. Premium Bangalore):");
    if (!name?.trim()) return;
    onSaveView({
      id: newSavedViewId(),
      name: name.trim(),
      filters: [...activeFilters],
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">
        Saved:
      </span>

      <button
        onClick={onClearFilters}
        className={[
          "h-7 px-2.5 text-[11.5px] font-medium rounded-input border transition-colors",
          activeFilters.length === 0
            ? "bg-surface-secondary border-border text-text-primary"
            : "bg-white border-border text-text-secondary hover:text-text-primary",
        ].join(" ")}
      >
        All leads
      </button>

      {savedViews.map((v) => (
        <span
          key={v.id}
          className="group inline-flex items-center h-7 bg-white border border-border rounded-input overflow-hidden"
        >
          <button
            onClick={() => onApplyView(v)}
            className="inline-flex items-center gap-1.5 h-full pl-2.5 pr-1.5 text-[11.5px] font-medium text-text-primary hover:bg-surface-page transition-colors"
          >
            {v.starred && <Star size={10} strokeWidth={2} fill="currentColor" />}
            {v.name}
          </button>
          <button
            onClick={() => onDeleteView(v.id)}
            aria-label={`Delete view ${v.name}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-full px-1.5 border-l border-border text-text-tertiary hover:text-[#991B1B]"
          >
            <Trash2 size={10} strokeWidth={1.75} />
          </button>
        </span>
      ))}

      {dirty && (
        <button
          onClick={handleSave}
          className="h-7 px-2.5 text-[11.5px] font-medium text-text-primary bg-white border border-dashed border-border rounded-input hover:bg-surface-page transition-colors"
        >
          + Save view
        </button>
      )}
    </div>
  );
}
