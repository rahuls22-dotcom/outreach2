"use client";

// Per-product webhook config (Settings side of the new API model). Revspot is
// CRM-agnostic: leads arrive on our inbound API, results are POSTed to a webhook
// URL the CLIENT hosts (their CRM or backend). This card shows the inbound source
// note + lets the client's tech team set/edit the outbound webhook URL for THIS
// product, with status, last delivery, the events we emit, and a docs link.
// No stage gating — that lived in the old CRM-handshake model.

import { useState } from "react";
import { ArrowDown, Inbox, Webhook, ExternalLink, Clock } from "lucide-react";
import { getWebhook, inbound, DOCS_LINKS } from "@/lib/integration-data";
import type { ProductKey } from "@/lib/products";
import { WebhookStatusBadge, EventChips } from "@/components/integrations/api-bits";
import { ConfigCard } from "./product-config";

export function WebhookConfigCard({ product }: { product: ProductKey }) {
  const webhook = getWebhook(product);
  const [url, setUrl] = useState(webhook?.url ?? "");

  if (!webhook) return null;

  const configured = url.trim().length > 0;
  // Reflect the edited input: if the field is emptied, treat as not configured.
  const status = configured ? webhook.status : "not_configured";

  return (
    <ConfigCard
      title="Lead delivery"
      description="Leads arrive on the Revspot API; results are delivered to a webhook your team hosts."
      badge={<WebhookStatusBadge status={status} />}
    >
      {/* Inbound → Outbound flow */}
      <div className="rounded-card bg-surface-page border border-border-subtle p-3.5 mb-4">
        <div className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-1">
          Inbound · you push to Revspot
        </div>
        <div className="text-[12.5px] text-text-primary inline-flex items-center gap-1.5">
          <Inbox size={13} strokeWidth={1.5} className="text-text-tertiary" />
          <span className="font-mono">
            {inbound.method} {inbound.endpoint}
          </span>
        </div>
        <div className="flex justify-center my-1.5">
          <ArrowDown size={14} strokeWidth={1.5} className="text-text-tertiary" />
        </div>
        <div className="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-1">
          Outbound · Revspot pushes results to you
        </div>
        <div className="text-[12.5px] text-text-primary inline-flex items-center gap-1.5">
          <Webhook size={13} strokeWidth={1.5} className="text-text-tertiary" />
          {configured ? (
            <span className="font-mono truncate">{url}</span>
          ) : (
            <span className="text-text-tertiary">No webhook configured</span>
          )}
        </div>
      </div>

      {/* Webhook URL input */}
      <div className="mb-4">
        <label className="block text-[12.5px] font-medium text-text-primary mb-0.5">
          Your webhook URL
        </label>
        <div className="text-[11px] text-text-tertiary mb-2 leading-relaxed">
          Where we POST {product === "ai_calling" ? "call outcomes" : product === "campaigns" ? "campaign leads" : "enriched leads"} for this
          product. Hosted by your CRM or backend — each call is signed so you can verify it.
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://hooks.yourcompany.com/revspot/..."
          className="w-full h-9 px-3 text-[12.5px] font-mono border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary placeholder:font-sans"
        />
      </div>

      {/* Events + last delivery */}
      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-1.5">
            Events we emit
          </div>
          <EventChips events={webhook.events} />
        </div>
        {configured && webhook.lastDelivery && (
          <div className="inline-flex items-center gap-1.5 text-[11.5px] text-text-tertiary shrink-0">
            <Clock size={12} strokeWidth={1.5} />
            Last delivery {webhook.lastDelivery}
          </div>
        )}
      </div>

      {/* Docs link */}
      <a
        href={webhook.docs}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent-hover transition-colors duration-150"
      >
        Webhook payload reference
        <ExternalLink size={12} strokeWidth={1.5} />
      </a>
      <span className="text-text-tertiary text-[12px]"> · </span>
      <a
        href={DOCS_LINKS.signatures}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent-hover transition-colors duration-150"
      >
        Verify signatures
        <ExternalLink size={12} strokeWidth={1.5} />
      </a>
    </ConfigCard>
  );
}
