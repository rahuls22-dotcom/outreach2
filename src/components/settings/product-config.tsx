"use client";

// Reusable building blocks for the per-product Settings tabs. Match the visual
// language already used in the Integrations page (bordered cards, toggle, rows)
// so the product config surfaces feel native.

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";

// ── Card ────────────────────────────────────────────────────
export function ConfigCard({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-border rounded-card p-5">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-card-title text-text-primary">{title}</h3>
        {badge}
      </div>
      {description && (
        <p className="text-[11px] text-text-tertiary mb-4 leading-relaxed">{description}</p>
      )}
      {!description && <div className="mb-3" />}
      {children}
    </div>
  );
}

// ── Row (label + helper + right control) ────────────────────
export function ConfigRow({
  label,
  helper,
  control,
  last = false,
}: {
  label: string;
  helper?: string;
  control: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between py-3 ${
        last ? "" : "border-b border-border-subtle"
      }`}
    >
      <div className="pr-4">
        <div className="text-[13px] text-text-primary">{label}</div>
        {helper && <div className="text-[11px] text-text-tertiary mt-0.5 leading-relaxed">{helper}</div>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────
export function ConfigToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-9 h-5 rounded-full transition-colors duration-150 shrink-0 ${
        enabled ? "bg-accent" : "bg-silver-light"
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150 ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Segmented choice (radio cards in a row) ─────────────────
export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  helper?: string;
}

export function ConfigChoice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChoiceOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-left rounded-[8px] border px-3 py-2.5 transition-colors duration-150 ${
              active
                ? "border-accent bg-accent/[0.04]"
                : "border-border hover:border-border-strong bg-white"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  active ? "border-accent bg-accent" : "border-border-strong"
                }`}
              >
                {active && <Check size={9} strokeWidth={3} className="text-white" />}
              </span>
              <span className="text-[12.5px] font-medium text-text-primary">{opt.label}</span>
            </div>
            {opt.helper && (
              <div className="text-[11px] text-text-tertiary mt-1 leading-relaxed pl-5">{opt.helper}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Save bar (canned save feedback) ─────────────────────────
export function SaveBar() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="pt-1 pb-8">
      <button
        onClick={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        className="inline-flex items-center gap-1.5 h-10 px-6 bg-accent text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150"
      >
        {saved ? (
          <>
            <Check size={15} strokeWidth={2} />
            Saved!
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </div>
  );
}
