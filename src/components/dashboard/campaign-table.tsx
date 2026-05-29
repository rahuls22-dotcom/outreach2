"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, AlertTriangle, XCircle } from "lucide-react";
import type { CampaignRow } from "@/lib/mock-data";

function formatCurrency(amount: number) {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

function CampaignStatus({ status }: { status: CampaignRow["status"] }) {
  const config = {
    "on-track": {
      icon: CircleCheck,
      label: "On track",
      className: "text-status-success bg-[#F0FDF4]",
    },
    "needs-attention": {
      icon: AlertTriangle,
      label: "Attention",
      className: "text-[#92400E] bg-[#FEF3C7]",
    },
    underperforming: {
      icon: XCircle,
      label: "Low",
      className: "text-status-error bg-[#FEF2F2]",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-badge ${className}`}>
      <Icon size={11} strokeWidth={2} />
      {label}
    </span>
  );
}

interface CampaignTableProps {
  campaigns: CampaignRow[];
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white border border-border rounded-card">
      <div className="px-6 py-5 border-b border-border-subtle">
        <h2 className="text-section-header text-text-primary">Campaign performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left px-6 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Campaign
              </th>
              <th className="text-right px-3 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Spend
              </th>
              <th className="text-right px-3 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Leads
              </th>
              <th className="text-right px-3 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Verified
              </th>
              <th className="text-right px-3 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                CPL
              </th>
              <th className="text-center px-6 py-3 text-[12px] font-medium text-text-tertiary uppercase tracking-[0.5px]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign, i) => (
              <tr
                key={campaign.id}
                onClick={() => router.push(`/campaigns/${campaign.id}`)}
                className={`hover:bg-surface-page transition-colors duration-150 cursor-pointer ${
                  i % 2 === 0 ? "bg-white" : "bg-surface-page/50"
                }`}
              >
                <td className="px-6 py-3.5 text-[13px] text-text-primary font-medium max-w-[260px] truncate">
                  {campaign.name}
                </td>
                <td className="px-3 py-3.5 text-[13px] text-text-primary text-right tabular-nums">
                  {formatCurrency(campaign.spend)}
                </td>
                <td className="px-3 py-3.5 text-[13px] text-text-primary text-right tabular-nums">
                  {campaign.leads}
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums">
                  <span className="text-[13px] text-text-primary">{campaign.verified}</span>
                  <span className="text-[11px] text-text-tertiary ml-1">
                    ({Math.round((campaign.verified / campaign.leads) * 100)}%)
                  </span>
                </td>
                <td className="px-3 py-3.5 text-[13px] text-text-primary text-right tabular-nums">
                  ₹{campaign.cpl.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-3.5 text-center">
                  <CampaignStatus status={campaign.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-border-subtle">
        <Link
          href="/campaigns"
          className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150 inline-flex items-center gap-1"
        >
          View all campaigns
          <ArrowRight size={13} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}
