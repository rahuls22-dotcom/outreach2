"use client";

// /enrichment/database — unified DB of every enriched lead.
// Output of all 3 inputs (CRM / Bulk / Single) lives here.

import { DataPageShell } from "@/components/data/data-page-shell";
import { EnrichedLeads } from "@/components/data/enriched-leads";

export default function EnrichmentDatabasePage() {
  return (
    <DataPageShell
      variant="connected"
      title="Enriched leads"
      rootLabel="Enrichment"
      rootHref="/enrichment"
      breadcrumbTrail={[
        { label: "Enrichment", href: "/enrichment" },
        { label: "Enriched leads" },
      ]}
      description="Every lead enriched through CRM sync, bulk upload, or single lookup. Filter, search, and drill into the source run for any row."
    >
      {({ openRun }) => <EnrichedLeads onOpenRun={openRun} />}
    </DataPageShell>
  );
}
