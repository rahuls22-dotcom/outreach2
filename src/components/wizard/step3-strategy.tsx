"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Target,
  Users,
  Image,
  FileText,
  DollarSign,
  Play,
  Shield,
} from "lucide-react";
import { strategyData } from "@/lib/wizard-data";

interface Step3Props {
  onNext: () => void;
  onBack: () => void;
}

type SectionStatus = "pending" | "approved" | "rework";

function StatusBadge({ status }: { status: SectionStatus }) {
  const config = {
    pending: { label: "Pending", cls: "bg-[#FEF3C7] text-[#92400E]" },
    approved: { label: "Approved", cls: "bg-[#F0FDF4] text-[#15803D]" },
    rework: { label: "Rework", cls: "bg-[#FEF2F2] text-[#DC2626]" },
  };
  const { label, cls } = config[status];
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge ${cls}`}>
      {label}
    </span>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  status,
  onApprove,
  onRework,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ElementType;
  status: SectionStatus;
  onApprove: () => void;
  onRework: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-border rounded-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-page/50 transition-colors duration-150"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} strokeWidth={1.5} className="text-text-secondary" />
          <span className="text-[14px] font-semibold text-text-primary">{title}</span>
          <StatusBadge status={status} />
        </div>
        {open ? (
          <ChevronDown size={15} strokeWidth={1.5} className="text-text-tertiary" />
        ) : (
          <ChevronRight size={15} strokeWidth={1.5} className="text-text-tertiary" />
        )}
      </button>

      {open && (
        <div className="border-t border-border-subtle">
          <div className="px-5 py-5">{children}</div>
          <div className="flex items-center gap-2 px-5 py-3 border-t border-border-subtle bg-surface-page/50">
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 h-8 px-4 bg-accent text-white text-[12px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150"
            >
              <Check size={13} strokeWidth={2} />
              Approve
            </button>
            <button
              onClick={onRework}
              className="inline-flex items-center gap-1.5 h-8 px-4 text-[12px] font-medium text-text-secondary border border-border rounded-button bg-white hover:bg-surface-page transition-colors duration-150"
            >
              <RefreshCw size={12} strokeWidth={1.5} />
              Rework
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Step3Strategy({ onNext, onBack }: Step3Props) {
  const [statuses, setStatuses] = useState({
    strategy: "pending" as SectionStatus,
    creatives: "pending" as SectionStatus,
    forms: "pending" as SectionStatus,
  });

  const allApproved = Object.values(statuses).every((s) => s === "approved");

  const setStatus = (key: keyof typeof statuses, status: SectionStatus) => {
    setStatuses((prev) => ({ ...prev, [key]: status }));
  };

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-[20px] font-semibold text-text-primary">Strategy</h2>
        <p className="text-meta text-text-secondary mt-1">
          AI-generated campaign strategy. Review each section and approve or request rework.
        </p>
      </div>

      {/* Section 1: Strategy & Targeting */}
      <CollapsibleSection
        title="Strategy & Targeting"
        icon={Target}
        status={statuses.strategy}
        onApprove={() => setStatus("strategy", "approved")}
        onRework={() => setStatus("strategy", "rework")}
        defaultOpen
      >
        <div className="space-y-6">
          {/* Campaign Strategy */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Campaign Strategy
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Objective", value: strategyData.campaignStrategy.objective },
                { label: "Optimization", value: strategyData.campaignStrategy.optimization },
                { label: "Placements", value: strategyData.campaignStrategy.placements },
              ].map((item) => (
                <div key={item.label} className="bg-surface-page rounded-[6px] px-3 py-2">
                  <div className="text-[11px] text-text-tertiary">{item.label}</div>
                  <div className="text-[12px] text-text-primary mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="text-[11px] text-text-tertiary mb-1.5">Principles</div>
              <ul className="space-y-1">
                {strategyData.campaignStrategy.principles.map((p, i) => (
                  <li
                    key={i}
                    className="text-[12px] text-text-secondary pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1 before:h-1 before:bg-accent before:rounded-full"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ad Sets */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Ad Sets
            </h4>
            <div className="space-y-3">
              {strategyData.adSets.map((adset) => (
                <div key={adset.id} className="border border-border-subtle rounded-[6px] p-3">
                  <div className="text-[13px] font-medium text-text-primary">{adset.name}</div>
                  <div className="text-[12px] text-text-secondary mt-1">{adset.description}</div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-surface-page rounded-[4px] px-2 py-1.5">
                      <div className="text-[10px] text-text-tertiary uppercase">Geo</div>
                      <div className="text-[11px] text-text-primary mt-0.5">{adset.targeting.geo}</div>
                    </div>
                    <div className="bg-surface-page rounded-[4px] px-2 py-1.5">
                      <div className="text-[10px] text-text-tertiary uppercase">Audience</div>
                      <div className="text-[11px] text-text-primary mt-0.5">{adset.targeting.audience}</div>
                    </div>
                    <div className="bg-surface-page rounded-[4px] px-2 py-1.5">
                      <div className="text-[10px] text-text-tertiary uppercase">Exclusions</div>
                      <div className="text-[11px] text-text-primary mt-0.5">{adset.targeting.exclusions}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personas */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Personas
            </h4>
            <div className="space-y-3">
              {strategyData.personas.map((persona) => (
                <div key={persona.id} className="border border-border-subtle rounded-[6px] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={13} strokeWidth={1.5} className="text-text-tertiary" />
                    <span className="text-[13px] font-medium text-text-primary">{persona.name}, {persona.age}</span>
                    <span className="text-[11px] text-text-secondary">({persona.role})</span>
                  </div>
                  <div className="mt-1.5 space-y-2">
                    {["Want", "Pain point", "Solution"].map((title, i) =>
                      persona.bullets[i] ? (
                        <div key={i}>
                          <div className="text-[9px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-0.5">
                            {title}
                          </div>
                          <p className="text-[12px] text-text-secondary leading-snug">
                            {persona.bullets[i]}
                          </p>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: Creatives & Copy */}
      <CollapsibleSection
        title="Creatives & Copy"
        icon={Image}
        status={statuses.creatives}
        onApprove={() => setStatus("creatives", "approved")}
        onRework={() => setStatus("creatives", "rework")}
      >
        <div className="space-y-6">
          {/* Static Creatives */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Static Creative Ideas
            </h4>
            <div className="space-y-3">
              {strategyData.creatives.staticIdeas.map((cr) => (
                <div key={cr.id} className="border border-border-subtle rounded-[6px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-medium text-text-primary">{cr.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-badge bg-[#FDF4FF] text-[#7C3AED]">
                      {cr.persona}
                    </span>
                  </div>
                  <div className="bg-surface-page rounded-[6px] p-3 mb-2">
                    <div className="text-[10px] text-text-tertiary uppercase mb-1">Visual</div>
                    <p className="text-[12px] text-text-secondary leading-relaxed">{cr.visual}</p>
                  </div>
                  <div className="bg-surface-page rounded-[6px] p-3">
                    <div className="text-[10px] text-text-tertiary uppercase mb-1">Copy</div>
                    <p className="text-[12px] text-text-primary leading-relaxed">{cr.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Video Scripts */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Video Scripts
            </h4>
            {strategyData.creatives.videoScripts.map((vs) => (
              <div key={vs.id} className="border border-border-subtle rounded-[6px] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Play size={13} strokeWidth={1.5} className="text-text-tertiary" />
                  <span className="text-[13px] font-medium text-text-primary">{vs.name}</span>
                </div>
                <div className="space-y-1.5">
                  {vs.scenes.map((scene, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-[11px] font-mono text-text-tertiary min-w-[50px] tabular-nums">
                        {scene.timestamp}
                      </span>
                      <span className="text-[12px] text-text-secondary">{scene.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Primary Texts */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Primary Texts ({strategyData.creatives.primaryTexts.length} variations)
            </h4>
            <div className="space-y-2">
              {strategyData.creatives.primaryTexts.map((text, i) => (
                <div key={i} className="bg-surface-page rounded-[6px] p-3">
                  <div className="text-[11px] text-text-tertiary mb-1">Variation {i + 1}</div>
                  <p className="text-[12px] text-text-primary leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Headlines */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Headlines
            </h4>
            <div className="flex flex-wrap gap-2">
              {strategyData.creatives.headlines.map((h, i) => (
                <span key={i} className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-surface-secondary text-text-primary border border-border-subtle">
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Descriptions
            </h4>
            <div className="flex flex-wrap gap-2">
              {strategyData.creatives.descriptions.map((d, i) => (
                <span key={i} className="text-[12px] px-3 py-1.5 rounded-full bg-surface-page text-text-secondary">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 3: Forms & Budget */}
      <CollapsibleSection
        title="Forms & Budget"
        icon={DollarSign}
        status={statuses.forms}
        onApprove={() => setStatus("forms", "approved")}
        onRework={() => setStatus("forms", "rework")}
      >
        <div className="space-y-6">
          {/* Lead Forms */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Lead Forms
            </h4>
            <div className="space-y-3">
              {strategyData.forms.map((form) => (
                <div key={form.id} className="border border-border-subtle rounded-[6px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={13} strokeWidth={1.5} className="text-text-tertiary" />
                    <span className="text-[13px] font-medium text-text-primary">{form.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-badge ${
                      form.intent === "High" ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#FEF3C7] text-[#92400E]"
                    }`}>
                      {form.intent} Intent
                    </span>
                  </div>
                  <div className="bg-surface-page rounded-[6px] p-3 mb-2">
                    <div className="text-[12px] font-medium text-text-primary">{form.headline}</div>
                    <p className="text-[11px] text-text-secondary mt-1">{form.greeting}</p>
                  </div>
                  <div className="mb-2">
                    <div className="text-[10px] text-text-tertiary uppercase mb-1">Bullets</div>
                    <ul className="space-y-0.5">
                      {form.bullets.map((b, i) => (
                        <li key={i} className="text-[12px] text-text-secondary pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-text-tertiary">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-tertiary uppercase mb-1">Questions</div>
                    <div className="space-y-1">
                      {form.questions.map((q, i) => (
                        <div key={i} className="text-[12px] text-text-primary bg-surface-page rounded-[4px] px-2 py-1">
                          {i + 1}. {q}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Forecast */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Budget Forecast
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-border rounded-card px-4 py-3">
                <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.3px]">Goal Leads</div>
                <div className="text-stat-md text-text-primary mt-1">{strategyData.budgetForecast.goalLeads}</div>
              </div>
              <div className="bg-white border border-border rounded-card px-4 py-3">
                <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.3px]">CPL Range</div>
                <div className="text-stat-md text-text-primary mt-1">
                  ₹{strategyData.budgetForecast.cplRange.min}–₹{strategyData.budgetForecast.cplRange.max}
                </div>
              </div>
              <div className="bg-white border border-border rounded-card px-4 py-3">
                <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.3px]">Daily Budget</div>
                <div className="text-stat-md text-text-primary mt-1">
                  ₹{strategyData.budgetForecast.dailyBudget.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* Scaling Plan */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3">
              Scaling Plan
            </h4>
            <div className="space-y-2">
              {strategyData.scalingPlan.map((plan, i) => (
                <div key={i} className="flex items-start gap-3 bg-surface-page rounded-[6px] px-3 py-2.5">
                  <span className="text-[11px] font-semibold text-accent min-w-[60px]">{plan.phase}</span>
                  <span className="text-[12px] text-text-secondary">{plan.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guardrails */}
          <div>
            <h4 className="text-[12px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-3 flex items-center gap-1.5">
              <Shield size={13} strokeWidth={1.5} />
              Guardrails
            </h4>
            <ul className="space-y-1.5">
              {strategyData.guardrails.map((g, i) => (
                <li
                  key={i}
                  className="text-[12px] text-text-secondary pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1 before:h-1 before:bg-status-error before:rounded-full"
                >
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 h-10 px-4 text-[13px] font-medium text-text-secondary border border-border rounded-button bg-white hover:bg-surface-page transition-colors duration-150"
        >
          <ArrowLeft size={15} strokeWidth={1.5} />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!allApproved}
          className={`inline-flex items-center gap-2 h-10 px-6 text-[13px] font-medium rounded-button transition-colors duration-150 ${
            allApproved
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-surface-secondary text-text-tertiary cursor-not-allowed"
          }`}
        >
          {allApproved ? "Continue to Launch" : "Approve all sections to continue"}
          <ArrowRight size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
