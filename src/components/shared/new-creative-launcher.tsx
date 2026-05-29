"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { campaignsList } from "@/lib/campaign-data";
import { angleData, strategyData } from "@/lib/wizard-data";

export interface LaunchContext {
  angleName: string;
  personaName: string;
  personaRole?: string;
  personaBullets?: string[];
  painPoint: string;
  usp: string;
  hook: string;
  cta: string;
  /** Source campaign name for library-tagging when generated from "From a campaign". */
  sourceCampaign?: string;
}

interface NewCreativeLauncherProps {
  open: boolean;
  onClose: () => void;
  /** Called when the user clicks Continue. Hands the strategy off to the generator modal. */
  onContinue: (ctx: LaunchContext) => void;
}

type Tab = "existing" | "scratch";

const blankStrategy: LaunchContext = {
  angleName: "",
  personaName: "",
  personaRole: "",
  personaBullets: [],
  painPoint: "",
  usp: "",
  hook: "",
  cta: "",
};

export function NewCreativeLauncher({ open, onClose, onContinue }: NewCreativeLauncherProps) {
  const [tab, setTab] = useState<Tab>("existing");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [angleId, setAngleId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LaunchContext>(blankStrategy);

  // Reset state every time the launcher opens.
  useEffect(() => {
    if (!open) return;
    setTab("existing");
    setCampaignId(campaignsList[0]?.id ?? null);
    setAngleId(null);
    setDraft(blankStrategy);
  }, [open]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const selectedCampaign = useMemo(
    () => campaignsList.find((c) => c.id === campaignId) ?? null,
    [campaignId]
  );

  // For the mock dataset, every campaign exposes the same angleData. In a real
  // app these would be per-campaign.
  const angles = angleData;
  const selectedAngle = useMemo(() => angles.find((a) => a.id === angleId) ?? null, [angles, angleId]);

  const draftOk =
    draft.angleName.trim().length > 0 &&
    draft.painPoint.trim().length > 0 &&
    draft.usp.trim().length > 0 &&
    draft.hook.trim().length > 0 &&
    draft.cta.trim().length > 0;
  const canContinue = tab === "existing" ? !!selectedAngle : draftOk;

  const handleContinue = () => {
    if (tab === "existing" && selectedAngle) {
      const persona = strategyData.personas.find((p) => p.id === selectedAngle.personaId);
      onContinue({
        angleName: selectedAngle.angleName,
        personaName: selectedAngle.personaName,
        personaRole: persona?.role,
        personaBullets: persona?.bullets,
        painPoint: selectedAngle.painPoint,
        usp: selectedAngle.usp,
        hook: selectedAngle.hook,
        cta: selectedAngle.cta,
        sourceCampaign: selectedCampaign?.client ?? selectedCampaign?.name,
      });
      return;
    }
    if (tab === "scratch" && draftOk) {
      onContinue({
        ...draft,
        personaRole: draft.personaRole?.trim() || undefined,
      });
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-[80] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          key="dialog"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-card border border-border shadow-2xl w-full max-w-[720px] max-h-[88vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gradient-to-r from-[#F5F3FF] via-white to-[#FAE8FF]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={14} strokeWidth={1.5} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-text-primary leading-tight">
                  New creative
                </div>
                <div className="text-[11px] text-text-tertiary leading-tight">
                  Pick a strategy to anchor the generation
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded-button transition-colors"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-5 pt-4 border-b border-border-subtle bg-white">
            <div className="flex items-center gap-1">
              <TabButton active={tab === "existing"} onClick={() => setTab("existing")} icon={<Building2 size={13} strokeWidth={1.5} />}>
                From a campaign
              </TabButton>
              <TabButton active={tab === "scratch"} onClick={() => setTab("scratch")} icon={<Target size={13} strokeWidth={1.5} />}>
                Define a new strategy
              </TabButton>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-surface-page">
            {tab === "existing" ? (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-1.5">
                    Campaign
                  </label>
                  <div className="relative">
                    <select
                      value={campaignId ?? ""}
                      onChange={(e) => {
                        setCampaignId(e.target.value || null);
                        setAngleId(null);
                      }}
                      className="w-full appearance-none h-9 px-3 pr-8 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-violet-500 transition-colors duration-150 cursor-pointer"
                    >
                      {campaignsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      strokeWidth={1.5}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                    />
                  </div>
                  {selectedCampaign && (
                    <p className="text-[10px] text-text-tertiary mt-1">
                      {selectedCampaign.client} · {selectedCampaign.type}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-1.5">
                    Persona &amp; angle
                  </label>
                  <div className="space-y-2">
                    {angles.map((a) => {
                      const isActive = a.id === angleId;
                      const persona = strategyData.personas.find((p) => p.id === a.personaId);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setAngleId(a.id)}
                          className={`w-full text-left rounded-card border transition-all duration-150 overflow-hidden ${
                            isActive
                              ? "border-violet-400 bg-white shadow-[0_8px_24px_-12px_rgba(139,92,246,0.35)]"
                              : "border-border bg-white hover:border-violet-200 hover:bg-violet-50/30"
                          }`}
                        >
                          <div className="px-4 py-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[12px] font-semibold text-text-primary flex items-center gap-1.5">
                                <Users size={11} strokeWidth={1.5} className="text-text-tertiary" />
                                {a.personaName}
                                {persona?.role && (
                                  <span className="text-text-tertiary font-normal text-[10px]">
                                    · {persona.role}
                                  </span>
                                )}
                              </div>
                              <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold uppercase tracking-[0.5px] bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                                Angle · {a.angleName}
                              </div>
                            </div>
                            <span
                              className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors ${
                                isActive
                                  ? "bg-violet-500 text-white"
                                  : "border border-border text-transparent"
                              }`}
                            >
                              {isActive && <Check size={11} strokeWidth={2.5} />}
                            </span>
                          </div>
                          <AnimatePresence initial={false}>
                            {isActive && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border-subtle pt-3">
                                  {(
                                    [
                                      { label: "Pain point", value: a.painPoint },
                                      { label: "USP", value: a.usp },
                                      { label: "Hook", value: a.hook },
                                      { label: "CTA", value: a.cta },
                                    ] as const
                                  ).map((f) => (
                                    <div key={f.label}>
                                      <div className="text-[9px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-0.5">
                                        {f.label}
                                      </div>
                                      <div className="text-[11px] text-text-primary leading-snug">
                                        {f.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-3">
                <p className="text-[11px] text-text-tertiary">
                  Fill these in to anchor the generation. You can keep refining them later from
                  the Creative Strategy panel inside the generator.
                </p>
                <ScratchInput
                  label="Angle name"
                  placeholder="e.g., Lifestyle Upgrade"
                  value={draft.angleName}
                  onChange={(v) => setDraft((d) => ({ ...d, angleName: v }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <ScratchInput
                    label="Persona"
                    placeholder="e.g., Rahul, 34"
                    value={draft.personaName}
                    onChange={(v) => setDraft((d) => ({ ...d, personaName: v }))}
                  />
                  <ScratchInput
                    label="Persona role"
                    placeholder="e.g., Senior IT Professional"
                    value={draft.personaRole ?? ""}
                    onChange={(v) => setDraft((d) => ({ ...d, personaRole: v }))}
                  />
                </div>
                <ScratchInput
                  label="Pain point"
                  placeholder="What problem the audience is facing"
                  value={draft.painPoint}
                  onChange={(v) => setDraft((d) => ({ ...d, painPoint: v }))}
                  multiline
                />
                <ScratchInput
                  label="USP"
                  placeholder="Your differentiating value"
                  value={draft.usp}
                  onChange={(v) => setDraft((d) => ({ ...d, usp: v }))}
                  multiline
                />
                <ScratchInput
                  label="Hook"
                  placeholder="The headline that grabs attention"
                  value={draft.hook}
                  onChange={(v) => setDraft((d) => ({ ...d, hook: v }))}
                  multiline
                />
                <ScratchInput
                  label="CTA"
                  placeholder="What you want the user to do"
                  value={draft.cta}
                  onChange={(v) => setDraft((d) => ({ ...d, cta: v }))}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-white px-5 py-3 flex items-center justify-between gap-3">
            <div className="text-[11px] text-text-tertiary">
              {tab === "existing"
                ? selectedAngle
                  ? `Strategy: ${selectedAngle.angleName} · ${selectedAngle.personaName}`
                  : "Pick a persona/angle to continue"
                : draftOk
                ? "Ready to generate"
                : "Fill in the strategy fields"}
            </div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-button transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_-4px_rgba(139,92,246,0.5)]"
            >
              Continue
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab button                                                         */
/* ------------------------------------------------------------------ */

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function TabButton({ active, onClick, icon, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-[12px] font-medium transition-colors ${
        active ? "text-violet-700" : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {icon}
      {children}
      {active && (
        <motion.span
          layoutId="newcreative-tab-underline"
          className="absolute -bottom-px left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500"
          transition={{ duration: 0.2 }}
        />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Scratch tab field                                                  */
/* ------------------------------------------------------------------ */

interface ScratchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}

function ScratchInput({ label, placeholder, value, onChange, multiline }: ScratchInputProps) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full px-2.5 py-1.5 text-[12px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-violet-500 transition-colors duration-150 resize-none leading-relaxed placeholder:text-text-tertiary"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2.5 py-1.5 text-[12px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-violet-500 transition-colors duration-150 placeholder:text-text-tertiary"
        />
      )}
    </div>
  );
}
