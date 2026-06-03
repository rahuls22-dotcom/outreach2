"use client";

// Capability set picker. Models the CRM handshake as a set of granted operations
// (read rows / create rows / update rows / create fields) instead of a single
// "bidirectional" toggle. Used inside the connect wizard.

import { Check } from "lucide-react";
import type { Capability } from "@/lib/crm-integration-data";

const CAPABILITY_OPTIONS: {
  key: Capability;
  label: string;
  helper: string;
}[] = [
  {
    key: "read_rows",
    label: "Read rows",
    helper: "Pull existing leads/contacts from the CRM into Revspot.",
  },
  {
    key: "create_row",
    label: "Create rows",
    helper: "Insert new leads Revspot generates into the CRM.",
  },
  {
    key: "update_row",
    label: "Update rows",
    helper: "Write enrichment, call outcomes, and status back onto existing rows.",
  },
  {
    key: "create_field",
    label: "Create fields",
    helper: "Add Revspot-owned custom fields to the CRM at setup time.",
  },
];

export function CapabilityPicker({
  value,
  onChange,
}: {
  value: Capability[];
  onChange: (next: Capability[]) => void;
}) {
  const toggle = (cap: Capability) => {
    onChange(value.includes(cap) ? value.filter((c) => c !== cap) : [...value, cap]);
  };

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {CAPABILITY_OPTIONS.map((opt) => {
        const on = value.includes(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => toggle(opt.key)}
            className={`text-left p-3.5 rounded-card border transition-colors duration-150 ${
              on
                ? "border-accent bg-accent/[0.04]"
                : "border-border bg-white hover:border-border-strong"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-semibold text-text-primary">{opt.label}</span>
              <span
                className={`w-4 h-4 rounded-[5px] flex items-center justify-center transition-colors duration-150 ${
                  on ? "bg-accent text-white" : "border border-border"
                }`}
              >
                {on && <Check size={11} strokeWidth={2.5} />}
              </span>
            </div>
            <p className="text-[11.5px] text-text-secondary leading-relaxed">{opt.helper}</p>
          </button>
        );
      })}
    </div>
  );
}
