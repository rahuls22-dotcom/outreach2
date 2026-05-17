"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Check,
  Sparkles,
  FileText,
  Upload,
  Edit3,
  Users,
  Monitor,
  Play,
  ChevronDown,
} from "lucide-react";
import { SpotMark } from "@/components/spot/spot-mark";
import { useSpotStore } from "@/lib/spot/store";
import {
  CAMPAIGN_TYPE_BY_ID,
  CAMPAIGN_TYPE_ORDER,
  type CampaignTypeId,
  type PlannedAdSet,
} from "@/lib/campaign-types";

type Stage = "intent" | "brief" | "goal" | "personas" | "plan";

const STAGES: { key: Stage; label: string }[] = [
  { key: "intent", label: "Intent" },
  { key: "brief", label: "Brief" },
  { key: "goal", label: "Goal" },
  { key: "personas", label: "Personas" },
  { key: "plan", label: "Media plan" },
];

type PersonaDraft = {
  id: string;
  name: string;
  age: string;
  role: string;
  want: string;
  painPoint: string;
  solution: string;
  hhi: string;
  geo: string;
  share: number;
  approved: boolean;
};

type Draft = {
  source: "pdf" | "url" | "manual";
  sourceLabel: string;
  name: string;
  rera: string;
  micromarket: string;
  typology: string;
  priceBand: string;
  possession: string;
  goalKind: "leads" | "verified" | "qualified";
  goalTarget: string;
  goalWindow: string;
  personas: PersonaDraft[];
};

const SEED_PERSONAS: PersonaDraft[] = [
  {
    id: "ps1",
    name: "The Senior Tech Lead",
    age: "34",
    role: "Director at FAANG-tier IT services",
    want:
      "A larger, branded apartment in the same Pune East catchment without a longer commute to Hinjewadi.",
    painPoint:
      "Currently in a 2.5 BHK that's outgrown the family; doesn't want to move further from work or compromise on amenities.",
    solution:
      "Spacious 3 BHK with branded interiors, dedicated WFH room, and 14-min drive to Hinjewadi tech park.",
    hhi: "₹55L+",
    geo: "Pune East (Kharadi / Magarpatta)",
    share: 38,
    approved: true,
  },
  {
    id: "ps2",
    name: "The Pune Returnee",
    age: "39",
    role: "Senior IC returning from BLR/Mumbai",
    want:
      "A primary home in their hometown after years in another metro, ideally close to extended family.",
    painPoint:
      "Hard to evaluate options remotely; needs trust signals like RERA, builder reputation, and verifiable timelines.",
    solution:
      "RERA-cleared, Godrej-built, with a documented 8-week site-visit-anytime policy and live construction updates.",
    hhi: "₹75L+",
    geo: "BLR / Mumbai / Hyderabad (origin Pune)",
    share: 28,
    approved: true,
  },
  {
    id: "ps3",
    name: "The NRI Investor",
    age: "43",
    role: "US/UK-based, looking at 2nd home in India",
    want:
      "A primary-quality asset that rents at premium today and becomes a return home in 6-10 years.",
    painPoint:
      "Construction risk feels remote; property management cost and yield calculation aren't visible upfront.",
    solution:
      "RERA-verified milestones + managed-rental partner integration, with a yield calculator on the listing page.",
    hhi: "$220K+",
    geo: "Bay Area / NJ / London",
    share: 22,
    approved: false,
  },
];

const SEED: Draft = {
  source: "pdf",
  sourceLabel: "Sky Gardens — Brand Book v2.pdf",
  name: "Godrej Sky Gardens · Pune",
  rera: "PRM/MH/RERA/...",
  micromarket: "Kharadi · Pune East",
  typology: "3 BHK Apartments",
  priceBand: "₹1.6 – 2.4 Cr",
  possession: "Mar 2028",
  goalKind: "verified",
  goalTarget: "240",
  goalWindow: "180 days",
  personas: SEED_PERSONAS,
};

// ─── Atoms ────────────────────────────────────────────────────────────

function StagePill({
  stage,
  current,
  onClick,
}: {
  stage: { key: Stage; label: string };
  current: Stage;
  onClick?: () => void;
}) {
  const idx = STAGES.findIndex((s) => s.key === stage.key);
  const currentIdx = STAGES.findIndex((s) => s.key === current);
  const done = idx < currentIdx;
  const active = idx === currentIdx;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!done && !active}
      className="flex items-center gap-1.5 flex-shrink-0"
      style={{ cursor: done || active ? "pointer" : "not-allowed" }}
    >
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold flex-shrink-0"
        style={{
          background: done ? "#22C55E" : active ? "#1A1A1A" : "var(--bg-secondary)",
          color: done || active ? "#FFF" : "var(--text-3)",
        }}
      >
        {done ? "✓" : idx + 1}
      </span>
      <span
        className="text-[11.5px] hidden md:inline"
        style={{ color: active ? "var(--text-1)" : "var(--text-3)", fontWeight: active ? 600 : 500 }}
      >
        {stage.label}
      </span>
    </button>
  );
}

function SpotBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 mb-3 fadeUp">
      <SpotMark size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <div
        className="flex-1 min-w-0 p-3"
        style={{
          background: "var(--spot-tint)",
          border: "1px solid var(--spot-stroke)",
          borderRadius: 10,
        }}
      >
        <div className="text-[13.5px] leading-[1.55]">{children}</div>
      </div>
    </div>
  );
}

function DraftCard({
  children,
  label = "Spot's draft",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div
      className="rounded-[10px] p-4 mb-3 fadeUp"
      style={{ background: "#FFFDF6", border: "1px solid #E8C97A" }}
    >
      <div className="uplabel mb-3 flex items-center gap-1.5" style={{ fontSize: 10 }}>
        <Sparkles size={11} style={{ color: "#9C6D00" }} />
        {label}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  long,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  long?: boolean;
  rows?: number;
}) {
  return (
    <div className="mb-3">
      <div className="text-[10.5px] uppercase tracking-[0.4px] text-text-tertiary mb-1">
        {label}
      </div>
      {long ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows || 2}
          className="w-full text-[13px] outline-none rounded px-2 py-1.5"
          style={{ border: "1px solid #C9A86A", background: "#FFFEF8" }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-[13px] outline-none rounded px-2 py-1.5"
          style={{ border: "1px solid #C9A86A", background: "#FFFEF8" }}
        />
      )}
    </div>
  );
}

// ─── Persona card (with Want / Pain / Solution) ─────────────────────

function PersonaAvatar({ id, size = 40 }: { id: string; size?: number }) {
  const hue = (id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) * 47) % 360;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: `linear-gradient(135deg, oklch(0.88 0.06 ${hue}) 0%, oklch(0.72 0.09 ${(hue + 50) % 360}) 100%)`,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <circle cx="20" cy="15" r="5" fill="rgba(0,0,0,0.35)" />
        <path d="M10 34c0-6 5-9 10-9s10 3 10 9z" fill="rgba(0,0,0,0.35)" />
      </svg>
    </div>
  );
}

function PersonaCardLive({
  p,
  onToggleApprove,
  onEditField,
}: {
  p: PersonaDraft;
  onToggleApprove: () => void;
  onEditField: (key: keyof PersonaDraft, value: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const FieldChip = ({
    label,
    tone,
    fieldKey,
  }: {
    label: string;
    tone: "neutral" | "warn" | "ok";
    fieldKey: "want" | "painPoint" | "solution";
  }) => {
    const dot = tone === "warn" ? "#DC2626" : tone === "ok" ? "#15803D" : "#9B9B9B";
    const editing = editingId === fieldKey;
    return (
      <div className="px-3 py-2.5 border-r last:border-r-0 border-border-subtle min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
          <span className="uplabel" style={{ fontSize: 9.5 }}>
            {label}
          </span>
        </div>
        {editing ? (
          <textarea
            autoFocus
            value={p[fieldKey] as string}
            onBlur={() => setEditingId(null)}
            onChange={(e) => onEditField(fieldKey, e.target.value)}
            rows={3}
            className="w-full text-[12px] outline-none rounded px-1.5 py-1 resize-none"
            style={{ border: "1px solid #C9A86A", background: "#FFFEF8" }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingId(fieldKey)}
            className="text-[12px] leading-[1.4] text-left w-full hover:bg-[#FFF7E0] rounded px-1 py-0.5 -mx-1"
            title="Click to edit"
          >
            {p[fieldKey] as string}
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="card-base bg-white overflow-hidden fadeUp"
      style={{ borderColor: p.approved ? "#BBF7D0" : "var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border-subtle">
        <PersonaAvatar id={p.id} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14.5px] font-semibold leading-tight">{p.name}</span>
            <span className="text-[12px] text-text-secondary">, {p.age}</span>
            <span className="pill" style={{ fontSize: 10 }}>
              {p.share}% mix
            </span>
          </div>
          <div className="text-[11.5px] text-text-tertiary mt-0.5">{p.role}</div>
          <div className="text-[10.5px] text-text-tertiary mt-0.5">
            {p.hhi} · {p.geo}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleApprove}
          className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-button text-[11.5px] flex-shrink-0 ${
            p.approved
              ? "bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D]"
              : "bg-white border border-border text-text-secondary"
          }`}
        >
          <Check size={11} /> {p.approved ? "Approved" : "Approve"}
        </button>
      </div>

      {/* Want / Pain / Solution triplet */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <FieldChip label="Want" tone="neutral" fieldKey="want" />
        <FieldChip label="Pain point" tone="warn" fieldKey="painPoint" />
        <FieldChip label="Solution we offer" tone="ok" fieldKey="solution" />
      </div>
    </div>
  );
}

function PersonaSkeleton() {
  return (
    <div className="card-base bg-white overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border-subtle">
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 9 }} />
        <div className="flex-1">
          <div className="skeleton" style={{ height: 14, width: "55%", marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 11, width: "75%" }} />
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-3 py-2.5 border-r last:border-r-0 border-border-subtle">
            <div className="skeleton" style={{ height: 9, width: 50, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 10, width: "100%", marginBottom: 4 }} />
            <div className="skeleton" style={{ height: 10, width: "85%", marginBottom: 4 }} />
            <div className="skeleton" style={{ height: 10, width: "60%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Progressive persona reveal — Spot "discovers" personas one by one,
// each appearing with a skeleton → real card transition.
function ProgressivePersonas({
  personas,
  onChange,
}: {
  personas: PersonaDraft[];
  onChange: (next: PersonaDraft[]) => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const [loadingNext, setLoadingNext] = useState(true);

  useEffect(() => {
    if (revealed >= personas.length) {
      setLoadingNext(false);
      return;
    }
    setLoadingNext(true);
    const t = setTimeout(() => {
      setRevealed((r) => r + 1);
    }, revealed === 0 ? 600 : 1100);
    return () => clearTimeout(t);
  }, [revealed, personas.length]);

  return (
    <div className="space-y-3">
      {personas.slice(0, revealed).map((p, i) => (
        <PersonaCardLive
          key={p.id}
          p={p}
          onToggleApprove={() => {
            const next = [...personas];
            next[i] = { ...p, approved: !p.approved };
            onChange(next);
          }}
          onEditField={(key, value) => {
            const next = [...personas];
            next[i] = { ...p, [key]: value } as PersonaDraft;
            onChange(next);
          }}
        />
      ))}
      {revealed < personas.length && loadingNext && (
        <>
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] fadeUp"
            style={{
              background: "var(--spot-tint)",
              border: "1px solid var(--spot-stroke)",
            }}
          >
            <SpotMark size={14} />
            <span className="text-[12px] text-text-secondary">
              {revealed === 0
                ? "Reading the brief and recent leads…"
                : `Drafting persona ${revealed + 1} of ${personas.length}…`}
            </span>
            <span className="flex gap-1 ml-auto">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="spot-pulse"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--text-2)",
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              ))}
            </span>
          </div>
          <PersonaSkeleton />
        </>
      )}
    </div>
  );
}

// ─── Media plan accordion ───────────────────────────────────────────
//
// Every draft media plan has the same four canonical campaigns in this
// order: Experiment → Scaling → Cost / Bid Cap → Advantage+. Each card
// is collapsible and shows the ad sets Spot has planned underneath it.

type PlanCampaign = {
  id: string;
  typeId: CampaignTypeId;
  name: string;
  adSets: PlannedAdSet[];
};

function deriveCampaigns(draft: Draft): PlanCampaign[] {
  const approved = draft.personas.filter((p) => p.approved);
  const slim = approved.map((p) => ({ id: p.id, name: p.name }));
  const projectShort = draft.name.split(" · ")[0] || draft.name;
  return CAMPAIGN_TYPE_ORDER.map((typeId, i) => {
    const type = CAMPAIGN_TYPE_BY_ID[typeId];
    return {
      id: `pc-${typeId}-${i}`,
      typeId,
      name: `${projectShort} · ${type.short}`,
      adSets: type.defaultAdSets(slim),
    };
  });
}

function MediaPlanAccordion({ draft }: { draft: Draft }) {
  const campaigns = useMemo(() => deriveCampaigns(draft), [draft]);
  const approvedCount = draft.personas.filter((p) => p.approved).length;
  // Default: Experiment expanded, others collapsed. The user reviews the
  // most important campaign first.
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    [campaigns[0]?.id || ""]: true,
  }));

  const adSetsTotal = campaigns.reduce((s, c) => s + c.adSets.length, 0);
  const dailyBudget = campaigns.reduce(
    (s, c) => s + c.adSets.reduce((a, ad) => a + ad.budgetDaily, 0),
    0,
  );
  const weeklyBudget = dailyBudget * 7;
  const creativesTotal = adSetsTotal * 3;

  return (
    <div className="card-base overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-2.5"
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)",
          color: "#FFF",
        }}
      >
        <div className="text-[12px] uppercase tracking-wide font-semibold">Draft media plan</div>
      </div>

      <div className="p-4">
        {/* KPI strip */}
        <div className="grid mb-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <KpiTile label="Personas live" value={String(approvedCount)} />
          <KpiTile label="Ad sets" value={String(adSetsTotal)} />
          <KpiTile label="Creatives to make" value={String(creativesTotal)} />
          <KpiTile label="Weekly spend" value={`₹${(weeklyBudget / 1000).toFixed(0)}K`} />
        </div>

        {/* 4 collapsible campaign cards */}
        <div className="space-y-2">
          {campaigns.map((c) => (
            <CampaignAccordionCard
              key={c.id}
              campaign={c}
              personas={draft.personas}
              expanded={!!expanded[c.id]}
              onToggle={() =>
                setExpanded((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
              }
            />
          ))}
        </div>

        {/* Spot bubble */}
        <div
          className="mt-4 px-3.5 py-2.5 rounded-[8px] flex items-start gap-2.5"
          style={{ background: "var(--spot-tint)", border: "1px solid var(--spot-stroke)" }}
        >
          <SpotMark size={14} />
          <div className="text-[12px] leading-[1.5] text-text-secondary">
            <strong className="text-text-primary">Next:</strong> open the media plan to create
            ads per persona, review ad set targeting, set up the lead form, and deploy.
            Nothing goes live until you confirm.
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="uplabel" style={{ fontSize: 10 }}>{label}</div>
      <div className="tabular-nums" style={{ fontSize: 22, fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

function CampaignAccordionCard({
  campaign,
  personas,
  expanded,
  onToggle,
}: {
  campaign: PlanCampaign;
  personas: PersonaDraft[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const type = CAMPAIGN_TYPE_BY_ID[campaign.typeId];
  const weekly = campaign.adSets.reduce((s, a) => s + a.budgetDaily, 0) * 7;
  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        background: "#FFF",
        border: `1px solid ${expanded ? type.accent + "55" : "var(--border)"}`,
        transition: "border-color 120ms ease",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover-row"
      >
        <span
          className="inline-flex items-center justify-center flex-shrink-0"
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: type.accent,
            color: "#FFF",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {type.short.slice(0, 2).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold truncate">{type.short}</span>
            <span className="pill" style={{ fontSize: 10 }}>
              {campaign.adSets.length} ad set{campaign.adSets.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="text-[11px] text-text-tertiary truncate">{type.tagline}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[12.5px] font-medium tabular-nums">
            ₹{(weekly / 1000).toFixed(0)}K/wk
          </div>
          <div className="text-[10px] text-text-tertiary">
            {type.bidStrategy.split(" · ")[0]}
          </div>
        </div>
        <ChevronDown
          size={14}
          className="text-text-tertiary flex-shrink-0"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 160ms ease",
          }}
        />
      </button>

      {expanded && (
        <div
          className="border-t border-border-subtle"
          style={{ background: "var(--bg-page)" }}
        >
          {campaign.adSets.length === 0 ? (
            <div className="px-4 py-3 text-[12px] text-text-tertiary italic">
              No ad sets planned yet.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {campaign.adSets.map((ad) => {
                const persona = ad.personaId
                  ? personas.find((p) => p.id === ad.personaId)
                  : null;
                return (
                  <div
                    key={ad.id}
                    className="grid items-start gap-3 px-4 py-3"
                    style={{ gridTemplateColumns: "1fr 90px" }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[12.5px] font-medium truncate">{ad.name}</span>
                        {persona && (
                          <span
                            className="pill"
                            style={{
                              fontSize: 10,
                              background: "#FFF",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <Users size={9} /> {persona.name}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-secondary leading-[1.5] mb-1">
                        {ad.audience}
                      </div>
                      <div className="text-[10.5px] text-text-tertiary">
                        Optimize for: {ad.optimization}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="text-[12.5px] font-medium">
                        ₹{(ad.budgetDaily / 1000).toFixed(0)}K
                      </div>
                      <div className="text-[10px] text-text-tertiary">/ day</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div
            className="px-4 py-2 text-[10.5px] text-text-tertiary leading-[1.5] border-t border-border-subtle"
            style={{ background: "#FFF" }}
          >
            <strong className="text-text-secondary font-semibold">{type.name}</strong> ·{" "}
            {type.when}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main flow ────────────────────────────────────────────────────────

export function CreateProjectFlow({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (id: string) => void;
}) {
  const [stage, setStage] = useState<Stage>("intent");
  const [draft, setDraft] = useState<Draft>(SEED);
  const showToast = useSpotStore((s) => s.showToast);
  const scrollRef = useRef<HTMLDivElement>(null);

  const next = () => {
    const idx = STAGES.findIndex((s) => s.key === stage);
    if (idx < STAGES.length - 1) setStage(STAGES[idx + 1].key);
  };
  const prev = () => {
    const idx = STAGES.findIndex((s) => s.key === stage);
    if (idx > 0) setStage(STAGES[idx - 1].key);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stage]);

  const approvedCount = draft.personas.filter((p) => p.approved).length;

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "5vh 16px",
          pointerEvents: "none",
        }}
      >
      <div
        className="fadeUp"
        style={{
          width: "min(820px, 100%)",
          maxHeight: "90vh",
          background: "#FFF",
          borderRadius: 14,
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border flex-shrink-0">
          <SpotMark size={20} />
          <div className="flex-1 min-w-0">
            <div className="uplabel" style={{ fontSize: 10 }}>
              Spot · new project
            </div>
            <div className="text-[15px] font-semibold truncate">
              Set up a new project knowledge base
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-8 w-8 rounded-button hover:bg-surface-secondary flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Stage strip (own row, scrollable horizontally on narrow) */}
        <div
          className="flex items-center gap-4 px-5 py-2.5 border-b border-border-subtle bg-surface-page overflow-x-auto scroll flex-shrink-0"
        >
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center gap-4 flex-shrink-0">
              <StagePill
                stage={s}
                current={stage}
                onClick={() => {
                  const idx = STAGES.findIndex((x) => x.key === s.key);
                  const currentIdx = STAGES.findIndex((x) => x.key === stage);
                  if (idx <= currentIdx) setStage(s.key);
                }}
              />
              {i < STAGES.length - 1 && <span className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 scroll"
          style={{ background: "var(--chat-bg)" }}
        >
          {stage === "intent" && (
            <>
              <SpotBubble>
                Let&apos;s set up your new project. The fastest path: drop the brand book PDF and
                I&apos;ll extract everything I need. You can also paste a URL or fill it in yourself.
              </SpotBubble>
              <DraftCard>
                <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  {[
                    { k: "pdf", label: "Upload PDF", Icon: Upload },
                    { k: "url", label: "Paste URL", Icon: FileText },
                    { k: "manual", label: "Manual fill", Icon: Edit3 },
                  ].map(({ k, label, Icon }) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDraft({ ...draft, source: k as Draft["source"] })}
                      className="card-base text-left p-3 flex flex-col items-start gap-1.5"
                      style={{
                        background: draft.source === k ? "#1A1A1A" : "#FFF",
                        color: draft.source === k ? "#FFF" : "var(--text-1)",
                        borderColor: draft.source === k ? "#1A1A1A" : "var(--border)",
                      }}
                    >
                      <Icon size={15} />
                      <span className="text-[12.5px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
                <Field
                  label="Source label"
                  value={draft.sourceLabel}
                  onChange={(v) => setDraft({ ...draft, sourceLabel: v })}
                />
              </DraftCard>
              <div className="flex justify-end">
                <button type="button" className="apply-btn" onClick={next}>
                  Got it — extract the basics →
                </button>
              </div>
            </>
          )}

          {stage === "brief" && (
            <>
              <SpotBubble>
                Pulled from <strong>{draft.sourceLabel}</strong>. Tap any value to edit.
              </SpotBubble>
              <DraftCard label="Extracted brief">
                <Field label="Project name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                <Field label="RERA" value={draft.rera} onChange={(v) => setDraft({ ...draft, rera: v })} />
                <Field label="Micromarket" value={draft.micromarket} onChange={(v) => setDraft({ ...draft, micromarket: v })} />
                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <Field label="Typology" value={draft.typology} onChange={(v) => setDraft({ ...draft, typology: v })} />
                  <Field label="Price band" value={draft.priceBand} onChange={(v) => setDraft({ ...draft, priceBand: v })} />
                  <Field label="Possession" value={draft.possession} onChange={(v) => setDraft({ ...draft, possession: v })} />
                </div>
              </DraftCard>
              <div className="flex justify-between">
                <button type="button" className="inline-flex items-center h-8 px-3 rounded-button border border-border bg-white text-[12.5px]" onClick={prev}>
                  Back
                </button>
                <button type="button" className="apply-btn" onClick={next}>
                  Looks right — set the goal →
                </button>
              </div>
            </>
          )}

          {stage === "goal" && (
            <>
              <SpotBubble>
                Similar luxury Pune launches convert ~3% of leads to verified. I&apos;ve drafted{" "}
                <strong>{draft.goalTarget} verified leads</strong> over{" "}
                <strong>{draft.goalWindow}</strong>.
              </SpotBubble>
              <DraftCard label="Goal proposal">
                <div className="text-[10.5px] uppercase tracking-[0.4px] text-text-tertiary mb-2">Goal kind</div>
                <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  {(["leads", "verified", "qualified"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDraft({ ...draft, goalKind: k })}
                      className="card-base text-left p-2.5"
                      style={{
                        background: draft.goalKind === k ? "#1A1A1A" : "#FFF",
                        color: draft.goalKind === k ? "#FFF" : "var(--text-1)",
                        borderColor: draft.goalKind === k ? "#1A1A1A" : "var(--border)",
                      }}
                    >
                      <div className="text-[12.5px] font-medium capitalize">{k} leads</div>
                      {k === "verified" && (
                        <div className="text-[10.5px] mt-0.5" style={{ color: draft.goalKind === k ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)" }}>
                          Spot recommends
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Target count" value={draft.goalTarget} onChange={(v) => setDraft({ ...draft, goalTarget: v })} />
                  <Field label="Window" value={draft.goalWindow} onChange={(v) => setDraft({ ...draft, goalWindow: v })} />
                </div>
              </DraftCard>
              <div className="flex justify-between">
                <button type="button" className="inline-flex items-center h-8 px-3 rounded-button border border-border bg-white text-[12.5px]" onClick={prev}>
                  Back
                </button>
                <button type="button" className="apply-btn" onClick={next}>
                  Set goal — draft personas →
                </button>
              </div>
            </>
          )}

          {stage === "personas" && (
            <>
              <SpotBubble>
                Drafting personas from your brief, the goal you set, and what&apos;s worked for
                similar Pune luxury launches. Each one uses a <strong>Want / Pain / Solution</strong>{" "}
                frame — Pain and Solution stay fixed across creative; only hook and CTA flex per ad.
              </SpotBubble>
              <ProgressivePersonas
                personas={draft.personas}
                onChange={(next) => setDraft({ ...draft, personas: next })}
              />
              <div className="flex justify-between mt-4">
                <button type="button" className="inline-flex items-center h-8 px-3 rounded-button border border-border bg-white text-[12.5px]" onClick={prev}>
                  Back
                </button>
                <button
                  type="button"
                  className="apply-btn"
                  onClick={next}
                  disabled={approvedCount === 0}
                >
                  Approve {approvedCount} &amp; draft media plan →
                </button>
              </div>
            </>
          )}

          {stage === "plan" && (
            <>
              <SpotBubble>
                <strong>Project is ready.</strong> I&apos;ve drafted a starting media plan for your{" "}
                {approvedCount} approved persona{approvedCount === 1 ? "" : "s"}. Nothing is live
                yet — open the plan to create ads per persona, review ad-set targeting, set up the
                lead form, and deploy.
              </SpotBubble>
              <MediaPlanAccordion draft={draft} />
              <div className="flex justify-between mt-4">
                <button type="button" className="inline-flex items-center h-8 px-3 rounded-button border border-border bg-white text-[12.5px]" onClick={prev}>
                  Back
                </button>
                <button
                  type="button"
                  className="apply-btn"
                  style={{
                    height: 34,
                    fontSize: 13,
                    padding: "0 16px",
                    background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)",
                  }}
                  onClick={() => {
                    showToast("Project created — opening media plan");
                    // For MVP, route to a seed project's deploy page.
                    onComplete("godrej-banerghatta");
                  }}
                >
                  <Play size={13} /> Open media plan to deploy
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
