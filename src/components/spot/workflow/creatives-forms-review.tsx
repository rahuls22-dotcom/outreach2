"use client";

// Creatives + lead form review — the dark canvas surface (right panel).
// Adheres to the right-panel dark-mode principle; NOT a markdown file.
//
// Control is GRANULAR — nothing is approved or refined all at once:
//   · per ANGLE — each creative card has its own Approve + Refine.
//   · per PERSONA — an "Approve all" for that persona's angles.
//   · per SIZE — each angle expands to 1:1 / 4:5 / 9:16, and any single
//     size can be refined on its own (you might dislike just one size).
//
// Refine opens the Refinement Studio — a room off the spine — scoped to
// exactly what you clicked. Iris owns both creatives and the lead form.
// Iteration happens in the studio; only the committed version and a
// ledger event come back. Committing in the studio IS the approval
// (approve once — this board never re-asks). A card with an
// uncommitted exploration shows a resume/discard strip so abandoned
// sessions never become dead ends.

import { useState } from "react";
import {
  ImageIcon,
  FileText,
  Check,
  ChevronDown,
} from "lucide-react";
import { CREATIVES_BY_PERSONA } from "./launch-build-steps";
import { CREATIVE_AGENT } from "@/lib/creatives-studio-data";
import type { SpotWorkflow } from "@/lib/spot/workflow";
import {
  useRefinementStore,
  statusOf,
  type ArtifactRefinementStatus,
  type OpenStudioArgs,
} from "@/lib/spot/refinement";
import { RefinementStudio } from "./refinement-studio";

const TOTAL_ANGLES = CREATIVES_BY_PERSONA.reduce((s, g) => s + g.creatives.length, 0);

const CREATIVE_SIZES = [
  { key: "1x1", label: "1:1", dims: "1080×1080", ratio: "1 / 1" },
  { key: "4x5", label: "4:5", dims: "1080×1350", ratio: "4 / 5" },
  { key: "9x16", label: "9:16", dims: "1080×1920", ratio: "9 / 16" },
];

const META_FORM_FIELDS = ["Full name", "Phone number", "Email", "Preferred batch / timing"];

const FORM_ARTIFACT_ID = "lead-form";

function hueGradient(hue: number): string {
  return `linear-gradient(135deg, hsl(${hue} 70% 52%) 0%, hsl(${(hue + 40) % 360} 60% 38%) 100%)`;
}

function productOf(workflow: SpotWorkflow): { id: string; name: string } {
  if (
    workflow.kind === "launch-campaign" ||
    workflow.kind === "scale" ||
    workflow.kind === "optimize" ||
    workflow.kind === "test-angles"
  ) {
    return { id: workflow.productId ?? "product", name: workflow.productName };
  }
  return { id: "product", name: "this project" };
}

export function CreativesFormsReview({ workflow }: { workflow: SpotWorkflow }) {
  const product = productOf(workflow);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [formApproved, setFormApproved] = useState(false);

  const sessions = useRefinementStore((s) => s.sessions);
  const openStudio = useRefinementStore((s) => s.openStudio);
  const discardSession = useRefinementStore((s) => s.discardSession);

  const agent = CREATIVE_AGENT.name;

  // Committing in the studio IS the approval — union it in so the
  // board never asks twice for something the user already approved.
  const committedIds = Object.values(sessions)
    .filter((s) => s.kind === "creative" && s.committedVersion)
    .map((s) => s.artifactId);
  const effectiveApproved = new Set([...approved, ...committedIds]);
  const approvedCount = effectiveApproved.size;

  const formStatus = statusOf(sessions, FORM_ARTIFACT_ID);
  const formFields = formStatus.state === "committed" && formStatus.fields
    ? formStatus.fields
    : META_FORM_FIELDS;
  const effectiveFormApproved = formApproved || formStatus.state === "committed";

  const studioArgsFor = (
    group: (typeof CREATIVES_BY_PERSONA)[number],
    c: (typeof CREATIVES_BY_PERSONA)[number]["creatives"][number],
    angleNum: number,
    size?: string,
  ): OpenStudioArgs => ({
    artifactId: c.id,
    kind: "creative",
    artifactLabel: `Angle ${angleNum} · ${group.persona.split(" · ")[0]}`,
    persona: group.persona.split(" · ")[0],
    personaPain: group.pain,
    format: c.format,
    scopeNote: size ? `${size} only` : undefined,
    productName: product.name,
    baseHook: c.hook,
    baseSrc: c.src,
    baseHue: c.hue,
  });

  const toggleAngle = (id: string) =>
    setApproved((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const approvePersona = (ids: string[]) =>
    setApproved((s) => {
      const n = new Set(s);
      const allOn = ids.every((id) => n.has(id) || committedIds.includes(id));
      ids.forEach((id) => {
        if (committedIds.includes(id)) return; // committed = approved, immutable here
        if (allOn) n.delete(id);
        else n.add(id);
      });
      return n;
    });

  return (
    <div className="px-6 py-6 max-w-[940px] mx-auto" style={{ color: "#F5F4EF" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.32)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#5EE08A" }}>
              Ready to review
            </span>
          </span>
          <span className="text-[11px]" style={{ color: "#8A8980" }}>
            {product.name}
          </span>
        </div>
        <h1 className="text-[19px] font-semibold tracking-tight">Creatives &amp; lead form</h1>
        <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "#A8A8A0" }}>
          Approve or refine each angle on its own — by persona, by angle, even by size. Refine opens
          the studio with {agent}{" "}right here, scoped to exactly what you click. Committing a
          version there is the approval — you won&apos;t be asked twice.
        </p>
      </div>

      {/* ── Creatives ─────────────────────────────────────────── */}
      <section className="mb-7">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={14} style={{ color: "#9B9B9B" }} />
          <span className="text-[13.5px] font-semibold">Creatives</span>
          <span className="text-[10.5px]" style={{ color: "#8A8980" }}>
            · {approvedCount}/{TOTAL_ANGLES} angles approved
          </span>
          <span className="flex-1" />
          <ProgressDots total={TOTAL_ANGLES} done={approvedCount} />
        </div>

        <div className="space-y-6">
          {CREATIVES_BY_PERSONA.map((group) => {
            const ids = group.creatives.map((c) => c.id);
            const personaDone = ids.filter((id) => effectiveApproved.has(id)).length;
            const allOn = personaDone === ids.length;
            const personaName = group.persona.split(" · ")[0];
            return (
              <div key={group.persona}>
                {/* Persona row */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.swatch }} />
                  <span className="text-[12.5px] font-semibold">{personaName}</span>
                  <span className="text-[10.5px] truncate" style={{ color: "#8A8980" }}>
                    · {group.sub}
                  </span>
                  <span className="text-[10px]" style={{ color: "#8A8980" }}>
                    · {personaDone}/{ids.length}
                  </span>
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={() => approvePersona(ids)}
                    className="inline-flex items-center gap-1 h-6 px-2 rounded-button text-[10.5px] font-medium transition-colors"
                    style={
                      allOn
                        ? { background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.4)", color: "#5EE08A" }
                        : { background: "transparent", border: "1px solid #2F2F2A", color: "#C8C8C2" }
                    }
                  >
                    {allOn ? <Check size={11} strokeWidth={2.4} /> : null}
                    {allOn ? "Persona approved" : "Approve all"}
                  </button>
                </div>

                {/* Angle cards */}
                <div className="grid grid-cols-2 gap-3">
                  {group.creatives.map((c, i) => (
                    <AngleCard
                      key={c.id}
                      creative={c}
                      angleNum={i + 1}
                      approved={effectiveApproved.has(c.id)}
                      refine={statusOf(sessions, c.id)}
                      agentName={agent}
                      onApprove={() => toggleAngle(c.id)}
                      onRefine={() => openStudio(studioArgsFor(group, c, i + 1))}
                      onRefineSize={(size) => openStudio(studioArgsFor(group, c, i + 1, size))}
                      onDiscard={() => discardSession(c.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Lead form · one Meta instant form ─────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3.5">
          <FileText size={14} style={{ color: "#9B9B9B" }} />
          <span className="text-[13.5px] font-semibold">Lead form</span>
          <span className="text-[10.5px]" style={{ color: "#8A8980" }}>
            · 1 Meta instant form · all angles
          </span>
          {formStatus.state === "committed" && (
            <RefinedBadge version={formStatus.version} agentName={agent} />
          )}
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => formStatus.state !== "committed" && setFormApproved((v) => !v)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button text-[11.5px] font-medium transition-colors"
            style={
              effectiveFormApproved
                ? { background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.4)", color: "#5EE08A" }
                : { background: "#F5F4EF", color: "#161614" }
            }
          >
            {effectiveFormApproved ? (
              <>
                <Check size={12} strokeWidth={2.4} /> Approved
              </>
            ) : (
              "Approve form"
            )}
          </button>
          <RefineButton
            agentName={agent}
            onClick={() =>
              openStudio({
                artifactId: FORM_ARTIFACT_ID,
                kind: "form",
                artifactLabel: "Lead form",
                productName: product.name,
                baseHook: "Book your free trial",
                baseHue: 215,
                baseFields: META_FORM_FIELDS,
              })
            }
          />
        </div>
        <div className="rounded-[10px] p-4 flex items-start gap-5" style={{ background: "#1A1A18", border: "1px solid #2A2A26" }}>
          <MetaLeadFormPreview fields={formFields} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold">Meta instant lead form</div>
            <div className="text-[11.5px] mt-1 leading-relaxed" style={{ color: "#A8A8A0" }}>
              One native Meta form, attached to every creative angle. Pre-fills name, phone and email
              from the lead&apos;s Meta profile, so it submits in two taps.
            </div>
            <div className="text-[9.5px] uppercase tracking-wider font-semibold mt-3 mb-1.5" style={{ color: "#8A8980" }}>
              Fields
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {formFields.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[11.5px]" style={{ color: "#C8C8C2" }}>
                  <Check size={11} strokeWidth={2.4} style={{ color: "#5EE08A" }} />
                  {f}
                </li>
              ))}
            </ul>
            {formStatus.state === "unmerged" && (
              <UnmergedStrip
                latest={formStatus.latest}
                onResume={() =>
                  openStudio({
                    artifactId: FORM_ARTIFACT_ID,
                    kind: "form",
                    artifactLabel: "Lead form",
                    productName: product.name,
                    baseHook: "Book your free trial",
                    baseHue: 215,
                    baseFields: META_FORM_FIELDS,
                  })
                }
                onDiscard={() => discardSession(FORM_ARTIFACT_ID)}
              />
            )}
          </div>
        </div>
      </section>

      {/* The room off the spine — portals to <body>, renders only
          while a session's studio is open. */}
      <RefinementStudio />
    </div>
  );
}

/* ─── pieces ──────────────────────────────────────────── */

function ProgressDots({ total, done }: { total: number; done: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: i < done ? "#5EE08A" : "#3A3A35" }}
        />
      ))}
    </span>
  );
}

function RefinedBadge({ version, agentName }: { version: number; agentName: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 h-[19px] px-1.5 rounded-full text-[9.5px] font-medium tabular-nums"
      style={{ background: "rgba(155,155,155,0.10)", border: "1px solid rgba(155,155,155,0.35)", color: "#C7C4BC" }}
      title={`Refined in the studio with ${agentName}`}
    >
      v{version} · {agentName}
    </span>
  );
}

function UnmergedStrip({
  latest,
  onResume,
  onDiscard,
}: {
  latest: number;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      className="mt-3 flex items-center gap-2 rounded-[8px] px-2.5 py-2"
      style={{ background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.28)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#F5A623" }} />
      <span className="text-[10.5px] flex-1 min-w-0 truncate" style={{ color: "#F0BE66" }}>
        Unmerged exploration · v{latest} — nothing changes until you commit
      </span>
      <button
        type="button"
        onClick={onResume}
        className="h-6 px-2 rounded-button text-[10.5px] font-medium flex-shrink-0"
        style={{ background: "#F5F4EF", color: "#161614" }}
      >
        Resume
      </button>
      <button
        type="button"
        onClick={onDiscard}
        className="h-6 px-2 rounded-button text-[10.5px] flex-shrink-0"
        style={{ border: "1px solid #2F2F2A", color: "#8A8980", background: "transparent" }}
      >
        Discard
      </button>
    </div>
  );
}

function RefineButton({ agentName, onClick }: { agentName: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button text-[11.5px] transition-colors"
      style={{ background: "transparent", border: "1px solid #2F2F2A", color: "#C8C8C2" }}
      title={`Refine with ${agentName} in the studio`}
    >
      Refine
    </button>
  );
}

function AngleCard({
  creative,
  angleNum,
  approved,
  refine,
  agentName,
  onApprove,
  onRefine,
  onRefineSize,
  onDiscard,
}: {
  creative: { id: string; hook: string; format: string; src?: string; hue: number };
  angleNum: number;
  approved: boolean;
  refine: ArtifactRefinementStatus;
  agentName: string;
  onApprove: () => void;
  onRefine: () => void;
  onRefineSize: (size: string) => void;
  onDiscard: () => void;
}) {
  const [showSizes, setShowSizes] = useState(false);
  const committed = refine.state === "committed" ? refine : null;
  // Committed sessions replace the card's face: the plan now holds vN,
  // so the board shows vN — hook and grade included.
  const hook = committed?.hook ?? creative.hook;
  const look = committed?.look || undefined;
  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{ background: "#1A1A18", border: approved ? "1px solid rgba(34,197,94,0.45)" : "1px solid #2A2A26" }}
    >
      {/* Preview — show the WHOLE creative (contain), never cropped, so it
          stays readable as the card widens on large screens. */}
      <div className="relative" style={{ height: 188, background: "#0A0A09" }}>
        {creative.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creative.src}
            alt={hook}
            className="w-full h-full object-contain"
            style={{ filter: look ?? "none" }}
          />
        ) : (
          <span className="block w-full h-full" style={{ background: hueGradient(creative.hue), filter: look ?? "none" }} />
        )}
        <span
          className="absolute top-1.5 left-1.5 text-[8.5px] px-1.5 h-[18px] inline-flex items-center rounded-full font-medium"
          style={{ background: "rgba(0,0,0,0.62)", color: "#fff", backdropFilter: "blur(4px)" }}
        >
          Angle {angleNum}
        </span>
        <span
          className="absolute top-1.5 right-1.5 text-[8.5px] px-1.5 h-[18px] inline-flex items-center rounded-full"
          style={{ background: "rgba(0,0,0,0.62)", color: "#fff", backdropFilter: "blur(4px)" }}
        >
          {creative.format}
        </span>
        {approved && (
          <span
            className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 text-[8.5px] px-1.5 h-[18px] rounded-full font-medium"
            style={{ background: "rgba(34,197,94,0.85)", color: "#06250F" }}
          >
            <Check size={9} strokeWidth={2.6} />
            {committed ? `Approved · v${committed.version}` : "Approved"}
          </span>
        )}
      </div>

      {/* Hook */}
      <div className="px-3 pt-2 pb-1 flex items-start gap-1.5">
        <div className="text-[11.5px] leading-snug flex-1 min-w-0" style={{ color: "#E6E6E0" }}>
          {hook}
        </div>
        {committed && <RefinedBadge version={committed.version} agentName={agentName} />}
      </div>

      {/* Per-angle actions */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-t" style={{ borderColor: "#262623" }}>
        <button
          type="button"
          onClick={() => !committed && onApprove()}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-button text-[11px] font-medium transition-colors"
          title={committed ? "Approved when you committed in the studio" : undefined}
          style={
            approved
              ? { background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.4)", color: "#5EE08A" }
              : { background: "#F5F4EF", color: "#161614" }
          }
        >
          {approved ? (
            <>
              <Check size={11} strokeWidth={2.4} /> Approved
            </>
          ) : (
            "Approve"
          )}
        </button>
        <button
          type="button"
          onClick={onRefine}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-button text-[11px] transition-colors"
          style={{ background: "transparent", border: "1px solid #2F2F2A", color: "#C8C8C2" }}
          title={`Refine this angle with ${agentName} in the studio`}
        >
          Refine
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setShowSizes((s) => !s)}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-button text-[10.5px] transition-colors"
          style={{ color: "#A8A8A0" }}
        >
          {CREATIVE_SIZES.length} sizes
          <ChevronDown
            size={11}
            strokeWidth={1.8}
            className="transition-transform"
            style={{ transform: showSizes ? "rotate(180deg)" : "none" }}
          />
        </button>
      </div>

      {/* Abandoned-session strip — no dead ends, no mystery state */}
      {refine.state === "unmerged" && (
        <div className="px-2.5 pb-2.5">
          <UnmergedStrip latest={refine.latest} onResume={onRefine} onDiscard={onDiscard} />
        </div>
      )}

      {/* Per-size — refine just the size you don't like */}
      {showSizes && (
        <div className="px-2.5 pb-3 pt-0.5 grid grid-cols-3 gap-2 border-t" style={{ borderColor: "#262623" }}>
          {CREATIVE_SIZES.map((sz) => (
            <div key={sz.key} className="pt-2.5">
              <div
                className="relative rounded-[6px] overflow-hidden mx-auto"
                style={{ aspectRatio: sz.ratio, maxHeight: 96, background: "#0A0A09", border: "1px solid #2A2A26" }}
              >
                {creative.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creative.src} alt={`${hook} ${sz.label}`} className="w-full h-full object-cover" style={{ filter: look ?? "none" }} />
                ) : (
                  <span className="block w-full h-full" style={{ background: hueGradient(creative.hue), filter: look ?? "none" }} />
                )}
              </div>
              <div className="text-center mt-1 text-[9px] leading-tight" style={{ color: "#A8A8A0" }}>
                {sz.label}
              </div>
              <button
                type="button"
                onClick={() => onRefineSize(sz.label)}
                className="w-full mt-1 inline-flex items-center justify-center gap-1 h-6 rounded-[6px] text-[9.5px] transition-colors"
                style={{ background: "transparent", border: "1px solid #2F2F2A", color: "#C8C8C2" }}
                title={`Refine the ${sz.label} size with ${agentName}`}
              >
                Refine
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaLeadFormPreview({ fields }: { fields: string[] }) {
  return (
    <div className="rounded-[16px] overflow-hidden flex-shrink-0 w-[150px]" style={{ border: "4px solid #0A0A09", background: "#fff" }}>
      <div className="px-2.5 py-2" style={{ background: "#1877F2" }}>
        <div className="text-[8px] text-white/80">Guyju&apos;s</div>
        <div className="text-[9.5px] font-semibold text-white leading-tight">Book your free trial</div>
      </div>
      <div className="p-2.5 space-y-1.5 bg-white">
        {fields.slice(0, 4).map((f) => (
          <div key={f}>
            <div className="text-[6.5px] text-[#65676B] mb-0.5">{f}</div>
            <div className="h-4 rounded-[4px]" style={{ background: "#F0F2F5", border: "1px solid #E4E6EB" }} />
          </div>
        ))}
        <div className="h-5 rounded-[5px] mt-1 flex items-center justify-center text-[8px] font-semibold text-white" style={{ background: "#1877F2" }}>
          Submit
        </div>
      </div>
    </div>
  );
}
