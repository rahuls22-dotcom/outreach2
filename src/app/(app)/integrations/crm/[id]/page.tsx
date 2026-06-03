"use client";

// CRM connection detail (Model A). Everything about ONE handshake: capabilities,
// the API key we issue, products served, field mapping, and sync log. Per-product
// behavior config lives in Settings — this page links there, doesn't duplicate it.

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Unplug,
  Copy,
  Check,
  CheckCircle2,
  X,
  RefreshCw,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";
import { getConnection, PROVIDER_META } from "@/lib/crm-integration-data";
import type { FieldMap } from "@/lib/crm-integration-data";
import { ProviderMark, StatusBadge, CapabilityChips } from "@/components/integrations/crm-bits";
import { ALL_PRODUCTS } from "@/lib/products";

function Section({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-card overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-page transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-card-title text-text-primary">{title}</h3>
          {badge && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-badge bg-surface-secondary text-text-secondary">
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronDown size={14} strokeWidth={1.5} className="text-text-tertiary" />
        ) : (
          <ChevronRight size={14} strokeWidth={1.5} className="text-text-tertiary" />
        )}
      </button>
      {open && <div className="px-5 pb-5 pt-2 border-t border-border-subtle">{children}</div>}
    </div>
  );
}

const DIR_ICON: Record<FieldMap["direction"], React.ReactNode> = {
  to_crm: <ArrowRight size={11} strokeWidth={1.5} className="text-text-tertiary" />,
  from_crm: <ArrowLeft size={11} strokeWidth={1.5} className="text-text-tertiary" />,
  both: <ArrowLeftRight size={11} strokeWidth={1.5} className="text-text-tertiary" />,
};
const DIR_LABEL: Record<FieldMap["direction"], string> = {
  to_crm: "Revspot → CRM",
  from_crm: "CRM → Revspot",
  both: "Two-way",
};

const PRODUCT_LABEL = Object.fromEntries(ALL_PRODUCTS.map((p) => [p.key, p.label])) as Record<
  string,
  string
>;
const PRODUCT_SETTINGS_PATH: Record<string, string> = {
  enrichment: "/settings/enrichment",
  ai_calling: "/settings/ai-calling",
  campaigns: "/settings/campaigns",
};

export default function CrmConnectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const conn = getConnection(id);
  const [copied, setCopied] = useState(false);

  if (!conn) {
    return (
      <div className="max-w-[640px]">
        <Link
          href="/integrations"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-text-secondary hover:text-text-primary transition-colors duration-150 mb-6"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to Integrations
        </Link>
        <div className="bg-white border border-border rounded-card p-8 text-center">
          <div className="text-[14px] font-semibold text-text-primary">Connection not found</div>
          <div className="text-[12.5px] text-text-secondary mt-1">
            This connection may have been removed.
          </div>
        </div>
      </div>
    );
  }

  const meta = PROVIDER_META[conn.provider];
  const failedCount = conn.syncLog.filter((e) => e.status === "failed").length;
  const successCount = conn.syncLog.length - failedCount;

  const copyKey = () => {
    navigator.clipboard?.writeText(conn.apiKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-[860px]">
      <Link
        href="/integrations"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-text-secondary hover:text-text-primary transition-colors duration-150 mb-5"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Back to Integrations
      </Link>

      {/* Header */}
      <div className="bg-white border border-border rounded-card p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <ProviderMark provider={conn.provider} size={42} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-semibold text-text-primary">{conn.label}</h1>
                <StatusBadge status={conn.status} />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-text-secondary">
                <span>{meta.name}</span>
                <span className="text-border-strong">·</span>
                <span className="font-mono">{conn.crmUrl}</span>
                {conn.connectedAgo && (
                  <>
                    <span className="text-border-strong">·</span>
                    <span>Connected {conn.connectedAgo}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push("/integrations")}
            className="text-[12px] text-text-tertiary hover:text-status-error transition-colors duration-150 flex items-center gap-1 shrink-0"
          >
            <Unplug size={11} strokeWidth={1.5} />
            Disconnect
          </button>
        </div>

        {/* Capabilities */}
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <div className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-2">
            Capabilities granted
          </div>
          <CapabilityChips capabilities={conn.capabilities} />
        </div>
      </div>

      {/* API key (Revspot → client inbound) */}
      <Section title="Inbound API key" badge="Push leads into Revspot" defaultOpen>
        <p className="text-[12px] text-text-secondary leading-relaxed mb-3">
          Use this key to push leads from {meta.name} into Revspot. Send to{" "}
          <span className="font-mono text-text-primary">POST /v1/leads</span> with header{" "}
          <span className="font-mono text-text-primary">X-Revspot-Key</span>.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 h-9 px-3 flex items-center text-[12px] font-mono border border-border rounded-input bg-surface-page text-text-primary">
            {conn.apiKey}
          </code>
          <button
            onClick={copyKey}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-[12px] font-medium border border-border rounded-button text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors duration-150"
          >
            {copied ? (
              <>
                <Check size={13} strokeWidth={2} className="text-[#15803D]" />
                Copied
              </>
            ) : (
              <>
                <Copy size={13} strokeWidth={1.5} />
                Copy
              </>
            )}
          </button>
        </div>
      </Section>

      {/* Products served */}
      <div className="mt-4">
        <Section title="Products served" badge={`${conn.products.length}`} defaultOpen>
          <div className="space-y-2">
            {conn.products.map((p) => (
              <Link
                key={p}
                href={PRODUCT_SETTINGS_PATH[p] || "/settings"}
                className="group flex items-center justify-between px-3.5 py-2.5 border border-border rounded-button hover:border-border-strong transition-colors duration-150"
              >
                <span className="text-[13px] font-medium text-text-primary">
                  {PRODUCT_LABEL[p] || p}
                </span>
                <span className="inline-flex items-center gap-1 text-[11.5px] text-text-tertiary group-hover:text-text-secondary transition-colors duration-150">
                  Configure behavior in Settings
                  <ChevronRight size={13} strokeWidth={1.5} />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      </div>

      {/* Field mapping */}
      <div className="mt-4">
        <Section
          title="Field mapping"
          badge={`${conn.fieldMaps.length} fields`}
          defaultOpen
        >
          <div className="flex items-center gap-2 mb-3">
            <button className="inline-flex items-center gap-1 text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150">
              <RefreshCw size={12} strokeWidth={1.5} />
              Auto-detect fields
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Revspot field", "Direction", `${meta.name} field`, ""].map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conn.fieldMaps.map((fm) => (
                <tr key={fm.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-3 py-2.5 text-[12px] text-text-primary font-medium">
                    {fm.revspotField}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-text-secondary"
                      title={DIR_LABEL[fm.direction]}
                    >
                      {DIR_ICON[fm.direction]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[12px] font-mono text-text-primary">{fm.crmField}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {fm.isCreated && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-badge bg-[#EEF2FF] text-[#3730A3]">
                        Created by Revspot
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>

      {/* Sync log */}
      <div className="mt-4 mb-8">
        <Section title="Sync log" badge={conn.lastSync ? `Last sync: ${conn.lastSync}` : undefined}>
          <div className="text-[12px] text-text-secondary mb-3">
            <span className="font-medium text-text-primary">{successCount} success</span> ·{" "}
            <span className="font-medium text-status-error">{failedCount} failed</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Time", "Lead", "Action", "Status", "Details"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conn.syncLog.map((entry) => (
                <tr key={entry.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-3 py-2 text-[11px] text-text-tertiary whitespace-nowrap">
                    {entry.time}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-text-primary font-medium whitespace-nowrap">
                    {entry.leadName}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-text-secondary whitespace-nowrap">
                    {entry.action}
                  </td>
                  <td className="px-3 py-2">
                    {entry.status === "success" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#15803D]">
                        <CheckCircle2 size={11} strokeWidth={2} />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-error">
                        <X size={11} strokeWidth={2} />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-text-secondary">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}
