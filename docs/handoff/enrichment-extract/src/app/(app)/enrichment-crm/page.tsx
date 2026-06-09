"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, X } from "lucide-react";

import { useDemoMode } from "@/lib/demo-mode";
import { sampleCsvDataUrl, sampleCsvFilename, useEnrichmentCrmStore, type RunRecord } from "@/lib/enrichment-crm-data";
import { EnrichmentComposer } from "@/components/enrichment-crm/composer";
import { HistoryTable } from "@/components/enrichment-crm/history-table";
import { RunDrawer } from "@/components/enrichment-crm/run-drawer";
import { EmptyState } from "@/components/layout/empty-state";
import { IllustrationEnrichment } from "@/components/illustrations/empty-states";
import { CrmStatusBanner } from "@/components/enrichment-crm/crm-status-banner";
import { CrmTabs, type CrmTabKey } from "@/components/enrichment-crm/crm-tabs";
import { CrmActivity } from "@/components/enrichment-crm/crm-activity";

export default function EnrichmentPage() {
  const { isEmpty } = useDemoMode();
  const runs = useEnrichmentCrmStore((s) => s.runs);
  const setRuns = useEnrichmentCrmStore((s) => s.setRuns);
  const markCompletionsSeen = useEnrichmentCrmStore((s) => s.markCompletionsSeen);
  const tickProgress = useEnrichmentCrmStore((s) => s.tickProgress);
  const router = useRouter();

  const [selectedRun, setSelectedRun] = useState<RunRecord | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [tab, setTab] = useState<CrmTabKey>("activity");

  // History per tab, bulk tab shows bulk runs only, single tab shows single runs only.
  // CRM-sourced runs live inside the CRM activity tab and are excluded everywhere else.
  const bulkRuns   = isEmpty ? [] : runs.filter((r) => r.source === "bulk");
  const singleRuns = isEmpty ? [] : runs.filter((r) => r.source === "single");

  // Mark completions seen on visit
  useEffect(() => {
    markCompletionsSeen();
  }, [markCompletionsSeen]);

  // Walk any in_progress bulk runs toward completion so the UI feels live.
  useEffect(() => {
    const hasInFlight = runs.some((r) => r.status === "in_progress");
    if (!hasInFlight) return;
    const id = window.setInterval(() => tickProgress(), 900);
    return () => window.clearInterval(id);
  }, [runs, tickProgress]);

  // Listen for composer toast events
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<RawToastDetail>;
      const payload: ToastPayload = normalizeToast(ce.detail);
      setToast(payload);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => setToast(null), 5200);
    };
    window.addEventListener("enrichment-crm:toast", handler);
    return () => {
      window.removeEventListener("enrichment-crm:toast", handler);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Listen for "expand inline result to drawer" requests from the composer.
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ runId?: string }>;
      const runId = ce.detail?.runId;
      if (!runId) return;
      const run = useEnrichmentCrmStore.getState().runs.find((r) => r.id === runId);
      if (run) setSelectedRun(run);
    };
    window.addEventListener("enrichment-crm:open-run", handler);
    return () => window.removeEventListener("enrichment-crm:open-run", handler);
  }, []);

  const openToastRun = (runId: string) => {
    const run = useEnrichmentCrmStore.getState().runs.find((r) => r.id === runId);
    if (run) setSelectedRun(run);
    setToast(null);
  };

  const onBuildAudience = (run: RunRecord) => {
    router.push(`/audiences?source=enrichment&runId=${encodeURIComponent(run.id)}`);
  };

  // Demo: if empty mode toggled mid-session, snapshot to empty
  useEffect(() => {
    if (isEmpty) {
      // Don't actually wipe, empty state is rendered conditionally below.
      // Real demo-empty wipe would call setRuns([]); skipping to preserve mock data.
    }
  }, [isEmpty, setRuns]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-meta text-text-secondary mb-1">Tools</div>
          <h1 className="text-page-title text-text-primary">Enrichment</h1>
          <p className="text-[13px] text-text-secondary mt-1.5 max-w-[760px] leading-relaxed">
            Enrichment fills two layers of data on every lead: <span className="font-medium text-text-primary">Professional</span> (name, title, company, LinkedIn, work email) and <span className="font-medium text-text-primary">Financial</span> (income band, investment capacity, net-worth signals).
            Connected CRM leads get enriched and pushed back automatically. You can also upload a CSV or run a single lookup.
          </p>
        </div>
        <DemoVariantToggle />
      </div>

      {/* Tabs */}
      <CrmTabs value={tab} onChange={setTab} />

      {/* Tab content */}
      {tab === "activity" && (
        <div className="space-y-6">
          <CrmStatusBanner />
          <CrmActivity onOpenRun={(r) => setSelectedRun(r)} />
        </div>
      )}

      {tab === "bulk" && (
        <>
          <EnrichmentComposer mode="bulk" />

          <div className="mt-8">
            {bulkRuns.length === 0 ? (
              <EmptyState
                illustration={<IllustrationEnrichment />}
                title="No bulk uploads yet"
                description="Upload a CSV to enrich in bulk. Push the result back to your CRM when it lands."
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
                onView={(r) => setSelectedRun(r)}
                forceSource="bulk"
                title="Bulk upload history"
              />
            )}
          </div>
        </>
      )}

      {tab === "single" && (
        <>
          <EnrichmentComposer mode="single" />

          <div className="mt-8">
            {singleRuns.length === 0 ? (
              <EmptyState
                illustration={<IllustrationEnrichment />}
                title="No single lookups yet"
                description="Enrich one lead at a time using email, phone, or LinkedIn. Each successful lookup lands below."
              />
            ) : (
              <HistoryTable
                onView={(r) => setSelectedRun(r)}
                forceSource="single"
                title="Single lookup history"
              />
            )}
          </div>
        </>
      )}

      {/* Drawer */}
      <RunDrawer
        run={selectedRun}
        onClose={() => setSelectedRun(null)}
        onBuildAudience={onBuildAudience}
      />

      {/* Toast, sonner-style */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-[80] w-[380px] max-w-[calc(100vw-32px)] bg-white border border-border rounded-card shadow-[0_12px_32px_rgba(15,15,15,0.12),0_0_0_1px_rgba(15,15,15,0.04)]"
          >
            <div className="p-4 flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                <Loader2 size={14} strokeWidth={1.75} className="text-[#1D4ED8] animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-text-primary">{toast.title}</div>
                {toast.description && (
                  <div className="text-[12px] text-text-secondary leading-snug mt-1">{toast.description}</div>
                )}
                {toast.runId && (
                  <button
                    onClick={() => openToastRun(toast.runId!)}
                    className="text-[12px] font-medium text-text-primary underline underline-offset-2 hover:opacity-80 mt-2"
                  >
                    View run
                  </button>
                )}
              </div>
              <button
                onClick={() => setToast(null)}
                aria-label="Dismiss"
                className="p-1 -m-1 text-text-tertiary hover:text-text-primary rounded-button transition-colors"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Demo variant toggle ───────────────────────────────────────────────

function DemoVariantToggle() {
  return (
    <div className="inline-flex items-center bg-white border border-border rounded-input p-0.5 text-[11px] flex-shrink-0">
      <span className="h-7 px-2.5 inline-flex items-center font-medium bg-text-primary text-white rounded-[6px]">
        CRM connected
      </span>
      <Link
        href="/enrichment-crm-empty"
        className="h-7 px-2.5 inline-flex items-center font-medium text-text-secondary hover:text-text-primary rounded-[6px] transition-colors"
      >
        Not connected
      </Link>
    </div>
  );
}

// ── Toast types & helpers ─────────────────────────────────────────────

type RawToastDetail =
  | string
  | { message: string }
  | {
      kind?: string;
      title?: string;
      description?: string;
      runId?: string;
      message?: string;
    };

interface ToastPayload {
  id: string;
  title: string;
  description?: string;
  runId?: string;
}

function normalizeToast(d: RawToastDetail): ToastPayload {
  const id = `t-${Date.now()}`;
  if (typeof d === "string") return { id, title: d };
  if ("message" in d && d.message && !("title" in d && d.title)) {
    return { id, title: d.message };
  }
  const obj = d as { title?: string; description?: string; runId?: string };
  return {
    id,
    title: obj.title || "Done",
    description: obj.description,
    runId: obj.runId,
  };
}
