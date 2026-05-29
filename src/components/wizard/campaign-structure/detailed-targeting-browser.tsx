"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Plus, ChevronDown, ChevronRight, Check } from "lucide-react";
import type { TargetingSelection, TargetingOption } from "@/lib/targeting-options";
import {
  targetingTree,
  searchTargetingOptions,
  getOptionsByType,
  formatAudienceSize,
} from "@/lib/targeting-options";

interface DetailedTargetingBrowserProps {
  selection: TargetingSelection;
  onChange: (selection: TargetingSelection) => void;
}

const tabLabels: { key: "interest" | "behavior" | "demographic"; label: string }[] = [
  { key: "interest", label: "Interests" },
  { key: "behavior", label: "Behaviors" },
  { key: "demographic", label: "Demographics" },
];

const typeBadgeColors: Record<string, string> = {
  interest: "bg-blue-50 text-blue-700",
  behavior: "bg-amber-50 text-amber-700",
  demographic: "bg-emerald-50 text-emerald-700",
};

export function DetailedTargetingBrowser({ selection, onChange }: DetailedTargetingBrowserProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"interest" | "behavior" | "demographic">("interest");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  // Click-outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  const isIncluded = (opt: TargetingOption) => selection.included.some((o) => o.id === opt.id);
  const isExcluded = (opt: TargetingOption) => selection.excluded.some((o) => o.id === opt.id);

  function toggleInclude(opt: TargetingOption) {
    if (isIncluded(opt)) {
      onChange({ ...selection, included: selection.included.filter((o) => o.id !== opt.id) });
    } else {
      onChange({
        ...selection,
        included: [...selection.included, opt],
        excluded: selection.excluded.filter((o) => o.id !== opt.id),
      });
    }
  }

  function toggleExclude(opt: TargetingOption) {
    if (isExcluded(opt)) {
      onChange({ ...selection, excluded: selection.excluded.filter((o) => o.id !== opt.id) });
    } else {
      onChange({
        ...selection,
        excluded: [...selection.excluded, opt],
        included: selection.included.filter((o) => o.id !== opt.id),
      });
    }
  }

  function removeIncluded(id: string) {
    onChange({ ...selection, included: selection.included.filter((o) => o.id !== id) });
  }

  function removeExcluded(id: string) {
    onChange({ ...selection, excluded: selection.excluded.filter((o) => o.id !== id) });
  }

  function toggleCategory(key: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const hasSelections = selection.included.length > 0 || selection.excluded.length > 0;
  const searchResults = searchQuery.length >= 2 ? searchTargetingOptions(searchQuery, 30) : [];
  const browseCategories = getOptionsByType(activeTab);

  return (
    <div className="relative" ref={panelRef}>
      {/* --- Closed state: summary chips --- */}
      {!isOpen && (
        <div
          className="min-h-[36px] flex flex-wrap items-center gap-1.5 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          {hasSelections ? (
            <>
              {selection.included.map((opt) => (
                <span
                  key={opt.id}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-badge bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {opt.name}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeIncluded(opt.id); }}
                    className="hover:text-blue-900"
                  >
                    <X size={10} strokeWidth={2} />
                  </button>
                </span>
              ))}
              {selection.excluded.map((opt) => (
                <span
                  key={opt.id}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-badge bg-red-50 text-red-700 border border-red-200"
                >
                  <span className="line-through">{opt.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeExcluded(opt.id); }}
                    className="hover:text-red-900"
                  >
                    <X size={10} strokeWidth={2} />
                  </button>
                </span>
              ))}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-text-tertiary hover:text-accent transition-colors">
              <Plus size={13} strokeWidth={1.5} />
              Add detailed targeting
            </span>
          )}
        </div>
      )}

      {/* --- Open state: popover browser --- */}
      {isOpen && (
        <div className="absolute left-0 top-0 z-30 w-[480px] max-h-[420px] bg-white border border-border rounded-card shadow-lg flex flex-col">
          {/* Search bar */}
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search size={14} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search interests, behaviors, demographics..."
                className="w-full h-8 pl-8 pr-3 text-[12px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors placeholder:text-text-tertiary"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          {searchQuery.length < 2 && (
            <div className="flex border-b border-border px-3">
              {tabLabels.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-accent text-accent"
                      : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {searchQuery.length >= 2 ? (
              /* --- Search mode --- */
              <div className="py-1">
                {searchResults.length === 0 && (
                  <p className="px-3 py-4 text-[12px] text-text-tertiary text-center">
                    No results for &ldquo;{searchQuery}&rdquo;
                  </p>
                )}
                {searchResults.map((opt) => (
                  <SearchResultRow
                    key={opt.id}
                    option={opt}
                    isIncluded={isIncluded(opt)}
                    isExcluded={isExcluded(opt)}
                    onInclude={() => toggleInclude(opt)}
                    onExclude={() => toggleExclude(opt)}
                  />
                ))}
              </div>
            ) : (
              /* --- Browse mode (accordion tree) --- */
              <div className="py-1">
                {browseCategories.map((category) => (
                  <div key={category.key}>
                    {/* Category header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.key)}
                      className="w-full flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-text-primary hover:bg-surface-page transition-colors"
                    >
                      {expandedCategories.has(category.key) ? (
                        <ChevronDown size={13} strokeWidth={1.5} />
                      ) : (
                        <ChevronRight size={13} strokeWidth={1.5} />
                      )}
                      {category.label}
                    </button>

                    {expandedCategories.has(category.key) &&
                      category.subcategories.map((sub) => (
                        <div key={sub.key}>
                          {/* Subcategory header */}
                          <button
                            type="button"
                            onClick={() => toggleCategory(`${category.key}:${sub.key}`)}
                            className="w-full flex items-center gap-1.5 pl-7 pr-3 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-surface-page transition-colors"
                          >
                            {expandedCategories.has(`${category.key}:${sub.key}`) ? (
                              <ChevronDown size={11} strokeWidth={1.5} />
                            ) : (
                              <ChevronRight size={11} strokeWidth={1.5} />
                            )}
                            {sub.label}
                          </button>

                          {expandedCategories.has(`${category.key}:${sub.key}`) &&
                            sub.options.map((opt) => (
                              <BrowseOptionRow
                                key={opt.id}
                                option={opt}
                                checked={isIncluded(opt)}
                                onToggle={() => toggleInclude(opt)}
                              />
                            ))}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selection summary (bottom) */}
          {hasSelections && (
            <div className="border-t border-border px-3 py-2 space-y-1.5 max-h-[120px] overflow-y-auto">
              {selection.included.length > 0 && (
                <div>
                  <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.4px]">
                    Included ({selection.included.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selection.included.map((opt) => (
                      <span
                        key={opt.id}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-badge bg-blue-50 text-blue-700"
                      >
                        {opt.name}
                        <button type="button" onClick={() => removeIncluded(opt.id)} className="hover:text-blue-900">
                          <X size={9} strokeWidth={2} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selection.included.length > 0 && selection.excluded.length > 0 && (
                <div className="border-t border-border-subtle" />
              )}
              {selection.excluded.length > 0 && (
                <div>
                  <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.4px]">
                    Excluded ({selection.excluded.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selection.excluded.map((opt) => (
                      <span
                        key={opt.id}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-badge bg-red-50 text-red-700"
                      >
                        {opt.name}
                        <button type="button" onClick={() => removeExcluded(opt.id)} className="hover:text-red-900">
                          <X size={9} strokeWidth={2} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Done button */}
          <div className="border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full h-8 text-[12px] font-medium bg-accent text-white rounded-button hover:bg-accent-hover transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Sub-components ---- */

function SearchResultRow({
  option,
  isIncluded,
  isExcluded,
  onInclude,
  onExclude,
}: {
  option: TargetingOption;
  isIncluded: boolean;
  isExcluded: boolean;
  onInclude: () => void;
  onExclude: () => void;
}) {
  const badgeColor = typeBadgeColors[option.type] ?? "bg-gray-50 text-gray-700";
  const typeLabel = option.type === "interest" ? "Interest" : option.type === "behavior" ? "Behavior" : "Demographic";

  return (
    <div className="flex items-center justify-between px-3 py-1.5 hover:bg-surface-page transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[12px] text-text-primary truncate">{option.name}</span>
        <span className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-badge ${badgeColor}`}>
          {typeLabel}
        </span>
        <span className="shrink-0 text-[10px] text-text-tertiary">
          {formatAudienceSize(option.audience_size_lower, option.audience_size_upper)}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onInclude}
          className={`px-2 py-0.5 text-[10px] font-medium rounded-button border transition-colors ${
            isIncluded
              ? "bg-blue-100 border-blue-300 text-blue-700"
              : "border-border text-text-secondary hover:border-blue-300 hover:text-blue-700"
          }`}
        >
          Include
        </button>
        <button
          type="button"
          onClick={onExclude}
          className={`px-2 py-0.5 text-[10px] font-medium rounded-button border transition-colors ${
            isExcluded
              ? "bg-red-100 border-red-300 text-red-700"
              : "border-border text-text-secondary hover:border-red-300 hover:text-red-700"
          }`}
        >
          Exclude
        </button>
      </div>
    </div>
  );
}

function BrowseOptionRow({
  option,
  checked,
  onToggle,
}: {
  option: TargetingOption;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 pl-12 pr-3 py-1.5 text-[11px] hover:bg-surface-page transition-colors"
    >
      <span
        className={`shrink-0 h-3.5 w-3.5 rounded-[3px] border flex items-center justify-center transition-colors ${
          checked ? "bg-accent border-accent" : "border-border bg-white"
        }`}
      >
        {checked && <Check size={9} strokeWidth={3} className="text-white" />}
      </span>
      <span className="text-text-primary truncate">{option.name}</span>
      <span className="ml-auto shrink-0 text-[10px] text-text-tertiary">
        {formatAudienceSize(option.audience_size_lower, option.audience_size_upper)}
      </span>
    </button>
  );
}
