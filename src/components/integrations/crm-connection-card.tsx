"use client";

// One row in the global CRM Connections list (Model A). Each card is a single
// CRM handshake tagged with the product(s) it serves. Click → detail page.

import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";
import { PROVIDER_META } from "@/lib/crm-integration-data";
import type { CrmConnection } from "@/lib/crm-integration-data";
import { ProviderMark, StatusBadge, ProductTags } from "./crm-bits";

export function CrmConnectionCard({ conn }: { conn: CrmConnection }) {
  const meta = PROVIDER_META[conn.provider];
  return (
    <Link
      href={`/integrations/crm/${conn.id}`}
      className="group block bg-white border border-border rounded-card p-4 hover:border-border-strong transition-colors duration-150"
    >
      <div className="flex items-center gap-3.5">
        <ProviderMark provider={conn.provider} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold text-text-primary truncate">
              {conn.label}
            </span>
            <StatusBadge status={conn.status} />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11.5px] text-text-tertiary">
            <span>{meta.name}</span>
            <span className="text-border-strong">·</span>
            <span className="font-mono truncate max-w-[220px]">{conn.crmUrl}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <ProductTags products={conn.products} />
          {conn.lastSync && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-text-tertiary whitespace-nowrap">
              <RefreshCw size={10} strokeWidth={1.5} />
              {conn.lastSync}
            </span>
          )}
          <ChevronRight
            size={15}
            strokeWidth={1.5}
            className="text-text-tertiary group-hover:text-text-secondary transition-colors duration-150"
          />
        </div>
      </div>
    </Link>
  );
}
