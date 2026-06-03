// Integration mock data + types. Prototype only — no backend.
//
// New model (post-pivot): Revspot is CRM-agnostic. We expose ONE inbound API
// (client pushes leads to us) and accept per-product OUTBOUND webhook URLs that
// the CLIENT hosts (their CRM or backend) — we POST results there, signed with
// our secret. We don't connect into any CRM. The client's tech team wires it up
// from external docs.

import type { ProductKey } from "@/lib/products";

// External developer docs (placeholder host for the prototype).
export const DOCS_BASE = "https://docs.revspot.ai";
export const DOCS_LINKS = {
  push: `${DOCS_BASE}/push-leads`,
  webhooks: `${DOCS_BASE}/webhooks`,
  signatures: `${DOCS_BASE}/webhooks/signature-verification`,
  enrichment: `${DOCS_BASE}/webhooks/enrichment`,
  ai_calling: `${DOCS_BASE}/webhooks/calls`,
  campaigns: `${DOCS_BASE}/webhooks/campaigns`,
} as const;

export type WebhookStatus = "active" | "not_configured" | "failing";

export interface WebhookDelivery {
  id: string;
  time: string;
  event: string;
  status: "delivered" | "failed";
  responseCode: number;
  detail: string;
}

// Events emitted per product — referenced in the outbound config + docs.
export const PRODUCT_EVENTS: Record<ProductKey, string[]> = {
  enrichment: ["lead.enriched"],
  ai_calling: ["call.completed", "lead.qualified"],
  campaigns: ["lead.created", "lead.qualified"],
};

// ── Inbound (client → Revspot) ──────────────────────────────
export const inbound = {
  endpoint: "https://api.revspot.ai/v1/leads",
  method: "POST",
  apiKey: "rvk_live_8f3c2a9b7d1e4056a2c9",
  // Header the client sets on each push request.
  authHeader: "Authorization: Bearer <API_KEY>",
};

// ── Outbound (Revspot → client webhook) ─────────────────────
// ONE webhook URL for the whole workspace (Stripe/GitHub model). Every call
// carries `event` + `product` so the client routes server-side. The client
// hosts this URL (their CRM or backend). Each call is signed with the secret
// below so the client can verify it came from Revspot.
export const signingSecret = "whsec_4d7a1f9c3b6e2058";

export const outbound = {
  url: "https://hooks.godrejproperties.com/revspot",
  status: "active" as WebhookStatus,
  lastDelivery: "2 minutes ago",
};

// Per-product event reference — what events the single webhook receives for
// each product the workspace owns. Shown read-only so the tech team knows the
// payload shapes to branch on.
export const PRODUCT_EVENT_DOCS: Record<ProductKey, string> = {
  enrichment: DOCS_LINKS.enrichment,
  ai_calling: DOCS_LINKS.ai_calling,
  campaigns: DOCS_LINKS.campaigns,
};

// Recent outbound deliveries (shown in the webhook log).
export const recentDeliveries: WebhookDelivery[] = [
  { id: "d1", time: "2 min ago", event: "lead.enriched", status: "delivered", responseCode: 200, detail: "Contact #4521 enriched" },
  { id: "d2", time: "8 min ago", event: "call.completed", status: "delivered", responseCode: 200, detail: "Call outcome posted" },
  { id: "d3", time: "15 min ago", event: "lead.enriched", status: "failed", responseCode: 503, detail: "Endpoint timed out — retrying" },
  { id: "d4", time: "42 min ago", event: "lead.qualified", status: "delivered", responseCode: 202, detail: "Lead #4490 queued" },
  { id: "d5", time: "1 hr ago", event: "lead.enriched", status: "delivered", responseCode: 200, detail: "Contact #4480 enriched" },
];

// Sample payload shown inline so the client's tech team sees the shape.
export const SAMPLE_PAYLOADS: Record<string, string> = {
  "lead.enriched": `{
  "event": "lead.enriched",
  "id": "evt_8f3c2a9b",
  "data": {
    "lead_id": "rl_4521",
    "full_name": "V***** R*****",
    "phone": "+91 98XXXXXX21",
    "email": "v****@example.com",
    "enrichment": {
      "company": "Infosys",
      "job_title": "Engineering Manager",
      "income_band": "30-50L",
      "property_interest": "3BHK · Whitefield"
    }
  }
}`,
  "call.completed": `{
  "event": "call.completed",
  "id": "evt_2b6e1f0a",
  "data": {
    "lead_id": "rl_4490",
    "outcome": "connected",
    "qualified": true,
    "recording_url": "https://cdn.revspot.ai/rec/4490.mp3",
    "summary": "Interested, site visit booked for Sat."
  }
}`,
  "lead.created": `{
  "event": "lead.created",
  "id": "evt_5a4d3c2b",
  "data": {
    "lead_id": "rl_4601",
    "full_name": "A***** K*****",
    "phone": "+91 99XXXXXX44",
    "source_campaign": "Whitefield-Meta-Jun"
  }
}`,
};
