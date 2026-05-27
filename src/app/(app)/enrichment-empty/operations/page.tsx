"use client";

// /enrichment-empty/operations — Operations tab in the "no CRM" demo variant.

import { DataPageShell } from "@/components/data/data-page-shell";
import { EnrichmentSection } from "@/components/data/enrichment-section";

export default function EnrichmentEmptyOperationsPage() {
  return (
    <DataPageShell
      variant="empty"
      title="Enrich"
      rootLabel="Enrichment"
      rootHref="/enrichment-empty"
      breadcrumbTrail={[
        { label: "Enrichment", href: "/enrichment-empty" },
        { label: "Enrich" },
      ]}
      description="Connect your CRM to auto-enrich every lead, or upload a CSV / run a single lookup right now."
    >
      {({ openRun, openConnectFlow }) => (
        <EnrichmentSection
          connected={false}
          onOpenRun={openRun}
          onConnect={openConnectFlow}
        />
      )}
    </DataPageShell>
  );
}
