"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { CheckCircle2, Loader2, Unplug, Plus, Check } from "lucide-react";
import { adAccounts } from "@/lib/integrations-data";
import type { AdAccount } from "@/lib/integrations-data";
import { crmConnections } from "@/lib/crm-integration-data";
import { CrmConnectionCard } from "@/components/integrations/crm-connection-card";
import { CrmConnectWizard } from "@/components/integrations/crm-connect-wizard";
import WhatsAppConnectPage from "@/app/(app)/channels/whatsapp/page";
import { useWA } from "@/lib/whatsapp-context";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

// ── Toggle ──────────────────────────────────────────────────
function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-9 h-5 rounded-full transition-colors duration-150 shrink-0 ${
        enabled ? "bg-accent" : "bg-silver-light"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150 ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Ad Account Card ─────────────────────────────────────────
function AdAccountCard({ account }: { account: AdAccount }) {
  const [connected, setConnected] = useState(account.connected);
  const [connecting, setConnecting] = useState(false);

  const platformColors = {
    meta: "bg-[#EFF6FF] text-[#1D4ED8]",
    google: "bg-[#FEF3C7] text-[#92400E]",
    linkedin: "bg-[#EFF6FF] text-[#1E40AF]",
  };

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
    }, 1500);
  };

  return (
    <div className="bg-white border border-border rounded-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center text-[11px] font-bold ${platformColors[account.platform]}`}>
            {account.label[0]}
          </div>
          <div>
            <div className="text-[14px] font-semibold text-text-primary">{account.name}</div>
            {connected && account.accountName && (
              <div className="text-[12px] text-text-secondary">{account.accountName}</div>
            )}
          </div>
        </div>
        {connected && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-badge bg-[#F0FDF4] text-[#15803D]">
            <CheckCircle2 size={11} strokeWidth={2} />
            Connected
          </span>
        )}
      </div>

      {connected ? (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-text-secondary">
            {account.activeCampaigns} active campaigns · {account.monthlySpend}
          </span>
          <button
            onClick={() => setConnected(false)}
            className="text-[12px] text-text-tertiary hover:text-status-error transition-colors duration-150 flex items-center gap-1"
          >
            <Unplug size={11} strokeWidth={1.5} />
            Disconnect
          </button>
        </div>
      ) : (
        <>
          <p className="text-[12px] text-text-secondary mb-3">{account.description}</p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-1.5 h-8 px-4 bg-accent text-white text-[12px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-70"
          >
            {connecting ? (
              <>
                <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </button>
        </>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
type Tab = "ad-accounts" | "crm" | "whatsapp" | "notifications";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ad-accounts");
  const [wizardOpen, setWizardOpen] = useState(false);
  // Sync state with the WhatsApp context so the tab can warn the user
  // when no connection exists yet. Notifications tab may grow similar
  // indicators (Slack/email) later — keep the variable name specific.
  const { isConnected: waConnected } = useWA();

  // Notification state
  const [slackUrl, setSlackUrl] = useState("");
  const [waGroupId, setWaGroupId] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [notifEmail, setNotifEmail] = useState("demo@godrejproperties.com");
  const [notifTriggers, setNotifTriggers] = useState({
    syncFailures: true,
    dailySummary: true,
    weeklyReport: false,
    budgetAlerts: true,
    voiceAlerts: false,
  });
  const [saved, setSaved] = useState(false);

  const tabs: { key: Tab; label: string }[] = [
    { key: "ad-accounts", label: "Ad Accounts" },
    { key: "crm", label: "CRM" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "notifications", label: "Notifications" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="text-meta text-text-secondary mb-1">Tools</div>
        <h1 className="text-page-title text-text-primary">Integrations</h1>
        <p className="text-meta text-text-secondary mt-1">
          Connect your ad platforms, CRM, and notification channels.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex items-center gap-0 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
              activeTab === tab.key
                ? "text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {tab.label}
              {/* Status dot — red when WhatsApp isn't connected yet, so
                  the user notices the setup is pending without having
                  to click into the tab. Easy to extend to other tabs
                  by adding more conditions. */}
              {tab.key === "whatsapp" && !waConnected && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"
                  title="WhatsApp not connected yet"
                  aria-label="Not connected"
                />
              )}
            </span>
            {activeTab === tab.key && (
              <motion.div
                layoutId="integrations-tab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"
                transition={{ duration: 0.15 }}
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* ── AD ACCOUNTS TAB ─────────────────────────────────── */}
      {activeTab === "ad-accounts" && (
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4">
          {adAccounts.map((a) => (
            <AdAccountCard key={a.id} account={a} />
          ))}
        </motion.div>
      )}

      {/* ── CRM TAB (Model A: global connection list) ───────── */}
      {activeTab === "crm" && (
        <motion.div variants={fadeUp} className="space-y-4 max-w-[860px]">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[12.5px] text-text-secondary leading-relaxed max-w-[520px]">
              Each connection is one CRM handshake, tagged with the products it serves.
              Per-product behavior (stage gating, field writeback) lives in{" "}
              <span className="text-text-primary font-medium">Settings</span>.
            </p>
            <button
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-accent text-white text-[12.5px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 shrink-0"
            >
              <Plus size={14} strokeWidth={2} />
              Add connection
            </button>
          </div>

          <div className="space-y-2.5">
            {crmConnections.map((conn) => (
              <CrmConnectionCard key={conn.id} conn={conn} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── WHATSAPP TAB ─────────────────────────────────────── */}
      {activeTab === "whatsapp" && (
        <motion.div variants={fadeUp}>
          <WhatsAppConnectPage />
        </motion.div>
      )}

      {/* ── NOTIFICATIONS TAB ───────────────────────────────── */}
      {activeTab === "notifications" && (
        <motion.div variants={fadeUp} className="space-y-5 max-w-[680px]">
          {/* Slack */}
          <div className="bg-white border border-border rounded-card p-5">
            <h3 className="text-card-title text-text-primary mb-3">Slack</h3>
            <label className="block text-[12px] text-text-secondary mb-1">Webhook URL</label>
            <input
              type="text"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full h-9 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary"
            />
          </div>

          {/* WhatsApp */}
          <div className="bg-white border border-border rounded-card p-5">
            <h3 className="text-card-title text-text-primary mb-3">WhatsApp</h3>
            <label className="block text-[12px] text-text-secondary mb-1">Group ID</label>
            <input
              type="text"
              value={waGroupId}
              onChange={(e) => setWaGroupId(e.target.value)}
              placeholder="120363..."
              className="w-full h-9 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150 placeholder:text-text-tertiary"
            />
          </div>

          {/* Email */}
          <div className="bg-white border border-border rounded-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-card-title text-text-primary">Email Notifications</h3>
              <Toggle enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
            </div>
            {emailNotif && (
              <input
                type="email"
                value={notifEmail}
                onChange={(e) => setNotifEmail(e.target.value)}
                className="w-full h-9 px-3 text-[13px] border border-border rounded-input bg-white text-text-primary focus:outline-none focus:border-accent transition-colors duration-150"
              />
            )}
          </div>

          {/* Triggers */}
          <div className="bg-white border border-border rounded-card p-5">
            <h3 className="text-card-title text-text-primary mb-3">Notification Triggers</h3>
            <div className="space-y-2.5">
              {[
                { key: "syncFailures" as const, label: "CRM sync failures" },
                { key: "dailySummary" as const, label: "Daily lead summary" },
                { key: "weeklyReport" as const, label: "Weekly performance report" },
                { key: "budgetAlerts" as const, label: "Campaign budget alerts" },
                { key: "voiceAlerts" as const, label: "Voice agent performance alerts" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifTriggers[key]}
                    onChange={() =>
                      setNotifTriggers((p) => ({ ...p, [key]: !p[key] }))
                    }
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20 cursor-pointer"
                  />
                  <span className="text-[13px] text-text-primary">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="pt-2 pb-8">
            <button
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 h-10 px-6 bg-accent text-white text-[13px] font-medium rounded-button hover:bg-accent-hover transition-colors duration-150"
            >
              {saved ? (
                <>
                  <Check size={15} strokeWidth={2} />
                  Saved!
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </motion.div>
      )}

      {wizardOpen && <CrmConnectWizard onClose={() => setWizardOpen(false)} />}
    </motion.div>
  );
}
