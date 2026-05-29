"use client";

import { Lock } from "lucide-react";
import type { CampaignSettings, BidStrategy } from "./types";

interface CampaignSettingsProps {
  campaign: CampaignSettings;
  onChange: (updates: Partial<CampaignSettings>) => void;
}

/* ─── Toggle switch ─── */
const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-150 ${
        checked ? "bg-accent" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-150 ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
    {label && <span className="text-[11px] text-text-tertiary">{checked ? "ON" : "OFF"}</span>}
  </div>
);

export function CampaignSettingsCard({ campaign, onChange }: CampaignSettingsProps) {
  return (
    <div>
      <h2 className="text-[16px] font-semibold text-text-primary mb-5">Campaign Settings</h2>

      <div className="space-y-5">
        {/* ── 1. Campaign Name ── */}
        <div>
          <label className="block text-[11px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-1.5">
            Campaign Name
          </label>
          <input
            type="text"
            value={campaign.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full h-9 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary"
            placeholder="Enter campaign name"
          />
        </div>

        {/* ── 2. Campaign Objective (locked from Step 1) ── */}
        <div>
          <label className="block text-[11px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-1.5">
            Campaign Objective
          </label>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-full bg-surface-secondary text-text-primary">
            <Lock size={10} strokeWidth={2} className="text-text-tertiary" />
            {campaign.objective === "leads" ? "Leads" : campaign.objective.charAt(0).toUpperCase() + campaign.objective.slice(1)}
          </div>
          <p className="text-[10px] text-text-tertiary mt-1">Set in Campaign Input. Cannot be changed here.</p>
        </div>

        {/* ── 3. Advantage Campaign Budget (CBO) ── */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[13px] font-medium text-text-primary">Advantage Campaign Budget</span>
              <p className="text-[11px] text-text-tertiary mt-0.5">Let Meta optimize budget across ad sets</p>
            </div>
            <Toggle checked={campaign.cboEnabled} onChange={() => onChange({ cboEnabled: !campaign.cboEnabled })} label="toggle" />
          </div>

          {/* Campaign Budget (conditional on CBO) */}
          {campaign.cboEnabled && (
            <div className="mt-3 flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-text-secondary">₹</span>
                <input
                  type="number"
                  value={campaign.budget}
                  onChange={(e) => onChange({ budget: Number(e.target.value) })}
                  className="w-full h-9 pl-7 pr-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150"
                />
              </div>
              <div className="flex rounded-input border border-border overflow-hidden">
                {(["daily", "lifetime"] as const).map((bt) => (
                  <button key={bt} type="button" onClick={() => onChange({ budgetType: bt })}
                    className={`px-3 h-9 text-[12px] font-medium transition-colors duration-150 ${
                      campaign.budgetType === bt ? "bg-accent text-white" : "bg-white text-text-secondary hover:bg-surface-secondary"
                    }`}>
                    {bt === "daily" ? "Daily" : "Lifetime"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Bid Strategy (only relevant options for lead gen) ── */}
        <div>
          <label className="block text-[11px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-1.5">
            Bid Strategy
          </label>
          <div className="flex gap-2">
            {([
              { value: "highest_volume" as BidStrategy, label: "Highest Volume", desc: "Get the most leads within your budget" },
              { value: "cost_per_result" as BidStrategy, label: "Cost Per Result Goal", desc: "Set a target cost per lead" },
            ]).map((opt) => (
              <button key={opt.value} type="button" onClick={() => onChange({ bidStrategy: opt.value })}
                className={`flex-1 text-left p-3 rounded-[8px] border transition-colors duration-150 ${
                  campaign.bidStrategy === opt.value
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-border-hover"
                }`}>
                <div className="text-[12px] font-medium text-text-primary">{opt.label}</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>

          {campaign.bidStrategy === "cost_per_result" && (
            <div className="mt-3">
              <label className="block text-[11px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-1.5">
                Target Cost Per Lead
              </label>
              <div className="relative w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-text-secondary">₹</span>
                <input
                  type="number"
                  value={campaign.targetCPA ?? ""}
                  onChange={(e) => onChange({ targetCPA: e.target.value ? Number(e.target.value) : null })}
                  className="w-full h-9 pl-7 pr-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150"
                  placeholder="e.g., 1200"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
