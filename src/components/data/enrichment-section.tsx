"use client";

// Operations view for the Enrichment module. Hosts 3 input sub-tabs
// (CRM / Bulk / Single) and switches between the connected and "not connected"
// demo states based on a prop. The big volume chart lives on the module's
// Dashboard tab now — Operations is purely about doing work.
//
// Connected mode:
//   CRM    → CrmStatusBanner + CrmMappedFields card
//   Bulk   → Bulk composer + bulk history
//   Single → Single composer + single history
//
// Not-connected mode:
//   CRM    → CrmConnectBanner + CrmConnectHero
//   Bulk   → CrmConnectBanner above the normal composer
//   Single → CrmConnectBanner above the normal composer

import { useState } from "react";
import { Download } from "lucide-react";

import {
  sampleCsvDataUrl,
  sampleCsvFilename,
  type RunRecord,
  useEnrichmentCrmStore,
} from "@/lib/enrichment-crm-data";
import { useDemoMode } from "@/lib/demo-mode";
import { EnrichmentComposer } from "@/components/enrichment-crm/composer";
import { HistoryTable } from "@/components/enrichment-crm/history-table";
import { CrmStatusBanner } from "@/components/enrichment-crm/crm-status-banner";
import { CrmConnectBanner, CrmConnectHero } from "@/components/enrichment-crm/crm-connect-nudge";
import { EmptyState } from "@/components/layout/empty-state";
import { IllustrationEnrichment } from "@/components/illustrations/empty-states";

import { CrmActivity } from "@/components/enrichment-crm/crm-activity";

import { EnrichmentSubTabs, type EnrichSubTabKey } from "./enrichment-sub-tabs";
import { CrmMappedFields } from "./crm-mapped-fields";
import { MappingDrawer } from "./mapping-drawer";

interface Props {
  connected: boolean;
  onOpenRun: (run: RunRecord) => void;
  onConnect: () => void;
}

export function EnrichmentSection({ connected, onOpenRun, onConnect }: Props) {
  const [sub, setSub] = useState<EnrichSubTabKey>("crm");
  const [mappingOpen, setMappingOpen] = useState(false);
  const { isEmpty } = useDemoMode();
  const runs = useEnrichmentCrmStore((s) => s.runs);

  const bulkRuns   = isEmpty ? [] : runs.filter((r) => r.source === "bulk");
  const singleRuns = isEmpty ? [] : runs.filter((r) => r.source === "single");

  return (
    <div>
      <EnrichmentSubTabs value={sub} onChange={setSub} />

      {/* CRM tab */}
      {sub === "crm" && (
        <div className="space-y-6">
          {connected ? (
            <>
              <CrmActivity onOpenRun={onOpenRun} scope="crm" />
              <CrmStatusBanner
                mappingOpen={mappingOpen}
                onViewMapping={() => setMappingOpen(true)}
              />
              <MappingDrawer open={mappingOpen} onClose={() => setMappingOpen(false)}>
                <CrmMappedFields />
              </MappingDrawer>
            </>
          ) : (
            <>
              <CrmConnectBanner onConnect={onConnect} />
              <CrmConnectHero onConnect={onConnect} onManual={() => setSub("bulk")} />
            </>
          )}
        </div>
      )}

      {/* Bulk upload tab */}
      {sub === "bulk" && (
        <>
          {!connected && <CrmConnectBanner onConnect={onConnect} />}
          <EnrichmentComposer mode="bulk" />
          <div className="mt-8">
            {bulkRuns.length === 0 ? (
              <EmptyState
                illustration={<IllustrationEnrichment />}
                title="No bulk uploads yet"
                description="Upload a CSV to enrich up to thousands of leads at once."
                action={
                  <a
                    href={sampleCsvDataUrl([])}
                    download={sampleCsvFilename([])}
                    className="inline-flex items-center gap-1.5 h-9 px-4 bg-text-primary text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors"
                  >
                    <Download size={14} strokeWidth={1.5} />
                    Download sample CSV
                  </a>
                }
              />
            ) : (
              <HistoryTable
                onView={onOpenRun}
                forceSource="bulk"
                title="Bulk upload history"
              />
            )}
          </div>
        </>
      )}

      {/* Single tab */}
      {sub === "single" && (
        <>
          {!connected && <CrmConnectBanner onConnect={onConnect} />}
          <EnrichmentComposer mode="single" />
          <div className="mt-8">
            {singleRuns.length === 0 ? (
              <EmptyState
                illustration={<IllustrationEnrichment />}
                title="No single lookups yet"
                description="Enrich one lead at a time using email, phone, or LinkedIn."
              />
            ) : (
              <HistoryTable
                onView={onOpenRun}
                forceSource="single"
                title="Single lookup history"
              />
            )}
          </div>
        </>
      )}

    </div>
  );
}
