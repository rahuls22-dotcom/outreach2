"use client";

import { ArrowRight, AlertTriangle, Check, Info, TrendingUp, ChevronRight } from "lucide-react";
import { SpotMark } from "./spot-mark";
import { RichText } from "./rich-text";
import type { SpotFinding, SpotKpi, SpotMessage, SpotPart, Verdict, GuidedKind } from "@/lib/spot/types";
import { useSpotStore } from "@/lib/spot/store";

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const map: Record<Verdict, { label: string; cls: string; Icon: typeof Check }> = {
    ok: { label: "On track", cls: "pill-ok", Icon: Check },
    warn: { label: "Intervene", cls: "pill-warn", Icon: AlertTriangle },
    err: { label: "Critical", cls: "pill-err", Icon: AlertTriangle },
    info: { label: "Note", cls: "pill-info", Icon: Info },
  };
  const { label, cls, Icon } = map[verdict];
  return (
    <span className={`pill ${cls} flex-shrink-0`} style={{ fontSize: 10.5 }}>
      <Icon size={11} /> {label}
    </span>
  );
}

function HeadlinePart({ text, verdict }: { text: string; verdict?: Verdict }) {
  return (
    <div
      className="flex items-start gap-2.5 mb-2.5"
      style={{
        padding: "10px 14px",
        background: "var(--spot-tint)",
        border: "1px solid var(--spot-stroke)",
        borderRadius: 10,
      }}
    >
      <div className="flex-1 text-[14px] leading-[1.55] text-text-primary">
        <RichText text={text} />
      </div>
      {verdict && <VerdictBadge verdict={verdict} />}
    </div>
  );
}

function FindingsPart({ items }: { items: SpotFinding[] }) {
  return (
    <div className="space-y-2 mb-2.5">
      {items.map((f, i) => {
        const accent =
          f.tone === "concern" ? "#F5A623" : f.tone === "positive" ? "#22C55E" : "#D4D4D4";
        return (
          <div
            key={i}
            className="card-base bg-white p-3"
            style={{ borderLeftWidth: 3, borderLeftColor: accent }}
          >
            <div className="text-[13px] font-semibold leading-tight mb-1">{f.title}</div>
            <div className="text-[12.5px] text-text-secondary leading-[1.45]">{f.body}</div>
            {f.evidence && f.evidence.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {f.evidence.map((e, j) => (
                  <span key={j} className="pill" style={{ fontSize: 10.5 }}>
                    {e}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function KpisPart({ items }: { items: SpotKpi[] }) {
  return (
    <div
      className="card-base bg-white p-3 mb-2.5 grid"
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 12 }}
    >
      {items.map((k, i) => {
        const color =
          k.good === true ? "var(--ok-fg)" : k.good === false ? "var(--err-fg)" : "var(--text-3)";
        return (
          <div key={i}>
            <div className="uplabel" style={{ fontSize: 10 }}>
              {k.label}
            </div>
            <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 600 }}>
              {k.value}
            </div>
            {k.delta && (
              <div className="tabular-nums" style={{ fontSize: 10.5, color }}>
                {k.delta}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HandoffPart({ kind, label, reason }: { kind: GuidedKind; label: string; reason: string }) {
  const openGuided = useSpotStore((s) => s.openGuided);
  const closePanel = useSpotStore((s) => s.closePanel);
  return (
    <button
      type="button"
      onClick={() => {
        openGuided({ kind });
        closePanel();
      }}
      className="card-base hover-row text-left w-full p-3 flex items-center gap-3 mb-2.5"
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-[7px] flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #FAF8F2 0%, #FFF 100%)", border: "1px solid #E8C97A" }}
      >
        <SpotMark size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] uppercase tracking-wider text-text-tertiary font-semibold mb-0.5">
          Guided flow
        </div>
        <div className="text-[13.5px] font-semibold">{label}</div>
        <div className="text-[11.5px] text-text-secondary mt-0.5">{reason}</div>
      </div>
      <ChevronRight size={14} className="text-text-tertiary flex-shrink-0" />
    </button>
  );
}

function PartRenderer({ part }: { part: SpotPart }) {
  switch (part.type) {
    case "headline":
      return <HeadlinePart text={part.text} verdict={part.verdict} />;
    case "findings":
      return <FindingsPart items={part.items} />;
    case "kpis":
      return <KpisPart items={part.items} />;
    case "handoff":
      return <HandoffPart kind={part.kind} label={part.label} reason={part.reason} />;
    case "text":
      return (
        <div className="text-[13px] leading-[1.55] mb-2.5">
          <RichText text={part.text} />
        </div>
      );
  }
}

export function MessageBubble({
  message,
  animate,
}: {
  message: SpotMessage;
  animate?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-3.5">
        <div
          style={{
            background: "var(--chat-user-bg)",
            color: "var(--chat-user-fg)",
            padding: "9px 13px",
            borderRadius: 12,
            borderBottomRightRadius: 4,
            fontSize: 13.5,
            maxWidth: "85%",
            lineHeight: 1.5,
          }}
        >
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className={`${animate ? "fadeUp" : ""} flex gap-2.5 mb-3.5`}>
      <SpotMark size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        {message.parts.map((p, i) => (
          <PartRenderer key={i} part={p} />
        ))}
      </div>
    </div>
  );
}

export function TypingDots() {
  return (
    <div className="flex gap-2.5 mb-3.5">
      <SpotMark size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <div
        className="inline-flex items-center gap-1 px-3 py-2 rounded-[10px]"
        style={{ background: "var(--spot-tint)", border: "1px solid var(--spot-stroke)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="spot-pulse"
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--text-2)",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
