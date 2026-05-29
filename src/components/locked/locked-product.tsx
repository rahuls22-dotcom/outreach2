"use client";

// Upsell page shown to enrichment-only workspaces when they click into a
// product they don't have. The shell takes copy + an optional preview block
// rendered between the lede and the feature grid.

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Lock, Mail, type LucideIcon } from "lucide-react";

interface Feature {
  icon?: LucideIcon;
  title: string;
  body: string;
}

interface Step {
  title: string;
  body: string;
}

interface Props {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  lede: string;
  preview?: ReactNode;
  features: Feature[];
  howItWorks?: Step[];
  mailSubject: string;
}

export function LockedProduct({
  icon: Icon,
  eyebrow,
  title,
  lede,
  preview,
  features,
  howItWorks,
  mailSubject,
}: Props) {
  const mailHref = `mailto:sales@revspot.ai?subject=${encodeURIComponent(mailSubject)}`;
  return (
    <div className="max-w-[1200px] mx-auto pt-2 pb-16">
      <Link
        href="/enrichment"
        className="inline-flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary mb-8"
      >
        ← Back to Enrichment
      </Link>

      {/* Hero */}
      <div className="flex items-start gap-4 mb-5">
        <div className="relative w-12 h-12 rounded-card bg-surface-secondary flex items-center justify-center flex-shrink-0">
          <Icon size={22} strokeWidth={1.5} className="text-text-secondary" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center shadow-sm">
            <Lock size={10} strokeWidth={2.25} className="text-text-secondary" />
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.6px] text-text-tertiary mb-1.5">
            {eyebrow}
          </div>
          <h1 className="text-[28px] font-semibold text-text-primary leading-[1.15] tracking-[-0.01em]">
            {title}
          </h1>
        </div>
      </div>

      <p className="text-[14.5px] text-text-secondary leading-relaxed mb-8 max-w-[680px]">
        {lede}
      </p>

      {preview && <div className="mb-10">{preview}</div>}

      {/* Feature grid */}
      <div className="mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-text-tertiary mb-3">
          What you get
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          {features.map((f) => {
            const FIcon = f.icon;
            return (
              <div
                key={f.title}
                className="p-4 bg-white border border-border-subtle rounded-card"
              >
                {FIcon && (
                  <div className="w-7 h-7 rounded-[6px] bg-surface-secondary flex items-center justify-center mb-2.5">
                    <FIcon size={14} strokeWidth={1.75} className="text-text-secondary" />
                  </div>
                )}
                <div className="text-[13px] font-semibold text-text-primary mb-1">
                  {f.title}
                </div>
                <div className="text-[12.5px] text-text-secondary leading-relaxed">
                  {f.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      {howItWorks && howItWorks.length > 0 && (
        <div className="mb-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-text-tertiary mb-3">
            How it works
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {howItWorks.map((s, i) => (
              <div
                key={s.title}
                className="relative p-4 bg-surface-secondary/40 border border-border-subtle rounded-card"
              >
                <div className="text-[10.5px] font-semibold text-text-tertiary mb-1.5">
                  STEP {i + 1}
                </div>
                <div className="text-[13px] font-semibold text-text-primary mb-1">
                  {s.title}
                </div>
                <div className="text-[12.5px] text-text-secondary leading-relaxed">
                  {s.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales CTA */}
      <div className="p-6 bg-surface-secondary/60 border border-border-subtle rounded-card flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-text-primary mb-1">
            Not on your plan yet
          </div>
          <div className="text-[12.5px] text-text-secondary leading-relaxed max-w-[520px]">
            This product is part of a higher Revspot tier. Talk to sales to add it to
            your workspace, no rebuild, no migration.
          </div>
        </div>
        <a
          href={mailHref}
          className="inline-flex items-center gap-1.5 h-10 px-4 bg-text-primary text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors"
        >
          <Mail size={14} strokeWidth={1.75} />
          Contact sales
          <ArrowRight size={13} strokeWidth={2} />
        </a>
      </div>
    </div>
  );
}
