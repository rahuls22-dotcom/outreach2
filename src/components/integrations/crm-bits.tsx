"use client";

// Small shared display primitives for CRM connections — provider mark, status
// badge, product tags, capability chips. Reused by the connections list, the
// detail page, and the connect wizard.

import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { PROVIDER_META, CAPABILITY_LABELS } from "@/lib/crm-integration-data";
import type { CrmProvider, Capability, CrmConnection } from "@/lib/crm-integration-data";
import { ALL_PRODUCTS, type ProductKey } from "@/lib/products";

export function ProviderMark({ provider, size = 36 }: { provider: CrmProvider; size?: number }) {
  const m = PROVIDER_META[provider];
  return (
    <div
      className="rounded-[8px] flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: m.tint,
        color: m.ink,
        fontSize: size <= 28 ? 10 : 13,
      }}
    >
      {m.mark}
    </div>
  );
}

export function StatusBadge({ status }: { status: CrmConnection["status"] }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-badge bg-[#F0FDF4] text-[#15803D]">
        <CheckCircle2 size={11} strokeWidth={2} />
        Connected
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-badge bg-[#FEF3C7] text-[#92400E]">
        <Loader2 size={11} strokeWidth={2} />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-badge bg-[#FEF2F2] text-[#B91C1C]">
      <AlertTriangle size={11} strokeWidth={2} />
      Error
    </span>
  );
}

const PRODUCT_LABEL: Record<ProductKey, string> = Object.fromEntries(
  ALL_PRODUCTS.map((p) => [p.key, p.label]),
) as Record<ProductKey, string>;

export function ProductTags({ products }: { products: ProductKey[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {products.map((p) => (
        <span
          key={p}
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-badge bg-surface-secondary text-text-secondary"
        >
          {PRODUCT_LABEL[p]}
        </span>
      ))}
    </div>
  );
}

export function CapabilityChips({ capabilities }: { capabilities: Capability[] }) {
  const all: Capability[] = ["read_rows", "create_row", "update_row", "create_field"];
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {all.map((cap) => {
        const on = capabilities.includes(cap);
        return (
          <span
            key={cap}
            className={`text-[11px] font-medium px-2 py-0.5 rounded-badge border ${
              on
                ? "border-[#C7D2FE] bg-[#EEF2FF] text-[#3730A3]"
                : "border-border bg-surface-page text-text-tertiary line-through"
            }`}
          >
            {CAPABILITY_LABELS[cap]}
          </span>
        );
      })}
    </div>
  );
}
