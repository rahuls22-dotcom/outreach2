"use client";

// Base/landing view for the Contact extraction module. Demo placeholder — the
// real product hasn't shipped yet, but this matches the Enrichment dashboard
// shape (KPI strip + volume strip) so the layout reads as a real module.

import { ContactRound, Globe, Mail, ShieldCheck } from "lucide-react";

export function ContactExtractionDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-section-header text-text-primary">Extraction overview</h2>
          <span className="inline-flex items-center text-[10.5px] font-medium uppercase tracking-[0.4px] text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] rounded-badge px-2 py-0.5">
            Demo data
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile label="Sources crawled" value="47"    sub="Last 14 days" />
          <Tile label="Contacts found"  value="2,184" sub="Across all sources" />
          <Tile label="Verified emails" value="1,803" sub="83% verification rate" />
          <Tile label="Pushed to CRM"   value="1,612" sub="Net new rows" />
        </div>
      </div>

      {/* What we pull */}
      <section className="bg-white border border-border rounded-card p-5">
        <h3 className="text-section-header text-text-primary mb-3">What we pull</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Capability icon={<Mail size={14} strokeWidth={1.75} />}        title="Emails"        body="Verified, role-aware, deliverable." />
          <Capability icon={<ContactRound size={14} strokeWidth={1.75} />} title="Phones"        body="Mobile + landline with HLR check." />
          <Capability icon={<Globe size={14} strokeWidth={1.75} />}       title="Domains"       body="Company URL, socials, country." />
          <Capability icon={<ShieldCheck size={14} strokeWidth={1.75} />} title="Verified rows" body="DNC-aware, bounce-tested." />
        </div>
      </section>

      {/* Recent extractions */}
      <section className="bg-white border border-border rounded-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-subtle">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">Recent extractions</div>
          <div className="text-[13px] font-semibold text-text-primary mt-0.5">Across all sources</div>
        </div>
        <ul className="divide-y divide-border-subtle">
          <Row title="sobha.com" found={48} verified={38} when="4 hr ago" />
          <Row title="prestige-group-listings.csv" found={612} verified={524} when="yesterday" />
          <Row title="brigade-orchards.in" found={31} verified={29} when="2 days ago" />
          <Row title="apartment-listings-bangalore" found={1493} verified={1212} when="last week" />
        </ul>
      </section>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-border rounded-card p-4">
      <div className="text-[11.5px] text-text-secondary font-medium uppercase tracking-wide">{label}</div>
      <div className="text-[24px] font-semibold text-text-primary tabular-nums mt-2">{value}</div>
      <div className="text-[11.5px] text-text-secondary mt-1">{sub}</div>
    </div>
  );
}

function Capability({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="border border-border-subtle rounded-card p-3.5 bg-white">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-button bg-[#ECFDF5] text-[#065F46]">
          {icon}
        </span>
        <div className="text-[13px] font-semibold text-text-primary">{title}</div>
      </div>
      <p className="text-[12px] text-text-secondary leading-snug">{body}</p>
    </div>
  );
}

function Row({ title, found, verified, when }: { title: string; found: number; verified: number; when: string }) {
  return (
    <li className="px-5 py-3 flex items-center gap-3">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-button bg-surface-secondary border border-border-subtle">
        <Globe size={13} strokeWidth={1.75} className="text-text-secondary" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-text-primary truncate">{title}</div>
        <div className="text-[11.5px] text-text-secondary truncate">
          <span className="tabular-nums">{found.toLocaleString()}</span> contacts found ·{" "}
          <span className="tabular-nums">{verified.toLocaleString()}</span> verified · {when}
        </div>
      </div>
    </li>
  );
}
