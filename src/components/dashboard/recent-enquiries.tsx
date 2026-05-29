"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import type { RecentLead } from "@/lib/mock-data";

const statusConfig = {
  qualified: {
    label: "Qualified",
    className: "text-status-success bg-[#F0FDF4]",
  },
  not_qualified: {
    label: "Not qualified",
    className: "text-status-error bg-[#FEF2F2]",
  },
  pending: {
    label: "Pending",
    className: "text-text-tertiary bg-surface-secondary",
  },
};

interface RecentLeadsProps {
  leads: RecentLead[];
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  return (
    <div className="bg-white border border-border rounded-card">
      <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between">
        <h2 className="text-section-header text-text-primary">Recent leads</h2>
        <Link
          href="/enquiries"
          className="text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150 inline-flex items-center gap-1"
        >
          View all
          <ArrowRight size={12} strokeWidth={1.5} />
        </Link>
      </div>
      <div className="divide-y divide-border-subtle">
        {leads.map((lead) => {
          const status = statusConfig[lead.status];
          return (
            <Link
              key={lead.id}
              href="/enquiries"
              className="block px-6 py-3.5 hover:bg-surface-page transition-colors duration-150"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-text-primary">
                    {lead.name}
                  </span>
                  {lead.verified && (
                    <BadgeCheck size={13} strokeWidth={2} className="text-status-success" />
                  )}
                  <span className="text-[12px] text-text-tertiary ml-1">{lead.phone}</span>
                </div>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-badge ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-tertiary">{lead.campaign}</span>
                <span className="text-[12px] text-text-tertiary">·</span>
                <span className="text-[12px] text-text-tertiary">{lead.timeAgo}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
