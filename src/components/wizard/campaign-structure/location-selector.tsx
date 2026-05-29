"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin } from "lucide-react";
import type { LocationEntry } from "./types";
import { availableLocations } from "./types";

interface LocationSelectorProps {
  locations: LocationEntry[];
  onChange: (locations: LocationEntry[]) => void;
}

const typeBadgeClass: Record<LocationEntry["type"], string> = {
  city: "bg-blue-50 text-blue-700",
  region: "bg-amber-50 text-amber-700",
  country: "bg-green-50 text-green-700",
};

export function LocationSelector({ locations, onChange }: LocationSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedIds = new Set(locations.map((l) => l.id));

  const filtered = query.trim()
    ? availableLocations.filter(
        (l) =>
          !selectedIds.has(l.id) &&
          l.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : [];

  const addLocation = (loc: LocationEntry) => {
    onChange([...locations, loc]);
    setQuery("");
    setOpen(false);
  };

  const removeLocation = (id: string) => {
    onChange(locations.filter((l) => l.id !== id));
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search
          size={14}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          placeholder="Search locations..."
          className="w-full h-9 pl-9 pr-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary"
        />

        {/* Dropdown results */}
        {open && filtered.length > 0 && (
          <div className="absolute z-20 top-full mt-1 left-0 w-full bg-white border border-border rounded-[8px] shadow-lg max-h-[200px] overflow-y-auto">
            {filtered.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => addLocation(loc)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-page transition-colors duration-100"
              >
                <div className="flex items-center gap-2">
                  <MapPin size={12} strokeWidth={1.5} className="text-text-tertiary shrink-0" />
                  <span className="text-[13px] text-text-primary">{loc.name}</span>
                </div>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-badge ${typeBadgeClass[loc.type]}`}
                >
                  {loc.type}
                </span>
              </button>
            ))}
          </div>
        )}

        {open && query.trim() && filtered.length === 0 && (
          <div className="absolute z-20 top-full mt-1 left-0 w-full bg-white border border-border rounded-[8px] shadow-lg px-3 py-3">
            <span className="text-[12px] text-text-tertiary">No matching locations</span>
          </div>
        )}
      </div>

      {/* Selected chips */}
      {locations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {locations.map((loc) => (
            <span
              key={loc.id}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-badge bg-surface-page text-text-secondary border border-border"
            >
              {loc.name}
              <button
                type="button"
                onClick={() => removeLocation(loc.id)}
                className="ml-0.5 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={11} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
