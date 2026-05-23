"use client";

// Mapping table — shows uploaded file's columns with a dropdown above each
// to map it to a target field (Name / Phone / Email / LinkedIn Link / Lead Id / Custom).
// Auto-map runs on file drop; user can override here.

import { ChevronDown } from "lucide-react";
import type { RequiredField } from "@/lib/enrichment-data";

export type MapTarget = "custom" | "leadId" | RequiredField;

export type ColumnMap = Record<string, MapTarget>;

const TARGET_LABELS: Record<MapTarget, string> = {
  custom: "Skip column",
  leadId: "Lead Id",
  name: "Name",
  email: "Email",
  phone: "Phone",
  linkedin: "LinkedIn Link",
};

// Targets visible in the dropdown based on which types are picked.
// Real fields listed first, "Skip column" pinned to the bottom.
function visibleTargets(needName: boolean, needPro: boolean): MapTarget[] {
  const t: MapTarget[] = [];
  if (needName) t.push("name");
  if (needPro) {
    t.push("email", "phone", "linkedin");
  } else {
    // Financial-only — phone still needed
    t.push("phone");
  }
  t.push("leadId");
  t.push("custom");
  return t;
}

export function MappingTable({
  headers,
  preview,
  columnMap,
  setColumnMap,
  needName,
  needPro,
}: {
  headers: string[];
  preview: string[][];        // first N rows (cell values, headers excluded)
  columnMap: ColumnMap;
  setColumnMap: (m: ColumnMap) => void;
  needName: boolean;
  needPro: boolean;
}) {
  const targets = visibleTargets(needName, needPro);

  const onPick = (header: string, target: MapTarget) => {
    // If another column already maps to this target (excluding custom/leadId),
    // reset it to custom — we only allow one mapping per target field.
    const unique = target !== "custom" && target !== "leadId";
    const next: ColumnMap = { ...columnMap };
    if (unique) {
      for (const h of Object.keys(next)) {
        if (h !== header && next[h] === target) next[h] = "custom";
      }
    }
    next[header] = target;
    setColumnMap(next);
  };

  return (
    <div className="border border-border rounded-card overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] border-collapse">
          {/* Dropdown row */}
          <thead>
            <tr className="bg-surface-page/60">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 border-b border-border-subtle text-left align-top min-w-[140px]"
                >
                  <ColumnPicker
                    value={columnMap[h] || "custom"}
                    targets={targets}
                    onPick={(t) => onPick(h, t)}
                  />
                </th>
              ))}
            </tr>
            {/* Original header names row */}
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 border-b border-border-subtle text-left text-[11px] uppercase tracking-[0.4px] text-text-tertiary font-medium bg-white"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, ri) => (
              <tr key={ri} className="odd:bg-white even:bg-surface-page/30">
                {headers.map((_, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-2 border-b border-border-subtle text-text-secondary truncate max-w-[200px]"
                    title={row[ci] || ""}
                  >
                    {row[ci] || <span className="text-text-tertiary">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColumnPicker({
  value,
  targets,
  onPick,
}: {
  value: MapTarget;
  targets: MapTarget[];
  onPick: (t: MapTarget) => void;
}) {
  const isMapped = value !== "custom" && value !== "leadId";
  const isSkipped = value === "custom";
  return (
    <div className="relative inline-block w-full">
      <select
        value={value}
        onChange={(e) => onPick(e.target.value as MapTarget)}
        className={`appearance-none w-full pr-7 pl-2.5 py-1.5 text-[12px] font-medium rounded-button border bg-white focus:outline-none transition-colors cursor-pointer ${
          isMapped
            ? "border-text-primary text-text-primary"
            : isSkipped
            ? "border-border-subtle text-text-tertiary bg-surface-page/50 hover:text-text-secondary"
            : "border-border text-text-secondary hover:border-border-hover"
        }`}
      >
        {targets.map((t) => (
          <option key={t} value={t}>
            {TARGET_LABELS[t]}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        strokeWidth={1.75}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary"
      />
    </div>
  );
}

// Builds an initial ColumnMap by auto-detecting common header names.
export function autoBuildColumnMap(headers: string[]): ColumnMap {
  const out: ColumnMap = {};
  const taken = new Set<MapTarget>();
  const try_ = (header: string, candidates: MapTarget[]) => {
    for (const c of candidates) {
      if (!taken.has(c)) {
        out[header] = c;
        taken.add(c);
        return;
      }
    }
  };
  for (const h of headers) {
    const norm = h.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (out[h]) continue;
    if (/email|mail/.test(norm)) try_(h, ["email"]);
    else if (/linkedin|liurl|profileurl/.test(norm)) try_(h, ["linkedin"]);
    else if (/phone|mobile|contact|tel/.test(norm)) try_(h, ["phone"]);
    else if (/^name$|fullname|leadname|firstname|lastname|givenname|surname/.test(norm)) try_(h, ["name"]);
    else if (/leadid|^id$|recordid/.test(norm)) try_(h, ["leadId"]);
    if (!out[h]) out[h] = "custom";
  }
  return out;
}

// Convert ColumnMap to a Set of mapped required fields (for spot/required checks).
export function mappedFields(columnMap: ColumnMap): Set<RequiredField> {
  const s = new Set<RequiredField>();
  for (const t of Object.values(columnMap)) {
    if (t === "name" || t === "phone" || t === "email" || t === "linkedin") {
      s.add(t);
    }
  }
  return s;
}
