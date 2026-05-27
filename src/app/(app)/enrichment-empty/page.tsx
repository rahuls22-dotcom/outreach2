"use client";

// /enrichment-empty — base/Dashboard tab for the Enrichment module
// in the "no CRM connected" demo variant.

import { DataPageShell } from "@/components/data/data-page-shell";
import { EnrichmentDashboard } from "@/components/data/enrichment-dashboard";

export default function EnrichmentEmptyDashboardPage() {
  return (
    <DataPageShell
      variant="empty"
      title="Enrichment"
      rootLabel="Enrichment"
      rootHref="/enrichment-empty"
      description="Professional + Financial enrichment. Connect CRM, upload CSV, or run a single lookup."
    >
      {({ openRun }) => <EnrichmentDashboard onOpenRun={openRun} forceEmpty />}
    </DataPageShell>
  );
}
