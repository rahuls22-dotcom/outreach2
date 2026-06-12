"use client";

// Creatives + lead form review — the dark canvas surface (right panel).
// Adheres to the right-panel dark-mode principle; NOT a markdown file.
//
// Control is GRANULAR — nothing is approved or refined all at once:
//   · per ANGLE — each creative card has its own Approve + Refine.
//   · per PERSONA — an "Approve all" for that persona's angles.
//   · per SIZE — each angle expands to 1:1 / 4:5 / 9:16, and any single
//     size can be refined on its own (you might dislike just one size).
// Refine opens the creative agent (Iris) in a new tab, scoped to exactly
// what you clicked. Iris owns both creatives and the lead form. A single
// Meta instant lead form attaches to every angle (v1 — no landing pages).

import { useState } from "react";
import {
  ImageIcon,
  FileText,
  Check,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { CREATIVES_BY_PERSONA } from "./launch-build-steps";
import { CREATIVE_AGENT } from "@/lib/creatives-studio-data";
import type { SpotWorkflow } from "@/lib/spot/workflow";

const TOTAL_ANGLES = CREATIVES_BY_PERSONA.reduce((s, g) => s + g.creatives.length, 0);

const CREATIVE_SIZES = [
  { key: "1x1", label: "1:1", dims: "1080×1080", ratio: "1 / 1" },
  { key: "4x5", label: "4:5", dims: "1080×1350", ratio: "4 / 5" },
  { key: "9x16", label: "9:16", dims: "1080×1920", ratio: "9 / 16" },
];

const META_FORM_FIELDS = ["Full name", "Phone number", "Email", "Preferred batch / timing"];

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

  const agent = CREATIVE_AGENT.name;
  const approvedCount = approved.size;

  const openAgent = (opts: { persona?: string; angle?: string; size?: string }) => {
    const parts = [`product=${encodeURIComponent(product.id)}`];
    if (opts.persona) parts.push(`persona=${encodeURIComponent(opts.persona)}`);
    if (opts.angle) parts.push(`angle=${encodeURIComponent(opts.angle)}`);
    if (opts.size) parts.push(`size=${encodeURIComponent(opts.size)}`);
    window.open(`/creatives?${parts.join("&")}`, "_blank", "noopener,noreferrer");
  };

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
      const allOn = ids.every((id) => n.has(id));
      ids.forEach((id) => (allOn ? n.delete(id) : n.add(id)));
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
          Approve or refine each angle on its own — by persona, by angle, even by size. {agent}{" "}
          opens in a tab scoped to exactly what you click.
        </p>
      </div>

      {/* ── Creatives ─────────────────────────────────────────── */}
      <section className="mb-7">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={14} style={{ color: "#C9A86A" }} />
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
            const personaDone = ids.filter((id) => approved.has(id)).length;
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
                      approved={approved.has(c.id)}
                      agentName={agent}
                      onApprove={() => toggleAngle(c.id)}
                      onRefine={() => openAgent({ persona: personaName, angle: c.hook })}
                      onRefineSize={(size) => openAgent({ persona: personaName, angle: c.hook, size })}
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
          <FileText size={14} style={{ color: "#C9A86A" }} />
          <span className="text-[13.5px] font-semibold">Lead form</span>
          <span className="text-[10.5px]" style={{ color: "#8A8980" }}>
            · 1 Meta instant form · all angles
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setFormApproved((v) => !v)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button text-[11.5px] font-medium transition-colors"
            style={
              formApproved
                ? { background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.4)", color: "#5EE08A" }
                : { background: "#F5F4EF", color: "#161614" }
            }
          >
            {formApproved ? (
              <>
                <Check size={12} strokeWidth={2.4} /> Approved
              </>
            ) : (
              "Approve form"
            )}
          </button>
          <RefineButton agentName={agent} onClick={() => openAgent({})} />
        </div>
        <div className="rounded-[10px] p-4 flex items-start gap-5" style={{ background: "#1A1A18", border: "1px solid #2A2A26" }}>
          <MetaLeadFormPreview />
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
              {META_FORM_FIELDS.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[11.5px]" style={{ color: "#C8C8C2" }}>
                  <Check size={11} strokeWidth={2.4} style={{ color: "#5EE08A" }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
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

function RefineButton({ agentName, onClick }: { agentName: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-button text-[11.5px] transition-colors"
      style={{ background: "transparent", border: "1px solid #2F2F2A", color: "#C8C8C2" }}
      title={`Refine with ${agentName} in a new tab`}
    >
      <Sparkles size={11} style={{ color: "#C9A86A" }} />
      Refine
      <ExternalLink size={10} style={{ color: "#8A8980" }} />
    </button>
  );
}

function AngleCard({
  creative,
  angleNum,
  approved,
  agentName,
  onApprove,
  onRefine,
  onRefineSize,
}: {
  creative: { id: string; hook: string; format: string; src?: string; hue: number };
  angleNum: number;
  approved: boolean;
  agentName: string;
  onApprove: () => void;
  onRefine: () => void;
  onRefineSize: (size: string) => void;
}) {
  const [showSizes, setShowSizes] = useState(false);
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
            alt={creative.hook}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="block w-full h-full" style={{ background: hueGradient(creative.hue) }} />
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
            <Check size={9} strokeWidth={2.6} /> Approved
          </span>
        )}
      </div>

      {/* Hook */}
      <div className="px-3 pt-2 pb-1">
        <div className="text-[11.5px] leading-snug" style={{ color: "#E6E6E0" }}>
          {creative.hook}
        </div>
      </div>

      {/* Per-angle actions */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-t" style={{ borderColor: "#262623" }}>
        <button
          type="button"
          onClick={onApprove}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-button text-[11px] font-medium transition-colors"
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
          title={`Refine this angle with ${agentName}`}
        >
          <Sparkles size={11} style={{ color: "#C9A86A" }} />
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
                  <img src={creative.src} alt={`${creative.hook} ${sz.label}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="block w-full h-full" style={{ background: hueGradient(creative.hue) }} />
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
                <Sparkles size={9} style={{ color: "#C9A86A" }} />
                Refine
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaLeadFormPreview() {
  return (
    <div className="rounded-[16px] overflow-hidden flex-shrink-0 w-[150px]" style={{ border: "4px solid #0A0A09", background: "#fff" }}>
      <div className="px-2.5 py-2" style={{ background: "#1877F2" }}>
        <div className="text-[8px] text-white/80">Guyju&apos;s</div>
        <div className="text-[9.5px] font-semibold text-white leading-tight">Book your free trial</div>
      </div>
      <div className="p-2.5 space-y-1.5 bg-white">
        {["Full name", "Phone", "Email"].map((f) => (
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
