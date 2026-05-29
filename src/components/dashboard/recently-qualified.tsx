"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { recentlyQualifiedLeads } from "@/lib/mock-data";

const tempConfig = {
  warm: { label: "Warm", cls: "bg-[#F0FDF4] text-[#15803D]" },
  lukewarm: { label: "Lukewarm", cls: "bg-[#FEF3C7] text-[#92400E]" },
  cold: { label: "Cold", cls: "bg-surface-secondary text-text-secondary" },
};

export function RecentlyQualified() {
  return (
    <div className="bg-white border border-border rounded-card">
      <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between">
        <h2 className="text-section-header text-text-primary">Recently qualified leads</h2>
        <Link
          href="/enquiries?status=qualified"
          className="text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150 inline-flex items-center gap-1"
        >
          View all <ArrowRight size={12} strokeWidth={1.5} />
        </Link>
      </div>
      <div className="divide-y divide-border-subtle">
        {recentlyQualifiedLeads.map((lead) => {
          const temp = tempConfig[lead.temperature];
          return (
            <Link
              key={lead.id}
              href="/enquiries"
              className="block px-6 py-3 hover:bg-surface-page transition-colors duration-150"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-text-primary">{lead.name}</span>
                  <span className="text-[11px] text-text-tertiary tabular-nums">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-badge ${temp.cls}`}>{temp.label}</span>
                  {lead.crmSynced ? (
                    <CheckCircle2 size={13} strokeWidth={2} className="text-[#15803D]" />
                  ) : (
                    <Clock size={13} strokeWidth={1.5} className="text-text-tertiary" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-tertiary">{lead.campaign}</span>
                <span className="text-[11px] text-text-tertiary">·</span>
                <span className="text-[11px] text-text-tertiary">{lead.timeAgo}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
