"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  CheckCircle2,
  Phone as PhoneIcon,
  FileText,
  MessageSquare,
  Database,
  StickyNote,
  Tag,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import {
  contacts,
  sourceFilterOptions,
} from "@/lib/contacts-data";
import type { Contact, ContactSource, ActivityItem } from "@/lib/contacts-data";
import { EmptyState } from "@/components/layout/empty-state";
import { IllustrationContacts, IllustrationSearchEmpty } from "@/components/illustrations/empty-states";
import { useDemoMode } from "@/lib/demo-mode";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

function SourceBadge({ source }: { source: ContactSource }) {
  const config = {
    form_submission: { label: "Form", cls: "bg-[#EFF6FF] text-[#1D4ED8]" },
    csv_import: { label: "CSV", cls: "bg-[#FDF4FF] text-[#7C3AED]" },
    crm_sync: { label: "CRM", cls: "bg-[#FEF3C7] text-[#92400E]" },
  };
  const { label, cls } = config[source];
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge ${cls}`}>
      {label}
    </span>
  );
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const config = {
    form_submission: { icon: FileText, cls: "text-[#1D4ED8] bg-[#EFF6FF]" },
    call: { icon: PhoneIcon, cls: "text-[#15803D] bg-[#F0FDF4]" },
    qualification: { icon: CheckCircle2, cls: "text-[#92400E] bg-[#FEF3C7]" },
    crm_sync: { icon: Database, cls: "text-[#7C3AED] bg-[#FDF4FF]" },
    note: { icon: StickyNote, cls: "text-text-secondary bg-surface-secondary" },
  };
  const { icon: Icon, cls } = config[type];
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
      <Icon size={13} strokeWidth={1.5} />
    </div>
  );
}

// ── Import Modal ────────────────────────────────────────────
function ImportModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/20 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
        <div className="bg-white rounded-card border border-border shadow-lg w-full max-w-[520px]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text-primary">Import Contacts</h2>
            <button onClick={onClose} className="p-1.5 rounded-button text-text-secondary hover:bg-surface-secondary transition-colors duration-150">
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
          <div className="p-6 space-y-5">
            {/* Drop zone */}
            <div className="border-2 border-dashed border-border rounded-card p-8 text-center hover:border-accent/40 transition-colors duration-150 cursor-pointer">
              <Upload size={28} strokeWidth={1} className="mx-auto text-text-tertiary mb-3" />
              <p className="text-[13px] text-text-primary font-medium">Drop your CSV file here</p>
              <p className="text-[12px] text-text-tertiary mt-1">or click to browse • CSV, XLS, XLSX</p>
            </div>

            {/* Mock preview */}
            <div className="bg-surface-page rounded-[6px] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium text-text-primary">contacts_march.csv</span>
                <span className="text-[12px] text-status-success font-medium">487 contacts detected</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {["Column A → Name", "Column B → Phone", "Column C → Email"].map((h) => (
                      <th key={h} className="py-1.5 text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[12px] text-text-secondary">
                  <tr className="border-b border-border-subtle"><td className="py-1.5">Amit Shah</td><td>98765 43210</td><td>amit@gmail.com</td></tr>
                  <tr className="border-b border-border-subtle"><td className="py-1.5">Priya Patel</td><td>90123 45678</td><td>priya@yahoo.com</td></tr>
                  <tr><td className="py-1.5">Rahul Das</td><td>87654 32109</td><td>rahul@outlook.com</td></tr>
                </tbody>
              </table>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge bg-[#FEF3C7] text-[#92400E]">12 duplicates found</span>
                <span className="text-[11px] text-text-tertiary">Will be skipped automatically</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button onClick={onClose} className="h-9 px-4 text-[13px] font-medium text-text-secondary border border-border rounded-button bg-white hover:bg-surface-page transition-colors duration-150">
              Cancel
            </button>
            <button className="h-9 px-4 bg-accent text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150">
              Import 475 Contacts
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Contact Detail Panel ────────────────────────────────────
function ContactPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/20 z-[60]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[620px] bg-white z-[70] shadow-lg overflow-y-auto border-l border-border">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">{contact.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <SourceBadge source={contact.source} />
              <span className="text-[11px] text-text-tertiary">
                {contact.enquiriesCount} enquir{contact.enquiriesCount === 1 ? "y" : "ies"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-button text-text-secondary hover:bg-surface-secondary transition-colors duration-150">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Phone", value: contact.phone },
                { label: "Email", value: contact.email },
                { label: "First Seen", value: format(new Date(contact.firstSeen), "dd MMM yyyy") },
                { label: "Last Activity", value: format(new Date(contact.lastActivity), "dd MMM yyyy") },
              ].map((item) => (
                <div key={item.label} className="bg-surface-page rounded-[6px] px-3 py-2">
                  <div className="text-[11px] text-text-tertiary">{item.label}</div>
                  <div className="text-[13px] text-text-primary font-medium mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.length > 0 ? contact.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-badge bg-surface-secondary text-text-secondary">
                  <Tag size={10} strokeWidth={1.5} />
                  {tag}
                </span>
              )) : (
                <span className="text-[12px] text-text-tertiary">No tags</span>
              )}
            </div>
          </div>

          {/* Enquiries */}
          <div>
            <h3 className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-3">
              Enquiries ({contact.enquiries.length})
            </h3>
            <div className="space-y-2">
              {contact.enquiries.map((eq) => (
                <div key={eq.id} className="flex items-center justify-between py-2.5 px-3 bg-surface-page rounded-[6px]">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-[13px] text-text-primary font-medium">{eq.campaign}</div>
                      <div className="text-[11px] text-text-tertiary mt-0.5">{format(new Date(eq.date), "dd MMM yyyy")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {eq.verified && (
                      <ShieldCheck size={13} strokeWidth={2} className="text-status-success" />
                    )}
                    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge ${
                      eq.status === "qualified" ? "bg-[#F0FDF4] text-[#15803D]" :
                      eq.status === "not_qualified" ? "bg-[#FEF2F2] text-[#DC2626]" :
                      "bg-[#FEF3C7] text-[#92400E]"
                    }`}>
                      {eq.status === "qualified" ? "Qualified" : eq.status === "not_qualified" ? "Not Qualified" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div>
            <h3 className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-3">Activity Timeline</h3>
            <div className="space-y-0">
              {contact.activities.map((activity, i) => (
                <div key={activity.id} className="flex gap-3 pb-4 relative">
                  {i < contact.activities.length - 1 && (
                    <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border-subtle" />
                  )}
                  <ActivityIcon type={activity.type} />
                  <div className="pt-0.5">
                    <div className="text-[12px] text-text-primary leading-relaxed">{activity.description}</div>
                    <div className="text-[11px] text-text-tertiary mt-0.5 flex items-center gap-1">
                      <Clock size={10} strokeWidth={1.5} />
                      {format(new Date(activity.date), "dd MMM yyyy, HH:mm")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px] mb-3">Notes</h3>
            <textarea
              defaultValue={contact.notes}
              placeholder="Add notes about this contact..."
              rows={3}
              className="w-full px-3 py-2.5 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Main Page ───────────────────────────────────────────────
const PAGE_SIZE = 15;

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239B9B9B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 10px center",
};

export default function ContactsPage() {
  const { isEmpty } = useDemoMode();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | ContactSource>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    if (isEmpty) return [];
    return contacts.filter((c) => {
      if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
      if (
        search &&
        !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.phone.includes(search) &&
        !c.email.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [search, sourceFilter, isEmpty]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-meta text-text-secondary mb-1">CRM</div>
          <h1 className="text-page-title text-text-primary">Contacts</h1>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-accent text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150"
        >
          <Upload size={15} strokeWidth={2} />
          Import Contacts
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Total contacts" value={contacts.length} />
        <MetricCard label="Verified" value={contacts.filter((c) => c.enquiries.some((e) => e.verified)).length}
          subMetric={`${Math.round((contacts.filter((c) => c.enquiries.some((e) => e.verified)).length / contacts.length) * 100)}% verified`} />
        <MetricCard label="Multi-enquiry" value={contacts.filter((c) => c.enquiriesCount > 1).length}
          subMetric="Contacts with 2+ enquiries" />
        <MetricCard label="Sources" value={new Set(contacts.map((c) => c.source)).size} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value as "all" | ContactSource); setPage(1); }}
          className="h-8 px-3 pr-7 text-[12px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 appearance-none cursor-pointer"
          style={selectStyle}
        >
          {sourceFilterOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="relative flex-1 max-w-[260px]">
          <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-8 pl-8 pr-3 text-[12px] border border-border rounded-input bg-white focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {[
                  { label: "Name", align: "left" },
                  { label: "Phone", align: "left" },
                  { label: "Email", align: "left" },
                  { label: "Enquiries", align: "center" },
                  { label: "First Seen", align: "left" },
                  { label: "Last Activity", align: "left" },
                  { label: "Source", align: "left" },
                  { label: "Tags", align: "left" },
                ].map((h) => (
                  <th key={h.label} className={`px-3 py-2.5 text-[10px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-${h.align} whitespace-nowrap`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    {search || sourceFilter !== "all" ? (
                      <EmptyState
                        illustration={<IllustrationSearchEmpty />}
                        title="No contacts found"
                        description="Try a different name, phone number, or email."
                        action={
                          <button onClick={() => { setSearch(""); setSourceFilter("all"); }}
                            className="h-9 px-4 text-[13px] font-medium text-text-secondary border border-border rounded-button bg-white hover:bg-surface-page transition-colors duration-150">
                            Clear search
                          </button>
                        }
                        compact
                      />
                    ) : (
                      <EmptyState
                        illustration={<IllustrationContacts />}
                        title="No contacts yet"
                        description="Import contacts from a CSV or let them flow in from your campaigns."
                        action={
                          <button onClick={() => setShowImport(true)}
                            className="h-9 px-4 bg-accent text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150">
                            Import Contacts
                          </button>
                        }
                      />
                    )}
                  </td>
                </tr>
              ) : paginated.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`hover:bg-surface-page transition-colors duration-150 cursor-pointer border-b border-border-subtle last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-surface-page/40"}`}
                >
                  <td className="px-3 py-2.5 text-[13px] text-text-primary font-medium whitespace-nowrap">{c.name}</td>
                  <td className="px-3 py-2.5 text-[12px] text-text-secondary tabular-nums whitespace-nowrap">{c.phone}</td>
                  <td className="px-3 py-2.5 text-[12px] text-text-secondary whitespace-nowrap max-w-[180px] truncate">{c.email}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[13px] font-medium tabular-nums ${c.enquiriesCount > 1 ? "text-[#1D4ED8]" : "text-text-primary"}`}>
                      {c.enquiriesCount}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-text-secondary whitespace-nowrap">
                    {format(new Date(c.firstSeen), "dd MMM yyyy")}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-text-secondary whitespace-nowrap">
                    {format(new Date(c.lastActivity), "dd MMM yyyy")}
                  </td>
                  <td className="px-3 py-2.5"><SourceBadge source={c.source} /></td>
                  <td className="px-3 py-2.5 max-w-[180px]">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-badge bg-surface-secondary text-text-secondary">
                          {tag}
                        </span>
                      ))}
                      {c.tags.length > 2 && (
                        <span className="text-[10px] text-text-tertiary">+{c.tags.length - 2}</span>
                      )}
                      {c.tags.length === 0 && <span className="text-[10px] text-text-tertiary">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <span className="text-[12px] text-text-tertiary">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} contacts
          </span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-button text-text-secondary hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150">
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-button text-text-secondary hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150">
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {selected && <ContactPanel contact={selected} onClose={() => setSelected(null)} />}
    </motion.div>
  );
}
