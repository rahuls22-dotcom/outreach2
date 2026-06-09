"use client";

// /enrichment-empty/database, enriched leads DB in the "no CRM" demo.
// Bulk + Single runs still flow into this view even when CRM isn't connected.

import { CrmConnectBanner } from "@/components/enrichment-crm/crm-connect-nudge";
import { DataPageShell } from "@/components/data/data-page-shell";
import { EnrichedLeads } from "@/components/data/enriched-leads";

export default function EnrichmentEmptyDatabasePage() {
  return (
    <DataPageShell
      variant="empty"
      title="History"
      rootLabel="Enrichment"
      rootHref="/enrichment-empty"
      breadcrumbTrail={[
        { label: "Enrichment", href: "/enrichment-empty" },
        { label: "History" },
      ]}
      description="Every lead processed through bulk upload or single lookup, enriched, partial, or failed. Connect your CRM to backfill leads from there too."
    >
      {({ openRun, openConnectFlow }) => (
        <div className="space-y-6">
          <CrmConnectBanner onConnect={openConnectFlow} />
          <EnrichedLeads onOpenRun={openRun} />
        </div>
      )}
    </DataPageShell>
  );
}
