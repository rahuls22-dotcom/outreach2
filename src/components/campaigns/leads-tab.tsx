"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
  X,
  Zap,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { campaignLeads } from "@/lib/campaign-data";
import type {
  CampaignLead,
  LeadTemperature,
  LeadStatusValue,
  LeadStage,
  EnrichmentStatus,
  CRMSyncStatus,
} from "@/lib/campaign-data";
import { LeadDetailPanel } from "./lead-detail-panel";

// ── Config Maps ─────────────────────────────────────────────

const leadStatusConfig: Record<LeadStatusValue, { label: string; cls: string }> = {
  intent_qualified: { label: "Intent Qualified", cls: "bg-[#F0FDF4] text-[#15803D]" },
  not_qualified: { label: "Not Qualified", cls: "bg-surface-secondary text-text-secondary" },
  interested_not_ready: { label: "Interested", cls: "bg-[#FEF3C7] text-[#92400E]" },
  duplicate: { label: "Duplicate", cls: "bg-[#F5F5F5] text-text-tertiary" },
  invalid: { label: "Invalid", cls: "bg-[#FEF2F2] text-[#DC2626]" },
};

const leadStageConfig: Record<LeadStage, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-[#EFF6FF] text-[#1D4ED8]" },
  contacted: { label: "Contacted", cls: "bg-[#F5F3FF] text-[#7C3AED]" },
  site_visit_scheduled: { label: "SV Scheduled", cls: "bg-[#FEF3C7] text-[#92400E]" },
  site_visit_done: { label: "SV Done", cls: "bg-[#F0FDF4] text-[#15803D]" },
  negotiation: { label: "Negotiation", cls: "bg-[#FFF7ED] text-[#C2410C]" },
  won: { label: "Won", cls: "bg-[#F0FDF4] text-[#15803D]" },
  lost: { label: "Lost", cls: "bg-[#FEF2F2] text-[#DC2626]" },
};

const tempConfig: Record<LeadTemperature, { label: string; cls: string }> = {
  hot: { label: "Hot", cls: "bg-[#FEF2F2] text-[#DC2626]" },
  warm: { label: "Warm", cls: "bg-[#F0FDF4] text-[#15803D]" },
  lukewarm: { label: "Lukewarm", cls: "bg-[#FEF3C7] text-[#92400E]" },
  cold: { label: "Cold", cls: "bg-surface-secondary text-text-secondary" },
};

// ── Inline Dropdown Badge ───────────────────────────────────

function InlineDropdownBadge<T extends string>({
  value,
  config,
  options,
  onChange,
}: {
  value: T;
  config: Record<T, { label: string; cls: string }>;
  options: T[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const { label, cls } = config[value];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-badge cursor-pointer transition-all duration-100 ${cls} hover:ring-1 hover:ring-accent/20`}
      >
        {label}
        <ChevronDown size={10} strokeWidth={2} className="opacity-50" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-0 bg-white border border-border rounded-[6px] shadow-lg py-1 min-w-[140px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[11px] font-medium hover:bg-surface-page transition-colors ${
                opt === value ? "bg-surface-secondary" : ""
              }`}
            >
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-badge ${config[opt].cls}`}>
                {config[opt].label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CRM Sync Cell ───────────────────────────────────────────

function CRMSyncCell({ status, failReason }: { status: CRMSyncStatus; failReason?: string }) {
  const cfg: Record<CRMSyncStatus, { label: string; cls: string }> = {
    pushed: { label: "Pushed ✓", cls: "text-[#15803D]" },
    pending: { label: "Pending", cls: "text-text-tertiary" },
    failed: { label: "Failed", cls: "text-status-error" },
    not_synced: { label: "Not synced", cls: "text-text-tertiary" },
    na: { label: "N/A", cls: "text-text-tertiary" },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`text-[11px] font-medium ${cls}`} title={failReason || ""}>
      {label}
      {status === "failed" && (
        <button onClick={(e) => e.stopPropagation()} className="ml-1 text-[10px] underline text-status-error hover:text-[#B91C1C]">
          Retry
        </button>
      )}
    </span>
  );
}

// ── Enrichment Icon ─────────────────────────────────────────

function EnrichmentIcon({ status }: { status: EnrichmentStatus }) {
  if (status === "enriched") return <CheckCircle2 size={14} strokeWidth={2} className="text-status-success" />;
  if (status === "failed") return <X size={14} strokeWidth={2} className="text-status-error" />;
  return <span className="text-[11px] text-text-tertiary">—</span>;
}

// ── Main Component ──────────────────────────────────────────

const PAGE_SIZE = 10;
const statusOpts: LeadStatusValue[] = ["intent_qualified", "not_qualified", "interested_not_ready", "duplicate", "invalid"];
const stageOpts: LeadStage[] = ["new", "contacted", "site_visit_scheduled", "site_visit_done", "negotiation", "won", "lost"];

export function LeadsTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<CampaignLead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [leads, setLeads] = useState(campaignLeads);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    if (!search) return leads;
    const s = search.toLowerCase();
    return leads.filter(
      (l) => l.name.toLowerCase().includes(s) || l.phone.includes(s) || l.adset.toLowerCase().includes(s)
    );
  }, [search, leads]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allPageSelected = paginated.length > 0 && paginated.every((l) => selectedIds.has(l.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) paginated.forEach((l) => next.delete(l.id));
      else paginated.forEach((l) => next.add(l.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateLead = (id: string, update: Partial<CampaignLead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...update } : l)));
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative max-w-[240px] flex-1">
          <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input type="text" placeholder="Search leads..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-8 pl-8 pr-3 text-[13px] border border-border rounded-input bg-white focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary" />
        </div>
        <div className="flex items-center gap-2">
          {[
            { icon: RefreshCw, label: "Sync" },
            { icon: Download, label: "Export" },
            { icon: ShieldCheck, label: "Mark Qualified" },
            { icon: Zap, label: "Enrich" },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-text-secondary border border-border rounded-button bg-white hover:bg-surface-page hover:text-text-primary transition-colors duration-150">
              <Icon size={13} strokeWidth={1.5} /> {label}
            </button>
          ))}
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-text-secondary border border-border rounded-button bg-white hover:bg-surface-page hover:text-text-primary transition-colors duration-150">
            <SlidersHorizontal size={13} strokeWidth={1.5} /> Filters
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="text-[12px] text-text-tertiary mb-3">
        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} leads
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-3 py-2.5 w-8">
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent/20 cursor-pointer" />
                </th>
                {[
                  { label: "Name", align: "left" },
                  { label: "Phone", align: "left" },
                  { label: "Created", align: "left" },
                  { label: "Lead Status", align: "left" },
                  { label: "Stage", align: "left" },
                  { label: "Temp", align: "left" },
                  { label: "AI Qual", align: "left" },
                  { label: "Enriched", align: "center" },
                  { label: "CRM Sync", align: "left" },
                ].map((h) => (
                  <th key={h.label} className={`px-3 py-2.5 text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-${h.align} whitespace-nowrap`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((lead, i) => (
                <tr key={lead.id} onClick={() => setSelectedLead(lead)}
                  className={`hover:bg-surface-page transition-colors duration-150 cursor-pointer border-b border-border-subtle last:border-b-0 ${
                    selectedIds.has(lead.id) ? "bg-[#FAFAFA]" : i % 2 === 0 ? "bg-white" : "bg-surface-page/40"
                  }`}>
                  <td className="px-3 py-2.5 w-8" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleOne(lead.id)}
                      className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent/20 cursor-pointer" />
                  </td>
                  <td className="px-3 py-2.5 text-[13px] text-text-primary font-medium whitespace-nowrap">{lead.name}</td>
                  <td className="px-3 py-2.5 text-[12px] text-text-secondary tabular-nums whitespace-nowrap">{lead.phone}</td>
                  <td className="px-3 py-2.5 text-[12px] text-text-secondary whitespace-nowrap">
                    {format(new Date(lead.createdAt), "dd MMM, HH:mm")}
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <InlineDropdownBadge value={lead.leadStatus} config={leadStatusConfig} options={statusOpts}
                      onChange={(v) => updateLead(lead.id, { leadStatus: v })} />
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <InlineDropdownBadge value={lead.leadStage} config={leadStageConfig} options={stageOpts}
                      onChange={(v) => updateLead(lead.id, { leadStage: v })} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge ${tempConfig[lead.temperature].cls}`}>
                      {tempConfig[lead.temperature].label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge ${
                      lead.aiQualification === "qualified" ? "bg-[#F0FDF4] text-[#15803D]" :
                      lead.aiQualification === "not_qualified" ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#FEF3C7] text-[#92400E]"
                    }`}>
                      {lead.aiQualification === "qualified" ? "Qualified" : lead.aiQualification === "not_qualified" ? "Not Qual." : "Pending"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <EnrichmentIcon status={lead.enrichmentStatus} />
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <CRMSyncCell status={lead.crmSync.status} failReason={lead.crmSync.failReason} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <span className="text-[12px] text-text-tertiary">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} leads
          </span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-button text-text-secondary hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150">
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-button text-text-secondary hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150">
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />}

      {/* Bulk Action Bar */}
      {mounted && selectedIds.size > 0 && createPortal(
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-accent text-white px-5 py-3 rounded-[10px] shadow-lg flex items-center gap-4"
        >
          <span className="text-[13px] font-medium tabular-nums">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-white/20" />
          {["Push to CRM", "Change Stage", "Change Status", "Export"].map((action) => (
            <button key={action} className="text-[12px] font-medium text-white/90 hover:text-white transition-colors duration-150">
              {action}
            </button>
          ))}
          <button onClick={() => setSelectedIds(new Set())} className="ml-2 p-1 hover:bg-white/10 rounded transition-colors duration-150">
            <X size={14} strokeWidth={2} />
          </button>
        </motion.div>,
        document.body
      )}
    </>
  );
}
