"use client";

// /enrichment/operations — where enrichment actually happens.
// Hosts the 3 input sub-tabs (CRM / Bulk upload / Single).

import { DataPageShell } from "@/components/data/data-page-shell";
import { EnrichmentSection } from "@/components/data/enrichment-section";

export default function EnrichmentOperationsPage() {
  return (
    <DataPageShell
      variant="connected"
      title="Enrich"
      rootLabel="Enrichment"
      rootHref="/enrichment"
      breadcrumbTrail={[
        { label: "Enrichment", href: "/enrichment" },
        { label: "Enrich" },
      ]}
      description="Run enrichment via CRM sync, bulk CSV upload, or a single lookup."
    >
      {({ openRun, openConnectFlow }) => (
        <EnrichmentSection
          connected
          onOpenRun={openRun}
          onConnect={openConnectFlow}
        />
      )}
    </DataPageShell>
  );
}
