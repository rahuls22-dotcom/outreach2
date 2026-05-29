"use client";

// Demo placeholder for the second data product. Mirrors the structure of the
// enrichment surface (top KPI + recent activity) so the eventual real screen
// has somewhere obvious to slot into.

import { ArrowRight, ContactRound, Globe, ListTree, Mail, Phone, ShieldCheck, Sparkles } from "lucide-react";

export function ContactExtraction({ onBack }: { onBack?: () => void }) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="bg-white border border-border rounded-card overflow-hidden">
        <div className="relative px-6 sm:px-10 pt-9 pb-7 bg-gradient-to-br from-[#ECFDF5] via-white to-white border-b border-border-subtle overflow-hidden">
          <div className="absolute top-6 right-6 hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-white border border-border-subtle">
            <ContactRound size={22} strokeWidth={1.5} className="text-[#065F46]" />
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] rounded-badge px-2 py-1 mb-3">
            <Sparkles size={11} strokeWidth={2} />
            Demo · coming soon
          </div>
          <h2 className="text-[22px] sm:text-[26px] font-semibold text-text-primary tracking-tight max-w-[640px]">
            Pull verified contacts from anywhere into your CRM
          </h2>
          <p className="text-[13.5px] text-text-secondary mt-2 max-w-[640px] leading-relaxed">
            Point us at a website, directory, or uploaded list. We crawl, dedupe, verify
            emails and phones, then push clean rows back to the same CRM you use for enrichment.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <button
              disabled
              className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-white bg-text-primary rounded-button opacity-60 cursor-not-allowed"
              title="Real flow ships in a future release"
            >
              Start extraction
              <ArrowRight size={13} strokeWidth={2} />
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-text-secondary hover:text-text-primary border border-border rounded-button bg-white transition-colors"
              >
                Back to dashboard
              </button>
            )}
          </div>
        </div>

        {/* Capabilities */}
        <div className="px-6 sm:px-10 py-7 border-b border-border-subtle">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary mb-3">
            What we pull
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Capability icon={<Mail size={14} strokeWidth={1.75} />}        title="Emails"        body="Verified, role-aware, deliverable." />
            <Capability icon={<Phone size={14} strokeWidth={1.75} />}       title="Phones"        body="Mobile + landline with HLR check." />
            <Capability icon={<Globe size={14} strokeWidth={1.75} />}       title="Domains"       body="Company URL, socials, country." />
            <Capability icon={<ShieldCheck size={14} strokeWidth={1.75} />} title="Verified rows" body="DNC-aware, bounce-tested." />
          </div>
        </div>

        {/* Sources */}
        <div className="px-6 sm:px-10 py-7">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary mb-3">
            Sources
          </div>
          <div className="flex flex-wrap gap-2">
            {["Company website", "Apollo", "LinkedIn Sales Nav", "ZoomInfo", "Crunchbase", "Custom upload", "Public directories"].map(
              (p) => (
                <span
                  key={p}
                  className="inline-flex items-center text-[12px] font-medium text-text-secondary bg-white border border-border rounded-button px-2.5 py-1"
                >
                  <ListTree size={11} strokeWidth={1.75} className="mr-1.5 text-text-tertiary" />
                  {p}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Recent activity demo strip */}
      <section className="bg-white border border-border rounded-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-subtle">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.4px] text-text-tertiary">Recent extractions</div>
          <div className="text-[13px] font-semibold text-text-primary mt-0.5">Demo data, wired to real crawler in next release</div>
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
