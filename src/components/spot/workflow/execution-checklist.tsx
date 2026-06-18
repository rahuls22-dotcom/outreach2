"use client";

// ExecutionChecklist — a live deploy checklist. Spot's plans are one-time
// "do this now" plans, so when one is deployed we show the exact steps being
// executed, ticking off one at a time. Used by the launch-deploy step and the
// diagnostic (scale / optimize) deploy step. Dark-themed for the canvas.

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

// One accent for the dark deploy canvas — a calm green for completion. The
// gradient bar and AI-slop "✓" glyph are gone; motion is a slow pulsing ring,
// not a spinning gear, so the deploy reads composed rather than frantic.
const DONE = "#4ADE80";

export function ExecutionChecklist({
  title,
  subtitle,
  items,
  perItemMs = 1200,
}: {
  title: string;
  subtitle?: string;
  items: string[];
  perItemMs?: number;
}) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    setDone(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    items.forEach((_, i) => {
      timers.push(setTimeout(() => setDone(i + 1), perItemMs * (i + 1)));
    });
    return () => timers.forEach(clearTimeout);
  }, [items, perItemMs]);

  const allDone = done >= items.length;
  const pct = items.length ? (done / items.length) * 100 : 0;

  return (
    <div className="px-7 py-9 max-w-[560px] mx-auto" style={{ color: "#F5F4EF" }}>
      <style>{`
        @keyframes deployRingPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.86); }
        }
        .deploy-run-ring {
          width: 13px; height: 13px; border-radius: 9999px;
          border: 1.5px solid; box-sizing: border-box;
          animation: deployRingPulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) { .deploy-run-ring { animation: none; } }
      `}</style>

      {/* Header — one quiet line: what's deploying + a single live/done status. */}
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
        <span
          className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-[11px] font-medium flex-shrink-0"
          style={
            allDone
              ? { background: "rgba(74,222,128,0.12)", color: DONE }
              : { background: "rgba(255,255,255,0.06)", color: "#C7C4BC" }
          }
        >
          {allDone ? <Check size={12} strokeWidth={2.6} /> : <span className="deploy-run-ring" style={{ borderColor: "#C7C4BC", width: 7, height: 7, animation: "deployRingPulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite" }} />}
          {allDone ? "Live" : "Deploying"}
        </span>
      </div>
      {subtitle && (
        <p className="text-[12.5px] leading-relaxed max-w-[44ch]" style={{ color: "#A8A8A0" }}>{subtitle}</p>
      )}

      {/* One progress affordance — a slim bar, no competing readout. */}
      <div className="mt-7 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            background: allDone ? DONE : "#C7C4BC",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>

      {/* Checklist */}
      <ul className="mt-7 space-y-3.5">
        {items.map((it, i) => {
          const isDone = i < done;
          const isRunning = i === done && !allDone;
          return (
            <li
              key={i}
              className="flex items-start gap-3 text-[13.5px] leading-snug transition-colors duration-500"
              style={{ color: isDone ? "#9B9A92" : isRunning ? "#F5F4EF" : "#7A7970", fontWeight: isRunning ? 500 : 400 }}
            >
              <span className="mt-[1px] w-[15px] h-[15px] flex items-center justify-center flex-shrink-0">
                {isDone ? (
                  <span
                    className="inline-flex items-center justify-center w-[15px] h-[15px] rounded-full"
                    style={{ background: "rgba(74,222,128,0.12)" }}
                  >
                    <Check size={10} strokeWidth={2.8} style={{ color: DONE }} />
                  </span>
                ) : isRunning ? (
                  <span className="deploy-run-ring" style={{ borderColor: "#C7C4BC" }} />
                ) : (
                  <span className="w-[11px] h-[11px] rounded-full" style={{ boxShadow: "inset 0 0 0 1.5px #3A3A35" }} />
                )}
              </span>
              <span className="flex-1" style={{ textDecoration: isDone ? "line-through" : "none", textDecorationColor: "#3A3A35" }}>
                {it}
              </span>
            </li>
          );
        })}
      </ul>

      {allDone && (
        <p className="mt-9 pt-5 text-[11.5px] leading-relaxed border-t" style={{ color: "#A8A8A0", borderColor: "rgba(255,255,255,0.08)" }}>
          All steps live. I&apos;ll report back here as data lands.
        </p>
      )}
    </div>
  );
}

/** Publish steps for the launch-deploy phase. */
export const LAUNCH_DEPLOY_CHECKLIST = [
  "Provisioning Meta Ads Manager handles",
  "Publishing 12 creatives + 6 reels to Meta",
  "Pushing 9 ad sets across 3 campaigns",
  "Deploying 3 landing pages to the CDN",
  "Publishing the lead-gen forms",
  "Activating the Meta pixel + Conversion API",
  "Wiring the WhatsApp Business inbox",
  "Verifying tracking — firing test events",
  "Arming the watchers · CPL · sentiment · frequency",
];
