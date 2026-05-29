"use client";

import { useState } from "react";
import {
  Settings,
  Phone,
  Database,
  Bell,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { settingsData, connectedAdsets, responseFormatFields, campaignDetail } from "@/lib/campaign-data";

type SettingsSubTab = "channel" | "sequence" | "crm" | "notifications";

function Toggle({ enabled, label }: { enabled: boolean; label: string }) {
  const [on, setOn] = useState(enabled);
  return (
    <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
      <span className="text-[13px] text-text-primary">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${
          on ? "bg-accent" : "bg-silver-light"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-150 ${
            on ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>("channel");

  const subTabs: { key: SettingsSubTab; label: string; icon: typeof Settings }[] = [
    { key: "channel", label: "Channel Configuration", icon: Settings },
    { key: "sequence", label: "Sequence Settings", icon: Phone },
    { key: "crm", label: "CRM", icon: Database },
    { key: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="flex gap-5">
      {/* Sub-tab Navigation */}
      <div className="w-[200px] shrink-0">
        <div className="space-y-0.5">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-[6px] transition-colors duration-150 ${
                  activeSubTab === tab.key
                    ? "bg-surface-secondary text-text-primary font-medium"
                    : "text-text-secondary hover:bg-surface-page hover:text-text-primary"
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeSubTab === "channel" && <ChannelConfig />}
        {activeSubTab === "sequence" && <SequenceSettings />}
        {activeSubTab === "crm" && <CRMSettings />}
        {activeSubTab === "notifications" && <NotificationSettings />}
      </div>
    </div>
  );
}

function ChannelConfig() {
  return (
    <div className="space-y-5">
      {/* Platform Info */}
      <div className="bg-white border border-border rounded-card p-5">
        <h3 className="text-card-title text-text-primary mb-4">Platform Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Platform", value: settingsData.channelConfig.platform },
            { label: "Page ID", value: settingsData.channelConfig.pageId },
            { label: "Campaign ID", value: settingsData.channelConfig.campaignId },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.4px] mb-1">
                {item.label}
              </div>
              <div className="text-[13px] text-text-primary font-medium tabular-nums">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Adsets */}
      <div className="bg-white border border-border rounded-card p-5">
        <h3 className="text-card-title text-text-primary mb-4">Connected Ad Sets</h3>
        <div className="space-y-2">
          {connectedAdsets.map((adset) => (
            <div
              key={adset.id}
              className="flex items-center justify-between py-2.5 px-3 bg-surface-page rounded-[6px]"
            >
              <div>
                <div className="text-[13px] text-text-primary font-medium">{adset.name}</div>
                <div className="text-[11px] text-text-tertiary tabular-nums mt-0.5">
                  ID: {adset.adsetId}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-badge ${
                    adset.status === "active"
                      ? "bg-[#F0FDF4] text-[#15803D]"
                      : "bg-surface-secondary text-text-secondary"
                  }`}
                >
                  {adset.status === "active" ? "Active" : "Paused"}
                </span>
                <button className="text-[12px] text-text-secondary hover:text-text-primary transition-colors duration-150 flex items-center gap-1">
                  <Pencil size={11} strokeWidth={1.5} />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SequenceSettings() {
  return (
    <div className="bg-white border border-border rounded-card p-5">
      <h3 className="text-card-title text-text-primary mb-4">AI Calling Configuration</h3>
      <div className="space-y-0">
        <Toggle enabled={settingsData.sequenceSettings.aiCallingEnabled} label="AI Calling Enabled" />
        <div className="flex items-center justify-between py-3 border-b border-border-subtle">
          <span className="text-[13px] text-text-primary">Max Attempts</span>
          <span className="text-[13px] text-text-secondary tabular-nums">
            {settingsData.sequenceSettings.maxAttempts}
          </span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-[13px] text-text-primary">Call Interval</span>
          <span className="text-[13px] text-text-secondary">
            {settingsData.sequenceSettings.callInterval}
          </span>
        </div>
      </div>
    </div>
  );
}

function CRMSettings() {
  return (
    <div className="space-y-5">
      {/* Toggles */}
      <div className="bg-white border border-border rounded-card p-5">
        <h3 className="text-card-title text-text-primary mb-4">CRM Integration</h3>
        <Toggle enabled={settingsData.crmSettings.sendQLeadToCRM} label="Send Qualified Leads to CRM" />
        <Toggle enabled={settingsData.crmSettings.sendIQLeadToCRM} label="Send Inquiry Leads to CRM" />
      </div>

      {/* Auto Send Config */}
      <div className="bg-white border border-border rounded-card p-5">
        <h3 className="text-card-title text-text-primary mb-3">Auto Send Configuration</h3>
        <div className="bg-surface-page rounded-[6px] p-3">
          <pre className="text-[12px] text-text-secondary font-mono leading-relaxed">
            {JSON.stringify(settingsData.crmSettings.autoSendConfig, null, 2)}
          </pre>
        </div>
      </div>

      {/* Response Format Fields */}
      <div className="bg-white border border-border rounded-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-card-title text-text-primary">Response Format Fields</h3>
          <button className="inline-flex items-center gap-1 text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150">
            <Plus size={13} strokeWidth={1.5} />
            Add field
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {["Field ID", "System Key", "Default Value", ""].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-[0.5px] text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responseFormatFields.map((field) => (
              <tr key={field.id} className="border-b border-border-subtle last:border-0">
                <td className="px-3 py-2 text-[12px] text-text-primary font-mono">
                  {field.fieldId}
                </td>
                <td className="px-3 py-2 text-[12px] text-text-secondary font-mono">
                  {field.systemKey}
                </td>
                <td className="px-3 py-2 text-[12px] text-text-tertiary">
                  {field.defaultValue || "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button className="text-text-tertiary hover:text-text-primary transition-colors duration-150">
                      <Pencil size={12} strokeWidth={1.5} />
                    </button>
                    <button className="text-text-tertiary hover:text-status-error transition-colors duration-150">
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="bg-white border border-border rounded-card p-5">
      <h3 className="text-card-title text-text-primary mb-4">Notification Preferences</h3>
      <Toggle enabled={settingsData.notifications.emailOnNewLead} label="Email on new lead" />
      <Toggle
        enabled={settingsData.notifications.emailOnQualification}
        label="Email on qualification"
      />
      <Toggle enabled={settingsData.notifications.slackIntegration} label="Slack integration" />
      <Toggle enabled={settingsData.notifications.dailyDigest} label="Daily digest email" />
    </div>
  );
}
