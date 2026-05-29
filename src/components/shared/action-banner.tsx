"use client";

import { useRouter } from "next/navigation";
import {
  Pause,
  TrendingUp,
  RefreshCw,
  ArrowLeftRight,
  Plus,
  Search,
  Check,
  Target,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// All verbs supported across campaign-level and project-level diagnoses.
// (Campaign uses Pause/Increase/Refresh/Shift/Add/Investigate/Maintain;
//  Project uses Reallocate/Pause/Scale/Refresh/Tighten/Investigate/Maintain.)
export type ActionVerb =
  | "Pause"
  | "Increase"
  | "Refresh"
  | "Shift"
  | "Reallocate"
  | "Scale"
  | "Tighten"
  | "Add"
  | "Investigate"
  | "Maintain";

interface VerbStyle {
  icon: LucideIcon;
  bg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  iconColor: string;
}

const verbStyles: Record<ActionVerb, VerbStyle> = {
  Pause: {
    icon: Pause,
    bg: "bg-[#FFFBEB]",
    border: "border-[#FDE68A]",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-[#92400E]",
    iconColor: "text-[#92400E]",
  },
  Refresh: {
    icon: RefreshCw,
    bg: "bg-[#EFF6FF]",
    border: "border-[#BFDBFE]",
    badgeBg: "bg-[#DBEAFE]",
    badgeText: "text-[#1E40AF]",
    iconColor: "text-[#1E40AF]",
  },
  Shift: {
    icon: ArrowLeftRight,
    bg: "bg-[#F5F3FF]",
    border: "border-[#DDD6FE]",
    badgeBg: "bg-[#EDE9FE]",
    badgeText: "text-[#6D28D9]",
    iconColor: "text-[#6D28D9]",
  },
  Reallocate: {
    icon: ArrowLeftRight,
    bg: "bg-[#F5F3FF]",
    border: "border-[#DDD6FE]",
    badgeBg: "bg-[#EDE9FE]",
    badgeText: "text-[#6D28D9]",
    iconColor: "text-[#6D28D9]",
  },
  Increase: {
    icon: TrendingUp,
    bg: "bg-[#F0FDF4]",
    border: "border-[#BBF7D0]",
    badgeBg: "bg-[#DCFCE7]",
    badgeText: "text-[#15803D]",
    iconColor: "text-[#15803D]",
  },
  Scale: {
    icon: TrendingUp,
    bg: "bg-[#F0FDF4]",
    border: "border-[#BBF7D0]",
    badgeBg: "bg-[#DCFCE7]",
    badgeText: "text-[#15803D]",
    iconColor: "text-[#15803D]",
  },
  Tighten: {
    icon: Target,
    bg: "bg-[#F5F3FF]",
    border: "border-[#DDD6FE]",
    badgeBg: "bg-[#EDE9FE]",
    badgeText: "text-[#6D28D9]",
    iconColor: "text-[#6D28D9]",
  },
  Add: {
    icon: Plus,
    bg: "bg-surface-page",
    border: "border-border",
    badgeBg: "bg-surface-secondary",
    badgeText: "text-text-primary",
    iconColor: "text-text-primary",
  },
  Investigate: {
    icon: Search,
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    badgeBg: "bg-[#FEE2E2]",
    badgeText: "text-[#DC2626]",
    iconColor: "text-[#DC2626]",
  },
  Maintain: {
    icon: Check,
    bg: "bg-[#F0FDF4]",
    border: "border-[#BBF7D0]",
    badgeBg: "bg-[#DCFCE7]",
    badgeText: "text-[#15803D]",
    iconColor: "text-[#15803D]",
  },
};

export interface ActionBannerProps {
  verb: ActionVerb;
  target: string;
  outcome: string;
  expectedImpact?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  onSnooze?: () => void;
  variant?: "campaign" | "project";
}

export function ActionBanner({
  verb,
  target,
  outcome,
  expectedImpact,
  ctaLabel,
  ctaHref,
  onCtaClick,
  onSnooze,
  variant = "campaign",
}: ActionBannerProps) {
  const router = useRouter();
  const style = verbStyles[verb];
  const Icon = style.icon;
  const isMaintain = verb === "Maintain";

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
      return;
    }
    if (ctaHref) router.push(ctaHref);
  };

  return (
    <div
      className={`mb-4 ${style.bg} border ${style.border} rounded-card overflow-hidden`}
    >
      <div className={`p-${isMaintain ? "4" : "5"}`}>
        <div className="flex items-start gap-4">
          {/* Verb badge */}
          <div
            className={`shrink-0 inline-flex items-center gap-1.5 ${style.badgeBg} ${style.badgeText} text-[11px] font-semibold uppercase tracking-[0.5px] px-2.5 py-1 rounded-badge`}
          >
            <Icon size={12} strokeWidth={2} className={style.iconColor} />
            {verb}
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap mb-1">
              <span className="text-[15px] font-semibold text-text-primary leading-snug">
                {target}
              </span>
              {variant === "project" && (
                <span className="text-[10px] uppercase tracking-[0.5px] text-text-tertiary font-medium">
                  Project recommendation
                </span>
              )}
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {outcome}
            </p>
            {expectedImpact && !isMaintain && (
              <p className="text-[11px] text-text-tertiary mt-1.5 leading-relaxed">
                <span className="font-medium text-text-secondary">Expected: </span>
                {expectedImpact}
              </p>
            )}
          </div>

          {/* CTAs */}
          {!isMaintain && (ctaLabel || onSnooze) && (
            <div className="shrink-0 flex items-center gap-2">
              {ctaLabel && (ctaHref || onCtaClick) && (
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="h-8 px-3.5 bg-accent text-white text-[12px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150"
                >
                  {ctaLabel}
                </button>
              )}
              {onSnooze && (
                <button
                  type="button"
                  onClick={onSnooze}
                  aria-label="Snooze for 24 hours"
                  className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-white/60 rounded-button transition-colors duration-150"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
