"use client";

import {
  Pause,
  TrendingUp,
  RefreshCw,
  ArrowLeftRight,
  Plus,
  Search,
  Check,
  Hourglass,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { NextBestAction as NBAType, ActionVerb } from "@/lib/types/diagnosis-payload";
import { actionColorStyles } from "@/lib/diagnosis-data";

interface NextBestActionProps {
  action: NBAType;
  onApply?: () => void;
  onSnooze?: () => void;
}

const verbIcons: Record<ActionVerb, LucideIcon> = {
  WAIT: Hourglass,
  CONTINUE: Check,
  SCALE: TrendingUp,
  OPTIMIZE: Wand2,
  INTERVENE: ArrowLeftRight,
  URGENT: ArrowLeftRight,
  REFRESH: RefreshCw,
  ADD_ADSET: Plus,
  PAUSE: Pause,
  SHIFT_BUDGET: ArrowLeftRight,
  ADD_CREATIVE: Plus,
};

const verbLabels: Record<ActionVerb, string> = {
  WAIT: "Wait",
  CONTINUE: "Continue",
  SCALE: "Scale",
  OPTIMIZE: "Optimize",
  INTERVENE: "Intervene",
  URGENT: "Urgent",
  REFRESH: "Refresh",
  ADD_ADSET: "Add adset",
  PAUSE: "Pause",
  SHIFT_BUDGET: "Shift budget",
  ADD_CREATIVE: "Add creative",
};

/** Subtler card: thin colored left rail + faint tinted body keyed on action color. */
const railByColor: Record<NBAType["color"], string> = {
  gray: "bg-text-tertiary",
  green: "bg-[#15803D]",
  amber: "bg-[#B45309]",
  red: "bg-[#B91C1C]",
};

const softBgByColor: Record<NBAType["color"], string> = {
  gray: "bg-white",
  green: "bg-[#F6FBF7]",
  amber: "bg-[#FFFCF2]",
  red: "bg-[#FDF8F8]",
};

const softBorderByColor: Record<NBAType["color"], string> = {
  gray: "border-border",
  green: "border-[#DCFCE7]",
  amber: "border-[#FEF3C7]",
  red: "border-[#FECACA]",
};

export function NextBestAction({ action, onApply, onSnooze }: NextBestActionProps) {
  const colorStyle = actionColorStyles[action.color];
  const Icon = verbIcons[action.verb] ?? Search;
  const rail = railByColor[action.color];
  const softBg = softBgByColor[action.color];
  const softBorder = softBorderByColor[action.color];

  return (
    <div className={`${softBg} border ${softBorder} rounded-card overflow-hidden flex`}>
      <div className={`w-[3px] shrink-0 ${rail}`} />
      <div className="flex-1 px-5 py-3.5">
        <div className="flex items-start gap-3">
          {/* Verb + label */}
          <div className="shrink-0 pt-0.5">
            <div className="text-[9px] font-semibold text-text-tertiary uppercase tracking-[0.5px]">
              Next best action
            </div>
            <div
              className={`mt-1 inline-flex items-center gap-1 ${colorStyle.badgeBg} ${colorStyle.badgeText} text-[10px] font-semibold uppercase tracking-[0.4px] px-1.5 py-0.5 rounded-badge`}
            >
              <Icon size={10} strokeWidth={2} />
              {verbLabels[action.verb]}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-text-primary leading-snug">
              {action.headline}
            </h3>
            <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5">
              {action.reason}
            </p>
            <div className="text-[11px] text-text-tertiary mt-1.5">
              <span className="font-semibold text-text-secondary">Expected: </span>
              {action.expected_impact}
            </div>
          </div>

          {/* Actions */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            {onApply && (
              <button
                type="button"
                onClick={onApply}
                className="h-8 px-3.5 text-[12px] font-medium text-text-primary border border-border bg-white rounded-button hover:bg-surface-page transition-colors duration-150"
              >
                {action.cta_label}
              </button>
            )}
            {onSnooze && (
              <button
                type="button"
                onClick={onSnooze}
                className="text-[10px] font-medium text-text-tertiary hover:text-text-primary transition-colors px-1"
              >
                Snooze 24h
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
