"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { UserRole } from "@/lib/workspace-data";

const ROLES: { value: UserRole; label: string; sub: string }[] = [
  { value: "admin", label: "Admin", sub: "Manage members + settings" },
  { value: "member", label: "Member", sub: "Project-level access" },
];

/** Compact two-option role dropdown for the member table. */
export function RoleSelect({
  value,
  onChange,
  disabled,
  disabledHint,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = ROLES.find((r) => r.value === value) ?? ROLES[1];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-between w-[104px] h-7 pl-2.5 pr-2 rounded-[6px] border border-border bg-white text-[12px] hover:border-border-hover disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border"
      >
        <span className="font-medium">{current.label}</span>
        <ChevronDown size={12} className="text-text-tertiary" />
      </button>
      {open && (
        <div
          className="fadeInScale"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            width: 196,
            background: "#FFF",
            border: "1px solid var(--border)",
            borderRadius: 9,
            boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
            zIndex: 70,
            padding: 5,
          }}
        >
          {ROLES.map((r) => {
            const active = r.value === value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => {
                  onChange(r.value);
                  setOpen(false);
                }}
                className="w-full flex items-start gap-2 px-2 py-1.5 rounded-[6px] hover:bg-surface-page text-left"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-[12px] font-medium">{r.label}</span>
                  <span className="block text-[10.5px] text-text-tertiary">{r.sub}</span>
                </span>
                {active && <Check size={12} className="text-text-secondary mt-0.5 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
