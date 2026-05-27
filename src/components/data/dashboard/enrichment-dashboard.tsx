"use client";

// Top-level dashboard for /enrichment. Two halves stacked, single time
// filter at top, two slices of LeadProfile[] in flight at once: the
// active range and the prior-equal-length range (for the success-rate
// delta KPI).

import { useEffect, useMemo, useState } from "react";

import { Sparkles } from "lucide-react";
import { useEnrichmentCrmStore, type RunRecord } from "@/lib/enrichment-crm-data";
import { useDemoMode } from "@/lib/demo-mode";

import { flattenRunsToLeadProfiles } from "@/lib/dashboard/flatten-leads";
import { resolveRange } from "@/lib/dashboard/trend-bucketing";
import { loadDashboardState, saveDashboardState } from "@/lib/dashboard/dashboard-storage";
import { DEFAULT_CHART_CARDS } from "@/lib/dashboard/types";
import type {
  ChartCardId,
  FilterClause,
  LeadProfile,
  SavedView,
  TimeRange,
} from "@/lib/dashboard/types";

import { EmptyState } from "@/components/layout/empty-state";
import { IllustrationEnrichment } from "@/components/illustrations/empty-states";

import { DashboardTimeFilter } from "./dashboard-time-filter";
import { ReliabilitySection } from "./reliability-section";
import { LeadExplorer } from "./lead-explorer";

// Suppress unused param warning on the inherited shell prop signature.
type Props = { onOpenRun?: (r: RunRecord) => void };

export function EnrichmentDashboard(_props: Props) {
  const runs = useEnrichmentCrmStore((s) => s.runs);
  const { isEmpty } = useDemoMode();

  // Page-level state — range/filters do NOT persist, chart cards + saved views DO.
  const [range, setRange] = useState<TimeRange>("30d");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [filters, setFilters] = useState<FilterClause[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [chartCards, setChartCards] = useState<ChartCardId[]>([...DEFAULT_CHART_CARDS]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    const s = loadDashboardState();
    setSavedViews(s.savedViews);
    setChartCards(s.chartCards);
    setHydrated(true);
  }, []);

  // Persist after hydration only — otherwise we'd wipe storage on first render.
  useEffect(() => {
    if (!hydrated) return;
    saveDashboardState({ savedViews, chartCards });
  }, [hydrated, savedViews, chartCards]);

  const bounds = useMemo(
    () => resolveRange(range, customStart, customEnd),
    [range, customStart, customEnd],
  );

  // Previous-period bounds: same length, immediately before the active range.
  const prevBounds = useMemo(() => {
    if (bounds.startMs == null || bounds.endMs == null) {
      return { startMs: null, endMs: null };
    }
    const span = bounds.endMs - bounds.startMs;
    return { startMs: bounds.startMs - span, endMs: bounds.startMs };
  }, [bounds]);

  // Empty-mode override: treat the demo's "empty" state as no runs.
  const effectiveRuns = isEmpty ? [] : runs;

  const profiles: LeadProfile[] = useMemo(
    () => flattenRunsToLeadProfiles(effectiveRuns, { bounds }),
    [effectiveRuns, bounds],
  );
  const prevProfiles: LeadProfile[] = useMemo(
    () => flattenRunsToLeadProfiles(effectiveRuns, { bounds: prevBounds }),
    [effectiveRuns, prevBounds],
  );

  // Time filter is always visible.
  const timeFilter = (
    <DashboardTimeFilter
      range={range}
      customStart={customStart}
      customEnd={customEnd}
      onChange={(r, s, e) => {
        setRange(r);
        setCustomStart(s);
        setCustomEnd(e);
      }}
    />
  );

  // Empty state — no enriched leads in the active range.
  if (profiles.length === 0) {
    const allTime = flattenRunsToLeadProfiles(effectiveRuns);
    const description =
      allTime.length === 0
        ? "Connect your CRM or upload a CSV to start enriching."
        : "No enriched leads in the selected range. Try a wider window.";

    return (
      <div>
        <div className="flex justify-end mb-6">{timeFilter}</div>
        <EmptyState
          illustration={allTime.length === 0 ? <IllustrationEnrichment /> : <Sparkles size={36} strokeWidth={1.25} className="text-text-tertiary" />}
          title={allTime.length === 0 ? "No enriched leads yet" : "No leads in this window"}
          description={description}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-6">{timeFilter}</div>
      <ReliabilitySection
        profiles={profiles}
        prevProfiles={prevProfiles}
        range={range}
        bounds={bounds}
      />
      <LeadExplorer
        profiles={profiles}
        filters={filters}
        onFiltersChange={setFilters}
        savedViews={savedViews}
        onSavedViewsChange={setSavedViews}
        chartCards={chartCards}
        onChartCardsChange={setChartCards}
      />
    </div>
  );
}
