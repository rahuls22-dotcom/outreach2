// CRM integration mock data + types. Prototype only — no backend.
// Models the 3-noun architecture: Connection (handshake) · Channel (per-product
// pipeline) · field mapping. See docs/superpowers/specs/2026-06-03-crm-integration-settings-reorg-design.md

import type { ProductKey } from "@/lib/products";

export type Capability = "read_rows" | "create_row" | "update_row" | "create_field";

export type CrmProvider =
  | "salesforce"
  | "hubspot"
  | "zoho"
  | "leadsquared"
  | "freshworks"
  | "gohighlevel"
  | "custom";

export const CAPABILITY_LABELS: Record<Capability, string> = {
  read_rows: "Read rows",
  create_row: "Create rows",
  update_row: "Update rows",
  create_field: "Create fields",
};

export const PROVIDER_META: Record<
  CrmProvider,
  { name: string; mark: string; tint: string; ink: string }
> = {
  salesforce: { name: "Salesforce", mark: "SF", tint: "#EFF6FF", ink: "#1D4ED8" },
  hubspot: { name: "HubSpot", mark: "HS", tint: "#FFF1ED", ink: "#C2410C" },
  zoho: { name: "Zoho CRM", mark: "Z", tint: "#FEF2F2", ink: "#B91C1C" },
  leadsquared: { name: "LeadSquared", mark: "LS", tint: "#F5F3FF", ink: "#6D28D9" },
  freshworks: { name: "Freshworks", mark: "FW", tint: "#ECFDF5", ink: "#047857" },
  gohighlevel: { name: "GoHighLevel", mark: "G", tint: "#EFF6FF", ink: "#1D4ED8" },
  custom: { name: "Custom / API", mark: "{}", tint: "#F1F5F9", ink: "#475569" },
};

// Providers offered in the connect wizard (matches the screenshot grid).
export const WIZARD_PROVIDERS: CrmProvider[] = [
  "salesforce",
  "hubspot",
  "zoho",
  "leadsquared",
  "freshworks",
  "custom",
];

export interface FieldMap {
  id: string;
  revspotField: string;
  crmField: string;
  direction: "to_crm" | "from_crm" | "both";
  isCreated?: boolean; // a field WE create in their CRM (enrichment outputs)
}

export interface ChannelConfig {
  product: ProductKey;
  source: { type: "push_api" | "crm_pull"; location: string };
  destination: { location: string; dedupKey: string };
  writeBack: {
    ops: Capability[];
    stageGate: "all" | "intent_qualified" | "qualified_only";
  };
}

export interface CrmConnection {
  id: string;
  provider: CrmProvider;
  label: string;
  crmUrl: string;
  status: "connected" | "pending" | "error";
  connectedAgo?: string;
  apiKey: string;
  capabilities: Capability[];
  products: ProductKey[];
  lastSync?: string;
  fieldMaps: FieldMap[];
  channels: ChannelConfig[];
  syncLog: SyncLogEntry[];
}

export interface SyncLogEntry {
  id: string;
  time: string;
  leadName: string;
  action: string;
  status: "success" | "failed";
  details: string;
}

const ENRICHMENT_MAPS: FieldMap[] = [
  { id: "m1", revspotField: "Full Name", crmField: "contact_name", direction: "both" },
  { id: "m2", revspotField: "Phone", crmField: "phone", direction: "both" },
  { id: "m3", revspotField: "Email", crmField: "email", direction: "both" },
  { id: "m4", revspotField: "Company", crmField: "rs_company", direction: "to_crm", isCreated: true },
  { id: "m5", revspotField: "Job Title", crmField: "rs_job_title", direction: "to_crm", isCreated: true },
  { id: "m6", revspotField: "Income Band", crmField: "rs_income_band", direction: "to_crm", isCreated: true },
  { id: "m7", revspotField: "Property Interest", crmField: "rs_property_interest", direction: "to_crm", isCreated: true },
];

const CALLING_MAPS: FieldMap[] = [
  { id: "m1", revspotField: "Full Name", crmField: "Name", direction: "both" },
  { id: "m2", revspotField: "Phone", crmField: "Phone", direction: "from_crm" },
  { id: "m3", revspotField: "Lead Status", crmField: "Lead_Status__c", direction: "to_crm" },
  { id: "m4", revspotField: "AI Qualification", crmField: "rs_ai_qualified", direction: "to_crm", isCreated: true },
  { id: "m5", revspotField: "Call Recording", crmField: "rs_recording_url", direction: "to_crm", isCreated: true },
  { id: "m6", revspotField: "Call Summary", crmField: "rs_call_summary", direction: "to_crm", isCreated: true },
];

const CAMPAIGN_MAPS: FieldMap[] = [
  { id: "m1", revspotField: "Full Name", crmField: "contact_name", direction: "to_crm" },
  { id: "m2", revspotField: "Phone", crmField: "phone", direction: "to_crm" },
  { id: "m3", revspotField: "Email", crmField: "email", direction: "to_crm" },
  { id: "m4", revspotField: "Lead Status", crmField: "custom.revspot_status", direction: "both" },
  { id: "m5", revspotField: "Source Campaign", crmField: "custom.source_campaign", direction: "to_crm" },
];

function mkLog(prefix: string): SyncLogEntry[] {
  return [
    { id: `${prefix}-1`, time: "2 min ago", leadName: "V***** R*****", action: "Push to CRM", status: "success", details: "Created contact #4521" },
    { id: `${prefix}-2`, time: "15 min ago", leadName: "G***** M***", action: "Push to CRM", status: "failed", details: "Duplicate phone number" },
    { id: `${prefix}-3`, time: "18 min ago", leadName: "Field sync", action: "CRM → Revspot", status: "success", details: "3 rows updated" },
    { id: `${prefix}-4`, time: "42 min ago", leadName: "A***** K*****", action: "Push to CRM", status: "success", details: "Created contact #4520" },
    { id: `${prefix}-5`, time: "1 hr ago", leadName: "P***** J*****", action: "Update row", status: "success", details: "Updated contact #4401" },
  ];
}

export const crmConnections: CrmConnection[] = [
  {
    id: "conn-hubspot-enrich",
    provider: "hubspot",
    label: "Godrej HubSpot — Enrichment",
    crmUrl: "https://api.hubapi.com/godrej-properties",
    status: "connected",
    connectedAgo: "14 days ago",
    apiKey: "rvk_live_8f3c2a9b7d1e4056",
    capabilities: ["read_rows", "create_row", "update_row", "create_field"],
    products: ["enrichment"],
    lastSync: "2 minutes ago",
    fieldMaps: ENRICHMENT_MAPS,
    channels: [
      {
        product: "enrichment",
        source: { type: "crm_pull", location: "Contacts › List: New Enquiries" },
        destination: { location: "Contacts", dedupKey: "email" },
        writeBack: { ops: ["update_row", "create_field"], stageGate: "all" },
      },
    ],
    syncLog: mkLog("hs"),
  },
  {
    id: "conn-salesforce-calling",
    provider: "salesforce",
    label: "Godrej Salesforce — AI Calling",
    crmUrl: "https://godrej.my.salesforce.com",
    status: "connected",
    connectedAgo: "6 days ago",
    apiKey: "rvk_live_2b6e1f0a9c8d3471",
    capabilities: ["read_rows", "update_row", "create_field"],
    products: ["ai_calling"],
    lastSync: "8 minutes ago",
    fieldMaps: CALLING_MAPS,
    channels: [
      {
        product: "ai_calling",
        source: { type: "crm_pull", location: "Leads › View: To Call" },
        destination: { location: "Leads", dedupKey: "phone" },
        writeBack: { ops: ["update_row", "create_field"], stageGate: "intent_qualified" },
      },
    ],
    syncLog: mkLog("sf"),
  },
  {
    id: "conn-ghl-campaigns",
    provider: "gohighlevel",
    label: "Godrej GoHighLevel — Campaigns",
    crmUrl: "https://rest.gohighlevel.com/v1/godrej",
    status: "connected",
    connectedAgo: "21 days ago",
    apiKey: "rvk_live_5a4d3c2b1e0f9876",
    capabilities: ["read_rows", "create_row", "update_row"],
    products: ["campaigns"],
    lastSync: "1 minute ago",
    fieldMaps: CAMPAIGN_MAPS,
    channels: [
      {
        product: "campaigns",
        source: { type: "push_api", location: "Inbound API" },
        destination: { location: "Real Estate Sales Pipeline", dedupKey: "phone" },
        writeBack: { ops: ["create_row", "update_row"], stageGate: "all" },
      },
    ],
    syncLog: mkLog("ghl"),
  },
];

export function getConnection(id: string): CrmConnection | undefined {
  return crmConnections.find((c) => c.id === id);
}
