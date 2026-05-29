"use client";

import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import type { AdSetState } from "./types";

interface AdvancedConfigModalProps {
  open: boolean;
  adSet: AdSetState;
  onClose: () => void;
  onChange: (updates: Partial<AdSetState>) => void;
}

const performanceGoalOptions = [
  { value: "maximize_conversions", label: "Maximize number of conversions" },
  { value: "landing_page_views", label: "Maximize number of landing page views" },
  { value: "link_clicks", label: "Maximize number of link clicks" },
  { value: "daily_unique_reach", label: "Maximize daily unique reach" },
];

const attributionWindowOptions = [
  { value: "1d_click", label: "1-day click" },
  { value: "7d_click", label: "7-day click" },
  { value: "7d_click_1d_view", label: "7-day click or 1-day view" },
];

const inventoryFilterOptions = [
  { value: "expanded", label: "Expanded Inventory" },
  { value: "moderate", label: "Moderate Inventory (Recommended)" },
  { value: "limited", label: "Limited Inventory" },
];

export function AdvancedConfigModal({ open, adSet, onClose, onChange }: AdvancedConfigModalProps) {
  const [performanceGoal, setPerformanceGoal] = useState("maximize_conversions");
  const [attributionWindow, setAttributionWindow] = useState("7d_click");
  const [inventoryFilter, setInventoryFilter] = useState("moderate");

  if (!open) return null;

  const placementCount = adSet.advantagePlusPlacements
    ? "Advantage+ (all placements)"
    : countManualPlacements(adSet);

  const targetingSummary = buildTargetingSummary(adSet);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[800px] max-h-[85vh] bg-white rounded-card shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-[16px] font-semibold text-text-primary">
            Ad Set Configuration &mdash; {adSet.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded-button transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Section 1: Conversion & Optimization */}
          <section>
            <SectionHeader>Conversion & Optimization</SectionHeader>

            <div className="space-y-4 mt-3">
              {/* Conversion Location */}
              <FieldRow label="Conversion Location">
                <span className="text-[13px] text-text-primary font-medium">Instant Forms</span>
                <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-badge bg-surface-page text-text-tertiary border border-border">
                  Locked
                </span>
              </FieldRow>

              {/* Performance Goal */}
              <FieldRow label="Performance Goal">
                <select
                  value={performanceGoal}
                  onChange={(e) => setPerformanceGoal(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors"
                >
                  {performanceGoalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FieldRow>

              {/* Attribution Window */}
              <FieldRow label="Attribution Window">
                <select
                  value={attributionWindow}
                  onChange={(e) => setAttributionWindow(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors"
                >
                  {attributionWindowOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FieldRow>
            </div>
          </section>

          <Divider />

          {/* Section 2: Budget & Schedule */}
          <section>
            <SectionHeader>Budget & Schedule</SectionHeader>

            <div className="space-y-4 mt-3">
              <FieldRow label="Budget">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-text-tertiary">&#x20B9;</span>
                    <input
                      type="number"
                      value={adSet.budget}
                      onChange={(e) => onChange({ budget: Number(e.target.value) || 0 })}
                      className="w-full h-9 pl-7 pr-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="flex bg-surface-page border border-border rounded-input overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => onChange({ budgetType: "daily" })}
                      className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                        adSet.budgetType === "daily"
                          ? "bg-accent text-white"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ budgetType: "lifetime" })}
                      className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                        adSet.budgetType === "lifetime"
                          ? "bg-accent text-white"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Lifetime
                    </button>
                  </div>
                </div>
              </FieldRow>
            </div>
          </section>

          <Divider />

          {/* Section 3: Audience */}
          <section>
            <SectionHeader>Audience</SectionHeader>

            <div className="mt-3 space-y-2">
              <ReadOnlyField label="Locations">
                {adSet.locations.map((l) => l.name).join(", ") || "Not set"}
              </ReadOnlyField>
              <ReadOnlyField label="Age">
                {adSet.ageMin} &ndash; {adSet.ageMax === 65 ? "65+" : adSet.ageMax}
              </ReadOnlyField>
              <ReadOnlyField label="Gender">
                {adSet.gender === "all" ? "All genders" : adSet.gender === "male" ? "Men" : "Women"}
              </ReadOnlyField>
              <ReadOnlyField label="Detailed Targeting">
                {targetingSummary}
              </ReadOnlyField>

              <EditInCardLink />
            </div>
          </section>

          <Divider />

          {/* Section 4: Placements */}
          <section>
            <SectionHeader>Placements</SectionHeader>

            <div className="mt-3 space-y-2">
              <ReadOnlyField label="Mode">
                {adSet.advantagePlusPlacements ? "Advantage+ Placements (recommended)" : "Manual Placements"}
              </ReadOnlyField>
              <ReadOnlyField label="Active">
                {placementCount}
              </ReadOnlyField>

              <EditInCardLink />
            </div>
          </section>

          <Divider />

          {/* Section 5: Brand Safety */}
          <section>
            <SectionHeader>Brand Safety</SectionHeader>

            <div className="space-y-4 mt-3">
              <FieldRow label="Inventory Filter">
                <select
                  value={inventoryFilter}
                  onChange={(e) => setInventoryFilter(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors"
                >
                  {inventoryFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Block Lists">
                <textarea
                  placeholder="Enter domain block list (one per line)..."
                  rows={3}
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors resize-none placeholder:text-text-tertiary"
                />
              </FieldRow>

              <FieldRow label="Content Exclusions">
                <p className="text-[12px] text-text-tertiary">
                  Content exclusions allow you to prevent your ads from appearing alongside certain types of content.
                  Configure in Meta Ads Manager for full control.
                </p>
              </FieldRow>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 text-[13px] font-medium bg-white border border-border text-text-primary rounded-button hover:bg-surface-page transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Helper sub-components ---- */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[13px] font-semibold text-text-primary uppercase tracking-[0.3px]">
      {children}
    </h3>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-[11px] font-medium text-text-tertiary mb-1">{label}</span>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[11px] font-medium text-text-tertiary w-[120px] shrink-0">{label}</span>
      <span className="text-[12px] text-text-primary">{children}</span>
    </div>
  );
}

function EditInCardLink() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-hover cursor-pointer mt-1">
      <ExternalLink size={10} strokeWidth={1.5} />
      Edit in card
    </span>
  );
}

/* ---- Helpers ---- */

function countManualPlacements(adSet: AdSetState): string {
  const p = adSet.manualPlacements;
  let count = 0;
  for (const platform of Object.values(p)) {
    for (const enabled of Object.values(platform)) {
      if (enabled) count++;
    }
  }
  return `${count} placements selected`;
}

function buildTargetingSummary(adSet: AdSetState): string {
  const t = adSet.detailedTargeting;
  const parts: string[] = [];
  if (t.included.length > 0) parts.push(`${t.included.length} included`);
  if (t.excluded.length > 0) parts.push(`${t.excluded.length} excluded`);
  return parts.length > 0 ? parts.join(", ") : "None";
}
