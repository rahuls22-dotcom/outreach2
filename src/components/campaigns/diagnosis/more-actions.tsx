"use client";

import {
  Pause,
  RefreshCw,
  ArrowLeftRight,
  Plus,
  TrendingUp,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { SecondaryAction, ActionVerb } from "@/lib/types/diagnosis-payload";
import type { RenderableAction } from "../actions/use-action-flow";
import { fromSecondary } from "../actions/use-action-flow";

interface MoreActionsProps {
  actions: SecondaryAction[];
  /** Open the action flow modal for a given secondary action. */
  onOpenAction?: (action: RenderableAction) => void;
  onDismiss?: (actionId: string) => void;
  /** Optional hover handler used by the diagnosis-action linkage. */
  onHover?: (actionId: string | null) => void;
}

const verbIcons: Partial<Record<ActionVerb, LucideIcon>> = {
  PAUSE: Pause,
  REFRESH: RefreshCw,
  SHIFT_BUDGET: ArrowLeftRight,
  ADD_CREATIVE: Plus,
  ADD_ADSET: Plus,
  SCALE: TrendingUp,
  OPTIMIZE: Wand2,
};

export function MoreActions({ actions, onOpenAction, onDismiss, onHover }: MoreActionsProps) {
  if (actions.length === 0) return null;
  return (
    <div className="bg-white border border-border rounded-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border-subtle">
        <h3 className="text-section-header text-text-primary">More actions to close your shortfall</h3>
        <p className="text-[11px] text-text-tertiary mt-0.5">
          Apply alongside the next best action above to recover lost ground on goals.
        </p>
      </div>
      <div className="divide-y divide-border-subtle">
        {actions.map((a) => {
          const Icon = verbIcons[a.verb] ?? Plus;
          return (
            <div
              key={a.id}
              onMouseEnter={() => onHover?.(a.id)}
              onMouseLeave={() => onHover?.(null)}
              className="flex items-start gap-3 px-5 py-3 hover:bg-surface-page/60 transition-colors duration-150"
            >
              <div className="w-7 h-7 rounded-[6px] bg-surface-secondary flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={13} strokeWidth={1.5} className="text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-semibold text-text-primary leading-snug">
                  {a.headline}
                </h4>
                <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5">
                  {a.reason}
                </p>
                <div className="text-[11px] text-text-tertiary mt-1">
                  <span className="font-semibold text-text-secondary">Expected: </span>
                  {a.expected}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                {onOpenAction && (
                  <button
                    type="button"
                    onClick={() => onOpenAction(fromSecondary(a))}
                    className="h-7 px-3 text-[11px] font-medium bg-accent text-white rounded-button hover:bg-accent-hover transition-colors duration-150"
                  >
                    {a.cta_label}
                  </button>
                )}
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => onDismiss(a.id)}
                    className="text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
