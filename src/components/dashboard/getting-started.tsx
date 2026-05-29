"use client";

import { useRouter } from "next/navigation";
import { Check, X, Rocket } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function GettingStartedChecklist() {
  const router = useRouter();
  const { gettingStartedChecklist, checklistDismissed, dismissChecklist } = useAppStore();

  if (checklistDismissed) return null;

  const completed = gettingStartedChecklist.filter((i) => i.completed).length;
  const total = gettingStartedChecklist.length;
  const progress = Math.round((completed / total) * 100);

  return (
    <div className="bg-white border border-border rounded-card p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-metric bg-accent/10 flex items-center justify-center">
            <Rocket size={18} strokeWidth={1.5} className="text-accent" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-text-primary">
              Getting Started
            </h3>
            <p className="text-[12px] text-text-secondary">
              {completed}/{total} completed
            </p>
          </div>
        </div>
        <button
          onClick={dismissChecklist}
          className="p-1 text-text-tertiary hover:text-text-primary rounded-button hover:bg-surface-secondary transition-colors"
          title="Dismiss"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-surface-secondary rounded-full mb-4">
        <div
          className="h-1.5 bg-accent rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1">
        {gettingStartedChecklist.map((item) => (
          <button
            key={item.key}
            onClick={() => !item.completed && router.push(item.href)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] transition-colors text-left ${
              item.completed
                ? "cursor-default"
                : "hover:bg-surface-page cursor-pointer"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                item.completed
                  ? "bg-[#F0FDF4] text-[#15803D]"
                  : "border-2 border-border"
              }`}
            >
              {item.completed && <Check size={12} strokeWidth={2.5} />}
            </div>
            <span
              className={`text-[13px] ${
                item.completed
                  ? "text-text-tertiary line-through"
                  : "text-text-primary font-medium"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
