"use client";

// Side drawer for inspecting a run record (single or bulk).
// Sections: header · status · leads · credits · actions · error (if failed) · profile (single)

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Users, Copy, Check } from "lucide-react";
import {
  formatRelative,
  successPct,
  type RunRecord,
} from "@/lib/enrichment-data";
import { LeadProfileCard } from "@/components/lead/lead-profile-card";

interface RunDrawerProps {
  run: RunRecord | null;
  onClose: () => void;
  onBuildAudience: (run: RunRecord) => void;
}

export function RunDrawer({ run, onClose, onBuildAudience }: RunDrawerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!run) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, onClose]);

  if (!mounted || !run) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/20 z-[60]" onClick={onClose} />
      <aside className="fixed top-0 right-0 bottom-0 w-[560px] max-w-[92vw] bg-white border-l border-border z-[70] flex flex-col">
        <Header run={run} onClose={onClose} />

        <div className="flex-1 overflow-y-auto">
          {run.source === "bulk" && (
            <>
              <StatusSection run={run} />
              <Divider />
              <LeadsSection run={run} />
              <Divider />
              <CreditsSection run={run} />
              <Divider />
              <ActionsSection run={run} onBuildAudience={() => onBuildAudience(run)} />
            </>
          )}

          {run.status === "failed" && (
            <>
              <Divider />
              <ErrorSection run={run} />
            </>
          )}

          {run.source === "single" && run.profile && (
            <>
              <Divider />
              <section className="p-5">
                <SectionLabel>Profile</SectionLabel>
                <div className="mt-3">
                  <LeadProfileCard profile={run.profile} variant="inline" />
                </div>
              </section>
            </>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}

function Header({ run, onClose }: { run: RunRecord; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between px-5 py-4 border-b border-border">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-text-primary truncate">
          {run.source === "bulk" ? run.filename : run.inputValue}
        </h2>
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          {run.types.map((t) => (
            <span
              key={t}
              className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge ${
                t === "professional"
                  ? "bg-[#EFF6FF] text-[#1D4ED8]"
                  : "bg-[#F5F3FF] text-[#6D28D9]"
              }`}
            >
              {t === "professional" ? "Professional" : "Financial"}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-button text-text-secondary hover:bg-surface-secondary transition-colors"
        aria-label="Close"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function StatusSection({ run }: { run: RunRecord }) {
  let pillClass = "bg-surface-secondary text-text-secondary";
  let label = "—";
  if (run.status === "done") { pillClass = "bg-[#F0FDF4] text-[#15803D]"; label = `Done · ${successPct(run)}% success`; }
  if (run.status === "in_progress") { pillClass = "bg-[#EFF6FF] text-[#1D4ED8]"; label = `In progress · ${run.progressPct || 0}%`; }
  if (run.status === "failed") { pillClass = "bg-[#FEF2F2] text-[#DC2626]"; label = "Failed"; }

  return (
    <section className="p-5">
      <SectionLabel>Status</SectionLabel>
      <div className="flex items-center gap-2 mt-2">
        <span className={`inline-flex items-center text-[12px] font-medium px-2.5 py-1 rounded-badge ${pillClass}`}>{label}</span>
      </div>
      <div className="text-[12px] text-text-tertiary mt-2">
        Started {formatRelative(run.startedAt)}
        {run.finishedAt && <span> · Finished {formatRelative(run.finishedAt)}</span>}
      </div>
    </section>
  );
}

function LeadsSection({ run }: { run: RunRecord }) {
  return (
    <section className="p-5">
      <SectionLabel>Leads</SectionLabel>
      <div className="grid grid-cols-4 gap-3 mt-3">
        <Stat label="Success" value={run.leadsSuccess} accent="ok" />
        <Stat label="Failed" value={run.leadsFailed} accent={run.leadsFailed > 0 ? "err" : "muted"} />
        <Stat label="Skipped" value={run.leadsSkipped} accent="muted" />
        <Stat label="Total" value={run.leadsTotal} accent="primary" />
      </div>
    </section>
  );
}

function CreditsSection({ run }: { run: RunRecord }) {
  return (
    <section className="p-5">
      <SectionLabel>Credits</SectionLabel>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <Stat label="Blocked" value={run.creditsBlocked} accent="muted" />
        <Stat label="Charged" value={run.creditsCharged} accent="primary" />
        <Stat label="Refunded" value={run.creditsRefunded} accent={run.creditsRefunded > 0 ? "ok" : "muted"} />
      </div>
      {run.creditsRefunded > 0 && (
        <p className="text-[11px] text-text-tertiary mt-3">
          {run.creditsRefunded.toLocaleString("en-IN")} credits refunded for leads we couldn't enrich.
        </p>
      )}
    </section>
  );
}

function ActionsSection({ run, onBuildAudience }: { run: RunRecord; onBuildAudience: () => void }) {
  if (run.status !== "done") return null;
  return (
    <section className="p-5">
      <SectionLabel>Export</SectionLabel>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <ActionBtn onClick={() => download(run, "csv")}>
          <Download size={13} strokeWidth={1.5} />
          Download CSV
        </ActionBtn>
        <ActionBtn onClick={() => download(run, "xlsx")}>
          <Download size={13} strokeWidth={1.5} />
          Download Excel
        </ActionBtn>
        <ActionBtn onClick={onBuildAudience} primary>
          <Users size={13} strokeWidth={1.5} />
          Build audience
        </ActionBtn>
      </div>
    </section>
  );
}

function ErrorSection({ run }: { run: RunRecord }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${run.id}\n${run.errorCode}\n${run.errorMessage || ""}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* noop */ }
  };
  return (
    <section className="p-5">
      <SectionLabel>Why this run failed</SectionLabel>
      <div className="mt-3 p-3 rounded-card bg-[#FEF2F2] border border-[#FECACA]">
        <div className="text-[12px] font-medium text-[#DC2626]">{run.errorCode || "Unknown error"}</div>
        <p className="text-[12px] text-[#7F1D1D] mt-1">{run.errorMessage}</p>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <ActionBtn onClick={onCopy}>
          {copied ? <Check size={13} strokeWidth={1.5} /> : <Copy size={13} strokeWidth={1.5} />}
          {copied ? "Copied" : "Copy error ID"}
        </ActionBtn>
      </div>
    </section>
  );
}

// ── primitives ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.4px] text-text-tertiary">{children}</div>
  );
}

function Divider() {
  return <div className="border-t border-border-subtle" />;
}

function Stat({ label, value, accent }: { label: string; value: number; accent: "ok" | "err" | "primary" | "muted" }) {
  const map = {
    ok: "text-[#15803D]",
    err: "text-[#DC2626]",
    primary: "text-text-primary",
    muted: "text-text-secondary",
  };
  return (
    <div>
      <div className="text-[11px] text-text-tertiary">{label}</div>
      <div className={`text-[18px] font-semibold tabular-nums mt-0.5 ${map[accent]}`}>{value.toLocaleString("en-IN")}</div>
    </div>
  );
}

function ActionBtn({ onClick, children, primary }: { onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-button transition-colors ${
        primary
          ? "bg-text-primary text-white hover:bg-accent-hover"
          : "bg-white text-text-secondary border border-border hover:bg-surface-secondary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function download(run: RunRecord, format: "csv" | "xlsx") {
  const content = `# Enriched export — ${format.toUpperCase()}\n# Run: ${run.id}\n# File: ${run.filename}\n# Leads: ${run.leadsSuccess}/${run.leadsTotal}\n# Backend wires real export.\n`;
  const mime = format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(run.filename || "enriched").replace(/\.[^.]+$/, "")}-enriched.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
