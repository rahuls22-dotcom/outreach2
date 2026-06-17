"use client";

// The Refinement Studio — the "room off the spine".
//
// A full-screen takeover (portal, so it escapes the canvas pane) where
// the user iterates on ONE artifact with the creative agent. The Spot
// workflow ribbon stays pinned on top so the user never feels like
// they left the building. Layout inverts Spot's emphasis: in Spot the
// chat leads and the canvas supports; here the ARTIFACT is the hero
// and the agent chat is a side rail — the object of work is the
// creative, not the conversation.
//
// Versions are non-destructive: every agent move appends to the
// filmstrip, any older version restores with one click. Committing a
// version is the single approval — it updates the plan, emits a
// ledger event to Spot's thread, and the workflow never re-asks.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  Cog,
  Trash2,
} from "lucide-react";
import {
  useRefinementStore,
  STUDIO_AGENT,
  type RefinementSession,
  type RefinementVersion,
  type StudioChatMessage,
} from "@/lib/spot/refinement";

function hueGradient(hue: number): string {
  return `linear-gradient(135deg, hsl(${hue} 70% 52%) 0%, hsl(${(hue + 40) % 360} 60% 38%) 100%)`;
}

export function RefinementStudio() {
  const studioId = useRefinementStore((s) => s.studioId);
  const sessions = useRefinementStore((s) => s.sessions);
  const closeStudio = useRefinementStore((s) => s.closeStudio);

  const session = studioId ? sessions[studioId] : null;

  // ESC = back to Spot (session persists — nothing is lost).
  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeStudio();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session, closeStudio]);

  if (!session || typeof document === "undefined") return null;

  return createPortal(<StudioSurface session={session} />, document.body);
}

function StudioSurface({ session }: { session: RefinementSession }) {
  const closeStudio = useRefinementStore((s) => s.closeStudio);
  const discardSession = useRefinementStore((s) => s.discardSession);
  const commitVersion = useRefinementStore((s) => s.commitVersion);

  const active = session.versions[session.activeVersion - 1] ?? session.versions[0];
  const hasIterations = session.versions.length > 1;
  const personaShort = session.persona?.split(" · ")[0];
  // The persona already has its own crumb — strip it from the artifact
  // crumb so the trail doesn't read "Parent › Angle 2 · Parent".
  const artifactCrumb = personaShort
    ? session.artifactLabel.replace(` · ${personaShort}`, "")
    : session.artifactLabel;

  return (
    <div
      className="fixed inset-0 z-[140] flex flex-col fadeUp"
      style={{ background: "#131311", color: "#F5F4EF" }}
    >
      {/* ── Workflow ribbon — the spine stays visible ─────────── */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ height: 52, borderBottom: "1px solid #262623", background: "#161614" }}
      >
        <button
          type="button"
          onClick={closeStudio}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button text-[11.5px] font-medium transition-colors"
          style={{ border: "1px solid #2F2F2A", color: "#E6E6E0", background: "transparent" }}
        >
          <ArrowLeft size={12} />
          Back to Spot
        </button>

        {/* Breadcrumb · product › plan › persona › artifact */}
        <div className="flex items-center gap-1 min-w-0 text-[11.5px]" style={{ color: "#8A8980" }}>
          <span className="truncate">{session.productName}</span>
          <ChevronRight size={11} className="flex-shrink-0" />
          <span>Campaign plan</span>
          {personaShort && (
            <>
              <ChevronRight size={11} className="flex-shrink-0" />
              <span className="truncate">{personaShort}</span>
            </>
          )}
          <ChevronRight size={11} className="flex-shrink-0" />
          <span className="truncate font-medium" style={{ color: "#E6E6E0" }}>
            {artifactCrumb}
          </span>
        </div>

        <span
          className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full flex-shrink-0"
          style={{ background: "rgba(245,166,35,0.10)", border: "1px solid rgba(245,166,35,0.32)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#F5A623" }}
          />
          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#F0BE66" }}>
            In refinement · with {STUDIO_AGENT.name}
          </span>
        </span>

        {session.scopeNote && (
          <span
            className="inline-flex items-center h-6 px-2 rounded-full text-[10.5px] flex-shrink-0"
            style={{ border: "1px solid #2F2F2A", color: "#C8C8C2" }}
          >
            {session.scopeNote}
          </span>
        )}

        <span className="flex-1" />

        {hasIterations && !session.committedVersion && (
          <button
            type="button"
            onClick={() => discardSession(session.artifactId)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button text-[11px] transition-colors"
            style={{ border: "1px solid #2F2F2A", color: "#8A8980", background: "transparent" }}
            title="Throw away every version and keep the original"
          >
            <Trash2 size={11} />
            Discard exploration
          </button>
        )}
      </div>

      {/* ── Body · artifact hero + agent rail ─────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* Stage — the artifact is the hero */}
        <div className="flex-1 min-w-0 flex flex-col items-center px-8 pt-7 pb-5 overflow-y-auto">
          {session.kind === "creative" ? (
            <CreativeStage session={session} active={active} />
          ) : (
            <FormStage active={active} productName={session.productName} />
          )}

          {/* Version filmstrip — non-destructive, restore = one click */}
          <Filmstrip session={session} />

          {/* Commit gate — the single approval */}
          <div className="mt-5 flex flex-col items-center gap-1.5">
            {session.committedVersion === session.activeVersion && session.committedVersion ? (
              <span
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-button text-[12.5px] font-medium"
                style={{ background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.4)", color: "#5EE08A" }}
              >
                <Check size={13} strokeWidth={2.4} />
                v{session.activeVersion} is in the plan
              </span>
            ) : (
              <button
                type="button"
                onClick={commitVersion}
                disabled={!hasIterations}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-button text-[12.5px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#F5F4EF", color: "#161614" }}
              >
                Use v{session.activeVersion} in the plan
                <ArrowRight size={13} strokeWidth={2.2} />
              </button>
            )}
            <span className="text-[10.5px]" style={{ color: "#8A8980" }}>
              {hasIterations
                ? "One approval — the plan updates and Spot won't ask again."
                : `Iterate with ${STUDIO_AGENT.name} to create v2 — v1 is already in the plan.`}
            </span>
          </div>
        </div>

        {/* Agent rail — the conversation stays in this room */}
        <AgentRail session={session} />
      </div>
    </div>
  );
}

/* ─── Creative stage ───────────────────────────────────────────── */

function CreativeStage({
  session,
  active,
}: {
  session: RefinementSession;
  active: RefinementVersion;
}) {
  return (
    <div className="w-full max-w-[480px] flex flex-col items-center">
      <div
        className="relative w-full rounded-[12px] overflow-hidden"
        style={{ background: "#0A0A09", border: "1px solid #2A2A26", height: "min(46vh, 430px)" }}
      >
        {session.baseSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.baseSrc}
            alt={active.hook ?? session.baseHook}
            className="w-full h-full object-contain transition-[filter] duration-300"
            style={{ filter: active.look || "none" }}
          />
        ) : (
          <span
            className="block w-full h-full transition-[filter] duration-300"
            style={{ background: hueGradient(session.baseHue), filter: active.look || "none" }}
          />
        )}
        <span
          className="absolute top-2 left-2 text-[9px] px-1.5 h-[19px] inline-flex items-center rounded-full font-semibold tabular-nums"
          style={{ background: "rgba(0,0,0,0.62)", color: "#fff", backdropFilter: "blur(4px)" }}
        >
          v{active.n}
        </span>
        {session.format && (
          <span
            className="absolute top-2 right-2 text-[9px] px-1.5 h-[19px] inline-flex items-center rounded-full"
            style={{ background: "rgba(0,0,0,0.62)", color: "#fff", backdropFilter: "blur(4px)" }}
          >
            {session.format}
          </span>
        )}
      </div>
      <div className="mt-3 text-center">
        <div className="text-[15px] font-medium leading-snug" style={{ color: "#F5F4EF" }}>
          “{active.hook ?? session.baseHook}”
        </div>
        <div className="text-[11px] mt-1" style={{ color: "#8A8980" }}>
          {active.n === 1 ? "Original creative — as built by the launch flow" : active.note}
        </div>
      </div>
    </div>
  );
}

/* ─── Form stage ───────────────────────────────────────────────── */

function FormStage({ active, productName }: { active: RefinementVersion; productName: string }) {
  const fields = active.fields ?? [];
  return (
    <div className="w-full max-w-[480px] flex flex-col items-center">
      <div
        className="rounded-[20px] overflow-hidden w-[250px]"
        style={{ border: "6px solid #0A0A09", background: "#fff" }}
      >
        <div className="px-4 py-3" style={{ background: "#1877F2" }}>
          <div className="text-[10px] text-white/80">{productName}</div>
          <div className="text-[13px] font-semibold text-white leading-tight">
            Book your free trial
          </div>
        </div>
        <div className="p-4 space-y-2.5 bg-white">
          {fields.map((f) => (
            <div key={f} className="fadeUp">
              <div className="text-[9px] text-[#65676B] mb-1">{f}</div>
              <div
                className="h-6 rounded-[5px]"
                style={{ background: "#F0F2F5", border: "1px solid #E4E6EB" }}
              />
            </div>
          ))}
          <div
            className="h-8 rounded-[6px] mt-2 flex items-center justify-center text-[11px] font-semibold text-white"
            style={{ background: "#1877F2" }}
          >
            Submit
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-[13px] font-medium" style={{ color: "#F5F4EF" }}>
          Meta instant form · {fields.length} fields
        </div>
        <div className="text-[11px] mt-1" style={{ color: "#8A8980" }}>
          {active.n === 1 ? "Original form — attached to every angle" : active.note}
        </div>
        {active.impact && (
          <div
            className="mt-2 inline-flex items-start gap-1.5 text-[10.5px] leading-[1.45] rounded-[6px] px-2 py-1.5 text-left"
            style={{ background: "rgba(245,166,35,0.10)", color: "#F0BE66", border: "1px solid rgba(245,166,35,0.32)" }}
          >
            {active.impact}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Filmstrip ────────────────────────────────────────────────── */

function Filmstrip({ session }: { session: RefinementSession }) {
  const selectVersion = useRefinementStore((s) => s.selectVersion);
  return (
    <div className="mt-5 flex items-start gap-2.5">
      {session.versions.map((v) => {
        const isActive = v.n === session.activeVersion;
        const isCommitted = v.n === session.committedVersion;
        return (
          <button
            key={v.n}
            type="button"
            onClick={() => selectVersion(v.n)}
            className="flex flex-col items-center gap-1 group"
            title={v.note}
          >
            <span
              className="relative block w-[72px] h-[54px] rounded-[8px] overflow-hidden transition-shadow"
              style={{
                border: isActive ? "2px solid #9B9B9B" : "1px solid #2A2A26",
                background: "#0A0A09",
              }}
            >
              {session.kind === "creative" ? (
                session.baseSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.baseSrc}
                    alt={`v${v.n}`}
                    className="w-full h-full object-cover"
                    style={{ filter: v.look || "none" }}
                  />
                ) : (
                  <span
                    className="block w-full h-full"
                    style={{ background: hueGradient(session.baseHue), filter: v.look || "none" }}
                  />
                )
              ) : (
                <span
                  className="flex w-full h-full items-center justify-center text-[10px] font-medium"
                  style={{ color: "#C8C8C2" }}
                >
                  {(v.fields ?? []).length} fields
                </span>
              )}
              {isCommitted && (
                <span
                  className="absolute bottom-1 right-1 inline-flex items-center justify-center w-[14px] h-[14px] rounded-full"
                  style={{ background: "#22C55E", color: "#06250F" }}
                >
                  <Check size={9} strokeWidth={3} />
                </span>
              )}
            </span>
            <span
              className="text-[9.5px] tabular-nums"
              style={{ color: isActive ? "#F0BE66" : "#8A8980" }}
            >
              v{v.n}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Agent rail ───────────────────────────────────────────────── */

function AgentRail({ session }: { session: RefinementSession }) {
  const sendToAgent = useRefinementStore((s) => s.sendToAgent);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [session.chat.length, session.agentBusy]);

  const send = () => {
    const text = draft.trim();
    if (!text || session.agentBusy) return;
    setDraft("");
    sendToAgent(text);
  };

  return (
    <div
      className="w-[390px] flex-shrink-0 flex flex-col"
      style={{ borderLeft: "1px solid #262623", background: "#161614" }}
    >
      {/* Agent header — proves the context travelled with the hand-off */}
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid #262623" }}>
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold leading-tight">{STUDIO_AGENT.name}</div>
          <div className="text-[10.5px] truncate" style={{ color: "#8A8980" }}>
            {STUDIO_AGENT.role} · scoped to {session.artifactLabel}
            {session.scopeNote ? ` · ${session.scopeNote}` : ""}
          </div>
        </div>
      </div>

      {/* Chat — stays in this room forever */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {session.chat.map((m, i) => (
          <StudioBubble key={i} message={m} />
        ))}
        {session.agentBusy && (
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#8A8980" }}>
            <Cog size={11} className="animate-spin" style={{ animationDuration: "2s" }} />
            {STUDIO_AGENT.name} is sketching v{session.versions.length + 1}…
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-3 pb-3 pt-1">
        <div
          className="flex items-end gap-1.5 rounded-[10px] px-3 py-2"
          style={{ background: "#1A1A18", border: "1px solid #2A2A26" }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Warmer · brighter · shorter headline · add urgency…"
            className="flex-1 bg-transparent resize-none outline-none text-[12px] leading-[1.5] placeholder:text-[#5A5A54]"
            style={{ color: "#F5F4EF", maxHeight: 96 }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || session.agentBusy}
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
            style={{ background: "#F5F4EF", color: "#161614" }}
          >
            <ArrowUp size={13} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StudioBubble({ message }: { message: StudioChatMessage }) {
  const selectVersion = useRefinementStore((s) => s.selectVersion);
  const escalateToSpot = useRefinementStore((s) => s.escalateToSpot);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="text-[12px] leading-[1.5] px-3 py-1.5 rounded-[10px] rounded-br-[4px] max-w-[85%]"
          style={{ background: "#F5F4EF", color: "#161614" }}
        >
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="fadeUp">
      <div className="text-[12px] leading-[1.55]" style={{ color: "#D8D8D2" }}>
        {message.text}
      </div>
      {message.version && (
        <button
          type="button"
          onClick={() => selectVersion(message.version!)}
          className="mt-1.5 inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10.5px] font-medium tabular-nums transition-colors"
          style={{ border: "1px solid rgba(155,155,155,0.4)", color: "#C7C4BC", background: "rgba(155,155,155,0.08)" }}
        >
          v{message.version} on the stage
        </button>
      )}
      {message.lane && (
        <button
          type="button"
          onClick={() => escalateToSpot(message.laneAsk ?? message.text)}
          className="mt-1.5 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button text-[11px] font-medium transition-colors"
          style={{ background: "#F5F4EF", color: "#161614" }}
        >
          Hand this to Spot
          <ArrowRight size={11} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}
